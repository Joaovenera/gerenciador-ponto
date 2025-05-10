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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface SalaryHistoryProps {
  userId: number;
}

export default function SalaryHistory({ userId }: SalaryHistoryProps) {
  const queryClient = useQueryClient();
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [viewingAuditLogs, setViewingAuditLogs] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false);
  
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
  
  // Fetch audit logs for a salary record
  const { data: auditLogs, isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ['/api/admin/audit-logs', viewingAuditLogs?.id],
    queryFn: async () => {
      if (!viewingAuditLogs) return null;
      
      const res = await fetch(`/api/admin/audit-logs/salary/${viewingAuditLogs.id}`, {
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Erro ao carregar histórico de auditoria");
      }
      
      return res.json();
    },
    enabled: !!viewingAuditLogs,
  });
  
  // Handle edit salary
  const handleEditSalary = async (salary: any) => {
    setEditingSalary(salary);
    setIsEditDialogOpen(true);
  };
  
  // Handle view audit logs
  const handleViewAuditLogs = (salary: any) => {
    setViewingAuditLogs(salary);
    setIsAuditDialogOpen(true);
  };
  
  // Handle save salary edit
  const handleSaveEdit = async (updatedData: any) => {
    try {
      const res = await fetch(`/api/admin/salaries/${editingSalary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData),
      });
      
      if (!res.ok) {
        throw new Error("Erro ao atualizar registro de salário");
      }
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salaries/history', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/salaries/current', userId] });
      
      toast({
        title: "Registro atualizado",
        description: "O registro de salário foi atualizado com sucesso.",
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o registro de salário.",
        variant: "destructive",
      });
    }
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
              <TableHead className="text-right">Ações</TableHead>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditSalary(salary)}
                      title="Editar registro de salário"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleViewAuditLogs(salary)}
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
      
      {/* Diálogo de edição de salário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Registro de Salário</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias no registro. Todas as alterações serão registradas para auditoria.
            </DialogDescription>
          </DialogHeader>
          
          {editingSalary && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor do Salário (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingSalary.amount}
                  onChange={(e) => setEditingSalary({...editingSalary, amount: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Data de Vigência</label>
                <Input
                  type="date"
                  value={format(new Date(editingSalary.effectiveDate), "yyyy-MM-dd")}
                  onChange={(e) => setEditingSalary({...editingSalary, effectiveDate: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações (opcional)</label>
                <Input
                  value={editingSalary.notes || ""}
                  onChange={(e) => setEditingSalary({...editingSalary, notes: e.target.value})}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => handleSaveEdit(editingSalary)}>
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
              Visualize todas as alterações feitas neste registro de salário.
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
              Nenhum registro de alteração encontrado para este salário.
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