import React, { useState } from 'react';
import { VideoIcon, Edit3, Save, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface RecordingLinkEditorProps {
  recordingUrl?: string | null;
  sessionId: string;
  onUpdate: (sessionId: string, url: string) => Promise<boolean>;
  isReadOnly?: boolean;
}

export const RecordingLinkEditor: React.FC<RecordingLinkEditorProps> = ({
  recordingUrl,
  sessionId,
  onUpdate,
  isReadOnly = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputUrl, setInputUrl] = useState(recordingUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!inputUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El enlace no puede estar vacío",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await onUpdate(sessionId, inputUrl.trim());
      if (success) {
        setIsEditing(false);
        toast({
          title: "Éxito",
          description: "Enlace de grabación guardado correctamente",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el enlace",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al guardar el enlace",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setInputUrl(recordingUrl || '');
    setIsEditing(false);
  };

  const openRecording = () => {
    if (recordingUrl) {
      window.open(recordingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const isZoomMeetUrl = (url: string) => {
    return url.includes('zoom.us') || url.includes('meet.google.com') || url.includes('teams.microsoft.com');
  };

  return (
    <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm border border-border/50 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
          <VideoIcon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Enlace de Grabación</h3>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="relative">
            <Input
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://zoom.us/rec/... o cualquier enlace de grabación"
              className="pr-24"
              disabled={isLoading}
            />
            {inputUrl && isZoomMeetUrl(inputUrl) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Enlace de plataforma reconocida" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              size="sm"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Save className="w-4 h-4 mr-1" />
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recordingUrl ? (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border border-border/30">
              <div className="flex-1 text-sm text-muted-foreground truncate">
                {recordingUrl}
              </div>
              <div className="flex gap-1">
                <Button
                  onClick={openRecording}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                </Button>
                {!isReadOnly && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10"
                  >
                    <Edit3 className="w-4 h-4 text-primary" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">No hay enlace de grabación disponible</p>
              {!isReadOnly && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Agregar Enlace
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};