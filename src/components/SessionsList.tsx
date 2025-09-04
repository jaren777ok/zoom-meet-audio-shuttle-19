import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMeetingSessions } from '@/hooks/useMeetingSessions';
import { History, Users, Building, Target, Trash2, Play, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SessionDetailsModal } from './SessionDetailsModal';

interface SessionsListProps {
  onLoadSession?: (session: any) => void;
  filteredSessions?: any[];
}

const SessionsList: React.FC<SessionsListProps> = ({ onLoadSession, filteredSessions }) => {
  const { sessions, deleteSession } = useMeetingSessions();
  const displaySessions = filteredSessions || sessions;
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      toast({
        title: "Sesión eliminada",
        description: "La sesión se ha eliminado correctamente"
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleLoadSession = (session: any) => {
    if (onLoadSession) {
      onLoadSession({
        numberOfPeople: session.number_of_people,
        companyInfo: session.company_info,
        meetingObjective: session.meeting_objective
      });
      toast({
        title: "Configuración cargada",
        description: `Se ha cargado la configuración de "${session.session_name}"`
      });
    }
  };

  const handleViewDetails = (session: any) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Sesiones ({sessions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displaySessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No hay sesiones guardadas aún</p>
            <p className="text-sm">Las configuraciones de reuniones se guardarán aquí para reutilizar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displaySessions.map((session) => (
              <div
                key={session.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{session.session_name}</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(session)}
                      className="text-xs"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {onLoadSession && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadSession(session)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Usar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{session.number_of_people} personas</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{session.company_info.substring(0, 30)}...</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{session.meeting_objective.substring(0, 30)}...</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Creada: {new Date(session.created_at).toLocaleDateString()}</span>
                  <Badge variant="outline">
                    {new Date(session.created_at).toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <SessionDetailsModal
        session={selectedSession}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </Card>
  );
};

export default SessionsList;