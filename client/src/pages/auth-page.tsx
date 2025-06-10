import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { Clock, Loader2, EyeIcon, EyeOffIcon, User, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);

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
  
  // Animation variants for framer motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  // If we're still checking authentication, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Carregando...</h2>
        </motion.div>
      </div>
    );
  }
  
  // If user is already logged in, don't render the login page
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <Card className="w-full border-none shadow-lg overflow-hidden bg-white/90 backdrop-blur-sm">
          <motion.div variants={itemVariants}>
            <CardHeader className="text-center pb-2">
              <motion.div 
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Clock className="h-8 w-8 text-white" />
              </motion.div>
              <CardTitle className="text-3xl font-bold text-primary mt-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                Ponto Eletrônico
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Acesse sua conta para registrar seu ponto
              </CardDescription>
            </CardHeader>
          </motion.div>
          
          <motion.div variants={itemVariants} className="w-full">
            <CardContent className="pt-4 px-8">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">CPF ou Usuário</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                placeholder="Digite seu CPF ou nome de usuário" 
                                className="pl-10 py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 font-medium">Senha</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Digite sua senha" 
                                className="pl-10 py-6 bg-gray-50 border-gray-200 focus:bg-white transition-colors" 
                                {...field} 
                              />
                              <button
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full py-6 text-base font-medium bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary transition-all duration-300 shadow-md hover:shadow-lg" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          <span>Autenticando...</span>
                        </div>
                      ) : "Entrar"}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
            
            <motion.div variants={itemVariants}>
              <CardFooter className="text-center text-sm text-muted-foreground pb-6 pt-2 px-8">
                <p className="w-full">
                  <motion.span 
                    whileHover={{ color: "#2563eb" }}
                    className="font-medium cursor-pointer"
                  >
                    Esqueceu a senha?
                  </motion.span> 
                  <span className="opacity-80"> Entre em contato com o administrador do sistema.</span>
                </p>
              </CardFooter>
            </motion.div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
