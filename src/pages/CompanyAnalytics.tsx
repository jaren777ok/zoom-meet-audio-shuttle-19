import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart3, RefreshCw } from 'lucide-react';
import { ImageModal } from '@/components/ImageModal';
import CompanyNavigation from '@/components/CompanyNavigation';
import MetricsKPISection from '@/components/analytics/MetricsKPISection';
import ClientClassificationSection from '@/components/analytics/ClientClassificationSection';
import ConversionsResultsSection from '@/components/analytics/ConversionsResultsSection';
import LostSaleAnalysis from '@/components/analytics/LostSaleAnalysis';
import ConnectivityMetricsSection from '@/components/analytics/ConnectivityMetricsSection';
import { AnalysisContent } from '@/components/analytics/AnalysisContent';
import { useCompanySessionAnalytics } from '@/hooks/useCompanySessionAnalytics';
import Silk from '@/components/Silk';

const CompanyAnalytics: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  
  const {
    isLoading,
    refreshSessions,
    getSessionBySessionId,
    parseMetrics,
  } = useCompanySessionAnalytics();

  // Load the specific session when sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) return;
      
      setSessionLoading(true);
      try {
        const session = await getSessionBySessionId(sessionId);
        setSelectedSession(session);
      } catch (err) {
        console.error('Error loading session:', err);
        setSelectedSession(null);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();
  }, [sessionId, getSessionBySessionId]);
  const metrics = selectedSession ? parseMetrics(selectedSession) : null;

  // If no sessionId or session not found, show error
  if (!sessionId || (!isLoading && !sessionLoading && !selectedSession)) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Silk
            speed={6}
            scale={1}
          color="#172B7D"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <div className="relative z-10 p-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <CompanyNavigation />
            
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sesión no encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    La sesión solicitada no existe o no tienes permisos para verla.
                  </p>
                  <Button onClick={() => navigate('/company')}>
                    Volver al Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || sessionLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Silk
            speed={5}
            scale={1}
            color="#7B7481"
            noiseIntensity={1.5}
            rotation={0}
          />
        </div>
        <div className="relative z-10 p-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <CompanyNavigation />
            
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>
      <div className="relative z-10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <CompanyNavigation />
        
        {/* Header de detalle */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/company')}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">
                    {metrics?.Titulo || 
                     selectedSession?.session_name || 
                     `Sesión ${selectedSession?.session_id}`}
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {selectedSession && new Date(selectedSession.created_at).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                
                {selectedSession?.url && (
                  <div className="ml-6">
                    <div className="text-sm text-muted-foreground mb-2">Foto del Vendedor</div>
                    <img 
                      src={selectedSession.url} 
                      alt="Foto del vendedor en la reunión"
                      className="w-24 h-24 rounded-lg object-cover border-2 border-border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        setSelectedImage({ 
                          url: selectedSession.url!, 
                          alt: "Foto del vendedor en la reunión" 
                        });
                        setImageModalOpen(true);
                      }}
                    />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                onClick={refreshSessions}
                disabled={isLoading}
                className="gap-2 shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Contenido del análisis */}
        {metrics ? (
          <div className="space-y-8">
            {/* Métricas de Conectividad */}
            {selectedSession && <ConnectivityMetricsSection session={selectedSession} />}
            
            {/* KPIs Principales */}
            <MetricsKPISection metrics={metrics} />
            
            {/* Clasificación del Cliente */}
            <ClientClassificationSection metrics={metrics} />
            
            {/* Conversiones y Resultados */}
            <ConversionsResultsSection metrics={metrics} />
            
            {/* Análisis de Venta Perdida (condicional) */}
            <LostSaleAnalysis metrics={metrics} />
            
            {/* Análisis en Markdown */}
            {selectedSession?.analisis_markdown && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Análisis Detallado</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-slate dark:prose-invert max-w-none">
                  <AnalysisContent markdown={selectedSession.analisis_markdown} />
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Análisis en Proceso</h3>
                <p className="text-muted-foreground">
                  {selectedSession?.analysis_status === 'pending' 
                    ? 'El análisis de esta sesión está pendiente.'
                    : selectedSession?.analysis_status === 'processing'
                      ? 'Estamos analizando los datos de la sesión.'
                      : 'No hay datos de análisis disponibles.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Image Modal */}
        {selectedImage && (
          <ImageModal
            isOpen={imageModalOpen}
            onClose={() => {
              setImageModalOpen(false);
              setSelectedImage(null);
            }}
            imageUrl={selectedImage.url}
            altText={selectedImage.alt}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default CompanyAnalytics;