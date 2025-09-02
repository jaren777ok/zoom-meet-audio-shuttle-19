import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Camera, CheckCircle, RotateCcw, Send, AlertCircle, Mic, Monitor, Volume2, TrendingUp } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface ProductivityCenterProps {
  userId: string;
  sessionId: string;
  onRequestMicrophone: () => Promise<boolean>;
  onRequestSystemAudio: () => Promise<boolean>;
  onComplete: () => void;
  hasMicrophonePermission: boolean;
  hasSystemAudio: boolean;
  isSystemAudioSupported: boolean;
  systemStreamReady: boolean;
  isRequestingPermissions: boolean;
}

const ProductivityCenter: React.FC<ProductivityCenterProps> = ({
  userId,
  sessionId,
  onRequestMicrophone,
  onRequestSystemAudio,
  onComplete,
  hasMicrophonePermission,
  hasSystemAudio,
  isSystemAudioSupported,
  systemStreamReady,
  isRequestingPermissions
}) => {
  const [currentPhase, setCurrentPhase] = useState<'permissions' | 'photo' | 'ready'>('permissions');
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [systemAudioReady, setSystemAudioReady] = useState(false);

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
        setCurrentPhase('ready');
      }, 1000);
    }
  });

  // Update states based on parent props
  useEffect(() => {
    setMicrophoneReady(hasMicrophonePermission);
    setSystemAudioReady(hasSystemAudio && systemStreamReady);
  }, [hasMicrophonePermission, hasSystemAudio, systemStreamReady]);

  // Auto-advance to photo phase when permissions are ready
  useEffect(() => {
    if (microphoneReady && systemAudioReady && currentPhase === 'permissions') {
      setCurrentPhase('photo');
    }
  }, [microphoneReady, systemAudioReady, currentPhase]);

  const handleMicrophoneRequest = async () => {
    const success = await onRequestMicrophone();
    if (success) {
      setMicrophoneReady(true);
    }
  };

  const handleSystemAudioRequest = async () => {
    const success = await onRequestSystemAudio();
    if (success) {
      setSystemAudioReady(true);
    }
  };

  const handleSendPhoto = async () => {
    await sendPhotoToWebhook(userId, sessionId);
  };

  const handleContinue = () => {
    onComplete();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <Card className="bg-card border-border backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-foreground">
          <TrendingUp className="h-5 w-5 text-neon-cyan" />
          Centro de Productividad Zoom Hack
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configuremos todo lo necesario para tu sesión de coaching de ventas
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Permissions Phase */}
        {currentPhase === 'permissions' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-medium text-foreground mb-4">Permisos de Audio Requeridos</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Para brindarte el mejor coaching, necesitamos acceso a tu micrófono y al audio del sistema
              </p>
            </div>

            {/* Microphone Permission */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${microphoneReady ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Mic className={`h-5 w-5 ${microphoneReady ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Micrófono</p>
                    <p className="text-sm text-muted-foreground">Para grabar tu voz durante el coaching</p>
                  </div>
                </div>
                {microphoneReady ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Listo
                  </Badge>
                ) : (
                  <Button
                    onClick={handleMicrophoneRequest}
                    disabled={isRequestingPermissions}
                    size="sm"
                  >
                    Activar
                  </Button>
                )}
              </div>
            </div>

            {/* System Audio Permission */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${systemAudioReady ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                    <Volume2 className={`h-5 w-5 ${systemAudioReady ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Audio del Sistema</p>
                    <p className="text-sm text-muted-foreground">Para analizar el audio de videollamadas</p>
                  </div>
                </div>
                {systemAudioReady ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Listo
                  </Badge>
                ) : (
                  <Button
                    onClick={handleSystemAudioRequest}
                    disabled={isRequestingPermissions}
                    size="sm"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Compartir Pantalla
                  </Button>
                )}
              </div>
              {!systemAudioReady && (
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Recuerda seleccionar "Compartir audio" en el diálogo
                </p>
              )}
            </div>

            {microphoneReady && systemAudioReady && (
              <div className="text-center pt-4">
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30 text-sm px-4 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Permisos configurados - Avanzando a verificación
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Photo Phase */}
        {currentPhase === 'photo' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-medium text-foreground mb-2">Verificación de Presentación</h3>
              <p className="text-sm text-muted-foreground">
                Toma una foto para verificar tu presentación profesional
              </p>
            </div>

            {/* Camera Permission Request */}
            {!isPermissionGranted && !capturedPhoto && (
              <div className="text-center space-y-4">
                <div className="p-8 rounded-full bg-dark-surface mx-auto w-fit">
                  <Camera className="h-12 w-12 text-muted-foreground" />
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
                    Asegúrate de estar vestido de manera profesional
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
                    ¿Te ves profesional y listo para la sesión?
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
          </div>
        )}

        {/* Ready Phase */}
        {currentPhase === 'ready' && (
          <div className="text-center space-y-6">
            <div className="p-8 rounded-full bg-green-500/20 mx-auto w-fit">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">¡Todo Listo!</h3>
              <p className="text-sm text-muted-foreground">
                Tu configuración está completa. Ya puedes iniciar tu sesión de coaching.
              </p>
            </div>

            <div className="space-y-3">
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Permisos configurados
              </Badge>
              <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                Presentación verificada
              </Badge>
            </div>
            
            <Button
              onClick={handleContinue}
              className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Iniciar Coaching
            </Button>
          </div>
        )}
        
      </CardContent>
    </Card>
  );
};

export default ProductivityCenter;