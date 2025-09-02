import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VendorSession {
  id: string;
  session_id: string;
  session_name: string | null;
  user_id: string;
  internet_quality_start: number | null;
  internet_quality_end: number | null;
  metricas_json: any;
  created_at: string;
  updated_at: string;
  webhook_sent_at: string | null;
  analysis_status: string | null;
  avg_connection_speed: number | null;
  connection_stability_score: number | null;
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
}

export const useVendorMetrics = (vendorId: string, dateRange?: { from?: Date; to?: Date }) => {
  return useQuery({
    queryKey: ['vendor-metrics', vendorId, dateRange],
    queryFn: async (): Promise<VendorMetricsData> => {
      if (!vendorId) throw new Error('Vendor ID is required');

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

      if (error) throw error;

      const sessionData = sessions || [];

      // Calculate metrics
      const totalSessions = sessionData.length;
      
      const qualityScores = sessionData
        .map(s => s.internet_quality_start || s.internet_quality_end)
        .filter(Boolean) as number[];
      
      const avgQuality = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      // Calculate quality distribution
      const qualityDistribution = {
        excellent: qualityScores.filter(q => q >= 80).length,
        good: qualityScores.filter(q => q >= 60 && q < 80).length,
        poor: qualityScores.filter(q => q < 60).length,
      };

      // Calculate average duration from metrics if available
      const durationsMs = sessionData
        .map(s => {
          try {
            const metrics = typeof s.metricas_json === 'string' 
              ? JSON.parse(s.metricas_json) 
              : s.metricas_json;
            return metrics?.duration || 0;
          } catch {
            return 0;
          }
        })
        .filter(Boolean);
      
      const avgDuration = durationsMs.length > 0
        ? durationsMs.reduce((sum, d) => sum + d, 0) / durationsMs.length / 1000 / 60 // Convert to minutes
        : 0;

      return {
        totalSessions,
        avgQuality: Math.round(avgQuality),
        avgDuration: Math.round(avgDuration),
        recentSessions: sessionData.slice(0, 10), // Last 10 sessions
        qualityDistribution,
      };
    },
    enabled: !!vendorId,
  });
};