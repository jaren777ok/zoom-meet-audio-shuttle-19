import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SessionsList from '@/components/SessionsList';
import AppNavigation from '@/components/AppNavigation';
import { History, Calendar, Users } from 'lucide-react';

const Sessions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <AppNavigation />
        {/* Header */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <History className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">
              Historial de Sesiones
            </CardTitle>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              Revisa y reutiliza las configuraciones de reuniones anteriores para 
              ahorrar tiempo en futuras sesiones.
            </p>
          </CardHeader>
        </Card>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Historial Completo</h3>
              <p className="text-sm text-muted-foreground">
                Todas tus sesiones organizadas por fecha
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Configuraciones Guardadas</h3>
              <p className="text-sm text-muted-foreground">
                Reutiliza información de empresa y objetivos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <History className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Acceso Rápido</h3>
              <p className="text-sm text-muted-foreground">
                Carga configuraciones con un clic
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List Component */}
        <SessionsList />
      </div>
    </div>
  );
};

export default Sessions;