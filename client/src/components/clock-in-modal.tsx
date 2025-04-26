import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Loader2, MapPin, Camera, CheckCircle } from "lucide-react";
import { getCurrentDateTime } from "@/lib/utils";

interface ClockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { latitude: number; longitude: number; photo: string }) => void;
}

export default function ClockInModal({ isOpen, onClose, onConfirm }: ClockInModalProps) {
  const [step, setStep] = useState<"location" | "camera" | "confirmation">("location");
  
  // Get geolocation
  const { 
    position, 
    error: geoError, 
    loading: geoLoading, 
    requestLocation 
  } = useGeolocation();
  
  // Camera hook
  const { 
    videoRef, 
    photoData, 
    error: cameraError, 
    isCameraActive, 
    startCamera, 
    takePhoto,
    setIsCameraActive
  } = useCamera();
  
  // Handle location request
  const handleLocationRequest = async () => {
    const pos = await requestLocation();
    if (pos) {
      setStep("camera");
    }
  };
  
  // Handle camera redirection
  const handleCamera = () => {
    window.location.href = '/camera?returnTo=clockIn';
  };
  
  // Handle photo from camera page
  useEffect(() => {
    const photoFromCamera = sessionStorage.getItem('cameraPhoto');
    if (photoFromCamera) {
      setPhotoData(photoFromCamera);
      setStep("confirmation");
      sessionStorage.removeItem('cameraPhoto');
    }
  }, []);
  
  // Handle confirmation
  const handleConfirm = () => {
    if (position && photoData) {
      onConfirm({
        latitude: position.latitude,
        longitude: position.longitude,
        photo: photoData,
      });
    }
  };
  
  // Auto start camera when step changes to camera
  useEffect(() => {
    if (step === "camera" && !isCameraActive) {
      handleCameraStart();
    }
  }, [step, isCameraActive]);
  
  // Handle modal close and reset state
  const handleClose = () => {
    setStep("location");
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Entrada</DialogTitle>
          <DialogDescription>
            {step === "location" && "Para registrar sua entrada, precisamos acessar sua localização atual."}
            {step === "camera" && "Agora, precisamos tirar uma foto para confirmar sua identidade."}
            {step === "confirmation" && "Confira as informações abaixo e confirme seu registro de entrada:"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Location Step */}
        {step === "location" && (
          <div className="mt-4 space-y-4">
            {geoError && (
              <div className="p-2 text-sm bg-red-100 text-red-700 rounded">
                {geoError}. Por favor, permita o acesso à sua localização.
              </div>
            )}
            
            <Button 
              onClick={handleLocationRequest} 
              className="w-full"
              disabled={geoLoading}
            >
              {geoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Obtendo localização...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Compartilhar minha localização</span>
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Camera Step */}
        {step === "camera" && (
          <div className="mt-4 space-y-4">
            {cameraError && (
              <div className="p-2 text-sm bg-red-100 text-red-700 rounded">
                {cameraError}. Por favor, permita o acesso à sua câmera.
              </div>
            )}
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <Button 
                onClick={handleCamera}
                className="w-full"
                size="lg"
              >
                <Camera className="h-4 w-4 mr-2" />
                <span>Abrir Câmera</span>
              </Button>
            </div>
          </div>
        )}
        
        {/* Confirmation Step */}
        {step === "confirmation" && (
          <div className="mt-4 space-y-4">
            <div className="mb-4 bg-gray-50 p-3 rounded-lg text-sm">
              <div className="mb-2">
                <span className="font-medium">Data e Hora:</span> 
                <span className="ml-2">{getCurrentDateTime()}</span>
              </div>
              {position && (
                <div className="mb-2">
                  <span className="font-medium">Localização:</span>
                  <span className="ml-2">
                    Lat: {position.latitude.toFixed(6)}, Long: {position.longitude.toFixed(6)}
                  </span>
                </div>
              )}
            </div>
            
            {photoData && (
              <div className="mb-4">
                <p className="font-medium text-sm mb-2">Foto capturada:</p>
                <img 
                  src={photoData} 
                  alt="Captura da câmera"
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}
            
            <Button 
              onClick={handleConfirm}
              className="w-full bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Confirmar Entrada</span>
            </Button>
          </div>
        )}
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
