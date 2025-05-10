import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { User } from "@shared/schema";
import { useMediaQuery } from "@/hooks/use-media-query";

// Lazy loading for admin modules
const RecordsTab = lazy(() => import("@/pages/admin/records"));
const EmployeesTab = lazy(() => import("@/pages/admin/employees"));
const ReportsTabImproved = lazy(() => import("@/pages/admin/reports-improved"));
const OverviewTab = lazy(() => import("@/pages/admin/overview"));
const FinancialTab = lazy(() => import("@/pages/admin/financial"));
const WorkSchedulesTab = lazy(() => import("@/pages/admin/work-schedules"));
const TimeBankTab = lazy(() => import("@/pages/admin/time-bank"));

// Components
import ModernSidebar from "@/components/admin/modern-sidebar";
import TopNavigation from "@/components/admin/top-navigation";
import MobileNavigation from "@/components/admin/mobile-navigation";

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
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
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
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Only shown on mobile */}
      <div className="lg:hidden">
        <TopNavigation user={user} />
      </div>
      
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <ModernSidebar 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            user={user}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </div>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 pt-6 lg:pt-8 pb-16 lg:pb-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {currentSection?.label || "Dashboard"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {currentSection?.description || "Painel administrativo do sistema de ponto"}
              </p>
            </div>
            
            {/* Content based on active tab with loading fallback */}
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
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation - Bottom fixed navbar */}
      <div className="lg:hidden">
        <MobileNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          user={user}
        />
      </div>
    </div>
  );
}
