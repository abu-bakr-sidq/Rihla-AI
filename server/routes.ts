import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { sendOTPEmail } from "./email";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { openai } from "./replit_integrations/audio/client";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate itinerary using OpenAI
async function generateItinerary(destination: string, days: number, budget: string, travelStyle: string, interests: string[]) {
  const prompt = `
    Create a highly detailed, professional, day-by-day travel itinerary for a ${days}-day trip to ${destination}.
    Budget: ${budget}
    Travel Style: ${travelStyle}
    Interests: ${interests.join(", ")}
    
    IMPORTANT: For each activity, you MUST provide "lat" and "lng" fields with valid numerical coordinates for that specific location in ${destination}.
    
    Respond STRICTLY in JSON format matching this schema:
    {
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival and Exploration",
          "activities": [
            { 
              "time": "Morning", 
              "title": "Check-in at Hotel", 
              "description": "Arrive and settle into your chosen accommodation.", 
              "location": "City Center, ${destination}",
              "lat": 0.0,
              "lng": 0.0
            }
          ]
        }
      ],
      "costBreakdown": {
        "accommodation": 500,
        "food": 300,
        "transport": 100,
        "activities": 200,
        "total": 1100,
        "currency": "USD"
      }
    }
    
    Ensure the JSON is perfectly valid, no markdown blocks, just raw JSON.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Failed to generate itinerary");
    
    return JSON.parse(content);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate itinerary");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized - Admin only" });
    }
    next();
  };
  
  // Set up authentication (express-session & passport)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "travel-ai-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const parsed = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(parsed.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists", field: "username" });
      }

      const existingEmail = await storage.getUserByEmail(parsed.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered", field: "email" });
      }

      const hashedPassword = await hashPassword(parsed.password);
      
      // First user becomes admin
      const allUsers = await storage.getAllUsers();
      const role = allUsers.length === 0 ? "admin" : "user";

      const user = await storage.createUser({
        username: parsed.username,
        email: parsed.email,
        password: hashedPassword,
        role
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      next(err);
    }
  });

  app.post(api.auth.forgotPassword.path, async (req, res) => {
    try {
      const { email } = api.auth.forgotPassword.input.parse(req.body);
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: "No account found with this email" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send Real Email
      const emailResult = await sendOTPEmail(email, otp);
      
      if (!emailResult.success) {
        return res.status(500).json({ message: "Failed to deliver verification code. Please try again." });
      }

      // Attach to storage for verification
      await storage.createOTP(email, otp);

      res.json({ 
        message: "Verification code has been dispatched to your email.",
        previewUrl: emailResult.previewUrl // Include previewUrl if available
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.resetPassword.path, async (req, res) => {
    try {
      const { email, otp, newPassword } = api.auth.resetPassword.input.parse(req.body);
      
      const isValid = await storage.getOTP(email, otp);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.deleteOTP(email);

      res.json({ message: "Password reset successful" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json(info);
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  app.post(api.auth.updatePassword.path, requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = api.auth.updatePassword.input.parse(req.body);
      const user = req.user as any;

      const isMatch = await comparePasswords(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password", field: "currentPassword" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.auth.updateProfile.path, requireAuth, async (req, res) => {
    try {
      const parsed = api.auth.updateProfile.input.parse(req.body);
      const user = req.user as any;

      const updated = await storage.updateUser(user.id, parsed);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Trips Routes
  app.get(api.trips.list.path, requireAuth, async (req, res) => {
    const trips = await storage.getUserTrips((req.user as any).id);
    res.json(trips);
  });

  app.get(api.trips.get.path, requireAuth, async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    // Optional: check if user owns the trip or is admin
    if (trip.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
       return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(trip);
  });

  app.post(api.trips.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.trips.create.input.parse(req.body);
      const trip = await storage.createTrip({
        ...input,
        userId: (req.user as any).id
      });
      res.status(201).json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.trips.generate.path, requireAuth, async (req, res) => {
    try {
      const input = api.trips.generate.input.parse(req.body);
      const generated = await generateItinerary(
        input.destination, 
        input.days, 
        input.budget, 
        input.travelStyle, 
        input.interests
      );
      res.json(generated);
    } catch (err) {
       res.status(500).json({ message: "Failed to generate itinerary" });
    }
  });

  app.put(api.trips.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.trips.update.input.parse(req.body);
      const tripId = Number(req.params.id);
      const existingTrip = await storage.getTrip(tripId);
      
      if (!existingTrip) {
        return res.status(404).json({ message: 'Trip not found' });
      }
      if (existingTrip.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
         return res.status(401).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateTrip(tripId, input);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete(api.trips.delete.path, requireAuth, async (req, res) => {
    const tripId = Number(req.params.id);
    const existingTrip = await storage.getTrip(tripId);
    
    if (!existingTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (existingTrip.userId !== (req.user as any).id && (req.user as any).role !== 'admin') {
        return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteTrip(tripId);
    res.status(204).send();
  });

  // Places routes
  app.get(api.places.list.path, async (req, res) => {
    const places = await storage.getPlaces();
    res.json(places);
  });

  app.post(api.places.create.path, requireAdmin, async (req, res) => {
    try {
      const input = api.places.create.input.parse(req.body);
      const place = await storage.createPlace(input);
      res.status(201).json(place);
    } catch (err) {
      res.status(400).json({ message: "Invalid place data" });
    }
  });

  app.delete(api.places.delete.path, requireAdmin, async (req, res) => {
    await storage.deletePlace(Number(req.params.id));
    res.status(204).send();
  });

  // Admin Routes
  app.get(api.admin.users.path, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get(api.admin.stats.path, requireAdmin, async (req, res) => {
    const users = await storage.getAllUsers();
    const trips = await storage.getAllTrips();
    const places = await storage.getPlaces();
    
    res.json({
      totalUsers: users.length,
      totalTrips: trips.length,
      totalPlaces: places.length,
      recentUsers: users.slice(0, 5),
      recentTrips: trips.slice(0, 5)
    });
  });

  app.patch(api.admin.updateUser.path, requireAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const parsed = api.admin.updateUser.input.parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const updated = await storage.updateUser(userId, parsed);
      res.json(updated);
    } catch (err) {
       res.status(400).json({ message: "Invalid update data" });
    }
  });

  app.delete(api.admin.deleteUser.path, requireAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get(api.admin.allTrips.path, requireAdmin, async (req, res) => {
    const trips = await storage.getAllTrips();
    res.json(trips);
  });

  return httpServer;
}
