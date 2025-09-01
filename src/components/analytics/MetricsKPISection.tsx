import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star, Clock } from 'lucide-react';
import { SessionMetrics } from '@/hooks/useSessionAnalytics';

interface MetricsKPISectionProps {
  metrics: SessionMetrics;
}

const MetricsKPISection: React.FC<MetricsKPISectionProps> = ({ metrics }) => {
  const output = metrics;

  // Función para parsear porcentaje
  const parsePercentage = (value: string): number => {
    return parseInt(value.replace('%', '')) || 0;
  };

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

  // Obtener valores
  const closingRate = parsePercentage(output.Tasa_de_Cierre);
  const satisfaction = output.Puntuación_Satisfacción_Cliente;
  const responseTime = output.Tiempo_Promedio_Respuesta_Vendedor;

  // Colores condicionales para tasa de cierre
  const getClosingRateColor = (rate: number) => {
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">KPIs Principales</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Probabilidad de Cierre */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Probabilidad de Cierre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold" style={{ color: getClosingRateColor(closingRate) }}>
                  {output.Tasa_de_Cierre}
                </span>
              </div>
              <Progress 
                value={closingRate} 
                className="h-2"
                style={{ 
                  '--progress-foreground': getClosingRateColor(closingRate) 
                } as React.CSSProperties}
              />
              <p className="text-sm text-muted-foreground">
                {closingRate > 60 
                  ? 'Excelente probabilidad' 
                  : closingRate >= 30 
                    ? 'Probabilidad moderada' 
                    : 'Baja probabilidad'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Satisfacción del Cliente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Satisfacción del Cliente (CSAT)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">{satisfaction}</span>
                <span className="text-sm text-muted-foreground">/ 5</span>
              </div>
              <div className="flex gap-1">
                {renderStars(satisfaction)}
              </div>
              <p className="text-sm text-muted-foreground">
                {satisfaction >= 4 
                  ? 'Cliente muy satisfecho' 
                  : satisfaction >= 3 
                    ? 'Cliente satisfecho' 
                    : satisfaction >= 2 
                      ? 'Cliente neutral' 
                      : 'Cliente insatisfecho'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tiempo de Respuesta */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Tiempo de Respuesta Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {formatResponseTime(responseTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {responseTime <= 30 
                  ? 'Respuesta muy rápida' 
                  : responseTime <= 60 
                    ? 'Respuesta rápida' 
                    : responseTime <= 120 
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

export default MetricsKPISection;