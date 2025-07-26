
import { useState, useRef, useCallback, useEffect } from 'react';
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

interface UseSystemAudioRecorderProps {
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
}: UseSystemAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00:00');
  const [segmentCount, setSegmentCount] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [isSystemAudioSupported] = useState(() => {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getDisplayMedia' in navigator.mediaDevices;
  });
  const [microphoneVolume, setMicrophoneVolume] = useState(1);
  const [systemVolume, setSystemVolume] = useState(1);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const sendAudioChunk = useCallback(async (audioBlob: Blob, segmentNumber: number) => {
    if (!webhookUrl.trim()) return;

    const formData = new FormData();
    formData.append('audio', audioBlob, `segment_${segmentNumber}.mp3`);
    formData.append('segment_number', segmentNumber.toString());
    formData.append('user_id', userInfo.userId);
    formData.append('user_email', userInfo.userEmail);
    formData.append('meeting_info', JSON.stringify(meetingInfo));
    formData.append('has_system_audio', hasSystemAudio.toString());

    try {
      console.log(`📤 Sending audio segment ${segmentNumber} to webhook (${audioBlob.size} bytes)`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`✅ Successfully sent segment ${segmentNumber}`);
      } else {
        console.error(`❌ Failed to send segment ${segmentNumber}:`, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Error sending segment ${segmentNumber}:`, error);
    }
  }, [webhookUrl, userInfo.userId, userInfo.userEmail, meetingInfo, hasSystemAudio]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording with system audio:', captureSystemAudio);

      let finalStream: MediaStream;

      if (captureSystemAudio && isSystemAudioSupported) {
        // Get microphone stream
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        try {
          // Get system audio stream
          const systemStream = await navigator.mediaDevices.getDisplayMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } as any,
          });

          const audioTracks = systemStream.getAudioTracks();
          if (audioTracks.length > 0) {
            console.log('🔊 System audio captured successfully');
            setHasSystemAudio(true);

            // Mix both audio sources
            const mixer = new AudioMixer();
            await mixer.addSource(micStream, microphoneVolume);
            await mixer.addSource(systemStream, systemVolume);
            finalStream = mixer.getMixedStream();
            audioMixerRef.current = mixer;
          } else {
            console.log('⚠️ No system audio available, using microphone only');
            setHasSystemAudio(false);
            finalStream = micStream;
          }
        } catch (systemError) {
          console.log('⚠️ System audio not available, using microphone only:', systemError);
          setHasSystemAudio(false);
          finalStream = micStream;
        }
      } else {
        // Microphone only
        finalStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        setHasSystemAudio(false);
      }

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      let currentSegment = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentSegment++;
          setSegmentCount(currentSegment);
          sendAudioChunk(event.data, currentSegment);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Set up interval for creating segments
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      }, intervalSeconds * 1000);

      // Set up time tracking
      timeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(formatTime(elapsed));
      }, 1000);

      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      setIsRecording(false);
      setHasSystemAudio(false);
    }
  }, [captureSystemAudio, isSystemAudioSupported, microphoneVolume, systemVolume, intervalSeconds, sendAudioChunk, formatTime]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping recording...');

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (audioMixerRef.current) {
      audioMixerRef.current.destroy();
      audioMixerRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    setIsRecording(false);
    setSegmentCount(0);
    setRecordingTime('00:00:00');
    setHasSystemAudio(false);
    
    console.log('✅ Recording stopped successfully');
  }, []);

  // Update mixer volumes when they change
  useEffect(() => {
    if (audioMixerRef.current) {
      audioMixerRef.current.updateVolume('microphone', microphoneVolume);
    }
  }, [microphoneVolume]);

  useEffect(() => {
    if (audioMixerRef.current) {
      audioMixerRef.current.updateVolume('system', systemVolume);
    }
  }, [systemVolume]);

  return {
    isRecording,
    recordingTime,
    segmentCount,
    hasSystemAudio,
    isSystemAudioSupported,
    microphoneVolume,
    systemVolume,
    setMicrophoneVolume,
    setSystemVolume,
    startRecording,
    stopRecording,
  };
};
