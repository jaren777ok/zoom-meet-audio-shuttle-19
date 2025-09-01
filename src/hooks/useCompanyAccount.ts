import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface CompanyAccount {
  id: string;
  user_id: string;
  company_name: string;
  company_code: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  full_name: string | null;
  email: string | null;
  account_type: string;
  company_code: string | null;
  created_at: string;
}

export const useCompanyAccount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get company account info
  const { data: companyAccount, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-account', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Get company members (vendedores associated to this company)
  const { data: companyMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['company-members', companyAccount?.company_code],
    queryFn: async () => {
      if (!companyAccount?.company_code) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, account_type, company_code, created_at')
        .eq('company_code', companyAccount.company_code)
        .eq('account_type', 'vendedor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompanyMember[];
    },
    enabled: !!companyAccount?.company_code,
  });

  // Generate new company code
  const generateNewCodeMutation = useMutation({
    mutationFn: async () => {
      if (!companyAccount?.id) throw new Error('No company account found');

      // Generate new code
      const { data: newCode } = await supabase
        .rpc('generate_company_code');

      // Update company account
      const { error } = await supabase
        .from('company_accounts')
        .update({ company_code: newCode })
        .eq('id', companyAccount.id);

      if (error) throw error;
      return newCode;
    },
    onSuccess: (newCode) => {
      toast({
        title: "Código regenerado",
        description: `Tu nuevo código es: ${newCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['company-account'] });
      queryClient.invalidateQueries({ queryKey: ['company-members'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo regenerar el código",
        variant: "destructive",
      });
    }
  });

  // Update company name
  const updateCompanyNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!companyAccount?.id) throw new Error('No company account found');

      const { error } = await supabase
        .from('company_accounts')
        .update({ company_name: newName })
        .eq('id', companyAccount.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Nombre actualizado",
        description: "El nombre de la empresa ha sido actualizado",
      });
      queryClient.invalidateQueries({ queryKey: ['company-account'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el nombre",
        variant: "destructive",
      });
    }
  });

  return {
    companyAccount,
    companyMembers: companyMembers || [],
    isLoadingCompany,
    isLoadingMembers,
    generateNewCode: generateNewCodeMutation.mutate,
    isGeneratingCode: generateNewCodeMutation.isPending,
    updateCompanyName: updateCompanyNameMutation.mutate,
    isUpdatingName: updateCompanyNameMutation.isPending,
  };
};