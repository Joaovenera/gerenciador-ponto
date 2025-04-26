import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface GeolocationPosition {
  latitude: number;
  longitude: number;
}

interface UseGeolocationOptions {
  onPositionSuccess?: (position: GeolocationPosition) => void;
  onPositionError?: (error: string) => void;
}

interface UseGeolocationResult {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => Promise<GeolocationPosition | null>;
  resetLocation: () => void;
}

export function useGeolocation(options?: UseGeolocationOptions): UseGeolocationResult {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePositionSuccess = useCallback((position: GeolocationPosition) => {
    setPosition(position);
    setError(null);
    setLoading(false);
    
    if (options?.onPositionSuccess) {
      options.onPositionSuccess(position);
    }
  }, [options]);

  const handlePositionError = useCallback((error: string) => {
    setError(error);
    setPosition(null);
    setLoading(false);
    
    toast({
      title: "Erro de localização",
      description: "Por favor, permita o acesso à sua localização para continuar.",
      variant: "destructive",
    });
    
    if (options?.onPositionError) {
      options.onPositionError(error);
    }
  }, [options, toast]);

  const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!navigator.geolocation) {
      const errorMsg = "Geolocalização não suportada pelo navegador";
      handlePositionError(errorMsg);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            let errorMsg = "Erro desconhecido ao obter localização";
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = "Permissão para geolocalização negada";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = "Informações de localização indisponíveis";
                break;
              case error.TIMEOUT:
                errorMsg = "Tempo esgotado para obter localização";
                break;
            }
            
            reject(errorMsg);
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      });

      handlePositionSuccess(position);
      return position;
    } catch (error) {
      const errorMsg = typeof error === 'string' ? error : 'Erro ao obter localização';
      handlePositionError(errorMsg);
      return null;
    }
  }, [handlePositionSuccess, handlePositionError]);

  const resetLocation = useCallback(() => {
    setPosition(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    position,
    error,
    loading,
    requestLocation,
    resetLocation
  };
}
