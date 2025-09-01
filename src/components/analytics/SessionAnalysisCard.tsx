import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, TrendingDown, Wifi, Timer, Zap } from 'lucide-react';
import { SessionAnalytic } from '@/hooks/useSessionAnalytics';
import { NetworkQualityIndicator } from '@/components/NetworkQualityIndicator';
import { NetworkQuality } from '@/hooks/useNetworkQuality';

interface SessionAnalysisCardProps {
  session: SessionAnalytic;
  onClick: () => void;
}

const SessionAnalysisCard: React.FC<SessionAnalysisCardProps> = ({ session, onClick }) => {
  // Función para obtener el estado visual
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completado</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Procesando</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendiente</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Función para obtener información básica de métricas
  const getQuickMetrics = () => {
    if (!session.metricas_json) {
      return null;
    }

    try {
      const metrics = session.metricas_json;
      if (!metrics) return null;

      return {
        closingRate: metrics.Tasa_de_Cierre || 'N/A',
        satisfaction: metrics.Puntuación_Satisfacción_Cliente || 0,
        abandoned: metrics.Carrito_Abandonado || false,
      };
    } catch {
      return null;
    }
  };

  // Función para obtener métricas de conectividad
  const getConnectivityMetrics = () => {
    if (!session.internet_quality_start && !session.session_duration_minutes) {
      return null;
    }

    return {
      qualityStart: session.internet_quality_start || 0,
      qualityEnd: session.internet_quality_end || 0,
      duration: session.session_duration_minutes || 0,
      stabilityScore: session.connection_stability_score || 0,
      networkType: session.network_type || 'unknown',
      avgSpeed: session.avg_connection_speed || 0,
    };
  };

  // Función para formatear duración
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const quickMetrics = getQuickMetrics();
  const connectivityMetrics = getConnectivityMetrics();
  const formattedDate = new Date(session.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card 
      className="group cursor-pointer transition-all duration-300 border-muted hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate group-hover:text-primary transition-colors duration-200">
            {session.metricas_json?.Titulo || session.session_name || `Sesión ${session.session_id.slice(-8)}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(session.analysis_status)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Métricas principales */}
        {quickMetrics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Prob. Cierre</p>
                  <p className="font-semibold text-sm">{quickMetrics.closingRate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full mr-1 transition-colors ${
                        i < quickMetrics.satisfaction ? 'bg-yellow-400' : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CSAT</p>
                  <p className="font-semibold text-sm">{quickMetrics.satisfaction}/5</p>
                </div>
              </div>
            </div>

            {quickMetrics.abandoned && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Carrito Abandonado</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground p-2 rounded-lg bg-muted/50">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {session.analysis_status === 'pending' ? 'Esperando análisis...' : 'Sin datos disponibles'}
            </span>
          </div>
        )}

        {/* Métricas de conectividad */}
        {connectivityMetrics && (
          <div className="border-t pt-3 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Métricas de Conectividad
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10">
                <Zap className="h-3 w-3 text-blue-500" />
                <div>
                  <p className="text-muted-foreground">Calidad Internet</p>
                  <p className="font-medium">
                    {connectivityMetrics.qualityStart || 'N/A'}/10
                    {connectivityMetrics.qualityEnd && connectivityMetrics.qualityEnd !== connectivityMetrics.qualityStart && (
                      <span className="text-muted-foreground ml-1">→ {connectivityMetrics.qualityEnd}/10</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded bg-green-500/10">
                <Timer className="h-3 w-3 text-green-500" />
                <div>
                  <p className="text-muted-foreground">Duración</p>
                  <p className="font-medium">{formatDuration(connectivityMetrics.duration)}</p>
                </div>
              </div>
              
              {connectivityMetrics.stabilityScore > 0 && (
                <div className="col-span-2 flex items-center gap-2 p-2 rounded bg-purple-500/10">
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${
                      connectivityMetrics.stabilityScore >= 8 ? 'bg-green-500' :
                      connectivityMetrics.stabilityScore >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="text-muted-foreground">Estabilidad:</span>
                  </div>
                  <span className="font-medium">{connectivityMetrics.stabilityScore.toFixed(1)}/10</span>
                  <span className="text-muted-foreground text-xs capitalize ml-auto">
                    {connectivityMetrics.networkType}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionAnalysisCard;