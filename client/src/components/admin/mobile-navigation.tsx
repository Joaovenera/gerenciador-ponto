import { useState } from "react";
import { Link } from "wouter";
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
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

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

interface MobileNavigationProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  user: User;
}

export default function MobileNavigation({
  activeTab,
  onTabChange,
  user
}: MobileNavigationProps) {
  const { logoutMutation } = useAuth();

  // Show main items in the bottom bar, rest in dropdown
  const mainNavItems = navigationItems.slice(0, 4); // First 4 items
  const moreNavItems = navigationItems.slice(4); // Remaining items

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-1 shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {mainNavItems.map((item) => {
          const IconComponent = iconMap[item.icon];
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 rounded-md",
                activeTab === item.id ? 
                  "bg-primary/10 text-primary border-t-2 border-primary" : 
                  "text-gray-500 dark:text-gray-400"
              )}
              onClick={() => onTabChange(item.id as AdminTab)}
            >
              {IconComponent && (
                <IconComponent className="h-5 w-5 mb-1" />
              )}
              <span className="text-xs truncate max-w-full">
                {item.label.split(' ')[0]}
              </span>
            </Button>
          );
        })}

        {/* More dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center justify-center h-16 rounded-md text-gray-500 dark:text-gray-400"
            >
              <MoreHorizontal className="h-5 w-5 mb-1" />
              <span className="text-xs">Mais</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {moreNavItems.map((item) => {
              const IconComponent = iconMap[item.icon];
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onTabChange(item.id as AdminTab)}
                  className={cn(
                    "cursor-pointer",
                    activeTab === item.id ? "bg-primary/10 text-primary" : ""
                  )}
                >
                  {IconComponent && (
                    <IconComponent className="h-4 w-4 mr-2" />
                  )}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}