import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  Timer, 
  Zap, 
  Activity, 
  Signal,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { SessionAnalytic } from '@/hooks/useSessionAnalytics';

interface ConnectivityMetricsSectionProps {
  session: SessionAnalytic;
}

const ConnectivityMetricsSection: React.FC<ConnectivityMetricsSectionProps> = ({ session }) => {
  // Early return if no connectivity data
  if (!session.internet_quality_start && !session.session_duration_minutes) {
    return null;
  }

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Get quality badge variant and color
  const getQualityBadge = (quality: number) => {
    if (quality >= 8) return { variant: 'default', color: 'text-green-500', label: 'Excelente' };
    if (quality >= 6) return { variant: 'secondary', color: 'text-blue-500', label: 'Buena' };
    if (quality >= 4) return { variant: 'secondary', color: 'text-yellow-500', label: 'Regular' };
    if (quality >= 2) return { variant: 'secondary', color: 'text-orange-500', label: 'Mala' };
    return { variant: 'destructive', color: 'text-red-500', label: 'Muy Mala' };
  };

  // Get stability badge
  const getStabilityBadge = (score: number) => {
    if (score >= 8) return { variant: 'default', color: 'text-green-500', label: 'Muy Estable' };
    if (score >= 6) return { variant: 'secondary', color: 'text-blue-500', label: 'Estable' };
    if (score >= 4) return { variant: 'secondary', color: 'text-yellow-500', label: 'Regular' };
    return { variant: 'destructive', color: 'text-red-500', label: 'Inestable' };
  };

  // Calculate quality change
  const getQualityChange = () => {
    if (!session.internet_quality_start || !session.internet_quality_end) return null;
    const change = session.internet_quality_end - session.internet_quality_start;
    if (change > 0) return { icon: TrendingUp, color: 'text-green-500', text: `+${change}` };
    if (change < 0) return { icon: TrendingDown, color: 'text-red-500', text: `${change}` };
    return { icon: Minus, color: 'text-muted-foreground', text: '0' };
  };

  const qualityStart = session.internet_quality_start ? getQualityBadge(session.internet_quality_start) : null;
  const qualityEnd = session.internet_quality_end ? getQualityBadge(session.internet_quality_end) : null;
  const stability = session.connection_stability_score ? getStabilityBadge(session.connection_stability_score) : null;
  const qualityChange = getQualityChange();

  return (
    <Card className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Wifi className="h-5 w-5" />
          Métricas de Conectividad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Session Duration */}
          {session.session_duration_minutes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">Duración de Sesión</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(session.session_duration_minutes)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tiempo total de grabación
              </p>
            </div>
          )}

          {/* Internet Quality Start */}
          {session.internet_quality_start && qualityStart && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">Calidad Inicial</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{session.internet_quality_start}/10</span>
                <Badge variant={qualityStart.variant as any} className="text-xs">
                  {qualityStart.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Al iniciar la sesión
              </p>
            </div>
          )}

          {/* Internet Quality End */}
          {session.internet_quality_end && qualityEnd && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Signal className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">Calidad Final</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{session.internet_quality_end}/10</span>
                <Badge variant={qualityEnd.variant as any} className="text-xs">
                  {qualityEnd.label}
                </Badge>
                {qualityChange && (
                  <div className={`flex items-center gap-1 text-xs ${qualityChange.color}`}>
                    <qualityChange.icon className="h-3 w-3" />
                    {qualityChange.text}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Al finalizar la sesión
              </p>
            </div>
          )}

          {/* Connection Stability */}
          {session.connection_stability_score && stability && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-muted-foreground">Estabilidad</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{session.connection_stability_score.toFixed(1)}/10</span>
                <Badge variant={stability.variant as any} className="text-xs">
                  {stability.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Consistencia durante la sesión
              </p>
            </div>
          )}
        </div>

        {/* Additional Network Details */}
        {(session.network_type || session.avg_connection_speed) && (
          <div className="mt-6 pt-4 border-t border-blue-200/50 dark:border-blue-800/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {session.network_type && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Tipo de Red</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {session.network_type.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              )}
              
              {session.avg_connection_speed && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-cyan-50/50 dark:bg-cyan-950/20">
                  <Signal className="h-4 w-4 text-cyan-600" />
                  <div>
                    <p className="text-sm font-medium">Velocidad Promedio</p>
                    <p className="text-xs text-muted-foreground">
                      {session.avg_connection_speed.toFixed(1)} Mbps
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quality Impact Assessment */}
        {session.internet_quality_start && session.connection_stability_score && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200/30 dark:border-blue-800/20">
            <div className="text-sm">
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Impacto en la Sesión: 
              </span>
              <span className="ml-2 text-muted-foreground">
                {session.internet_quality_start >= 7 && session.connection_stability_score >= 7 
                  ? 'Condiciones óptimas para una sesión de ventas exitosa' 
                  : session.internet_quality_start >= 5 && session.connection_stability_score >= 5
                    ? 'Buenas condiciones con algunas fluctuaciones menores'
                    : 'La calidad de conexión pudo haber afectado la experiencia'}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectivityMetricsSection;