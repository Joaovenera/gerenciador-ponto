import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { Clock, Loader2 } from "lucide-react";

const loginFormSchema = z.object({
  username: z.string().min(1, { message: "CPF/Usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

const registerFormSchema = z.object({
  fullName: z.string().min(1, { message: "Nome completo é obrigatório" }),
  cpf: z.string().min(11, { message: "CPF inválido" }),
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  birthDate: z.string().min(1, { message: "Data de nascimento é obrigatória" }),
  role: z.string().min(1, { message: "Cargo/Função é obrigatório" }),
  department: z.string().min(1, { message: "Departamento é obrigatório" }),
  username: z.string().min(1, { message: "Nome de usuário é obrigatório" }),
  admissionDate: z.string().min(1, { message: "Data de admissão é obrigatória" }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;
type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      cpf: "",
      email: "",
      password: "",
      birthDate: "",
      role: "",
      department: "",
      username: "",
      admissionDate: new Date().toISOString().split("T")[0],
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const userData = {
      ...data,
      accessLevel: "employee",
      status: "active",
      profilePicture: "",
      phone: "",
    };
    registerMutation.mutate(userData);
  };

  const { isLoading } = useAuth();
  
  // If we're still checking authentication, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-lg font-medium text-gray-700">Carregando...</h2>
      </div>
    );
  }
  
  // If user is already logged in, don't render the login page
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary mt-4">Ponto Eletrônico</CardTitle>
          <CardDescription>Acesse sua conta para registrar seu ponto</CardDescription>
        </CardHeader>
        <div className="w-full">
            <CardContent className="pt-6">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF ou Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu CPF ou nome de usuário" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Digite sua senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Autenticando...</span>
                      </div>
                    ) : "Entrar"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="text-center text-xs text-muted-foreground">
              <p className="w-full">Esqueceu a senha? Entre em contato com o administrador do sistema.</p>
            </CardFooter>
          </div>
      </Card>
    </div>
  );
}
