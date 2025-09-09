
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
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<number>(0);
  
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Stable fetch function - removed from useCallback to prevent circular dependency
  const fetchMessages = async (forceRefresh = false) => {
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
      
      // Update connection status based on successful fetch
      setLastSuccessfulFetch(Date.now());
      setIsConnected(true);
      
    } catch (err) {
      console.error('❌ [Global] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Only set disconnected if we haven't had a recent successful fetch
      const timeSinceLastFetch = Date.now() - lastSuccessfulFetch;
      if (timeSinceLastFetch > 15000) { // 15 seconds - more responsive for 10s polling
        setIsConnected(false);
      }
    }
  };

  // Real-time subscription setup with improved sync
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setMessages([]);
      setUnreadCount(0);
      return;
    }

    console.log('🚀 [Global] Starting AI messages system for user:', user.id, new Date().toISOString());

    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🧹 [Global] Cleaning up previous channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Clear any existing timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }

    // Initial fetch to sync state
    console.log('🔄 [Global] Initial fetch for synchronization');
    fetchMessages(true);

    // Setup 10-second polling for reliability
    console.log('⏰ [Global] Setting up 10-second polling interval');
    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('⏰ [Global] Polling for new messages (10s interval)');
      fetchMessages(false); // Non-disruptive fetch
    }, 10000);

    // Setup real-time subscription as primary sync method
    const channelName = `sync_ai_messages_${user.id}_${Date.now()}`;
    console.log('📡 [Global] Creating real-time channel:', channelName);
    
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
          console.log('📥 [REALTIME-INSERT] New message received:', payload.new?.id, new Date().toISOString());
          const newMessage = payload.new as AIMessage;
          
          if (!newMessage || !newMessage.id) {
            console.warn('⚠️ [REALTIME-INSERT] Invalid message received');
            return;
          }
          
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ [REALTIME-INSERT] Duplicate message, skipping:', newMessage.id);
              return prev;
            }
            
            console.log('✅ [REALTIME-INSERT] Adding new message:', newMessage.id, newMessage.message?.substring(0, 50) + '...');
            
            // Increment unread count
            setUnreadCount(prevCount => {
              const newCount = prevCount + 1;
              console.log('📊 [REALTIME-INSERT] Unread count updated:', newCount);
              return newCount;
            });
            
            // Add and sort messages by creation time
            const updatedMessages = [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            console.log('📊 [REALTIME-INSERT] Total messages now:', updatedMessages.length);
            return updatedMessages;
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
          console.log('📝 [REALTIME-UPDATE] Message updated:', payload.new?.id);
          const updatedMessage = payload.new as AIMessage;
          
          if (!updatedMessage?.id) return;
          
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
          console.log('🗑️ [REALTIME-DELETE] Message deleted:', payload.old?.id);
          const deletedMessage = payload.old as AIMessage;
          
          if (!deletedMessage?.id) return;
          
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe((status, err) => {
        console.log('🔗 [REALTIME-SUBSCRIPTION] Status changed:', status, 'Channel:', channelName);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ [REALTIME-SUBSCRIPTION] Successfully connected to real-time updates');
          setError(null);
          reconnectAttemptsRef.current = 0;
          setIsConnected(true);
          
          // Do a sync fetch after successful subscription
          setTimeout(() => {
            console.log('🔄 [REALTIME-SUBSCRIPTION] Post-connection sync fetch');
            fetchMessages(false);
          }, 1000);
          
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('❌ [REALTIME-SUBSCRIPTION] Connection error:', status, err);
          
          const timeSinceLastFetch = Date.now() - lastSuccessfulFetch;
          if (timeSinceLastFetch > 15000) {
            setIsConnected(false);
          }
          setError('Real-time connection failed');
          
          // Retry with exponential backoff
          const attempt = reconnectAttemptsRef.current + 1;
          if (attempt <= maxReconnectAttempts) {
            reconnectAttemptsRef.current = attempt;
            const delay = Math.min(1000 * Math.pow(2, attempt), 30000) + Math.random() * 1000;
            
            console.log(`🔄 [REALTIME-SUBSCRIPTION] Retry ${attempt}/${maxReconnectAttempts} in ${Math.round(delay)}ms`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 [REALTIME-SUBSCRIPTION] Reconnecting...');
              fetchMessages(true);
            }, delay);
          } else {
            console.error('❌ [REALTIME-SUBSCRIPTION] Max retry attempts reached');
            setError('Connection failed - please refresh');
          }
        } else if (status === 'CLOSED') {
          console.log('📴 [REALTIME-SUBSCRIPTION] Connection closed');
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
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user]); // Only depend on user, not fetchMessages

  // Handle visibility and focus changes for immediate sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👁️ [VISIBILITY] Page became visible, syncing messages...', new Date().toISOString());
        fetchMessages(true);
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🎯 [FOCUS] Window focused, syncing messages...', new Date().toISOString());  
        fetchMessages(true);
      }
    };

    const handleOnline = () => {
      if (user) {
        console.log('🌐 [ONLINE] Connection restored, syncing messages...', new Date().toISOString());
        fetchMessages(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [user]);

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
  }, []);

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
