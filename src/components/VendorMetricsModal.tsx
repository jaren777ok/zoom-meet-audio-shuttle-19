import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';
import { useVendorMetrics, getSessionDetails } from '@/hooks/useVendorMetrics';
import { useQuery } from '@tanstack/react-query';
import DateFilter from '@/components/DateFilter';
import { format } from 'date-fns';
import VendorMetricsKPISection from '@/components/vendor/VendorMetricsKPISection';
import VendorDetailedSessionsList from '@/components/vendor/VendorDetailedSessionsList';
import { VendorSessionAnalysisModal } from '@/components/vendor/VendorSessionAnalysisModal';

interface VendorMetricsModalProps {
  vendor: VendorMetrics;
  isOpen: boolean;
  onClose: () => void;
  onViewSessionDetails?: (sessionId: string) => void;
}

export const VendorMetricsModal: React.FC<VendorMetricsModalProps> = ({
  vendor,
  isOpen,
  onClose,
  onViewSessionDetails
}) => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showSessionAnalysis, setShowSessionAnalysis] = useState(false);
  
  const { data: metricsData, isLoading } = useVendorMetrics(vendor.vendor_id, dateRange);
  
  // Query for session details when a session is selected
  const { data: sessionDetails, isLoading: sessionLoading } = useQuery({
    queryKey: ['session-details', selectedSessionId],
    queryFn: () => selectedSessionId ? getSessionDetails(selectedSessionId) : null,
    enabled: !!selectedSessionId && showSessionAnalysis,
  });

  const handleViewSessionDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowSessionAnalysis(true);
  };

  const handleBackToMetrics = () => {
    setShowSessionAnalysis(false);
    setSelectedSessionId(null);
  };

  const handleCloseModal = () => {
    setShowSessionAnalysis(false);
    setSelectedSessionId(null);
    onClose();
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 80) return 'bg-green-500';
    if (quality >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getQualityText = (quality: number) => {
    if (quality >= 80) return 'Excelente';
    if (quality >= 60) return 'Buena';
    return 'Pobre';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              {vendor.profile_photo_url ? (
                <img 
                  src={vendor.profile_photo_url} 
                  alt={vendor.vendor_name || 'Vendor'} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-semibold">
                  {(vendor.display_name || vendor.vendor_name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            Métricas de {vendor.display_name || vendor.vendor_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Filter */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Filtrar por fecha</h3>
            <DateFilter 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              placeholder="Seleccionar fechas"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : metricsData ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData.totalSessions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calidad Promedio</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData.avgQuality}%</div>
                    <Badge 
                      variant="secondary" 
                      className={`${getQualityColor(metricsData.avgQuality)} text-white mt-1`}
                    >
                      {getQualityText(metricsData.avgQuality)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData.avgDuration}m</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{vendor.performance_score}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* KPIs Principales */}
              <VendorMetricsKPISection metricsData={metricsData} />

              {/* Quality Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Calidad de Conexión</CardTitle>
                  <CardDescription>
                    Distribución de las sesiones por calidad de conexión
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Excelente (≥80%)</span>
                      </div>
                      <Badge variant="outline">
                        {metricsData.qualityDistribution.excellent} sesiones
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Buena (60-79%)</span>
                      </div>
                      <Badge variant="outline">
                        {metricsData.qualityDistribution.good} sesiones
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Pobre (&lt;60%)</span>
                      </div>
                      <Badge variant="outline">
                        {metricsData.qualityDistribution.poor} sesiones
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Sessions List */}
              <VendorDetailedSessionsList 
                sessions={metricsData.detailedSessions}
                onViewSessionDetails={handleViewSessionDetails}
              />
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No se pudieron cargar las métricas del vendedor.
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={handleCloseModal}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>

      {/* Session Analysis Modal */}
      <VendorSessionAnalysisModal
        session={sessionDetails || null}
        isOpen={showSessionAnalysis}
        onClose={handleCloseModal}
        onBack={handleBackToMetrics}
        vendorName={vendor.display_name || vendor.vendor_name}
      />
    </Dialog>
  );
};