import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, Users, Zap } from 'lucide-react';
import { VendorMetrics } from '@/hooks/useCompanyMetrics';
import { useVendorMetrics } from '@/hooks/useVendorMetrics';
import DateFilter from '@/components/DateFilter';
import { format } from 'date-fns';

interface VendorMetricsModalProps {
  vendor: VendorMetrics;
  isOpen: boolean;
  onClose: () => void;
}

export const VendorMetricsModal: React.FC<VendorMetricsModalProps> = ({
  vendor,
  isOpen,
  onClose
}) => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  const { data: metricsData, isLoading } = useVendorMetrics(vendor.vendor_id, dateRange);

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
          ) : (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData?.totalSessions || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calidad Promedio</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData?.avgQuality || 0}%</div>
                    <Badge 
                      variant="secondary" 
                      className={`${getQualityColor(metricsData?.avgQuality || 0)} text-white mt-1`}
                    >
                      {getQualityText(metricsData?.avgQuality || 0)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metricsData?.avgDuration || 0}m</div>
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
                        {metricsData?.qualityDistribution.excellent || 0} sesiones
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Buena (60-79%)</span>
                      </div>
                      <Badge variant="outline">
                        {metricsData?.qualityDistribution.good || 0} sesiones
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Pobre (&lt;60%)</span>
                      </div>
                      <Badge variant="outline">
                        {metricsData?.qualityDistribution.poor || 0} sesiones
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle>Sesiones Recientes</CardTitle>
                  <CardDescription>
                    Últimas 10 sesiones del vendedor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metricsData?.recentSessions?.length ? (
                      metricsData.recentSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{session.session_name || 'Sesión sin nombre'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.internet_quality_start && (
                              <Badge 
                                variant="secondary"
                                className={`${getQualityColor(session.internet_quality_start)} text-white`}
                              >
                                {session.internet_quality_start}%
                              </Badge>
                            )}
                            <Badge variant="outline">
                              {session.analysis_status || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No hay sesiones registradas para este vendedor en el período seleccionado.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};