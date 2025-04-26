import { 
  User, 
  InsertUser, 
  TimeRecord, 
  InsertTimeRecord, 
  TimeRecordFilter
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { format, parse, parseISO } from "date-fns";

// Create memory storage for sessions
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
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
}

export class MemStorage implements IStorage {
  sessionStore: session.SessionStore;
  private users: Map<number, User>;
  private timeRecords: Map<number, TimeRecord>;
  private currentUserId: number;
  private currentTimeRecordId: number;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    this.users = new Map();
    this.timeRecords = new Map();
    this.currentUserId = 1;
    this.currentTimeRecordId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...userData, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    user.password = hashedPassword;
    this.users.set(id, user);
    return true;
  }

  async updateFirstLoginFlag(id: number, value: boolean): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    user.firstLogin = value;
    this.users.set(id, user);
    return true;
  }

  async checkAdminExists(): Promise<boolean> {
    return Array.from(this.users.values()).some(
      (user) => user.accessLevel === "admin",
    );
  }

  // Time record methods
  async createTimeRecord(recordData: InsertTimeRecord): Promise<TimeRecord> {
    const id = this.currentTimeRecordId++;
    const timestamp = new Date();
    
    const record: TimeRecord = {
      ...recordData,
      id,
      timestamp,
    };
    
    this.timeRecords.set(id, record);
    return record;
  }

  async getTimeRecords(filter: Partial<TimeRecordFilter>): Promise<TimeRecord[]> {
    let records = Array.from(this.timeRecords.values());
    
    // Apply filters
    if (filter.userId !== undefined) {
      records = records.filter(record => record.userId === filter.userId);
    }
    
    if (filter.type !== undefined) {
      records = records.filter(record => record.type === filter.type);
    }
    
    if (filter.startDate) {
      const startDate = parseISO(filter.startDate);
      records = records.filter(record => record.timestamp >= startDate);
    }
    
    if (filter.endDate) {
      const endDate = parseISO(filter.endDate);
      // Add one day to include the end date
      endDate.setDate(endDate.getDate() + 1);
      records = records.filter(record => record.timestamp < endDate);
    }
    
    // Sort by timestamp (newest first)
    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getUserStatus(userId: number): Promise<"in" | "out"> {
    const records = await this.getTimeRecords({ userId });
    
    if (records.length === 0) {
      return "out";
    }
    
    // Get the most recent record
    const latestRecord = records[0];
    return latestRecord.type === "in" ? "in" : "out";
  }

  async updateTimeRecord(id: number, recordData: Partial<TimeRecord>): Promise<TimeRecord> {
    const record = this.timeRecords.get(id);
    if (!record) throw new Error("Time record not found");
    
    const updatedRecord = { ...record, ...recordData };
    this.timeRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deleteTimeRecord(id: number): Promise<boolean> {
    return this.timeRecords.delete(id);
  }

  async exportTimeRecordsCSV(filter: Partial<TimeRecordFilter>): Promise<string> {
    const records = await this.getTimeRecords(filter);
    
    // CSV Header
    let csv = "ID,Usuário,Data,Hora,Tipo,Endereço IP,Latitude,Longitude,Manual,Justificativa,Criado Por\n";
    
    // Get all user names for reference
    const userMap = new Map<number, string>();
    this.users.forEach(user => {
      userMap.set(user.id, user.fullName);
    });
    
    // Add each record as a row
    for (const record of records) {
      const date = format(record.timestamp, "dd/MM/yyyy");
      const time = format(record.timestamp, "HH:mm:ss");
      const type = record.type === "in" ? "Entrada" : "Saída";
      const createdByName = userMap.get(record.createdBy) || `ID: ${record.createdBy}`;
      const userName = userMap.get(record.userId) || `ID: ${record.userId}`;
      
      csv += `${record.id},${userName},${date},${time},${type},${record.ipAddress},${record.latitude},${record.longitude},${record.isManual ? "Sim" : "Não"},${record.justification || ""},${createdByName}\n`;
    }
    
    return csv;
  }
}

export const storage = new MemStorage();
