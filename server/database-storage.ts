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
  InsertAuditLog
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, pool } from "./db";
import { eq, and, gte, lt, desc, SQL } from "drizzle-orm";
import session from "express-session";
import { Store } from "express-session";
import connectPg from "connect-pg-simple";
import { format } from "date-fns";

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

  async updateSalary(id: number, salaryData: Partial<Salary>): Promise<Salary> {
    // Parse dates if they are strings
    let dataToUpdate = {...salaryData};
    
    if (dataToUpdate.effectiveDate && typeof dataToUpdate.effectiveDate === 'string') {
      dataToUpdate.effectiveDate = new Date(dataToUpdate.effectiveDate);
    }
    
    const result = await db.update(salaries)
      .set(dataToUpdate)
      .where(eq(salaries.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Salary record not found");
    }

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

  async updateFinancialTransaction(id: number, transactionData: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
    // Parse dates if they are strings
    let dataToUpdate = {...transactionData};
    
    if (dataToUpdate.transactionDate && typeof dataToUpdate.transactionDate === 'string') {
      dataToUpdate.transactionDate = new Date(dataToUpdate.transactionDate);
    }
    
    const result = await db.update(financialTransactions)
      .set(dataToUpdate)
      .where(eq(financialTransactions.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Financial transaction not found");
    }

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
}