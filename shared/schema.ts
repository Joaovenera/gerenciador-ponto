import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, date, pgEnum, jsonb, time, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  cpf: text("cpf").notNull().unique(),
  profilePicture: text("profile_picture"),
  admissionDate: text("admission_date").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  status: text("status").notNull().default("active"),
  email: text("email").notNull(),
  phone: text("phone"),
  accessLevel: text("access_level").notNull().default("employee"),
  birthDate: text("birth_date").notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstLogin: boolean("first_login").notNull().default(true),
});

// Enum para os dias da semana
export const weekdayEnum = pgEnum('weekday', [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]);

// Enum para tipos de jornada
export const workScheduleTypeEnum = pgEnum('work_schedule_type', [
  'regular', 'flexible', 'shift', 'scale'
]);

// Tabela para definir jornadas de trabalho
export const workSchedules = pgTable("work_schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: workScheduleTypeEnum("type").notNull(),
  weeklyHours: decimal("weekly_hours", { precision: 5, scale: 2 }).notNull(),
  // Campos adicionais
  toleranceMinutes: integer("tolerance_minutes"), // Tolerância em minutos para chegadas/saídas
  breakTime: integer("break_time"), // Tempo padrão de intervalo em minutos
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: integer("updated_by"),
});

// Tabela para horários da jornada (detalhes da jornada por dia da semana)
export const workScheduleDetails = pgTable("work_schedule_details", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  weekday: weekdayEnum("weekday").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  isWorkDay: boolean("is_work_day").notNull().default(true),
}, (table) => {
  return {
    // Índice único para garantir que cada dia da semana só esteja presente uma vez por jornada
    scheduleWeekdayIdx: uniqueIndex("schedule_weekday_idx").on(table.scheduleId, table.weekday),
  }
});

// Tabela para atribuição de jornada aos funcionários
export const employeeSchedules = pgTable("employee_schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  scheduleId: integer("schedule_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: integer("updated_by"),
  notes: text("notes"),
});

// Tabela para controle de banco de horas
export const timeBank = pgTable("time_bank", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date").notNull(),
  hoursBalance: decimal("hours_balance", { precision: 5, scale: 2 }).notNull(), // pode ser negativo (débito) ou positivo (crédito)
  description: text("description").notNull(),
  type: text("type").notNull(), // "overtime", "compensation", "absence", "late", "manual_adjustment"
  relatedRecordId: integer("related_record_id"), // ID de registro relacionado (ex: registro de ponto)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: integer("updated_by"),
  expirationDate: timestamp("expiration_date"), // Quando o saldo expira, se aplicável
  wasCompensated: boolean("was_compensated").notNull().default(false),
  compensationDate: timestamp("compensation_date"),
  notes: text("notes"),
});

// Tabela para solicitações de ausência
export const absenceRequests = pgTable("absence_requests", {
  id: serial("id").primaryKey(), 
  userId: integer("user_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  type: text("type").notNull(), // "vacation", "sick_leave", "personal", "compensation"
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  reviewedBy: integer("reviewed_by"),
  reviewDate: timestamp("review_date"),
  reviewNotes: text("review_notes"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const timeRecords = pgTable("time_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(), // "in" or "out"
  ipAddress: text("ip_address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  photo: text("photo").notNull(),
  isManual: boolean("is_manual").notNull().default(false),
  justification: text("justification"),
  createdBy: integer("created_by").notNull(),
  // Campos adicionais para jornada de trabalho
  scheduleId: integer("schedule_id"), // Referência à jornada de trabalho do dia
  isLate: boolean("is_late").notNull().default(false), // Indica se o registro está atrasado
  overtime: decimal("overtime", { precision: 5, scale: 2 }), // Horas extras calculadas para o dia
  processedForTimeBank: boolean("processed_for_time_bank").notNull().default(false), // Indica se o registro já foi processado no banco de horas
});

// Financial transactions types enum
export const transactionTypeEnum = pgEnum('transaction_type', [
  'salary', 
  'advance', 
  'bonus', 
  'vacation', 
  'thirteenth', 
  'adjustment',
  'deduction'
]);

// Salary table to track salary history
export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: integer("updated_by"),
  notes: text("notes"),
});

// Financial transactions table for all other financial operations
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull(),
  updatedAt: timestamp("updated_at"),
  updatedBy: integer("updated_by"),
  notes: text("notes"),
  reference: text("reference"), // For tracking document references, if any
});

// Audit log table for tracking changes to important records
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'salary', 'financial_transaction', etc.
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  userId: integer("user_id").notNull(), // ID of user who made the change
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  oldValues: jsonb("old_values"), // Previous values in JSON format (for updates)
  newValues: jsonb("new_values"), // New values in JSON format
  ipAddress: text("ip_address"),
});

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "CPF/Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

// Work Schedule schemas
export const insertWorkScheduleSchema = createInsertSchema(workSchedules).omit({
  id: true, 
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
}).extend({
  // Aceitar string ou número para carga horária
  weeklyHours: z.number().or(z.string().transform(val => Number(val))),
  toleranceMinutes: z.number().or(z.string().transform(val => Number(val))),
  breakTime: z.number().or(z.string().transform(val => Number(val)))
});

export const insertWorkScheduleDetailsSchema = createInsertSchema(workScheduleDetails).omit({
  id: true,
});

export const insertEmployeeScheduleSchema = createInsertSchema(employeeSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
}).extend({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional(),
});

export const insertTimeBankSchema = createInsertSchema(timeBank).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  wasCompensated: true,
  compensationDate: true,
}).extend({
  date: z.string().or(z.date()),
  expirationDate: z.string().or(z.date()).optional(),
  // Aceitar número ou string para hoursBalance (conversão feita no backend)
  hoursBalance: z.number().or(z.string().transform(val => parseFloat(val))),
});

export const insertAbsenceRequestSchema = createInsertSchema(absenceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true, 
  reviewedBy: true,
  reviewDate: true,
  status: true,
}).extend({
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
});

// Time record schemas
export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  timestamp: true,
  isLate: true,
  overtime: true,
  processedForTimeBank: true,
});

export const timeRecordFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.number().optional(),
  type: z.enum(["in", "out"]).optional(),
  isLate: z.boolean().optional(),
  processedForTimeBank: z.boolean().optional()
});

// Work Schedule filter schema
export const workScheduleFilterSchema = z.object({
  type: z.enum(['regular', 'flexible', 'shift', 'scale']).optional(),
  name: z.string().optional(),
});

// Employee Schedule filter schema
export const employeeScheduleFilterSchema = z.object({
  userId: z.number().optional(),
  scheduleId: z.number().optional(),
  active: z.boolean().optional(), // Para filtrar apenas jornadas ativas (endDate é null ou está no futuro)
});

// Time Bank filter schema
export const timeBankFilterSchema = z.object({
  userId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional(),
  wasCompensated: z.boolean().optional(),
});

// Absence request filter schema
export const absenceRequestFilterSchema = z.object({
  userId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

// Salary schemas
export const insertSalarySchema = createInsertSchema(salaries)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    // Aceitar string para a data de vigência e converter para Date no backend
    effectiveDate: z.string().or(z.date()),
  });

// Financial transaction schemas
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    // Aceitar string para a data da transação e converter para Date no backend
    transactionDate: z.string().or(z.date()),
  });

export const financialTransactionFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.number().optional(),
  type: z.enum(['salary', 'advance', 'bonus', 'vacation', 'thirteenth', 'adjustment', 'deduction']).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type TimeRecordFilter = z.infer<typeof timeRecordFilterSchema>;

export type WorkSchedule = typeof workSchedules.$inferSelect;
export type InsertWorkSchedule = z.infer<typeof insertWorkScheduleSchema>;
export type WorkScheduleFilter = z.infer<typeof workScheduleFilterSchema>;

export type WorkScheduleDetail = typeof workScheduleDetails.$inferSelect;
export type InsertWorkScheduleDetail = z.infer<typeof insertWorkScheduleDetailsSchema>;

export type EmployeeSchedule = typeof employeeSchedules.$inferSelect;
export type InsertEmployeeSchedule = z.infer<typeof insertEmployeeScheduleSchema>;
export type EmployeeScheduleFilter = z.infer<typeof employeeScheduleFilterSchema>;

export type TimeBank = typeof timeBank.$inferSelect;
export type InsertTimeBank = z.infer<typeof insertTimeBankSchema>;
export type TimeBankFilter = z.infer<typeof timeBankFilterSchema>;

export type AbsenceRequest = typeof absenceRequests.$inferSelect;
export type InsertAbsenceRequest = z.infer<typeof insertAbsenceRequestSchema>;
export type AbsenceRequestFilter = z.infer<typeof absenceRequestFilterSchema>;

export type Salary = typeof salaries.$inferSelect;
export type InsertSalary = z.infer<typeof insertSalarySchema>;

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransactionFilter = z.infer<typeof financialTransactionFilterSchema>;

// Audit log types
export type AuditLog = typeof auditLogs.$inferSelect;
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
