import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIMessage {
  id: string;
  user_id: string;
  session_id: string;
  message: string;
  message_type: 'analysis' | 'insight' | 'suggestion' | 'summary' | 'response';
  confidence: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UseAIMessagesProps {
  sessionId: string | null;
  enabled?: boolean;
}

export const useAIMessages = ({ sessionId, enabled = true }: UseAIMessagesProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch existing messages for the session
  const fetchMessages = useCallback(async () => {
    if (!user || !sessionId || !enabled) return;

    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as AIMessage[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI messages:', err);
      setError('Error al cargar mensajes');
    }
  }, [user, sessionId, enabled]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user || !sessionId || !enabled) {
      setMessages([]);
      setIsConnected(false);
      return;
    }

    fetchMessages();

    const channel = supabase
      .channel('ai_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as AIMessage;
          if (newMessage.session_id === sessionId) {
            setMessages(prev => [...prev, newMessage]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Error de conexión en tiempo real');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user, sessionId, enabled, fetchMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    messages,
    isConnected,
    error,
    unreadCount,
    clearMessages,
    markAsRead,
    refetch: fetchMessages,
  };
};