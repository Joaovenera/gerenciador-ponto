import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeRecord, User } from "@shared/schema";
import { 
  formatDate, 
  formatDateTime,
  calculateTotalHours,
} from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  FileDown,
  Download
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReportsTab() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("hours");
  const [reportFormat, setReportFormat] = useState("CSV");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  
  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Get all time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({
    queryKey: ["/api/admin/time-records", { startDate, endDate }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey;
      const { startDate, endDate } = params as { startDate: string; endDate: string };
      
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      
      const res = await fetch(`/api/admin/time-records?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar registros");
      }
      
      return res.json();
    },
  });
  
  // Handle export
  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      if (selectedEmployees.length > 0 && selectedEmployees[0] !== "all") {
        selectedEmployees.forEach(id => params.append("userId", id));
      }
      
      // Create URL for download
      const url = `/api/admin/export-time-records?${params.toString()}`;
      
      // Create a hidden link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${reportType}-${format(new Date(), "yyyy-MM-dd")}.csv`;
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
        description: "Não foi possível exportar os relatórios",
        variant: "destructive",
      });
    }
  };
  
  // Group records by employee
  const recordsByEmployee = timeRecords
    ? timeRecords.reduce((acc, record) => {
        if (!acc[record.userId]) {
          acc[record.userId] = [];
        }
        acc[record.userId].push(record);
        return acc;
      }, {} as Record<number, TimeRecord[]>)
    : {};
  
  // Calculate hours worked for each employee
  const employeeHours = Object.entries(recordsByEmployee).map(([userId, records]) => {
    const user = employees?.find(e => e.id === parseInt(userId));
    return {
      userId: parseInt(userId),
      name: user?.fullName || `ID: ${userId}`,
      department: user?.department || '',
      hours: calculateTotalHours(records),
      recordCount: records.length
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  
  // Set predefined date ranges
  const setDateRange = (range: 'week' | 'month' | 'previousMonth') => {
    const today = new Date();
    
    if (range === 'week') {
      setStartDate(format(startOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today, { locale: ptBR }), 'yyyy-MM-dd'));
    } else if (range === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (range === 'previousMonth') {
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setStartDate(format(startOfMonth(previousMonth), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(previousMonth), 'yyyy-MM-dd'));
    }
  };
  
  const isLoading = employeesLoading || recordsLoading;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Relatórios</h1>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <Clock className="text-white h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Horas Trabalhadas
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Por funcionário
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setReportType("hours");
                  setDateRange('month');
                  setSelectedEmployees([]);
                  handleExport();
                }}
              >
                Gerar relatório
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <Calendar className="text-white h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Presença Mensal
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Consolidado
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setReportType("presence");
                  setDateRange('month');
                  setSelectedEmployees([]);
                  handleExport();
                }}
              >
                Gerar relatório
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                <AlertTriangle className="text-white h-6 w-6" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Irregularidades
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Atrasos e Faltas
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setReportType("irregularities");
                  setDateRange('month');
                  setSelectedEmployees([]);
                  handleExport();
                }}
              >
                Gerar relatório
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Custom Report */}
      <Card className="mb-6">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-lg font-medium">Relatório Personalizado</CardTitle>
          <p className="text-sm text-gray-500">
            Configure os parâmetros para gerar um relatório personalizado.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <Label htmlFor="report-type">Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type" className="mt-1">
                  <SelectValue placeholder="Selecione o tipo de relatório" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Horas Trabalhadas</SelectItem>
                  <SelectItem value="detailed">Registros Detalhados</SelectItem>
                  <SelectItem value="presence">Presença/Ausência</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="report-format">Formato</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format" className="mt-1">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="Excel">Excel</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="date-presets">Período Predefinido</Label>
              <Select onValueChange={(value) => setDateRange(value as 'week' | 'month' | 'previousMonth')}>
                <SelectTrigger id="date-presets" className="mt-1">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana Atual</SelectItem>
                  <SelectItem value="month">Mês Atual</SelectItem>
                  <SelectItem value="previousMonth">Mês Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="report-start-date">Data Inicial</Label>
              <Input 
                id="report-start-date" 
                type="date" 
                className="mt-1" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="sm:col-span-3">
              <Label htmlFor="report-end-date">Data Final</Label>
              <Input 
                id="report-end-date" 
                type="date" 
                className="mt-1" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="sm:col-span-6">
              <Label htmlFor="report-employees">Funcionários</Label>
              <Select onValueChange={(value) => setSelectedEmployees(value === 'all' ? ['all'] : [value])}>
                <SelectTrigger id="report-employees" className="mt-1">
                  <SelectValue placeholder="Selecione funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">Selecione "Todos os funcionários" ou um funcionário específico</p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 px-6 py-3 flex justify-end">
          <Button className="flex items-center" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </CardFooter>
      </Card>
      
      {/* Reports Preview */}
      <Tabs defaultValue="hours" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hours">Horas Trabalhadas</TabsTrigger>
          <TabsTrigger value="recent">Relatórios Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Horas Trabalhadas no Período</CardTitle>
              <p className="text-sm text-gray-500">
                {formatDate(startDate)} a {formatDate(endDate)}
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-40 w-full" />
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
                          Departamento
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total de Horas
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registros
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employeeHours.length > 0 ? (
                        employeeHours.map((employee) => (
                          <tr key={employee.userId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {employee.hours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.recordCount}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            Nenhum registro encontrado no período selecionado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Relatórios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
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
                        Data de Geração
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Display info message instead of empty mock data */}
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Os relatórios gerados aparecerão aqui
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
