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
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
  Download,
  FileSpreadsheet,
  FilePieChart,
  UserCheck,
  Users,
  FileText,
  ChevronRight,
} from "lucide-react";
import { format, subDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ReportsTabImproved() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("attendance");
  const [reportFormat, setReportFormat] = useState("csv");
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  
  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  
  // Get time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({
    queryKey: ["/api/admin/time-records", { startDate, endDate }],
    queryFn: async ({ queryKey }) => {
      const [_, params] = queryKey as [string, { startDate: string; endDate: string }];
      
      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      
      const res = await fetch(`/api/admin/time-records?${queryParams.toString()}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar registros");
      }
      
      return res.json();
    },
  });
  
  // Set predefined date ranges
  const setDateRange = (range: 'today' | 'yesterday' | 'week' | 'month' | 'previousMonth') => {
    const today = new Date();
    
    if (range === 'today') {
      setStartDate(format(today, 'yyyy-MM-dd'));
      setEndDate(format(today, 'yyyy-MM-dd'));
    } else if (range === 'yesterday') {
      const yesterday = subDays(today, 1);
      setStartDate(format(yesterday, 'yyyy-MM-dd'));
      setEndDate(format(yesterday, 'yyyy-MM-dd'));
    } else if (range === 'week') {
      setStartDate(format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
    } else if (range === 'month') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
    } else if (range === 'previousMonth') {
      const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      setStartDate(format(startOfMonth(previousMonth), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(previousMonth), 'yyyy-MM-dd'));
    }
  };
  
  // Handle report export
  const handleExportReport = () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      if (selectedUsers.length > 0 && !selectedUsers.includes("all")) {
        selectedUsers.forEach(id => params.append("userId", id));
      }
      
      params.append("reportType", activeTab);
      params.append("format", reportFormat);
      
      // Create URL for download
      const url = `/api/admin/export-time-records?${params.toString()}`;
      
      // Create a hidden link and click it to trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.${reportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Exportação iniciada",
        description: `O relatório está sendo baixado no formato ${reportFormat.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar o relatório",
        variant: "destructive",
      });
    }
  };
  
  // Process records data for various reports
  const processRecordsData = () => {
    if (!timeRecords || !employees) return {
      byEmployee: {},
      byDay: [],
      byDepartment: [],
      hoursByEmployee: [],
      summary: { total: 0, entradas: 0, saidas: 0 }
    };
    
    // Group records by employee
    const byEmployee = timeRecords.reduce((acc, record) => {
      if (!acc[record.userId]) {
        acc[record.userId] = [];
      }
      acc[record.userId].push(record);
      return acc;
    }, {} as Record<number, TimeRecord[]>);
    
    // Group records by day
    const recordsByDay = Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dayStr = format(day, "yyyy-MM-dd");
      
      const dayRecords = timeRecords.filter(record => {
        return format(new Date(record.timestamp), "yyyy-MM-dd") === dayStr;
      });
      
      return {
        date: format(day, "dd/MM"),
        dayName: format(day, "EEE", { locale: ptBR }),
        entradas: dayRecords.filter(r => r.type === "in").length,
        saidas: dayRecords.filter(r => r.type === "out").length,
        total: dayRecords.length
      };
    });
    
    // Group records by department
    const employeesByDepartment = employees.reduce((acc, employee) => {
      const dept = employee.department || "Sem departamento";
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(employee);
      return acc;
    }, {} as Record<string, User[]>);
    
    const recordsByDepartment = Object.entries(employeesByDepartment).map(([dept, deptEmployees]) => {
      const deptEmployeeIds = deptEmployees.map(e => e.id);
      
      const deptRecords = timeRecords.filter(record => 
        deptEmployeeIds.includes(record.userId)
      );
      
      const presentEmployees = deptEmployeeIds.filter(id => 
        deptRecords.some(r => r.userId === id && r.type === "in")
      );
      
      return {
        department: dept,
        total: deptEmployees.length,
        present: presentEmployees.length,
        absent: deptEmployees.length - presentEmployees.length,
        recordCount: deptRecords.length
      };
    }).sort((a, b) => b.total - a.total);
    
    // Calculate hours by employee
    const hoursByEmployee = Object.entries(byEmployee).map(([userId, records]) => {
      const user = employees.find(e => e.id === parseInt(userId));
      return {
        id: parseInt(userId),
        name: user?.fullName || `ID: ${userId}`,
        department: user?.department || 'Sem departamento',
        hours: calculateTotalHours(records),
        recordCount: records.length,
        inRecords: records.filter(r => r.type === "in").length,
        outRecords: records.filter(r => r.type === "out").length
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
    
    // Summary data
    const summary = {
      total: timeRecords.length,
      entradas: timeRecords.filter(r => r.type === "in").length,
      saidas: timeRecords.filter(r => r.type === "out").length
    };
    
    return { 
      byEmployee, 
      byDay: recordsByDay, 
      byDepartment: recordsByDepartment,
      hoursByEmployee,
      summary
    };
  };
  
  const recordsData = processRecordsData();
  const isLoading = employeesLoading || recordsLoading;
  
  // Main report components based on active tab
  const renderReportContent = () => {
    switch (activeTab) {
      case "attendance":
        return (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Presença por Departamento</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setDateRange('week')}>Esta Semana</Button>
                    <Button variant="outline" size="sm" onClick={() => setDateRange('month')}>Este Mês</Button>
                  </div>
                </div>
                <CardDescription>Análise de presença por departamento no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Departamento
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Funcionários
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Presentes
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ausentes
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Taxa de Presença
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recordsData.byDepartment.map((dept, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {dept.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.total}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                  {dept.present}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                  {dept.absent}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {dept.total > 0 ? `${Math.round((dept.present / dept.total) * 100)}%` : '0%'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Tendência de Registros Diários</CardTitle>
                <CardDescription>Registros de entrada e saída nos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-80 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={recordsData.byDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => {
                          const labels = {
                            entradas: "Entradas",
                            saidas: "Saídas",
                            total: "Total"
                          };
                          return [value, labels[name as keyof typeof labels]];
                        }}
                        labelFormatter={(label) => {
                          const item = recordsData.byDay.find(d => d.date === label);
                          return item ? `${item.dayName}, ${item.date}` : label;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#3B82F6" />
                      <Bar dataKey="saidas" name="Saídas" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </>
        );
        
      case "hours":
        return (
          <>
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Horas Trabalhadas por Funcionário</CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="show-details"
                        checked={showDetails}
                        onCheckedChange={setShowDetails}
                      />
                      <Label htmlFor="show-details">Mostrar detalhes</Label>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setDateRange('month')}>Este Mês</Button>
                  </div>
                </div>
                <CardDescription>Total de horas registradas no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
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
                          {showDetails && (
                            <>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Registros Entrada
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Registros Saída
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Registros
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recordsData.hoursByEmployee.map((employee) => (
                          <tr key={employee.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className="px-2 py-1 text-xs font-semibold rounded-md bg-blue-100 text-blue-800">
                                {employee.hours}
                              </span>
                            </td>
                            {showDetails && (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {employee.inRecords}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {employee.outRecords}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {employee.recordCount}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        );
          
      case "detailedRecords":
        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Registros Detalhados</CardTitle>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setDateRange('today')}>Hoje</Button>
                  <Button variant="outline" size="sm" onClick={() => setDateRange('week')}>Esta Semana</Button>
                </div>
              </div>
              <CardDescription>Lista completa de registros de ponto no período</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
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
                          Endereço IP
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Localização
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {timeRecords && employees ? (
                        timeRecords
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .slice(0, 50)
                          .map((record) => {
                            const user = employees.find(e => e.id === record.userId);
                            return (
                              <tr key={record.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {user?.fullName || `ID: ${record.userId}`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDateTime(record.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    record.type === "in" 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-red-100 text-red-800"
                                  }`}>
                                    {record.type === "in" ? "Entrada" : "Saída"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {record.ipAddress}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {record.latitude}, {record.longitude}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            Nenhum registro encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {timeRecords && timeRecords.length > 50 && (
                    <div className="py-3 px-6 text-right text-sm text-gray-500">
                      Mostrando os 50 registros mais recentes de {timeRecords.length} registros
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
          
      default:
        return (
          <div className="text-center py-10">
            <p>Selecione um tipo de relatório para visualizar</p>
          </div>
        );
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Relatórios</h1>
      
      {/* Report filters and export options */}
      <Card className="mb-6">
        <CardHeader className="border-b border-gray-200 pb-3">
          <CardTitle className="text-lg font-medium">Configurações de Relatório</CardTitle>
          <CardDescription>Defina o período e as opções para os relatórios</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3 lg:col-span-2">
              <Label htmlFor="report-start-date">Data Inicial</Label>
              <Input 
                id="report-start-date" 
                type="date" 
                className="mt-1" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="sm:col-span-3 lg:col-span-2">
              <Label htmlFor="report-end-date">Data Final</Label>
              <Input 
                id="report-end-date" 
                type="date" 
                className="mt-1" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="sm:col-span-6 lg:col-span-2">
              <Label htmlFor="date-presets">Período Predefinido</Label>
              <Select onValueChange={(value) => setDateRange(value as any)}>
                <SelectTrigger id="date-presets" className="mt-1">
                  <SelectValue placeholder="Selecione um período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="yesterday">Ontem</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="previousMonth">Mês Anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="sm:col-span-6 lg:col-span-3">
              <Label htmlFor="report-users">Funcionários</Label>
              <Select onValueChange={(value) => setSelectedUsers(value === 'all' ? ['all'] : [value])}>
                <SelectTrigger id="report-users" className="mt-1">
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
            </div>
            
            <div className="sm:col-span-6 lg:col-span-3">
              <Label htmlFor="report-format">Formato de Exportação</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format" className="mt-1">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 px-6 py-3 flex justify-end">
          <Button className="flex items-center" onClick={handleExportReport}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </CardFooter>
      </Card>
      
      {/* Report types tabs */}
      <div className="mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab as any}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full lg:w-auto">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Presença</span>
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Horas Trabalhadas</span>
            </TabsTrigger>
            <TabsTrigger value="detailedRecords" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Registros Detalhados</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            {renderReportContent()}
          </div>
        </Tabs>
      </div>
      
      {/* Quick Reports */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Rápidos</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FileSpreadsheet className="text-white h-5 w-5" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Horas por Funcionário
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Mês Atual
                    </div>
                  </dd>
                </dl>
              </div>
              <div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setActiveTab("hours");
                  setDateRange('month');
                  setSelectedUsers([]);
                  handleExportReport();
                }}
              >
                Download Imediato
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <FilePieChart className="text-white h-5 w-5" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Estatísticas de Presença
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Últimos 30 dias
                    </div>
                  </dd>
                </dl>
              </div>
              <div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setActiveTab("attendance");
                  const thirtyDaysAgo = subDays(new Date(), 30);
                  setStartDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
                  setEndDate(format(new Date(), 'yyyy-MM-dd'));
                  setSelectedUsers([]);
                  handleExportReport();
                }}
              >
                Download Imediato
              </Button>
            </div>
          </div>
        </Card>
        
        <Card className="overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Users className="text-white h-5 w-5" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Registros Completos
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      Últimos 7 dias
                    </div>
                  </dd>
                </dl>
              </div>
              <div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Button 
                variant="link" 
                className="font-medium text-primary hover:text-blue-700 p-0"
                onClick={() => {
                  setActiveTab("detailedRecords");
                  setDateRange('week');
                  setSelectedUsers([]);
                  handleExportReport();
                }}
              >
                Download Imediato
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}