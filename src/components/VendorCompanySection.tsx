import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Link as LinkIcon, Unlink, Users, Building, Code } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfilePhotoUploader } from '@/components/ProfilePhotoUploader';
import { VendorNameEditor } from '@/components/VendorNameEditor';

const VendorCompanySection: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [companyCode, setCompanyCode] = useState('');

  const handlePhotoUpdated = (newPhotoUrl: string) => {
    queryClient.invalidateQueries({ queryKey: ['vendor-profile', user?.id] });
  };

  const handleNameUpdated = (newName: string) => {
    queryClient.invalidateQueries({ queryKey: ['vendor-profile', user?.id] });
  };

  // Get current vendor profile
  const { data: profile } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('company_code, profile_photo_url, display_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });

  // Get company info if associated
  const { data: companyInfo } = useQuery({
    queryKey: ['company-info', profile?.company_code],
    queryFn: async () => {
      if (!profile?.company_code) return null;
      
      const { data, error } = await supabase
        .from('company_accounts')
        .select('company_name, company_code')
        .eq('company_code', profile.company_code)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
    enabled: !!profile?.company_code,
  });

  // Associate with company
  const associateMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user?.id) throw new Error('No user found');
      
      // First verify the company code exists
      const { data: company, error: companyError } = await supabase
        .from('company_accounts')
        .select('company_code, id, company_name')
        .eq('company_code', code.toUpperCase())
        .single();
      
      if (companyError || !company) {
        throw new Error('Código de empresa no válido o no existe');
      }

      // Check if vendor is already associated with a different company
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('company_code')
        .eq('id', user.id)
        .single();

      if (currentProfile?.company_code && currentProfile.company_code !== code.toUpperCase()) {
        throw new Error('Ya estás asociado con otra empresa. Primero desasóciate para cambiar.');
      }
      
      // Update vendor profile with company code
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_code: code.toUpperCase() })
        .eq('id', user.id);

      if (profileError) {
        throw new Error('Error al actualizar tu perfil: ' + profileError.message);
      }

      // Wait a moment for trigger to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify the association was completed by checking vendor_metrics
      const { data: vendorMetrics, error: metricsError } = await supabase
        .from('vendor_metrics')
        .select('company_id')
        .eq('vendor_id', user.id)
        .single();

      if (metricsError || !vendorMetrics || vendorMetrics.company_id !== company.id) {
        // Try to manually create the vendor metrics if trigger failed
        const { error: insertError } = await supabase
          .from('vendor_metrics')
          .upsert({
            vendor_id: user.id,
            company_id: company.id,
            total_sessions: 0,
            total_sales: 0,
            total_revenue: 0,
            avg_satisfaction: 0,
            conversion_rate: 0
          });

        if (insertError) {
          throw new Error('Error al completar la asociación: ' + insertError.message);
        }
      }
      
      return { code: code.toUpperCase(), companyName: company.company_name };
    },
    onSuccess: (result) => {
      toast({
        title: "¡Asociado exitosamente!",
        description: `Te has asociado con ${result.companyName} usando el código: ${result.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
      queryClient.invalidateQueries({ queryKey: ['company-metrics'] });
      setCompanyCode('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo asociar con la empresa",
        variant: "destructive",
      });
    }
  });

  // Disassociate from company
  const disassociateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({ company_code: null })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Desasociado",
        description: "Te has desasociado de la empresa",
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['company-info'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "No se pudo desasociar de la empresa",
        variant: "destructive",
      });
    }
  });

  const handleAssociate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código de empresa",
        variant: "destructive",
      });
      return;
    }
    associateMutation.mutate(companyCode.trim());
  };

  const handleDisassociate = () => {
    disassociateMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {companyInfo ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-success">Empresa Asociada</p>
                  <p className="text-sm text-muted-foreground">{companyInfo.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-mono">{companyInfo.company_code}</span>
              </div>
            </div>

            {/* Profile Photo Section */}
            <ProfilePhotoUploader
              currentPhotoUrl={profile?.profile_photo_url}
              onPhotoUpdated={handlePhotoUpdated}
            />

            {/* Display Name Section */}
            <VendorNameEditor
              currentDisplayName={profile?.display_name}
              onNameUpdated={handleNameUpdated}
            />
            
            <Button
              onClick={handleDisassociate}
              disabled={disassociateMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              <Unlink className="h-4 w-4 mr-2" />
              {disassociateMutation.isPending ? 'Desasociando...' : 'Desasociar de Empresa'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Si trabajas para una empresa, puedes asociarte usando su código único.
            </p>
            <form onSubmit={handleAssociate} className="space-y-3">
              <Input
                placeholder="Código de empresa (ej: ZH-ABC123)"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                disabled={associateMutation.isPending}
              />
              <Button
                type="submit"
                disabled={associateMutation.isPending || !companyCode.trim()}
                className="w-full flex items-center gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                {associateMutation.isPending ? 'Asociando...' : 'Asociar con Empresa'}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorCompanySection;