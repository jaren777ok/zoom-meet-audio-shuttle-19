import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Star, TrendingUp, ShoppingCart, Thermometer } from 'lucide-react';
import { VendorSession } from '@/hooks/useVendorMetrics';
import { format } from 'date-fns';

interface VendorDetailedSessionsListProps {
  sessions: VendorSession[];
  onViewSessionDetails?: (sessionId: string) => void;
}

const VendorDetailedSessionsList: React.FC<VendorDetailedSessionsListProps> = ({ 
  sessions, 
  onViewSessionDetails 
}) => {
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

  const getLeadTemperatureEmoji = (temperature: string): string => {
    switch (temperature?.toLowerCase()) {
      case 'caliente': return '🔥';
      case 'tibio': return '🌡️';
      case 'frío': return '❄️';
      default: return '🌡️';
    }
  };

  const getSentimentEmoji = (sentiment: string): string => {
    switch (sentiment?.toLowerCase()) {
      case 'positivo': return '😊';
      case 'negativo': return '😠';
      case 'neutro': return '😐';
      default: return '😐';
    }
  };

  const getCartStatusIcon = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'recuperado': return '✅';
      case 'abandonado': return '❌';
      case 'pendiente': return '⏳';
      default: return '🛒';
    }
  };

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-3 w-3 ${
          index < rating 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'fill-muted text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Análisis Detallado de Sesiones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sessions.length > 0 ? (
            sessions.map((session) => {
              const metrics = session.metricas_json;
              
              return (
                <div key={session.id} className="border rounded-lg p-4 space-y-3">
                  {/* Header de la sesión */}
                  <div className="flex items-center justify-between">
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
                      {onViewSessionDetails && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewSessionDetails(session.session_id)}
                        >
                          Ver Detalles
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Métricas de la sesión */}
                  {metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Satisfacción */}
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <div className="flex gap-1">
                          {renderStars(metrics.Puntuación_Satisfacción_Cliente || 0)}
                        </div>
                        <span className="text-sm font-medium">
                          CSAT: {metrics.Puntuación_Satisfacción_Cliente || 0}/5
                        </span>
                      </div>

                      {/* Temperatura del Lead */}
                      {metrics.Temperatura_Lead && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <Thermometer className="h-4 w-4" />
                          <span className="text-sm">
                            {getLeadTemperatureEmoji(metrics.Temperatura_Lead)} {metrics.Temperatura_Lead}
                          </span>
                        </div>
                      )}

                      {/* Conversiones y Ingresos */}
                      {(metrics.Conversiones > 0 || metrics.Ganancia_en_Dinero > 0) && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <div className="text-sm">
                            <div className="font-medium">{metrics.Conversiones} ventas</div>
                            <div className="text-green-600">{formatMoney(metrics.Ganancia_en_Dinero)}</div>
                          </div>
                        </div>
                      )}

                      {/* Estado del Carrito */}
                      {metrics['Estado Final del Carrito'] && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <ShoppingCart className="h-4 w-4" />
                          <span className="text-sm">
                            {getCartStatusIcon(metrics['Estado Final del Carrito'])} {metrics['Estado Final del Carrito']}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clasificación del Cliente */}
                  {metrics && (
                    <div className="flex gap-2 flex-wrap">
                      {metrics.Intención_compra && (
                        <Badge variant="outline" className="text-xs">
                          Intención: {metrics.Intención_compra}
                        </Badge>
                      )}
                      {metrics.Sentimiento_cliente && (
                        <Badge variant="outline" className="text-xs">
                          {getSentimentEmoji(metrics.Sentimiento_cliente)} {metrics.Sentimiento_cliente}
                        </Badge>
                      )}
                      {metrics.Tasa_de_Cierre && (
                        <Badge variant="outline" className="text-xs">
                          Cierre: {metrics.Tasa_de_Cierre}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay sesiones registradas para este vendedor en el período seleccionado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorDetailedSessionsList;