import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { AudioMixer } from '@/lib/AudioMixer';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

interface UserInfo {
  userId: string;
  userEmail: string;
}

interface SystemAudioRecorderConfig {
  webhookUrl: string;
  intervalSeconds: number;
  meetingInfo: MeetingInfo;
  userInfo: UserInfo;
  captureSystemAudio?: boolean;
}

export const useSystemAudioRecorder = ({ 
  webhookUrl, 
  intervalSeconds, 
  meetingInfo, 
  userInfo,
  captureSystemAudio = false 
}: SystemAudioRecorderConfig) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [microphoneVolume, setMicrophoneVolume] = useState(1.0);
  const [systemVolume, setSystemVolume] = useState(0.7);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [isSystemAudioSupported, setIsSystemAudioSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentChunks = useRef<Blob[]>([]);

  // Check system audio support
  const checkSystemAudioSupport = useCallback(() => {
    const isSupported = 'getDisplayMedia' in navigator.mediaDevices && 
                       typeof navigator.mediaDevices.getDisplayMedia === 'function';
    setIsSystemAudioSupported(isSupported);
    return isSupported;
  }, []);

  const sendAudioToWebhook = async (audioBlob: Blob, segmentNumber: number) => {
    try {
      const formData = new FormData();
      const fileName = `audio_segment_${segmentNumber}_${Date.now()}.mp3`;
      formData.append('audio', audioBlob, fileName);
      formData.append('timestamp', new Date().toISOString());
      formData.append('segmentNumber', segmentNumber.toString());
      formData.append('numberOfPeople', meetingInfo.numberOfPeople.toString());
      formData.append('companyInfo', meetingInfo.companyInfo);
      formData.append('meetingObjective', meetingInfo.meetingObjective);
      formData.append('userId', userInfo.userId);
      formData.append('userEmail', userInfo.userEmail);
      formData.append('captureSystemAudio', hasSystemAudio.toString());

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`Segmento ${segmentNumber} enviado exitosamente`);
        toast({
          title: "Audio enviado",
          description: `Segmento ${segmentNumber} enviado (${hasSystemAudio ? 'Mic + Sistema' : 'Solo Mic'})`,
        });
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error enviando audio:', error);
      toast({
        title: "Error",
        description: "Error enviando audio a la webhook",
        variant: "destructive",
      });
    }
  };

  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    return audioBlob;
  };

  const startRecordingSegment = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'inactive') {
      return;
    }

    currentChunks.current = [];
    mediaRecorderRef.current.start();

    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, intervalSeconds * 1000);
  }, [intervalSeconds]);

  const getMicrophoneStream = async (): Promise<MediaStream> => {
    return await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      } 
    });
  };

  const getSystemStream = async (): Promise<MediaStream | null> => {
    if (!checkSystemAudioSupport()) {
      console.warn('⚠️ System audio not supported in this browser');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,
        audio: {
          // @ts-ignore - systemAudio is experimental but supported in Chrome
          systemAudio: 'include',
          echoCancellation: false,
          noiseSuppression: false
        }
      });

      // Check if we actually got audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ No system audio tracks available');
        return null;
      }

      console.log('🔊 System audio stream obtained:', audioTracks.length, 'tracks');
      return stream;
    } catch (error) {
      console.warn('⚠️ Failed to get system audio:', error);
      toast({
        title: "Aviso",
        description: "No se pudo capturar audio del sistema. Continuando solo con micrófono.",
        variant: "default",
      });
      return null;
    }
  };

  const startRecording = async () => {
    try {
      // Get microphone stream
      const micStream = await getMicrophoneStream();
      micStreamRef.current = micStream;

      let finalStream: MediaStream;

      if (captureSystemAudio) {
        // Try to get system audio
        const systemStream = await getSystemStream();
        
        if (systemStream) {
          // Create mixer for combining streams
          const mixer = new AudioMixer();
          audioMixerRef.current = mixer;
          
          mixer.addMicrophoneStream(micStream);
          mixer.addSystemStream(systemStream);
          mixer.setMicrophoneVolume(microphoneVolume);
          mixer.setSystemVolume(systemVolume);
          
          systemStreamRef.current = systemStream;
          finalStream = mixer.getMixedStream();
          setHasSystemAudio(true);
          
          console.log('🎤🔊 Recording with microphone + system audio');
          toast({
            title: "Grabación dual iniciada",
            description: "Capturando micrófono y audio del sistema",
          });
        } else {
          // Fallback to mic only
          finalStream = micStream;
          setHasSystemAudio(false);
          console.log('🎤 Recording with microphone only (system audio failed)');
        }
      } else {
        // Mic only mode
        finalStream = micStream;
        setHasSystemAudio(false);
        console.log('🎤 Recording with microphone only');
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (currentChunks.current.length > 0) {
          const audioBlob = new Blob(currentChunks.current, { type: 'audio/webm' });
          const mp3Blob = await convertToMp3(audioBlob);
          
          setSegmentCount(prev => {
            const newCount = prev + 1;
            sendAudioToWebhook(mp3Blob, newCount);
            return newCount;
          });
        }
      };

      setIsRecording(true);
      setSegmentCount(0);
      setRecordingTime(0);

      // Start first segment
      startRecordingSegment();

      // Set up automatic intervals
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current) {
          startRecordingSegment();
        }
      }, intervalSeconds * 1000);

      // Timer for recording time
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Grabación iniciada",
        description: hasSystemAudio ? "Capturando micrófono y sistema" : "Capturando solo micrófono",
      });

    } catch (error) {
      console.error('Error iniciando grabación:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Stop streams
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(track => track.stop());
      systemStreamRef.current = null;
    }

    // Dispose mixer
    if (audioMixerRef.current) {
      audioMixerRef.current.dispose();
      audioMixerRef.current = null;
    }

    setIsRecording(false);
    setHasSystemAudio(false);
    
    toast({
      title: "Grabación finalizada",
      description: `Se enviaron ${segmentCount} segmentos de audio`,
    });
  };

  const updateVolumes = useCallback(() => {
    if (audioMixerRef.current) {
      audioMixerRef.current.setMicrophoneVolume(microphoneVolume);
      audioMixerRef.current.setSystemVolume(systemVolume);
    }
  }, [microphoneVolume, systemVolume]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime: formatTime(recordingTime),
    segmentCount,
    hasSystemAudio,
    isSystemAudioSupported: checkSystemAudioSupport(),
    microphoneVolume,
    systemVolume,
    setMicrophoneVolume,
    setSystemVolume,
    updateVolumes,
    startRecording,
    stopRecording,
  };
};