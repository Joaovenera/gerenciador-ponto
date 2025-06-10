import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import SalaryForm from "@/components/salary-form";
import SalaryHistory from "@/components/salary-history";
import FinancialTransactionForm from "@/components/financial-transaction-form";
import FinancialTransactionsHistory from "@/components/financial-transactions-history";

export default function FinancialTab() {
  const [selectedTab, setSelectedTab] = useState("transactions");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | undefined>(undefined);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar funcionários");
      }
      
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Gestão Financeira</h2>
        
        <div className="flex flex-col md:flex-row gap-3">
          <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!selectedEmployeeId}>
                <Plus className="h-4 w-4 mr-2" />
                Registrar Salário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Salário</DialogTitle>
                <DialogDescription>
                  Informe os dados do salário para o funcionário selecionado.
                </DialogDescription>
              </DialogHeader>
              {selectedEmployeeId && (
                <SalaryForm 
                  userId={selectedEmployeeId}
                  onSuccess={() => setSalaryDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedEmployeeId}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nova Transação Financeira</DialogTitle>
                <DialogDescription>
                  Registre uma nova transação financeira para o funcionário selecionado.
                </DialogDescription>
              </DialogHeader>
              {selectedEmployeeId && (
                <FinancialTransactionForm 
                  userId={selectedEmployeeId}
                  onSuccess={() => setTransactionDialogOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Selecione um Funcionário</label>
          {employeesLoading ? (
            <Skeleton className="h-10 w-full max-w-xs" />
          ) : (
            <Select
              value={selectedEmployeeId?.toString()}
              onValueChange={(value) => setSelectedEmployeeId(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees && employees.map((employee: any) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.fullName} - {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedEmployeeId ? (
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="salary">Histórico de Salários</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions" className="space-y-4 pt-4">
              <FinancialTransactionsHistory userId={selectedEmployeeId} />
            </TabsContent>
            <TabsContent value="salary" className="space-y-4 pt-4">
              <SalaryHistory userId={selectedEmployeeId} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-6 text-center border rounded-md bg-muted/30">
            <p className="text-muted-foreground">
              Selecione um funcionário para visualizar e gerenciar dados financeiros.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}