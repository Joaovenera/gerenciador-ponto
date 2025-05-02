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
} from "lucide-react";
import {
  formatDateWithWeekday,
  getCurrentTime,
  getCurrentDate,
  getTypeIcon,
  getTypeColor,
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
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/time-records/status"],
    refetchInterval: 30000, // Refetch every 30s
  });

  // Get client IP
  const { data: ipData } = useQuery({
    queryKey: ["/api/ip"],
  });

  // Get user's time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["/api/time-records/me"],
  });

  // Register time record mutation
  const registerRecordMutation = useMutation({
    mutationFn: async (recordData) => {
      const res = await apiRequest("POST", "/api/time-records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/status"] });
    },
  });

  // Group time records by date
  const groupedRecords = timeRecords ? groupRecordsByDate(timeRecords) : {};

  // Get current user status
  const currentStatus = statusData?.status || "out";

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile-optimized Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <div className="font-bold text-primary text-base">
              Ponto Eletrônico
            </div>
          </div>

          {user && (
            <div className="flex items-center">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="flex items-center justify-between">
                      <span>Menu</span>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full h-8 w-8"
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
      <main className="px-4 py-4 pb-16">
        {/* Clock Card - Improved */}
        <Card className="mb-5 border-none shadow-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/90 to-primary p-5 text-white">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/70 text-sm font-medium">{currentDate}</p>
                </div>
                <Badge
                  variant={currentStatus === "in" ? "success" : "destructive"}
                  className="px-2.5 py-0.5 text-xs bg-white/20 text-white border-0"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${currentStatus === "in" ? "bg-green-400" : "bg-red-400"}`}
                  ></div>
                  <span>
                    {currentStatus === "in" ? "Na empresa" : "Fora da empresa"}
                  </span>
                </Badge>
              </div>

              <div className="text-center mb-4">
                <div className="text-6xl font-bold tracking-tight">
                  {currentTime}
                </div>
                <p className="text-white/60 text-xs mt-1">
                  É importante registrar o ponto de entrada e saída corretamente
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={() => navigate("/camera?type=in")}
            disabled={
              currentStatus === "in" || registerRecordMutation.isPending
            }
            className="flex flex-col items-center justify-center py-4 gap-3 bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 shadow-md h-24 disabled:opacity-50 disabled:shadow-none"
          >
            <LogIn className="h-6 w-6" />
            <span className="font-medium">Entrada</span>
          </Button>

          <Button
            onClick={() => navigate("/camera?type=out")}
            disabled={
              currentStatus === "out" || registerRecordMutation.isPending
            }
            className="flex flex-col items-center justify-center py-4 gap-3 bg-rose-500 hover:bg-rose-600 transition-all duration-300 shadow-md h-24 disabled:opacity-50 disabled:shadow-none"
          >
            <LogOut className="h-6 w-6" />
            <span className="font-medium">Saída</span>
          </Button>
        </div>

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
                                      onClick={() => setJustificationModal({ open: true, text: record.justification })}
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
                    <p className="text-xs font-medium text-slate-500 mb-2">HISTÓRICO DOS ÚLTIMOS 7 DIAS</p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">
                        {Object.entries(groupedRecords).filter(
                          ([date]) => date !== getCurrentDate()
                        ).length} dias com registros
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de Registros por Data */}
                  <div className="space-y-4 px-3">
                    {Object.entries(groupedRecords)
                      .filter(([date]) => date !== getCurrentDate())
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
                                    onClick={() => setJustificationModal({ open: true, text: record.justification })}
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
                                      <Map className="mr-1 h-3 w-3" />
                                      Ver localização no mapa
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                    {Object.entries(groupedRecords).filter(
                      ([date]) => date !== getCurrentDate(),
                    ).length === 0 && (
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
          });
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
          });
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
function groupRecordsByDate(records) {
  if (!records || !Array.isArray(records)) return {};

  const grouped = {};

  records.forEach((record) => {
    const date = format(new Date(record.timestamp), "dd/MM/yyyy");

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(record);
  });

  // Sort records within each date
  Object.keys(grouped).forEach((date) => {
    grouped[date].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  });

  return grouped;
}
