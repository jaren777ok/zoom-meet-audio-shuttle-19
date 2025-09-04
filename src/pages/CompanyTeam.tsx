import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  Search, 
  Filter, 
  Trophy,
  TrendingUp,
  DollarSign,
  Star,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useCompanyMetrics } from '@/hooks/useCompanyMetrics';
import CompanyNavigation from '@/components/CompanyNavigation';
import VendorCard from '@/components/VendorCard';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { toast } from '@/hooks/use-toast';
import Silk from '@/components/Silk';

const CompanyTeam = () => {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'performance' | 'sales' | 'sessions' | 'satisfaction'>('performance');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { 
    vendorMetrics, 
    isLoadingVendorMetrics,
    companyMetrics
  } = useCompanyMetrics(dateRange);

  // Filter and sort vendors
  const filteredAndSortedVendors = vendorMetrics
    .filter(vendor => 
      vendor.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendor_email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return b.performance_score - a.performance_score;
        case 'sales':
          return b.total_sales - a.total_sales;
        case 'sessions':
          return b.total_sessions - a.total_sessions;
        case 'satisfaction':
          return b.avg_satisfaction - a.avg_satisfaction;
        default:
          return 0;
      }
    });

  const handleViewVendorDetails = (vendorId: string) => {
    // The modal is handled directly by the VendorProfileCard component
    // This callback is just for consistency with the interface
  };

  const handleViewSessionDetails = (sessionId: string) => {
    navigate(`/company/analytics/${sessionId}`);
  };

  if (isLoadingVendorMetrics) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Silk
            speed={6}
            scale={1}
          color="#172B7D"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <div className="relative z-10">
          <div className="p-4">
            <CompanyNavigation />
          </div>
          <div className="px-4 pb-4">
            <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Skeleton key={index} className="h-80" />
              ))}
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Silk
          speed={6}
          scale={1}
          color="#172B7D"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="relative z-10">
        <div className="p-4">
          <CompanyNavigation />
        </div>
        
        <div className="px-4 pb-4">
          <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Equipo de Vendedores
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona y supervisa el rendimiento de tu equipo
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {vendorMetrics.length} vendedores activos
            </Badge>
          </div>


          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <DateRangeFilter
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                  
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar por:</span>
                    <div className="flex gap-1 flex-wrap">
                      {[
                        { key: 'performance', label: 'Rendimiento' },
                        { key: 'sales', label: 'Ventas' },
                        { key: 'sessions', label: 'Sesiones' },
                        { key: 'satisfaction', label: 'Satisfacción' }
                      ].map(({ key, label }) => (
                        <Button
                          key={key}
                          variant={sortBy === key ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy(key as typeof sortBy)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top 10 Performers */}
          {filteredAndSortedVendors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Top 10 Mejores Vendedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredAndSortedVendors.slice(0, 10).map((vendor, index) => (
                    <div key={vendor.id} className="relative">
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-yellow-600 text-white">
                            🏆 #1
                          </Badge>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-gray-400 text-white">
                            🥈 #2
                          </Badge>
                        </div>
                      )}
                      {index === 2 && (
                        <div className="absolute -top-2 -right-2 z-10">
                          <Badge className="bg-amber-600 text-white">
                            🥉 #3
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
              </CardContent>
            </Card>
          )}

          {/* All Other Vendors */}
          {filteredAndSortedVendors.length > 10 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Otros Vendedores ({filteredAndSortedVendors.length - 10})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredAndSortedVendors.slice(10).map((vendor, index) => (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      rank={index + 11}
                      onViewDetails={handleViewVendorDetails}
                      onViewSessionDetails={handleViewSessionDetails}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results States */}
          {filteredAndSortedVendors.length === 0 && (
            <Card>
              <CardContent className="py-12">
                {searchTerm ? (
                  <div className="text-center text-muted-foreground">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2">No se encontraron vendedores</p>
                    <p className="text-sm">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg mb-2">No hay vendedores asociados</p>
                    <p className="text-sm">
                      Los vendedores aparecerán aquí cuando se asocien a tu empresa
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyTeam;