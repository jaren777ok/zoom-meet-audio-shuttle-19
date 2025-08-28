import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Settings, LogOut, Lock, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useMeetingConfiguration } from '@/hooks/useMeetingConfiguration';
import { useSubscription } from '@/hooks/useSubscription';
import MeetingInfoForm from '@/components/MeetingInfoForm';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { FloatingAIChat } from '@/components/FloatingAIChat';
import { TrialBanner } from '@/components/TrialBanner';
import { PremiumAccessModal } from '@/components/PremiumAccessModal';
import zoomHackLogo from '@/assets/zoom-hack-logo.png';

export interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

const AudioRecorderApp: React.FC = () => {
  console.log('🔄 AudioRecorderApp rendering...');
  
  const { user, signOut } = useAuth();
  const { canUseFeatures, isTrialExpired } = useSubscription();
  const webhookUrl = 'https://cris.cloude.es/webhook/audio'; // Hidden from UI
  const intervalSeconds = 20; // Made this a constant to prevent re-renders
  const [showSettings, setShowSettings] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState<MeetingInfo | null>(null);

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
    userInfo: { userId: user?.id || '', userEmail: user?.email || '' }
  });

  const { 
    saveConfiguration 
  } = useMeetingConfiguration();

  const handleMeetingInfoComplete = async (info: MeetingInfo) => {
    console.log('💾 Saving meeting configuration:', info);
    setMeetingInfo(info);
    
    // Save to database
    try {
      await saveConfiguration(info);
      console.log('✅ Meeting configuration saved to database');
    } catch (error) {
      console.error('❌ Error saving meeting configuration:', error);
    }
    
    setShowSettings(false);
  };

  const startTraining = async () => {
    console.log('🎯 Starting training with info:', meetingInfo);
    
    // Check if user can use features
    if (!canUseFeatures) {
      setShowPremiumModal(true);
      return;
    }
    
    if (meetingInfo) {
      await startRecording();
      setShowFloatingChat(true);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    setShowFloatingChat(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img 
              src={zoomHackLogo} 
              alt="ZOOM HACK Logo" 
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground">ZOOM HACK</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        <ConnectionStatus 
          isConnected={true}
          error={null}
        />
        
        <TrialBanner />
        
        {showSettings ? (
          <MeetingInfoForm 
            onSubmit={handleMeetingInfoComplete}
          />
        ) : (
          <>
            {meetingInfo ? (
              <Card className="mb-6 border-2 border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-center text-primary">Configuración Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{meetingInfo.numberOfPeople}</div>
                      <div className="text-muted-foreground">Personas</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{meetingInfo.companyInfo}</div>
                      <div className="text-muted-foreground">Empresa</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground truncate">{meetingInfo.meetingObjective}</div>
                      <div className="text-muted-foreground">Objetivo</div>
                    </div>
                  </div>
                  {!isRecording && (
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}

            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-primary">
                  {isRecording ? 'Entrenamiento en Progreso' : 'Centro de Entrenamiento'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-4">
                  <div className={`text-2xl font-mono font-bold ${
                    isRecording ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {recordingTime}
                  </div>
                  <div className="text-muted-foreground">
                    {isRecording ? `Analizando... (${segmentCount} segmentos)` : 'Listo para comenzar el entrenamiento'}
                  </div>
                </div>

                {!isRecording ? (
                  <div className="space-y-4">
                    {!meetingInfo && (
                      <Button
                        onClick={() => setShowSettings(true)}
                        size="lg"
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        <Settings className="w-5 h-5 mr-2" />
                        Configurar Sesión
                      </Button>
                    )}
                    
                    {meetingInfo && (
                      <Button
                        onClick={startTraining}
                        size="lg"
                        className={`w-full ${!canUseFeatures ? 'bg-muted hover:bg-muted border-2 border-dashed border-border' : 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'}`}
                        disabled={!meetingInfo}
                      >
                        {!canUseFeatures ? (
                          <>
                            <Lock className="w-5 h-5 mr-2" />
                            Acceso Bloqueado - Solicitar Premium
                          </>
                        ) : (
                          <>
                            <Mic className="w-5 h-5 mr-2" />
                            Comenzar Entrenamiento
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Detener Entrenamiento
                  </Button>
                )}

                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-400 border border-green-500/30">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    Sistema Activo
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {showFloatingChat && (
          <FloatingAIChat 
            isVisible={showFloatingChat}
            onClose={() => setShowFloatingChat(false)}
            onStopRecording={handleStopRecording}
            onShow={() => setShowFloatingChat(true)}
          />
        )}
        
        <PremiumAccessModal 
          open={showPremiumModal} 
          onClose={() => setShowPremiumModal(false)} 
        />
      </div>
    </div>
  );
};

export default AudioRecorderApp;