import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type TimeRecord = typeof timeRecords.$inferSelect;
export type InsertTimeRecord = z.infer<typeof insertTimeRecordSchema>;
export type TimeRecordFilter = z.infer<typeof timeRecordFilterSchema>;
