import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

type AccessLevel = "employee" | "admin";

interface ProtectedRouteProps {
  path: string;
  component: () => React.JSX.Element;
  accessLevel?: AccessLevel;
}

export function ProtectedRoute({
  path,
  component: Component,
  accessLevel,
}: ProtectedRouteProps) {
  const { user, isLoading, isFirstLogin } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (isFirstLogin) {
    return (
      <Route path={path}>
        <Redirect to="/change-password" />
      </Route>
    );
  }

  if (accessLevel === "admin" && user.accessLevel !== "admin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
