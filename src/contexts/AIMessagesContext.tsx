import React, { createContext, useContext, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIMessage {
  id: string;
  user_id: string;
  message: string;
  message_type: 'analysis' | 'insight' | 'suggestion' | 'summary' | 'response';
  confidence: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface AIMessagesContextType {
  messages: AIMessage[];
  isConnected: boolean;
  error: string | null;
  unreadCount: number;
  clearMessages: () => void;
  clearAllMessages: () => Promise<void>;
  markAsRead: () => void;
  forceRefresh: () => void;
}

const AIMessagesContext = createContext<AIMessagesContextType | undefined>(undefined);

export const useAIMessagesContext = (): AIMessagesContextType => {
  const context = useContext(AIMessagesContext);
  if (!context) {
    throw new Error('useAIMessagesContext must be used within an AIMessagesProvider');
  }
  return context;
};

interface AIMessagesProviderProps {
  children: React.ReactNode;
}

export const AIMessagesProvider: React.FC<AIMessagesProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Stable fetch function
  const fetchMessages = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setMessages([]);
      setIsConnected(false);
      return;
    }

    try {
      console.log('🌍 [Global] Fetching AI messages for user:', user.id, { forceRefresh, timestamp: new Date().toISOString() });
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ [Global] Error fetching messages:', error);
        setError(error.message);
        return;
      }

      console.log('📨 [Global] Fetched messages:', data?.length, { forceRefresh, timestamp: new Date().toISOString() });
      
      const typedMessages = (data || []) as AIMessage[];
      
      if (forceRefresh) {
        setMessages(typedMessages);
        console.log('🔄 [Global] Messages replaced via force refresh');
      } else {
        setMessages(prev => {
          if (prev.length === 0) {
            console.log('📋 [Global] Initial messages load');
            return typedMessages;
          }
          
          const prevIds = new Set(prev.map(msg => msg.id));
          const newMessages = typedMessages.filter(msg => !prevIds.has(msg.id));
          
          if (newMessages.length > 0) {
            console.log('📬 [Global] Adding new messages via fetch:', newMessages.length);
            return [...prev, ...newMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
          
          return prev;
        });
      }
      
      setError(null);
      reconnectAttemptsRef.current = 0;
    } catch (err) {
      console.error('❌ [Global] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user]);

  // Real-time subscription setup - always active when user is present
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setMessages([]);
      return;
    }

    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🧹 [Global] Cleaning up previous channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Initial fetch
    fetchMessages(true);

    console.log('🔄 [Global] Setting up AI messages subscription for user:', user.id, new Date().toISOString());
    
    const channelName = `global_ai_messages_${user.id}`;
    console.log('📡 [Global] Creating channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📥 [Global] INSERT event received:', payload, new Date().toISOString());
          const newMessage = payload.new as AIMessage;
          
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ [Global] Message already exists, skipping:', newMessage.id);
              return prev;
            }
            
            console.log('✅ [Global] Adding new message via realtime:', newMessage.id);
            setUnreadCount(prevCount => prevCount + 1);
            
            const newMessages = [...prev, newMessage];
            return newMessages.sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📝 [Global] UPDATE event received:', payload, new Date().toISOString());
          const updatedMessage = payload.new as AIMessage;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🗑️ [Global] DELETE event received:', payload, new Date().toISOString());
          const deletedMessage = payload.old as AIMessage;
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe((status, err) => {
        console.log('🔗 [Global] Subscription status:', status, 'for channel:', channelName, new Date().toISOString());
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          console.log('✅ [Global] Successfully connected to realtime');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ [Global] Channel error occurred:', status, err);
          setIsConnected(false);
          setError('Connection failed');
          
          const attempt = reconnectAttemptsRef.current + 1;
          if (attempt <= maxReconnectAttempts) {
            reconnectAttemptsRef.current = attempt;
            const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;
            
            console.log(`🔄 [Global] Reconnection attempt ${attempt}/${maxReconnectAttempts}, retrying in ${Math.round(delay)}ms...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [Global] Attempting to reconnect...');
              fetchMessages(true);
            }, delay);
          } else {
            console.error('❌ [Global] Max reconnection attempts reached');
            setError('Connection failed - max attempts reached');
          }
        } else if (status === 'CLOSED') {
          console.log('📴 [Global] Connection closed');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 [Global] Cleaning up AI messages subscription');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user, fetchMessages]);

  // Handle visibility change for sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ [Global] Page visible again, re-syncing messages...', new Date().toISOString());
        fetchMessages(true);
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🎯 [Global] Window focused, re-syncing messages...', new Date().toISOString());
        fetchMessages(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchMessages]);

  // Context methods
  const clearMessages = useCallback(() => {
    console.log('🧹 [Global] Clearing local messages');
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const clearAllMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🗑️ [Global] Deleting all AI messages from database');
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[Global] Error clearing messages:', error);
        setError(error.message);
        return;
      }

      setMessages([]);
      setUnreadCount(0);
      console.log('✅ [Global] All messages cleared successfully');
    } catch (err) {
      console.error('[Global] Error clearing messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user]);

  const markAsRead = useCallback(() => {
    console.log('👁️ [Global] Marking messages as read');
    setUnreadCount(0);
  }, []);

  const forceRefresh = useCallback(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  const contextValue: AIMessagesContextType = {
    messages,
    isConnected,
    error,
    unreadCount,
    clearMessages,
    clearAllMessages,
    markAsRead,
    forceRefresh
  };

  return (
    <AIMessagesContext.Provider value={contextValue}>
      {children}
    </AIMessagesContext.Provider>
  );
};