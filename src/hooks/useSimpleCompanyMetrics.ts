import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SimpleCompanyMetrics {
  activeVendors: number;
  totalSessions: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
  averageRevenuePerVendor: number;
}

export const useSimpleCompanyMetrics = (dateRange?: { from: Date | undefined; to: Date | undefined }) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['simple-company-metrics', user?.id, dateRange?.from, dateRange?.to],
    queryFn: async (): Promise<SimpleCompanyMetrics> => {
      if (!user?.id) {
        return {
          activeVendors: 0,
          totalSessions: 0,
          totalSales: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageRevenuePerVendor: 0,
        };
      }

      // Get company account
      const { data: companyAccount, error: companyError } = await supabase
        .from('company_accounts')
        .select('id, company_code')
        .eq('user_id', user.id)
        .maybeSingle();

      if (companyError) throw companyError;
      if (!companyAccount) {
        return {
          activeVendors: 0,
          totalSessions: 0,
          totalSales: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageRevenuePerVendor: 0,
        };
      }

      // First get all profiles for this company
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, company_code')
        .eq('company_code', companyAccount.company_code);

      if (profilesError) throw profilesError;
      if (!profiles || profiles.length === 0) {
        return {
          activeVendors: 0,
          totalSessions: 0,
          totalSales: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageRevenuePerVendor: 0,
        };
      }

      // Get the user IDs
      const userIds = profiles.map(p => p.id);

      // Build the query to get session analytics for these users
      let query = supabase
        .from('session_analytics')
        .select('*')
        .in('user_id', userIds);

      // Add date filtering if provided
      if (dateRange?.from) {
        query = query.gte('created_at', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: sessions, error: sessionsError } = await query;

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      if (!sessions || sessions.length === 0) {
        return {
          activeVendors: 0,
          totalSessions: 0,
          totalSales: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageRevenuePerVendor: 0,
        };
      }

      // Calculate metrics
      let totalSales = 0;
      let totalRevenue = 0;
      const activeVendorIds = new Set<string>();

      sessions.forEach(session => {
        // Count active vendors (unique user_ids with sessions)
        activeVendorIds.add(session.user_id);

        // Parse metrics from JSON
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
        }
      });

      const activeVendors = activeVendorIds.size;
      const totalSessions = sessions.length;
      const conversionRate = totalSessions > 0 ? (totalSales / totalSessions) * 100 : 0;
      const averageRevenuePerVendor = activeVendors > 0 ? totalRevenue / activeVendors : 0;

      return {
        activeVendors,
        totalSessions,
        totalSales,
        totalRevenue,
        conversionRate,
        averageRevenuePerVendor,
      };
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: false,
  });
};