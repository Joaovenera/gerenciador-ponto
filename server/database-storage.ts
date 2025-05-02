import { 
  User, 
  InsertUser, 
  TimeRecord, 
  InsertTimeRecord, 
  TimeRecordFilter,
  users,
  timeRecords
} from "@shared/schema";
import { IStorage } from "./storage";
import { db, pool } from "./db";
import { eq, and, gte, lt, desc } from "drizzle-orm";
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
    const result = await db.update(timeRecords)
      .set(recordData)
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
}