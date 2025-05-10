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
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  CalendarClock, 
  User, 
  AlertTriangle, 
  Check,
  X
} from "lucide-react";
import { formatDistanceToNow, format, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { User as UserType, TimeBank, AbsenceRequest } from "@shared/schema";

// Componente para adicionar entrada no banco de horas
function TimeBankForm({ entry, onSuccess }: { entry: TimeBank | null, onSuccess: () => void }) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<number | string>(entry?.userId || "");
  const [date, setDate] = useState(entry?.date ? format(new Date(entry.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [hoursBalance, setHoursBalance] = useState(entry?.hoursBalance?.toString() || "");
  const [type, setType] = useState(entry?.type || "overtime");
  const [description, setDescription] = useState(entry?.description || "");
  const [expirationDate, setExpirationDate] = useState(
    entry?.expirationDate 
      ? format(new Date(entry.expirationDate), "yyyy-MM-dd") 
      : format(addMonths(new Date(), 6), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState(entry?.notes || "");

  // Buscar usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
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

  // Mutação para criar uma entrada
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/time-bank", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Entrada criada",
        description: "A entrada no banco de horas foi criada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar entrada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar uma entrada
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", `/api/admin/time-bank/${entry?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Entrada atualizada",
        description: "A entrada no banco de horas foi atualizada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar entrada",
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

    const numHoursBalance = parseFloat(hoursBalance);
    if (isNaN(numHoursBalance)) {
      toast({
        title: "Valor inválido",
        description: "O saldo de horas deve ser um número válido",
        variant: "destructive",
      });
      return;
    }

    const formData = {
      userId: Number(userId),
      date,
      hoursBalance: numHoursBalance.toFixed(2),
      type,
      description,
      expirationDate: type === "overtime" ? expirationDate : null,
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
        {isLoadingUsers ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={userId.toString()}
            onValueChange={setUserId}
            disabled={entry !== null}
          >
            <SelectTrigger id="userId">
              <SelectValue placeholder="Selecione um funcionário" />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Data*</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Tipo*</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overtime">Hora Extra</SelectItem>
              <SelectItem value="compensation">Compensação</SelectItem>
              <SelectItem value="adjustment">Ajuste Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="hoursBalance">
          Saldo de Horas* {type === "compensation" && "(use valor negativo para compensação)"}
        </Label>
        <Input
          id="hoursBalance"
          type="number"
          step="0.01"
          value={hoursBalance}
          onChange={(e) => setHoursBalance(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          Use valores positivos para acréscimo de horas e negativos para débito.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição*</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição detalhada da entrada"
          required
        />
      </div>
      
      {type === "overtime" && (
        <div className="space-y-2">
          <Label htmlFor="expirationDate">Data de Expiração</Label>
          <Input
            id="expirationDate"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Data limite para uso do saldo (padrão: 6 meses a partir da data da entrada)
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
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
          {isSubmitting ? "Salvando..." : entry ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}

// Componente para compensar horas
function CompensateHoursForm({ userId, onSuccess }: { userId: number, onSuccess: () => void }) {
  const { toast } = useToast();
  const [minutes, setMinutes] = useState("60");
  const [compensationDate, setCompensationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [description, setDescription] = useState("");

  // Mutação para compensar horas
  const compensateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/time-bank/compensate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Horas compensadas",
        description: "As horas foram compensadas com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao compensar horas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numMinutes = parseInt(minutes);
    if (isNaN(numMinutes) || numMinutes <= 0) {
      toast({
        title: "Valor inválido",
        description: "A quantidade de minutos deve ser um número positivo",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    compensateMutation.mutate({
      userId,
      minutes: numMinutes,
      compensationDate,
      description
    });
  };

  // Buscar saldo atual
  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["/api/admin/time-bank/balance", userId],
    queryFn: async () => {
      const res = await fetch(`/api/time-bank/my-balance?userId=${userId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar saldo do banco de horas");
      }
      
      return res.json();
    },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4 p-4 rounded-lg bg-gray-50 border">
        <h3 className="text-md font-medium mb-2">Saldo atual:</h3>
        {isLoadingBalance ? (
          <Skeleton className="h-6 w-32" />
        ) : (
          <div className="text-xl font-bold">
            {Math.floor(balance?.balanceMinutes / 60)}h {balance?.balanceMinutes % 60}min
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="minutes">Quantidade de Minutos a Compensar*</Label>
        <Input
          id="minutes"
          type="number"
          min="1"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          Digite a quantidade em minutos (60 = 1 hora, 90 = 1 hora e 30 minutos, etc.)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="compensationDate">Data da Compensação*</Label>
        <Input
          id="compensationDate"
          type="date"
          value={compensationDate}
          onChange={(e) => setCompensationDate(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Motivo da Compensação*</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: Folga no dia 10/05 para consulta médica"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={compensateMutation.isPending || (balance && balance.balanceMinutes < parseInt(minutes))}
        >
          {compensateMutation.isPending ? "Processando..." : "Compensar Horas"}
        </Button>
      </div>
    </form>
  );
}

// Componente para revisar solicitações de ausência
function AbsenceRequestReview({ request, onSuccess }: { request: AbsenceRequest, onSuccess: () => void }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  // Mutação para aprovar uma solicitação
  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/absence-requests/${request.id}/approve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/absence-requests"] });
      toast({
        title: "Solicitação aprovada",
        description: "A solicitação de ausência foi aprovada com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao aprovar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para rejeitar uma solicitação
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/absence-requests/${request.id}/reject`, { notes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/absence-requests"] });
      toast({
        title: "Solicitação rejeitada",
        description: "A solicitação de ausência foi rejeitada",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao rejeitar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

  // Buscar nome do funcionário
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/admin/users", request.userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${request.userId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar dados do funcionário");
      }
      
      return res.json();
    },
  });

  // Formatação das datas
  const startDate = new Date(request.startDate);
  const endDate = new Date(request.endDate);
  
  // Calcular número de dias
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Tipos de ausência
  const absenceTypeMap: Record<string, string> = {
    vacation: "Férias",
    sick: "Atestado médico",
    personal: "Pessoal",
    compensation: "Compensação de horas"
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Funcionário</h3>
          <p className="mt-1 text-lg font-semibold">{user?.fullName}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Tipo de Ausência</h3>
          <p className="mt-1">
            <Badge variant="outline">{absenceTypeMap[request.type] || request.type}</Badge>
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Período</h3>
          <p className="mt-1">
            {format(startDate, "dd/MM/yyyy")} a {format(endDate, "dd/MM/yyyy")}
            <span className="text-sm text-gray-500 ml-2">({diffDays} {diffDays === 1 ? 'dia' : 'dias'})</span>
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500">Data da Solicitação</h3>
          <p className="mt-1">
            {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
          </p>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-500">Motivo</h3>
        <p className="mt-1">{request.reason}</p>
      </div>
      
      <div className="space-y-2 pt-4">
        <Label htmlFor="reviewNotes">Observações da Revisão</Label>
        <Textarea
          id="reviewNotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações sobre sua decisão (opcional)"
          rows={3}
        />
      </div>
      
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
        >
          Voltar
        </Button>
        
        <div className="space-x-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => rejectMutation.mutate()}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          
          <Button
            type="button"
            onClick={() => approveMutation.mutate()}
            disabled={isSubmitting}
          >
            <Check className="h-4 w-4 mr-2" />
            Aprovar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente principal para gerenciar banco de horas e ausências
export default function TimeBankPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timebank");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCompensateOpen, setIsCompensateOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimeBank | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AbsenceRequest | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Buscar entradas do banco de horas
  const { data: timeBankEntries, isLoading: isLoadingTimeBank } = useQuery<TimeBank[]>({
    queryKey: ["/api/admin/time-bank"],
    queryFn: async () => {
      const res = await fetch("/api/admin/time-bank", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar banco de horas");
      }
      
      return res.json();
    },
  });

  // Buscar solicitações de ausência
  const { data: absenceRequests, isLoading: isLoadingAbsences } = useQuery<AbsenceRequest[]>({
    queryKey: ["/api/admin/absence-requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/absence-requests?status=pending", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar solicitações de ausência");
      }
      
      return res.json();
    },
  });
  
  // Buscar usuários
  const { data: users, isLoading: isLoadingUsers } = useQuery<UserType[]>({
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

  // Excluir entrada do banco de horas
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/time-bank/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-bank"] });
      toast({
        title: "Entrada excluída",
        description: "A entrada do banco de horas foi excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir entrada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar entradas do banco de horas
  const filteredEntries = timeBankEntries
    ? timeBankEntries.filter((entry) => {
        const employeeMatch = employeeFilter === "all" || entry.userId.toString() === employeeFilter;
        const typeMatch = typeFilter === "all" || entry.type === typeFilter;
        
        // Buscar por descrição ou data
        const searchMatch = !searchTerm || 
          entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          format(new Date(entry.date), "dd/MM/yyyy").includes(searchTerm);
        
        return employeeMatch && typeMatch && searchMatch;
      })
    : [];

  // Agrupar entradas por usuário para resumo
  const userSummary: Record<number, { 
    balance: number,
    name: string,
    id: number,
    entries: number
  }> = {};
  
  if (timeBankEntries && users) {
    timeBankEntries.forEach(entry => {
      const user = users.find(u => u.id === entry.userId);
      if (!user) return;
      
      if (!userSummary[entry.userId]) {
        userSummary[entry.userId] = { 
          balance: 0,
          name: user.fullName,
          id: entry.userId,
          entries: 0
        };
      }
      
      if (!entry.wasCompensated && (!entry.expirationDate || new Date(entry.expirationDate) > new Date())) {
        userSummary[entry.userId].balance += parseFloat(entry.hoursBalance.toString()) * 60; // convertendo para minutos
      }
      userSummary[entry.userId].entries++;
    });
  }

  // Tradução dos tipos de entradas
  const entryTypeTranslations: Record<string, string> = {
    overtime: "Hora Extra",
    compensation: "Compensação",
    adjustment: "Ajuste Manual"
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Banco de Horas e Ausências</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-4">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="timebank">Banco de Horas</TabsTrigger>
            <TabsTrigger value="absences">Solicitações</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>
          
          {/* Aba do Banco de Horas */}
          <TabsContent value="timebank" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <Button onClick={() => {
                setSelectedEntry(null);
                setIsFormOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Button>
            </div>
            
            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-4 mb-4">
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
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="overtime">Hora Extra</SelectItem>
                      <SelectItem value="compensation">Compensação</SelectItem>
                      <SelectItem value="adjustment">Ajuste Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="search"
                      placeholder="Buscar por descrição ou data"
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              {employeeFilter !== "all" && (
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedUserId(parseInt(employeeFilter));
                      setIsCompensateOpen(true);
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Compensar Horas
                  </Button>
                </div>
              )}
            </div>
            
            {/* Tabela de Entradas */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {isLoadingTimeBank ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !filteredEntries.length ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">
                    Nenhuma entrada no banco de horas encontrada.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Funcionário
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
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
                      {filteredEntries.map((entry) => {
                        const user = users?.find(u => u.id === entry.userId);
                        const expired = entry.expirationDate && new Date(entry.expirationDate) < new Date();
                        
                        return (
                          <tr key={entry.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {format(new Date(entry.date), "dd/MM/yyyy")}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user?.fullName || `ID: ${entry.userId}`}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={
                                entry.type === "overtime" ? "default" :
                                entry.type === "compensation" ? "destructive" :
                                "secondary"
                              }>
                                {entryTypeTranslations[entry.type] || entry.type}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-semibold ${
                                parseFloat(entry.hoursBalance.toString()) > 0 
                                  ? "text-green-600" 
                                  : parseFloat(entry.hoursBalance.toString()) < 0 
                                    ? "text-red-600" 
                                    : "text-gray-500"
                              }`}>
                                {parseFloat(entry.hoursBalance.toString()) > 0 ? "+" : ""}
                                {parseFloat(entry.hoursBalance.toString()).toFixed(2)}h
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 truncate max-w-xs">
                                {entry.description}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {entry.wasCompensated ? (
                                <Badge variant="outline" className="text-gray-500">
                                  Compensado
                                </Badge>
                              ) : expired ? (
                                <Badge variant="destructive">
                                  Expirado
                                </Badge>
                              ) : (
                                <Badge variant="success">
                                  Ativo
                                </Badge>
                              )}
                              {entry.expirationDate && !entry.wasCompensated && !expired && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Expira em: {format(new Date(entry.expirationDate), "dd/MM/yyyy")}
                                </div>
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
                                disabled={entry.wasCompensated}
                                title="Editar entrada"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir esta entrada?")) {
                                    deleteEntryMutation.mutate(entry.id);
                                  }
                                }}
                                disabled={entry.wasCompensated}
                                title="Excluir entrada"
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
          </TabsContent>
          
          {/* Aba de Solicitações de Ausência */}
          <TabsContent value="absences" className="space-y-4 pt-4">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Solicitações Pendentes</h2>
              </div>
              
              {isLoadingAbsences ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !absenceRequests?.length ? (
                <div className="text-center p-6">
                  <p className="text-gray-500">
                    Não há solicitações de ausência pendentes.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {absenceRequests.map((request) => {
                    const user = users?.find(u => u.id === request.userId);
                    const startDate = new Date(request.startDate);
                    const endDate = new Date(request.endDate);
                    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    // Tipos de ausência
                    const absenceTypeMap: Record<string, string> = {
                      vacation: "Férias",
                      sick: "Atestado médico",
                      personal: "Pessoal",
                      compensation: "Compensação de horas"
                    };
                    
                    return (
                      <div key={request.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium">
                              {user?.fullName || `Funcionário ID: ${request.userId}`}
                            </h3>
                            <div className="mt-1 flex flex-wrap gap-2">
                              <Badge variant={
                                request.type === "vacation" ? "default" :
                                request.type === "sick" ? "destructive" :
                                request.type === "compensation" ? "success" :
                                "secondary"
                              }>
                                {absenceTypeMap[request.type] || request.type}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {format(startDate, "dd/MM/yyyy")} a {format(endDate, "dd/MM/yyyy")}
                                {" "}
                                ({diffDays} {diffDays === 1 ? "dia" : "dias"})
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-600 truncate max-w-2xl">
                              {request.reason}
                            </p>
                            <div className="mt-1 text-xs text-gray-500">
                              Solicitado em: {format(new Date(request.createdAt), "dd/MM/yyyy HH:mm")}
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsReviewOpen(true);
                            }}
                          >
                            Analisar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Aba de Resumo */}
          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(userSummary).sort((a, b) => b.balance - a.balance).map((summary) => (
                <Card key={summary.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="truncate">{summary.name}</span>
                      {summary.balance > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(summary.id);
                            setIsCompensateOpen(true);
                          }}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Compensar
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {summary.entries} {summary.entries === 1 ? 'entrada' : 'entradas'} no banco de horas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(summary.balance / 60)}h {Math.round(summary.balance % 60)}min
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Saldo atual disponível para compensação
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="link" 
                      className="px-0" 
                      onClick={() => {
                        setEmployeeFilter(summary.id.toString());
                        setTypeFilter("all");
                        setSearchTerm("");
                        setActiveTab("timebank");
                      }}
                    >
                      Ver detalhes
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {Object.keys(userSummary).length === 0 && !isLoadingTimeBank && (
              <div className="text-center p-6 bg-white shadow rounded-lg">
                <p className="text-gray-500">
                  Não há entradas no banco de horas.
                </p>
              </div>
            )}
            
            {isLoadingTimeBank && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de Nova Entrada */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEntry ? "Editar Entrada" : "Nova Entrada no Banco de Horas"}
            </DialogTitle>
            <DialogDescription>
              {selectedEntry
                ? "Atualize os dados da entrada no banco de horas."
                : "Adicione uma nova entrada no banco de horas de um funcionário."
              }
            </DialogDescription>
          </DialogHeader>
          <TimeBankForm
            entry={selectedEntry}
            onSuccess={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal de Compensação de Horas */}
      <Dialog open={isCompensateOpen} onOpenChange={setIsCompensateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Compensar Horas</DialogTitle>
            <DialogDescription>
              Use o saldo do banco de horas para conceder folga ou compensação ao funcionário.
            </DialogDescription>
          </DialogHeader>
          {selectedUserId && (
            <CompensateHoursForm
              userId={selectedUserId}
              onSuccess={() => setIsCompensateOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de Análise de Solicitação */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Analisar Solicitação de Ausência</DialogTitle>
            <DialogDescription>
              Revise os detalhes e aprove ou rejeite a solicitação.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <AbsenceRequestReview
              request={selectedRequest}
              onSuccess={() => setIsReviewOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}