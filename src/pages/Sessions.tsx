import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import SessionsList from '@/components/SessionsList';
import AppNavigation from '@/components/AppNavigation';
import DateFilter, { DateRange } from '@/components/DateFilter';
import { useMeetingSessions } from '@/hooks/useMeetingSessions';
import { History, Calendar, Users, Search } from 'lucide-react';
import Silk from '@/components/Silk';

const Sessions: React.FC = () => {
  const { sessions } = useMeetingSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const filteredSessions = useMemo(() => {
    let filtered = sessions;
    
    // Apply date filter
    if (dateRange?.from) {
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.created_at);
        const fromDate = dateRange.from!;
        const toDate = dateRange.to || dateRange.from!;

        const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
        const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
        const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59);

        return sessionDateOnly >= fromDateOnly && sessionDateOnly <= toDateOnly;
      });
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session => 
        session.session_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.company_info.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.meeting_objective.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [sessions, searchTerm, dateRange]);

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

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nombre, empresa u objetivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DateFilter
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Filtrar por fecha"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sessions List Component */}
        <SessionsList filteredSessions={filteredSessions} />
      </div>
    </div>
    </div>
  );
};

export default Sessions;