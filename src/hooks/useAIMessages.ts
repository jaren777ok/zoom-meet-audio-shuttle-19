import { useState, useEffect, useCallback } from 'react';
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

  // Fetch existing messages for the user
  const fetchMessages = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as AIMessage[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI messages:', err);
      setError('Error al cargar mensajes');
    }
  }, [user, enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setIsConnected(false);
      return;
    }

    console.log('🔄 Setting up AI messages subscription for user:', user.id);

    // Initial fetch if enabled
    if (enabled) {
      fetchMessages();
    }

    const channel = supabase
      .channel(`ai_messages_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('📨 New AI message received:', payload.new);
          const newMessage = payload.new as AIMessage;
          setMessages(prev => {
            const updated = [...prev, newMessage];
            console.log('📝 Messages updated. Total count:', updated.length);
            return updated;
          });
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('🔗 Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Error de conexión en tiempo real');
        }
      });

    return () => {
      console.log('🔌 Cleaning up AI messages subscription');
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user, enabled]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const clearAllMessages = useCallback(async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('ai_messages')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      setMessages([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing AI messages:', err);
      setError('Error al limpiar mensajes');
    }
  }, [user]);

  const markAsRead = useCallback(() => {
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
  };
};