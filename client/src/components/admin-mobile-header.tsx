import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { Menu, X, ClipboardList, Users, BarChart2, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type AdminTab = "overview" | "records" | "employees" | "reports";

interface AdminMobileHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User;
}

export default function AdminMobileHeader({ activeTab, onTabChange, user }: AdminMobileHeaderProps) {
  const { logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleTabClick = (tab: AdminTab) => {
    onTabChange(tab);
    setIsMenuOpen(false);
  };
  
  return (
    <div className="md:hidden bg-gray-900 text-white">
      <div className="flex items-center justify-between h-16 px-4">
        <div>
          <h1 className="text-xl font-bold">Ponto Eletrônico</h1>
        </div>
        <div>
          <Button variant="ghost" className="text-gray-400" onClick={toggleMenu}>
            <Menu className="h-6 w-6" />
          </Button>
          
          {/* Mobile Menu */}
          <div className={cn(
            "fixed inset-0 z-40 flex transition-all duration-300 ease-in-out transform",
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
          )}>
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
              <div className="absolute top-0 right-0 pt-2 pr-2">
                <Button 
                  variant="ghost" 
                  className="text-gray-400" 
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="flex-1 h-0 pt-14 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  <Link href="/admin/overview">
                    <a 
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${activeTab === "overview" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                      onClick={() => handleTabClick("overview")}
                    >
                      <LayoutDashboard className="mr-4 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                      Dashboard
                    </a>
                  </Link>
                  <Link href="/admin/records">
                    <a 
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${activeTab === "records" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                      onClick={() => handleTabClick("records")}
                    >
                      <ClipboardList className="mr-4 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                      Registros de Ponto
                    </a>
                  </Link>
                  <Link href="/admin/employees">
                    <a 
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${activeTab === "employees" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                      onClick={() => handleTabClick("employees")}
                    >
                      <Users className="mr-4 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                      Funcionários
                    </a>
                  </Link>
                  <Link href="/admin/reports">
                    <a 
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${activeTab === "reports" ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
                      onClick={() => handleTabClick("reports")}
                    >
                      <BarChart2 className="mr-4 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
                      Relatórios
                    </a>
                  </Link>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-800 p-4">
                <a href="#" className="flex-shrink-0 group block">
                  <div className="flex items-center">
                    <div>
                      <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                        <UserIcon className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-white">{user.fullName}</p>
                      <Button 
                        variant="link" 
                        className="text-sm font-medium text-gray-400 hover:text-gray-300 p-0"
                        onClick={() => {
                          logoutMutation.mutate();
                          setIsMenuOpen(false);
                        }}
                      >
                        Sair
                      </Button>
                    </div>
                  </div>
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 w-14"></div>
          </div>
        </div>
      </div>
      
      {/* Mobile Tab Navigation */}
      <div className="flex justify-between bg-gray-800 text-xs text-gray-400">
        <Button 
          variant="ghost" 
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "overview" ? "text-white border-b-2 border-primary" : ""}`}
          onClick={() => onTabChange("overview")}
        >
          <LayoutDashboard className="mb-1 h-5 w-5" />
          <span>Dashboard</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "records" ? "text-white border-b-2 border-primary" : ""}`}
          onClick={() => onTabChange("records")}
        >
          <ClipboardList className="mb-1 h-5 w-5" />
          <span>Registros</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "employees" ? "text-white border-b-2 border-primary" : ""}`}
          onClick={() => onTabChange("employees")}
        >
          <Users className="mb-1 h-5 w-5" />
          <span>Funcionários</span>
        </Button>
        <Button 
          variant="ghost" 
          className={`flex-1 flex flex-col items-center py-2 ${activeTab === "reports" ? "text-white border-b-2 border-primary" : ""}`}
          onClick={() => onTabChange("reports")}
        >
          <BarChart2 className="mb-1 h-5 w-5" />
          <span>Relatórios</span>
        </Button>
      </div>
    </div>
  );
}
