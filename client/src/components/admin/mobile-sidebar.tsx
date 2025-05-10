import { useState } from "react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { navigationItems, AdminTab } from "@/pages/admin/dashboard";
import { 
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
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

// Map of icon names to Lucide icons
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart2,
  DollarSign,
  Clock,
  CalendarClock,
  Settings
};

interface MobileSidebarProps {
  user: User;
}

export default function MobileSidebar({ 
  user
}: MobileSidebarProps) {
  const { logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Handle navigation
  const handleNavigation = (tab: AdminTab) => {
    setLocation(`/admin/${tab}`);
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 overflow-y-auto">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1 rounded text-primary">
            <Clock className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">Ponto Eletrônico</span>
        </div>
        <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </SheetClose>
      </div>
      
      {/* User profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UserIcon className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>
      
      {/* Navigation menu */}
      <div className="flex-1 p-4">
        <h2 className="font-medium text-sm text-muted-foreground mb-2">Menu Principal</h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            return (
              <SheetClose asChild key={item.id}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left",
                    "px-3 py-2 hover:bg-primary/5"
                  )}
                  onClick={() => handleNavigation(item.id as AdminTab)}
                >
                  {IconComponent && <IconComponent className="h-5 w-5 mr-3" />}
                  <span>{item.label}</span>
                </Button>
              </SheetClose>
            );
          })}
        </nav>
      </div>
      
      {/* Footer with logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-500"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}