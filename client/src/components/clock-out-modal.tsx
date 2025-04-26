import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { Loader2, MapPin, Camera, CheckCircle } from "lucide-react";
import { getCurrentDateTime } from "@/lib/utils";

interface ClockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { latitude: number; longitude: number; photo: string }) => void;
}

export default function ClockOutModal({ isOpen, onClose, onConfirm }: ClockOutModalProps) {
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
    takePhoto 
  } = useCamera();
  
  // Handle location request
  const handleLocationRequest = async () => {
    const pos = await requestLocation();
    if (pos) {
      setStep("camera");
    }
  };
  
  // Handle camera
  const handleCameraStart = async () => {
    if (!isCameraActive) {
      await startCamera();
    }
  };
  
  // Handle photo capture
  const handleTakePhoto = () => {
    takePhoto();
    setStep("confirmation");
  };
  
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
  
  // Handle modal close and reset state
  const handleClose = () => {
    setStep("location");
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Saída</DialogTitle>
          <DialogDescription>
            {step === "location" && "Para registrar sua saída, precisamos acessar sua localização atual."}
            {step === "camera" && "Agora, precisamos tirar uma foto para confirmar sua identidade."}
            {step === "confirmation" && "Confira as informações abaixo e confirme seu registro de saída:"}
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
            
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
              {!isCameraActive ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button onClick={handleCameraStart}>
                    <Camera className="h-4 w-4 mr-2" />
                    <span>Iniciar Câmera</span>
                  </Button>
                </div>
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                ></video>
              )}
            </div>
            
            <Button 
              onClick={handleTakePhoto}
              className="w-full"
              disabled={!isCameraActive}
            >
              <Camera className="h-4 w-4 mr-2" />
              <span>Capturar Foto</span>
            </Button>
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
              className="w-full bg-red-500 hover:bg-red-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Confirmar Saída</span>
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
