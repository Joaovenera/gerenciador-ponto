import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { navigationItems, AdminTab } from "@/pages/admin/dashboard";
import { 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  Users, 
  BarChart2, 
  DollarSign, 
  User as UserIcon, 
  Clock,
  CalendarClock,
  LogOut,
  Settings,
  Briefcase,
  Menu
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Map of icon names to Lucide icons
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  DollarSign,
  Clock,
  CalendarClock,
  Settings,
  Briefcase
};

interface ModernSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function ModernSidebar({ 
  activeTab, 
  onTabChange, 
  user,
  collapsed,
  setCollapsed
}: ModernSidebarProps) {
  const { logoutMutation } = useAuth();
  
  return (
    <div 
      className={cn(
        "h-screen flex flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out shadow-sm",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <h2 className="font-semibold text-lg">Ponto Eletrônico</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <TooltipProvider delayDuration={0}>
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = iconMap[item.icon];
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        collapsed ? "px-2 py-2" : "px-3 py-2",
                        activeTab === item.id ? 
                          "bg-primary text-primary-foreground" : 
                          "hover:bg-muted"
                      )}
                      onClick={() => onTabChange(item.id as AdminTab)}
                    >
                      {IconComponent && <IconComponent className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />}
                      {!collapsed && <span>{item.label}</span>}
                    </Button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                {!collapsed && (
                  <div className="ml-3 truncate">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">Administrador</p>
                  </div>
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 cursor-pointer"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}