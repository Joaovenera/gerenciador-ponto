
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

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
    
    // Here you can handle the photo data (send to server, etc.)
    console.log("Photo captured");
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
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
    </div>
  );
}
