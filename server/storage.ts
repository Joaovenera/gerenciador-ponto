import { 
  User, 
  InsertUser, 
  TimeRecord, 
  InsertTimeRecord, 
  TimeRecordFilter
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
}

// Import from the DatabaseStorage implementation
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
