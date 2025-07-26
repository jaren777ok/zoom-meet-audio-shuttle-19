import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemAudioRecorder } from '@/hooks/useSystemAudioRecorder';
import { useAIMessagesContext } from '@/contexts/AIMessagesContext';
import MeetingInfoForm from '@/components/MeetingInfoForm';
import { FloatingAIChat } from '@/components/FloatingAIChat';
import { Mic, MicOff, Settings, DollarSign, Send, Users, Building, Target, LogOut, User, MessageSquare, Volume2, VolumeX, Square, TrendingUp, Trophy, Zap, Monitor, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

const AudioRecorderApp = () => {
  console.log('🔄 AudioRecorderApp rendering...');
  
  const { user, signOut } = useAuth();
  const webhookUrl = 'https://n8n-n8n.lsfpo2.easypanel.host/webhook/audio'; // Hidden from UI
  const intervalSeconds = 20; // Made this a constant to prevent re-renders
  const [showSettings, setShowSettings] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'recording'>('form');
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const captureSystemAudio = true; // Always true for better AI performance
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const [isRequestingMicPermission, setIsRequestingMicPermission] = useState(false);

  // AI Messages context for clearing messages when recording stops
  const { clearAllMessages } = useAIMessagesContext();

  // Create stable objects to prevent re-renders
  const meetingInfoForHook = meetingInfo || { numberOfPeople: 0, companyInfo: '', meetingObjective: '' };
  const userInfoForHook = { userId: user?.id || '', userEmail: user?.email || '' };

  const { 
    isRecording, 
    recordingTime, 
    segmentCount,
    hasSystemAudio,
    isSystemAudioSupported,
    isScreenShared,
    systemStreamReady,
    isRequestingPermissions,
    microphoneVolume,
    systemVolume,
    setMicrophoneVolume,
    setSystemVolume,
    requestScreenPermissions,
    requestMicrophonePermissions,
    startRecording, 
    stopRecording
  } = useSystemAudioRecorder({
    webhookUrl, 
    intervalSeconds,
    meetingInfo: meetingInfoForHook,
    userInfo: userInfoForHook,
    captureSystemAudio: true // Always capture system audio for best AI performance
  });

  const handleMeetingInfoSubmit = (info: MeetingInfo) => {
    setMeetingInfo(info);
    setCurrentStep('recording');
  };

  // Handle system audio permission request
  const handleRequestSystemAudio = async () => {
    try {
      console.log('🔊 Solicitando permisos de audio del sistema...');
      const success = await requestScreenPermissions();
      
      if (!success) {
        alert('⚠️ No se pudo obtener acceso al audio del sistema.\n\nAsegúrate de:\n1. Hacer clic en "Compartir"\n2. Seleccionar "Compartir audio" en el diálogo\n\nEsto es necesario para que la IA funcione correctamente.');
      }
    } catch (error) {
      console.error('❌ Error al solicitar permisos del sistema:', error);
      alert('❌ Error al solicitar permisos del sistema.');
    }
  };

  // Handle microphone permission request
  const handleRequestMicrophone = async () => {
    setIsRequestingMicPermission(true);
    try {
      console.log('🎤 Solicitando permisos de micrófono...');
      const success = await requestMicrophonePermissions();
      
      if (success) {
        setHasMicrophonePermission(true);
      } else {
        alert('⚠️ No se pudo obtener acceso al micrófono.\n\nEsto es necesario para grabar tu voz durante el coaching.');
      }
    } catch (error) {
      console.error('❌ Error al solicitar permisos del micrófono:', error);
      alert('❌ Error al solicitar permisos del micrófono.');
    } finally {
      setIsRequestingMicPermission(false);
    }
  };

  // Start recording when both permissions are ready
  const handleStartRecording = async () => {
    if (!hasSystemAudio || !hasMicrophonePermission) {
      alert('⚠️ Se requieren ambos permisos para iniciar el entrenamiento.');
      return;
    }

    try {
      console.log('🚀 Iniciando grabación...');
      await startRecording();
      setShowFloatingChat(true);
    } catch (error) {
      console.error('❌ Error al iniciar grabación:', error);
      alert('❌ Error al iniciar la grabación. Por favor, intenta de nuevo.');
    }
  };

  const handleBackToForm = () => {
    if (!isRecording) {
      setCurrentStep('form');
      setShowFloatingChat(false);
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsDeleting(true);
      console.log('🛑 Stopping recording and clearing all AI messages...');
      
      // Stop the recording first
      stopRecording();
      
      // Clear all AI messages from Supabase
      await clearAllMessages();
      console.log('✅ All AI messages cleared successfully');
      
      // Close the chat after a short delay
      setTimeout(() => {
        setShowFloatingChat(false);
        setIsDeleting(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error clearing messages:', error);
      setIsDeleting(false);
      // Still close the chat even if clearing fails
      setTimeout(() => {
        setShowFloatingChat(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-neon-cyan" />
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <DollarSign className="h-10 w-10 text-neon-cyan" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-cyan-glow bg-clip-text text-transparent">
              SALES COACH AI 10X
            </h1>
            <Trophy className="h-10 w-10 text-neon-cyan" />
          </div>
          <p className="text-muted-foreground">
            Entrena tu pitch, cierra más deals - Análisis cada {intervalSeconds} segundos
          </p>
        </div>

        {/* Meeting Info Form */}
        {currentStep === 'form' && (
          <MeetingInfoForm onSubmit={handleMeetingInfoSubmit} />
        )}

        {/* Recording Interface */}
        {currentStep === 'recording' && (
          <>
            {/* Meeting Info Summary */}
            {meetingInfo && (
              <Card className="bg-card border-border backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-center gap-2 text-foreground text-lg">
                    <Target className="h-5 w-5 text-neon-cyan" />
                    Configuración de tu Sesión de Coaching
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Prospectos:</span>
                      <span className="font-medium text-foreground">{meetingInfo.numberOfPeople}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Productos:</span>
                      <span className="font-medium text-foreground">{meetingInfo.companyInfo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Meta Ventas:</span>
                      <span className="font-medium text-foreground truncate">{meetingInfo.meetingObjective}</span>
                    </div>
                  </div>
                  {!isRecording && (
                    <div className="flex justify-center pt-2">
                      <Button 
                        onClick={handleBackToForm}
                        variant="outline"
                        size="sm"
                      >
                        Editar Información
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Main Recording Card */}
            <Card className="bg-card border-border backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-2 text-foreground">
              <TrendingUp className="h-5 w-5 text-neon-cyan" />
              Centro de Entrenamiento de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Recording Status */}
            <div className="flex flex-col items-center space-y-4">
              <div className={`relative p-8 rounded-full transition-all duration-300 ${
                isRecording 
                  ? 'bg-recording-pulse animate-recording-pulse' 
                  : 'bg-dark-surface hover:bg-secondary'
              }`}>
                {isRecording ? (
                  <DollarSign className="h-12 w-12 text-white animate-pulse" />
                ) : (
                  <DollarSign className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              
              {/* Audio Source Indicators */}
              <div className="flex gap-2 mt-4">
                <Badge variant={hasMicrophonePermission && isRecording ? "default" : hasMicrophonePermission ? "outline" : "secondary"} className="flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  Tu Voz {hasMicrophonePermission && !isRecording ? '(Listo)' : ''}
                </Badge>
                <Badge variant={hasSystemAudio && isRecording ? "default" : hasSystemAudio ? "outline" : "secondary"} className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Cliente {hasSystemAudio && !isRecording ? '(Listo)' : ''}
                </Badge>
              </div>
              
              <div className="text-center space-y-2">
                <div className={`text-2xl font-mono font-bold ${
                  isRecording ? 'text-neon-cyan' : 'text-muted-foreground'
                }`}>
                  {recordingTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRecording ? '🚀 Analizando tu técnica de ventas...' : 
                   hasSystemAudio && hasMicrophonePermission ? '💰 Listo para entrenar tus habilidades' : '🎯 Configura permisos para comenzar'}
                </div>
              </div>
            </div>

            {/* Stats */}
            {isRecording && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-dark-surface rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-neon-cyan">{segmentCount}</div>
                  <div className="text-xs text-muted-foreground">Momentos analizados</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-neon-cyan">{intervalSeconds}s</div>
                  <div className="text-xs text-muted-foreground">Intervalo</div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-4 justify-center">
              {!isRecording ? (
                <div className="flex flex-col items-center gap-6 w-full max-w-md">
                  
                  {/* Permissions Section */}
                  <Card className="bg-dark-surface border-border w-full">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-center text-lg flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-neon-cyan" />
                        Permisos Requeridos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      
                      {/* System Audio Permission */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">Audio del Sistema</div>
                            <div className="text-xs text-muted-foreground">Para escuchar al cliente</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasSystemAudio ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-400/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-400/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                              <Button
                                onClick={handleRequestSystemAudio}
                                size="sm"
                                variant="outline"
                                disabled={isRequestingPermissions}
                                className="ml-2"
                              >
                                {isRequestingPermissions ? 'Solicitando...' : 'Activar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Microphone Permission */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                        <div className="flex items-center gap-3">
                          <Mic className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">Micrófono</div>
                            <div className="text-xs text-muted-foreground">Para grabar tu voz</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasMicrophonePermission ? (
                            <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-400/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Activo
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-400/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                Inactivo
                              </Badge>
                              <Button
                                onClick={handleRequestMicrophone}
                                size="sm"
                                variant="outline"
                                disabled={isRequestingMicPermission}
                                className="ml-2"
                              >
                                {isRequestingMicPermission ? 'Solicitando...' : 'Activar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Help Text */}
                      {(!hasSystemAudio || !hasMicrophonePermission) && (
                        <div className="text-center space-y-2 pt-2">
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-400" />
                            Activa ambos permisos para comenzar
                          </div>
                          <div className="text-xs text-muted-foreground max-w-sm mx-auto">
                            💡 La IA necesita escuchar tanto tu voz como la del cliente para proporcionar coaching efectivo
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Main Start Recording Button */}
                  {hasSystemAudio && hasMicrophonePermission && (
                    <Button 
                      onClick={handleStartRecording}
                      size="lg"
                      className="bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300 animate-pulse-neon px-8 text-lg w-full"
                    >
                      <DollarSign className="mr-2 h-6 w-6" />
                      Comenzar Entrenamiento de Ventas
                    </Button>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                  disabled={isDeleting}
                >
                  <MicOff className="mr-2 h-5 w-5" />
                  {isDeleting ? 'Finalizando sesión...' : 'Finalizar Entrenamiento'}
                </Button>
              )}
              
              {/* Secondary Buttons */}
              {!isRecording && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setShowSettings(!showSettings)}
                    variant="outline"
                    size="lg"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              {/* Chat Button (always available) */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowFloatingChat(!showFloatingChat)}
                  variant="outline"
                  size="lg"
                  className={showFloatingChat ? 'bg-primary/20' : ''}
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
            </Card>
          </>
        )}

        {/* Settings Card - Simplified */}
        {showSettings && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-neon-cyan" />
                Configuración de Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Volume Controls */}
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Volumen Micrófono: {Math.round(microphoneVolume * 100)}%
                  </Label>
                  <Slider
                    value={[microphoneVolume]}
                    onValueChange={(value) => setMicrophoneVolume(value[0])}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                    disabled={isRecording}
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Volumen Sistema: {Math.round(systemVolume * 100)}%
                  </Label>
                  <Slider
                    value={[systemVolume]}
                    onValueChange={(value) => setSystemVolume(value[0])}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                    disabled={isRecording}
                  />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground p-3 bg-dark-surface rounded-lg">
                <strong>💡 Coaching AI:</strong> El sistema analiza tanto tu voz como la del cliente para proporcionar coaching personalizado en tiempo real.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-neon-cyan" />
                Tu Camino a Ventas 10X
              </h3>
              <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">1</div>
                  <span>Configura tu sesión de ventas</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">2</div>
                  <span>La IA analiza tu técnica</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">3</div>
                  <span>Recibe coaching personalizado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Floating AI Chat Widget - Always mounted, visibility controlled */}
        <FloatingAIChat
          isVisible={showFloatingChat}
          onClose={() => setShowFloatingChat(false)}
          onStopRecording={handleStopRecording}
          onShow={() => setShowFloatingChat(true)}
        />
      </div>
    </div>
  );
};

export default AudioRecorderApp;
