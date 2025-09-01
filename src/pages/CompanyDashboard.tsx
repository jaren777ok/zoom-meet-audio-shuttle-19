import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCompanyAccount } from '@/hooks/useCompanyAccount';
import { Building2, Users, Copy, RefreshCw, Edit, Check, X, Calendar, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const CompanyDashboard = () => {
  const { 
    companyAccount, 
    companyMembers, 
    isLoadingCompany, 
    isLoadingMembers,
    generateNewCode,
    isGeneratingCode,
    updateCompanyName,
    isUpdatingName
  } = useCompanyAccount();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const copyCodeToClipboard = async () => {
    if (companyAccount?.company_code) {
      await navigator.clipboard.writeText(companyAccount.company_code);
      toast({
        title: "Código copiado",
        description: "El código ha sido copiado al portapapeles",
      });
    }
  };

  const handleEditName = () => {
    setNewCompanyName(companyAccount?.company_name || '');
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (newCompanyName.trim() && newCompanyName !== companyAccount?.company_name) {
      updateCompanyName(newCompanyName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewCompanyName('');
  };

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
          <Skeleton className="h-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-neon-cyan" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Empresa</h1>
            <p className="text-muted-foreground">Gestiona tu equipo y monitorea su rendimiento</p>
          </div>
        </div>

        {/* Company Info Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Company Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-neon-cyan" />
                Información de la Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Nombre de la empresa</label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <Input
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="flex-1"
                      placeholder="Nombre de la empresa"
                    />
                    <Button
                      size="icon"
                      onClick={handleSaveName}
                      disabled={isUpdatingName || !newCompanyName.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isUpdatingName}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground flex-1">
                      {companyAccount?.company_name}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleEditName}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
                <p className="text-foreground">
                  {companyAccount?.created_at 
                    ? new Date(companyAccount.created_at).toLocaleDateString('es-ES')
                    : 'N/A'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Code */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Código de Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Código para vendedores</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-lg p-3 font-mono text-lg font-bold text-center">
                    {companyAccount?.company_code}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyCodeToClipboard}
                    title="Copiar código"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => generateNewCode()}
                  disabled={isGeneratingCode}
                  variant="outline"
                  className="w-full"
                >
                  {isGeneratingCode ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generar nuevo código
                </Button>
                <p className="text-xs text-muted-foreground">
                  Comparte este código con tu equipo para que puedan asociarse a tu empresa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Equipo de Vendedores
              </div>
              <Badge variant="secondary">
                {companyMembers.length} miembro{companyMembers.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMembers ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : companyMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No hay vendedores asociados
                </h3>
                <p className="text-muted-foreground mb-4">
                  Comparte tu código de empresa para que tu equipo se una
                </p>
                <Button onClick={copyCodeToClipboard} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar código: {companyAccount?.company_code}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {companyMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center text-primary-foreground font-semibold">
                      {member.full_name 
                        ? member.full_name.charAt(0).toUpperCase()
                        : member.email?.charAt(0).toUpperCase() || '?'
                      }
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {member.full_name || 'Sin nombre'}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Vendedor
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email || 'Sin email'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(member.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Activo
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDashboard;