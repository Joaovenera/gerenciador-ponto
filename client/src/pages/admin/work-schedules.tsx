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
import { Search, Plus, Edit, Trash2, Clock, CalendarClock } from "lucide-react";
import { WorkSchedule, WorkScheduleDetail } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente para criar e editar jornadas de trabalho
function WorkScheduleForm({ schedule, onSuccess }: { schedule: WorkSchedule | null, onSuccess: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(schedule?.name || "");
  const [description, setDescription] = useState(schedule?.description || "");
  const [type, setType] = useState(schedule?.type || "regular");
  const [weeklyHours, setWeeklyHours] = useState(schedule?.weeklyHours?.toString() || "44");

  // Mutação para criar uma jornada
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

  // Mutação para atualizar uma jornada
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da jornada é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const numWeeklyHours = parseFloat(weeklyHours);
    if (isNaN(numWeeklyHours) || numWeeklyHours <= 0 || numWeeklyHours > 60) {
      toast({
        title: "Valor inválido",
        description: "O total de horas semanais deve ser maior que 0 e menor que 60",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      name,
      description: description || null,
      type,
      weeklyHours: numWeeklyHours.toFixed(2),
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
        <Label htmlFor="name">Nome da Jornada*</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Padrão 44h semanais"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição detalhada da jornada de trabalho"
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Jornada*</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="flexible">Flexível</SelectItem>
              <SelectItem value="shift">Turno</SelectItem>
              <SelectItem value="scale">Escala</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="weeklyHours">Horas Semanais*</Label>
          <Input
            id="weeklyHours"
            type="number"
            min="1"
            max="60"
            step="0.5"
            value={weeklyHours}
            onChange={(e) => setWeeklyHours(e.target.value)}
            required
          />
        </div>
      </div>
      
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

// Componente para gerenciar os detalhes (dias da semana) de uma jornada
function WorkScheduleDetails({ scheduleId }: { scheduleId: number }) {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<WorkScheduleDetail | null>(null);
  
  const { data: details, isLoading } = useQuery<WorkScheduleDetail[]>({
    queryKey: ["/api/admin/work-schedules", scheduleId, "details"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/work-schedules/${scheduleId}/details`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar detalhes da jornada");
      }
      
      return res.json();
    },
  });

  // Mapeamento dos dias da semana
  const weekdayOptions = [
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ];

  // Verificar quais dias já estão definidos
  const definedDays = details?.map(d => d.weekday) || [];
  const availableDays = weekdayOptions.filter(d => !definedDays.includes(d.value));

  // Estados para o formulário
  const [weekday, setWeekday] = useState<string>("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [breakStart, setBreakStart] = useState("12:00");
  const [breakEnd, setBreakEnd] = useState("13:00");
  const [isWorkDay, setIsWorkDay] = useState(true);

  // Limpar e configurar o formulário
  const resetForm = () => {
    setWeekday("");
    setStartTime("08:00");
    setEndTime("18:00");
    setBreakStart("12:00");
    setBreakEnd("13:00");
    setIsWorkDay(true);
    setSelectedDetail(null);
  };

  // Configurar o formulário para edição
  const handleEditDetail = (detail: WorkScheduleDetail) => {
    setSelectedDetail(detail);
    setWeekday(detail.weekday);
    setStartTime(detail.startTime as unknown as string);
    setEndTime(detail.endTime as unknown as string);
    setBreakStart(detail.breakStart as unknown as string || "12:00");
    setBreakEnd(detail.breakEnd as unknown as string || "13:00");
    setIsWorkDay(detail.isWorkDay);
    setIsFormOpen(true);
  };

  // Criar novo detalhe de jornada
  const createDetailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/work-schedule-details", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules", scheduleId, "details"] });
      toast({
        title: "Dia adicionado",
        description: "O dia foi adicionado à jornada com sucesso",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar dia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar detalhe de jornada
  const updateDetailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/work-schedule-details/${selectedDetail?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules", scheduleId, "details"] });
      toast({
        title: "Dia atualizado",
        description: "O dia foi atualizado com sucesso",
      });
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar dia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excluir detalhe de jornada
  const deleteDetailMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/work-schedule-details/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/work-schedules", scheduleId, "details"] });
      toast({
        title: "Dia removido",
        description: "O dia foi removido da jornada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover dia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weekday) {
      toast({
        title: "Campo obrigatório",
        description: "O dia da semana é obrigatório",
        variant: "destructive",
      });
      return;
    }

    // Validar horários
    if (isWorkDay) {
      if (!startTime || !endTime) {
        toast({
          title: "Campos obrigatórios",
          description: "Os horários de início e fim são obrigatórios",
          variant: "destructive",
        });
        return;
      }
    }

    const formData = {
      scheduleId,
      weekday,
      startTime,
      endTime,
      breakStart: breakStart || null,
      breakEnd: breakEnd || null,
      isWorkDay,
    };

    if (selectedDetail) {
      updateDetailMutation.mutate(formData);
    } else {
      createDetailMutation.mutate(formData);
    }
  };

  // Traduções para os dias da semana
  const weekdayTranslations: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Detalhes da Jornada</h3>
        <Button size="sm" onClick={() => {
          resetForm();
          setIsFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Dia
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : !details || details.length === 0 ? (
        <div className="text-center p-6 border rounded-lg bg-gray-50">
          <p className="text-gray-500">
            Nenhum dia da semana configurado para esta jornada.
          </p>
          <Button 
            variant="link" 
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
          >
            Adicionar o primeiro dia
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Intervalo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.sort((a, b) => {
                const order = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
                return order.indexOf(a.weekday) - order.indexOf(b.weekday);
              }).map((detail) => (
                <TableRow key={detail.id}>
                  <TableCell className="font-medium">
                    {weekdayTranslations[detail.weekday]}
                  </TableCell>
                  <TableCell>
                    {detail.isWorkDay ? (
                      <Badge variant="success">Dia Útil</Badge>
                    ) : (
                      <Badge variant="secondary">Descanso</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {detail.isWorkDay ? (
                      <span>
                        {detail.startTime as unknown as string} - {detail.endTime as unknown as string}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {detail.isWorkDay && detail.breakStart && detail.breakEnd ? (
                      <span>
                        {detail.breakStart as unknown as string} - {detail.breakEnd as unknown as string}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 mr-1"
                      onClick={() => handleEditDetail(detail)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500"
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja remover ${weekdayTranslations[detail.weekday]} da jornada?`)) {
                          deleteDetailMutation.mutate(detail.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Formulário para adicionar/editar um dia da semana */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDetail ? "Editar Dia da Semana" : "Adicionar Dia da Semana"}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da jornada para este dia da semana.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weekday">Dia da Semana*</Label>
              {selectedDetail ? (
                <Input 
                  value={weekdayTranslations[weekday]} 
                  disabled 
                />
              ) : (
                <Select
                  value={weekday}
                  onValueChange={setWeekday}
                  disabled={!availableDays.length || selectedDetail !== null}
                >
                  <SelectTrigger id="weekday">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDays.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWorkDay"
                  checked={isWorkDay}
                  onChange={(e) => setIsWorkDay(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isWorkDay">Dia de trabalho</Label>
              </div>
              <p className="text-sm text-gray-500">
                Desmarque esta opção para dias de descanso (sem expediente).
              </p>
            </div>
            
            {isWorkDay && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Horário de Início*</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required={isWorkDay}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Horário de Término*</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required={isWorkDay}
                    />
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Intervalo (opcional)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="breakStart">Início do Intervalo</Label>
                      <Input
                        id="breakStart"
                        type="time"
                        value={breakStart}
                        onChange={(e) => setBreakStart(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="breakEnd">Fim do Intervalo</Label>
                      <Input
                        id="breakEnd"
                        type="time"
                        value={breakEnd}
                        onChange={(e) => setBreakEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createDetailMutation.isPending || updateDetailMutation.isPending}
              >
                {createDetailMutation.isPending || updateDetailMutation.isPending
                  ? "Salvando..."
                  : selectedDetail
                  ? "Atualizar"
                  : "Adicionar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Página principal de gerenciamento de jornadas
export default function WorkSchedulesPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // Buscar jornadas
  const { data: schedules, isLoading } = useQuery<WorkSchedule[]>({
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
      setActiveTab("list");
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir jornada",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtrar jornadas
  const filteredSchedules = schedules
    ? schedules.filter((schedule) => {
        const matchesSearch = 
          !searchTerm || 
          schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (schedule.description && schedule.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesType = typeFilter === "all" || schedule.type === typeFilter;
        
        return matchesSearch && matchesType;
      })
    : [];
  
  // Tradução para os tipos de jornada
  const scheduleTypeTranslations: Record<string, string> = {
    regular: "Regular",
    flexible: "Flexível",
    shift: "Turno",
    scale: "Escala",
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Jornadas de Trabalho</h1>
          {activeTab === "list" && (
            <Button
              onClick={() => {
                setSelectedSchedule(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Jornada
            </Button>
          )}
          {activeTab === "details" && (
            <Button
              variant="outline"
              onClick={() => setActiveTab("list")}
            >
              Voltar para lista
            </Button>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {activeTab === "list" ? (
          <div className="py-4">
            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type-filter">Tipo de Jornada</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="flexible">Flexível</SelectItem>
                      <SelectItem value="shift">Turno</SelectItem>
                      <SelectItem value="scale">Escala</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search-schedule">Buscar</Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="search-schedule"
                      placeholder="Buscar por nome ou descrição"
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista de Jornadas */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !filteredSchedules.length ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">
                    Nenhuma jornada de trabalho encontrada.
                  </p>
                </div>
              ) : (
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
                          Horas Semanais
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredSchedules.map((schedule) => (
                        <tr key={schedule.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{schedule.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              schedule.type === "regular" ? "default" :
                              schedule.type === "flexible" ? "outline" :
                              schedule.type === "shift" ? "secondary" :
                              "destructive"
                            }>
                              {scheduleTypeTranslations[schedule.type]}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {parseFloat(schedule.weeklyHours.toString()).toFixed(1)}h
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {schedule.description || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="ghost"
                              className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1"
                              onClick={() => {
                                setSelectedSchedule(schedule);
                                setActiveTab("details");
                              }}
                              title="Gerenciar dias da semana"
                            >
                              <CalendarClock className="h-4 w-4" />
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
                                if (window.confirm(`Tem certeza que deseja excluir a jornada "${schedule.name}"?`)) {
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
              )}
            </div>
          </div>
        ) : (
          <div className="py-4">
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedSchedule?.name}</h2>
                  <p className="text-sm text-gray-500">
                    {scheduleTypeTranslations[selectedSchedule?.type || "regular"]} - {parseFloat(selectedSchedule?.weeklyHours.toString() || "0").toFixed(1)}h semanais
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Jornada
                  </Button>
                </div>
              </div>
              
              {/* Detalhes da jornada */}
              {selectedSchedule && (
                <WorkScheduleDetails scheduleId={selectedSchedule.id} />
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Formulário de Jornada */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedSchedule ? "Editar Jornada" : "Nova Jornada de Trabalho"}
            </DialogTitle>
            <DialogDescription>
              {selectedSchedule 
                ? "Atualize as informações da jornada de trabalho."
                : "Crie uma nova jornada de trabalho e depois adicione os dias da semana."
              }
            </DialogDescription>
          </DialogHeader>
          <WorkScheduleForm 
            schedule={selectedSchedule} 
            onSuccess={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
}