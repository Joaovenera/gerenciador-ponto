import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface FinancialTransactionsHistoryProps {
  userId?: number;
  showFilters?: boolean;
}

export default function FinancialTransactionsHistory({
  userId,
  showFilters = false
}: FinancialTransactionsHistoryProps) {
  const [transactionType, setTransactionType] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (userId) {
      params.append('userId', userId.toString());
    }
    
    if (transactionType) {
      params.append('type', transactionType);
    }
    
    if (startDate) {
      params.append('startDate', startDate);
    }
    
    if (endDate) {
      params.append('endDate', endDate);
    }
    
    return params.toString();
  };

  // Get financial transactions
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/admin/transactions", { userId, type: transactionType, startDate, endDate }],
    queryFn: async () => {
      const queryParams = buildQueryParams();
      const url = `/api/admin/transactions${queryParams ? `?${queryParams}` : ''}`;
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar transações financeiras");
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

  // Transaction type mappings for display
  const transactionTypes = [
    { value: "salary", label: "Salário" },
    { value: "advance", label: "Adiantamento" },
    { value: "bonus", label: "Bônus" },
    { value: "vacation", label: "Férias" },
    { value: "thirteenth", label: "Décimo Terceiro" },
    { value: "adjustment", label: "Ajuste" },
    { value: "deduction", label: "Dedução" },
  ];

  // Get transaction type label
  const getTransactionTypeLabel = (type: string) => {
    const found = transactionTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    const queryParams = buildQueryParams();
    window.open(`/api/admin/export-transactions?${queryParams}`, '_blank');
  };

  // Filters section
  const FiltersSection = () => {
    if (!showFilters) return null;
    
    return (
      <div className="mb-6 p-4 border rounded-md bg-muted/30 space-y-4">
        <h4 className="text-sm font-semibold">Filtros</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Transação</label>
            <Select
              value={transactionType}
              onValueChange={setTransactionType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico de Transações Financeiras</h3>
        {FiltersSection()}
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Histórico de Transações Financeiras</h3>
        {FiltersSection()}
        <p className="text-muted-foreground p-4 bg-muted/30 rounded-md">
          Nenhuma transação financeira encontrada para os filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Histórico de Transações Financeiras</h3>
        {!showFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>
      
      {FiltersSection()}
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction: any) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.transactionDate), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{getTransactionTypeLabel(transaction.type)}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>{transaction.reference || "-"}</TableCell>
                <TableCell>{transaction.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}