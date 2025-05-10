import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { 
  Menu, 
  X, 
  ClipboardList, 
  Users, 
  BarChart2, 
  DollarSign, 
  User as UserIcon, 
  LayoutDashboard,
  Clock,
  CalendarClock,
  LogOut,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminTab = "overview" | "records" | "employees" | "reports" | "financial" | "work-schedules" | "time-bank";

interface AdminMobileHeaderProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User;
}

export default function AdminMobileHeader({ activeTab, onTabChange, user }: AdminMobileHeaderProps) {
  const { logoutMutation } = useAuth();
  
  // Group navigation items into main and secondary for proper organization
  const mainNavItems = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "records", label: "Registros", icon: ClipboardList },
    { id: "employees", label: "Funcs.", icon: Users },
    { id: "time-bank", label: "B. Horas", icon: Clock }
  ];
  
  const secondaryNavItems = [
    { id: "work-schedules", label: "Jornadas", icon: CalendarClock },
    { id: "reports", label: "Relatórios", icon: BarChart2 },
    { id: "financial", label: "Financ.", icon: DollarSign }
  ];

  return (
    <div className="md:hidden">
      {/* Header with title and user dropdown */}
      <div className="flex items-center justify-between h-16 px-4 bg-gray-900 text-white">
        <div>
          <h1 className="text-xl font-bold">Ponto Eletrônico</h1>
        </div>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300">
                  <UserIcon className="h-5 w-5" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuItem
                onClick={() => logoutMutation.mutate()}
                className="text-red-500 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Bottom Tab Navigation - Simplified with 4 primary + 1 more menu */}
      <div className="grid grid-cols-5 bg-gray-800 text-xs text-gray-400 fixed bottom-0 left-0 right-0 z-10 border-t border-gray-700">
        {mainNavItems.map((item) => (
          <Button 
            key={item.id}
            variant="ghost" 
            className={`flex-1 flex flex-col items-center py-2 ${activeTab === item.id ? "text-white border-t-2 border-primary" : ""}`}
            onClick={() => onTabChange(item.id as AdminTab)}
          >
            <item.icon className="mb-1 h-5 w-5" />
            <span>{item.label}</span>
          </Button>
        ))}
        
        {/* More dropdown menu for secondary items */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex-1 flex flex-col items-center py-2"
            >
              <Settings className="mb-1 h-5 w-5" />
              <span>Mais</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mb-2">
            {secondaryNavItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onTabChange(item.id as AdminTab)}
                className={`cursor-pointer ${activeTab === item.id ? "bg-primary/10" : ""}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.id === "work-schedules" ? "Jornadas de Trabalho" : 
                       item.id === "reports" ? "Relatórios" : 
                       "Financeiro"}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Add padding at the bottom to account for the fixed bottom nav */}
      <div className="pb-16"></div>
    </div>
  );
}
