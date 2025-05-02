
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, ChevronLeft, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function CameraPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [recordType, setRecordType] = useState<"in" | "out">("in");
  const [step, setStep] = useState<"camera" | "confirmation">("camera");
  const [justification, setJustification] = useState<string>("");
  
  // Get geolocation
  const { position, requestLocation } = useGeolocation();
  
  // Get client IP (need this for time record)
  const [clientIp, setClientIp] = useState<string>("0.0.0.0");
  
  // Get IP address
  useEffect(() => {
    fetch("/api/ip")
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(err => console.error("Error fetching IP:", err));
  }, []);
  
  // Get record type from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("type");
    if (type === "in" || type === "out") {
      setRecordType(type);
    }
    
    // Request location on component mount
    requestLocation().catch(error => {
      toast({
        title: "Erro de localização",
        description: "Não foi possível obter sua localização. Verifique as permissões do navegador.",
        variant: "destructive",
      });
    });
    
    // Start camera
    startCamera().catch(error => {
      toast({
        title: "Erro da câmera",
        description: "Não foi possível acessar sua câmera. Verifique as permissões do navegador.",
        variant: "destructive",
      });
    });
    
    return () => stopCamera();
  }, []);
  
  // Register time record mutation
  const registerRecordMutation = useMutation({
    mutationFn: async (recordData: any) => {
      const res = await apiRequest("POST", "/api/time-records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/status"] });
      toast({
        title: `Ponto ${recordType === "in" ? "de entrada" : "de saída"} registrado`,
        description: "Seu registro foi salvo com sucesso",
      });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar ponto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast({
        title: "Erro ao acessar câmera",
        description: "Por favor, permita o acesso à sua câmera",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (!videoRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photo = canvas.toDataURL("image/jpeg");
    setPhotoData(photo);
    stopCamera();
    setStep("confirmation");
  };
  
  const handleConfirm = () => {
    if (!position || !photoData) {
      toast({
        title: "Informações incompletas",
        description: "É necessário capturar a foto e obter a localização",
        variant: "destructive",
      });
      return;
    }
    
    registerRecordMutation.mutate({
      latitude: position.latitude.toString(),
      longitude: position.longitude.toString(),
      photo: photoData,
      type: recordType,
      ipAddress: clientIp,
      justification: justification.trim() || undefined,
    });
  };
  
  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {step === "camera" && (
        <>
          <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleCancel}
              className="text-white"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-white font-medium">
              Registrar {recordType === "in" ? "Entrada" : "Saída"}
            </h1>
            <div className="w-10"></div>
          </div>
          
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            className="w-full h-full object-cover"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Button 
              onClick={takePhoto}
              className="w-full bg-white text-black hover:bg-white/90"
              size="lg"
              disabled={!isCameraActive}
            >
              <Camera className="h-6 w-6 mr-2" />
              Capturar Foto
            </Button>
          </div>
        </>
      )}
      
      {step === "confirmation" && photoData && (
        <div className="flex flex-col h-full bg-gray-100">
          <div className="p-4 bg-primary text-white flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setStep("camera");
                startCamera();
              }}
              className="text-white mr-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="font-medium">Confirmar Registro</h1>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="font-medium mb-2">Detalhes do Registro</h2>
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Tipo:</span> 
                  <span className="ml-2">{recordType === "in" ? "Entrada" : "Saída"}</span>
                </div>
                <div>
                  <span className="font-medium">Funcionário:</span> 
                  <span className="ml-2">{user?.fullName}</span>
                </div>
                {position && (
                  <div>
                    <span className="font-medium">Localização:</span>
                    <span className="ml-2">
                      Lat: {position.latitude.toFixed(6)}, Long: {position.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="font-medium mb-2">Foto Capturada</h2>
              <img 
                src={photoData} 
                alt="Foto para registro de ponto"
                className="w-full rounded-lg"
              />
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="font-medium mb-2">Justificativa (opcional)</h2>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Digite uma justificativa, se necessário"
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-4 border-t bg-white">
            <Button 
              onClick={handleConfirm}
              className="w-full bg-green-500 hover:bg-green-600 mb-2"
              disabled={registerRecordMutation.isPending}
            >
              {registerRecordMutation.isPending ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Confirmar Registro</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleCancel}
              className="w-full"
              disabled={registerRecordMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
