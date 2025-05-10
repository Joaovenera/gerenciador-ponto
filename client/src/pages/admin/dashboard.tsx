import { useState, useEffect, lazy, Suspense } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/admin-sidebar";
import AdminMobileHeader from "@/components/admin-mobile-header";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy loading para os módulos do admin
const RecordsTab = lazy(() => import("@/pages/admin/records"));
const EmployeesTab = lazy(() => import("@/pages/admin/employees"));
const ReportsTabImproved = lazy(() => import("@/pages/admin/reports-improved"));
const OverviewTab = lazy(() => import("@/pages/admin/overview"));
const FinancialTab = lazy(() => import("@/pages/admin/financial"));

type AdminTab = "overview" | "records" | "employees" | "reports" | "financial";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:tab");
  
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  
  // Set active tab based on URL or default to "overview"
  useEffect(() => {
    if (params?.tab && ["overview", "records", "employees", "reports", "financial"].includes(params.tab)) {
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
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar & Main Content Container */}
      <div className="flex">
        {/* Sidebar (Desktop Only) */}
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          user={user}
        />
        
        {/* Mobile Header */}
        <AdminMobileHeader 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          user={user}
        />
        
        {/* Main Content */}
        <div className="md:pl-64 flex flex-col flex-1">
          <main className="flex-1">
            <div className="py-6">
              {/* Content based on active tab with loading fallback */}
              <Suspense fallback={
                <div className="px-4 md:px-8 space-y-6">
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
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
