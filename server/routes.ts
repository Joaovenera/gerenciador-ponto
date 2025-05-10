import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { 
  insertTimeRecordSchema, 
  timeRecordFilterSchema, 
  insertUserSchema,
  insertSalarySchema,
  insertFinancialTransactionSchema,
  financialTransactionFilterSchema,
  // Novos schemas para jornada de trabalho
  insertWorkScheduleSchema,
  workScheduleFilterSchema,
  insertWorkScheduleDetailsSchema,
  insertEmployeeScheduleSchema,
  employeeScheduleFilterSchema,
  insertTimeBankSchema,
  timeBankFilterSchema,
  insertAbsenceRequestSchema,
  absenceRequestFilterSchema
} from "@shared/schema";
import { z } from "zod";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

// Check if user has admin access
function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  const user = req.user as Express.User;
  if (user.accessLevel !== "admin") return res.sendStatus(403);
  next();
}

// Check if user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Health check endpoint for Docker healthcheck
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "timetracker-api",
      environment: process.env.NODE_ENV
    });
  });

  // Get client IP address
  app.get("/api/ip", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    res.json({ ip });
  });

  // Create default admin if no users exist
  const adminExists = await storage.checkAdminExists();
  if (!adminExists) {
    const defaultAdmin = {
      fullName: "Administrador",
      cpf: "00000000000",
      admissionDate: format(new Date(), "yyyy-MM-dd"),
      role: "Administrador",
      department: "TI",
      status: "active",
      email: "admin@sistema.com",
      accessLevel: "admin",
      birthDate: "1990-01-01",
      username: "admin",
      password: await hashPassword("admin"),
      firstLogin: true,
    };
    await storage.createUser(defaultAdmin);
    console.log("Default admin user created");
  }

  // Time Record Routes
  app.post("/api/time-records", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const timeRecordData = insertTimeRecordSchema.parse({
        ...req.body,
        userId,
        createdBy: userId, // Created by the user themselves
      });
      
      const timeRecord = await storage.createTimeRecord(timeRecordData);
      res.status(201).json(timeRecord);
    } catch (err) {
      next(err);
    }
  });

  // Get time records for logged in user (last 7 days)
  app.get("/api/time-records/me", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filter = {
        userId,
        startDate: format(sevenDaysAgo, "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd"),
      };
      
      const records = await storage.getTimeRecords(filter);
      res.json(records);
    } catch (err) {
      next(err);
    }
  });

  // Get current status (in/out) for logged in user
  app.get("/api/time-records/status", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const status = await storage.getUserStatus(userId);
      res.json({ status });
    } catch (err) {
      next(err);
    }
  });

  // ADMIN ROUTES
  
  // Get all time records with filtering
  app.get("/api/admin/time-records", isAdmin, async (req, res, next) => {
    try {
      const { startDate, endDate, userId, type } = req.query;
      
      const filter = timeRecordFilterSchema.parse({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as "in" | "out" | undefined,
      });
      
      const records = await storage.getTimeRecords(filter);
      res.json(records);
    } catch (err) {
      next(err);
    }
  });

  // Create a new time record manually
  app.post("/api/admin/time-records", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      const timeRecordData = {
        ...req.body,
        isManual: true,
        createdBy: adminId,
      };
      
      const timeRecord = await storage.createTimeRecord(timeRecordData);
      res.status(201).json(timeRecord);
    } catch (err) {
      next(err);
    }
  });

  // Update a time record
  app.put("/api/admin/time-records/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const timeRecord = await storage.updateTimeRecord(id, req.body);
      res.json(timeRecord);
    } catch (err) {
      next(err);
    }
  });

  // Delete a time record
  app.delete("/api/admin/time-records/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimeRecord(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Create a new user
  app.post("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username (cpf) already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).send("CPF/Usuário já existe");
      }
      
      // Hash the password (default to birth date in DDMMYYYY format)
      const [year, month, day] = userData.birthDate.split("-");
      userData.password = await hashPassword(`${day}${month}${year}`);
      
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  // Get all users
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      next(err);
    }
  });

  // Get user by ID
  app.get("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) return res.status(404).send("Usuário não encontrado");
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  // Update a user
  app.put("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { resetPassword, birthDate, ...userData } = req.body;
      
      if (resetPassword) {
        const [year, month, day] = birthDate.split("-");
        userData.password = await hashPassword(`${day}${month}${year}`);
      }
      
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (err) {
      next(err);
    }
  });

  // Delete a user
  app.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteUser(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Export time records as CSV
  app.get("/api/admin/export-time-records", isAdmin, async (req, res, next) => {
    try {
      const { startDate, endDate, userId, type } = req.query;
      
      const filter = timeRecordFilterSchema.parse({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as "in" | "out" | undefined,
      });
      
      const csvContent = await storage.exportTimeRecordsCSV(filter);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=time-records.csv");
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  });

  // SALARY AND FINANCIAL MANAGEMENT ROUTES
  
  // Create a new salary record
  app.post("/api/admin/salaries", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertSalarySchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      // Preparar os dados para inserção, garantindo que a data seja um objeto Date
      const salaryData = {
        ...validatedData,
        // Converter a string de data para um objeto Date
        effectiveDate: typeof validatedData.effectiveDate === 'string' 
          ? new Date(validatedData.effectiveDate) 
          : validatedData.effectiveDate,
      };
      
      const salary = await storage.createSalary(salaryData);
      res.status(201).json(salary);
    } catch (err) {
      next(err);
    }
  });

  // Get current salary for a user
  app.get("/api/admin/salaries/current/:userId", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const salary = await storage.getCurrentSalary(userId);
      
      if (!salary) {
        return res.status(404).json({ message: "Não existe registro de salário para este funcionário" });
      }
      
      res.json(salary);
    } catch (err) {
      next(err);
    }
  });

  // Get salary history for a user
  app.get("/api/admin/salaries/history/:userId", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const salaries = await storage.getSalaryHistory(userId);
      res.json(salaries);
    } catch (err) {
      next(err);
    }
  });

  // Update a salary record
  app.put("/api/admin/salaries/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      const ipAddress = req.ip;
      
      const salary = await storage.updateSalary(
        id, 
        req.body, 
        adminId,
        ipAddress
      );
      
      res.json(salary);
    } catch (err) {
      next(err);
    }
  });

  // Delete a salary record
  app.delete("/api/admin/salaries/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSalary(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Create a new financial transaction
  app.post("/api/admin/transactions", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertFinancialTransactionSchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      // Preparar os dados para inserção, garantindo que a data seja um objeto Date
      const transactionData = {
        ...validatedData,
        // Converter a string de data para um objeto Date
        transactionDate: typeof validatedData.transactionDate === 'string' 
          ? new Date(validatedData.transactionDate) 
          : validatedData.transactionDate,
      };
      
      const transaction = await storage.createFinancialTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (err) {
      next(err);
    }
  });

  // Get financial transactions with filtering
  app.get("/api/admin/transactions", isAdmin, async (req, res, next) => {
    try {
      const { startDate, endDate, userId, type } = req.query;
      
      const filter = financialTransactionFilterSchema.parse({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as string | undefined,
      });
      
      const transactions = await storage.getFinancialTransactions(filter);
      res.json(transactions);
    } catch (err) {
      next(err);
    }
  });

  // Update a financial transaction
  app.put("/api/admin/transactions/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      const ipAddress = req.ip;
      
      const transaction = await storage.updateFinancialTransaction(
        id, 
        req.body, 
        adminId,
        ipAddress
      );
      
      res.json(transaction);
    } catch (err) {
      next(err);
    }
  });

  // Delete a financial transaction
  app.delete("/api/admin/transactions/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFinancialTransaction(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Export financial transactions as CSV
  app.get("/api/admin/export-transactions", isAdmin, async (req, res, next) => {
    try {
      const { startDate, endDate, userId, type } = req.query;
      
      const filter = financialTransactionFilterSchema.parse({
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        userId: userId ? parseInt(userId as string) : undefined,
        type: type as string | undefined,
      });
      
      const csvContent = await storage.exportFinancialTransactionsCSV(filter);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=financial-transactions.csv");
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  });
  
  // Get audit logs for an entity
  app.get("/api/admin/audit-logs/:entityType/:entityId", isAdmin, async (req, res, next) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getAuditLogs(entityType, parseInt(entityId));
      res.json(logs);
    } catch (err) {
      next(err);
    }
  });

  // === WORK SCHEDULE ROUTES ===

  // Criar jornada de trabalho
  app.post("/api/admin/work-schedules", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertWorkScheduleSchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      const schedule = await storage.createWorkSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // Obter todas as jornadas com filtro opcional
  app.get("/api/admin/work-schedules", isAdmin, async (req, res, next) => {
    try {
      const { type, name } = req.query;
      
      const filter = workScheduleFilterSchema.parse({
        type: type as string | undefined,
        name: name as string | undefined,
      });
      
      const schedules = await storage.getWorkSchedules(filter);
      res.json(schedules);
    } catch (err) {
      next(err);
    }
  });

  // Obter uma jornada específica
  app.get("/api/admin/work-schedules/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getWorkSchedule(id);
      
      if (!schedule) {
        return res.status(404).json({ message: "Jornada não encontrada" });
      }
      
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // Atualizar uma jornada
  app.put("/api/admin/work-schedules/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      
      const schedule = await storage.updateWorkSchedule(id, req.body, adminId);
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // Excluir uma jornada
  app.delete("/api/admin/work-schedules/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkSchedule(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // === WORK SCHEDULE DETAILS ROUTES ===

  // Criar detalhe de jornada
  app.post("/api/admin/work-schedule-details", isAdmin, async (req, res, next) => {
    try {
      // Validar os dados com o schema
      const validatedData = insertWorkScheduleDetailsSchema.parse(req.body);
      
      const detail = await storage.createWorkScheduleDetail(validatedData);
      res.status(201).json(detail);
    } catch (err) {
      next(err);
    }
  });

  // Obter detalhes de uma jornada
  app.get("/api/admin/work-schedules/:scheduleId/details", isAdmin, async (req, res, next) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const details = await storage.getWorkScheduleDetails(scheduleId);
      res.json(details);
    } catch (err) {
      next(err);
    }
  });

  // Atualizar um detalhe de jornada
  app.put("/api/admin/work-schedule-details/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const detail = await storage.updateWorkScheduleDetail(id, req.body);
      res.json(detail);
    } catch (err) {
      next(err);
    }
  });

  // Excluir um detalhe de jornada
  app.delete("/api/admin/work-schedule-details/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteWorkScheduleDetail(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // === EMPLOYEE SCHEDULE ROUTES ===

  // Atribuir jornada a um funcionário
  app.post("/api/admin/employee-schedules", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertEmployeeScheduleSchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      const employeeSchedule = await storage.createEmployeeSchedule(validatedData);
      res.status(201).json(employeeSchedule);
    } catch (err) {
      next(err);
    }
  });

  // Obter atribuições de jornada com filtro
  app.get("/api/admin/employee-schedules", isAdmin, async (req, res, next) => {
    try {
      const { userId, scheduleId, active } = req.query;
      
      const filter = employeeScheduleFilterSchema.parse({
        userId: userId ? parseInt(userId as string) : undefined,
        scheduleId: scheduleId ? parseInt(scheduleId as string) : undefined,
        active: active === 'true' ? true : active === 'false' ? false : undefined,
      });
      
      const employeeSchedules = await storage.getEmployeeSchedules(filter);
      res.json(employeeSchedules);
    } catch (err) {
      next(err);
    }
  });

  // Obter a jornada atual de um funcionário
  app.get("/api/admin/employee-schedules/current/:userId", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const schedule = await storage.getCurrentEmployeeSchedule(userId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Jornada atual não encontrada para este funcionário" });
      }
      
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // Obter a jornada atual de um funcionário (rota para o próprio funcionário)
  app.get("/api/employee-schedules/my-schedule", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const schedule = await storage.getCurrentEmployeeSchedule(userId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Você não possui uma jornada atribuída" });
      }
      
      // Obter também os detalhes da jornada
      const workSchedule = await storage.getWorkSchedule(schedule.scheduleId);
      const details = await storage.getWorkScheduleDetails(schedule.scheduleId);
      
      res.json({
        assignment: schedule,
        schedule: workSchedule,
        details: details
      });
    } catch (err) {
      next(err);
    }
  });

  // Atualizar uma atribuição de jornada
  app.put("/api/admin/employee-schedules/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      
      const schedule = await storage.updateEmployeeSchedule(id, req.body, adminId);
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  });

  // Excluir uma atribuição de jornada
  app.delete("/api/admin/employee-schedules/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEmployeeSchedule(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // === TIME BANK ROUTES ===

  // Criar entrada no banco de horas
  app.post("/api/admin/time-bank", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertTimeBankSchema.parse({
        ...req.body,
        createdBy: adminId,
      });
      
      const timeBankEntry = await storage.createTimeBank(validatedData);
      res.status(201).json(timeBankEntry);
    } catch (err) {
      next(err);
    }
  });

  // Obter entradas do banco de horas com filtro
  app.get("/api/admin/time-bank", isAdmin, async (req, res, next) => {
    try {
      const { userId, startDate, endDate, type, wasCompensated } = req.query;
      
      const filter = timeBankFilterSchema.parse({
        userId: userId ? parseInt(userId as string) : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        type: type as string | undefined,
        wasCompensated: wasCompensated === 'true' ? true : wasCompensated === 'false' ? false : undefined,
      });
      
      const entries = await storage.getTimeBankEntries(filter);
      res.json(entries);
    } catch (err) {
      next(err);
    }
  });

  // Obter banco de horas do funcionário atual
  app.get("/api/time-bank/my-balance", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Obter o saldo em minutos
      const balanceMinutes = await storage.getUserTimeBankBalance(userId);
      
      // Converter para formato mais amigável (horas e minutos)
      const hours = Math.floor(balanceMinutes / 60);
      const minutes = balanceMinutes % 60;
      
      // Obter as últimas 10 entradas
      const entries = await storage.getTimeBankEntries({
        userId,
        startDate: format(subMonths(new Date(), 3), 'yyyy-MM-dd') // Últimos 3 meses
      });
      
      res.json({
        balanceMinutes,
        formattedBalance: `${hours}h ${minutes}min`,
        recentEntries: entries.slice(0, 10) // Apenas as 10 mais recentes
      });
    } catch (err) {
      next(err);
    }
  });

  // Atualizar uma entrada do banco de horas
  app.put("/api/admin/time-bank/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      
      const entry = await storage.updateTimeBank(id, req.body, adminId);
      res.json(entry);
    } catch (err) {
      next(err);
    }
  });

  // Excluir uma entrada do banco de horas
  app.delete("/api/admin/time-bank/:id", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimeBankEntry(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Compensar horas do banco de horas
  app.post("/api/admin/time-bank/compensate", isAdmin, async (req, res, next) => {
    try {
      const adminId = (req.user as Express.User).id;
      const { userId, compensationDate, minutes, description } = req.body;
      
      // Validar campos obrigatórios
      if (!userId || !compensationDate || !minutes || !description) {
        return res.status(400).json({ message: "Todos os campos são obrigatórios" });
      }
      
      const success = await storage.compensateTimeBankHours(
        parseInt(userId),
        new Date(compensationDate),
        parseInt(minutes),
        description,
        adminId
      );
      
      if (success) {
        res.json({ message: "Horas compensadas com sucesso" });
      } else {
        res.status(400).json({ message: "Não foi possível compensar as horas" });
      }
    } catch (err) {
      next(err);
    }
  });

  // === ABSENCE REQUEST ROUTES ===

  // Criar solicitação de ausência
  app.post("/api/absence-requests", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      // Validar os dados com o schema
      const validatedData = insertAbsenceRequestSchema.parse({
        ...req.body,
        userId,
      });
      
      const request = await storage.createAbsenceRequest(validatedData);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  });

  // Obter solicitações de ausência com filtro (admin)
  app.get("/api/admin/absence-requests", isAdmin, async (req, res, next) => {
    try {
      const { userId, startDate, endDate, type, status } = req.query;
      
      const filter = absenceRequestFilterSchema.parse({
        userId: userId ? parseInt(userId as string) : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        type: type as string | undefined,
        status: status as "pending" | "approved" | "rejected" | undefined,
      });
      
      const requests = await storage.getAbsenceRequests(filter);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  // Obter solicitações de ausência do próprio usuário
  app.get("/api/absence-requests/mine", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      
      const requests = await storage.getAbsenceRequests({ userId });
      res.json(requests);
    } catch (err) {
      next(err);
    }
  });

  // Atualizar uma solicitação de ausência (proprietário)
  app.put("/api/absence-requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      // Verificar se o usuário é o proprietário da solicitação
      const requests = await storage.getAbsenceRequests({ userId });
      const request = requests.find(r => r.id === id);
      
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada ou você não tem permissão para editá-la" });
      }
      
      // Garantir que apenas o usuário correto possa editar
      if (request.userId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para editar esta solicitação" });
      }
      
      const updatedRequest = await storage.updateAbsenceRequest(id, req.body);
      res.json(updatedRequest);
    } catch (err) {
      next(err);
    }
  });

  // Excluir uma solicitação de ausência (proprietário)
  app.delete("/api/absence-requests/:id", isAuthenticated, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as Express.User).id;
      
      // Verificar se o usuário é o proprietário da solicitação
      const requests = await storage.getAbsenceRequests({ userId });
      const request = requests.find(r => r.id === id);
      
      if (!request) {
        return res.status(404).json({ message: "Solicitação não encontrada ou você não tem permissão para excluí-la" });
      }
      
      // Garantir que apenas o usuário correto possa excluir
      if (request.userId !== userId) {
        return res.status(403).json({ message: "Você não tem permissão para excluir esta solicitação" });
      }
      
      await storage.deleteAbsenceRequest(id);
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  });

  // Aprovar uma solicitação de ausência (admin)
  app.post("/api/admin/absence-requests/:id/approve", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      const { notes } = req.body;
      
      const request = await storage.approveAbsenceRequest(id, adminId, notes);
      res.json(request);
    } catch (err) {
      next(err);
    }
  });

  // Rejeitar uma solicitação de ausência (admin)
  app.post("/api/admin/absence-requests/:id/reject", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      const { notes } = req.body;
      
      const request = await storage.rejectAbsenceRequest(id, adminId, notes);
      res.json(request);
    } catch (err) {
      next(err);
    }
  });

  // === ENHANCED TIME RECORD ROUTES ===

  // Calcular horas trabalhadas em um período
  app.get("/api/admin/time-records/calculate/:userId", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Os parâmetros startDate e endDate são obrigatórios" });
      }
      
      const calculations = await storage.calculateWorkedHours(
        userId,
        startDate as string,
        endDate as string
      );
      
      // Adicionar versões formatadas para facilitar a exibição
      const formatted = {
        ...calculations,
        totalWorkedHours: Math.floor(calculations.totalWorkedMinutes / 60),
        totalWorkedMinutesRemainder: calculations.totalWorkedMinutes % 60,
        regularHours: Math.floor(calculations.regularMinutes / 60),
        regularMinutesRemainder: calculations.regularMinutes % 60,
        overtimeHours: Math.floor(calculations.overtimeMinutes / 60),
        overtimeMinutesRemainder: calculations.overtimeMinutes % 60,
        missingHours: Math.floor(calculations.missingMinutes / 60),
        missingMinutesRemainder: calculations.missingMinutes % 60,
        lateHours: Math.floor(calculations.lateMinutes / 60),
        lateMinutesRemainder: calculations.lateMinutes % 60,
      };
      
      res.json(formatted);
    } catch (err) {
      next(err);
    }
  });

  // Processar registro de ponto para o banco de horas
  app.post("/api/admin/time-records/:id/process-for-timebank", isAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const adminId = (req.user as Express.User).id;
      
      const success = await storage.processTimeRecordForTimeBank(id, adminId);
      
      if (success) {
        res.json({ message: "Registro processado com sucesso para o banco de horas" });
      } else {
        res.json({ message: "Registro já processado ou sem horas extras" });
      }
    } catch (err) {
      next(err);
    }
  });

  // Obter a jornada para a data atual (funcionário atual)
  app.get("/api/employee/today-schedule", isAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as Express.User).id;
      const today = new Date();
      
      const { schedule, detail } = await storage.getEmployeeWorkScheduleForDate(userId, today);
      
      if (!schedule || !detail) {
        return res.status(404).json({ message: "Jornada não encontrada para hoje" });
      }
      
      res.json({
        schedule,
        detail,
        expected: {
          startTime: detail.startTime,
          endTime: detail.endTime,
          breakStart: detail.breakStart,
          breakEnd: detail.breakEnd,
          isWorkDay: detail.isWorkDay
        }
      });
    } catch (err) {
      next(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
