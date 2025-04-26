import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TimeRecord, User } from "@shared/schema";
import { formatDate, formatDateTime, calculateTotalHours } from "@/lib/utils";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Calendar,
  ArrowUpRight,
  BarChart2,
  FileDown,
} from "lucide-react";
import { format, subDays, parseISO, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function OverviewTab() {
  const today = new Date();
  const startDate = format(subDays(today, 30), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

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

  // Calculate statistics
  const activeEmployees = employees?.filter(e => e.status === "active").length || 0;
  const inactiveEmployees = employees?.filter(e => e.status === "inactive").length || 0;
  const totalEmployees = employees?.length || 0;

  // Today's attendance
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const todayRecords = timeRecords?.filter(record => {
    const recordDate = new Date(record.timestamp);
    return recordDate >= todayStart && recordDate <= todayEnd;
  }) || [];
  
  // Group today's records by user to count present employees
  const presentEmployeeIds = new Set();
  todayRecords.forEach(record => {
    if (record.type === "in") {
      presentEmployeeIds.add(record.userId);
    }
  });
  
  const presentToday = presentEmployeeIds.size;
  const absentToday = activeEmployees - presentToday;
  
  // Records by day chart data
  const recordsByDay = timeRecords ? Array.from({ length: 7 }, (_, i) => {
    const day = subDays(today, 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    
    const dayRecords = timeRecords.filter(record => {
      return format(new Date(record.timestamp), "yyyy-MM-dd") === dayStr;
    });
    
    return {
      date: format(day, "EEE", { locale: ptBR }),
      entradas: dayRecords.filter(r => r.type === "in").length,
      saidas: dayRecords.filter(r => r.type === "out").length,
    };
  }) : [];

  // Department distribution
  const departmentCounts = employees ? employees.reduce((acc, employee) => {
    if (!acc[employee.department]) {
      acc[employee.department] = 0;
    }
    acc[employee.department]++;
    return acc;
  }, {} as Record<string, number>) : {};

  const departmentData = Object.entries(departmentCounts).map(([department, count]) => ({
    name: department || "Sem departamento",
    value: count,
  })).sort((a, b) => b.value - a.value);

  // Department colors
  const DEPARTMENT_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
    "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6"
  ];

  // Attendance trend over 30 days
  const attendanceTrend = timeRecords ? Array.from({ length: 5 }, (_, i) => {
    const day = subDays(today, 4 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    
    // Count unique employees with "in" records on this day
    const uniqueIds = new Set();
    timeRecords.forEach(record => {
      if (format(new Date(record.timestamp), "yyyy-MM-dd") === dayStr && record.type === "in") {
        uniqueIds.add(record.userId);
      }
    });
    
    const presentCount = uniqueIds.size;
    
    return {
      date: format(day, "dd/MM"),
      presentes: presentCount,
      ausentes: activeEmployees - presentCount,
    };
  }) : [];

  // Get latest records
  const latestRecords = timeRecords 
    ? [...timeRecords]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
    : [];

  const isLoading = employeesLoading || recordsLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            {format(today, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Funcionários</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-14 my-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{totalEmployees}</p>
                )}
                <p className="text-sm text-gray-500">Total registrado</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Presentes</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-14 my-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{presentToday}</p>
                )}
                <p className="text-sm text-gray-500">Presentes hoje</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ausentes</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-14 my-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{absentToday}</p>
                )}
                <p className="text-sm text-gray-500">Ausentes hoje</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                <UserX className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Registros</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-14 my-1" />
                ) : (
                  <p className="text-3xl font-bold text-gray-900">{timeRecords?.length || 0}</p>
                )}
                <p className="text-sm text-gray-500">Últimos 30 dias</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-6">
        <Card className="h-96">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Registros de Ponto - Últimos 7 dias</CardTitle>
            <CardDescription>Entradas e saídas diárias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recordsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entradas" name="Entradas" fill="#3B82F6" />
                  <Bar dataKey="saidas" name="Saídas" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="h-96">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Distribuição por Departamento</CardTitle>
            <CardDescription>Número de funcionários por departamento</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} funcionários`, ""]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Trend & Latest Records */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Tendência de Presença</CardTitle>
            <CardDescription>Funcionários presentes vs ausentes nos últimos 5 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 w-full flex items-center justify-center">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="presentes" name="Presentes" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="ausentes" name="Ausentes" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Últimos Registros</CardTitle>
            <CardDescription>Registros mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <ul className="space-y-3">
                {latestRecords.map((record) => {
                  const user = employees?.find(e => e.id === record.userId);
                  return (
                    <li key={record.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user?.fullName || `ID: ${record.userId}`}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(record.timestamp)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        record.type === "in" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {record.type === "in" ? "Entrada" : "Saída"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links / Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-md bg-blue-500 flex items-center justify-center text-white">
                  <FileDown className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Exportar Relatório</h3>
                  <p className="text-xs text-gray-500">Dados completos de ponto</p>
                </div>
              </div>
              <Link href="/admin/reports">
                <a className="text-blue-600 hover:text-blue-700">
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-md bg-green-500 flex items-center justify-center text-white">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Análise Avançada</h3>
                  <p className="text-xs text-gray-500">Estatísticas detalhadas</p>
                </div>
              </div>
              <Link href="/admin/reports">
                <a className="text-blue-600 hover:text-blue-700">
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-md bg-purple-500 flex items-center justify-center text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Gerenciar Funcionários</h3>
                  <p className="text-xs text-gray-500">Adicionar ou editar usuários</p>
                </div>
              </div>
              <Link href="/admin/employees">
                <a className="text-blue-600 hover:text-blue-700">
                  <ArrowUpRight className="h-5 w-5" />
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}