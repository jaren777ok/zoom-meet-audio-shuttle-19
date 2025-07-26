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
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [systemStreamReady, setSystemStreamReady] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const isSystemAudioSupported = useMemo(() => {
    return typeof navigator !== 'undefined' && 
           'mediaDevices' in navigator && 
           'getDisplayMedia' in navigator.mediaDevices;
  }, []);

  // Add state for separate microphone stream management
  const microphoneStreamRef = useRef<MediaStream | null>(null);

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
  const sesionIDRef = useRef<string | null>(null);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Store audio chunks temporarily for combined sending
  const audioChunksRef = useRef<{
    microphone?: { blob: Blob; segmentNumber: number };
    system?: { blob: Blob; segmentNumber: number };
  }>({});

  // Send combined audio chunks to webhook
  const sendCombinedAudioChunk = useCallback(async (micBlob: Blob | null, systemBlob: Blob | null, segmentNumber: number) => {
    if (!webhookUrl.trim()) {
      console.log(`⚠️ No webhook URL, skipping segment ${segmentNumber}`);
      return;
    }

    const formData = new FormData();
    const timestamp = Date.now();
    
    // Add microphone audio with new filename format
    if (micBlob) {
      const micFile = new File([micBlob], `audio_segment_${segmentNumber}_${timestamp}.mp3`, {
        type: 'audio/webm'
      });
      formData.append('audio', micFile);
    }
    
    // Add system audio with new filename format
    if (systemBlob) {
      const systemFile = new File([systemBlob], `system_segment_${segmentNumber}_${timestamp}.mp3`, {
        type: 'audio/webm'
      });
      formData.append('system_audio', systemFile);
    }
    
    formData.append('sesionID', sesionIDRef.current || '');
    formData.append('segment_number', segmentNumber.toString());
    formData.append('user_id', userInfo.userId);
    formData.append('user_email', userInfo.userEmail);
    formData.append('numberOfPeople', meetingInfo.numberOfPeople.toString());
    formData.append('companyInfo', meetingInfo.companyInfo);
    formData.append('meetingObjective', meetingInfo.meetingObjective);
    formData.append('has_system_audio', hasSystemAudio.toString());

    try {
      console.log(`📤 Sending combined audio segment ${segmentNumber} to webhook (mic: ${micBlob?.size || 0} bytes, system: ${systemBlob?.size || 0} bytes)`);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log(`✅ Successfully sent combined segment ${segmentNumber}`);
      } else {
        console.error(`❌ Failed to send combined segment ${segmentNumber}:`, response.statusText);
      }
    } catch (error) {
      console.error(`❌ Error sending combined segment ${segmentNumber}:`, error);
    }
  }, [webhookUrl, userInfo.userId, userInfo.userEmail, meetingInfo, hasSystemAudio]);

  // Handle individual audio chunk and combine when both are ready
  const handleAudioChunk = useCallback(async (audioBlob: Blob, segmentNumber: number, audioType: 'microphone' | 'system') => {
    console.log(`🎯 ${audioType} data available for segment ${segmentNumber} (${audioBlob.size} bytes)`);
    
    // Store the chunk
    audioChunksRef.current[audioType] = { blob: audioBlob, segmentNumber };
    
    const chunks = audioChunksRef.current;
    const hasMicrophone = chunks.microphone?.segmentNumber === segmentNumber;
    const hasSystem = chunks.system?.segmentNumber === segmentNumber;
    const expectsSystem = hasSystemAudio && systemRecorderRef.current;
    
    // Send when we have the microphone and either don't need system audio or have it
    if (hasMicrophone && (!expectsSystem || hasSystem)) {
      await sendCombinedAudioChunk(
        chunks.microphone?.blob || null,
        chunks.system?.blob || null,
        segmentNumber
      );
      
      // Clear processed chunks
      if (chunks.microphone?.segmentNumber === segmentNumber) {
        delete chunks.microphone;
      }
      if (chunks.system?.segmentNumber === segmentNumber) {
        delete chunks.system;
      }
    }
  }, [sendCombinedAudioChunk, hasSystemAudio]);

  // Create MediaRecorder with proper event handling
  const createMediaRecorder = useCallback((stream: MediaStream, audioType: 'microphone' | 'system') => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0 && isRecordingRef.current) {
        const segmentNumber = currentSegmentRef.current;
        await handleAudioChunk(event.data, segmentNumber, audioType);
      }
    };

    recorder.onstop = () => {
      console.log(`🛑 ${audioType} recorder stopped`);
    };

    recorder.onerror = (event) => {
      console.error(`❌ ${audioType} recorder error:`, event);
    };

    return recorder;
  }, [handleAudioChunk]);

  // New function to request screen sharing permissions separately
  const requestScreenPermissions = useCallback(async () => {
    if (isRequestingPermissions || systemStreamRef.current) {
      console.log('🔄 Screen permissions already requested or in progress');
      return true;
    }

    setIsRequestingPermissions(true);
    console.log('🔊 Requesting screen sharing permissions...');

    try {
      const systemStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Required by some browsers for system audio
        audio: {
          echoCancellation: false, // Keep system audio natural
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        }
      });

      console.log('🔊 Display media stream acquired:', systemStream);
      console.log('🔊 Video tracks:', systemStream.getVideoTracks().length);
      console.log('🔊 Audio tracks:', systemStream.getAudioTracks().length);

      const audioTracks = systemStream.getAudioTracks();
      const videoTracks = systemStream.getVideoTracks();
      
      if (audioTracks.length > 0) {
        console.log('✅ System audio tracks found:', audioTracks.map(track => ({
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        })));
        
        // Verify tracks are actually active and not muted
        const activeTracks = audioTracks.filter(track => 
          track.readyState === 'live' && track.enabled && !track.muted
        );
        
        console.log('🔊 Active system audio tracks:', activeTracks.length);
        
        // Stop video tracks immediately if we got them (we only need audio)
        videoTracks.forEach(track => {
          console.log('🎥 Stopping video track:', track.label);
          track.stop();
        });
        
        // Create a new stream with only audio tracks
        const audioOnlyStream = new MediaStream(audioTracks);
        console.log('🔊 Created audio-only stream with', audioOnlyStream.getAudioTracks().length, 'tracks');
        
        // Update states in the correct order
        systemStreamRef.current = audioOnlyStream;
        setSystemStreamReady(true);
        setIsScreenShared(true);
        setHasSystemAudio(true); // This must be last to ensure other states are ready
        
        console.log('✅ System audio states updated: hasSystemAudio=true, systemStreamReady=true');

        // Listen for track ending (user stops sharing)
        audioTracks.forEach(track => {
          track.addEventListener('ended', () => {
            console.log('🛑 System audio track ended - user stopped sharing');
            setIsScreenShared(false);
            setSystemStreamReady(false);
            setHasSystemAudio(false);
            systemStreamRef.current = null;
            if (systemRecorderRef.current) {
              systemRecorderRef.current = null;
            }
          });
        });

        setIsRequestingPermissions(false);
        return true;
        
      } else {
        console.log('⚠️ No system audio tracks available in stream');
        console.log('💡 User might need to select "Share audio" in the screen sharing dialog');
        setHasSystemAudio(false);
        setIsScreenShared(false);
        setSystemStreamReady(false);
        // Stop all tracks since we don't need video
        systemStream.getTracks().forEach(track => track.stop());
        setIsRequestingPermissions(false);
        return false;
      }
    } catch (systemError) {
      console.error('❌ System audio capture failed:', systemError);
      console.log('💡 Possible causes:');
      console.log('   - User denied screen sharing permission');
      console.log('   - User did not select "Share audio" option');
      console.log('   - Browser does not support system audio capture');
      console.log('   - No audio is currently playing on the system');
      setHasSystemAudio(false);
      setIsScreenShared(false);
      setSystemStreamReady(false);
      setIsRequestingPermissions(false);
      return false;
    }
  }, [isRequestingPermissions]);

  // Function to request microphone permissions separately
  const requestMicrophonePermissions = useCallback(async (): Promise<boolean> => {
    console.log('🎤 Requesting microphone permissions...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false 
      });
      
      console.log('✅ Microphone access granted');
      microphoneStreamRef.current = stream;
      return true;
      
    } catch (error) {
      console.error('❌ Failed to get microphone access:', error);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting dual recording with system audio:', captureSystemAudio);
      
      // Generate unique session ID at the start of recording
      if (!sesionIDRef.current) {
        sesionIDRef.current = `${userInfo.userId}_${Date.now()}`;
        console.log('🆔 New sesionID generated:', sesionIDRef.current);
      }
      
      // Reset state
      currentSegmentRef.current = 0;
      isRecordingRef.current = true;
      pendingChunks.current.clear();

      // Get microphone stream (use existing if available)
      let micStream: MediaStream;
      if (microphoneStreamRef.current) {
        console.log('✅ Using existing microphone stream');
        micStream = microphoneStreamRef.current;
      } else {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        microphoneStreamRef.current = micStream;
        console.log('🎤 New microphone stream captured successfully');
      }
      
      micStreamRef.current = micStream;

      // Set up microphone recorder
      const micRecorder = createMediaRecorder(micStream, 'microphone');
      micRecorderRef.current = micRecorder;

      // Try to get system audio if requested and not already available
      if (captureSystemAudio && isSystemAudioSupported) {
        if (systemStreamRef.current && systemStreamReady) {
          console.log('✅ Using existing system audio stream');
          
          // Verify the stream is still active
          const audioTracks = systemStreamRef.current.getAudioTracks();
          const activeTracks = audioTracks.filter(track => 
            track.readyState === 'live' && track.enabled && !track.muted
          );
          
          if (activeTracks.length > 0) {
            // Set up system audio recorder with existing stream
            try {
              const systemRecorder = createMediaRecorder(systemStreamRef.current, 'system');
              systemRecorderRef.current = systemRecorder;
              console.log('✅ System audio recorder created with existing stream');
              
              // Ensure hasSystemAudio is true when we have an active stream and recorder
              if (!hasSystemAudio) {
                console.log('🔄 Updating hasSystemAudio to true');
                setHasSystemAudio(true);
              }
            } catch (recorderError) {
              console.error('❌ Failed to create system audio recorder with existing stream:', recorderError);
              setHasSystemAudio(false);
            }
          } else {
            console.log('⚠️ System stream exists but no active audio tracks');
            setHasSystemAudio(false);
          }
        } else {
          console.log('⚠️ System audio requested but no stream available. User should click "Share Screen" first.');
          setHasSystemAudio(false);
        }
      } else {
        console.log('🔊 System audio capture not requested or not supported');
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
  }, [captureSystemAudio, isSystemAudioSupported, intervalSeconds, formatTime, createMediaRecorder, handleAudioChunk, systemStreamReady]);

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
      // Don't stop the microphone stream tracks to keep permissions
      micStreamRef.current = null;
    }

    // Don't clean up system stream - keep it for reuse
    // Only clean up the recorder
    systemRecorderRef.current = null;

    // Reset state
    setSegmentCount(0);
    setRecordingTime('00:00:00');
    // Don't reset hasSystemAudio - keep it if stream is still available
    currentSegmentRef.current = 0;
    pendingChunks.current.clear();
    
    // Reset session ID for next session
    sesionIDRef.current = null;
    console.log('🆔 sesionID cleared for next session');
    
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
    stopRecording,
  };
};