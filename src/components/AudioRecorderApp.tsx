import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAIMessagesContext } from '@/contexts/AIMessagesContext';
import MeetingInfoForm from '@/components/MeetingInfoForm';
import { FloatingAIChat } from '@/components/FloatingAIChat';
import { Mic, MicOff, Settings, Waves, Send, Users, Building, Target, LogOut, User, MessageSquare } from 'lucide-react';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

const AudioRecorderApp = () => {
  const { user, signOut } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('https://n8n-n8n.lsfpo2.easypanel.host/webhook/audio');
  const [intervalSeconds] = useState(20);
  const [showSettings, setShowSettings] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);
  const [currentStep, setCurrentStep] = useState<'form' | 'recording'>('form');
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Messages context for clearing messages when recording stops
  const { clearAllMessages } = useAIMessagesContext();

  const { 
    isRecording, 
    recordingTime, 
    segmentCount, 
    startRecording, 
    stopRecording
  } = useAudioRecorder({
    webhookUrl, 
    intervalSeconds,
    meetingInfo: meetingInfo || { numberOfPeople: 0, companyInfo: '', meetingObjective: '' },
    userInfo: {
      userId: user?.id || '',
      userEmail: user?.email || ''
    }
  });

  const handleMeetingInfoSubmit = (info: MeetingInfo) => {
    setMeetingInfo(info);
    setCurrentStep('recording');
  };

  const handleStartRecording = () => {
    if (!webhookUrl.trim()) {
      alert('Por favor configura la URL del webhook');
      return;
    }
    startRecording();
    setShowFloatingChat(true);
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-cyan-glow bg-clip-text text-transparent">
            LIVE IA COACHING
          </h1>
          <p className="text-muted-foreground">
            Sistema inteligente de grabación cada {intervalSeconds} segundos
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
                    Información de la Reunión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Personas:</span>
                      <span className="font-medium text-foreground">{meetingInfo.numberOfPeople}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Empresa:</span>
                      <span className="font-medium text-foreground">{meetingInfo.companyInfo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-neon-cyan" />
                      <span className="text-muted-foreground">Objetivo:</span>
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
              <Waves className="h-5 w-5 text-neon-cyan" />
              Control de Grabación
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
                  <Mic className="h-12 w-12 text-white" />
                ) : (
                  <MicOff className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              
              <div className="text-center space-y-2">
                <div className={`text-2xl font-mono font-bold ${
                  isRecording ? 'text-neon-cyan' : 'text-muted-foreground'
                }`}>
                  {recordingTime}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isRecording ? 'Grabando...' : 'Listo para grabar'}
                </div>
              </div>
            </div>

            {/* Stats */}
            {isRecording && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-dark-surface rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-neon-cyan">{segmentCount}</div>
                  <div className="text-xs text-muted-foreground">Segmentos enviados</div>
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
                <Button 
                  onClick={handleStartRecording}
                  size="lg"
                  className="bg-gradient-to-r from-neon-cyan to-neon-cyan-glow text-primary-foreground hover:opacity-90 transition-all duration-300 animate-pulse-neon px-8"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Iniciar Grabación
                </Button>
              ) : (
                <Button 
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="lg"
                  className="px-8"
                  disabled={isDeleting}
                >
                  <MicOff className="mr-2 h-5 w-5" />
                  {isDeleting ? 'Finalizando...' : 'Finalizar Grabación'}
                </Button>
              )}
              
              <Button 
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="lg"
                disabled={isRecording}
              >
                <Settings className="h-5 w-5" />
              </Button>
              
              <Button 
                onClick={() => setShowFloatingChat(!showFloatingChat)}
                variant="outline"
                size="lg"
                className={showFloatingChat ? 'bg-primary/20' : ''}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
            </Card>
          </>
        )}

        {/* Settings Card */}
        {showSettings && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-neon-cyan" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">URL del Webhook</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://tu-webhook.com/audio"
                    className="bg-input border-border"
                  />
                  <Button variant="outline" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground p-3 bg-dark-surface rounded-lg">
                <strong>💡 Tip:</strong> Para capturar audio de Zoom/Meet, usa "Compartir pantalla" 
                con audio habilitado en tu navegador.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-foreground">¿Cómo funciona?</h3>
              <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">1</div>
                  <span>Graba audio cada {intervalSeconds} segundos</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">2</div>
                  <span>Convierte a formato MP3</span>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 bg-neon-cyan rounded-full flex items-center justify-center text-black font-bold">3</div>
                  <span>Envía automáticamente al webhook</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Floating AI Chat Widget */}
        <FloatingAIChat
          isVisible={showFloatingChat}
          onClose={() => setShowFloatingChat(false)}
          onStopRecording={handleStopRecording}
        />
      </div>
    </div>
  );
};

export default AudioRecorderApp;