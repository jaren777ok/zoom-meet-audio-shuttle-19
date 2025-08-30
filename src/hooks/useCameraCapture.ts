import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraCaptureProps {
  userId: string;
  onPhotoSent?: () => void;
}

export const useCameraCapture = ({ userId, onPhotoSent }: UseCameraCaptureProps) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle video readiness with multiple event listeners and timeout
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current || isVideoReady) return;

    console.log('🎥 Setting up video event listeners...');

    const handleVideoReady = () => {
      console.log('📹 Video event triggered', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState
      });

      // Verify video has actual dimensions
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        console.log('✅ Video is fully ready with dimensions');
        setIsVideoReady(true);
        setError(null);
        
        // Clear timeout since video loaded successfully
        if (videoTimeoutRef.current) {
          clearTimeout(videoTimeoutRef.current);
          videoTimeoutRef.current = null;
        }
      } else {
        console.log('⚠️ Video dimensions not ready yet', {
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
    };

    // Add multiple event listeners for different loading stages
    video.addEventListener('loadedmetadata', handleVideoReady);
    video.addEventListener('loadeddata', handleVideoReady);
    video.addEventListener('canplay', handleVideoReady);

    // Set timeout for video loading (5 seconds)
    videoTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Video loading timeout - attempting retry...');
      if (!isVideoReady) {
        setError('La cámara está tardando en cargar. Reintentando...');
        
        // Retry after timeout
        retryTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Retrying video stream...');
          requestCameraPermission();
        }, 2000);
      }
    }, 5000);

    // Cleanup function
    return () => {
      video.removeEventListener('loadedmetadata', handleVideoReady);
      video.removeEventListener('loadeddata', handleVideoReady);
      video.removeEventListener('canplay', handleVideoReady);
      
      if (videoTimeoutRef.current) {
        clearTimeout(videoTimeoutRef.current);
        videoTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [streamRef.current, isVideoReady]);

  const requestCameraPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    setError(null);
    setIsVideoReady(false);
    
    try {
      console.log('🎥 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      console.log('✅ Camera access granted');
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('📺 Video element source set');
      }
      
      setIsPermissionGranted(true);
    } catch (err) {
      console.error('❌ Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current || !isVideoReady) {
      console.log('❌ Camera not ready for capture:', {
        hasVideo: !!videoRef.current,
        hasCanvas: !!canvasRef.current,
        hasStream: !!streamRef.current,
        isVideoReady
      });
      setError('La cámara no está lista para capturar');
      return;
    }

    const video = videoRef.current;
    
    // Additional validation: check video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('❌ Video dimensions not ready:', {
        width: video.videoWidth,
        height: video.videoHeight
      });
      setError('El video no está completamente cargado. Por favor, espera un momento.');
      return;
    }

    setIsCapturing(true);
    console.log('📸 Starting photo capture...');
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      console.log(`📐 Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
      console.log(`📺 Video ready state: ${video.readyState}`);
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log(`🖼️ Canvas size set to: ${canvas.width}x${canvas.height}`);
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);
      console.log('🎨 Video frame drawn to canvas');
      
      // Convert to blob directly (more efficient than base64)
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          console.log('✅ Photo captured successfully', {
            size: `${blob.size} bytes`,
            type: blob.type
          });
          const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedPhoto(photoDataUrl); // For preview
          setCapturedBlob(blob); // For sending
          setIsCapturing(false);
        } else {
          console.error('❌ Blob creation failed or empty blob');
          setError('Error al crear la imagen. Por favor, intenta de nuevo.');
          setIsCapturing(false);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (err) {
      console.error('❌ Error capturing photo:', err);
      setError('Error al capturar la foto');
      setIsCapturing(false);
    }
  }, [isVideoReady]);

  const retakePhoto = useCallback(() => {
    console.log('🔄 Retaking photo...');
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
    
    // Reset video readiness to ensure proper stream handling for retake
    setIsVideoReady(false);
    
    // Re-trigger video readiness check if stream exists
    if (streamRef.current && videoRef.current) {
      const video = videoRef.current;
      
      // Force video to reload metadata
      video.load();
      
      // Set up timeout for video readiness
      const timeoutId = setTimeout(() => {
        if (!isVideoReady) {
          console.log('⚠️ Video readiness timeout on retake, forcing ready state');
          setIsVideoReady(true);
        }
      }, 3000);
      
      videoTimeoutRef.current = timeoutId;
    }
  }, [isVideoReady]);

  const sendPhotoToWebhook = useCallback(async () => {
    if (!capturedBlob || !userId) {
      console.error('❌ Missing data for webhook:', { hasBlob: !!capturedBlob, userId });
      setError('No hay foto para enviar o falta el ID de usuario');
      return;
    }

    setIsSending(true);
    setError(null);
    console.log('📤 Sending photo to webhook...', {
      blobSize: capturedBlob.size,
      blobType: capturedBlob.type,
      userId
    });

    try {
      // Create form data with the blob directly
      const formData = new FormData();
      formData.append('photo', capturedBlob, 'camera-capture.jpg');
      formData.append('user_id', userId);
      formData.append('timestamp', new Date().toISOString());
      
      // Log FormData contents
      console.log('📋 FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'object' && value instanceof File) {
          console.log(`  ${key}: [File] ${value.size} bytes`);
        } else if (typeof value === 'object' && value && 'size' in value) {
          console.log(`  ${key}: [Blob] ${(value as Blob).size} bytes`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      // Send to webhook
      const webhookResponse = await fetch('https://cris.cloude.es/webhook/camara', {
        method: 'POST',
        body: formData,
      });

      console.log('🌐 Webhook response status:', webhookResponse.status);

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Error del servidor: ${webhookResponse.status}`);
      }

      console.log('✅ Foto enviada exitosamente al webhook');
      onPhotoSent?.();
      
    } catch (err) {
      console.error('❌ Error sending photo:', err);
      setError('Error al enviar la foto. Por favor, intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  }, [capturedBlob, userId, onPhotoSent]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    // Clear any pending timeouts
    if (videoTimeoutRef.current) {
      clearTimeout(videoTimeoutRef.current);
      videoTimeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Reset all states
    setIsPermissionGranted(false);
    setIsVideoReady(false);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
  }, []);

  return {
    isPermissionGranted,
    isRequestingPermission,
    isVideoReady,
    isCapturing,
    capturedPhoto,
    isSending,
    error,
    videoRef,
    canvasRef,
    requestCameraPermission,
    capturePhoto,
    retakePhoto,
    sendPhotoToWebhook,
    stopCamera
  };
};