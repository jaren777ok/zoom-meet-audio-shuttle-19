import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, RotateCcw, Send, AlertCircle } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureProps {
  userId: string;
  onComplete: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ userId, onComplete }) => {
  const {
    isPermissionGranted,
    isRequestingPermission,
    isCapturing,
    capturedPhoto,
    isSending,
    error,
    videoRef,
    canvasRef,
    requestCameraPermission,
    capturePhoto,
    retakePhoto,
    sendPhotoToWebhook,
    stopCamera
  } = useCameraCapture({ 
    userId,
    onPhotoSent: () => {
      setTimeout(() => {
        stopCamera();
        onComplete();
      }, 1000);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleSendPhoto = async () => {
    await sendPhotoToWebhook();
  };

  return (
    <Card className="bg-card border-border backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-foreground">
          <Camera className="h-5 w-5 text-neon-cyan" />
          Verificación de Presentación Profesional
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Para brindarte el mejor coaching, necesitamos verificar tu presentación profesional antes de la sesión
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Camera Permission Request */}
        {!isPermissionGranted && !capturedPhoto && (
          <div className="text-center space-y-4">
            <div className="p-8 rounded-full bg-dark-surface mx-auto w-fit">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Acceso a Cámara Requerido</h3>
              <p className="text-sm text-muted-foreground">
                Necesitamos acceso a tu cámara para tomar una foto de verificación
              </p>
            </div>
            
            <Button
              onClick={requestCameraPermission}
              disabled={isRequestingPermission}
              className="w-full max-w-xs"
            >
              {isRequestingPermission ? 'Solicitando acceso...' : 'Activar Cámara'}
            </Button>
          </div>
        )}

        {/* Camera Preview */}
        {isPermissionGranted && !capturedPhoto && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white/30 rounded-full w-48 h-48 flex items-center justify-center">
                  <div className="text-white/70 text-sm font-medium text-center">
                    Posiciona tu rostro<br />dentro del círculo
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-3">
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Cámara activa
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                Asegúrate de estar vestido de manera profesional y con buena iluminación
              </p>
              
              <Button
                onClick={capturePhoto}
                disabled={isCapturing}
                className="w-full max-w-xs"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCapturing ? 'Capturando...' : 'Tomar Foto'}
              </Button>
            </div>
          </div>
        )}

        {/* Captured Photo Preview */}
        {capturedPhoto && (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-center space-y-3">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Foto capturada
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                ¿Te ves profesional y listo para la sesión de coaching?
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  disabled={isSending}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tomar otra
                </Button>
                
                <Button
                  onClick={handleSendPhoto}
                  disabled={isSending}
                  className="min-w-32"
                >
                  {isSending ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Continuar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center">
            <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
      </CardContent>
    </Card>
  );
};

export default CameraCapture;