import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { lazy, Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton";

// Componentes lazy adaptados para tipo de componente correto
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const EmployeeDashboard = lazy(() => import("@/pages/employee/dashboard"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const ChangePasswordForm = lazy(() => import("@/components/change-password-form"));
const CameraPage = lazy(() => import("./pages/camera-page"));
const WorkSchedulesPage = lazy(() => import("@/pages/admin/work-schedules"));
const TimeBankPage = lazy(() => import("@/pages/admin/time-bank"));

// Componente de fallback enquanto os módulos são carregados
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/change-password" component={ChangePasswordForm} />
        <ProtectedRoute path="/" accessLevel="employee" component={EmployeeDashboard} />
        <ProtectedRoute path="/admin" accessLevel="admin" component={AdminDashboard} />
        <ProtectedRoute path="/admin/:tab" accessLevel="admin" component={AdminDashboard} />
        <ProtectedRoute path="/admin/work-schedules" accessLevel="admin" component={WorkSchedulesPage} />
        <ProtectedRoute path="/admin/time-bank" accessLevel="admin" component={TimeBankPage} />
        <ProtectedRoute path="/camera" accessLevel="employee" component={CameraPage} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;