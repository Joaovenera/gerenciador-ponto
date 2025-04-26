import { Link } from "wouter";
import { User } from "@shared/schema";
import { ClipboardList, Users, BarChart2, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

type AdminTab = "records" | "employees" | "reports";

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User;
}

export default function AdminSidebar({ activeTab, onTabChange, user }: AdminSidebarProps) {
  const { logoutMutation } = useAuth();
  
  return (
    <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-gray-900">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
          <h1 className="text-xl font-bold text-white">Ponto Eletrônico</h1>
        </div>
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            <Link href="/admin/records">
              <a 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === "records" ? "bg-gray-800 text-white" : ""}`}
                onClick={() => onTabChange("records")}
              >
                <ClipboardList className={`mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300 ${activeTab === "records" ? "text-gray-300" : ""}`} />
                Registros de Ponto
              </a>
            </Link>
            <Link href="/admin/employees">
              <a 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === "employees" ? "bg-gray-800 text-white" : ""}`}
                onClick={() => onTabChange("employees")}
              >
                <Users className={`mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300 ${activeTab === "employees" ? "text-gray-300" : ""}`} />
                Funcionários
              </a>
            </Link>
            <Link href="/admin/reports">
              <a 
                className={`text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === "reports" ? "bg-gray-800 text-white" : ""}`}
                onClick={() => onTabChange("reports")}
              >
                <BarChart2 className={`mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300 ${activeTab === "reports" ? "text-gray-300" : ""}`} />
                Relatórios
              </a>
            </Link>
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
          <div className="flex-shrink-0 group block">
            <div className="flex items-center">
              <div>
                <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                  <UserIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <Button 
                  variant="link" 
                  className="text-xs font-medium text-gray-300 hover:text-gray-200 p-0"
                  onClick={() => logoutMutation.mutate()}
                >
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
