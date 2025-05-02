import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  PlusCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TimeRecordForm from "@/components/time-record-form";

export default function RecordsTab() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [photoModal, setPhotoModal] = useState<{open: boolean, photo: string}>({
    open: false, 
    photo: ""
  });
  const [recordFormModal, setRecordFormModal] = useState<{
    open: boolean; 
    isEditing: boolean; 
    record?: TimeRecord;
  }>({
    open: false,
    isEditing: false,
  });
  
  // Get all time records with filters
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({
    queryKey: ["/api/admin/time-records", dateRange, selectedEmployee, selectedType],
    queryFn: async ({ queryKey }) => {
      const [_, dateRangeValue, employeeId, type] = queryKey;
      const dateRangeObj = dateRangeValue as {start: string, end: string};
      
      const params = new URLSearchParams();
      if (dateRangeObj.start) params.append("startDate", dateRangeObj.start);
      if (dateRangeObj.end) params.append("endDate", dateRangeObj.end);
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
            
            <div className="mt-4 flex justify-end space-x-2">
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
                                onClick={() => setPhotoModal({open: true, photo: record.photo})}
                              >
                                <Camera className="h-4 w-4 mr-1" />
                                Ver foto
                              </Button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button variant="ghost" className="text-primary hover:text-blue-700 h-8 w-8 p-0 mr-1">
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
                        <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
