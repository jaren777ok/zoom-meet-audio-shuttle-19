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

  // Dual recording refs
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const systemRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const isRestartingRef = useRef<boolean>(false);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Enhanced sendAudioChunk function to handle separate audio types
  const sendAudioChunk = useMemo(() => {
    return async (audioBlob: Blob, segmentNumber: number, audioType: 'microphone' | 'system') => {
      if (!webhookUrl.trim()) return;

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
      }
    };
  }, [webhookUrl, userInfo.userId, userInfo.userEmail, meetingInfo, hasSystemAudio]);

  // Create a MediaRecorder with restart functionality
  const createRecorderWithRestart = useCallback((
    stream: MediaStream, 
    audioType: 'microphone' | 'system',
    segmentCountRef: { current: number }
  ) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && !isRestartingRef.current) {
        segmentCountRef.current++;
        setSegmentCount(segmentCountRef.current);
        sendAudioChunk(event.data, segmentCountRef.current, audioType);
        console.log(`🎯 ${audioType} segment ${segmentCountRef.current} completed and sent (${event.data.size} bytes)`);
      }
    };

    recorder.onstop = () => {
      if (isRestartingRef.current && isRecording) {
        console.log(`🔄 Restarting ${audioType} MediaRecorder for next segment...`);
        setTimeout(() => {
          if (isRestartingRef.current && isRecording) {
            const newRecorder = createRecorderWithRestart(stream, audioType, segmentCountRef);
            newRecorder.start();
            
            if (audioType === 'microphone') {
              micRecorderRef.current = newRecorder;
            } else {
              systemRecorderRef.current = newRecorder;
            }
          }
        }, 100);
      }
    };

    return recorder;
  }, [sendAudioChunk, isRecording]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting dual recording with system audio:', captureSystemAudio);

      let micSegmentCount = { current: 0 };
      let systemSegmentCount = { current: 0 };

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
      const micRecorder = createRecorderWithRestart(micStream, 'microphone', micSegmentCount);
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
            const systemRecorder = createRecorderWithRestart(systemStream, 'system', systemSegmentCount);
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
      micRecorder.start();
      if (systemRecorderRef.current) {
        systemRecorderRef.current.start();
      }

      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Set up interval for restarting segments (synchronized)
      intervalRef.current = setInterval(() => {
        if (!isRestartingRef.current) {
          console.log('🔄 Triggering synchronized segment restart...');
          isRestartingRef.current = true;

          // Stop both recorders simultaneously
          if (micRecorderRef.current && micRecorderRef.current.state === 'recording') {
            micRecorderRef.current.stop();
          }
          if (systemRecorderRef.current && systemRecorderRef.current.state === 'recording') {
            systemRecorderRef.current.stop();
          }

          // Reset restart flag after a brief delay
          setTimeout(() => {
            isRestartingRef.current = false;
          }, 200);
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
      setIsRecording(false);
      setHasSystemAudio(false);
    }
  }, [captureSystemAudio, isSystemAudioSupported, intervalSeconds, createRecorderWithRestart, formatTime]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping dual recording...');

    // Stop the restart cycle
    isRestartingRef.current = false;

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

    setIsRecording(false);
    setSegmentCount(0);
    setRecordingTime('00:00:00');
    setHasSystemAudio(false);
    
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