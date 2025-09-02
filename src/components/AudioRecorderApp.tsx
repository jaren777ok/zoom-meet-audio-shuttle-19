import React, { useState, useEffect } from 'react';
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
import { useSubscription } from '@/hooks/useSubscription';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useSessionAnalytics } from '@/hooks/useSessionAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import MeetingInfoForm from '@/components/MeetingInfoForm';
import ProductivityCenter from '@/components/ProductivityCenter';
import { FloatingAIChat } from '@/components/FloatingAIChat';
import { TrialBanner } from '@/components/TrialBanner';
import { PremiumAccessModal } from '@/components/PremiumAccessModal';
import { NetworkQualityIndicator } from '@/components/NetworkQualityIndicator';
import { Mic, MicOff, Settings, DollarSign, Send, Users, Building, Target, LogOut, User, MessageSquare, Volume2, VolumeX, Square, TrendingUp, Zap, Monitor, CheckCircle, XCircle, AlertCircle, Crown } from 'lucide-react';
import zoomHackLogo from '@/assets/zoom-hack-logo.png';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

const AudioRecorderApp = () => {
  console.log('🔄 AudioRecorderApp rendering...');
  
  const { user, signOut } = useAuth();
  const { isTrialActive, daysRemaining, loading: subscriptionLoading, submitPremiumRequest } = useSubscription();
  const { createSessionRecord, updateSessionRecord, sendWebhook } = useSessionAnalytics();
  
  // Network quality and session timer hooks
  const {
    currentQuality,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getNetworkStability,
  } = useNetworkQuality();
  
  const {
    sessionDuration,
    startTimer,
    stopTimer,
    getSessionSummary,
  } = useSessionTimer();
  
  const webhookUrl = 'https://cris.cloude.es/webhook/audio'; // Hidden from UI
  const intervalSeconds = 20; // Made this a constant to prevent re-renders
  const [showSettings, setShowSettings] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'productivity' | 'recording'>('form');
  
  // Generate sessionId ONCE per app instance to prevent duplications
  const [sessionId] = useState(() => {
    if (!user?.id) return null;
    const id = `${user.id}_${Date.now()}`;
    console.log('🆔 SessionId generated ONCE in AudioRecorderApp:', id);
    return id;
  });
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const captureSystemAudio = true; // Always true for better AI performance
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState(false);
  const [isRequestingMicPermission, setIsRequestingMicPermission] = useState(false);
  const [startQuality, setStartQuality] = useState<any>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);

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
    sessionId: hookSessionId,
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
    captureSystemAudio: true, // Always capture system audio for best AI performance
    sessionId: sessionId || '' // Pass sessionId from state
  });

  // Initialize session record when sessionId becomes available and we have meeting info
  useEffect(() => {
    const initializeSession = async () => {
      if (sessionId && user && meetingInfo && !sessionInitialized) {
        try {
          console.log('🚀 Initializing session record with unique sessionId:', sessionId);
          
          const initialData = {
            session_name: meetingInfo.meetingObjective || `Sesión ${new Date().toLocaleString('es-ES')}`,
            analysis_status: 'initialized' // Add status tracking
          };
          
          const sessionRecord = await createSessionRecord(sessionId, initialData);
          
          if (sessionRecord) {
            console.log('✅ Base session record created:', sessionRecord.id);
            setSessionInitialized(true);
            
            toast({
              title: "Sesión inicializada",
              description: "Registro de sesión creado correctamente",
            });
          }
        } catch (error) {
          console.error('❌ Error initializing session:', error);
          // Check if it's a duplication error and handle gracefully
          if (error instanceof Error && error.message.includes('duplicate')) {
            console.log('⚠️ Session already exists, continuing...');
            setSessionInitialized(true);
          }
        }
      }
    };

    initializeSession();
  }, [sessionId, user, sessionInitialized, meetingInfo, createSessionRecord]);

  const handleMeetingInfoSubmit = (info: MeetingInfo) => {
    setMeetingInfo(info);
    setCurrentStep('productivity');
  };

  const handleProductivityComplete = () => {
    setCurrentStep('recording');
  };

  // Handle system audio permission request
  const handleRequestSystemAudio = async (): Promise<boolean> => {
    try {
      console.log('🔊 Solicitando permisos de audio del sistema...');
      const success = await requestScreenPermissions();
      
      if (!success) {
        alert('⚠️ No se pudo obtener acceso al audio del sistema.\n\nAsegúrate de:\n1. Hacer clic en "Compartir"\n2. Seleccionar "Compartir audio" en el diálogo\n\nEsto es necesario para que la IA funcione correctamente.');
      }
      return success;
    } catch (error) {
      console.error('❌ Error al solicitar permisos del sistema:', error);
      alert('❌ Error al solicitar permisos del sistema.');
      return false;
    }
  };

  // Handle microphone permission request
  const handleRequestMicrophone = async (): Promise<boolean> => {
    setIsRequestingMicPermission(true);
    try {
      console.log('🎤 Solicitando permisos de micrófono...');
      const success = await requestMicrophonePermissions();
      
      if (success) {
        setHasMicrophonePermission(true);
        return true;
      } else {
        alert('⚠️ No se pudo obtener acceso al micrófono.\n\nEsto es necesario para grabar tu voz durante el coaching.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error al solicitar permisos del micrófono:', error);
      alert('❌ Error al solicitar permisos del micrófono.');
      return false;
    } finally {
      setIsRequestingMicPermission(false);
    }
  };

  // Start recording when both permissions are ready and trial is active
  const handleStartRecording = async () => {
    // Check trial status first
    if (!subscriptionLoading && !isTrialActive) {
      setShowPremiumModal(true);
      return;
    }

    if (!hasSystemAudio || !hasMicrophonePermission) {
      alert('⚠️ Se requieren ambos permisos para iniciar el entrenamiento.');
      return;
    }

    try {
      console.log('🚀 Iniciando grabación...');
      
      // Start network monitoring and session timer
      await startMonitoring();
      startTimer();
      
      // Store initial network quality
      if (currentQuality) {
        setStartQuality(currentQuality);
      }
      
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
      setSessionInitialized(false); // Reset to allow new session creation
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsDeleting(true);
      console.log('🛑 Stopping recording and clearing all AI messages...');
      
      // Stop monitoring and timer
      stopMonitoring();
      stopTimer();
      
      // Stop the recording first
      stopRecording();
      
      // Get final metrics
      const sessionSummary = getSessionSummary();
      const networkStability = getNetworkStability();
      const endQuality = currentQuality;
      
        // Verificar autenticación antes de procesar
        if (!user) {
          console.error('❌ No user authenticated for session save');
          toast({
            title: "Error de autenticación",
            description: "Debes estar autenticado para guardar la sesión",
            variant: "destructive",
          });
          return;
        }

        if (!sessionId) {
          console.error('❌ No sessionId available');
          toast({
            title: "Error",
            description: "No se pudo generar el ID de sesión",
            variant: "destructive",
          });
          return;
        }

        try {
          console.log('💾 Updating session with final connectivity data...');
          console.log('👤 User authenticated:', { userId: user.id, email: user.email });
          console.log('🔢 Session ID:', sessionId);
          
          // Prepare final connectivity data for update
          const connectivityUpdateData = {
            internet_quality_start: startQuality?.quality || null,
            internet_quality_end: endQuality?.quality || null,
            session_duration_minutes: sessionSummary.durationMinutes,
            connection_stability_score: Math.min(networkStability.stabilityScore, 9.99), // Cap at 9.99
            network_type: endQuality?.networkType || startQuality?.networkType || null,
            avg_connection_speed: endQuality?.speed || startQuality?.speed || null,
            analysis_status: 'pending'
          };
          
          console.log('📊 Final connectivity data prepared:', connectivityUpdateData);
          
          // Update existing session record with final connectivity data using new function
          const updatedRecord = await updateSessionRecord(sessionId, connectivityUpdateData);
          
          if (updatedRecord) {
            console.log('✅ Session record updated successfully');
            
            toast({
              title: "Sesión finalizada",
              description: "Los datos de conectividad han sido actualizados",
            });
            
            // Enviar webhook para análisis de forma independiente
            console.log('📡 Sending webhook for analysis...');
            const result = await sendWebhook(sessionId, user.id);
            
            if (result) {
              console.log('✅ Webhook sent successfully');
            } else {
              console.error('❌ Webhook failed but session was saved');
            }
          } else {
            throw new Error('Failed to update session record');
          }
        } catch (error: any) {
          console.error('❌ Error in session finalization process:', error);
          toast({
            title: "Error al finalizar sesión",
            description: error.message || "No se pudo finalizar la sesión",
            variant: "destructive",
          });
        }
      
      // Clear all AI messages from Supabase
      await clearAllMessages();
      console.log('✅ All AI messages cleared successfully');
      
      // Reset quality states
      setStartQuality(null);
      
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

  const handlePremiumRequest = async (requestData: { full_name: string; email: string; phone_number: string; message?: string }) => {
    const result = await submitPremiumRequest(requestData);
    return result;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
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
          
          <div className="flex items-center justify-center mb-2">
            <img 
              src="https://jbunbmphadxmzjokwgkw.supabase.co/storage/v1/object/sign/fotos/zoom%20hack%20logo%20(1).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8zNGY4MzVlOS03N2Y3LTRiMWQtOWE0MS03NTVhYzYxNTM3NDUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJmb3Rvcy96b29tIGhhY2sgbG9nbyAoMSkucG5nIiwiaWF0IjoxNzU2NDAyNDY1LCJleHAiOjE5MTQwODI0NjV9.Y0gJgiDh2zvxJoep36_ykWIYdfo5SQjpMs0auWVkuTQ" 
              alt="Zoom Hack Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <div>
            <p className="text-muted-foreground mt-2">
              Tu Herramienta de Productividad 10X - Análisis cada {intervalSeconds} segundos
            </p>
          </div>
        </div>

        {/* Trial Banner */}
        <TrialBanner 
          daysRemaining={daysRemaining} 
          isVisible={!subscriptionLoading && isTrialActive} 
        />

        {/* Meeting Info Form */}
        {currentStep === 'form' && (
          <MeetingInfoForm onSubmit={handleMeetingInfoSubmit} />
        )}

        {/* Productivity Center - Permissions + Photo */}
        {currentStep === 'productivity' && sessionId && (
          <ProductivityCenter 
            userId={user?.id || ''} 
            sessionId={sessionId}
            onRequestMicrophone={handleRequestMicrophone}
            onRequestSystemAudio={handleRequestSystemAudio}
            onComplete={handleProductivityComplete}
            hasMicrophonePermission={hasMicrophonePermission}
            hasSystemAudio={hasSystemAudio}
            isSystemAudioSupported={isSystemAudioSupported}
            systemStreamReady={systemStreamReady}
            isRequestingPermissions={isRequestingPermissions}
          />
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
                  <div className="flex justify-center gap-6 text-sm">
                    <div className="flex flex-col items-center gap-1">
                      <Users className="h-6 w-6 text-neon-cyan" />
                      <span className="text-xs text-muted-foreground">Prospectos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Building className="h-6 w-6 text-neon-cyan" />
                      <span className="text-xs text-muted-foreground">Productos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Target className="h-6 w-6 text-neon-cyan" />
                      <span className="text-xs text-muted-foreground">Objetivo de la sesión</span>
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
               Centro de Productividad Zoom Hack
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
              <div className="space-y-4">
                {/* Network Quality Indicator */}
                <div className="p-4 bg-dark-surface rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Estado de Conectividad
                  </h4>
                  <div className="space-y-2">
                    <NetworkQualityIndicator 
                      quality={currentQuality} 
                      showDetails={true}
                      className="justify-center"
                    />
                    {sessionDuration.isRunning && (
                      <div className="text-center text-xs text-muted-foreground">
                        Duración: {sessionDuration.durationMinutes.toFixed(1)} min
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Recording Stats */}
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
                    <>
                      <Button
                        onClick={handleStartRecording}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white min-w-[200px] shadow-lg transform hover:scale-105 transition-all duration-200"
                        disabled={!hasSystemAudio || !hasMicrophonePermission || subscriptionLoading}
                      >
                        <DollarSign className="mr-2 h-5 w-5" />
                        {subscriptionLoading ? 
                          'Cargando...' : 
                          !isTrialActive ? 
                            'Acceso Premium Requerido' : 
                            'Comenzar Entrenamiento'
                        }
                      </Button>
                      {!isTrialActive && !subscriptionLoading && (
                        <Button
                          onClick={() => setShowPremiumModal(true)}
                          variant="outline"
                          size="sm"
                          className="mt-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
                        >
                          <Crown className="mr-2 h-4 w-4" />
                          Solicitar Acceso Premium
                        </Button>
                      )}
                    </>
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

        {/* Premium Access Modal */}
        <PremiumAccessModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSubmit={handlePremiumRequest}
        />
      </div>
    </div>
  );
};

export default AudioRecorderApp;
