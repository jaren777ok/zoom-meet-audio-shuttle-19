import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CompanyMetrics {
  id: string;
  company_id: string;
  total_sessions: number;
  total_sales: number;
  total_revenue: number;
  avg_satisfaction: number;
  conversion_rate: number;
  updated_at: string;
  created_at: string;
}

export interface VendorMetrics {
  id: string;
  vendor_id: string;
  company_id: string;
  total_sessions: number;
  total_sales: number;
  total_revenue: number;
  avg_satisfaction: number;
  conversion_rate: number;
  last_session_date: string | null;
  performance_score: number;
  updated_at: string;
  created_at: string;
  // Joined data from profiles
  vendor_name: string | null;
  vendor_email: string | null;
  profile_photo_url?: string;
  display_name?: string;
}

export const useCompanyMetrics = () => {
  const { user } = useAuth();

  // Get company account to find company_id
  const { data: companyAccount } = useQuery({
    queryKey: ['company-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_accounts')
        .select('id, company_code')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Get company metrics from session_analytics data
  const { data: companyMetrics, isLoading: isLoadingCompanyMetrics } = useQuery({
    queryKey: ['company-metrics', companyAccount?.id],
    queryFn: async () => {
      if (!companyAccount?.id) return null;
      
      // Get all sessions from vendors associated with this company
      const { data: sessions, error: sessionsError } = await supabase
        .from('session_analytics')
        .select(`
          *,
          profiles!inner(company_code)
        `)
        .eq('profiles.company_code', companyAccount.company_code);

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        return {
          id: '',
          company_id: companyAccount.id,
          total_sessions: 0,
          total_sales: 0,
          total_revenue: 0,
          avg_satisfaction: 0,
          conversion_rate: 0,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as CompanyMetrics;
      }

      if (!sessions || sessions.length === 0) {
        return {
          id: '',
          company_id: companyAccount.id,
          total_sessions: 0,
          total_sales: 0,
          total_revenue: 0,
          avg_satisfaction: 0,
          conversion_rate: 0,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        } as CompanyMetrics;
      }

      // Calculate metrics from session data
      let totalSales = 0;
      let totalRevenue = 0;
      let totalSatisfaction = 0;
      let satisfactionCount = 0;

      sessions.forEach(session => {
        if (session.metricas_json) {
          const metrics = typeof session.metricas_json === 'string' 
            ? JSON.parse(session.metricas_json) 
            : session.metricas_json;
          
          // Sum conversions (sales)
          if (metrics.Conversiones && !isNaN(parseInt(metrics.Conversiones))) {
            totalSales += parseInt(metrics.Conversiones);
          }
          
          // Sum revenue
          if (metrics.Ganancia_en_Dinero && !isNaN(parseFloat(metrics.Ganancia_en_Dinero))) {
            totalRevenue += parseFloat(metrics.Ganancia_en_Dinero);
          }
          
          // Average satisfaction
          if (metrics.Puntuación_Satisfacción_Cliente && !isNaN(parseFloat(metrics.Puntuación_Satisfacción_Cliente))) {
            totalSatisfaction += parseFloat(metrics.Puntuación_Satisfacción_Cliente);
            satisfactionCount++;
          }
        }
      });

      const avgSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;
      const conversionRate = sessions.length > 0 ? (totalSales / sessions.length) * 100 : 0;
      
      return {
        id: '',
        company_id: companyAccount.id,
        total_sessions: sessions.length,
        total_sales: totalSales,
        total_revenue: totalRevenue,
        avg_satisfaction: avgSatisfaction,
        conversion_rate: conversionRate,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      } as CompanyMetrics;
    },
    enabled: !!companyAccount?.id,
  });

  // Get vendor metrics with calculated performance scores
  const { data: vendorMetrics, isLoading: isLoadingVendorMetrics } = useQuery({
    queryKey: ['vendor-metrics', companyAccount?.id],
    queryFn: async () => {
      if (!companyAccount?.id) return [];
      
      // Get all profiles associated with this company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_code', companyAccount.company_code);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) return [];

      // Calculate metrics for each vendor
      const vendorMetricsPromises = profiles.map(async (profile) => {
        // Get sessions for this vendor
        const { data: sessions, error: sessionsError } = await supabase
          .from('session_analytics')
          .select('*')
          .eq('user_id', profile.id);

        if (sessionsError) {
          console.error('Error fetching sessions for vendor:', sessionsError);
          return null;
        }

        // Calculate metrics from sessions
        let totalSales = 0;
        let totalRevenue = 0;
        let totalSatisfaction = 0;
        let satisfactionCount = 0;
        let qualitySum = 0;
        let qualityCount = 0;

        (sessions || []).forEach(session => {
          if (session.metricas_json) {
            const metrics = typeof session.metricas_json === 'string' 
              ? JSON.parse(session.metricas_json) 
              : session.metricas_json;
            
            // Sum conversions (sales)
            if (metrics.Conversiones && !isNaN(parseInt(metrics.Conversiones))) {
              totalSales += parseInt(metrics.Conversiones);
            }
            
            // Sum revenue
            if (metrics.Ganancia_en_Dinero && !isNaN(parseFloat(metrics.Ganancia_en_Dinero))) {
              totalRevenue += parseFloat(metrics.Ganancia_en_Dinero);
            }
            
            // Average satisfaction
            if (metrics.Puntuación_Satisfacción_Cliente && !isNaN(parseFloat(metrics.Puntuación_Satisfacción_Cliente))) {
              totalSatisfaction += parseFloat(metrics.Puntuación_Satisfacción_Cliente);
              satisfactionCount++;
            }
          }

          // Internet quality (converted to 1-10 scale)
          if (session.internet_quality_start && !isNaN(session.internet_quality_start)) {
            qualitySum += session.internet_quality_start;
            qualityCount++;
          }
        });

        const avgSatisfaction = satisfactionCount > 0 ? totalSatisfaction / satisfactionCount : 0;
        const conversionRate = sessions.length > 0 ? (totalSales / sessions.length) * 100 : 0;
        const avgQuality = qualityCount > 0 ? qualitySum / qualityCount : 0;
        
        // Calculate performance score: satisfaction (30%) + conversion (40%) + quality (30%)
        const performanceScore = Math.round(
          (avgSatisfaction * 3) + (conversionRate * 4) + (avgQuality * 3)
        );

        return {
          id: profile.id,
          vendor_id: profile.id,
          company_id: companyAccount.id,
          total_sessions: sessions?.length || 0,
          total_sales: totalSales,
          total_revenue: totalRevenue,
          avg_satisfaction: avgSatisfaction,
          conversion_rate: conversionRate,
          last_session_date: sessions && sessions.length > 0 
            ? sessions[sessions.length - 1]?.created_at 
            : null,
          performance_score: Math.max(0, Math.min(100, performanceScore)), // Clamp between 0-100
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          vendor_name: profile.display_name || profile.full_name || null,
          vendor_email: profile.email || null,
          profile_photo_url: profile.profile_photo_url,
          display_name: profile.display_name,
        } as VendorMetrics;
      });

      const results = await Promise.all(vendorMetricsPromises);
      return results.filter(Boolean).sort((a, b) => b.performance_score - a.performance_score);
    },
    enabled: !!companyAccount?.id,
  });

  // Get top 10 vendors
  const topVendors = vendorMetrics?.slice(0, 10) || [];

  return {
    companyMetrics,
    vendorMetrics: vendorMetrics || [],
    topVendors,
    isLoadingCompanyMetrics,
    isLoadingVendorMetrics,
    companyAccount,
  };
};