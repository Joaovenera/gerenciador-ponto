import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TimeRecord, User } from "@shared/schema";
import { 
  formatDateTime, 
  formatDate, 
  getTypeColor,
  createGoogleMapsLink 
} from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Camera, 
  MapPin, 
  FileDown, 
  Search, 
  Edit, 
  Trash2,
  Plus,
  Clock
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Schema de validação para o formulário de registro manual
const manualRecordSchema = z.object({
  userId: z.string({
    required_error: "Selecione um funcionário",
  }),
  type: z.enum(["in", "out"], {
    required_error: "Selecione o tipo de registro",
  }),
  timestamp: z.string({
    required_error: "Selecione a data e hora",
  }),
  ipAddress: z.string({
    required_error: "Insira o endereço IP",
  }),
  latitude: z.string({
    required_error: "Insira a latitude",
  }),
  longitude: z.string({
    required_error: "Insira a longitude",
  }),
  photo: z.string({
    required_error: "Insira uma URL para a foto",
  }),
  justification: z.string().optional(),
});

type ManualRecordFormValues = z.infer<typeof manualRecordSchema>;

export default function RecordsTab() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [photoModal, setPhotoModal] = useState<{open: boolean, photo: string, justification?: string}>({
    open: false, 
    photo: "",
    justification: undefined
  });
  
  // Estado para controlar o modal de criação manual
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [ipInfo, setIpInfo] = useState({ ip: "", latitude: "", longitude: "" });
  
  // Formulário para edição de registros
  const editForm = useForm<ManualRecordFormValues>({
    resolver: zodResolver(manualRecordSchema),
    defaultValues: {
      userId: "",
      type: "in",
      timestamp: new Date().toISOString().slice(0, 16),
      ipAddress: "",
      latitude: "",
      longitude: "",
      photo: "",
      justification: "",
    }
  });
  
  // Configuração do formulário de registro manual
  const form = useForm<ManualRecordFormValues>({
    resolver: zodResolver(manualRecordSchema),
    defaultValues: {
      userId: "",
      type: "in",
      timestamp: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDThh:mm
      ipAddress: "",
      latitude: "",
      longitude: "",
      photo: "https://via.placeholder.com/300x200?text=Registro+Manual",
      justification: "",
    },
  });
  
  // Obter IP e localização quando o modal for aberto
  useEffect(() => {
    if (createModalOpen) {
      // Obter o IP atual
      fetch('/api/ip')
        .then(res => res.json())
        .then(data => {
          setIpInfo(prev => ({ ...prev, ip: data.ip }));
          form.setValue("ipAddress", data.ip);
          
          // Usar a API de geolocalização do navegador para as coordenadas
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const latitude = position.coords.latitude.toString();
                const longitude = position.coords.longitude.toString();
                
                setIpInfo(prev => ({ 
                  ...prev, 
                  latitude, 
                  longitude 
                }));
                
                form.setValue("latitude", latitude);
                form.setValue("longitude", longitude);
              },
              (error) => {
                console.error("Erro ao obter localização:", error);
                // Usar valores padrão se não conseguir obter a localização
                form.setValue("latitude", "-23.550520");
                form.setValue("longitude", "-46.633308");
              }
            );
          }
        })
        .catch(err => {
          console.error("Erro ao obter IP:", err);
        });
    }
  }, [createModalOpen, form]);
  
  // Criação manual de registros
  const createRecordMutation = useMutation({
    mutationFn: async (data: ManualRecordFormValues) => {
      return await apiRequest("POST", "/api/admin/time-records", {
        userId: parseInt(data.userId),
        type: data.type,
        timestamp: new Date(data.timestamp).toISOString(),
        ipAddress: data.ipAddress,
        latitude: data.latitude,
        longitude: data.longitude,
        photo: data.photo,
        justification: data.justification || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-records"] });
      setCreateModalOpen(false);
      form.reset();
      toast({
        title: "Registro criado",
        description: "O registro de ponto manual foi criado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para atualizar registros
  const updateRecordMutation = useMutation({
    mutationFn: async (data: ManualRecordFormValues & { id: number }) => {
      const { id, ...recordData } = data;
      return await apiRequest("PATCH", `/api/admin/time-records/${id}`, {
        userId: parseInt(recordData.userId),
        type: recordData.type,
        timestamp: new Date(recordData.timestamp).toISOString(),
        ipAddress: recordData.ipAddress,
        latitude: recordData.latitude,
        longitude: recordData.longitude,
        photo: recordData.photo,
        justification: recordData.justification || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-records"] });
      setEditModalOpen(false);
      setEditingRecord(null);
      editForm.reset();
      toast({
        title: "Registro atualizado",
        description: "O registro de ponto foi atualizado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Função para abrir o modal de edição
  const handleEditRecord = (record: TimeRecord) => {
    // Configurar o formulário com os dados do registro
    setEditingRecord(record);
    
    // Iniciar o formulário de edição com os valores atuais
    editForm.reset({
      userId: record.userId.toString(),
      type: record.type as "in" | "out",
      timestamp: new Date(record.timestamp).toISOString().slice(0, 16),
      ipAddress: record.ipAddress,
      latitude: record.latitude,
      longitude: record.longitude,
      photo: record.photo,
      justification: record.justification || "",
    });
    
    setEditModalOpen(true);
  };

  // Função que lida com o envio do formulário de edição
  const onEditSubmit = (data: ManualRecordFormValues) => {
    if (editingRecord) {
      updateRecordMutation.mutate({ ...data, id: editingRecord.id });
    }
  };

  // Função que lida com o envio do formulário de criação
  const onSubmit = (data: ManualRecordFormValues) => {
    createRecordMutation.mutate(data);
  };
  
  // Get all time records with filters
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({
    queryKey: ["/api/admin/time-records", dateRange, selectedEmployee, selectedType],
    queryFn: async ({ queryKey }) => {
      const [_, dateRange, employeeId, type] = queryKey;
      
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start as string);
      if (dateRange.end) params.append("endDate", dateRange.end as string);
      if (employeeId) params.append("userId", employeeId as string);
      if (type) params.append("type", type as string);
      
      const res = await fetch(`/api/admin/time-records?${params.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar registros");
      }
      
      return res.json();
    },
  });
  
  // Get all users for dropdown
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Delete time record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/time-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-records"] });
      toast({
        title: "Registro excluído",
        description: "O registro de ponto foi excluído com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle export to CSV
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("startDate", dateRange.start);
      if (dateRange.end) params.append("endDate", dateRange.end);
      if (selectedEmployee) params.append("userId", selectedEmployee);
      if (selectedType) params.append("type", selectedType);
      
      // Create URL for download
      const url = `/api/admin/export-time-records?${params.toString()}`;
      
      // Create a hidden link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "registros-ponto.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Exportação iniciada",
        description: "O arquivo CSV está sendo baixado",
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os registros",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Registros de Ponto</h1>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Filters */}
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date-start">Data Inicial</Label>
                <Input 
                  id="date-start" 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date-end">Data Final</Label>
                <Input 
                  id="date-end" 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee-filter">Funcionário</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
                <Label htmlFor="record-type">Tipo de Registro</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger id="record-type">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ponto Manual
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              <div className="flex space-x-2">
                <Button 
                  variant="default" 
                  className="flex items-center"
                  onClick={() => {
                    queryClient.invalidateQueries({ 
                      queryKey: ["/api/admin/time-records"] 
                    });
                  }}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center"
                  onClick={handleExport}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </div>
          
          {/* Records Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {recordsLoading || usersLoading ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
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
                        Data/Hora
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localização
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Foto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Justificativa
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {timeRecords && timeRecords.length > 0 ? (
                      timeRecords.map((record) => {
                        // Find user name from users array
                        const user = users?.find(u => u.id === record.userId);
                        const userName = user ? user.fullName : `ID: ${record.userId}`;
                        const userDept = user ? user.department : "";
                        
                        return (
                          <tr key={record.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                  <span className="font-medium">{userName.charAt(0)}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{userName}</div>
                                  <div className="text-sm text-gray-500">{userDept}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(record.timestamp)}</div>
                              <div className="text-sm text-gray-500">{formatDateTime(record.timestamp).split(' ')[1]}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                {record.type === "in" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.ipAddress}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span>{`${record.latitude.substring(0, 8)}, ${record.longitude.substring(0, 8)}`}</span>
                                <a 
                                  href={createGoogleMapsLink(parseFloat(record.latitude), parseFloat(record.longitude))} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-primary hover:text-blue-700"
                                >
                                  <MapPin className="h-4 w-4" />
                                </a>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <Button 
                                variant="link" 
                                className="text-primary hover:text-blue-700 p-0"
                                onClick={() => setPhotoModal({
                                  open: true, 
                                  photo: record.photo,
                                  justification: record.justification
                                })}
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                Ver foto
                              </Button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.justification ? (
                                <div 
                                  className="max-w-xs overflow-hidden text-ellipsis cursor-pointer hover:text-primary"
                                  onClick={() => setPhotoModal({
                                    open: true, 
                                    photo: record.photo,
                                    justification: record.justification
                                  })}
                                >
                                  <span className="text-xs">
                                    {record.justification.length > 50 
                                      ? `${record.justification.substring(0, 50)}...` 
                                      : record.justification
                                    }
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Sem justificativa</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button 
                                variant="ghost" 
                                className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1"
                                onClick={() => handleEditRecord(record)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                                onClick={() => {
                                  if (window.confirm("Tem certeza que deseja excluir este registro?")) {
                                    deleteRecordMutation.mutate(record.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                          Nenhum registro encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Manual Record Creation Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Registro Manual</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar um registro de ponto manual.
              Este registro será marcado como "manual" no sistema.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Funcionário */}
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Registro */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Registro*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Entrada</SelectItem>
                          <SelectItem value="out">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Data e Hora */}
                <FormField
                  control={form.control}
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora*</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço IP - Preenchido automaticamente */}
                <FormField
                  control={form.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Endereço IP
                        <span className="ml-2 text-xs text-gray-500">(preenchido automaticamente)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Obtendo IP..." 
                          {...field} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Latitude - Preenchida automaticamente */}
                <FormField
                  control={form.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Latitude
                        <span className="ml-2 text-xs text-gray-500">(preenchido automaticamente)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Obtendo localização..." 
                          {...field} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Longitude - Preenchida automaticamente */}
                <FormField
                  control={form.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Longitude
                        <span className="ml-2 text-xs text-gray-500">(preenchido automaticamente)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Obtendo localização..." 
                          {...field} 
                          disabled 
                          className="bg-gray-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* URL da Foto */}
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto*</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://via.placeholder.com/300x200" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Justificativa */}
              <FormField
                control={form.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Insira uma justificativa para este registro manual" 
                        {...field} 
                        className="h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRecordMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createRecordMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Registrar Ponto
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Record Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar Registro de Ponto</DialogTitle>
            <DialogDescription>
              Altere os dados do registro conforme necessário.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Funcionário */}
                <FormField
                  control={editForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funcionário*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de Registro */}
                <FormField
                  control={editForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Registro*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in">Entrada</SelectItem>
                          <SelectItem value="out">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Data e Hora */}
                <FormField
                  control={editForm.control}
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora*</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Endereço IP */}
                <FormField
                  control={editForm.control}
                  name="ipAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço IP*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Latitude */}
                <FormField
                  control={editForm.control}
                  name="latitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Longitude */}
                <FormField
                  control={editForm.control}
                  name="longitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* URL da Foto */}
              <FormField
                control={editForm.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Foto*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Justificativa */}
              <FormField
                control={editForm.control}
                name="justification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Insira uma justificativa para este registro" 
                        {...field} 
                        className="h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditingRecord(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateRecordMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateRecordMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Atualizar Registro
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Photo Modal */}
      <Dialog 
        open={photoModal.open} 
        onOpenChange={(open) => setPhotoModal({...photoModal, open})}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto do Registro</DialogTitle>
            <DialogDescription>
              Foto capturada no momento do registro de ponto
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <img 
              src={photoModal.photo} 
              alt="Foto do registro" 
              className="w-full max-h-96 object-contain rounded-md"
            />
          </div>
          
          {photoModal.justification && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-1">Justificativa:</h4>
              <p className="text-sm text-gray-600">{photoModal.justification}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
