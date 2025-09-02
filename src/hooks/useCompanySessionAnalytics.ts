import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { SessionAnalytic, SessionMetrics, MetricsSchema } from './useSessionAnalytics';

export interface UseCompanySessionAnalyticsReturn {
  sessions: SessionAnalytic[];
  isLoading: boolean;
  error: string | null;
  refreshSessions: () => Promise<void>;
  getSessionBySessionId: (sessionId: string) => Promise<SessionAnalytic | null>;
  parseMetrics: (session: SessionAnalytic) => SessionMetrics | null;
}

export const useCompanySessionAnalytics = (): UseCompanySessionAnalyticsReturn => {
  const [sessions, setSessions] = useState<SessionAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all sessions from vendors associated with this company
      const { data, error: fetchError } = await supabase
        .from('session_analytics')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            email,
            company_code
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setSessions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar sesiones de la empresa';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionBySessionId = async (sessionId: string): Promise<SessionAnalytic | null> => {
    if (!user) return null;
    
    // First check if we already have it in memory
    const existingSession = sessions.find(session => session.session_id === sessionId);
    if (existingSession) {
      return existingSession;
    }
    
    // If not in memory, fetch it directly
    try {
      const { data, error: fetchError } = await supabase
        .from('session_analytics')
        .select(`
          *,
          profiles!inner(
            id,
            full_name,
            email,
            company_code
          )
        `)
        .eq('session_id', sessionId)
        .single();

      if (fetchError) {
        console.error('Error fetching session:', fetchError);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching session by ID:', err);
      return null;
    }
  };

  const parseMetrics = (session: SessionAnalytic): SessionMetrics | null => {
    if (!session.metricas_json) {
      return null;
    }

    try {
      return MetricsSchema.parse(session.metricas_json);
    } catch (err) {
      console.error('Error parsing metrics:', err, session.metricas_json);
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      refreshSessions();
    }
  }, [user]);

  return {
    sessions,
    isLoading,
    error,
    refreshSessions,
    getSessionBySessionId,
    parseMetrics,
  };
};