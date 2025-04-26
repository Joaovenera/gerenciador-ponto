import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import EmployeeDashboard from "@/pages/employee/dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import ChangePasswordForm from "@/components/change-password-form";
import CameraPage from "./pages/camera-page"; // Added import for CameraPage

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/change-password" component={ChangePasswordForm} />
      <ProtectedRoute path="/" accessLevel="employee" component={EmployeeDashboard} />
      <ProtectedRoute path="/admin" accessLevel="admin" component={AdminDashboard} />
      <ProtectedRoute path="/admin/:tab" accessLevel="admin" component={AdminDashboard} />
      <ProtectedRoute path="/camera" accessLevel="employee" component={CameraPage} />
      <Route component={NotFound} />
    </Switch>
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