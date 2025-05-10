import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Schema for validating the form
const salaryFormSchema = z.object({
  userId: z.number(),
  amount: z.string().min(1, "O valor do salário é obrigatório"),
  effectiveDate: z.date(),
  notes: z.string().optional(),
});

type SalaryFormValues = z.infer<typeof salaryFormSchema>;

interface SalaryFormProps {
  userId: number;
  onSuccess: () => void;
}

export default function SalaryForm({ userId, onSuccess }: SalaryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Get current salary
  const { data: currentSalary, isLoading } = useQuery({
    queryKey: ["/api/admin/salaries/current", userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/admin/salaries/current/${userId}`, {
          credentials: "include",
        });
        
        if (res.status === 404) {
          return null; // No salary record yet
        }
        
        if (!res.ok) {
          throw new Error("Erro ao carregar salário atual");
        }
        
        return res.json();
      } catch (error) {
        // Return null instead of throwing if no salary is found
        return null;
      }
    },
  });

  // Setup form
  const form = useForm<SalaryFormValues>({
    resolver: zodResolver(salaryFormSchema),
    defaultValues: {
      userId,
      amount: "",
      effectiveDate: new Date(),
      notes: "",
    },
  });

  // Update form with current salary data when available
  useEffect(() => {
    if (currentSalary) {
      form.setValue("amount", currentSalary.amount.toString());
      
      if (currentSalary.effectiveDate) {
        const effectiveDate = new Date(currentSalary.effectiveDate);
        form.setValue("effectiveDate", effectiveDate);
        setDate(effectiveDate);
      }
      
      if (currentSalary.notes) {
        form.setValue("notes", currentSalary.notes);
      }
    }
  }, [currentSalary, form]);

  // Create salary mutation
  const createSalaryMutation = useMutation({
    mutationFn: async (data: SalaryFormValues) => {
      // Convert amount to string if it's not already
      const formattedData = {
        ...data,
        amount: data.amount.toString(), 
      };
      
      const res = await apiRequest("POST", "/api/admin/salaries", formattedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salaries/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salaries/history"] });
      toast({
        title: "Salário registrado",
        description: "O salário foi registrado com sucesso",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar salário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SalaryFormValues) => {
    // Format amount properly as string (replace comma with period)
    const formattedAmount = data.amount.replace(',', '.');
    createSalaryMutation.mutate({
      ...data,
      amount: formattedAmount,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor do Salário (R$)</FormLabel>
              <FormControl>
                <Input
                  placeholder="0,00"
                  {...field}
                  type="text"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="effectiveDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Vigência</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "dd/MM/yyyy")
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      field.onChange(date);
                      setDate(date);
                    }}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o salário"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={createSalaryMutation.isPending}
          >
            {createSalaryMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}