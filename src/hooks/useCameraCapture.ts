import { useState, useRef, useCallback } from 'react';

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

  const onVideoReady = useCallback(() => {
    console.log('📹 Video stream is ready');
    setIsVideoReady(true);
  }, []);

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
      setError('La cámara no está lista para capturar');
      return;
    }

    setIsCapturing(true);
    console.log('📸 Starting photo capture...');
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      console.log(`📐 Video dimensions: ${video.videoWidth}x${video.videoHeight}`);
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Convert to blob directly (more efficient than base64)
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('✅ Photo captured successfully', `Size: ${blob.size} bytes`);
          const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedPhoto(photoDataUrl); // For preview
          setCapturedBlob(blob); // For sending
        } else {
          throw new Error('Failed to create blob from canvas');
        }
      }, 'image/jpeg', 0.8);
      
    } catch (err) {
      console.error('❌ Error capturing photo:', err);
      setError('Error al capturar la foto');
    } finally {
      setIsCapturing(false);
    }
  }, [isVideoReady]);

  const retakePhoto = useCallback(() => {
    console.log('🔄 Retaking photo...');
    setCapturedPhoto(null);
    setCapturedBlob(null);
    setError(null);
  }, []);

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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
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
    onVideoReady,
    requestCameraPermission,
    capturePhoto,
    retakePhoto,
    sendPhotoToWebhook,
    stopCamera
  };
};