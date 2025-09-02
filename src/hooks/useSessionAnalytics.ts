import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

// Zod schema for metrics validation - estructura completa
export const MetricsSchema = z.object({
  // Título de la sesión
  Titulo: z.string().optional(),
  
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
  url?: string | null;
  internet_quality_start?: number | null;
  internet_quality_end?: number | null;
  session_duration_minutes?: number | null;
  connection_stability_score?: number | null;
  network_type?: string | null;
  avg_connection_speed?: number | null;
  created_at: string;
  updated_at: string;
}

export interface UseSessionAnalyticsReturn {
  sessions: SessionAnalytic[];
  isLoading: boolean;
  error: string | null;
  createSessionRecord: (sessionId: string, connectivityData?: {
    internet_quality_start?: number;
    session_duration_minutes?: number;
    internet_quality_end?: number;
    connection_stability_score?: number;
    network_type?: string;
    avg_connection_speed?: number;
    session_name?: string;
    analysis_status?: string;
  }) => Promise<SessionAnalytic | null>;
  updateSessionRecord: (sessionId: string, updates: {
    internet_quality_start?: number;
    internet_quality_end?: number;
    session_duration_minutes?: number;
    connection_stability_score?: number;
    network_type?: string;
    avg_connection_speed?: number;
    analysis_status?: string;
  }) => Promise<SessionAnalytic | null>;
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

  const createSessionRecord = async (
    sessionId: string, 
    connectivityData?: {
      internet_quality_start?: number;
      session_duration_minutes?: number;
      internet_quality_end?: number;
      connection_stability_score?: number;
      network_type?: string;
      avg_connection_speed?: number;
      session_name?: string;
      analysis_status?: string;
    }
  ): Promise<SessionAnalytic | null> => {
    if (!user) {
      console.error('❌ No user available for session creation - user must be authenticated');
      throw new Error('Usuario no autenticado. Por favor inicia sesión.');
    }

    if (!sessionId) {
      console.error('❌ SessionId is required');
      throw new Error('ID de sesión requerido');
    }
    
    try {
      console.log('Creating base session record:', { sessionId, userId: user.id });
      
      // Check if session already exists to prevent duplicates
      const { data: existingSession, error: checkError } = await supabase
        .from('session_analytics')
        .select('id, session_id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
        console.error('❌ Error checking for existing session:', checkError);
        throw checkError;
      }

      if (existingSession) {
        console.log('⚠️ Session already exists, returning existing:', existingSession.id);
        return existingSession as SessionAnalytic;
      }
      
      // Create minimal base record first
      const insertData = {
        user_id: user.id,
        session_id: sessionId,
        session_name: connectivityData?.session_name || `Sesión ${new Date().toLocaleString('es-ES')}`,
        analysis_status: connectivityData?.analysis_status || 'initialized',
      };

      console.log('Inserting minimal data to Supabase:', insertData);

      const { data, error: insertError } = await supabase
        .from('session_analytics')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        // Check if it's a duplicate key error and handle gracefully
        if (insertError.code === '23505') { // PostgreSQL unique violation
          console.log('⚠️ Duplicate session detected, trying to fetch existing...');
          const { data: existingData } = await supabase
            .from('session_analytics')
            .select('*')
            .eq('session_id', sessionId)
            .eq('user_id', user.id)
            .single();
          return existingData || null;
        }
        throw insertError;
      }
      
      console.log('Base session record created successfully:', data);
      return data;
    } catch (err) {
      console.error('Error creating session record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al crear registro de sesión';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al crear sesión",
        description: `No se pudo crear el registro de la sesión: ${errorMessage}`,
      });
      return null;
    }
  };

  const updateSessionRecord = async (
    sessionId: string, 
    updates: {
      internet_quality_start?: number;
      internet_quality_end?: number;
      session_duration_minutes?: number;
      connection_stability_score?: number;
      network_type?: string;
      avg_connection_speed?: number;
      analysis_status?: string;
    }
  ): Promise<SessionAnalytic | null> => {
    if (!user) {
      console.error('❌ No user available for session update');
      return null;
    }

    try {
      console.log('Updating session record:', { sessionId, updates, userId: user.id });
      
      // Find the session first to ensure it exists
      const { data: existingSession, error: findError } = await supabase
        .from('session_analytics')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (findError) {
        console.error('❌ Session not found for update:', findError);
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Validate and sanitize connectivity data with proper limits
      const sanitizedUpdates = { ...updates };
      
      if (sanitizedUpdates.connection_stability_score !== undefined) {
        sanitizedUpdates.connection_stability_score = Math.max(0, Math.min(9.99, Number(sanitizedUpdates.connection_stability_score) || 0));
      }
      if (sanitizedUpdates.internet_quality_start !== undefined) {
        sanitizedUpdates.internet_quality_start = Math.max(1, Math.min(10, Number(sanitizedUpdates.internet_quality_start) || 1));
      }
      if (sanitizedUpdates.internet_quality_end !== undefined) {
        sanitizedUpdates.internet_quality_end = Math.max(1, Math.min(10, Number(sanitizedUpdates.internet_quality_end) || 1));
      }

      console.log('Sanitized updates:', sanitizedUpdates);

      const { data, error: updateError } = await supabase
        .from('session_analytics')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw updateError;
      }
      
      console.log('Session record updated successfully:', data);
      return data;
    } catch (err) {
      console.error('Error updating session record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar registro de sesión';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error al actualizar sesión",
        description: errorMessage,
      });
      return null;
    }
  };

  const sendWebhook = async (sessionId: string, userId: string): Promise<boolean> => {
    try {
      console.log('Sending webhook for session analysis:', { sessionId, userId });
      
      const webhookPayload = {
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      };

      console.log('Webhook payload:', webhookPayload);

      const response = await fetch('https://cris.cloude.es/webhook/analisis_reunion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      console.log('Webhook response status:', response.status);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('Webhook failed with response:', responseText);
        throw new Error(`Webhook failed: ${response.status} - ${responseText}`);
      }

      console.log('Webhook sent successfully');

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
    updateSessionRecord,
    sendWebhook,
    refreshSessions,
    getSessionBySessionId,
    parseMetrics,
    updateSessionName,
    filterSessionsByDateRange,
  };
};