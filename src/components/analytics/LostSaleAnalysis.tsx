import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react';
import { SessionMetrics } from '@/hooks/useSessionAnalytics';

interface LostSaleAnalysisProps {
  metrics: SessionMetrics;
}

const LostSaleAnalysis: React.FC<LostSaleAnalysisProps> = ({ metrics }) => {
  const output = metrics;

  // Solo mostrar si el carrito fue abandonado
  if (!output.Carrito_Abandonado) {
    return null;
  }

  // Función para obtener ícono del estado final
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recuperado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'abandonado':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Función para obtener color del estado final
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'recuperado':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'abandonado':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pendiente':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Análisis de Venta Perdida</h2>
      
      <Alert className="border-destructive/50 bg-destructive/10">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-destructive font-semibold">
          Venta No Realizada
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium text-foreground">Motivo del Abandono:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {output.Motivo_Principal_Abandono}
                </p>
              </div>
              
              <div>
                <span className="font-medium text-foreground">Punto de Fricción:</span>
                <p className="text-sm text-muted-foreground mt-1">
                  {output.punto_friccion}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="font-medium text-foreground">¿Se intentó recuperar?</span>
                <p className="text-sm mt-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    output.intento_recuperacion 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {output.intento_recuperacion ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Sí
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        No
                      </>
                    )}
                  </span>
                </p>
              </div>

              {output.intento_recuperacion && (
                <div>
                  <span className="font-medium text-foreground">Técnica Utilizada:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {output.Técnica_Recuperación_Utilizada}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-destructive/20">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Estado Final:</span>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(output['Estado Final del Carrito'])}`}>
                {getStatusIcon(output['Estado Final del Carrito'])}
                {output['Estado Final del Carrito']}
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default LostSaleAnalysis;