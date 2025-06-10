import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  Bell,
  Settings,
  Home,
  FileText,
  BarChart2,
  RefreshCw,
  MapPin,
  Info
} from "lucide-react";
import {
  formatDateWithWeekday,
  getCurrentTime,
  getCurrentDate,
  getTypeIcon,
  getTypeColor,
  cn
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [refreshing, setRefreshing] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        when: "beforeChildren" 
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  const clockDigitsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  // Time interval to update current time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(formatDateWithWeekday(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Get user status (in/out)
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{status: "in" | "out"}>({  
    queryKey: ["/api/time-records/status"],
    refetchInterval: 30000, // Refetch every 30s
  });

  // Get client IP
  const { data: ipData } = useQuery<{ip: string}>({  
    queryKey: ["/api/ip"],
  });

  // Get user's time records
  const { data: timeRecords, isLoading: recordsLoading, refetch: refetchRecords } = useQuery<TimeRecord[]>({  
    queryKey: ["/api/time-records/me"],
  });

  // Manual refetch function with animation
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStatus(), refetchRecords()]);
    setTimeout(() => setRefreshing(false), 800);
  };

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

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/70"
    >
      {/* Modern Animated Header */}
      <motion.header 
        variants={itemVariants}
        className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm"
      >
        <div className="container px-4 py-3 flex items-center justify-between mx-auto max-w-4xl">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-sm"
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 4, duration: 1 }}
            >
              <Clock className="h-4 w-4 text-white" />
            </motion.div>
            <div className="font-bold text-primary text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Ponto Eletrônico
            </div>
          </motion.div>

          {user && (
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {refreshing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  >
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={cn(
                  "h-5 w-5 text-slate-500", 
                  refreshing && "animate-spin text-primary"
                )} />
              </motion.button>
              
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <Menu className="h-5 w-5 text-slate-700" />
                  </motion.button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 border-l border-slate-200 shadow-xl">
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
                    {/* User Profile Card - Enhanced */}
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="p-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-medium text-xl">
                              {getInitials(user.fullName)}
                            </AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <div>
                          <motion.p 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="font-semibold text-slate-800 text-lg"
                          >
                            {user.fullName}
                          </motion.p>
                          <motion.p 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-sm text-slate-500"
                          >
                            {user.email}
                          </motion.p>
                          <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-1.5"
                          >
                            <Badge variant={currentStatus === "in" ? "success" : "destructive"} className="text-xs font-normal uppercase">
                              {currentStatus === "in" ? "Presente" : "Ausente"}
                            </Badge>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Menu Items - Enhanced with animations */}
                    <div className="space-y-1.5 pt-2">
                      <motion.h3 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs font-medium text-slate-500 px-1 mb-2"
                      >
                        MENU
                      </motion.h3>

                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-base px-3 py-6 hover:bg-primary/5"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Home className="mr-3 h-5 w-5 text-primary" />
                          Dashboard
                        </Button>
                      </motion.div>

                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-base px-3 py-6 hover:bg-primary/5"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <FileText className="mr-3 h-5 w-5 text-primary" />
                          Meus Registros
                        </Button>
                      </motion.div>

                      {user.accessLevel === "admin" && (
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-start font-normal text-base px-3 py-6 hover:bg-primary/5"
                            onClick={() => {
                              navigate("/admin");
                              setSidebarOpen(false);
                            }}
                          >
                            <BarChart2 className="mr-3 h-5 w-5 text-primary" />
                            Painel Administrativo
                          </Button>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-base text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-6"
                          onClick={() => {
                            logoutMutation.mutate();
                            setSidebarOpen(false);
                          }}
                        >
                          <LogOut className="mr-3 h-5 w-5" />
                          Sair
                        </Button>
                      </motion.div>
                    </div>

                    {/* Connection Info - Enhanced */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="mt-auto pt-6 border-t border-slate-200"
                    >
                      <div className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-2 flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          INFORMAÇÕES DE CONEXÃO
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600">IP:</span>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs bg-white">
                            {ipData?.ip || "..."}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content - Enhanced with animations */}
      <main className="container px-4 py-6 pb-20 mx-auto max-w-4xl">
        {/* Clock Card - Enhanced with animations */}
        <motion.div variants={itemVariants}>
          <Card className="mb-6 overflow-hidden border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-primary/90 to-primary p-6 text-white">
                <motion.div 
                  className="flex items-start justify-between mb-6"
                  variants={itemVariants}
                >
                  <motion.div variants={itemVariants}>
                    <motion.p 
                      className="text-white/80 text-sm font-medium"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {currentDate}
                    </motion.p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Badge
                      variant={currentStatus === "in" ? "success" : "destructive"}
                      className="px-3 py-1 text-xs bg-white/20 text-white border-0 shadow-sm"
                    >
                      <motion.div
                        animate={currentStatus === "in" 
                          ? { scale: [1, 1.2, 1], opacity: [1, 0.8, 1] } 
                          : {}
                        }
                        transition={{ repeat: Infinity, repeatDelay: 2, duration: 1.5 }}
                        className={`w-2 h-2 rounded-full mr-2 ${currentStatus === "in" ? "bg-green-400" : "bg-red-400"}`}
                      ></motion.div>
                      <span>
                        {currentStatus === "in" ? "Na empresa" : "Fora da empresa"}
                      </span>
                    </Badge>
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="text-center mb-4"
                  variants={itemVariants}
                >
                  <motion.div 
                    className="text-7xl font-bold tracking-tighter"
                    variants={clockDigitsVariants}                    
                  >
                    {currentTime}
                  </motion.div>
                  <motion.p 
                    className="text-white/70 text-sm mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    É importante registrar o ponto de entrada e saída corretamente
                  </motion.p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons - Enhanced with animations */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <motion.div 
            whileHover={{ scale: currentStatus === "in" ? 1 : 1.03, y: currentStatus === "in" ? 0 : -2 }} 
            whileTap={{ scale: currentStatus === "in" ? 1 : 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={currentStatus === "in" ? "relative" : ""}
          >
            <Button
              onClick={() => navigate("/camera?type=in")}
              disabled={currentStatus === "in" || registerRecordMutation.isPending}
              className={cn(
                "w-full flex flex-col items-center justify-center py-6 gap-3 transition-all duration-300 shadow-md h-28 rounded-xl",
                currentStatus === "in" ? 
                  "bg-gray-300 cursor-not-allowed" : 
                  "bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              )}
            >
              <motion.div 
                animate={currentStatus === "in" ? {} : { y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <LogIn className={cn("h-7 w-7", currentStatus === "in" ? "text-gray-500" : "")} />
              </motion.div>
              <span className={cn("font-semibold text-lg", currentStatus === "in" ? "text-gray-600" : "")}>Entrada</span>
            </Button>
            
            {currentStatus === "in" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                  <p className="text-gray-700 text-sm font-medium flex items-center">
                    <span className="bg-green-100 p-1 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </span>
                    Você já está na empresa
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div 
            whileHover={{ scale: currentStatus === "out" ? 1 : 1.03, y: currentStatus === "out" ? 0 : -2 }} 
            whileTap={{ scale: currentStatus === "out" ? 1 : 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={currentStatus === "out" ? "relative" : ""}
          >
            <Button
              onClick={() => navigate("/camera?type=out")}
              disabled={currentStatus === "out" || registerRecordMutation.isPending}
              className={cn(
                "w-full flex flex-col items-center justify-center py-6 gap-3 transition-all duration-300 shadow-md h-28 rounded-xl",
                currentStatus === "out" ? 
                  "bg-gray-300 cursor-not-allowed" : 
                  "bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
              )}
            >
              <motion.div 
                animate={currentStatus === "out" ? {} : { y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <LogOut className={cn("h-7 w-7", currentStatus === "out" ? "text-gray-500" : "")} />
              </motion.div>
              <span className={cn("font-semibold text-lg", currentStatus === "out" ? "text-gray-600" : "")}>Saída</span>
            </Button>
            
            {currentStatus === "out" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-xl">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                  <p className="text-gray-700 text-sm font-medium flex items-center">
                    <span className="bg-rose-100 p-1 rounded-full mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </span>
                    Você já está fora da empresa
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Records Section - Enhanced with animations */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-lg overflow-hidden bg-white/80 backdrop-blur-sm">
            <Tabs defaultValue="today" className="w-full">
              <div className="px-4 pt-4 pb-0">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="today">Hoje</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="today" className="pb-0 px-0 pt-3">
                {recordsLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="pb-4"
                  >
                    {groupedRecords[getCurrentDate()] &&
                    groupedRecords[getCurrentDate()].length > 0 ? (
                      <div className="divide-y divide-slate-100">
                        <AnimatePresence>
                          {groupedRecords[getCurrentDate()].map((record, index) => (
                            <motion.div
                              key={record.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ delay: index * 0.1, duration: 0.3 }}
                              whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.7)" }}
                              className="flex items-center p-4 cursor-pointer"
                              onClick={() => record.justification && setJustificationModal({ open: true, text: record.justification })}
                            >
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                className={`h-12 w-12 rounded-full ${record.type === "in" ? "bg-emerald-100" : "bg-rose-100"} flex items-center justify-center mr-4 shadow-sm`}
                              >
                                {record.type === "in" ? (
                                  <LogIn className="h-6 w-6 text-emerald-600" />
                                ) : (
                                  <LogOut className="h-6 w-6 text-rose-600" />
                                )}
                              </motion.div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900 text-base">
                                      {record.type === "in" ? "Entrada" : "Saída"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {record.justification ? (
                                        <span 
                                          className="flex items-center text-primary cursor-pointer hover:underline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setJustificationModal({ open: true, text: record.justification || "" });
                                          }}
                                        >
                                          <Activity className="h-3 w-3 mr-1" />
                                          <span>Com justificativa</span>
                                        </span>
                                      ) : (
                                        "Registrado com sucesso"
                                      )}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-mono font-semibold">
                                      {format(
                                        new Date(record.timestamp),
                                        "HH:mm:ss",
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="flex flex-col items-center justify-center py-10 px-4 text-center"
                      >
                        <motion.div 
                          className="rounded-full bg-slate-100 p-4 mb-4 shadow-sm"
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                        >
                          <Calendar className="h-8 w-8 text-slate-400" />
                        </motion.div>
                        <h3 className="text-slate-800 font-semibold mb-2 text-lg">
                          Nenhum registro hoje
                        </h3>
                        <p className="text-slate-500 text-sm max-w-xs">
                          Utilize os botões acima para registrar sua entrada e
                          saída no sistema de ponto eletrônico.
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="history" className="pt-3 pb-4 px-0">
                {recordsLoading ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Filtro de Data (Opcional para melhorar a navegação) */}
                    <div className="p-4 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-500 mb-2">HISTÓRICO DE REGISTROS</p>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-700 font-medium">
                          {Object.entries(groupedRecords).length} dias com registros
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-xs text-primary flex items-center hover:underline"
                          onClick={handleRefresh}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Atualizar
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Lista de Registros por Data */}
                    <div className="space-y-4 px-4">
                      <AnimatePresence>
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
                          .map(([date, records], dateIndex) => (
                            <motion.div
                              key={date}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: dateIndex * 0.05 }}
                              className="bg-white rounded-xl overflow-hidden shadow-md border border-slate-100"
                            >
                              <motion.div 
                                className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-100"
                                whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.8)" }}
                              >
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
                                <Badge variant="outline" className="text-xs bg-white shadow-sm">
                                  {records.length} registros
                                </Badge>
                              </motion.div>

                              <div className="divide-y divide-slate-100">
                                <AnimatePresence>
                                  {records.map((record, index) => (
                                    <motion.div
                                      key={record.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.1 + (index * 0.03) }}
                                      whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.5)" }}
                                      className="p-4 transition-colors"
                                      onClick={() => record.justification && setJustificationModal({ open: true, text: record.justification })}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                          <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            whileTap={{ scale: 0.9 }}
                                            className={`flex items-center justify-center h-9 w-9 rounded-full ${record.type === "in" ? "bg-emerald-100" : "bg-rose-100"} mr-3 shadow-sm`}
                                          >
                                            {record.type === "in" ? (
                                              <LogIn className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                              <LogOut className="h-4 w-4 text-rose-600" />
                                            )}
                                          </motion.div>
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
                                          <p className="text-lg font-mono font-semibold text-slate-700">
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
                                        <motion.div 
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: "auto" }}
                                          transition={{ delay: 0.1 }}
                                          className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer shadow-sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setJustificationModal({ open: true, text: record.justification || "" });
                                          }}
                                        >
                                          <div className="flex items-center mb-1">
                                            <Activity className="h-3 w-3 text-primary mr-1" />
                                            <span className="text-xs font-medium text-slate-700">Justificativa:</span>
                                          </div>
                                          <p className="text-xs text-slate-600 line-clamp-2">{record.justification}</p>
                                          {record.justification.length > 100 && (
                                            <p className="text-xs text-primary mt-1 text-right">Ver mais</p>
                                          )}
                                        </motion.div>
                                      )}
                                      
                                      {/* Link para ver no mapa */}
                                      {record.latitude && record.longitude && (
                                        <motion.div 
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.2 }}
                                          className="mt-2 text-xs"
                                        >
                                          <a 
                                            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center"
                                          >
                                            <MapPin className="h-3 w-3 mr-1" />
                                            Ver localização no mapa
                                          </a>
                                        </motion.div>
                                      )}
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>

                      {Object.entries(groupedRecords).length === 0 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl shadow-md border border-slate-100"
                        >
                          <motion.div 
                            className="rounded-full bg-slate-100 p-4 mb-4"
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          >
                            <Calendar className="h-8 w-8 text-slate-400" />
                          </motion.div>
                          <h3 className="text-slate-800 font-semibold mb-2">
                            Nenhum registro encontrado
                          </h3>
                          <p className="text-slate-500 text-sm max-w-xs">
                            Seus registros anteriores aparecerão aqui quando você começar a usar o sistema.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </main>

      {/* Fixed Action Bar for Mobile - Enhanced with animations */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring" }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg"
      >
        <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex gap-1 items-center">
            <Clock className="h-3 w-3 text-primary" />
            <span>
              Ponto Eletrônico • IP:{" "}
              <span className="font-mono">{ipData?.ip || "..."}</span>
            </span>
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          </motion.div>
        </div>
      </motion.div>

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
      
      {/* Justification Modal - Enhanced */}
      <Dialog open={justificationModal.open} onOpenChange={(open) => setJustificationModal({ ...justificationModal, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Justificativa</DialogTitle>
            <DialogDescription>
              Justificativa fornecida para este registro de ponto.
            </DialogDescription>
          </DialogHeader>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-slate-50 rounded-lg border border-slate-100 shadow-inner"
          >
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{justificationModal.text}</p>
          </motion.div>
          <DialogFooter>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={() => setJustificationModal({ open: false, text: "" })}
                className="bg-primary hover:bg-primary/90"
              >
                Fechar
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
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