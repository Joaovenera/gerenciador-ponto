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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Edit, Trash2, CalendarClock, CopyPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin-sidebar";
import AdminMobileHeader from "@/components/admin-mobile-header";
import { User, WorkSchedule, WorkScheduleDetail } from "@shared/schema";

// Opções de tipo de escala
type ScheduleType = "regular" | "flexible" | "shift" | "scale";

// Componente para criar/editar jornada
function WorkScheduleForm({ schedule, onSuccess }: { 
  schedule: WorkSchedule | null, 
  onSuccess: () => void 
}) {
  const { toast } = useToast();
  const [name, setName] = useState(schedule?.name || "");
  const [description, setDescription] = useState(schedule?.description || "");
  const [type, setType] = useState<ScheduleType>((schedule?.type as ScheduleType) || "regular");
  const [weeklyHours, setWeeklyHours] = useState(schedule?.weeklyHours.toString() || "44");
  const [toleranceMinutes, setToleranceMinutes] = useState(schedule?.toleranceMinutes.toString() || "10");
  const [breakTime, setBreakTime] = useState(schedule?.breakTime.toString() || "60");
  
  // Para jornadas regulares e flexíveis
  const [startTime, setStartTime] = useState(schedule?.startTime || "08:00");
  const [endTime, setEndTime] = useState(schedule?.endTime || "17:00");
  const [workDays, setWorkDays] = useState<Record<string, boolean>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
    ...schedule?.workDays
  });

  // Para turnos e escalas de revezamento
  const [cycleLength, setCycleLength] = useState((schedule?.cycleLength || 0).toString());
  const [shiftLength, setShiftLength] = useState((schedule?.shiftLength || 0).toString());
  
  // Detalhes da escala/turno
  const [scheduleDetails, setScheduleDetails] = useState<Array<{
    day: number;
    startTime: string;
    endTime: string;
    isWorkDay: boolean;
  }>>(
    schedule?.details || Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      startTime: "08:00",
      endTime: "17:00",
      isWorkDay: i < 5 // dias úteis por padrão
    }))
  );

  // Mutação para criar jornada
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/work-schedules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules"] });
      toast({
        title: "Jornada criada",
        description: "A jornada de trabalho foi criada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar jornada
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/work-schedules/${schedule?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules"] });
      toast({
        title: "Jornada atualizada",
        description: "A jornada de trabalho foi atualizada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Adicionar mais um dia ao ciclo da escala
  const addCycleDay = () => {
    setScheduleDetails([
      ...scheduleDetails,
      {
        day: scheduleDetails.length + 1,
        startTime: "08:00",
        endTime: "17:00",
        isWorkDay: true
      }
    ]);
    setCycleLength((scheduleDetails.length + 1).toString());
  };

  // Remover último dia do ciclo
  const removeCycleDay = () => {
    if (scheduleDetails.length <= 1) return;
    
    setScheduleDetails(scheduleDetails.slice(0, -1));
    setCycleLength((scheduleDetails.length - 1).toString());
  };

  // Atualizar detalhes da escala
  const updateScheduleDetail = (index: number, field: string, value: any) => {
    const newDetails = [...scheduleDetails];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setScheduleDetails(newDetails);
  };

  // Toggle para dias da semana
  const toggleWorkDay = (day: string) => {
    setWorkDays({
      ...workDays,
      [day]: !workDays[day]
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!name) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da jornada é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!weeklyHours || isNaN(Number(weeklyHours))) {
      toast({
        title: "Campo inválido",
        description: "A carga horária semanal deve ser um número válido",
        variant: "destructive",
      });
      return;
    }

    if (type === "shift" || type === "scale") {
      if (!cycleLength || isNaN(Number(cycleLength)) || Number(cycleLength) <= 0) {
        toast({
          title: "Campo inválido",
          description: "O tamanho do ciclo deve ser um número válido maior que zero",
          variant: "destructive",
        });
        return;
      }
      
      if (Number(cycleLength) !== scheduleDetails.length) {
        // Ajustar detalhes para corresponder ao tamanho do ciclo
        const details = [...scheduleDetails];
        if (details.length < Number(cycleLength)) {
          // Adicionar dias
          for (let i = details.length; i < Number(cycleLength); i++) {
            details.push({
              day: i + 1,
              startTime: "08:00",
              endTime: "17:00",
              isWorkDay: true
            });
          }
        } else {
          // Remover dias
          details.splice(Number(cycleLength));
        }
        setScheduleDetails(details);
      }
    }

    // Preparar dados para API
    const formData: Record<string, any> = {
      name,
      description: description || null,
      type,
      weeklyHours: Number(weeklyHours),
      toleranceMinutes: Number(toleranceMinutes),
      breakTime: Number(breakTime)
    };

    // Adicionar campos específicos por tipo de jornada
    if (type === "regular" || type === "flexible") {
      formData.startTime = startTime;
      formData.endTime = endTime;
      formData.workDays = workDays;
    } else if (type === "shift" || type === "scale") {
      formData.cycleLength = Number(cycleLength);
      formData.shiftLength = Number(shiftLength);
      formData.details = scheduleDetails;
    }

    if (schedule) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  // Renderizar campos de acordo com o tipo de jornada
  const renderScheduleFields = () => {
    if (type === "regular" || type === "flexible") {
      return (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Entrada</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Saída</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Dias de Trabalho</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Object.entries(workDays).map(([day, isWorkDay]) => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`workday-${day}`} 
                    checked={isWorkDay} 
                    onCheckedChange={() => toggleWorkDay(day)}
                  />
                  <Label htmlFor={`workday-${day}`} className="capitalize">
                    {day === "monday" && "Segunda-feira"}
                    {day === "tuesday" && "Terça-feira"}
                    {day === "wednesday" && "Quarta-feira"}
                    {day === "thursday" && "Quinta-feira"}
                    {day === "friday" && "Sexta-feira"}
                    {day === "saturday" && "Sábado"}
                    {day === "sunday" && "Domingo"}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    
    if (type === "shift" || type === "scale") {
      return (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cycleLength">Tamanho do Ciclo (dias)</Label>
              <Input
                id="cycleLength"
                type="number"
                min="1"
                value={cycleLength}
                onChange={(e) => setCycleLength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shiftLength">Duração do Turno (horas)</Label>
              <Input
                id="shiftLength"
                type="number"
                min="1"
                value={shiftLength}
                onChange={(e) => setShiftLength(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Detalhes do Ciclo</Label>
              <div className="flex space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addCycleDay}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Dia
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={removeCycleDay}
                  disabled={scheduleDetails.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover Dia
                </Button>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md overflow-auto max-h-80">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Dia</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">É dia de trabalho?</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Entrada</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleDetails.map((detail, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 pl-1">{detail.day}</td>
                      <td className="py-3">
                        <Checkbox 
                          checked={detail.isWorkDay} 
                          onCheckedChange={(checked) => 
                            updateScheduleDetail(index, "isWorkDay", Boolean(checked))
                          }
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="time"
                          value={detail.startTime}
                          onChange={(e) => updateScheduleDetail(index, "startTime", e.target.value)}
                          disabled={!detail.isWorkDay}
                          className="w-32"
                        />
                      </td>
                      <td className="py-3">
                        <Input
                          type="time"
                          value={detail.endTime}
                          onChange={(e) => updateScheduleDetail(index, "endTime", e.target.value)}
                          disabled={!detail.isWorkDay}
                          className="w-32"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      );
    }
    
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome da Jornada*</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Comercial 44h/semana"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da jornada (opcional)"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Jornada*</Label>
        <Select 
          value={type} 
          onValueChange={(value: string) => setType(value as ScheduleType)}
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="regular">Regular (Horário fixo)</SelectItem>
            <SelectItem value="flexible">Flexível (Horário com flexibilidade)</SelectItem>
            <SelectItem value="shift">Turno (Turnos fixos)</SelectItem>
            <SelectItem value="scale">Escala (Escala de revezamento)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="weeklyHours">Carga Horária Semanal (h)*</Label>
          <Input
            id="weeklyHours"
            type="number"
            min="1"
            max="44"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toleranceMinutes">Tolerância (min)</Label>
          <Input
            id="toleranceMinutes"
            type="number"
            min="0"
            max="60"
            value={toleranceMinutes}
            onChange={(e) => setToleranceMinutes(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">Minutos de tolerância no registro</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="breakTime">Intervalo (min)</Label>
          <Input
            id="breakTime"
            type="number"
            min="0"
            max="120"
            value={breakTime}
            onChange={(e) => setBreakTime(e.target.value)}
            required
          />
          <p className="text-xs text-gray-500">Duração do intervalo de almoço/descanso</p>
        </div>
      </div>
      
      {renderScheduleFields()}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : schedule ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

// Função para exibir a carga horária em formato legível
function formatSchedule(schedule: WorkSchedule): string {
  if (schedule.type === "regular" || schedule.type === "flexible") {
    // Verificar quais dias da semana estão ativos
    const weekDays = {
      monday: "Seg",
      tuesday: "Ter",
      wednesday: "Qua",
      thursday: "Qui",
      friday: "Sex",
      saturday: "Sáb",
      sunday: "Dom"
    };
    
    const workDays = Object.entries(schedule.workDays || {})
      .filter(([_, isActive]) => isActive)
      .map(([day]) => weekDays[day as keyof typeof weekDays])
      .join(", ");
    
    return `${schedule.startTime} - ${schedule.endTime} (${workDays})`;
  }
  
  if (schedule.type === "shift" || schedule.type === "scale") {
    return `Ciclo de ${schedule.cycleLength} dias, ${schedule.shiftLength}h por turno`;
  }
  
  return "";
}

// Página principal de jornadas de trabalho
export default function WorkSchedulesPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<string>("work-schedules");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Buscar jornadas de trabalho
  const { data: workSchedules, isLoading } = useQuery<WorkSchedule[]>({
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
  
  // Excluir jornada
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/work-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules"] });
      toast({
        title: "Jornada excluída",
        description: "A jornada de trabalho foi excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Duplicar jornada
  const duplicateMutation = useMutation({
    mutationFn: async (schedule: WorkSchedule) => {
      const newSchedule = { ...schedule };
      delete newSchedule.id;
      delete newSchedule.createdAt;
      delete newSchedule.updatedAt;
      newSchedule.name = `${schedule.name} (Cópia)`;
      
      const res = await apiRequest("POST", "/api/admin/work-schedules", newSchedule);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules"] });
      toast({
        title: "Jornada duplicada",
        description: "A jornada de trabalho foi duplicada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao duplicar jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtrar jornadas
  const filteredSchedules = workSchedules
    ? workSchedules.filter((schedule) => 
        schedule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (schedule.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Jornadas de Trabalho</h1>
              <Button
                onClick={() => {
                  setSelectedSchedule(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Jornada
              </Button>
            </div>
            
            {/* Barra de pesquisa */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar jornadas..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Tabs para tipos de jornada */}
            <Tabs defaultValue="all" className="mb-6">
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="regular">Regulares</TabsTrigger>
                <TabsTrigger value="flexible">Flexíveis</TabsTrigger>
                <TabsTrigger value="shift">Turnos</TabsTrigger>
                <TabsTrigger value="scale">Escalas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-4">
                {renderScheduleTable(filteredSchedules)}
              </TabsContent>
              
              <TabsContent value="regular" className="mt-4">
                {renderScheduleTable(filteredSchedules.filter(s => s.type === "regular"))}
              </TabsContent>
              
              <TabsContent value="flexible" className="mt-4">
                {renderScheduleTable(filteredSchedules.filter(s => s.type === "flexible"))}
              </TabsContent>
              
              <TabsContent value="shift" className="mt-4">
                {renderScheduleTable(filteredSchedules.filter(s => s.type === "shift"))}
              </TabsContent>
              
              <TabsContent value="scale" className="mt-4">
                {renderScheduleTable(filteredSchedules.filter(s => s.type === "scale"))}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Modal de Jornada */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule ? "Editar Jornada" : "Nova Jornada de Trabalho"}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedule
                ? "Atualize as informações da jornada de trabalho."
                : "Crie uma nova jornada de trabalho para os funcionários."
              }
            </DialogDescription>
          </DialogHeader>
          <WorkScheduleForm
            schedule={selectedSchedule}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );

  // Renderizar tabela de jornadas
  function renderScheduleTable(schedules: WorkSchedule[]) {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }
    
    if (!schedules.length) {
      return (
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            Nenhuma jornada encontrada. {searchQuery ? "Tente uma busca diferente." : "Crie uma nova jornada para começar."}
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Carga Horária
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                    {schedule.description && (
                      <div className="text-sm text-gray-500">{schedule.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className="capitalize">
                      {schedule.type === "regular" && "Regular"}
                      {schedule.type === "flexible" && "Flexível"}
                      {schedule.type === "shift" && "Turno"}
                      {schedule.type === "scale" && "Escala"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{schedule.weeklyHours}h semanais</div>
                    <div className="text-sm text-gray-500">
                      {schedule.toleranceMinutes > 0 && `Tolerância: ${schedule.toleranceMinutes}min`}
                      {schedule.breakTime > 0 && `, Intervalo: ${schedule.breakTime}min`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatSchedule(schedule)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 mr-1"
                      onClick={() => {
                        duplicateMutation.mutate(schedule);
                      }}
                      title="Duplicar jornada"
                    >
                      <CopyPlus className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1"
                      onClick={() => {
                        setSelectedSchedule(schedule);
                        setIsFormOpen(true);
                      }}
                      title="Editar jornada"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                      onClick={() => {
                        if (window.confirm("Tem certeza que deseja excluir esta jornada?")) {
                          deleteMutation.mutate(schedule.id);
                        }
                      }}
                      title="Excluir jornada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}