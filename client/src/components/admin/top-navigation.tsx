import { useState } from "react";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { 
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  User as UserIcon, 
  LogOut,
  Settings,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { navigationItems, AdminTab } from "@/pages/admin/dashboard";

// Simplified mobile sidebar menu
import MobileSidebar from "./mobile-sidebar";

interface TopNavigationProps {
  user: User;
}

export default function TopNavigation({ user }: TopNavigationProps) {
  const { logoutMutation } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Apply theme to document
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  
  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 shadow-sm">
      <div className="flex h-full items-center justify-between">
        {/* Left side - Logo & Mobile Menu */}
        <div className="flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <MobileSidebar user={user} />
            </SheetContent>
          </Sheet>
          
          <Link href="/admin">
            <div className="flex items-center gap-2 ml-2 cursor-pointer">
              <div className="bg-primary/10 p-1 rounded text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg hidden sm:inline-block">Ponto Eletrônico</span>
            </div>
          </Link>
        </div>
        
        {/* Right Side - Actions */}
        <div className="flex items-center gap-3">
          {/* Search - Hidden on smallest screens */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-48 md:w-64 pl-8 h-9 rounded-full bg-gray-100 dark:bg-gray-800 focus-visible:ring-primary"
            />
          </div>
          
          {/* Theme toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
          
          {/* Help */}
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button>
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
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
    </header>
  );
}