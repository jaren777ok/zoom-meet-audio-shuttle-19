import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, TrendingDown, Wifi, Timer, Zap } from 'lucide-react';
import { SessionAnalytic } from '@/hooks/useSessionAnalytics';

interface SessionAnalysisCardProps {
  session: SessionAnalytic;
  onClick: () => void;
}

const SessionAnalysisCard: React.FC<SessionAnalysisCardProps> = ({ session, onClick }) => {
  // Función para obtener el estado visual
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Completado</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Procesando</Badge>;
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
      className="group cursor-pointer transition-all duration-500 border-0 bg-gradient-to-br from-slate-800/80 via-slate-700/90 to-slate-900/80 backdrop-blur-sm hover:from-slate-700/90 hover:via-slate-600/90 hover:to-slate-800/90 shadow-2xl hover:shadow-3xl relative overflow-hidden"
      onClick={onClick}
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%,
            rgba(30, 41, 59, 0.9) 20%,
            rgba(51, 65, 85, 0.85) 40%,
            rgba(71, 85, 105, 0.9) 60%,
            rgba(30, 41, 59, 0.95) 80%,
            rgba(15, 23, 42, 0.98) 100%
          ),
          radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)
        `,
        boxShadow: `
          0 4px 20px rgba(0, 0, 0, 0.3),
          0 8px 32px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.1),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
        `,
        border: '1px solid rgba(148, 163, 184, 0.2)'
      }}
    >
      {/* Shine overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
          transform: 'translateX(-100%)',
          animation: 'group-hover:shine 0.8s ease-out forwards'
        }}
      />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate group-hover:text-blue-300 transition-colors duration-200 text-white drop-shadow-sm">
            {session.metricas_json?.Titulo || session.session_name || `Sesión ${session.session_id.slice(-8)}`}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(session.analysis_status)}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4 relative z-10">
        {/* Métricas principales */}
        {quickMetrics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="flex items-center gap-2 p-3 rounded-lg border border-blue-500/30 relative overflow-hidden"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(59, 130, 246, 0.1) 0%,
                      rgba(37, 99, 235, 0.15) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 0 rgba(59, 130, 246, 0.2),
                    0 2px 8px rgba(59, 130, 246, 0.1)
                  `
                }}
              >
                <TrendingUp className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-xs text-slate-300">Prob. Cierre</p>
                  <p className="font-semibold text-sm text-white">{quickMetrics.closingRate}</p>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-2 p-3 rounded-lg border border-yellow-500/30 relative overflow-hidden"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(234, 179, 8, 0.1) 0%,
                      rgba(202, 138, 4, 0.15) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 0 rgba(234, 179, 8, 0.2),
                    0 2px 8px rgba(234, 179, 8, 0.1)
                  `
                }}
              >
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full mr-1 transition-colors ${
                        i < quickMetrics.satisfaction ? 'bg-yellow-400 shadow-sm' : 'bg-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <div>
                  <p className="text-xs text-slate-300">CSAT</p>
                  <p className="font-semibold text-sm text-white">{quickMetrics.satisfaction}/5</p>
                </div>
              </div>
            </div>

            {quickMetrics.abandoned && (
              <div 
                className="flex items-center gap-2 p-2 rounded-lg border border-red-500/30"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(239, 68, 68, 0.1) 0%,
                      rgba(220, 38, 38, 0.15) 100%
                    )
                  `,
                  boxShadow: `
                    inset 0 1px 0 rgba(239, 68, 68, 0.2),
                    0 2px 8px rgba(239, 68, 68, 0.1)
                  `
                }}
              >
                <TrendingDown className="h-4 w-4 text-red-400" />
                <span className="text-xs font-medium text-red-300">Carrito Abandonado</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="flex items-center gap-2 text-slate-400 p-3 rounded-lg border border-slate-600/30"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(51, 65, 85, 0.3) 0%,
                  rgba(30, 41, 59, 0.4) 100%
                )
              `,
              boxShadow: 'inset 0 1px 0 rgba(148, 163, 184, 0.1)'
            }}
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {session.analysis_status === 'pending' ? 'Esperando análisis...' : 'Sin datos disponibles'}
            </span>
          </div>
        )}

        {/* Métricas de conectividad */}
        {connectivityMetrics && (
          <div className="border-t border-slate-600/50 pt-3 space-y-2">
            <h4 className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <Wifi className="h-3 w-3" />
              Métricas de Conectividad
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div 
                className="flex items-center gap-2 p-2 rounded border border-blue-500/30"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(59, 130, 246, 0.08) 0%,
                      rgba(37, 99, 235, 0.12) 100%
                    )
                  `
                }}
              >
                <Zap className="h-3 w-3 text-blue-400" />
                <div>
                  <p className="text-slate-300">Calidad Internet</p>
                  <p className="font-medium text-white">
                    {connectivityMetrics.qualityStart || 'N/A'}/10
                    {connectivityMetrics.qualityEnd && connectivityMetrics.qualityEnd !== connectivityMetrics.qualityStart && (
                      <span className="text-slate-400 ml-1">→ {connectivityMetrics.qualityEnd}/10</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-2 p-2 rounded border border-green-500/30"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(34, 197, 94, 0.08) 0%,
                      rgba(22, 163, 74, 0.12) 100%
                    )
                  `
                }}
              >
                <Timer className="h-3 w-3 text-green-400" />
                <div>
                  <p className="text-slate-300">Duración</p>
                  <p className="font-medium text-white">{formatDuration(connectivityMetrics.duration)}</p>
                </div>
              </div>
              
              {connectivityMetrics.stabilityScore > 0 && (
                <div 
                  className="col-span-2 flex items-center gap-2 p-2 rounded border border-purple-500/30"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(168, 85, 247, 0.08) 0%,
                        rgba(147, 51, 234, 0.12) 100%
                      )
                    `
                  }}
                >
                  <div className="flex items-center gap-1">
                    <div className={`h-2 w-2 rounded-full ${
                      connectivityMetrics.stabilityScore >= 8 ? 'bg-green-400' :
                      connectivityMetrics.stabilityScore >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <span className="text-slate-300">Estabilidad:</span>
                  </div>
                  <span className="font-medium text-white">{connectivityMetrics.stabilityScore.toFixed(1)}/10</span>
                  <span className="text-slate-400 text-xs capitalize ml-auto">
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