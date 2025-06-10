import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";
import { 
  LayoutDashboard,
  ClipboardList,
  Users, 
  BarChart2, 
  DollarSign, 
  User as UserIcon, 
  Clock,
  CalendarClock,
  Bell,
  Search,
  LogOut,
  Settings,
  Sun,
  Moon,
  Calculator
} from "lucide-react";

// Lazy loading para os módulos do admin
const RecordsTab = lazy(() => import("@/pages/admin/records"));
const EmployeesTab = lazy(() => import("@/pages/admin/employees"));
const OverviewTab = lazy(() => import("@/pages/admin/overview"));
const ReportsTabImproved = lazy(() => import("@/pages/admin/reports-improved"));
const FinancialTab = lazy(() => import("@/pages/admin/financial"));
// Componentes temporários para funcionalidades futuras
const WorkSchedulesTab = () => <div className="p-6 text-center text-gray-500">Escalas de Trabalho - Em desenvolvimento</div>;
const TimeBankTab = () => <div className="p-6 text-center text-gray-500">Banco de Horas - Em desenvolvimento</div>;
const PayrollTab = lazy(() => import("@/pages/admin/payroll"));

// Types
export type AdminTab = "overview" | "records" | "employees" | "reports" | "financial" | "work-schedules" | "time-bank" | "payroll";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:tab");
  
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  
  // Navigation configuration
  const navigationItems = [
    { id: "overview", label: "Visão Geral", description: "Dashboard principal com resumo do sistema" },
    { id: "records", label: "Registros", description: "Gerenciar registros de ponto" },
    { id: "employees", label: "Funcionários", description: "Cadastro e gerenciamento de funcionários" },
    { id: "payroll", label: "Folha de Pagamento", description: "Calcular e gerar PDFs de pagamento" },
    { id: "reports", label: "Relatórios", description: "Relatórios e análises" },
    { id: "financial", label: "Financeiro", description: "Gestão financeira e transações" },
    { id: "work-schedules", label: "Escalas de Trabalho", description: "Configurar horários de trabalho" },
    { id: "time-bank", label: "Banco de Horas", description: "Gerenciar banco de horas" }
  ];
  
  // Set active tab based on URL or default to "overview"
  useEffect(() => {
    const validTabs = navigationItems.map(item => item.id);
    if (params?.tab && validTabs.includes(params.tab)) {
      setActiveTab(params.tab as AdminTab);
    } else if (!params?.tab) {
      setLocation("/admin/overview");
    }
  }, [params, setLocation]);
  
  // Handle tab change
  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setLocation(`/admin/${tab}`);
  };
  
  if (!user || user.accessLevel !== "admin") {
    return null;
  }
  
  // Get current section information
  const currentSection = navigationItems.find(item => item.id === activeTab);
  
  // Versão aprimorada do dashboard
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Content */}
      <div className="flex flex-col h-screen">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center">
              <div className="bg-primary/10 p-2 rounded text-primary mr-3">
                <Clock className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold">Ponto Eletrônico</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Barra de pesquisa */}
              <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="pl-9 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              {/* Botões de ação */}
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <Sun className="h-5 w-5" />
              </button>
              
              {/* User menu */}
              <div className="flex items-center space-x-2">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <button 
                  onClick={() => user && useAuth().logoutMutation.mutate()}
                  className="md:hidden flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-full"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 bg-gray-900 text-white overflow-y-auto flex-shrink-0 hidden md:block relative">
            <div className="p-4">
              <div className="space-y-1">
                {navigationItems.map(item => {
                  const isActive = activeTab === item.id;
                  // Determinar qual ícone usar
                  const IconComponent = 
                    item.id === "overview" ? LayoutDashboard :
                    item.id === "records" ? ClipboardList :
                    item.id === "employees" ? Users :
                    item.id === "reports" ? BarChart2 :
                    item.id === "financial" ? DollarSign :
                    item.id === "payroll" ? Calculator :
                    item.id === "work-schedules" ? CalendarClock :
                    item.id === "time-bank" ? Clock : 
                    LayoutDashboard;
                    
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as AdminTab)}
                      className={`w-full text-left p-3 rounded-md flex items-center transition-colors ${
                        isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Admin footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
              <button 
                onClick={() => user && useAuth().logoutMutation.mutate()}
                className="flex items-center justify-center w-full p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded-md"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span>Sair</span>
              </button>
            </div>
          </aside>
          
          {/* Mobile navigation */}
          <div className="md:hidden flex w-full max-h-screen overflow-y-auto bg-gray-100 dark:bg-gray-800">
            <div className="flex flex-col w-full">
              <div className="p-4 grid grid-cols-4 gap-2">
                {navigationItems.slice(0, 4).map(item => {
                  const isActive = activeTab === item.id;
                  // Determinar qual ícone usar
                  const IconComponent = 
                    item.id === "overview" ? LayoutDashboard :
                    item.id === "records" ? ClipboardList :
                    item.id === "employees" ? Users :
                    item.id === "payroll" ? Calculator :
                    LayoutDashboard;
                    
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id as AdminTab)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                        isActive 
                          ? "bg-primary text-white" 
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 shadow-sm"
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 mb-1 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span className="text-xs">{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="container mx-auto p-6">
              {/* Cabeçalho da página */}
              <div className="mb-6 md:flex md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-bold">
                    {currentSection?.label || "Dashboard"}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentSection?.description || "Painel administrativo do sistema de ponto"}
                  </p>
                </div>
                
                {/* Ações específicas da página */}
                <div className="mt-4 md:mt-0 flex space-x-2">
                  {activeTab === "employees" && (
                    <button className="flex items-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
                      <Users className="h-4 w-4 mr-2" />
                      Novo Funcionário
                    </button>
                  )}
                  
                  {activeTab === "records" && (
                    <button className="flex items-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Novo Registro
                    </button>
                  )}
                  
                  {activeTab === "reports" && (
                    <button className="flex items-center bg-primary text-white px-4 py-2 rounded-md text-sm font-medium">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Exportar Relatório
                    </button>
                  )}
                </div>
              </div>
              
              {/* Status card */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Bem-vindo, {user.fullName}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aqui você pode gerenciar todas as funcionalidades do sistema de ponto.</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                      Ajuda
                    </button>
                    <button className="px-3 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      Tour
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo da tab atual com fallback para carregamento */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <Suspense fallback={
                  <div className="p-6 space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-32 w-full" />
                    <div className="grid md:grid-cols-2 gap-4">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                }>
                  <div className="p-6">
                    {activeTab === "overview" && <OverviewTab />}
                    {activeTab === "records" && <RecordsTab />}
                    {activeTab === "employees" && <EmployeesTab />}
                    {activeTab === "reports" && <ReportsTabImproved />}
                    {activeTab === "financial" && <FinancialTab />}
                    {activeTab === "payroll" && <PayrollTab />}
                    {activeTab === "work-schedules" && <WorkSchedulesTab />}
                    {activeTab === "time-bank" && <TimeBankTab />}
                  </div>
                </Suspense>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
