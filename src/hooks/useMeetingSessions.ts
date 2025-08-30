import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingConfiguration } from './useMeetingConfiguration';

export interface MeetingSession {
  id: string;
  session_name: string;
  number_of_people: number;
  company_info: string;
  meeting_objective: string;
  created_at: string;
  updated_at: string;
}

interface UseMeetingSessionsReturn {
  sessions: MeetingSession[];
  isLoading: boolean;
  createSession: (config: MeetingConfiguration & { session_name: string }) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  loadSession: (session: MeetingSession) => MeetingConfiguration;
  refreshSessions: () => Promise<void>;
  error: string | null;
}

export const useMeetingSessions = (): UseMeetingSessionsReturn => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSessions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Error al cargar sesiones');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshSessions();
    }
  }, [user, refreshSessions]);

  const createSession = useCallback(async (config: MeetingConfiguration & { session_name: string }) => {
    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('meeting_sessions')
        .insert({
          user_id: user.id,
          session_name: config.session_name,
          number_of_people: config.numberOfPeople,
          company_info: config.companyInfo,
          meeting_objective: config.meetingObjective
        });

      if (error) throw error;
      await refreshSessions();
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Error al crear sesión');
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshSessions]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('meeting_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshSessions();
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Error al eliminar sesión');
    }
  }, [refreshSessions]);

  const loadSession = useCallback((session: MeetingSession): MeetingConfiguration => {
    return {
      numberOfPeople: session.number_of_people,
      companyInfo: session.company_info,
      meetingObjective: session.meeting_objective
    };
  }, []);

  return {
    sessions,
    isLoading,
    createSession,
    deleteSession,
    loadSession,
    refreshSessions,
    error
  };
};