import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Edit3, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VendorNameEditorProps {
  currentDisplayName?: string;
  onNameUpdated: (newName: string) => void;
}

export const VendorNameEditor: React.FC<VendorNameEditorProps> = ({
  currentDisplayName,
  onNameUpdated
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (!user || !displayName.trim()) {
      toast.error('Por favor ingresa un nombre válido');
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      onNameUpdated(displayName.trim());
      setIsEditing(false);
      toast.success('Nombre actualizado correctamente');

    } catch (error) {
      console.error('Error updating display name:', error);
      toast.error('Error al actualizar el nombre. Inténtalo de nuevo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(currentDisplayName || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nombre de Display
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {currentDisplayName || 'Sin nombre configurado'}
              </p>
              <p className="text-sm text-muted-foreground">
                Este nombre aparecerá en el panel de la empresa
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Ingresa tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSave}
                disabled={isUpdating || !displayName.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUpdating}
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};