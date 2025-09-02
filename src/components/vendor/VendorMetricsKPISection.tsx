import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { VendorMetricsData } from '@/hooks/useVendorMetrics';

interface VendorMetricsKPISectionProps {
  metricsData: VendorMetricsData;
}

const VendorMetricsKPISection: React.FC<VendorMetricsKPISectionProps> = ({ metricsData }) => {
  // Función para convertir segundos a tiempo legible
  const formatResponseTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const remainingMinutes = Math.floor((seconds % 3600) / 60);
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  };

  // Función para formatear dinero
  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Colores condicionales para tasa de conversión
  const getConversionRateColor = (rate: number) => {
    if (rate > 60) return 'hsl(var(--success))';
    if (rate >= 30) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  // Renderizar estrellas
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'fill-muted text-muted-foreground'
        }`}
      />
    ));
  };

  // Calcular tiempo promedio de respuesta de todas las sesiones
  const avgResponseTime = metricsData.detailedSessions
    .filter(s => s.metricas_json?.Tiempo_Promedio_Respuesta_Vendedor)
    .reduce((sum, s, _, arr) => {
      const time = s.metricas_json?.Tiempo_Promedio_Respuesta_Vendedor || 0;
      return sum + time / arr.length;
    }, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">KPIs del Vendedor</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasa de Conversión */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tasa de Conversión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: getConversionRateColor(metricsData.conversionRate) }}>
                  {metricsData.conversionRate}%
                </span>
              </div>
              <Progress 
                value={metricsData.conversionRate} 
                className="h-2"
                style={{ 
                  '--progress-foreground': getConversionRateColor(metricsData.conversionRate) 
                } as React.CSSProperties}
              />
              <p className="text-sm text-muted-foreground">
                {metricsData.conversionRate > 60 
                  ? 'Excelente conversión' 
                  : metricsData.conversionRate >= 30 
                    ? 'Conversión moderada' 
                    : 'Baja conversión'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Satisfacción Promedio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Satisfacción Promedio (CSAT)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{metricsData.avgSatisfaction}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <div className="flex gap-1">
                {renderStars(Math.round(metricsData.avgSatisfaction))}
              </div>
              <p className="text-sm text-muted-foreground">
                {metricsData.avgSatisfaction >= 4 
                  ? 'Clientes muy satisfechos' 
                  : metricsData.avgSatisfaction >= 3 
                    ? 'Clientes satisfechos' 
                    : metricsData.avgSatisfaction >= 2 
                      ? 'Clientes neutrales' 
                      : 'Clientes insatisfechos'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos Totales */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold text-foreground">
                {formatMoney(metricsData.totalRevenue)}
              </span>
              <p className="text-sm text-muted-foreground">
                {metricsData.totalSales} ventas realizadas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tiempo de Respuesta Promedio */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Tiempo de Respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {formatResponseTime(Math.round(avgResponseTime))}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {avgResponseTime <= 30 
                  ? 'Respuesta muy rápida' 
                  : avgResponseTime <= 60 
                    ? 'Respuesta rápida' 
                    : avgResponseTime <= 120 
                      ? 'Respuesta normal' 
                      : 'Respuesta lenta'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorMetricsKPISection;