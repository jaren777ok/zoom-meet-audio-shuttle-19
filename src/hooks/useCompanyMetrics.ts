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

  // Get company metrics
  const { data: companyMetrics, isLoading: isLoadingCompanyMetrics } = useQuery({
    queryKey: ['company-metrics', companyAccount?.id],
    queryFn: async () => {
      if (!companyAccount?.id) return null;
      
      const { data, error } = await supabase
        .from('company_metrics')
        .select('*')
        .eq('company_id', companyAccount.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If no metrics exist, return default values
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
      
      return data as CompanyMetrics;
    },
    enabled: !!companyAccount?.id,
  });

  // Get vendor metrics with profile data
  const { data: vendorMetrics, isLoading: isLoadingVendorMetrics } = useQuery({
    queryKey: ['vendor-metrics', companyAccount?.id],
    queryFn: async () => {
      if (!companyAccount?.id) return [];
      
      const { data, error } = await supabase
        .from('vendor_metrics')
        .select(`
          *,
          profiles!vendor_id (
            full_name,
            email,
            profile_photo_url,
            display_name
          )
        `)
        .eq('company_id', companyAccount.id)
        .order('performance_score', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        vendor_name: item.profiles?.display_name || item.profiles?.full_name || null,
        vendor_email: item.profiles?.email || null,
        profile_photo_url: item.profiles?.profile_photo_url,
        display_name: item.profiles?.display_name,
      })) as VendorMetrics[];
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