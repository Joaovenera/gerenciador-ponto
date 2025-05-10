import { 
  User, 
  InsertUser, 
  TimeRecord, 
  InsertTimeRecord, 
  TimeRecordFilter,
  users,
  timeRecords,
  salaries,
  financialTransactions,
  auditLogs,
  Salary,
  InsertSalary,
  FinancialTransaction,
  InsertFinancialTransaction,
  FinancialTransactionFilter,
  AuditLog,
  InsertAuditLog,
  // Novos imports para jornada de trabalho
  WorkSchedule,
  InsertWorkSchedule,
  WorkScheduleFilter,
  WorkScheduleDetail,
  InsertWorkScheduleDetail,
  EmployeeSchedule,
  InsertEmployeeSchedule,
  EmployeeScheduleFilter,
  TimeBank,
  InsertTimeBank,
  TimeBankFilter,
  AbsenceRequest,
  InsertAbsenceRequest,
  AbsenceRequestFilter,
  workSchedules,
  workScheduleDetails,
  employeeSchedules,
  timeBank,
  absenceRequests,
  weekdayEnum
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, pool } from "./db";
import { eq, and, gte, lt, lte, desc, SQL, isNull, or, asc, not, max, sum, sql } from "drizzle-orm";
import session from "express-session";
import { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { format, parseISO, differenceInMinutes, isAfter, isBefore, addDays, isSameDay, getDay, startOfDay, endOfDay, subMinutes, subDays } from "date-fns";

// Create PostgreSQL session store
const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByCPF(cpf: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.cpf, cpf));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("User not found");
    }

    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return result.length > 0;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return result.length > 0;
  }

  async updateFirstLoginFlag(id: number, value: boolean): Promise<boolean> {
    const result = await db.update(users)
      .set({ firstLogin: value })
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return result.length > 0;
  }

  async checkAdminExists(): Promise<boolean> {
    const result = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.accessLevel, "admin"))
      .limit(1);

    return result.length > 0;
  }

  // Time record methods
  async createTimeRecord(recordData: InsertTimeRecord): Promise<TimeRecord> {
    const result = await db.insert(timeRecords)
      .values({
        ...recordData,
        timestamp: new Date()
      })
      .returning();

    return result[0];
  }

  async getTimeRecords(filter: Partial<TimeRecordFilter>): Promise<TimeRecord[]> {
    let query = db.select().from(timeRecords);

    // Apply filters
    const conditions = [];

    if (filter.userId !== undefined) {
      conditions.push(eq(timeRecords.userId, filter.userId));
    }

    if (filter.type !== undefined) {
      conditions.push(eq(timeRecords.type, filter.type));
    }

    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      conditions.push(gte(timeRecords.timestamp, startDate));
    }

    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      // Add one day to include the end date
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(timeRecords.timestamp, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Sort by timestamp (newest first)
    query = query.orderBy(desc(timeRecords.timestamp)) as typeof query;

    return await query;
  }

  async getUserStatus(userId: number): Promise<"in" | "out"> {
    const records = await db.select()
      .from(timeRecords)
      .where(eq(timeRecords.userId, userId))
      .orderBy(desc(timeRecords.timestamp))
      .limit(1);

    if (records.length === 0) {
      return "out";
    }

    return records[0].type === "in" ? "in" : "out";
  }

  async updateTimeRecord(id: number, recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    // Ensure timestamp is a Date object if present
    let dataToUpdate = {...recordData};
    
    if (dataToUpdate.timestamp && typeof dataToUpdate.timestamp === 'string') {
      dataToUpdate.timestamp = new Date(dataToUpdate.timestamp);
    }
    
    const result = await db.update(timeRecords)
      .set(dataToUpdate)
      .where(eq(timeRecords.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Time record not found");
    }

    return result[0];
  }

  async deleteTimeRecord(id: number): Promise<boolean> {
    const result = await db.delete(timeRecords)
      .where(eq(timeRecords.id, id))
      .returning({ id: timeRecords.id });

    return result.length > 0;
  }

  async exportTimeRecordsCSV(filter: Partial<TimeRecordFilter>): Promise<string> {
    const records = await this.getTimeRecords(filter);

    // CSV Header
    let csv = "ID,Usuário,Data,Hora,Tipo,Endereço IP,Latitude,Longitude,Manual,Justificativa,Criado Por\n";

    // Get all user names for reference
    const allUsers = await this.getAllUsers();
    const userMap = new Map<number, string>();
    allUsers.forEach(user => {
      userMap.set(user.id, user.fullName);
    });

    // Add each record as a row
    for (const record of records) {
      const recordDate = new Date(record.timestamp);
      const date = format(recordDate, "dd/MM/yyyy");
      const time = format(recordDate, "HH:mm:ss");
      const type = record.type === "in" ? "Entrada" : "Saída";
      const createdByName = userMap.get(record.createdBy) || `ID: ${record.createdBy}`;
      const userName = userMap.get(record.userId) || `ID: ${record.userId}`;

      csv += `${record.id},${userName},${date},${time},${type},${record.ipAddress},${record.latitude},${record.longitude},${record.isManual ? "Sim" : "Não"},${record.justification || ""},${createdByName}\n`;
    }

    return csv;
  }

  // Salary methods
  async createSalary(salaryData: InsertSalary): Promise<Salary> {
    // Preparar os dados para inserção
    const { id, createdAt, ...dataToInsert } = salaryData as any;
    
    // Data já foi convertida na rota
    const result = await db.insert(salaries)
      .values(dataToInsert)
      .returning();

    // Registrar a criação no log de auditoria
    await this.createAuditLog({
      entityType: 'salaries',
      entityId: result[0].id,
      action: 'create',
      userId: result[0].createdBy,
      newValues: result[0],
      ipAddress: null
    });

    return result[0];
  }

  async getCurrentSalary(userId: number): Promise<Salary | undefined> {
    // Get the most recent salary for the user
    const result = await db.select()
      .from(salaries)
      .where(eq(salaries.userId, userId))
      .orderBy(desc(salaries.effectiveDate))
      .limit(1);

    return result[0];
  }

  async getSalaryHistory(userId: number): Promise<Salary[]> {
    // Get all salary entries for a specific user, ordered by effective date (newest first)
    return await db.select()
      .from(salaries)
      .where(eq(salaries.userId, userId))
      .orderBy(desc(salaries.effectiveDate));
  }

  async updateSalary(
    id: number, 
    salaryData: Partial<Salary>, 
    updatingUserId: number,
    ipAddress?: string
  ): Promise<Salary> {
    // Primeiro obter o registro existente para auditoria
    const [existingSalary] = await db.select()
      .from(salaries)
      .where(eq(salaries.id, id));
      
    if (!existingSalary) {
      throw new Error("Salary record not found");
    }
    
    // Filtrar e preparar dados para atualização
    const { id: _, createdAt: __, updatedAt: ___, updatedBy: ____, ...filteredData } = salaryData as any;
    
    // Criar objeto com dados filtrados e informações de atualização
    const dataToUpdate: any = {
      ...filteredData
    };
    
    // Processar datas
    if (dataToUpdate.effectiveDate && typeof dataToUpdate.effectiveDate === 'string') {
      dataToUpdate.effectiveDate = new Date(dataToUpdate.effectiveDate);
    }
    
    // Adicionar campos de auditoria
    dataToUpdate.updated_at = new Date();
    dataToUpdate.updated_by = updatingUserId;
    
    const result = await db.update(salaries)
      .set(dataToUpdate)
      .where(eq(salaries.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Salary record update failed");
    }
    
    // Registrar a ação de auditoria
    await this.createAuditLog({
      entityType: 'salaries',
      entityId: id,
      action: 'update',
      userId: updatingUserId,
      oldValues: existingSalary,
      newValues: result[0],
      ipAddress
    });

    return result[0];
  }

  async deleteSalary(id: number): Promise<boolean> {
    const result = await db.delete(salaries)
      .where(eq(salaries.id, id))
      .returning({ id: salaries.id });

    return result.length > 0;
  }

  // Financial transaction methods
  async createFinancialTransaction(transactionData: InsertFinancialTransaction): Promise<FinancialTransaction> {
    // Preparar os dados para inserção
    const { id, createdAt, ...dataToInsert } = transactionData as any;
    
    // Data já foi convertida na rota
    const result = await db.insert(financialTransactions)
      .values(dataToInsert)
      .returning();

    // Registrar a criação no log de auditoria
    await this.createAuditLog({
      entityType: 'financial_transactions',
      entityId: result[0].id,
      action: 'create',
      userId: result[0].createdBy,
      newValues: result[0],
      ipAddress: null
    });

    return result[0];
  }

  async getFinancialTransactions(filter: Partial<FinancialTransactionFilter>): Promise<FinancialTransaction[]> {
    let query = db.select().from(financialTransactions);

    // Apply filters
    const conditions = [];

    if (filter.userId !== undefined) {
      conditions.push(eq(financialTransactions.userId, filter.userId));
    }

    if (filter.type !== undefined) {
      conditions.push(eq(financialTransactions.type, filter.type));
    }

    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      conditions.push(gte(financialTransactions.transactionDate, startDate));
    }

    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      // Add one day to include the end date
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lt(financialTransactions.transactionDate, endDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Sort by transaction date (newest first)
    query = query.orderBy(desc(financialTransactions.transactionDate)) as typeof query;

    return await query;
  }

  async updateFinancialTransaction(
    id: number, 
    transactionData: Partial<FinancialTransaction>, 
    updatingUserId: number,
    ipAddress?: string
  ): Promise<FinancialTransaction> {
    // Primeiro obter a transação existente para registro de auditoria
    const [existingTransaction] = await db.select()
      .from(financialTransactions)
      .where(eq(financialTransactions.id, id));
      
    if (!existingTransaction) {
      throw new Error("Financial transaction not found");
    }
    
    // Filtrar e preparar dados para atualização
    const { id: _, createdAt: __, updatedAt: ___, updatedBy: ____, ...filteredData } = transactionData as any;
    
    // Criar objeto com dados filtrados e informações de atualização
    const dataToUpdate: any = {
      ...filteredData
    };
    
    // Processar datas
    if (dataToUpdate.transactionDate && typeof dataToUpdate.transactionDate === 'string') {
      dataToUpdate.transactionDate = new Date(dataToUpdate.transactionDate);
    }
    
    // Adicionar campos de auditoria
    dataToUpdate.updated_at = new Date();
    dataToUpdate.updated_by = updatingUserId;
    
    // Atualizar a transação
    const result = await db.update(financialTransactions)
      .set(dataToUpdate)
      .where(eq(financialTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Financial transaction update failed");
    }
    
    // Registrar a ação de auditoria
    await this.createAuditLog({
      entityType: 'financial_transactions',
      entityId: id,
      action: 'update',
      userId: updatingUserId,
      oldValues: existingTransaction,
      newValues: result[0],
      ipAddress
    });

    return result[0];
  }

  async deleteFinancialTransaction(id: number): Promise<boolean> {
    const result = await db.delete(financialTransactions)
      .where(eq(financialTransactions.id, id))
      .returning({ id: financialTransactions.id });

    return result.length > 0;
  }

  async exportFinancialTransactionsCSV(filter: Partial<FinancialTransactionFilter>): Promise<string> {
    const transactions = await this.getFinancialTransactions(filter);

    // CSV Header
    let csv = "ID,Usuário,Tipo,Valor,Descrição,Data da Transação,Referência,Notas,Criado Por\n";

    // Get all user names for reference
    const allUsers = await this.getAllUsers();
    const userMap = new Map<number, string>();
    allUsers.forEach(user => {
      userMap.set(user.id, user.fullName);
    });

    // Function to translate transaction types to Portuguese
    const translateType = (type: string): string => {
      const translations: Record<string, string> = {
        'salary': 'Salário',
        'advance': 'Adiantamento',
        'bonus': 'Bônus',
        'vacation': 'Férias',
        'thirteenth': 'Décimo Terceiro',
        'adjustment': 'Ajuste',
        'deduction': 'Dedução'
      };
      return translations[type] || type;
    };

    // Add each transaction as a row
    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.transactionDate);
      const date = format(transactionDate, "dd/MM/yyyy");
      const type = translateType(transaction.type);
      const createdByName = userMap.get(transaction.createdBy) || `ID: ${transaction.createdBy}`;
      const userName = userMap.get(transaction.userId) || `ID: ${transaction.userId}`;

      csv += `${transaction.id},${userName},${type},${transaction.amount},${transaction.description},${date},${transaction.reference || ""},${transaction.notes || ""},${createdByName}\n`;
    }

    return csv;
  }

  // Audit log methods
  async createAuditLog(auditData: InsertAuditLog): Promise<AuditLog> {
    const result = await db.insert(auditLogs)
      .values(auditData)
      .returning();
      
    return result[0];
  }
  
  async getAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
    const result = await db.select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        )
      )
      .orderBy(desc(auditLogs.timestamp));
      
    return result;
  }

  //
  // WORK SCHEDULE METHODS
  //
  
  // Cria uma nova jornada de trabalho
  async createWorkSchedule(scheduleData: InsertWorkSchedule): Promise<WorkSchedule> {
    const result = await db.insert(workSchedules)
      .values(scheduleData)
      .returning();
      
    return result[0];
  }
  
  // Obtém todas as jornadas de trabalho com opção de filtro
  async getWorkSchedules(filter?: Partial<WorkScheduleFilter>): Promise<WorkSchedule[]> {
    let query = db.select()
      .from(workSchedules);
      
    if (filter?.type) {
      query = query.where(eq(workSchedules.type, filter.type));
    }
    
    if (filter?.name) {
      query = query.where(sql`${workSchedules.name} ILIKE ${`%${filter.name}%`}`);
    }
    
    const result = await query.orderBy(asc(workSchedules.name));
    return result;
  }
  
  // Obtém uma jornada de trabalho específica pelo ID
  async getWorkSchedule(id: number): Promise<WorkSchedule | undefined> {
    const result = await db.select()
      .from(workSchedules)
      .where(eq(workSchedules.id, id))
      .limit(1);
      
    return result[0];
  }
  
  // Atualiza uma jornada de trabalho
  async updateWorkSchedule(id: number, scheduleData: Partial<WorkSchedule>, updatingUserId: number): Promise<WorkSchedule> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, createdAt: __, createdBy: ___, ...updateData } = scheduleData as any;
    
    // Adicionar informações de auditoria
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: updatingUserId
    };
    
    const result = await db.update(workSchedules)
      .set(dataToUpdate)
      .where(eq(workSchedules.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error("Jornada de trabalho não encontrada");
    }
    
    return result[0];
  }
  
  // Exclui uma jornada de trabalho
  async deleteWorkSchedule(id: number): Promise<boolean> {
    // Primeiro, verificar se a jornada está sendo usada por algum funcionário
    const usageCheck = await db.select()
      .from(employeeSchedules)
      .where(eq(employeeSchedules.scheduleId, id))
      .limit(1);
      
    if (usageCheck.length > 0) {
      throw new Error("Não é possível excluir uma jornada que está sendo utilizada por funcionários");
    }
    
    // Em seguida, excluir os detalhes da jornada
    await db.delete(workScheduleDetails)
      .where(eq(workScheduleDetails.scheduleId, id));
    
    // Por fim, excluir a jornada em si
    const result = await db.delete(workSchedules)
      .where(eq(workSchedules.id, id))
      .returning();
      
    return result.length > 0;
  }

  //
  // WORK SCHEDULE DETAILS METHODS
  //
  
  // Cria um novo detalhe de jornada de trabalho
  async createWorkScheduleDetail(detailData: InsertWorkScheduleDetail): Promise<WorkScheduleDetail> {
    // Verificar se já existe um detalhe para o mesmo dia da semana nessa jornada
    const existingDetail = await db.select()
      .from(workScheduleDetails)
      .where(
        and(
          eq(workScheduleDetails.scheduleId, detailData.scheduleId),
          eq(workScheduleDetails.weekday, detailData.weekday)
        )
      )
      .limit(1);
      
    if (existingDetail.length > 0) {
      throw new Error(`Já existe um detalhe para ${detailData.weekday} nesta jornada. Atualize o existente.`);
    }
    
    const result = await db.insert(workScheduleDetails)
      .values(detailData)
      .returning();
      
    return result[0];
  }
  
  // Obtém todos os detalhes de uma jornada
  async getWorkScheduleDetails(scheduleId: number): Promise<WorkScheduleDetail[]> {
    const result = await db.select()
      .from(workScheduleDetails)
      .where(eq(workScheduleDetails.scheduleId, scheduleId))
      .orderBy(asc(workScheduleDetails.weekday));
      
    return result;
  }
  
  // Atualiza um detalhe de jornada
  async updateWorkScheduleDetail(id: number, detailData: Partial<WorkScheduleDetail>): Promise<WorkScheduleDetail> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, scheduleId: __, weekday: ___, ...updateData } = detailData as any;
    
    const result = await db.update(workScheduleDetails)
      .set(updateData)
      .where(eq(workScheduleDetails.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error("Detalhe de jornada não encontrado");
    }
    
    return result[0];
  }
  
  // Exclui um detalhe de jornada
  async deleteWorkScheduleDetail(id: number): Promise<boolean> {
    const result = await db.delete(workScheduleDetails)
      .where(eq(workScheduleDetails.id, id))
      .returning();
      
    return result.length > 0;
  }

  //
  // EMPLOYEE SCHEDULE METHODS
  //
  
  // Cria uma nova atribuição de jornada para um funcionário
  async createEmployeeSchedule(scheduleData: InsertEmployeeSchedule): Promise<EmployeeSchedule> {
    // Verificar se o funcionário já tem uma jornada ativa
    const activeSchedule = await this.getCurrentEmployeeSchedule(scheduleData.userId);
    
    // Se já existe uma jornada ativa sem data de término, precisamos encerrar ela primeiro
    if (activeSchedule && !activeSchedule.endDate) {
      // Define a data de término da jornada atual como um dia antes da nova
      const endDate = new Date(scheduleData.startDate);
      endDate.setDate(endDate.getDate() - 1);
      
      await db.update(employeeSchedules)
        .set({ endDate })
        .where(eq(employeeSchedules.id, activeSchedule.id));
    }
    
    // Agora podemos criar a nova atribuição
    const result = await db.insert(employeeSchedules)
      .values({
        ...scheduleData,
        startDate: typeof scheduleData.startDate === 'string' 
          ? new Date(scheduleData.startDate) 
          : scheduleData.startDate,
        endDate: scheduleData.endDate 
          ? (typeof scheduleData.endDate === 'string' 
              ? new Date(scheduleData.endDate) 
              : scheduleData.endDate)
          : null
      })
      .returning();
      
    return result[0];
  }
  
  // Obtém as atribuições de jornada com opção de filtro
  async getEmployeeSchedules(filter: Partial<EmployeeScheduleFilter>): Promise<EmployeeSchedule[]> {
    let query = db.select()
      .from(employeeSchedules);
      
    if (filter.userId) {
      query = query.where(eq(employeeSchedules.userId, filter.userId));
    }
    
    if (filter.scheduleId) {
      query = query.where(eq(employeeSchedules.scheduleId, filter.scheduleId));
    }
    
    if (filter.active === true) {
      const today = new Date();
      query = query.where(
        or(
          isNull(employeeSchedules.endDate),
          gte(employeeSchedules.endDate, today)
        )
      );
    }
    
    const result = await query.orderBy(desc(employeeSchedules.startDate));
    return result;
  }
  
  // Obtém a jornada atual de um funcionário
  async getCurrentEmployeeSchedule(userId: number): Promise<EmployeeSchedule | undefined> {
    const today = new Date();
    
    const result = await db.select()
      .from(employeeSchedules)
      .where(
        and(
          eq(employeeSchedules.userId, userId),
          lte(employeeSchedules.startDate, today),
          or(
            isNull(employeeSchedules.endDate),
            gte(employeeSchedules.endDate, today)
          )
        )
      )
      .orderBy(desc(employeeSchedules.startDate))
      .limit(1);
      
    return result[0];
  }
  
  // Atualiza uma atribuição de jornada
  async updateEmployeeSchedule(id: number, scheduleData: Partial<EmployeeSchedule>, updatingUserId: number): Promise<EmployeeSchedule> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, createdAt: __, createdBy: ___, ...updateData } = scheduleData as any;
    
    // Converter datas se necessário
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: updatingUserId,
      startDate: updateData.startDate 
        ? (typeof updateData.startDate === 'string' 
            ? new Date(updateData.startDate) 
            : updateData.startDate)
        : undefined,
      endDate: updateData.endDate 
        ? (typeof updateData.endDate === 'string' 
            ? new Date(updateData.endDate) 
            : updateData.endDate)
        : undefined
    };
    
    const result = await db.update(employeeSchedules)
      .set(dataToUpdate)
      .where(eq(employeeSchedules.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error("Atribuição de jornada não encontrada");
    }
    
    return result[0];
  }
  
  // Exclui uma atribuição de jornada
  async deleteEmployeeSchedule(id: number): Promise<boolean> {
    const result = await db.delete(employeeSchedules)
      .where(eq(employeeSchedules.id, id))
      .returning();
      
    return result.length > 0;
  }
  
  // Obtém a jornada e detalhe de um funcionário para uma data específica
  async getEmployeeWorkScheduleForDate(userId: number, date: Date): Promise<{
    schedule: WorkSchedule | undefined;
    detail: WorkScheduleDetail | undefined;
  }> {
    // Obter a jornada atribuída ao funcionário para a data
    const employeeSchedule = await db.select()
      .from(employeeSchedules)
      .where(
        and(
          eq(employeeSchedules.userId, userId),
          lte(employeeSchedules.startDate, date),
          or(
            isNull(employeeSchedules.endDate),
            gte(employeeSchedules.endDate, date)
          )
        )
      )
      .orderBy(desc(employeeSchedules.startDate))
      .limit(1);
      
    if (employeeSchedule.length === 0) {
      return { schedule: undefined, detail: undefined };
    }
    
    // Obtém a definição da jornada
    const schedule = await this.getWorkSchedule(employeeSchedule[0].scheduleId);
    
    if (!schedule) {
      return { schedule: undefined, detail: undefined };
    }
    
    // Determina o dia da semana (0-6, onde 0 é domingo)
    const weekday = getDay(date);
    
    // Mapeia o número do dia para o nome usado no enum
    const weekdayMap: Record<number, typeof weekdayEnum.enumValues[number]> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };
    
    // Obtém os detalhes da jornada para o dia da semana
    const detail = await db.select()
      .from(workScheduleDetails)
      .where(
        and(
          eq(workScheduleDetails.scheduleId, schedule.id),
          eq(workScheduleDetails.weekday, weekdayMap[weekday])
        )
      )
      .limit(1);
      
    return {
      schedule,
      detail: detail[0]
    };
  }

  //
  // TIME BANK METHODS
  //
  
  // Cria uma nova entrada no banco de horas
  async createTimeBank(timeBankData: InsertTimeBank): Promise<TimeBank> {
    // Preparar os dados, garantindo que as datas sejam objetos Date
    const dataToInsert = {
      ...timeBankData,
      date: typeof timeBankData.date === 'string' 
        ? new Date(timeBankData.date) 
        : timeBankData.date,
      expirationDate: timeBankData.expirationDate 
        ? (typeof timeBankData.expirationDate === 'string' 
            ? new Date(timeBankData.expirationDate) 
            : timeBankData.expirationDate)
        : null
    };
    
    const result = await db.insert(timeBank)
      .values(dataToInsert)
      .returning();
      
    return result[0];
  }
  
  // Obtém entradas do banco de horas com opção de filtro
  async getTimeBankEntries(filter: Partial<TimeBankFilter>): Promise<TimeBank[]> {
    let query = db.select()
      .from(timeBank);
      
    if (filter.userId) {
      query = query.where(eq(timeBank.userId, filter.userId));
    }
    
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      query = query.where(gte(timeBank.date, startDate));
    }
    
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999); // Final do dia
      query = query.where(lte(timeBank.date, endDate));
    }
    
    if (filter.type) {
      query = query.where(eq(timeBank.type, filter.type));
    }
    
    if (filter.wasCompensated !== undefined) {
      query = query.where(eq(timeBank.wasCompensated, filter.wasCompensated));
    }
    
    const result = await query.orderBy(desc(timeBank.date));
    return result;
  }
  
  // Obtém o saldo do banco de horas de um funcionário
  async getUserTimeBankBalance(userId: number): Promise<number> {
    // Seleciona a soma das horas não compensadas, convertendo para minutos para precisão
    const result = await db.select({
      totalBalance: sum(sql`${timeBank.hoursBalance} * 60`),
    })
    .from(timeBank)
    .where(
      and(
        eq(timeBank.userId, userId),
        eq(timeBank.wasCompensated, false),
        or(
          isNull(timeBank.expirationDate),
          gte(timeBank.expirationDate, new Date())
        )
      )
    );
    
    // Se não houver resultado ou o total for null, retorna 0
    if (!result.length || result[0].totalBalance === null) {
      return 0;
    }
    
    return Number(result[0].totalBalance);
  }
  
  // Atualiza uma entrada do banco de horas
  async updateTimeBank(id: number, timeBankData: Partial<TimeBank>, updatingUserId: number): Promise<TimeBank> {
    // Remover campos que não devem ser atualizados diretamente
    const { id: _, createdAt: __, createdBy: ___, ...updateData } = timeBankData as any;
    
    // Preparar dados para atualização
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
      updatedBy: updatingUserId,
      date: updateData.date 
        ? (typeof updateData.date === 'string' 
            ? new Date(updateData.date) 
            : updateData.date)
        : undefined,
      expirationDate: updateData.expirationDate 
        ? (typeof updateData.expirationDate === 'string' 
            ? new Date(updateData.expirationDate) 
            : updateData.expirationDate)
        : undefined,
      compensationDate: updateData.compensationDate 
        ? (typeof updateData.compensationDate === 'string' 
            ? new Date(updateData.compensationDate) 
            : updateData.compensationDate)
        : undefined
    };
    
    const result = await db.update(timeBank)
      .set(dataToUpdate)
      .where(eq(timeBank.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error("Registro de banco de horas não encontrado");
    }
    
    return result[0];
  }
  
  // Exclui uma entrada do banco de horas
  async deleteTimeBankEntry(id: number): Promise<boolean> {
    const result = await db.delete(timeBank)
      .where(eq(timeBank.id, id))
      .returning();
      
    return result.length > 0;
  }
  
  // Compensa horas do banco de horas
  async compensateTimeBankHours(userId: number, compensationDate: Date, minutes: number, description: string, createdBy: number): Promise<boolean> {
    // Primeiro verificar se há saldo suficiente
    const balance = await this.getUserTimeBankBalance(userId);
    
    if (balance < minutes) {
      throw new Error(`Saldo insuficiente. Disponível: ${balance} minutos, Solicitado: ${minutes} minutos`);
    }
    
    // Estratégia FIFO: usar primeiro as horas mais antigas
    const entries = await db.select()
      .from(timeBank)
      .where(
        and(
          eq(timeBank.userId, userId),
          eq(timeBank.wasCompensated, false),
          gte(sql`${timeBank.hoursBalance} * 60`, 0), // Converter para minutos e garantir que seja positivo
          or(
            isNull(timeBank.expirationDate),
            gte(timeBank.expirationDate, new Date())
          )
        )
      )
      .orderBy(asc(timeBank.date)); // Mais antigas primeiro
    
    // Compensar as horas
    let remainingMinutes = minutes;
    const compensatedEntries: number[] = [];
    
    for (const entry of entries) {
      if (remainingMinutes <= 0) break;
      
      // Converter o saldo de horas para minutos
      const entryMinutes = Number(entry.hoursBalance) * 60;
      
      if (entryMinutes <= remainingMinutes) {
        // Compensar totalmente esta entrada
        await db.update(timeBank)
          .set({
            wasCompensated: true,
            compensationDate,
            updatedAt: new Date(),
            updatedBy: createdBy
          })
          .where(eq(timeBank.id, entry.id));
        
        remainingMinutes -= entryMinutes;
        compensatedEntries.push(entry.id);
      } else {
        // Compensar parcialmente
        // 1. Marcar a entrada atual como totalmente compensada
        await db.update(timeBank)
          .set({
            wasCompensated: true,
            compensationDate,
            updatedAt: new Date(),
            updatedBy: createdBy
          })
          .where(eq(timeBank.id, entry.id));
        
        // 2. Criar uma nova entrada com o saldo restante
        const remainingHours = (entryMinutes - remainingMinutes) / 60;
        await this.createTimeBank({
          userId,
          date: new Date(),
          hoursBalance: remainingHours.toFixed(2),
          description: `Saldo restante após compensação: ${description}`,
          type: "adjustment",
          createdBy,
          expirationDate: entry.expirationDate
        });
        
        remainingMinutes = 0;
        compensatedEntries.push(entry.id);
      }
    }
    
    // Criar uma entrada negativa para registrar a compensação
    if (compensatedEntries.length > 0) {
      await this.createTimeBank({
        userId,
        date: compensationDate,
        hoursBalance: (-minutes / 60).toFixed(2), // Converter para horas e negativo
        description,
        type: "compensation",
        createdBy,
        relatedRecordId: compensatedEntries[0] // Referência ao primeiro registro compensado
      });
      
      return true;
    }
    
    return false;
  }

  //
  // ABSENCE REQUEST METHODS
  //
  
  // Cria uma nova solicitação de ausência
  async createAbsenceRequest(requestData: InsertAbsenceRequest): Promise<AbsenceRequest> {
    // Preparar os dados com as datas como objetos Date
    const dataToInsert = {
      ...requestData,
      startDate: typeof requestData.startDate === 'string' 
        ? new Date(requestData.startDate) 
        : requestData.startDate,
      endDate: typeof requestData.endDate === 'string' 
        ? new Date(requestData.endDate) 
        : requestData.endDate
    };
    
    const result = await db.insert(absenceRequests)
      .values(dataToInsert)
      .returning();
      
    return result[0];
  }
  
  // Obtém solicitações de ausência com filtro
  async getAbsenceRequests(filter: Partial<AbsenceRequestFilter>): Promise<AbsenceRequest[]> {
    let query = db.select()
      .from(absenceRequests);
      
    if (filter.userId) {
      query = query.where(eq(absenceRequests.userId, filter.userId));
    }
    
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      query = query.where(gte(absenceRequests.startDate, startDate));
    }
    
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999); // Final do dia
      query = query.where(lte(absenceRequests.startDate, endDate));
    }
    
    if (filter.type) {
      query = query.where(eq(absenceRequests.type, filter.type));
    }
    
    if (filter.status) {
      query = query.where(eq(absenceRequests.status, filter.status));
    }
    
    const result = await query.orderBy(desc(absenceRequests.startDate));
    return result;
  }
  
  // Atualiza uma solicitação de ausência
  async updateAbsenceRequest(id: number, requestData: Partial<AbsenceRequest>): Promise<AbsenceRequest> {
    // Impedir atualização de campos de aprovação e status diretamente
    const { id: _, createdAt: __, status: ___, reviewedBy: ____, reviewDate: _____, ...updateData } = requestData as any;
    
    // Atualizar as datas se fornecidas
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date(),
      startDate: updateData.startDate 
        ? (typeof updateData.startDate === 'string' 
            ? new Date(updateData.startDate) 
            : updateData.startDate)
        : undefined,
      endDate: updateData.endDate 
        ? (typeof updateData.endDate === 'string' 
            ? new Date(updateData.endDate) 
            : updateData.endDate)
        : undefined
    };
    
    const result = await db.update(absenceRequests)
      .set(dataToUpdate)
      .where(
        and(
          eq(absenceRequests.id, id),
          eq(absenceRequests.status, "pending") // Só permite atualizar se estiver pendente
        )
      )
      .returning();
      
    if (result.length === 0) {
      throw new Error("Solicitação não encontrada ou não está mais pendente");
    }
    
    return result[0];
  }
  
  // Exclui uma solicitação de ausência
  async deleteAbsenceRequest(id: number): Promise<boolean> {
    // Só permite excluir solicitações pendentes
    const result = await db.delete(absenceRequests)
      .where(
        and(
          eq(absenceRequests.id, id),
          eq(absenceRequests.status, "pending")
        )
      )
      .returning();
      
    return result.length > 0;
  }
  
  // Aprova uma solicitação de ausência
  async approveAbsenceRequest(id: number, reviewerId: number, notes?: string): Promise<AbsenceRequest> {
    const result = await db.update(absenceRequests)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewDate: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(absenceRequests.id, id),
          eq(absenceRequests.status, "pending")
        )
      )
      .returning();
      
    if (result.length === 0) {
      throw new Error("Solicitação não encontrada ou não está mais pendente");
    }
    
    // Se a solicitação for do tipo "compensation", criar uma compensação no banco de horas
    if (result[0].type === "compensation") {
      // Calcular dias úteis entre as datas
      let startDate = new Date(result[0].startDate);
      const endDate = new Date(result[0].endDate);
      let businessDays = 0;
      
      while (startDate <= endDate) {
        const day = startDate.getDay();
        if (day !== 0 && day !== 6) { // 0 = domingo, 6 = sábado
          businessDays++;
        }
        startDate = addDays(startDate, 1);
      }
      
      // Buscar a jornada do funcionário para calcular a quantidade de horas
      const { schedule } = await this.getEmployeeWorkScheduleForDate(result[0].userId, new Date());
      let dailyHours = 8; // Padrão de 8 horas se não encontrar jornada
      
      if (schedule) {
        // Converter horas semanais para diárias (considerando 5 dias úteis por semana)
        dailyHours = Number(schedule.weeklyHours) / 5;
      }
      
      // Calcular o total de horas e converter para minutos
      const totalMinutes = businessDays * dailyHours * 60;
      
      // Compensar as horas no banco de horas
      await this.compensateTimeBankHours(
        result[0].userId,
        new Date(result[0].startDate),
        totalMinutes,
        `Compensação de horas: ${result[0].reason}`,
        reviewerId
      );
    }
    
    return result[0];
  }
  
  // Rejeita uma solicitação de ausência
  async rejectAbsenceRequest(id: number, reviewerId: number, notes?: string): Promise<AbsenceRequest> {
    const result = await db.update(absenceRequests)
      .set({
        status: "rejected",
        reviewedBy: reviewerId,
        reviewDate: new Date(),
        reviewNotes: notes || null,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(absenceRequests.id, id),
          eq(absenceRequests.status, "pending")
        )
      )
      .returning();
      
    if (result.length === 0) {
      throw new Error("Solicitação não encontrada ou não está mais pendente");
    }
    
    return result[0];
  }

  //
  // ENHANCED TIME RECORD METHODS
  //
  
  // Calcula horas trabalhadas em um período
  async calculateWorkedHours(userId: number, startDateStr: string, endDateStr: string): Promise<{
    totalWorkedMinutes: number;
    regularMinutes: number;
    overtimeMinutes: number;
    missingMinutes: number;
    lateMinutes: number;
  }> {
    const startDate = new Date(startDateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);
    
    // Obter todos os registros de ponto no período
    const records = await db.select()
      .from(timeRecords)
      .where(
        and(
          eq(timeRecords.userId, userId),
          gte(timeRecords.timestamp, startDate),
          lte(timeRecords.timestamp, endDate)
        )
      )
      .orderBy(asc(timeRecords.timestamp));
    
    // Agrupar registros por dia
    const recordsByDay: Record<string, TimeRecord[]> = {};
    
    for (const record of records) {
      const date = format(new Date(record.timestamp), 'yyyy-MM-dd');
      
      if (!recordsByDay[date]) {
        recordsByDay[date] = [];
      }
      
      recordsByDay[date].push(record);
    }
    
    // Calcular totais
    let totalWorkedMinutes = 0;
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let missingMinutes = 0;
    let lateMinutes = 0;
    
    // Processar cada dia
    for (const date in recordsByDay) {
      const dayRecords = recordsByDay[date];
      const dayDate = new Date(date);
      
      // Obter a jornada do dia
      const { schedule, detail } = await this.getEmployeeWorkScheduleForDate(userId, dayDate);
      
      // Se não houver jornada definida ou o dia não for dia de trabalho, considerar todo tempo como regular
      if (!schedule || !detail || !detail.isWorkDay) {
        let dayWorkedMinutes = 0;
        
        // Processar os pares de entrada e saída
        for (let i = 0; i < dayRecords.length; i += 2) {
          const inRecord = dayRecords[i];
          const outRecord = dayRecords[i + 1];
          
          if (inRecord && outRecord && inRecord.type === 'in' && outRecord.type === 'out') {
            const inTime = new Date(inRecord.timestamp);
            const outTime = new Date(outRecord.timestamp);
            const workMinutes = Math.max(0, differenceInMinutes(outTime, inTime));
            
            dayWorkedMinutes += workMinutes;
          }
        }
        
        totalWorkedMinutes += dayWorkedMinutes;
        regularMinutes += dayWorkedMinutes; // Sem jornada, todas as horas são regulares
        continue;
      }
      
      // A partir daqui, temos uma jornada definida para o dia
      
      // Calcular os horários esperados para o dia
      const startTime = detail.startTime as unknown as string;
      const endTime = detail.endTime as unknown as string;
      const breakStart = detail.breakStart as unknown as string;
      const breakEnd = detail.breakEnd as unknown as string;
      
      // Converter para Date os horários de jornada (String "HH:MM:SS" para Date)
      const parseTimeToDate = (timeStr: string, baseDate: Date): Date => {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        const date = new Date(baseDate);
        date.setHours(hours, minutes, seconds || 0);
        return date;
      };
      
      const expectedStartTime = parseTimeToDate(startTime, dayDate);
      const expectedEndTime = parseTimeToDate(endTime, dayDate);
      
      // Calcular os minutos esperados para o dia
      let expectedMinutes = differenceInMinutes(expectedEndTime, expectedStartTime);
      
      // Subtrair o intervalo se existir
      if (breakStart && breakEnd) {
        const breakStartTime = parseTimeToDate(breakStart, dayDate);
        const breakEndTime = parseTimeToDate(breakEnd, dayDate);
        const breakMinutes = differenceInMinutes(breakEndTime, breakStartTime);
        expectedMinutes -= breakMinutes;
      }
      
      // Processar os registros do dia
      let dayWorkedMinutes = 0;
      let firstEntryTime: Date | null = null;
      
      // Encontrar o primeiro registro de entrada
      for (const record of dayRecords) {
        if (record.type === 'in') {
          firstEntryTime = new Date(record.timestamp);
          break;
        }
      }
      
      // Verificar se houve atraso
      if (firstEntryTime && isAfter(firstEntryTime, expectedStartTime)) {
        lateMinutes += differenceInMinutes(firstEntryTime, expectedStartTime);
      }
      
      // Processar os pares de entrada e saída
      for (let i = 0; i < dayRecords.length; i += 2) {
        const inRecord = dayRecords[i];
        const outRecord = dayRecords[i + 1];
        
        if (inRecord && outRecord && inRecord.type === 'in' && outRecord.type === 'out') {
          const inTime = new Date(inRecord.timestamp);
          const outTime = new Date(outRecord.timestamp);
          const workMinutes = Math.max(0, differenceInMinutes(outTime, inTime));
          
          dayWorkedMinutes += workMinutes;
        }
      }
      
      totalWorkedMinutes += dayWorkedMinutes;
      
      // Comparar com o esperado
      if (dayWorkedMinutes > expectedMinutes) {
        regularMinutes += expectedMinutes;
        overtimeMinutes += (dayWorkedMinutes - expectedMinutes);
      } else if (dayWorkedMinutes < expectedMinutes) {
        regularMinutes += dayWorkedMinutes;
        missingMinutes += (expectedMinutes - dayWorkedMinutes);
      } else {
        regularMinutes += expectedMinutes;
      }
    }
    
    return {
      totalWorkedMinutes,
      regularMinutes,
      overtimeMinutes,
      missingMinutes,
      lateMinutes
    };
  }
  
  // Processa um registro de ponto para o banco de horas
  async processTimeRecordForTimeBank(timeRecordId: number, adminId: number): Promise<boolean> {
    // Buscar o registro de ponto
    const record = await db.select()
      .from(timeRecords)
      .where(eq(timeRecords.id, timeRecordId))
      .limit(1);
      
    if (record.length === 0) {
      throw new Error("Registro de ponto não encontrado");
    }
    
    const timeRecord = record[0];
    
    // Verificar se o registro já foi processado
    if (timeRecord.processedForTimeBank) {
      return false; // Já processado, nada a fazer
    }
    
    // Só podemos processar registros de saída
    if (timeRecord.type !== 'out') {
      throw new Error("Apenas registros de saída podem ser processados para o banco de horas");
    }
    
    // Buscar o par de entrada correspondente
    const inRecords = await db.select()
      .from(timeRecords)
      .where(
        and(
          eq(timeRecords.userId, timeRecord.userId),
          eq(timeRecords.type, 'in'),
          lt(timeRecords.timestamp, timeRecord.timestamp)
        )
      )
      .orderBy(desc(timeRecords.timestamp))
      .limit(1);
      
    if (inRecords.length === 0) {
      throw new Error("Registro de entrada correspondente não encontrado");
    }
    
    const inRecord = inRecords[0];
    const recordDate = startOfDay(new Date(timeRecord.timestamp));
    
    // Obter a jornada para o dia
    const { schedule, detail } = await this.getEmployeeWorkScheduleForDate(
      timeRecord.userId, 
      recordDate
    );
    
    // Se não houver jornada definida, não há como calcular horas extras
    if (!schedule || !detail || !detail.isWorkDay) {
      // Atualizar o registro como processado
      await db.update(timeRecords)
        .set({ processedForTimeBank: true })
        .where(eq(timeRecords.id, timeRecord.id));
        
      return false;
    }
    
    // Calcular os horários esperados para o dia
    const startTime = detail.startTime as unknown as string;
    const endTime = detail.endTime as unknown as string;
    const breakStart = detail.breakStart as unknown as string;
    const breakEnd = detail.breakEnd as unknown as string;
    
    // Converter para Date os horários de jornada (String "HH:MM:SS" para Date)
    const parseTimeToDate = (timeStr: string, baseDate: Date): Date => {
      const [hours, minutes, seconds] = timeStr.split(':').map(Number);
      const date = new Date(baseDate);
      date.setHours(hours, minutes, seconds || 0);
      return date;
    };
    
    const expectedEndTime = parseTimeToDate(endTime, recordDate);
    const outTime = new Date(timeRecord.timestamp);
    
    // Calcular horas extras (se saiu depois do horário esperado)
    if (isAfter(outTime, expectedEndTime)) {
      const overtimeMinutes = differenceInMinutes(outTime, expectedEndTime);
      
      if (overtimeMinutes > 0) {
        // Converter para horas com precisão de 2 casas decimais
        const overtimeHours = parseFloat((overtimeMinutes / 60).toFixed(2));
        
        // Adicionar ao banco de horas
        await this.createTimeBank({
          userId: timeRecord.userId,
          date: recordDate,
          hoursBalance: overtimeHours.toString(),
          description: `Horas extras: ${format(recordDate, 'dd/MM/yyyy')}`,
          type: "overtime",
          relatedRecordId: timeRecord.id,
          createdBy: adminId,
          // Expiração em 6 meses
          expirationDate: addDays(new Date(), 180)
        });
        
        // Atualizar o registro de ponto com as horas extras calculadas
        await db.update(timeRecords)
          .set({ 
            overtime: overtimeHours, 
            processedForTimeBank: true 
          })
          .where(eq(timeRecords.id, timeRecord.id));
          
        return true;
      }
    }
    
    // Marcar como processado mesmo se não houver horas extras
    await db.update(timeRecords)
      .set({ processedForTimeBank: true })
      .where(eq(timeRecords.id, timeRecord.id));
      
    return false;
  }
}