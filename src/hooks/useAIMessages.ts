import { useState, useEffect, useCallback, useRef } from 'react';
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

interface UseAIMessagesProps {
  enabled?: boolean;
}

export const useAIMessages = ({ enabled = true }: UseAIMessagesProps = {}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Stable fetch function - no circular dependencies
  const fetchMessages = useCallback(async (forceRefresh = false) => {
    if (!user || !enabled) {
      setMessages([]);
      return;
    }

    try {
      console.log('🔄 Fetching AI messages for user:', user.id, { forceRefresh, timestamp: new Date().toISOString() });
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching messages:', error);
        setError(error.message);
        return;
      }

      console.log('📨 Fetched messages:', data?.length, { forceRefresh, timestamp: new Date().toISOString() });
      
      // Type assertion to handle database response
      const typedMessages = (data || []) as AIMessage[];
      
      if (forceRefresh) {
        // For force refresh, replace all messages
        setMessages(typedMessages);
        console.log('🔄 Messages replaced via force refresh');
      } else {
        // For initial fetch or incremental updates
        setMessages(prev => {
          if (prev.length === 0) {
            console.log('📋 Initial messages load');
            return typedMessages;
          }
          
          // Smart merge - only add truly new messages
          const prevIds = new Set(prev.map(msg => msg.id));
          const newMessages = typedMessages.filter(msg => !prevIds.has(msg.id));
          
          if (newMessages.length > 0) {
            console.log('📬 Adding new messages via fetch:', newMessages.length);
            return [...prev, ...newMessages].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
          
          return prev;
        });
      }
      
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset on successful fetch
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user, enabled]);

  // Handle visibility change - critical for message sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && enabled) {
        console.log('👁️ Page visible again, re-syncing messages...', new Date().toISOString());
        fetchMessages(true); // Force refresh when coming back
      }
    };

    const handleFocus = () => {
      if (user && enabled) {
        console.log('🎯 Window focused, re-syncing messages...', new Date().toISOString());
        fetchMessages(true); // Force refresh on focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, enabled, fetchMessages]);

  // Polling fallback for when realtime fails
  useEffect(() => {
    if (!user || !enabled || isConnected) return;

    console.log('🔄 Setting up polling fallback...');
    const pollInterval = setInterval(() => {
      console.log('📡 Polling for new messages (fallback)');
      fetchMessages();
    }, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [user, enabled, isConnected, fetchMessages]);

  // Real-time subscription - improved logic
  useEffect(() => {
    if (!user || !enabled) {
      setIsConnected(false);
      setMessages([]);
      return;
    }

    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🧹 Cleaning up previous channel');
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

    console.log('🔄 Setting up AI messages subscription for user:', user.id, new Date().toISOString());
    
    // Simple, stable channel name
    const channelName = `ai_messages_${user.id}`;
    
    console.log('📡 Creating channel:', channelName);
    
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
          console.log('📥 INSERT event received:', payload, new Date().toISOString());
          const newMessage = payload.new as AIMessage;
          
          setMessages(prev => {
            // Prevent duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ Message already exists, skipping:', newMessage.id);
              return prev;
            }
            
            console.log('✅ Adding new message via realtime:', newMessage.id);
            setUnreadCount(prevCount => prevCount + 1);
            
            // Insert in correct position by timestamp
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
          console.log('📝 UPDATE event received:', payload, new Date().toISOString());
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
          console.log('🗑️ DELETE event received:', payload, new Date().toISOString());
          const deletedMessage = payload.old as AIMessage;
          setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status, 'for channel:', channelName, new Date().toISOString());
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          console.log('✅ Successfully connected to realtime');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error occurred');
          setIsConnected(false);
          setError('Connection failed');
          
          // Exponential backoff with jitter
          const attempt = reconnectAttemptsRef.current + 1;
          if (attempt <= maxReconnectAttempts) {
            reconnectAttemptsRef.current = attempt;
            const baseDelay = Math.min(1000 * Math.pow(2, attempt), 30000);
            const jitter = Math.random() * 1000;
            const delay = baseDelay + jitter;
            
            console.log(`🔄 Reconnection attempt ${attempt}/${maxReconnectAttempts}, retrying in ${Math.round(delay)}ms...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Attempting to reconnect...');
              fetchMessages(true); // Force refresh on reconnect
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached');
            setError('Connection failed - max attempts reached');
          }
        } else if (status === 'CLOSED') {
          console.log('📴 Connection closed');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up AI messages subscription');
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
  }, [user, enabled]); // Only depend on user and enabled

  // Clear messages function
  const clearMessages = useCallback(() => {
    console.log('🧹 Clearing local messages');
    setMessages([]);
    setUnreadCount(0);
  }, []);

  // Clear all messages from database
  const clearAllMessages = useCallback(async () => {
    if (!user) return;

    try {
      console.log('🗑️ Deleting all AI messages from database');
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing messages:', error);
        setError(error.message);
        return;
      }

      setMessages([]);
      setUnreadCount(0);
      console.log('✅ All messages cleared successfully');
    } catch (err) {
      console.error('Error clearing messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback(() => {
    console.log('👁️ Marking messages as read');
    setUnreadCount(0);
  }, []);

  // Manual refresh functions
  const refetch = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  const forceRefresh = useCallback(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  return {
    messages,
    isConnected,
    error,
    unreadCount,
    clearMessages,
    clearAllMessages,
    markAsRead,
    refetch,
    forceRefresh
  };
};