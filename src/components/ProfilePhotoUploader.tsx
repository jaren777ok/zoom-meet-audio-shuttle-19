import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string;
  onPhotoUpdated: (newPhotoUrl: string) => void;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentPhotoUrl,
  onPhotoUpdated
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 10MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);
    try {
      // Convert file to binary
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Send to webhook
      const response = await fetch('https://cris.cloude.es/webhook/foto_perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: uint8Array,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.photo_url) {
        throw new Error('No se recibió la URL de la foto procesada');
      }

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ profile_photo_url: result.photo_url })
        .eq('id', user.id);

      if (error) throw error;

      onPhotoUpdated(result.photo_url);
      setSelectedFile(null);
      setPreviewUrl(null);
      toast.success('Foto de perfil actualizada correctamente');

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Foto de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={previewUrl || currentPhotoUrl} alt="Foto de perfil" />
            <AvatarFallback>
              <Camera className="h-8 w-8 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>

          {!selectedFile ? (
            <div className="text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Foto
                  </span>
                </Button>
              </label>
              <p className="text-sm text-muted-foreground mt-2">
                Requerimos una foto transparente de 1080x1080px
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading}
                className="min-w-[100px]"
              >
                {isUploading ? 'Subiendo...' : 'Subir Foto'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};