import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface SalaryHistoryProps {
  userId: number;
}

export default function SalaryHistory({ userId }: SalaryHistoryProps) {
  // Get salary history
  const { data: salaryHistory, isLoading } = useQuery({
    queryKey: ["/api/admin/salaries/history", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/salaries/history/${userId}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de salários");
      }
      
      return res.json();
    },
  });

  // Format currency (BRL)
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico de Salários</h3>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!salaryHistory || salaryHistory.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico de Salários</h3>
        <p className="text-muted-foreground">Nenhum registro de salário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Histórico de Salários</h3>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data de Vigência</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead>Data de Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaryHistory.map((salary: any) => (
              <TableRow key={salary.id}>
                <TableCell>
                  {format(new Date(salary.effectiveDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{formatCurrency(salary.amount)}</TableCell>
                <TableCell>{salary.notes || "-"}</TableCell>
                <TableCell>
                  {format(new Date(salary.createdAt), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}