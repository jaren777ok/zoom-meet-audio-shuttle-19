import { useState, useRef, useCallback } from 'react';

interface UseCameraCaptureProps {
  userId: string;
  onPhotoSent?: () => void;
}

export const useCameraCapture = ({ userId, onPhotoSent }: UseCameraCaptureProps) => {
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const requestCameraPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    setError(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsPermissionGranted(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) {
      setError('La cámara no está lista para capturar');
      return;
    }

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedPhoto(photoDataUrl);
      
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Error al capturar la foto');
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setError(null);
  }, []);

  const sendPhotoToWebhook = useCallback(async () => {
    if (!capturedPhoto || !userId) {
      setError('No hay foto para enviar o falta el ID de usuario');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedPhoto);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('photo', blob, 'camera-capture.jpg');
      formData.append('user_id', userId);
      formData.append('timestamp', new Date().toISOString());
      
      // Send to webhook
      const webhookResponse = await fetch('https://cris.cloude.es/webhook/camara', {
        method: 'POST',
        body: formData,
      });

      if (!webhookResponse.ok) {
        throw new Error(`Error del servidor: ${webhookResponse.status}`);
      }

      console.log('✅ Foto enviada exitosamente al webhook');
      onPhotoSent?.();
      
    } catch (err) {
      console.error('Error sending photo:', err);
      setError('Error al enviar la foto. Por favor, intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  }, [capturedPhoto, userId, onPhotoSent]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsPermissionGranted(false);
    setCapturedPhoto(null);
    setError(null);
  }, []);

  return {
    isPermissionGranted,
    isRequestingPermission,
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