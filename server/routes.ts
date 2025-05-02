import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertTimeRecordSchema, timeRecordFilterSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

// Check if user has admin access
function isAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  if (req.user?.accessLevel !== "admin") return res.sendStatus(403);
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
      const userId = req.user!.id;
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

  // Get time records for logged in user with pagination
  app.get("/api/time-records/me", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 30;
      
      // Calculate date range based on page and pageSize
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - ((page - 1) * pageSize));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - pageSize);
      
      const filter = {
        userId,
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };
      
      // Get total count for pagination
      const totalRecords = await storage.getTimeRecordsCount({ userId });
      const totalPages = Math.ceil(totalRecords / pageSize);
      
      const records = await storage.getTimeRecords(filter);
      
      res.json({
        records,
        page,
        pageSize,
        totalPages,
        totalRecords
      });
    } catch (err) {
      next(err);
    }
  });

  // Get current status (in/out) for logged in user
  app.get("/api/time-records/status", isAuthenticated, async (req, res, next) => {
    try {
      const userId = req.user!.id;
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
      const adminId = req.user!.id;
      
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

  const httpServer = createServer(app);
  return httpServer;
}
