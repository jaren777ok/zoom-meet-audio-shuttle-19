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
              <div className="absolute inset-0 bg-[var(--gradient-users)] opacity-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Vendedores Activos</p>
                      <p className="text-3xl font-bold bg-[var(--gradient-users)] bg-clip-text text-transparent">
                        {isLoadingVendorMetrics ? '...' : activeVendors}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--gradient-users)] flex items-center justify-center shadow-elegant">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorMetrics.slice(0, 5).map((vendor, index) => ({ 
                        name: `V${index + 1}`, 
                        value: vendor.total_sessions > 0 ? 100 : 20
                      }))}>
                        <Bar dataKey="value" fill="url(#gradientUsers)" radius={2} />
                        <defs>
                          <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--gradient-users)" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="var(--gradient-users)" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tasa de Conversión */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-[var(--gradient-conversion)] opacity-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Tasa de Conversión</p>
                      <p className="text-3xl font-bold bg-[var(--gradient-conversion)] bg-clip-text text-transparent">
                        {isLoadingCompanyMetrics ? '...' : `${companyMetrics?.conversion_rate?.toFixed(1) || '0'}%`}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--gradient-conversion)] flex items-center justify-center shadow-elegant">
                      <Percent className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={vendorMetrics.slice(0, 6).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        conversion: vendor.conversion_rate || 0
                      }))}>
                        <Area 
                          type="monotone" 
                          dataKey="conversion" 
                          fill="url(#gradientConversion)" 
                          fillOpacity={0.8}
                          stroke="var(--gradient-conversion)"
                          strokeWidth={2}
                        />
                        <defs>
                          <linearGradient id="gradientConversion" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f093fb" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#f5576c" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ingresos por Vendedor */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-[var(--gradient-revenue)] opacity-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Ingresos Promedio</p>
                      <p className="text-3xl font-bold bg-[var(--gradient-revenue)] bg-clip-text text-transparent">
                        {isLoadingCompanyMetrics ? '...' : `$${Math.round(averageRevenuePerVendor).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--gradient-revenue)] flex items-center justify-center shadow-elegant">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vendorMetrics.slice(0, 5).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        revenue: vendor.total_revenue || 0
                      }))}>
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="url(#gradientRevenue)" 
                          strokeWidth={3}
                          dot={{ fill: '#4facfe', strokeWidth: 2, r: 4 }}
                        />
                        <defs>
                          <linearGradient id="gradientRevenue" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#4facfe" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#00f2fe" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Sesiones */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-[var(--gradient-sessions)] opacity-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Sesiones</p>
                      <p className="text-3xl font-bold bg-[var(--gradient-sessions)] bg-clip-text text-transparent">
                        {isLoadingCompanyMetrics ? '...' : companyMetrics?.total_sessions || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--gradient-sessions)] flex items-center justify-center shadow-elegant">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vendorMetrics.slice(0, 7).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        sessions: vendor.total_sessions || 0
                      }))}>
                        <Line 
                          type="monotone" 
                          dataKey="sessions" 
                          stroke="url(#gradientSessions)" 
                          strokeWidth={3}
                          dot={{ fill: '#43e97b', strokeWidth: 2, r: 3 }}
                        />
                        <defs>
                          <linearGradient id="gradientSessions" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="5%" stopColor="#43e97b" stopOpacity={1}/>
                            <stop offset="95%" stopColor="#38f9d7" stopOpacity={1}/>
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Ventas */}
            <Card className="relative overflow-hidden border-0 shadow-card hover:shadow-zoom transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-[var(--gradient-sales)] opacity-10"></div>
              <CardContent className="p-6 relative">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Total Ventas</p>
                      <p className="text-3xl font-bold bg-[var(--gradient-sales)] bg-clip-text text-transparent">
                        {isLoadingCompanyMetrics ? '...' : companyMetrics?.total_sales || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[var(--gradient-sales)] flex items-center justify-center shadow-elegant">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vendorMetrics.slice(0, 6).map((vendor, index) => ({ 
                        name: `${index + 1}`, 
                        sales: vendor.total_sales || 0
                      }))}>
                        <Bar dataKey="sales" fill="url(#gradientSales)" radius={3} />
                        <defs>
                          <linearGradient id="gradientSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fa709a" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#fee140" stopOpacity={0.7}/>
                          </linearGradient>
                        </defs>
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


        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;