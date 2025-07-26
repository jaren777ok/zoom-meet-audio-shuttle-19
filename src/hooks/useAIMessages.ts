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

export const useAIMessages = ({ enabled = true }: UseAIMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<string | null>(null);

  // Fetch existing messages for the user with improved logic
  const fetchMessages = useCallback(async (forceRefresh = false) => {
    if (!user || !enabled) return;

    try {
      console.log('🔄 Fetching AI messages for user:', user.id, { forceRefresh });
      
      // Only fetch new messages if we have a timestamp reference and it's not a force refresh
      const query = supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      // If not force refresh and we have messages, only get newer ones
      if (!forceRefresh && lastFetchTimeRef.current && messages.length > 0) {
        query.gt('created_at', lastFetchTimeRef.current);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const newMessages = (data || []) as AIMessage[];
      console.log('📨 Fetched messages:', newMessages.length, { forceRefresh });

      if (forceRefresh || !lastFetchTimeRef.current) {
        // Complete refresh
        setMessages(newMessages);
        if (newMessages.length > 0) {
          lastFetchTimeRef.current = newMessages[newMessages.length - 1].created_at;
        }
      } else if (newMessages.length > 0) {
        // Append new messages and avoid duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
          const updated = [...prev, ...uniqueNewMessages].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          console.log('📝 Messages updated. Previous:', prev.length, 'New unique:', uniqueNewMessages.length, 'Total:', updated.length);
          return updated;
        });
        lastFetchTimeRef.current = newMessages[newMessages.length - 1].created_at;
      }
      
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching AI messages:', err);
      setError('Error al cargar mensajes');
    }
  }, [user, enabled, messages.length]);

  // Handle page visibility changes for re-sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && enabled) {
        console.log('👁️ Page visible again, re-syncing messages...');
        fetchMessages(true); // Force refresh when returning to tab
      }
    };

    const handleFocus = () => {
      if (user && enabled) {
        console.log('🎯 Window focused, re-syncing messages...');
        fetchMessages(true); // Force refresh when window gains focus
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, enabled, fetchMessages]);

  // Subscribe to real-time updates with improved connection handling
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setIsConnected(false);
      lastFetchTimeRef.current = null;
      return;
    }

    console.log('🔄 Setting up AI messages subscription for user:', user.id);

    // Cleanup previous channel if exists
    if (channelRef.current) {
      console.log('🧹 Cleaning up previous channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Initial fetch if enabled
    if (enabled) {
      fetchMessages(true); // Force refresh on initial setup
    }

    // Create unique channel name with timestamp to avoid conflicts
    const channelName = `ai_messages_${user.id}_${Date.now()}`;
    console.log('📡 Creating channel:', channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 New AI message received (INSERT):', payload.new);
          const newMessage = payload.new as AIMessage;
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) {
              console.log('⚠️ Duplicate message detected, skipping');
              return prev;
            }
            const updated = [...prev, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            console.log('📝 Messages updated. Total count:', updated.length);
            return updated;
          });
          setUnreadCount(prev => prev + 1);
          lastFetchTimeRef.current = newMessage.created_at;
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📝 AI message updated:', payload.new);
          const updatedMessage = payload.new as AIMessage;
          setMessages(prev => 
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🗑️ AI message deleted:', payload.old);
          const deletedMessage = payload.old as AIMessage;
          setMessages(prev => prev.filter(m => m.id !== deletedMessage.id));
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status, 'for channel:', channelName);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          console.log('✅ Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Error de conexión en tiempo real');
          console.error('❌ Channel error occurred');
          
          // Attempt to reconnect after delay
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            if (enabled && user) {
              fetchMessages(true);
            }
          }, 3000);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log('📴 Connection closed');
        }
      });

    channelRef.current = channel;

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
  }, [user, enabled]); // Remove fetchMessages from deps to avoid infinite loop

  const clearMessages = useCallback(() => {
    console.log('🧹 Clearing local messages');
    setMessages([]);
    setUnreadCount(0);
    lastFetchTimeRef.current = null;
  }, []);

  const clearAllMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('🗑️ Deleting all AI messages from database');
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setMessages([]);
      setUnreadCount(0);
      lastFetchTimeRef.current = null;
      console.log('✅ All messages cleared successfully');
    } catch (err) {
      console.error('❌ Error clearing AI messages:', err);
      setError('Error al limpiar mensajes');
    }
  }, [user]);

  const markAsRead = useCallback(() => {
    console.log('👁️ Marking messages as read');
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isConnected,
    error,
    unreadCount,
    clearMessages,
    clearAllMessages,
    markAsRead,
    refetch: fetchMessages,
    forceRefresh: () => fetchMessages(true),
  };
};