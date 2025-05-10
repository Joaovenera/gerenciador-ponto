import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, date, pgEnum, jsonb } from "drizzle-orm/pg-core";
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

// Time record schemas
export const insertTimeRecordSchema = createInsertSchema(timeRecords).omit({
  id: true,
  timestamp: true,
});

export const timeRecordFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  userId: z.number().optional(),
  type: z.enum(["in", "out"]).optional(),
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
