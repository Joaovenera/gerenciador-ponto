import { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "@/components/admin-sidebar";
import AdminMobileHeader from "@/components/admin-mobile-header";
import RecordsTab from "@/pages/admin/records";
import EmployeesTab from "@/pages/admin/employees";
import ReportsTabImproved from "@/pages/admin/reports-improved";
import OverviewTab from "@/pages/admin/overview";

type AdminTab = "overview" | "records" | "employees" | "reports";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/:tab");
  
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  
  // Set active tab based on URL or default to "overview"
  useEffect(() => {
    if (params?.tab && ["overview", "records", "employees", "reports"].includes(params.tab)) {
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
              {/* Content based on active tab */}
              {activeTab === "overview" && <OverviewTab />}
              {activeTab === "records" && <RecordsTab />}
              {activeTab === "employees" && <EmployeesTab />}
              {activeTab === "reports" && <ReportsTabImproved />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
