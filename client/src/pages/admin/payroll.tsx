import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, FileText, Calculator, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, TimeRecord } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PayrollCalculation {
  employee: User;
  records: TimeRecord[];
  totalHours: number;
  hourlyRate: number;
  totalPayment: number;
}

export default function PayrollTab() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [calculations, setCalculations] = useState<PayrollCalculation[]>([]);

  // Buscar funcionários
  const { data: employeesData, isLoading: loadingEmployees } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Buscar registros de ponto
  const { data: timeRecordsData, isLoading: loadingRecords } = useQuery({
    queryKey: ["/api/admin/time-records"],
    enabled: !!selectedEmployee && !!startDate && !!endDate,
  });

  const employees = Array.isArray(employeesData) ? employeesData : [];
  const timeRecords = Array.isArray(timeRecordsData) ? timeRecordsData : [];

  // Calcular horas trabalhadas
  const calculateWorkedHours = (records: TimeRecord[]): number => {
    let totalHours = 0;
    
    // Agrupar registros por data
    const recordsByDate = records.reduce((acc, record) => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {} as Record<string, TimeRecord[]>);

    // Calcular horas para cada dia
    Object.values(recordsByDate).forEach(dailyRecords => {
      const sortedRecords = dailyRecords.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      let dayHours = 0;
      for (let i = 0; i < sortedRecords.length - 1; i += 2) {
        const clockIn = sortedRecords[i];
        const clockOut = sortedRecords[i + 1];
        
        if (clockIn.type === "in" && clockOut?.type === "out") {
          const start = new Date(clockIn.timestamp);
          const end = new Date(clockOut.timestamp);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          dayHours += hours;
        }
      }
      totalHours += dayHours;
    });

    return Math.round(totalHours * 100) / 100;
  };

  // Calcular pagamento
  const calculatePayroll = () => {
    if (!selectedEmployee || !hourlyRate || !employees.length) return;

    const employee = employees.find((emp: User) => emp.id.toString() === selectedEmployee);
    if (!employee) return;

    const filteredRecords = timeRecords.filter((record: TimeRecord) => {
      const recordDate = new Date(record.timestamp);
      return (!startDate || recordDate >= startDate) && 
             (!endDate || recordDate <= endDate);
    });

    const totalHours = calculateWorkedHours(filteredRecords);
    const rate = parseFloat(hourlyRate);
    const totalPayment = totalHours * rate;

    const calculation: PayrollCalculation = {
      employee,
      records: filteredRecords,
      totalHours,
      hourlyRate: rate,
      totalPayment
    };

    setCalculations([calculation]);
  };

  // Gerar PDF
  const generatePayrollPDF = (calculation: PayrollCalculation) => {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('Relatório de Pagamento', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Funcionário: ${calculation.employee.fullName}`, 20, 40);
    doc.text(`CPF: ${calculation.employee.cpf}`, 20, 50);
    doc.text(`Período: ${startDate ? format(startDate, 'dd/MM/yyyy', { locale: ptBR }) : ''} a ${endDate ? format(endDate, 'dd/MM/yyyy', { locale: ptBR }) : ''}`, 20, 60);
    doc.text(`Valor por Hora: R$ ${calculation.hourlyRate.toFixed(2).replace('.', ',')}`, 20, 70);
    
    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo do Pagamento', 20, 90);
    doc.setFontSize(12);
    doc.text(`Total de Horas Trabalhadas: ${calculation.totalHours.toFixed(2).replace('.', ',')}h`, 20, 105);
    doc.text(`Valor Total: R$ ${calculation.totalPayment.toFixed(2).replace('.', ',')}`, 20, 115);

    // Tabela de registros
    const tableData = calculation.records.map(record => [
      format(new Date(record.timestamp), 'dd/MM/yyyy', { locale: ptBR }),
      format(new Date(record.timestamp), 'HH:mm', { locale: ptBR }),
      record.type === 'in' ? 'Entrada' : 'Saída',
      record.justification || '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'Hora', 'Tipo', 'Justificativa']],
      body: tableData,
      startY: 130,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Salvar PDF
    doc.save(`pagamento_${calculation.employee.fullName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Calcular todos os funcionários
  const calculateAllPayrolls = async () => {
    if (!employees.length || !hourlyRate || !startDate || !endDate) return;

    const allCalculations: PayrollCalculation[] = [];

    for (const employee of employees) {
      try {
        const response = await fetch(`/api/admin/time-records?userId=${employee.id}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        const records = await response.json();
        
        const totalHours = calculateWorkedHours(records);
        const rate = parseFloat(hourlyRate);
        const totalPayment = totalHours * rate;

        allCalculations.push({
          employee,
          records,
          totalHours,
          hourlyRate: rate,
          totalPayment
        });
      } catch (error) {
        console.error(`Erro ao buscar registros para ${employee.fullName}:`, error);
      }
    }

    setCalculations(allCalculations);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Folha de Pagamento</h2>
          <p className="text-gray-500">Calcule e gere PDFs de pagamento baseado nas horas trabalhadas</p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Configuração do Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Funcionário */}
            <div>
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees.map((employee: User) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor por hora */}
            <div>
              <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>

            {/* Data início */}
            <div>
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Data fim */}
            <div>
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={calculatePayroll}
              disabled={!selectedEmployee || selectedEmployee === "all" || !hourlyRate || !startDate || !endDate}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Funcionário
            </Button>
            
            <Button 
              onClick={calculateAllPayrolls}
              disabled={!hourlyRate || !startDate || !endDate}
              variant="outline"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Todos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Cálculos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Valor/Hora</TableHead>
                    <TableHead>Total a Pagar</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculations.map((calc, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{calc.employee.fullName}</TableCell>
                      <TableCell>{calc.employee.cpf}</TableCell>
                      <TableCell>{calc.totalHours.toFixed(2).replace('.', ',')}h</TableCell>
                      <TableCell>R$ {calc.hourlyRate.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        R$ {calc.totalPayment.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => generatePayrollPDF(calc)}
                          className="flex items-center"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading states */}
      {(loadingEmployees || loadingRecords) && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}