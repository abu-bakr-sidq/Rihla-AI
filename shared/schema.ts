import { pgTable, serial, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // 'user' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
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

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
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
