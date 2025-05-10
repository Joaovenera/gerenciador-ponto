import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Download, Edit, Eye, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface FinancialTransactionsHistoryProps {
  userId?: number;
  showFilters?: boolean;
}

export default function FinancialTransactionsHistory({
  userId,
  showFilters = false
}: FinancialTransactionsHistoryProps) {
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [viewingAuditLogs, setViewingAuditLogs] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);

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
  
  // Fetch audit logs for a transaction
  const { data: auditLogs, isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ['/api/admin/audit-logs', viewingAuditLogs?.id],
    queryFn: async () => {
      if (!viewingAuditLogs) return null;
      
      const res = await fetch(`/api/admin/audit-logs/financial_transaction/${viewingAuditLogs.id}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de auditoria");
      }
      
      return res.json();
    },
    enabled: !!viewingAuditLogs,
  });
  
  // Handle edit transaction
  const handleEditTransaction = async (transaction: any) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };
  
  // Handle view audit logs
  const handleViewAuditLogs = (transaction: any) => {
    setViewingAuditLogs(transaction);
    setIsAuditDialogOpen(true);
  };
  
  // Handle save transaction edit
  const handleSaveEdit = async (updatedData: any) => {
    try {
      const res = await fetch(`/api/admin/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      
      if (!res.ok) {
        throw new Error("Erro ao atualizar transação");
      }
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      
      toast({
        title: "Transação atualizada",
        description: "A transação foi atualizada com sucesso.",
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar a transação.",
        variant: "destructive",
      });
    }
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
              <TableHead className="text-right">Ações</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditTransaction(transaction)}
                      title="Editar transação"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleViewAuditLogs(transaction)}
                      title="Ver histórico de alterações"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Diálogo de edição de transação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Transação Financeira</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na transação. Todas as alterações serão registradas para auditoria.
            </DialogDescription>
          </DialogHeader>
          
          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                    defaultValue={editingTransaction.type}
                    onValueChange={(value) => setEditingTransaction({...editingTransaction, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {transactionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={(e) => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data da Transação</label>
                  <Input
                    type="date"
                    value={format(new Date(editingTransaction.transactionDate), "yyyy-MM-dd")}
                    onChange={(e) => setEditingTransaction({...editingTransaction, transactionDate: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Referência (opcional)</label>
                  <Input
                    value={editingTransaction.reference || ""}
                    onChange={(e) => setEditingTransaction({...editingTransaction, reference: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Input
                  value={editingTransaction.notes || ""}
                  onChange={(e) => setEditingTransaction({...editingTransaction, notes: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleSaveEdit(editingTransaction)}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de histórico de auditoria */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
            <DialogDescription>
              Visualize todas as alterações feitas nesta transação financeira.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingAuditLogs ? (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <p className="text-muted-foreground py-4">
              Nenhum registro de alteração encontrado para esta transação.
            </p>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Alterações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        {log.action === 'create' ? 'Criação' : 
                         log.action === 'update' ? 'Atualização' : 
                         log.action === 'delete' ? 'Exclusão' : log.action}
                      </TableCell>
                      <TableCell>ID: {log.userId}</TableCell>
                      <TableCell>
                        {log.action === 'update' && log.oldValues && log.newValues && (
                          <div className="text-xs">
                            {Object.keys(log.newValues).map(key => {
                              if (log.oldValues[key] !== log.newValues[key] && 
                                  key !== 'id' && 
                                  key !== 'createdAt' && 
                                  key !== 'updatedAt' && 
                                  key !== 'createdBy' && 
                                  key !== 'updatedBy') {
                                return (
                                  <div key={key} className="py-1">
                                    <strong>{key}:</strong>{' '}
                                    {String(log.oldValues[key] || '-')} → {String(log.newValues[key] || '-')}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                        {log.action === 'create' && (
                          <span className="text-xs">Registro criado</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}