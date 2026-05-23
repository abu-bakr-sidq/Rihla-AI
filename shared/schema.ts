import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  days: integer("days").notNull(),
  budget: text("budget").notNull(),
  travelStyle: text("travel_style").notNull(),
  interests: jsonb("interests").notNull(), // array of strings
  itinerary: jsonb("itinerary"), // day-by-day plan
  costBreakdown: jsonb("cost_breakdown"), 
  createdAt: timestamp("created_at").defaultNow(),
});

export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(), // City/Region
  category: text("category").notNull(), // Nature, Culture, Adventure, Food, Hotel
  rating: text("rating"),
  description: text("description"),
  lat: text("lat"),
  lng: text("lng"),
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true });
export const insertPlaceSchema = createInsertSchema(places).omit({ id: true });
export const insertOtpSchema = createInsertSchema(otps).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

// === HYBRID SCHEMAS (Mongoose & Drizzle Compatible) ===
export const userSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  _id: z.union([z.number(), z.string()]).optional(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
  profilePicture: z.string().optional(),
  preferences: z.record(z.any()).optional().default({}),
  createdAt: z.union([z.date(), z.string()]).optional(),
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;

export type GenerateTripRequest = {
  destination: string;
  days: number;
  budget: string;
  travelStyle: string;
  interests: string[];
};

export type GenerateTripResponse = {
  itinerary: any;
  costBreakdown: any;
};
