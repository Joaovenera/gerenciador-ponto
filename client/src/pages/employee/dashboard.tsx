import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, LogIn, User } from "lucide-react";
import { 
  formatDateWithWeekday, 
  getCurrentTime, 
  getCurrentDate, 
  getTypeIcon, 
  getTypeColor 
} from "@/lib/utils";
import ClockInModal from "@/components/clock-in-modal";
import ClockOutModal from "@/components/clock-out-modal";
import { TimeRecord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO, isToday, subDays, isEqual } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EmployeeDashboard() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(formatDateWithWeekday(new Date()));
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  
  // Time interval to update current time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(formatDateWithWeekday(new Date()));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Get user status (in/out)
  const { data: statusData, isLoading: statusLoading } = useQuery<{ status: "in" | "out" }>({
    queryKey: ["/api/time-records/status"],
    refetchInterval: 30000, // Refetch every 30s
  });

  // Get client IP
  const { data: ipData } = useQuery<{ ip: string }>({
    queryKey: ["/api/ip"],
  });

  // Get user's time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({
    queryKey: ["/api/time-records/me"],
  });

  // Register time record mutation
  const registerRecordMutation = useMutation({
    mutationFn: async (recordData: any) => {
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

  // Define types for API responses
  interface StatusResponse {
    status: "in" | "out";
  }

  // Get current user status
  const currentStatus = (statusData as StatusResponse)?.status || "out";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="font-semibold text-primary text-lg">Ponto Eletrônico</div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-2">
              {user.accessLevel === "admin" && (
                <a href="/admin">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <span className="text-sm font-medium">Painel Administrativo</span>
                  </Button>
                </a>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <span className="text-sm font-medium mr-1">{user.fullName.split(' ')[0]}</span>
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Clock Status Card */}
        <Card className="bg-white rounded-lg shadow mb-6">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-1">Status Atual</h2>
              {statusLoading ? (
                <Skeleton className="h-6 w-32 mx-auto" />
              ) : (
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${currentStatus === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${currentStatus === "in" ? "bg-green-500" : "bg-red-500"}`}></div>
                  <span>{currentStatus === "in" ? "Na empresa" : "Fora da empresa"}</span>
                </div>
              )}
            </div>
            
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-800">{currentTime}</div>
              <div className="text-sm text-gray-500">{currentDate}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/camera?type=in")}
                disabled={currentStatus === "in" || registerRecordMutation.isPending}
                className="flex flex-col items-center justify-center p-6 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn className="h-6 w-6 mb-2" />
                <span className="font-medium">Registrar Entrada</span>
              </Button>
              
              <Button
                onClick={() => navigate("/camera?type=out")}
                disabled={currentStatus === "out" || registerRecordMutation.isPending}
                className="flex flex-col items-center justify-center p-6 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-6 w-6 mb-2" />
                <span className="font-medium">Registrar Saída</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Records */}
        <Card className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Registros Recentes</h3>
          </div>
          
          <CardContent className="px-4 py-5">
            {recordsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <>
                {/* Today's Records */}
                {groupedRecords[getCurrentDate()] && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Hoje</h4>
                    
                    <div className="space-y-3">
                      {groupedRecords[getCurrentDate()].map((record: TimeRecord) => (
                        <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getTypeColor(record.type)} flex items-center justify-center`}>
                              <i className={`fas fa-${getTypeIcon(record.type)}`}></i>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record.type === "in" ? "Entrada" : "Saída"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {format(record.timestamp, "HH:mm:ss")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Previous Days Records */}
                {Object.keys(groupedRecords).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Dias Anteriores</h4>
                    
                    <div className="divide-y divide-gray-200">
                      {Object.entries(groupedRecords)
                        .filter(([date]) => date !== getCurrentDate())
                        .map(([date, records]) => (
                          <div key={date} className="py-3">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-900">{date}</h5>
                              <span className="text-xs text-gray-500">
                                {format(parseISO(records[0].timestamp.toString()), "EEEE", { locale: ptBR })}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {records.map((record: TimeRecord) => (
                                <div key={record.id} className="flex items-center">
                                  <i className={`fas fa-${getTypeIcon(record.type)} ${record.type === "in" ? "text-blue-600" : "text-red-600"} mr-2`}></i>
                                  <span>{format(record.timestamp, "HH:mm:ss")}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {Object.keys(groupedRecords).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum registro de ponto encontrado nos últimos 7 dias.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      
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
    </div>
  );
}

// Helper function to group records by date
function groupRecordsByDate(records: TimeRecord[]) {
  const grouped: Record<string, TimeRecord[]> = {};
  
  records.forEach(record => {
    const date = format(new Date(record.timestamp), "dd/MM/yyyy");
    
    if (!grouped[date]) {
      grouped[date] = [];
    }
    
    grouped[date].push(record);
  });
  
  // Sort records within each date
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  });
  
  return grouped;
}
