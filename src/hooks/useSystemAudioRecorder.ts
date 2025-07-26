import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

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
  console.log('🔄 useSystemAudioRecorder: Hook called with:', { 
    webhookUrl, 
    intervalSeconds, 
    captureSystemAudio,
    meetingInfo,
    userInfo 
  });

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('00:00:00');
  const [segmentCount, setSegmentCount] = useState(0);
  const [hasSystemAudio, setHasSystemAudio] = useState(false);
  const [microphoneVolume, setMicrophoneVolume] = useState(1);
  const [systemVolume, setSystemVolume] = useState(1);

  const isSystemAudioSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getDisplayMedia' in navigator.mediaDevices;
  }, []);

  // Recording refs and state
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const systemRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Use refs for critical state that needs to be stable across async operations
  const isRecordingRef = useRef<boolean>(false);
  const currentSegmentRef = useRef<number>(0);
  const pendingChunks = useRef<Set<string>>(new Set());

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Send audio chunk to webhook
  const sendAudioChunk = useCallback(async (audioBlob: Blob, segmentNumber: number, audioType: 'microphone' | 'system') => {
    if (!webhookUrl.trim()) {
      console.log(`⚠️ No webhook URL, skipping ${audioType} segment ${segmentNumber}`);
      return;
    }

    const chunkId = `${audioType}_${segmentNumber}`;
    pendingChunks.current.add(chunkId);

    const formData = new FormData();
    
    // Use different field names for each audio type
    if (audioType === 'microphone') {
      formData.append('microphone_audio', audioBlob, `mic_segment_${segmentNumber}.webm`);
    } else {
      formData.append('system_audio', audioBlob, `system_segment_${segmentNumber}.webm`);
    }
    
    formData.append('segment_number', segmentNumber.toString());
    formData.append('user_id', userInfo.userId);
    formData.append('user_email', userInfo.userEmail);
    formData.append('meeting_info', JSON.stringify(meetingInfo));
    formData.append('has_system_audio', hasSystemAudio.toString());
    formData.append('audio_type', audioType);

    try {
      console.log(`📤 Sending ${audioType} audio segment ${segmentNumber} to webhook (${audioBlob.size} bytes)`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`✅ Successfully sent ${audioType} segment ${segmentNumber}`);
      } else {
        console.error(`❌ Failed to send ${audioType} segment ${segmentNumber}:`, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Error sending ${audioType} segment ${segmentNumber}:`, error);
    } finally {
      pendingChunks.current.delete(chunkId);
    }
  }, [webhookUrl, userInfo.userId, userInfo.userEmail, meetingInfo, hasSystemAudio]);

  // Create MediaRecorder with proper event handling
  const createMediaRecorder = useCallback((stream: MediaStream, audioType: 'microphone' | 'system') => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && isRecordingRef.current) {
        const segmentNumber = currentSegmentRef.current;
        console.log(`🎯 ${audioType} data available for segment ${segmentNumber} (${event.data.size} bytes)`);
        await sendAudioChunk(event.data, segmentNumber, audioType);
      }
    };

    recorder.onstop = () => {
      console.log(`🛑 ${audioType} recorder stopped`);
    };

    recorder.onerror = (event) => {
      console.error(`❌ ${audioType} recorder error:`, event);
    };

    return recorder;
  }, [sendAudioChunk]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting dual recording with system audio:', captureSystemAudio);
      
      // Reset state
      currentSegmentRef.current = 0;
      isRecordingRef.current = true;
      pendingChunks.current.clear();

      // Always get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      
      micStreamRef.current = micStream;
      console.log('🎤 Microphone stream captured successfully');

      // Set up microphone recorder
      const micRecorder = createMediaRecorder(micStream, 'microphone');
      micRecorderRef.current = micRecorder;

      // Try to get system audio if requested
      if (captureSystemAudio && isSystemAudioSupported) {
        try {
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
            systemStreamRef.current = systemStream;

            // Set up system audio recorder
            const systemRecorder = createMediaRecorder(systemStream, 'system');
            systemRecorderRef.current = systemRecorder;
          } else {
            console.log('⚠️ No system audio tracks available');
            setHasSystemAudio(false);
          }
        } catch (systemError) {
          console.log('⚠️ System audio not available:', systemError);
          setHasSystemAudio(false);
        }
      } else {
        setHasSystemAudio(false);
      }

      // Start both recorders
      console.log('🔄 Starting recorders...');
      micRecorder.start();
      if (systemRecorderRef.current) {
        systemRecorderRef.current.start();
      }

      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Set up interval for creating segments
      intervalRef.current = setInterval(() => {
        if (isRecordingRef.current) {
          currentSegmentRef.current++;
          setSegmentCount(currentSegmentRef.current);
          console.log(`🔄 Creating segment ${currentSegmentRef.current}...`);

          // Stop both recorders to generate segments
          if (micRecorderRef.current && micRecorderRef.current.state === 'recording') {
            micRecorderRef.current.stop();
          }
          if (systemRecorderRef.current && systemRecorderRef.current.state === 'recording') {
            systemRecorderRef.current.stop();
          }

          // Restart recorders after a brief delay
          setTimeout(() => {
            if (isRecordingRef.current && micStreamRef.current) {
              const newMicRecorder = createMediaRecorder(micStreamRef.current, 'microphone');
              micRecorderRef.current = newMicRecorder;
              newMicRecorder.start();
            }

            if (isRecordingRef.current && systemStreamRef.current) {
              const newSystemRecorder = createMediaRecorder(systemStreamRef.current, 'system');
              systemRecorderRef.current = newSystemRecorder;
              newSystemRecorder.start();
            }
          }, 100);
        }
      }, intervalSeconds * 1000);

      // Set up time tracking
      timeIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(formatTime(elapsed));
      }, 1000);

      console.log('✅ Dual recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      isRecordingRef.current = false;
      setIsRecording(false);
      setHasSystemAudio(false);
    }
  }, [captureSystemAudio, isSystemAudioSupported, intervalSeconds, createMediaRecorder, formatTime]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping dual recording...');

    // Set recording state to false
    isRecordingRef.current = false;
    setIsRecording(false);

    // Clear intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }

    // Stop and cleanup microphone recorder
    if (micRecorderRef.current) {
      if (micRecorderRef.current.state === 'recording') {
        micRecorderRef.current.stop();
      }
      micRecorderRef.current = null;
    }

    // Stop and cleanup system recorder
    if (systemRecorderRef.current) {
      if (systemRecorderRef.current.state === 'recording') {
        systemRecorderRef.current.stop();
      }
      systemRecorderRef.current = null;
    }

    // Stop and cleanup streams
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (systemStreamRef.current) {
      systemStreamRef.current.getTracks().forEach(track => track.stop());
      systemStreamRef.current = null;
    }

    // Reset state
    setSegmentCount(0);
    setRecordingTime('00:00:00');
    setHasSystemAudio(false);
    currentSegmentRef.current = 0;
    pendingChunks.current.clear();
    
    console.log('✅ Dual recording stopped successfully');
  }, []);

  // Volume control effects (for future WebAudio API integration if needed)
  useEffect(() => {
    if (isRecording) {
      console.log('🎤 Microphone volume set to:', microphoneVolume);
    }
  }, [microphoneVolume, isRecording]);

  useEffect(() => {
    if (isRecording) {
      console.log('🔊 System volume set to:', systemVolume);
    }
  }, [systemVolume, isRecording]);

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