import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, Clock, Wifi, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { SessionAnalytic } from '@/hooks/useSessionAnalytics';
import MetricsKPISection from '@/components/analytics/MetricsKPISection';
import ClientClassificationSection from '@/components/analytics/ClientClassificationSection';
import ConversionsResultsSection from '@/components/analytics/ConversionsResultsSection';
import ConnectivityMetricsSection from '@/components/analytics/ConnectivityMetricsSection';
import LostSaleAnalysis from '@/components/analytics/LostSaleAnalysis';
import { AnalysisContent } from '@/components/analytics/AnalysisContent';
import { ImageModal } from '@/components/ImageModal';
import { RecordingLinkEditor } from '@/components/RecordingLinkEditor';

interface VendorSessionAnalysisModalProps {
  session: SessionAnalytic | null;
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  vendorName?: string;
  vendorPhotoUrl?: string;
}

export const VendorSessionAnalysisModal: React.FC<VendorSessionAnalysisModalProps> = ({
  session,
  isOpen,
  onClose,
  onBack,
  vendorName,
  vendorPhotoUrl
}) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Vendedor</p>
                  <div className="flex items-center gap-3">
                    {session.url ? (
                      <div 
                        className="w-16 h-16 rounded-full overflow-hidden border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsImageModalOpen(true)}
                      >
                        <img
                          src={session.url}
                          alt={vendorName || 'Vendedor'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-medium">{vendorName || 'Vendedor'}</p>
                      {session.url && (
                        <button
                          onClick={() => setIsImageModalOpen(true)}
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Ver foto de la sesión
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre de la Sesión</p>
                  <p className="text-lg">{session.session_name || 'Sesión sin nombre'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha</p>
                  <p className="text-lg">{format(new Date(session.created_at), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duración</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">
                      {session.session_duration_minutes ? `${Math.round(session.session_duration_minutes)}m` : 'No disponible'}
                    </p>
                  </div>
                </div>
              </div>
              
            </CardContent>
          </Card>

          {/* Recording Link Section */}
          <RecordingLinkEditor
            recordingUrl={session.recording_url}
            sessionId={session.session_id}
            onUpdate={async () => Promise.resolve(false)} // Company view - read only
            isReadOnly={true}
          />

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

              {/* Connectivity Metrics */}
              <ConnectivityMetricsSection session={session} />

              {/* Conversions and Results */}
              <ConversionsResultsSection metrics={parsedMetrics} />

              {/* Lost Sale Analysis (if applicable) */}
              <LostSaleAnalysis metrics={parsedMetrics} />

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
        
        {/* Image Modal */}
        {session.url && (
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageUrl={session.url}
            altText={`Foto de la sesión - ${vendorName || 'Vendedor'}`}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};