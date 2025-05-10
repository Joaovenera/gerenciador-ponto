import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Edit, Trash2, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin-sidebar";
import AdminMobileHeader from "@/components/admin-mobile-header";
import { User, WorkSchedule, EmployeeSchedule } from "@shared/schema";

// Componente para atribuir jornada a um funcionário
function EmployeeScheduleForm({ schedule, allSchedules, employees, onSuccess }: { 
  schedule: EmployeeSchedule | null, 
  allSchedules: WorkSchedule[],
  employees: User[],
  onSuccess: () => void 
}) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<number | string>(schedule?.userId || "");
  const [scheduleId, setScheduleId] = useState<number | string>(schedule?.scheduleId || "");
  const [startDate, setStartDate] = useState(
    schedule?.startDate ? format(new Date(schedule.startDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    schedule?.endDate ? format(new Date(schedule.endDate), "yyyy-MM-dd") : ""
  );
  const [notes, setNotes] = useState(schedule?.notes || "");

  // Mutação para criar uma atribuição
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/employee-schedules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-schedules"] });
      toast({
        title: "Jornada atribuída",
        description: "A jornada foi atribuída ao funcionário com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar uma atribuição
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/employee-schedules/${schedule?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-schedules"] });
      toast({
        title: "Atribuição atualizada",
        description: "A atribuição de jornada foi atualizada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar atribuição",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!userId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um funcionário",
        variant: "destructive",
      });
      return;
    }

    if (!scheduleId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione uma jornada de trabalho",
        variant: "destructive",
      });
      return;
    }

    if (!startDate) {
      toast({
        title: "Campo obrigatório",
        description: "A data de início é obrigatória",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      userId: Number(userId),
      scheduleId: Number(scheduleId),
      startDate,
      endDate: endDate || null,
      notes: notes || null,
    };

    if (schedule) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">Funcionário*</Label>
        <Select
          value={userId.toString()}
          onValueChange={setUserId}
          disabled={schedule !== null}
        >
          <SelectTrigger id="userId">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="scheduleId">Jornada de Trabalho*</Label>
        <Select
          value={scheduleId.toString()}
          onValueChange={setScheduleId}
        >
          <SelectTrigger id="scheduleId">
            <SelectValue placeholder="Selecione uma jornada" />
          </SelectTrigger>
          <SelectContent>
            {allSchedules.map((ws) => (
              <SelectItem key={ws.id} value={ws.id.toString()}>
                {ws.name} ({ws.weeklyHours}h)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data de Início*</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Término (opcional)</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Deixe em branco para uma atribuição permanente
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações adicionais (opcional)"
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : schedule ? "Atualizar" : "Atribuir"}
        </Button>
      </div>
    </form>
  );
}

// Página principal de atribuição de jornadas
export default function EmployeeSchedulesPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<EmployeeSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<string>("work-schedules");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [scheduleFilter, setScheduleFilter] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  
  // Buscar atribuições de jornada
  const { data: employeeSchedules, isLoading: isLoadingSchedules } = useQuery<EmployeeSchedule[]>({
    queryKey: ["/api/admin/employee-schedules", { active: !showInactive }],
    queryFn: async () => {
      const res = await fetch(`/api/admin/employee-schedules?active=${!showInactive}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar atribuições de jornada");
      }
      
      return res.json();
    },
  });
  
  // Buscar jornadas de trabalho
  const { data: workSchedules, isLoading: isLoadingWorkSchedules } = useQuery<WorkSchedule[]>({
    queryKey: ["/api/admin/work-schedules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/work-schedules", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar jornadas de trabalho");
      }
      
      return res.json();
    },
  });
  
  // Buscar funcionários
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      
      return res.json();
    },
  });
  
  // Excluir atribuição
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/employee-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employee-schedules"] });
      toast({
        title: "Atribuição excluída",
        description: "A atribuição de jornada foi excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir atribuição",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtrar atribuições
  const filteredSchedules = employeeSchedules
    ? employeeSchedules.filter((schedule) => {
        const employeeMatch = employeeFilter === "all" || schedule.userId.toString() === employeeFilter;
        const scheduleMatch = scheduleFilter === "all" || schedule.scheduleId.toString() === scheduleFilter;
        
        return employeeMatch && scheduleMatch;
      })
    : [];

  // Dados do usuário autenticado (para o sidebar)
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar dados do usuário");
      return res.json();
    },
  });

  if (!userData) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar activeTab="work-schedules" onTabChange={setActiveTab} user={userData} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminMobileHeader activeTab="work-schedules" onTabChange={setActiveTab} user={userData} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="py-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">Atribuição de Jornadas</h1>
                <Button
                  onClick={() => {
                    setSelectedSchedule(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atribuição
                </Button>
              </div>
              
              {/* Filtros */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="employee-filter">Funcionário</Label>
                    <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                      <SelectTrigger id="employee-filter">
                        <SelectValue placeholder="Todos os funcionários" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os funcionários</SelectItem>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="schedule-filter">Jornada</Label>
                    <Select value={scheduleFilter} onValueChange={setScheduleFilter}>
                      <SelectTrigger id="schedule-filter">
                        <SelectValue placeholder="Todas as jornadas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as jornadas</SelectItem>
                        {workSchedules?.map((schedule) => (
                          <SelectItem key={schedule.id} value={schedule.id.toString()}>
                            {schedule.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end space-x-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-inactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor="show-inactive">Mostrar encerradas</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabela de Atribuições */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoadingSchedules || isLoadingUsers || isLoadingWorkSchedules ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : !filteredSchedules.length ? (
                  <div className="text-center p-6">
                    <p className="text-gray-500">
                      Nenhuma atribuição de jornada encontrada.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Funcionário
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jornada
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Período
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSchedules.map((schedule) => {
                          const user = users?.find(u => u.id === schedule.userId);
                          const workSchedule = workSchedules?.find(ws => ws.id === schedule.scheduleId);
                          
                          const isActive = !schedule.endDate || new Date(schedule.endDate) >= new Date();
                          
                          return (
                            <tr key={schedule.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user?.fullName || `ID: ${schedule.userId}`}</div>
                                <div className="text-sm text-gray-500">{user?.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{workSchedule?.name || `ID: ${schedule.scheduleId}`}</div>
                                <div className="text-sm text-gray-500">{workSchedule?.weeklyHours}h semanais</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {format(new Date(schedule.startDate), "dd/MM/yyyy")}
                                  {schedule.endDate && ` até ${format(new Date(schedule.endDate), "dd/MM/yyyy")}`}
                                </div>
                                {schedule.notes && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {schedule.notes}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={isActive ? "success" : "secondary"}>
                                  {isActive ? "Ativa" : "Encerrada"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1"
                                  onClick={() => {
                                    setSelectedSchedule(schedule);
                                    setIsFormOpen(true);
                                  }}
                                  title="Editar atribuição"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                                  onClick={() => {
                                    if (window.confirm("Tem certeza que deseja excluir esta atribuição?")) {
                                      deleteMutation.mutate(schedule.id);
                                    }
                                  }}
                                  title="Excluir atribuição"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modal de Atribuição de Jornada */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule ? "Editar Atribuição" : "Nova Atribuição de Jornada"}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedule
                ? "Atualize as informações da atribuição da jornada."
                : "Atribua uma jornada de trabalho a um funcionário."
              }
            </DialogDescription>
          </DialogHeader>
          {users && workSchedules && (
            <EmployeeScheduleForm
              schedule={selectedSchedule}
              allSchedules={workSchedules}
              employees={users}
              onSuccess={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}