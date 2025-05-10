import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "@shared/schema";

// Lazy loading for admin modules
const RecordsTab = lazy(() => import("@/pages/admin/records"));
const EmployeesTab = lazy(() => import("@/pages/admin/employees"));
const ReportsTabImproved = lazy(() => import("@/pages/admin/reports-improved"));
const OverviewTab = lazy(() => import("@/pages/admin/overview"));
const FinancialTab = lazy(() => import("@/pages/admin/financial"));
const WorkSchedulesTab = lazy(() => import("@/pages/admin/work-schedules"));
const TimeBankTab = lazy(() => import("@/pages/admin/time-bank"));

// Componentes a serem adicionados em uma etapa futura
// import ModernSidebar from "@/components/admin/modern-sidebar";
// import TopNavigation from "@/components/admin/top-navigation";
// import MobileNavigation from "@/components/admin/mobile-navigation";

// Types
export type AdminTab = "overview" | "records" | "employees" | "reports" | "financial" | "work-schedules" | "time-bank";

// Navigation items configuration
export const navigationItems = [
  { 
    id: "overview", 
    label: "Dashboard", 
    icon: "LayoutDashboard",
    description: "Visão geral do sistema de ponto"
  },
  { 
    id: "records", 
    label: "Registros de Ponto", 
    icon: "ClipboardList",
    description: "Gerenciar registros de entrada e saída"
  },
  { 
    id: "employees", 
    label: "Funcionários", 
    icon: "Users",
    description: "Gerenciar cadastro de funcionários"
  },
  { 
    id: "work-schedules", 
    label: "Jornadas de Trabalho", 
    icon: "CalendarClock",
    description: "Gerenciar escalas e jornadas"
  },
  { 
    id: "time-bank", 
    label: "Banco de Horas", 
    icon: "Clock",
    description: "Controle de banco de horas"
  },
  { 
    id: "reports", 
    label: "Relatórios", 
    icon: "BarChart2",
    description: "Análises e relatórios detalhados"
  },
  { 
    id: "financial", 
    label: "Financeiro", 
    icon: "DollarSign",
    description: "Gerenciamento financeiro"
  }
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:tab");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [collapsed, setCollapsed] = useState(false);
  
  // Set active tab based on URL or default to "overview"
  useEffect(() => {
    if (params?.tab && navigationItems.map(item => item.id).includes(params.tab)) {
      setActiveTab(params.tab as AdminTab);
    } else if (!params?.tab) {
      // If no tab is specified, update URL to include the default tab
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
  
  // Temporário: Use os componentes antigos enquanto construímos os novos
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Content */}
      <div className="flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex justify-between items-center p-4">
            <h1 className="text-2xl font-bold">Ponto Eletrônico</h1>
            <div>
              <span className="text-sm mr-2">{user.fullName}</span>
              <button 
                onClick={() => user && useAuth().logoutMutation.mutate()}
                className="bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100"
              >
                Sair
              </button>
            </div>
          </div>
        </header>
        
        <div className="flex">
          {/* Sidebar - Temporário */}
          <aside className="w-64 bg-gray-900 text-white p-4 min-h-screen">
            <nav className="space-y-2">
              {navigationItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as AdminTab)}
                    className={`w-full text-left p-2 rounded-md flex items-center ${
                      isActive ? "bg-primary text-white" : "text-gray-300 hover:bg-gray-800"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
          
          {/* Main content */}
          <main className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {currentSection?.label || "Dashboard"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {currentSection?.description || "Painel administrativo do sistema de ponto"}
              </p>
            </div>
            
            {/* Conteúdo da tab atual */}
            <Suspense fallback={
              <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32 w-full" />
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            }>
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "records" && <RecordsTab />}
              {activeTab === "employees" && <EmployeesTab />}
              {activeTab === "reports" && <ReportsTabImproved />}
              {activeTab === "financial" && <FinancialTab />}
              {activeTab === "work-schedules" && <WorkSchedulesTab />}
              {activeTab === "time-bank" && <TimeBankTab />}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
