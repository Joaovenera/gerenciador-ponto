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
import { Textarea } from "@/components/ui/textarea";
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
import { Search, Plus, Edit, Trash2, Clock, GitBranchPlus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import AdminSidebar from "@/components/admin-sidebar";
import AdminMobileHeader from "@/components/admin-mobile-header";
import { User, TimeBank } from "@shared/schema";

// Componente para adicionar ou editar lançamento no banco de horas
function TimeBankForm({ entry, users, onSuccess }: { 
  entry: TimeBank | null, 
  users: User[],
  onSuccess: () => void 
}) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<number | string>(entry?.userId || "");
  const [date, setDate] = useState(
    entry?.date ? format(new Date(entry.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [expirationDate, setExpirationDate] = useState(
    entry?.expirationDate ? format(new Date(entry.expirationDate), "yyyy-MM-dd") : ""
  );
  const [type, setType] = useState(entry?.type || "credit");
  const [hours, setHours] = useState<string>(entry?.hoursBalance || "");
  const [description, setDescription] = useState(entry?.description || "");
  const [notes, setNotes] = useState(entry?.notes || "");

  // Função para converter o formato de horas (HH:MM) para minutos
  const hoursToMinutes = (timeString: string): number => {
    if (!timeString || !timeString.includes(":")) return 0;
    
    const [hours, minutes] = timeString.split(":").map(Number);
    return (hours * 60) + minutes;
  };

  // Função para converter minutos para formato de horas (HH:MM)
  const minutesToHours = (minutes: number): string => {
    const hrs = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Mutação para criar um lançamento
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/time-bank", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Lançamento adicionado",
        description: "O lançamento foi adicionado ao banco de horas com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar lançamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar um lançamento
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/time-bank/${entry?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Lançamento atualizado",
        description: "O lançamento no banco de horas foi atualizado com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar lançamento",
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

    if (!date) {
      toast({
        title: "Campo obrigatório",
        description: "A data do lançamento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!hours || !hours.includes(":")) {
      toast({
        title: "Formato inválido",
        description: "Informe as horas no formato HH:MM",
        variant: "destructive",
      });
      return;
    }

    if (!description) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição do lançamento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    // Converter horas para o formato esperado pelo backend
    let minutesValue = hoursToMinutes(hours);
    
    // Se for débito (compensação), inverter o sinal
    if (type === "debit") {
      minutesValue = -minutesValue;
    }

    const formData = {
      userId: Number(userId),
      date,
      expirationDate: expirationDate || null,
      type,
      hoursBalance: minutesToHours(minutesValue),
      description,
      notes: notes || null,
    };

    if (entry) {
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
          disabled={entry !== null}
        >
          <SelectTrigger id="userId">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Data do Lançamento*</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Data de Expiração (opcional)</Label>
          <Input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Deixe em branco se não expirar
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Lançamento*</Label>
          <Select
            value={type}
            onValueChange={setType}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">Crédito (Horas trabalhadas)</SelectItem>
              <SelectItem value="debit">Débito (Compensação)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hours">Horas (HH:MM)*</Label>
          <Input
            id="hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="00:00"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição*</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Motivo do lançamento"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações Adicionais</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações adicionais (opcional)"
          rows={3}
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Salvando..." : entry ? "Atualizar" : "Adicionar"}
        </Button>
      </div>
    </form>
  );
}

// Componente para compensar horas
function CompensateHoursForm({ userId, users, onSuccess }: { 
  userId: number | null, 
  users: User[],
  onSuccess: () => void 
}) {
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | string>(userId || "");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hours, setHours] = useState<string>("00:00");
  const [description, setDescription] = useState("");

  // Buscar saldo do banco de horas do funcionário
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["/api/admin/time-bank/balance", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      
      const res = await fetch(`/api/admin/time-bank/balance/${selectedUserId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar saldo do banco de horas");
      }
      
      return res.json();
    },
    enabled: !!selectedUserId,
  });

  // Função para converter minutos para formato de horas (HH:MM)
  const minutesToHours = (minutes: number): string => {
    const hrs = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };
  
  // Função para converter o formato de horas (HH:MM) para minutos
  const hoursToMinutes = (timeString: string): number => {
    if (!timeString || !timeString.includes(":")) return 0;
    
    const [hours, minutes] = timeString.split(":").map(Number);
    return (hours * 60) + minutes;
  };

  // Mutação para compensar horas
  const compensateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/time-bank/compensate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank/balance"] });
      toast({
        title: "Compensação registrada",
        description: "A compensação de horas foi registrada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar compensação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = compensateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!selectedUserId) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione um funcionário",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Campo obrigatório",
        description: "A data da compensação é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!hours || !hours.includes(":")) {
      toast({
        title: "Formato inválido",
        description: "Informe as horas no formato HH:MM",
        variant: "destructive",
      });
      return;
    }

    if (!description) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição da compensação é obrigatória",
        variant: "destructive",
      });
      return;
    }
    
    // Calcular minutos a compensar
    const minutesToCompensate = hoursToMinutes(hours);
    
    // Verificar se há saldo suficiente
    if (balanceData && minutesToCompensate > balanceData.balanceMinutes) {
      toast({
        title: "Saldo insuficiente",
        description: "O funcionário não possui saldo suficiente para esta compensação",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      userId: Number(selectedUserId),
      date,
      minutes: minutesToCompensate,
      description,
    };

    compensateMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="compensateUserId">Funcionário*</Label>
        <Select
          value={selectedUserId.toString()}
          onValueChange={(value) => setSelectedUserId(value)}
          disabled={userId !== null}
        >
          <SelectTrigger id="compensateUserId">
            <SelectValue placeholder="Selecione um funcionário" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {selectedUserId && (
        <div className="bg-gray-50 p-3 rounded-md">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Saldo atual:</span>
            {isLoadingBalance ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <span className="text-sm font-bold">
                {balanceData?.formattedBalance || "00:00"}
                <span className="text-xs ml-1 font-normal">
                  ({balanceData?.balanceMinutes || 0} min)
                </span>
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="compensateDate">Data da Compensação*</Label>
        <Input
          id="compensateDate"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="compensateHours">Horas a Compensar (HH:MM)*</Label>
        <Input
          id="compensateHours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="00:00"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="compensateDescription">Descrição*</Label>
        <Input
          id="compensateDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Motivo da compensação"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Processando..." : "Compensar Horas"}
        </Button>
      </div>
    </form>
  );
}

// Página principal do Banco de Horas
export default function TimeBankPage() {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompensateFormOpen, setIsCompensateFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeBank | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("time-bank");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: string, end: string }>({
    start: format(new Date(new Date().setDate(new Date().getDate() - 30)), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd")
  });
  
  // Buscar lançamentos do banco de horas
  const { data: timeBankEntries, isLoading: isLoadingEntries } = useQuery<TimeBank[]>({
    queryKey: ["/api/admin/time-bank", dateRangeFilter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/time-bank?startDate=${dateRangeFilter.start}&endDate=${dateRangeFilter.end}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar lançamentos do banco de horas");
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
  
  // Excluir lançamento
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/time-bank/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank/balance"] });
      toast({
        title: "Lançamento excluído",
        description: "O lançamento do banco de horas foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir lançamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filtrar lançamentos
  const filteredEntries = timeBankEntries
    ? timeBankEntries.filter((entry) => {
        const employeeMatch = employeeFilter === "all" || entry.userId.toString() === employeeFilter;
        const typeMatch = typeFilter === "all" || entry.type === typeFilter;
        
        return employeeMatch && typeMatch;
      })
    : [];

  // Agrupar lançamentos por usuário para exibir saldos
  const userBalances = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.userId]) {
      acc[entry.userId] = 0;
    }
    
    // Converter HH:MM para minutos
    const [hours, minutes] = entry.hoursBalance.split(":").map(Number);
    const totalMinutes = (hours * 60) + minutes;
    
    // Somar ou subtrair do saldo dependendo do tipo
    acc[entry.userId] += entry.type === "credit" ? totalMinutes : -totalMinutes;
    
    return acc;
  }, {} as Record<number, number>);

  // Formatar minutos para HH:MM
  const formatMinutesToHours = (minutes: number): string => {
    const isNegative = minutes < 0;
    const absoluteMinutes = Math.abs(minutes);
    const hours = Math.floor(absoluteMinutes / 60);
    const mins = absoluteMinutes % 60;
    
    return `${isNegative ? "-" : ""}${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

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
      <AdminSidebar activeTab="time-bank" onTabChange={setActiveTab} user={userData} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminMobileHeader activeTab="time-bank" onTabChange={setActiveTab} user={userData} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="py-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-gray-900">Banco de Horas</h1>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUserId(null);
                      setIsCompensateFormOpen(true);
                    }}
                  >
                    <GitBranchPlus className="h-4 w-4 mr-2" />
                    Compensar Horas
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedEntry(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Lançamento
                  </Button>
                </div>
              </div>
              
              {/* Filtros */}
              <div className="bg-white shadow rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
                    <Label htmlFor="type-filter">Tipo de Lançamento</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger id="type-filter">
                        <SelectValue placeholder="Todos os tipos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="credit">Crédito (Horas trabalhadas)</SelectItem>
                        <SelectItem value="debit">Débito (Compensação)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Data Inicial</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={dateRangeFilter.start}
                      onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, start: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Data Final</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={dateRangeFilter.end}
                      onChange={(e) => setDateRangeFilter({ ...dateRangeFilter, end: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Resumo de Saldos */}
              {employeeFilter !== "all" && (
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-medium mb-3">Resumo do Saldo</h2>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Funcionário</div>
                      <div className="text-lg font-medium">
                        {users?.find(u => u.id.toString() === employeeFilter)?.fullName || ""}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Saldo em Horas</div>
                      <div className="text-lg font-medium">
                        {userBalances[Number(employeeFilter)] !== undefined 
                          ? formatMinutesToHours(userBalances[Number(employeeFilter)])
                          : "00:00"}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-500">Total de Lançamentos</div>
                      <div className="text-lg font-medium">
                        {filteredEntries.filter(e => e.userId.toString() === employeeFilter).length}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tabela de Lançamentos */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {isLoadingEntries || isLoadingUsers ? (
                  <div className="p-4 space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : !filteredEntries.length ? (
                  <div className="text-center p-6">
                    <p className="text-gray-500">
                      Nenhum lançamento encontrado para o período e filtros selecionados.
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
                            Data
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Horas
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
                        {filteredEntries.map((entry) => {
                          const user = users?.find(u => u.id === entry.userId);
                          
                          return (
                            <tr key={entry.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user?.fullName || `ID: ${entry.userId}`}</div>
                                <div className="text-sm text-gray-500">{user?.department}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{format(new Date(entry.date), "dd/MM/yyyy")}</div>
                                {entry.expirationDate && (
                                  <div className="text-xs text-gray-500">
                                    Expira em {format(new Date(entry.expirationDate), "dd/MM/yyyy")}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant={entry.type === "credit" ? "success" : "destructive"}
                                  className="capitalize"
                                >
                                  {entry.type === "credit" ? "Crédito" : "Débito"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium">
                                  {entry.hoursBalance}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">{entry.description}</div>
                                {entry.notes && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs">{entry.notes}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1"
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setIsFormOpen(true);
                                  }}
                                  title="Editar lançamento"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                                  onClick={() => {
                                    if (window.confirm("Tem certeza que deseja excluir este lançamento?")) {
                                      deleteMutation.mutate(entry.id);
                                    }
                                  }}
                                  title="Excluir lançamento"
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
      
      {/* Modal de Lançamento */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Editar Lançamento" : "Novo Lançamento no Banco de Horas"}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry
                ? "Atualize as informações do lançamento no banco de horas."
                : "Adicione um novo lançamento ao banco de horas de um funcionário."
              }
            </DialogDescription>
          </DialogHeader>
          {users && (
            <TimeBankForm
              entry={selectedEntry}
              users={users}
              onSuccess={() => setIsFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de Compensação de Horas */}
      <Dialog open={isCompensateFormOpen} onOpenChange={setIsCompensateFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Compensar Horas</DialogTitle>
            <DialogDescription>
              Registre a compensação de horas do banco de horas de um funcionário.
            </DialogDescription>
          </DialogHeader>
          {users && (
            <CompensateHoursForm
              userId={selectedUserId}
              users={users}
              onSuccess={() => setIsCompensateFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}