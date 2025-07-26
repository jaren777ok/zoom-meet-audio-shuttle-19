
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioMixerRef = useRef<AudioMixer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const isRestartingRef = useRef<boolean>(false);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Stabilize the sendAudioChunk function with useMemo to prevent re-creation
  const sendAudioChunk = useMemo(() => {
    return async (audioBlob: Blob, segmentNumber: number) => {
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
    };
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

      // Store the stream for restarts
      streamRef.current = finalStream;

      // Set up initial MediaRecorder
      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      let currentSegment = 0;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && !isRestartingRef.current) {
          currentSegment++;
          setSegmentCount(currentSegment);
          sendAudioChunk(event.data, currentSegment);
          console.log(`🎯 Segment ${currentSegment} completed and sent (${event.data.size} bytes)`);
        }
      };

      mediaRecorder.onstop = () => {
        if (isRestartingRef.current && streamRef.current) {
          console.log('🔄 Restarting MediaRecorder for next segment...');
          restartMediaRecorder();
        }
      };

      const restartMediaRecorder = () => {
        if (!streamRef.current || !isRecording) return;

        try {
          const newRecorder = new MediaRecorder(streamRef.current, {
            mimeType: 'audio/webm;codecs=opus',
          });

          newRecorder.ondataavailable = (event) => {
            if (event.data.size > 0 && !isRestartingRef.current) {
              currentSegment++;
              setSegmentCount(currentSegment);
              sendAudioChunk(event.data, currentSegment);
              console.log(`🎯 Segment ${currentSegment} completed and sent (${event.data.size} bytes)`);
            }
          };

          newRecorder.onstop = () => {
            if (isRestartingRef.current && streamRef.current) {
              console.log('🔄 Restarting MediaRecorder for next segment...');
              restartMediaRecorder();
            }
          };

          newRecorder.start();
          mediaRecorderRef.current = newRecorder;
          isRestartingRef.current = false;
        } catch (error) {
          console.error('❌ Error restarting MediaRecorder:', error);
          isRestartingRef.current = false;
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      startTimeRef.current = Date.now();

      // Set up interval for restarting segments (stop + start cycle)
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && 
            mediaRecorderRef.current.state === 'recording' && 
            !isRestartingRef.current) {
          console.log('🔄 Triggering segment restart...');
          isRestartingRef.current = true;
          mediaRecorderRef.current.stop();
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

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioMixerRef.current) {
      audioMixerRef.current.destroy();
      audioMixerRef.current = null;
    }

    setIsRecording(false);
    setSegmentCount(0);
    setRecordingTime('00:00:00');
    setHasSystemAudio(false);
    
    console.log('✅ Recording stopped successfully');
  }, []);

  // Update mixer volumes when they change - using useEffect with proper dependencies
  useEffect(() => {
    if (audioMixerRef.current && isRecording) {
      audioMixerRef.current.updateVolume('microphone', microphoneVolume);
      console.log('🎤 Updated microphone volume to:', microphoneVolume);
    }
  }, [microphoneVolume, isRecording]);

  useEffect(() => {
    if (audioMixerRef.current && isRecording) {
      audioMixerRef.current.updateVolume('system', systemVolume);
      console.log('🔊 Updated system volume to:', systemVolume);
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
