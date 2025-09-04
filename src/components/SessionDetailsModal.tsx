import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Building, Target, Calendar, Clock } from 'lucide-react';

interface SessionDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  session,
  isOpen,
  onClose
}) => {
  if (!session) return null;

  const formattedDate = new Date(session.created_at).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            Detalles de la Sesión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Session Name */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-primary mb-2">{session.session_name}</h3>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">{formattedDate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Number of People */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Número de Prospectos</h4>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {session.number_of_people} {session.number_of_people === 1 ? 'persona' : 'personas'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">Información de Productos</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {session.company_info}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Objective */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Target className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-2">Objetivo de la Sesión</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {session.meeting_objective}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};