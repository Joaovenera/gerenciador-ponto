import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  LogIn,
  User,
  Clock,
  Calendar,
  ChevronRight,
  Activity,
  Menu,
  X,
  Map,
  BellRing,
  Settings,
  Shield,
} from "lucide-react";
import {
  formatDateWithWeekday,
  getCurrentTime,
  getCurrentDate,
  getTypeIcon,
  getTypeColor,
  cn,
} from "@/lib/utils";
import ClockInModal from "@/components/clock-in-modal";
import ClockOutModal from "@/components/clock-out-modal";
import { TimeRecord } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeDashboard() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDate, setCurrentDate] = useState(
    formatDateWithWeekday(new Date()),
  );
  const [isClockInModalOpen, setIsClockInModalOpen] = useState(false);
  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [justificationModal, setJustificationModal] = useState({ open: false, text: "" });
  
  // Animation variants for UI components
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const clockDigitsVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24, delay: 0.3 } }
  };

  // Time interval to update current time
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setCurrentDate(formatDateWithWeekday(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Get user status (in/out)
  const { data: statusData, isLoading: statusLoading } = useQuery<{status: "in" | "out"}>({  
    queryKey: ["/api/time-records/status"],
    refetchInterval: 30000, // Refetch every 30s
  });

  // Get client IP
  const { data: ipData } = useQuery<{ip: string}>({  
    queryKey: ["/api/ip"],
  });

  // Get user's time records
  const { data: timeRecords, isLoading: recordsLoading } = useQuery<TimeRecord[]>({  
    queryKey: ["/api/time-records/me"],
  });


  // Register time record mutation
  const registerRecordMutation = useMutation({
    mutationFn: async (recordData: {
      type: string;
      ipAddress: string;
      latitude: number;
      longitude: number;
      photo: string;
      justification?: string;
    }) => {
      const res = await apiRequest("POST", "/api/time-records", recordData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-records/status"] });
    },
  });

  // Group time records by date
  const groupedRecords: Record<string, TimeRecord[]> = timeRecords ? groupRecordsByDate(timeRecords) : {};

  // Get current user status
  const currentStatus: "in" | "out" = statusData?.status || "out";

  // Get initials for avatar
  const getInitials = (name: string): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
