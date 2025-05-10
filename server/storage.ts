import { 
  User, 
  InsertUser, 
  TimeRecord, 
  InsertTimeRecord, 
  TimeRecordFilter,
  Salary,
  InsertSalary,
  FinancialTransaction,
  InsertFinancialTransaction,
  FinancialTransactionFilter,
  AuditLog,
  InsertAuditLog,
  // Novos tipos para jornada de trabalho
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
  AbsenceRequestFilter
} from "@shared/schema";
import session from "express-session";
import { Store } from "express-session";
import { format } from "date-fns";

export interface IStorage {
  // Session store
  sessionStore: Store;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  updateUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  updateFirstLoginFlag(id: number, value: boolean): Promise<boolean>;
  checkAdminExists(): Promise<boolean>;
  
  // Time record methods
  createTimeRecord(record: InsertTimeRecord): Promise<TimeRecord>;
  getTimeRecords(filter: Partial<TimeRecordFilter>): Promise<TimeRecord[]>;
  getUserStatus(userId: number): Promise<"in" | "out">;
  updateTimeRecord(id: number, recordData: Partial<TimeRecord>): Promise<TimeRecord>;
  deleteTimeRecord(id: number): Promise<boolean>;
  exportTimeRecordsCSV(filter: Partial<TimeRecordFilter>): Promise<string>;
  // Métodos adicionais para cálculo de horas
  calculateWorkedHours(userId: number, startDate: string, endDate: string): Promise<{
    totalWorkedMinutes: number;
    regularMinutes: number;
    overtimeMinutes: number;
    missingMinutes: number;
    lateMinutes: number;
  }>;
  processTimeRecordForTimeBank(timeRecordId: number, adminId: number): Promise<boolean>;
  
  // Work Schedule methods
  createWorkSchedule(scheduleData: InsertWorkSchedule): Promise<WorkSchedule>;
  getWorkSchedules(filter?: Partial<WorkScheduleFilter>): Promise<WorkSchedule[]>;
  getWorkSchedule(id: number): Promise<WorkSchedule | undefined>;
  updateWorkSchedule(id: number, scheduleData: Partial<WorkSchedule>, updatingUserId: number): Promise<WorkSchedule>;
  deleteWorkSchedule(id: number): Promise<boolean>;
  
  // Work Schedule Detail methods
  createWorkScheduleDetail(detailData: InsertWorkScheduleDetail): Promise<WorkScheduleDetail>;
  getWorkScheduleDetails(scheduleId: number): Promise<WorkScheduleDetail[]>;
  updateWorkScheduleDetail(id: number, detailData: Partial<WorkScheduleDetail>): Promise<WorkScheduleDetail>;
  deleteWorkScheduleDetail(id: number): Promise<boolean>;
  
  // Employee Schedule methods
  createEmployeeSchedule(scheduleData: InsertEmployeeSchedule): Promise<EmployeeSchedule>;
  getEmployeeSchedules(filter: Partial<EmployeeScheduleFilter>): Promise<EmployeeSchedule[]>;
  getCurrentEmployeeSchedule(userId: number): Promise<EmployeeSchedule | undefined>;
  updateEmployeeSchedule(id: number, scheduleData: Partial<EmployeeSchedule>, updatingUserId: number): Promise<EmployeeSchedule>;
  deleteEmployeeSchedule(id: number): Promise<boolean>;
  getEmployeeWorkScheduleForDate(userId: number, date: Date): Promise<{
    schedule: WorkSchedule | undefined;
    detail: WorkScheduleDetail | undefined;
  }>;
  
  // Time Bank methods
  createTimeBank(timeBankData: InsertTimeBank): Promise<TimeBank>;
  getTimeBankEntries(filter: Partial<TimeBankFilter>): Promise<TimeBank[]>;
  getUserTimeBankBalance(userId: number): Promise<number>; // Retorna o saldo em minutos
  updateTimeBank(id: number, timeBankData: Partial<TimeBank>, updatingUserId: number): Promise<TimeBank>;
  deleteTimeBankEntry(id: number): Promise<boolean>;
  compensateTimeBankHours(userId: number, compensationDate: Date, minutes: number, description: string, createdBy: number): Promise<boolean>;
  
  // Absence Request methods
  createAbsenceRequest(requestData: InsertAbsenceRequest): Promise<AbsenceRequest>;
  getAbsenceRequests(filter: Partial<AbsenceRequestFilter>): Promise<AbsenceRequest[]>;
  updateAbsenceRequest(id: number, requestData: Partial<AbsenceRequest>): Promise<AbsenceRequest>;
  deleteAbsenceRequest(id: number): Promise<boolean>;
  approveAbsenceRequest(id: number, reviewerId: number, notes?: string): Promise<AbsenceRequest>;
  rejectAbsenceRequest(id: number, reviewerId: number, notes?: string): Promise<AbsenceRequest>;

  // Salary methods
  createSalary(salaryData: InsertSalary): Promise<Salary>;
  getCurrentSalary(userId: number): Promise<Salary | undefined>;
  getSalaryHistory(userId: number): Promise<Salary[]>;
  updateSalary(id: number, salaryData: Partial<Salary>, updatingUserId: number, ipAddress?: string): Promise<Salary>;
  deleteSalary(id: number): Promise<boolean>;
  
  // Financial transaction methods
  createFinancialTransaction(transactionData: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialTransactions(filter: Partial<FinancialTransactionFilter>): Promise<FinancialTransaction[]>;
  updateFinancialTransaction(id: number, transactionData: Partial<FinancialTransaction>, updatingUserId: number, ipAddress?: string): Promise<FinancialTransaction>;
  deleteFinancialTransaction(id: number): Promise<boolean>;
  exportFinancialTransactionsCSV(filter: Partial<FinancialTransactionFilter>): Promise<string>;
  
  // Audit log methods
  createAuditLog(auditData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]>;
}

// Import from the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
