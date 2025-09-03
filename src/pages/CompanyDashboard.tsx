import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, RefreshCw, Edit2, Check, X, Users, Calendar, Building2, Code2, BarChart3, TrendingUp, Mail, Trophy, DollarSign, Star, Percent, Target } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useCompanyAccount } from '@/hooks/useCompanyAccount';
import { useCompanyMetrics } from '@/hooks/useCompanyMetrics';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import CompanyNavigation from '@/components/CompanyNavigation';
import VendorCard from '@/components/VendorCard';

import faviconZoom from '@/assets/favicon-zoom.png';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

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

  const {
    companyMetrics,
    topVendors,
    vendorMetrics,
    activeVendors,
    averageRevenuePerVendor,
    isLoadingCompanyMetrics,
    isLoadingVendorMetrics
  } = useCompanyMetrics(dateRange);

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

  const handleViewVendorDetails = (vendorId: string) => {
    // The modal is handled directly by the VendorProfileCard component
    // This callback is just for consistency with the interface
  };

  const handleViewSessionDetails = (sessionId: string) => {
    navigate(`/company/analytics/${sessionId}`);
  };

  if (isLoadingCompany) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <CompanyNavigation />
        </div>
        <div className="px-4 pb-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <CompanyNavigation />
      </div>
      
      <div className="px-4 pb-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Company Header */}
          <div className="text-center space-y-4 py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src={faviconZoom} alt="Zoom Hack" className="h-12 w-12" />
              <h1 className="text-4xl font-bold">
                <span className="text-primary">ZOOM</span>{' '}
                <span className="text-foreground">HACK</span>
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">Panel de Administración Empresarial</p>
            <Badge variant="secondary" className="text-lg px-4 py-1">
              Gestiona tu equipo de vendedores
            </Badge>
          </div>

          {/* Date Filter */}
          <div className="flex justify-center mb-6">
            <DateRangeFilter
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Company KPIs - 5 Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {/* Vendedores Activos */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Vendedores Activos</p>
                      <p className="text-3xl font-bold text-primary">
                        {isLoadingVendorMetrics ? '...' : activeVendors}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-elegant">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorMetrics.slice(0, 5).map((vendor, index) => ({ 
                        name: `V${index + 1}`, 
                        value: vendor.total_sessions > 0 ? 1 : 0
                      }))}>
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={1} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasa de Conversión */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-accent/5"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Tasa de Conversión</p>
                      <p className="text-3xl font-bold text-accent">
                        {isLoadingCompanyMetrics ? '...' : `${companyMetrics?.conversion_rate?.toFixed(1) || '0'}%`}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-elegant">
                      <Percent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={vendorMetrics.slice(0, 6).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        conversion: vendor.conversion_rate
                      }))}>
                        <Area 
                          type="monotone" 
                          dataKey="conversion" 
                          fill="hsl(var(--accent))" 
                          fillOpacity={0.6}
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos por Vendedor */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-secondary/5"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Ingresos Promedio</p>
                      <p className="text-3xl font-bold text-secondary">
                        {isLoadingCompanyMetrics ? '...' : `$${Math.round(averageRevenuePerVendor).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center shadow-elegant">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vendorMetrics.slice(0, 5).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        revenue: vendor.total_revenue
                      }))}>
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--secondary))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sesiones */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Sesiones</p>
                      <p className="text-3xl font-bold text-foreground">
                        {isLoadingCompanyMetrics ? '...' : companyMetrics?.total_sessions || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center shadow-elegant">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vendorMetrics.slice(0, 7).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        sessions: vendor.total_sessions
                      }))}>
                        <Line 
                          type="monotone" 
                          dataKey="sessions" 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Ventas */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-destructive/5"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Ventas</p>
                      <p className="text-3xl font-bold text-destructive">
                        {isLoadingCompanyMetrics ? '...' : companyMetrics?.total_sales || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center shadow-elegant">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorMetrics.slice(0, 6).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        sales: vendor.total_sales
                      }))}>
                        <Bar dataKey="sales" fill="hsl(var(--destructive))" radius={1} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Company Information Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
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
                      <p className="font-semibold flex-1">
                        {companyAccount?.company_name}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleEditName}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
                  <p>
                    {companyAccount?.created_at 
                      ? new Date(companyAccount.created_at).toLocaleDateString('es-ES')
                      : 'N/A'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
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

          {/* Top 3 Performers */}
          {topVendors.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top 3 Mejores Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingVendorMetrics ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-64" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topVendors.slice(0, 3).map((vendor, index) => (
                      <div key={vendor.id} className="relative">
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-yellow-600 text-white">
                              🏆 #1
                            </Badge>
                          </div>
                        )}
                        <VendorCard
                          vendor={vendor}
                          rank={index + 1}
                          onViewDetails={handleViewVendorDetails}
                          onViewSessionDetails={handleViewSessionDetails}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Satisfacción y Conversión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Satisfacción Promedio</p>
                      <p className="text-3xl font-bold text-blue-600">{companyMetrics?.avg_satisfaction.toFixed(1) || '0'}/10</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                      <Star className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Tasa de Conversión</p>
                      <p className="text-3xl font-bold text-green-600">{companyMetrics?.conversion_rate.toFixed(1) || '0'}%</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Equipo Activo</p>
                      <p className="text-3xl font-bold text-purple-600">{companyMembers.length}</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Ingresos por Vendedor</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ${companyMembers.length > 0 ? Math.round((companyMetrics?.total_revenue || 0) / companyMembers.length).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;