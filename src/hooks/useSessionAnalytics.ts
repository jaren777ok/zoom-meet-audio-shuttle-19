import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Zod schema for metrics validation - estructura completa
const MetricsSchema = z.object({
  // Clasificación del cliente
  Temperatura_Lead: z.string(),
  Intención_compra: z.string(),
  Sentimiento_cliente: z.string(),
  
  // KPIs principales
  Tasa_de_Cierre: z.string(),
  Puntuación_Satisfacción_Cliente: z.number(),
  Tiempo_Promedio_Respuesta_Vendedor: z.number(),
  
  // Conversiones y resultados
  Net_Promoter_Score: z.string(),
  Conversiones: z.number(),
  Ganancia_en_Dinero: z.number(),
  
  // Análisis de carrito abandonado
  Carrito_Abandonado: z.boolean(),
  Motivo_Principal_Abandono: z.string(),
  punto_friccion: z.string(),
  intento_recuperacion: z.boolean(),
  Técnica_Recuperación_Utilizada: z.string(),
  'Estado Final del Carrito': z.string(),
});

export type SessionMetrics = z.infer<typeof MetricsSchema>;

export interface SessionAnalytic {
  id: string;
  user_id: string;
  session_id: string;
  webhook_sent_at?: string | null;
  analysis_status: string;
  metricas_json?: any;
  analisis_markdown?: string | null;
  session_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseSessionAnalyticsReturn {
  sessions: SessionAnalytic[];
  isLoading: boolean;
  error: string | null;
  createSessionRecord: (sessionId: string) => Promise<SessionAnalytic | null>;
  sendWebhook: (sessionId: string, userId: string) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
  getSessionBySessionId: (sessionId: string) => SessionAnalytic | null;
  parseMetrics: (session: SessionAnalytic) => SessionMetrics | null;
  updateSessionName: (sessionId: string, newName: string) => Promise<boolean>;
  filterSessionsByDateRange: (sessions: SessionAnalytic[], dateRange?: { from?: Date; to?: Date }) => SessionAnalytic[];
}

export const useSessionAnalytics = (): UseSessionAnalyticsReturn => {
  const [sessions, setSessions] = useState<SessionAnalytic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const refreshSessions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('session_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setSessions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar sesiones';
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

  const createSessionRecord = async (sessionId: string): Promise<SessionAnalytic | null> => {
    if (!user) return null;
    
    try {
      const { data, error: insertError } = await supabase
        .from('session_analytics')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          analysis_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear registro de sesión';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return null;
    }
  };

  const sendWebhook = async (sessionId: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch('https://cris.cloude.es/webhook/analisis_reunion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      // Update webhook_sent_at timestamp
      await supabase
        .from('session_analytics')
        .update({ 
          webhook_sent_at: new Date().toISOString(),
          analysis_status: 'processing'
        })
        .eq('session_id', sessionId)
        .eq('user_id', userId);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar webhook';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al enviar análisis",
        description: errorMessage,
      });
      return false;
    }
  };

  const getSessionBySessionId = (sessionId: string): SessionAnalytic | null => {
    return sessions.find(session => session.session_id === sessionId) || null;
  };

  const parseMetrics = (session: SessionAnalytic): SessionMetrics | null => {
    if (!session.metricas_json) {
      return null;
    }

    try {
      // La estructura ahora es directa, no está envuelta en un array
      return MetricsSchema.parse(session.metricas_json);
    } catch (err) {
      console.error('Error parsing metrics:', err, session.metricas_json);
      return null;
    }
  };

  const updateSessionName = async (sessionId: string, newName: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('session_analytics')
        .update({ session_name: newName })
        .eq('session_id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.session_id === sessionId 
            ? { ...session, session_name: newName }
            : session
        )
      );

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar nombre';
      setError(errorMessage);
      return false;
    }
  };

  const filterSessionsByDateRange = (sessions: SessionAnalytic[], dateRange?: { from?: Date; to?: Date }): SessionAnalytic[] => {
    if (!dateRange?.from) return sessions;

    return sessions.filter(session => {
      const sessionDate = new Date(session.created_at);
      const fromDate = dateRange.from;
      const toDate = dateRange.to || dateRange.from;

      // Set time to start/end of day for accurate comparison
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
      const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);

      return sessionDateOnly >= fromDateOnly && sessionDateOnly <= toDateOnly;
    });
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
    createSessionRecord,
    sendWebhook,
    refreshSessions,
    getSessionBySessionId,
    parseMetrics,
    updateSessionName,
    filterSessionsByDateRange,
  };
};