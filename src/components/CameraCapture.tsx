import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, RotateCcw, Send, AlertCircle } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureProps {
  userId: string;
  sessionId?: string;
  onComplete: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ userId, sessionId, onComplete }) => {
  const {
    isPermissionGranted,
    isRequestingPermission,
    isVideoReady,
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
    await sendPhotoToWebhook(userId, sessionId);
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
              
              {/* Loading overlay when video is not ready */}
              {!isVideoReady && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p className="text-sm">Cargando vista previa...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-3">
              <Badge variant="outline" className={`${isVideoReady ? 'bg-green-500/20 text-green-400 border-green-400/30' : 'bg-blue-500/20 text-blue-400 border-blue-400/30'}`}>
                <CheckCircle className="w-3 h-3 mr-1" />
                {isVideoReady ? 'Cámara lista' : 'Preparando cámara...'}
              </Badge>
              
              <p className="text-sm text-muted-foreground">
                Asegúrate de estar vestido de manera profesional y con buena iluminación
              </p>
              
              <Button
                onClick={capturePhoto}
                disabled={isCapturing || !isVideoReady}
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


        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
      </CardContent>
    </Card>
  );
};

export default CameraCapture;