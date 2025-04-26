import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseCameraOptions {
  onPhotoCapture?: (photoData: string) => void;
}

interface UseCameraResult {
  isCameraActive: boolean;
  photoData: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  takePhoto: () => void;
  error: string | null;
  resetPhoto: () => void;
}

export function useCamera(options?: UseCameraOptions): UseCameraResult {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async (): Promise<boolean> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        return true;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      setError(errorMessage);
      toast({
        title: "Erro na câmera",
        description: "Por favor, permita o acesso à sua câmera para continuar.",
        variant: "destructive",
      });
      return false;
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !isCameraActive) {
      setError("Câmera não está ativa");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Não foi possível criar contexto de canvas");
        return;
      }
      
      // Draw the video frame on the canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to data URL
      const photo = canvas.toDataURL("image/jpeg");
      setPhotoData(photo);
      
      // Call onPhotoCapture callback if provided
      if (options?.onPhotoCapture) {
        options.onPhotoCapture(photo);
      }
      
      // Stop the camera after taking the photo
      stopCamera();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao capturar foto';
      setError(errorMessage);
    }
  };

  const resetPhoto = () => {
    setPhotoData(null);
  };

  return {
    isCameraActive,
    photoData,
    videoRef,
    startCamera,
    stopCamera,
    takePhoto,
    error,
    resetPhoto
  };
}
