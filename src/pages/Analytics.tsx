import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Search, BarChart3, RefreshCw } from 'lucide-react';
import { marked } from 'marked';
import AppNavigation from '@/components/AppNavigation';
import SessionAnalysisCard from '@/components/analytics/SessionAnalysisCard';
import MetricsKPISection from '@/components/analytics/MetricsKPISection';
import ClientClassificationSection from '@/components/analytics/ClientClassificationSection';
import LostSaleAnalysis from '@/components/analytics/LostSaleAnalysis';
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics';

// Component for rendering analysis content
const AnalysisContent: React.FC<{ markdown: string }> = ({ markdown }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');

  useEffect(() => {
    const convertMarkdown = async () => {
      const html = await marked(markdown);
      setHtmlContent(html);
    };
    convertMarkdown();
  }, [markdown]);

  return (
    <div 
      className="prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

const Analytics: React.FC = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    sessions,
    isLoading,
    error,
    refreshSessions,
    getSessionBySessionId,
    parseMetrics,
  } = useSessionAnalytics();

  // Si hay sessionId en la URL, mostrar vista detalle
  const selectedSession = sessionId ? getSessionBySessionId(sessionId) : null;
  const metrics = selectedSession ? parseMetrics(selectedSession) : null;

  // Filtrar sesiones por búsqueda
  const filteredSessions = sessions.filter(session =>
    session.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.analysis_status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para convertir markdown a HTML
  const convertMarkdownToHTML = async (markdown: string): Promise<string> => {
    return await marked(markdown);
  };

  // Vista detalle de sesión
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <AppNavigation />
          
          {/* Header de detalle */}
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/analytics')}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl font-bold">
                    Análisis de Sesión {selectedSession.session_id.slice(-8)}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    {new Date(selectedSession.created_at).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Contenido del análisis */}
          {metrics ? (
            <div className="space-y-8">
              {/* KPIs Principales */}
              <MetricsKPISection metrics={metrics} />
              
              {/* Clasificación del Cliente */}
              <ClientClassificationSection metrics={metrics} />
              
              {/* Análisis de Venta Perdida (condicional) */}
              <LostSaleAnalysis metrics={metrics} />
              
              {/* Análisis en Markdown */}
              {selectedSession.analisis_markdown && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">Análisis Detallado</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                    {selectedSession.analysis_status === 'pending' 
                      ? 'El análisis de esta sesión está pendiente.'
                      : selectedSession.analysis_status === 'processing'
                        ? 'Estamos analizando los datos de tu sesión.'
                        : 'No hay datos de análisis disponibles.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Vista principal de lista
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <AppNavigation />
        
        {/* Header principal */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              Análisis de Rendimiento
            </CardTitle>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Revisa el rendimiento de tus sesiones de ventas y obtén insights 
              detallados sobre cada interacción con clientes.
            </p>
          </CardHeader>
        </Card>

        {/* Barra de búsqueda y controles */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID de sesión o estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={refreshSessions}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de sesiones */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-destructive font-medium mb-2">Error al cargar sesiones</p>
                  <p className="text-muted-foreground text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={refreshSessions}
                    className="mt-4"
                  >
                    Intentar de nuevo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? 'No se encontraron sesiones' : 'No hay sesiones analizadas'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Intenta con diferentes términos de búsqueda.'
                      : 'Las sesiones aparecerán aquí después de completar reuniones.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => (
                <SessionAnalysisCard
                  key={session.id}
                  session={session}
                  onClick={() => navigate(`/analytics/${session.session_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;