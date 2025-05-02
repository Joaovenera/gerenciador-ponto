import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { User, TimeRecord, insertTimeRecordSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Extend the time record schema to include validation for manual entry
const manualTimeRecordSchema = insertTimeRecordSchema.extend({
  timestamp: z.string().min(1, "A data e hora são obrigatórias"),
  justification: z.string().min(1, "A justificativa é obrigatória"),
});

type ManualTimeRecordFormValues = z.infer<typeof manualTimeRecordSchema>;

interface TimeRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  record?: TimeRecord;
  isEditing?: boolean;
}

export default function TimeRecordForm({
  isOpen,
  onClose,
  record,
  isEditing = false,
}: TimeRecordFormProps) {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );

  // Get all users for dropdown
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isOpen,
  });

  // Initialize form with default values or existing record data
  const form = useForm<ManualTimeRecordFormValues>({
    resolver: zodResolver(manualTimeRecordSchema),
    defaultValues: {
      userId: record?.userId ? record.userId : undefined,
      type: record?.type ? record.type : "in",
      timestamp: record?.timestamp
        ? format(new Date(record.timestamp), "yyyy-MM-dd'T'HH:mm")
        : currentDate,
      ipAddress: record?.ipAddress ? record.ipAddress : "Manual",
      latitude: record?.latitude ? record.latitude : "0.0000000",
      longitude: record?.longitude ? record.longitude : "0.0000000",
      photo: record?.photo
        ? record.photo
        : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmUyZTIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlJlZ2lzdHJvIG1hbnVhbDwvdGV4dD48L3N2Zz4=",
      justification: record?.justification ? record.justification : "",
    },
  });

  // Create mutation for new record
  const createMutation = useMutation({
    mutationFn: async (data: ManualTimeRecordFormValues) => {
      return apiRequest("POST", "/api/admin/time-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-records"] });
      toast({
        title: "Registro criado",
        description: "O registro de ponto foi criado com sucesso",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update mutation for editing
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updateData } = data;
      return apiRequest("PUT", `/api/admin/time-records/${id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/time-records"] });
      toast({
        title: "Registro atualizado",
        description: "O registro de ponto foi atualizado com sucesso",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: ManualTimeRecordFormValues) => {
    // Format the timestamp
    const timestampDate = new Date(data.timestamp);
    
    if (isEditing && record) {
      updateMutation.mutate({
        ...data,
        id: record.id,
        timestamp: timestampDate,
      });
    } else {
      createMutation.mutate({
        ...data,
        timestamp: timestampDate,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Registro de Ponto" : "Adicionar Registro de Ponto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações do registro de ponto"
              : "Preencha os dados para adicionar um novo registro de ponto manualmente"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informe o motivo da inserção/edição manual"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar"
                  : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}