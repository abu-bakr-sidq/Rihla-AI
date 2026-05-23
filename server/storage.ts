import { db } from "./db";
import { 
  users, trips, places, otps,
  type User, type InsertUser,
  type Trip, type InsertTrip,
  type Place, type InsertPlace
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(id: number, password: string): Promise<void>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  // OTPs
  createOTP(email: string, code: string): Promise<void>;
  getOTP(email: string, code: string): Promise<boolean>;
  deleteOTP(email: string): Promise<void>;

  // Trips
  getTrip(id: number): Promise<Trip | undefined>;
  getUserTrips(userId: number): Promise<Trip[]>;
  getAllTrips(): Promise<Trip[]>;
  createTrip(trip: InsertTrip & { userId: number }): Promise<Trip>;
  updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;

  // Places
  getPlaces(): Promise<Place[]>;
  createPlace(place: InsertPlace): Promise<Place>;
  deletePlace(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // --- Users ---
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
 
  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users)
      .set({ password })
      .where(eq(users.id, id));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // --- OTPs ---
  async createOTP(email: string, code: string): Promise<void> {
    // Delete any existing OTPs for this email first
    await this.deleteOTP(email);
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute expiry
    
    await db.insert(otps).values({
      email,
      code,
      expiresAt
    });
  }

  async getOTP(email: string, code: string): Promise<boolean> {
    const [otp] = await db.select()
      .from(otps)
      .where(and(eq(otps.email, email), eq(otps.code, code)));
    
    if (!otp) return false;
    
    // Check expiry
    const now = new Date();
    return now < otp.expiresAt;
  }

  async deleteOTP(email: string): Promise<void> {
    await db.delete(otps).where(eq(otps.email, email));
  }

  // --- Trips ---
  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getUserTrips(userId: number): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
  }

  async getAllTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(desc(trips.createdAt));
  }

  async createTrip(trip: InsertTrip & { userId: number }): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values(trip).returning();
    return newTrip;
  }

  async updateTrip(id: number, updates: Partial<InsertTrip>): Promise<Trip> {
    const [updatedTrip] = await db.update(trips)
      .set(updates)
      .where(eq(trips.id, id))
      .returning();
    return updatedTrip;
  }

  async deleteTrip(id: number): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  // --- Places ---
  async getPlaces(): Promise<Place[]> {
    return db.select().from(places);
  }

  async createPlace(place: InsertPlace): Promise<Place> {
    const [newPlace] = await db.insert(places).values(place).returning();
    return newPlace;
  }

  async deletePlace(id: number): Promise<void> {
    await db.delete(places).where(eq(places.id, id));
  }
}

export const storage = new DatabaseStorage();
