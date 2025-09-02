import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { SessionAnalytic } from '@/hooks/useSessionAnalytics';
import MetricsKPISection from '@/components/analytics/MetricsKPISection';
import ClientClassificationSection from '@/components/analytics/ClientClassificationSection';
import ConversionsResultsSection from '@/components/analytics/ConversionsResultsSection';
import ConnectivityMetricsSection from '@/components/analytics/ConnectivityMetricsSection';
import LostSaleAnalysis from '@/components/analytics/LostSaleAnalysis';
import { AnalysisContent } from '@/components/analytics/AnalysisContent';

interface VendorSessionAnalysisModalProps {
  session: SessionAnalytic | null;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  vendorName?: string;
}

export const VendorSessionAnalysisModal: React.FC<VendorSessionAnalysisModalProps> = ({
  session,
  isOpen,
  onClose,
  onBack,
  vendorName
}) => {
  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBack}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              Análisis de Sesión
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Sesión no encontrada</p>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Volver a Métricas
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const parsedMetrics = (() => {
    try {
      if (session.metricas_json) {
        return typeof session.metricas_json === 'string' 
          ? JSON.parse(session.metricas_json) 
          : session.metricas_json;
      }
    } catch (error) {
      console.warn('Error parsing metrics JSON:', error);
    }
    return null;
  })();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Análisis Detallado de Sesión
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Info Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información de la Sesión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre de la Sesión</p>
                  <p className="text-lg">{session.session_name || 'Sesión sin nombre'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
                  <p className="text-lg">{vendorName || 'Vendedor'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                  <p className="text-lg">{format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Breadcrumb */}
          <div className="text-sm text-muted-foreground">
            <span>Métricas de Vendedor</span>
            <span className="mx-2">›</span>
            <span className="font-medium">Análisis de Sesión</span>
          </div>

          {parsedMetrics ? (
            <>
              {/* Main KPIs */}
              <MetricsKPISection metrics={parsedMetrics} />

              {/* Client Classification */}
              <ClientClassificationSection metrics={parsedMetrics} />

              {/* Conversions and Results */}
              <ConversionsResultsSection metrics={parsedMetrics} />

              {/* Connectivity Metrics */}
              <ConnectivityMetricsSection session={session} />

              {/* Detailed Analysis (Markdown) */}
              {session.analisis_markdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Análisis Detallado</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                    <AnalysisContent markdown={session.analisis_markdown} />
                  </CardContent>
                </Card>
              )}

              {/* Lost Sale Analysis (if applicable) */}
              <LostSaleAnalysis metrics={parsedMetrics} />
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-muted-foreground">
                  No hay métricas detalladas disponibles para esta sesión.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Volver a Métricas
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};