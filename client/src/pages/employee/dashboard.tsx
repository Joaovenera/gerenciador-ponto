import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LogIn,
  User,
  Clock,
  Calendar,
  ChevronRight,
  Activity,
  Menu,
  X,
  Map,
  BellRing,
  Settings,
  Shield,
} from "lucide-react";
import {
  formatDateWithWeekday,
  getCurrentTime,
  getCurrentDate,
  getTypeIcon,
  getTypeColor,
  cn,
} from "@/lib/utils";
import ClockInModal from "@/components/clock-in-modal";
import ClockOutModal from "@/components/clock-out-modal";
import { TimeRecord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDashboard() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(
    formatDateWithWeekday(new Date()),
  );
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [justificationModal, setJustificationModal] = useState({ open: false, text: "" });

  // Time interval to update current time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(formatDateWithWeekday(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Get user status (in/out)
  const { data: statusData, isLoading: statusLoading } = useQuery<{status: "in" | "out"}>({  
    queryKey: ["/api/time-records/status"],
    refetchInterval: 30000, // Refetch every 30s
  });

  // Get client IP
  const { data: ipData } = useQuery<{ip: string}>({  
    queryKey: ["/api/ip"],
  });

  // Get user's time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({  
    queryKey: ["/api/time-records/me"],
  });


  // Register time record mutation
  const registerRecordMutation = useMutation({
    mutationFn: async (recordData: {
      type: string;
      ipAddress: string;
      latitude: number;
      longitude: number;
      photo: string;
      justification?: string;
    }) => {
      const res = await apiRequest("POST", "/api/time-records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/status"] });
    },
  });

  // Group time records by date
  const groupedRecords: Record<string, TimeRecord[]> = timeRecords ? groupRecordsByDate(timeRecords) : {};

  // Get current user status
  const currentStatus: "in" | "out" = statusData?.status || "out";

  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const clockDigitsVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24, delay: 0.3 } }
  };
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-blue-50 to-white"
    >
      {/* Mobile-optimized Header */}
      <header className="backdrop-blur-sm bg-white/90 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <motion.div 
          variants={itemVariants}
          className="px-4 h-16 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="bg-primary h-8 w-8 rounded-full flex items-center justify-center shadow-sm">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="font-bold text-primary text-base">
              Ponto Eletrônico
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border border-slate-200 shadow-sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 border-l shadow-lg">
                    <SheetHeader className="pb-6">
                      <SheetTitle className="flex items-center justify-between">
                        <span className="text-xl font-bold text-slate-800">Menu</span>
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-8 w-8 hover:bg-slate-100"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </SheetClose>
                      </SheetTitle>
                    </SheetHeader>

                  <div className="space-y-6">
                    {/* User Profile Card */}
                    <div className="p-4 bg-slate-100 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {getInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-medium text-slate-500 px-1 mb-2">
                        MENU
                      </h3>

                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal text-base"
                        onClick={() => {
                          setSidebarOpen(false);
                        }}
                      >
                        <Clock className="mr-3 h-5 w-5" />
                        Dashboard
                      </Button>

                      {user.accessLevel === "admin" && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-base"
                          onClick={() => {
                            navigate("/admin");
                            setSidebarOpen(false);
                          }}
                        >
                          <User className="mr-3 h-5 w-5" />
                          Painel Administrativo
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        className="w-full justify-start font-normal text-base text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => {
                          logoutMutation.mutate();
                          setSidebarOpen(false);
                        }}
                      >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sair
                      </Button>
                    </div>

                    {/* Connection Info */}
                    <div className="mt-auto pt-6">
                      <div className="text-xs text-slate-500 flex items-center justify-between px-1">
                        <span>IP: </span>
                        <Badge variant="outline" className="font-mono">
                          {ipData?.ip || "..."}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="px-4 py-6 pb-20">
        {/* Clock Card - Improved */}
        <motion.div variants={itemVariants}>
          <Card className="mb-7 border-none overflow-hidden rounded-xl card-shadow bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary/95 via-primary to-blue-600 p-6 text-white">
                <div className="flex items-start justify-between mb-6">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-white/80 text-sm font-medium flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 opacity-80" />
                      {currentDate}
                    </p>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Badge
                      variant={currentStatus === "in" ? "success" : "destructive"}
                      className={cn(
                        "px-3 py-1 text-xs border-0 shadow-md",
                        currentStatus === "in" 
                          ? "bg-emerald-500/90 text-white" 
                          : "bg-rose-500/90 text-white"
                      )}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-1.5 ${currentStatus === "in" ? "bg-white animate-pulse" : "bg-white"}`}
                      ></div>
                      <span className="font-medium">
                        {currentStatus === "in" ? "Na empresa" : "Fora da empresa"}
                      </span>
                    </Badge>
                  </motion.div>
                </div>

                <div className="text-center mb-4">
                  <motion.div 
                    variants={clockDigitsVariants}
                    className="text-7xl font-bold tracking-tight mb-1 font-mono"
                  >
                    {currentTime}
                  </motion.div>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-white/70 text-xs mt-2 font-medium"
                  >
                    É importante registrar o ponto de entrada e saída corretamente
                  </motion.p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          variants={itemVariants} 
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <motion.div
            whileHover={{ scale: currentStatus === "in" ? 1 : 1.03, y: currentStatus === "in" ? 0 : -3 }}
            whileTap={{ scale: currentStatus === "in" ? 1 : 0.97 }}
          >
            <Button
              onClick={() => navigate("/camera?type=in")}
              disabled={currentStatus === "in" || registerRecordMutation.isPending}
              className="flex flex-col items-center justify-center py-5 gap-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl h-24 w-full rounded-xl disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <LogIn className="h-6 w-6" />
              </div>
              <span className="font-medium">Entrada</span>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: currentStatus === "out" ? 1 : 1.03, y: currentStatus === "out" ? 0 : -3 }}
            whileTap={{ scale: currentStatus === "out" ? 1 : 0.97 }}
          >
            <Button
              onClick={() => navigate("/camera?type=out")}
              disabled={currentStatus === "out" || registerRecordMutation.isPending}
              className="flex flex-col items-center justify-center py-5 gap-3 bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl h-24 w-full rounded-xl disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed"
            >
              <div className="bg-white/20 p-2 rounded-full">
                <LogOut className="h-6 w-6" />
              </div>
              <span className="font-medium">Saída</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Records Section */}
        <Card className="border-none shadow-md overflow-hidden">
          <Tabs defaultValue="today" className="w-full">
            <div className="px-4 pt-3 pb-0">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="today">Hoje</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="today" className="pb-0 px-0 pt-3">
              {recordsLoading ? (
                <div className="space-y-3 p-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="pb-4">
                  {groupedRecords[getCurrentDate()] &&
                  groupedRecords[getCurrentDate()].length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {groupedRecords[getCurrentDate()].map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center p-3 hover:bg-slate-50"
                        >
                          <div
                            className={`h-10 w-10 rounded-full ${record.type === "in" ? "bg-emerald-100" : "bg-rose-100"} flex items-center justify-center mr-3`}
                          >
                            {record.type === "in" ? (
                              <LogIn className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <LogOut className="h-5 w-5 text-rose-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-slate-900 text-sm">
                                  {record.type === "in" ? "Entrada" : "Saída"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {record.justification ? (
                                    <span 
                                      className="flex items-center text-primary cursor-pointer hover:underline"
                                      onClick={() => setJustificationModal({ open: true, text: record.justification || "" })}
                                    >
                                      <span className="mr-1">Com justificativa</span>
                                    </span>
                                  ) : (
                                    "Registrado com sucesso"
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-base font-mono font-semibold">
                                  {format(
                                    new Date(record.timestamp),
                                    "HH:mm:ss",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-slate-100 p-3 mb-3">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <h3 className="text-slate-800 font-medium mb-1 text-sm">
                        Nenhum registro hoje
                      </h3>
                      <p className="text-slate-500 text-xs max-w-xs">
                        Utilize os botões acima para registrar sua entrada e
                        saída.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="pt-3 pb-4 px-0">
              {recordsLoading ? (
                <div className="space-y-3 p-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Filtro de Data (Opcional para melhorar a navegação) */}
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">HISTÓRICO DE REGISTROS</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">
                        {Object.entries(groupedRecords).length} dias com registros
                      </div>
                    </div>
                    {isToday(Object.keys(groupedRecords)[0]) && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-xs text-blue-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1.5">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 8v4"></path>
                            <path d="M12 16h.01"></path>
                          </svg>
                          Normalmente, o histórico exibe apenas registros de dias anteriores. Para fins de demonstração, estamos exibindo também os registros de hoje.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Lista de Registros por Data */}
                  <div className="space-y-4 px-3">
                    {Object.entries(groupedRecords)
                      // Ordena as datas da mais recente para a mais antiga
                      .sort(([dateA], [dateB]) => {
                        const partsA = dateA.split('/');
                        const partsB = dateB.split('/');
                        const dateObjA = new Date(`${partsA[2]}-${partsA[1]}-${partsA[0]}`);
                        const dateObjB = new Date(`${partsB[2]}-${partsB[1]}-${partsB[0]}`);
                        return dateObjB.getTime() - dateObjA.getTime();
                      })
                      .slice(0, 7) // Limit to 7 days for mobile
                      .map(([date, records]) => (
                        <div
                          key={date}
                          className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-100"
                        >
                          <div className="flex items-center justify-between bg-slate-50 px-4 py-2 border-b border-slate-100">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-primary mr-2" />
                              <h4 className="text-sm font-medium text-slate-800">
                                {date}
                              </h4>
                              <span className="text-xs text-slate-500 ml-2 capitalize">
                                {format(
                                  parseISO(records[0].timestamp.toString()),
                                  "EEEE",
                                  { locale: ptBR },
                                )}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {records.length} registros
                            </Badge>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {records.map((record) => (
                              <div
                                key={record.id}
                                className="p-3 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center">
                                    <div
                                      className={`flex items-center justify-center h-7 w-7 rounded-full ${record.type === "in" ? "bg-emerald-100" : "bg-rose-100"} mr-2`}
                                    >
                                      {record.type === "in" ? (
                                        <LogIn className="h-3.5 w-3.5 text-emerald-600" />
                                      ) : (
                                        <LogOut className="h-3.5 w-3.5 text-rose-600" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-slate-800">
                                        {record.type === "in" ? "Entrada" : "Saída"}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        IP: {record.ipAddress}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-base font-mono font-semibold">
                                      {format(
                                        parseISO(record.timestamp.toString()),
                                        "HH:mm:ss",
                                      )}
                                    </p>
                                    {record.isManual && (
                                      <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 mt-1">
                                        Registro Manual
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Justificativa (se existir) */}
                                {record.justification && (
                                  <div 
                                    className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-100 cursor-pointer"
                                    onClick={() => setJustificationModal({ open: true, text: record.justification || "" })}
                                  >
                                    <div className="flex items-center mb-1">
                                      <Activity className="h-3 w-3 text-primary mr-1" />
                                      <span className="text-xs font-medium text-slate-700">Justificativa:</span>
                                    </div>
                                    <p className="text-xs text-slate-600 line-clamp-2">{record.justification}</p>
                                    {record.justification.length > 100 && (
                                      <p className="text-xs text-primary mt-1 text-right">Ver mais</p>
                                    )}
                                  </div>
                                )}
                                
                                {/* Link para ver no mapa */}
                                {record.latitude && record.longitude && (
                                  <div className="mt-2 text-xs">
                                    <a 
                                      href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline flex items-center"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                                        <line x1="8" y1="2" x2="8" y2="18"></line>
                                        <line x1="16" y1="6" x2="16" y2="22"></line>
                                      </svg>
                                      Ver localização no mapa
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                    {Object.entries(groupedRecords).length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg shadow-sm border border-slate-100">
                        <div className="rounded-full bg-slate-100 p-3 mb-3">
                          <Calendar className="h-5 w-5 text-slate-400" />
                        </div>
                        <h3 className="text-slate-800 font-medium mb-1 text-sm">
                          Nenhum registro encontrado
                        </h3>
                        <p className="text-slate-500 text-xs max-w-xs">
                          Seus registros anteriores aparecerão aqui.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </main>

      {/* Fixed Action Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-center">
        <div className="text-xs text-slate-500 flex gap-1 items-center">
          <Clock className="h-3 w-3 text-slate-400" />
          <span>
            Ponto Eletrônico • IP:{" "}
            <span className="font-mono">{ipData?.ip || "..."}</span>
          </span>
        </div>
      </div>

      {/* Modals */}
      <ClockInModal
        isOpen={isClockInModalOpen}
        onClose={() => setIsClockInModalOpen(false)}
        onConfirm={(data) => {
          registerRecordMutation.mutate({
            ...data,
            type: "in",
            ipAddress: ipData?.ip || "0.0.0.0",
          } as any);
          setIsClockInModalOpen(false);
        }}
      />

      <ClockOutModal
        isOpen={isClockOutModalOpen}
        onClose={() => setIsClockOutModalOpen(false)}
        onConfirm={(data) => {
          registerRecordMutation.mutate({
            ...data,
            type: "out",
            ipAddress: ipData?.ip || "0.0.0.0",
          } as any);
          setIsClockOutModalOpen(false);
        }}
      />
      
      {/* Justification Modal */}
      <Dialog open={justificationModal.open} onOpenChange={(open) => setJustificationModal({ ...justificationModal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justificativa</DialogTitle>
            <DialogDescription>
              Justificativa fornecida para este registro de ponto.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{justificationModal.text}</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setJustificationModal({ open: false, text: "" })}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to group records by date
function groupRecordsByDate(records: TimeRecord[]): Record<string, TimeRecord[]> {
  if (!records || !Array.isArray(records)) return {};

  const grouped: Record<string, TimeRecord[]> = {};

  records.forEach((record: TimeRecord) => {
    const date = format(new Date(record.timestamp), "dd/MM/yyyy");

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(record);
  });

  // Sort records within each date
  Object.keys(grouped).forEach((date: string) => {
    grouped[date].sort(
      (a: TimeRecord, b: TimeRecord) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  });

  return grouped;
}

// Verifica se uma data é hoje (formato dd/MM/yyyy)
function isToday(dateStr: string): boolean {
  const today = getCurrentDate();
  return dateStr === today;
}
