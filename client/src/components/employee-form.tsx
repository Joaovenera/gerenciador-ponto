import { useState } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LoaderCircle } from "lucide-react";

// Define a schema for employee form validation
const employeeFormSchema = z.object({
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos"),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  role: z.string().min(1, "Cargo/Função é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional().or(z.literal('')),
  accessLevel: z.string().min(1, "Nível de acesso é obrigatório"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  username: z.string().min(1, "Nome de usuário é obrigatório"),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  employee: User | null;
  onSuccess: () => void;
}

export default function EmployeeForm({
  employee,
  onSuccess,
}: EmployeeFormProps) {
  const { toast } = useToast();
  const [isResetPassword, setIsResetPassword] = useState(false);

  // Set up form with default values
  const form = useForm<EmployeeFormValues, any, EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: employee
      ? {
          fullName: employee.fullName,
          cpf: employee.cpf,
          admissionDate: employee.admissionDate,
          role: employee.role,
          department: employee.department,
          status: employee.status,
          email: employee.email,
          phone: employee.phone || "",
          accessLevel: employee.accessLevel,
          birthDate: employee.birthDate,
          username: employee.username,
        }
      : {
          fullName: "",
          cpf: "",
          admissionDate: new Date().toISOString().split("T")[0],
          role: "",
          department: "",
          status: "active",
          email: "",
          phone: "",
          accessLevel: "employee",
          birthDate: "",
          username: "",
        },
  });

  // Placeholder for password hashing - REPLACE WITH A SECURE LIBRARY IN PRODUCTION
  const hashPassword = async (password: string) => {
    //In a real application, replace this with a secure hashing algorithm like bcrypt or Argon2.
    return password;
  };

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: EmployeeFormValues & { password: string }) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Funcionário criado",
        description: "O funcionário foi criado com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async (
      data: EmployeeFormValues & { id: number; resetPassword?: boolean },
    ) => {
      const { id, resetPassword, ...userData } = data;
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, {
        ...userData,
        resetPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Funcionário atualizado",
        description: "O funcionário foi atualizado com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar funcionário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit: SubmitHandler<EmployeeFormValues> = async (data) => {
    if (employee) {
      updateEmployeeMutation.mutate({
        ...data,
        id: employee.id,
        resetPassword: isResetPassword,
      });
    } else {
      // A senha inicial será a data de nascimento sem hífens
      // Converte YYYY-MM-DD para DDMMYYYY
      const [year, month, day] = data.birthDate.split("-");
      // Create a new object with a definite password field
      createEmployeeMutation.mutate({
        ...data,
        password: `${day}${month}${year}`,
      } as EmployeeFormValues & { password: string });
    }
  };

  const isSubmitting =
    createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="CPF" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Nascimento</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="admissionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Admissão</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo/Função</FormLabel>
                <FormControl>
                  <Input placeholder="Cargo ou função" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Departamento</FormLabel>
                <FormControl>
                  <Input placeholder="Departamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    {...field} 
                    value={field.value || ""} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome de Usuário</FormLabel>
                <FormControl>
                  <Input placeholder="Nome de usuário" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accessLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nível de Acesso</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o nível de acesso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="employee">Funcionário</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {employee && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="reset-password"
              checked={isResetPassword}
              onChange={(e) => setIsResetPassword(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="reset-password" className="text-sm text-gray-700">
              Resetar senha para a data de nascimento
            </label>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            )}
            {employee ? "Salvar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
