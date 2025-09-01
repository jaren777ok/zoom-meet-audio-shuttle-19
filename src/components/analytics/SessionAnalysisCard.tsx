import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp, TrendingDown } from 'lucide-react';
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
    if (!session.metricas_json || !Array.isArray(session.metricas_json) || session.metricas_json.length === 0) {
      return null;
    }

    try {
      const metrics = session.metricas_json[0]?.output;
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

  const quickMetrics = getQuickMetrics();
  const formattedDate = new Date(session.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border-muted hover:border-primary/20"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            Sesión {session.session_id.slice(-8)}
          </CardTitle>
          {getStatusBadge(session.analysis_status)}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {quickMetrics ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Prob. Cierre</p>
                  <p className="font-semibold text-sm">{quickMetrics.closingRate}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full mr-1 ${
                        i < quickMetrics.satisfaction ? 'bg-yellow-400' : 'bg-gray-200'
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
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Carrito Abandonado</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">
              {session.analysis_status === 'pending' ? 'Esperando análisis...' : 'Sin datos disponibles'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionAnalysisCard;