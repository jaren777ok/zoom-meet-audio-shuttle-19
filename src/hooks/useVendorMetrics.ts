import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionMetrics {
  Tasa_de_Cierre: string;
  Puntuación_Satisfacción_Cliente: number;
  Tiempo_Promedio_Respuesta_Vendedor: number;
  Temperatura_Lead: string;
  Intención_compra: string;
  Sentimiento_cliente: string;
  Conversiones: number;
  Ganancia_en_Dinero: number;
  Net_Promoter_Score: string;
  'Estado Final del Carrito': string;
  Carrito_Abandonado: boolean;
  [key: string]: any;
}

export interface VendorSession {
  id: string;
  session_id: string;
  session_name: string | null;
  user_id: string;
  internet_quality_start: number | null;
  internet_quality_end: number | null;
  metricas_json: SessionMetrics | null;
  created_at: string;
  updated_at: string;
  webhook_sent_at: string | null;
  analysis_status: string | null;
  avg_connection_speed: number | null;
  connection_stability_score: number | null;
  [key: string]: any; // Allow additional properties from supabase
}

export interface VendorMetricsData {
  totalSessions: number;
  avgQuality: number;
  avgDuration: number;
  recentSessions: VendorSession[];
  qualityDistribution: {
    excellent: number;
    good: number;
    poor: number;
  };
  // KPIs agregados
  avgSatisfaction: number;
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
  // Análisis detallado por sesión
  detailedSessions: VendorSession[];
}

// Function to get session details by session_id
export const getSessionDetails = async (sessionId: string) => {
  const { data: session, error } = await supabase
    .from('session_analytics')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching session details:', error);
    throw error;
  }

  return session;
};

export const useVendorMetrics = (vendorId: string, dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ['vendor-metrics', vendorId, dateRange],
    queryFn: async (): Promise<VendorMetricsData> => {
      if (!vendorId) throw new Error('Vendor ID is required');

      console.log('Fetching metrics for vendor:', vendorId);

      let query = supabase
        .from('session_analytics')
        .select('*')
        .eq('user_id', vendorId)
        .order('created_at', { ascending: false });

      // Apply date range filter if provided
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        query = query.lte('created_at', dateRange.to.toISOString());
      }

      const { data: sessions, error } = await query;

      if (error) {
        console.error('Error fetching vendor metrics:', error);
        throw error;
      }

      console.log('Found sessions:', sessions?.length || 0);

      const sessionData = sessions || [];

      // Calculate metrics
      const totalSessions = sessionData.length;
      
      // Calcular calidad promedio considerando ambos valores inicial y final
      const qualityScores: number[] = [];
      sessionData.forEach(s => {
        if (s.internet_quality_start && s.internet_quality_end) {
          // Si tenemos ambos valores, usar el promedio
          qualityScores.push((s.internet_quality_start + s.internet_quality_end) / 2);
        } else if (s.internet_quality_start) {
          qualityScores.push(s.internet_quality_start);
        } else if (s.internet_quality_end) {
          qualityScores.push(s.internet_quality_end);
        }
      });
      
      const avgQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      // Calculate quality distribution (scale 1-10 to percentages)
      const qualityDistribution = {
        excellent: qualityScores.filter(q => q >= 8).length,  // 8-10 = Excelente
        good: qualityScores.filter(q => q >= 6 && q < 8).length, // 6-7.9 = Buena
        poor: qualityScores.filter(q => q < 6).length, // 1-5.9 = Pobre
      };

      // Calculate average duration from session_duration_minutes
      const durations = sessionData
        .map(s => s.session_duration_minutes)
        .filter(Boolean) as number[];
      
      const avgDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 0;

      // Parse detailed metrics from JSON  
      const sessionsWithMetrics = sessionData.map(session => {
        let parsedMetrics: SessionMetrics | null = null;
        try {
          if (session.metricas_json) {
            parsedMetrics = typeof session.metricas_json === 'string' 
              ? JSON.parse(session.metricas_json) 
              : session.metricas_json as SessionMetrics;
          }
        } catch (error) {
          console.warn('Error parsing metrics JSON for session:', session.id, error);
        }
        
        return {
          ...session,
          metricas_json: parsedMetrics
        } as VendorSession;
      });

      // Calculate aggregated KPIs
      const validMetrics = sessionsWithMetrics
        .filter(s => s.metricas_json)
        .map(s => s.metricas_json as SessionMetrics);

      const avgSatisfaction = validMetrics.length > 0
        ? validMetrics.reduce((sum, m) => sum + (m.Puntuación_Satisfacción_Cliente || 0), 0) / validMetrics.length
        : 0;

      const totalRevenue = validMetrics.reduce((sum, m) => sum + (m.Ganancia_en_Dinero || 0), 0);
      const totalSales = validMetrics.reduce((sum, m) => sum + (m.Conversiones || 0), 0);
      const conversionRate = totalSessions > 0 ? (totalSales / totalSessions) * 100 : 0;

      return {
        totalSessions,
        avgQuality: Math.round(avgQuality * 10) / 10, // Mantener decimales para mayor precisión
        avgDuration: Math.round(avgDuration * 10) / 10, // Mantener decimales
        recentSessions: sessionsWithMetrics.slice(0, 10),
        qualityDistribution,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        totalRevenue,
        totalSales,
        conversionRate: Math.round(conversionRate * 10) / 10,
        detailedSessions: sessionsWithMetrics,
      };
    },
    enabled: !!vendorId,
  });
};