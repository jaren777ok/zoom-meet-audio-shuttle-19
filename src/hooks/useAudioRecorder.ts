import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface MeetingInfo {
  numberOfPeople: number;
  companyInfo: string;
  meetingObjective: string;
}

interface AudioRecorderConfig {
  webhookUrl: string;
  intervalSeconds: number;
  meetingInfo: MeetingInfo;
}

export const useAudioRecorder = ({ webhookUrl, intervalSeconds, meetingInfo }: AudioRecorderConfig) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentChunks = useRef<Blob[]>([]);

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

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`Segmento ${segmentNumber} enviado exitosamente`);
        toast({
          title: "Audio enviado",
          description: `Segmento ${segmentNumber} enviado correctamente`,
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
    // Para simplicidad, retornamos el blob original
    // En producción, podrías usar una librería como lamejs para conversión real a MP3
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

  const startRecording = async () => {
    try {
      // Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
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

      // Iniciar primer segmento
      startRecordingSegment();

      // Configurar intervalo para segmentos automáticos
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current) {
          startRecordingSegment();
        }
      }, intervalSeconds * 1000);

      // Timer para mostrar tiempo total
      timeIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Grabación iniciada",
        description: "La grabación de audio ha comenzado",
      });

    } catch (error) {
      console.error('Error accediendo al micrófono:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    // Detener MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Limpiar intervalos
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Detener stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    
    toast({
      title: "Grabación finalizada",
      description: `Se enviaron ${segmentCount} segmentos de audio`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingTime: formatTime(recordingTime),
    segmentCount,
    startRecording,
    stopRecording,
  };
};