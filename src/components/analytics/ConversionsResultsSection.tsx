import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { SessionMetrics } from '@/hooks/useSessionAnalytics';

interface ConversionsResultsSectionProps {
  metrics: SessionMetrics;
}

const ConversionsResultsSection: React.FC<ConversionsResultsSectionProps> = ({ metrics }) => {
  // Función para parsear NPS
  const parseNPS = (value: string): number => {
    return parseInt(value.replace('%', '')) || 0;
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

  // Función para obtener color del NPS
  const getNPSColor = (nps: number) => {
    if (nps >= 70) return 'hsl(var(--success))';
    if (nps >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  // Función para obtener estado del carrito con color y ícono
  const getCartStatusData = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recuperado':
        return { 
          color: 'text-green-600', 
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          icon: '✅'
        };
      case 'abandonado':
        return { 
          color: 'text-red-600', 
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          icon: '❌'
        };
      case 'pendiente':
        return { 
          color: 'text-yellow-600', 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          icon: '⏳'
        };
      default:
        return { 
          color: 'text-gray-600', 
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icon: '🛒'
        };
    }
  };

  const npsScore = parseNPS(metrics.Net_Promoter_Score);
  const cartStatusData = getCartStatusData(metrics['Estado Final del Carrito']);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Conversiones y Resultados</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Conversiones */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Conversiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-3xl font-bold text-foreground">
                {metrics.Conversiones}
              </span>
              <p className="text-sm text-muted-foreground">
                {metrics.Conversiones > 0 
                  ? metrics.Conversiones === 1 
                    ? 'Conversión exitosa'
                    : 'Conversiones exitosas'
                  : 'Sin conversiones'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ganancia en Dinero */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Ganancia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-3xl font-bold text-foreground">
                {formatMoney(metrics.Ganancia_en_Dinero)}
              </span>
              <p className="text-sm text-muted-foreground">
                {metrics.Ganancia_en_Dinero > 0 
                  ? 'Ingresos generados'
                  : 'Sin ingresos'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Net Promoter Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              NPS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: getNPSColor(npsScore) }}>
                  {metrics.Net_Promoter_Score}
                </span>
              </div>
              <Progress 
                value={npsScore} 
                className="h-2"
                style={{ 
                  '--progress-foreground': getNPSColor(npsScore) 
                } as React.CSSProperties}
              />
              <p className="text-sm text-muted-foreground">
                {npsScore >= 70 
                  ? 'Excelente NPS' 
                  : npsScore >= 50 
                    ? 'Buen NPS' 
                    : npsScore >= 0
                      ? 'NPS regular'
                      : 'NPS bajo'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estado del Carrito */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Estado del Carrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${cartStatusData.bgColor}`}>
                <span className="text-lg">{cartStatusData.icon}</span>
                <span className={`font-semibold ${cartStatusData.color}`}>
                  {metrics['Estado Final del Carrito']}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {metrics['Estado Final del Carrito'].toLowerCase() === 'recuperado' 
                  ? 'Carrito completado exitosamente'
                  : metrics['Estado Final del Carrito'].toLowerCase() === 'abandonado'
                    ? 'Carrito no completado'
                    : 'Carrito en proceso'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConversionsResultsSection;