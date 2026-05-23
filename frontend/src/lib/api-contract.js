import { z } from "zod";

const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

const userSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  _id: z.union([z.number(), z.string()]).optional(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(["user", "admin"]).default("user"),
  profilePicture: z.string().optional(),
  preferences: z.record(z.any()).optional().default({}),
  createdAt: z.union([z.date(), z.string()]).optional(),
});

const tripSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  userId: z.union([z.number(), z.string()]).optional(),
  destination: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  budget: z.string(),
  currency: z.string().optional(),
  travelStyle: z.string(),
  interests: z.array(z.string()),
  itinerary: z.any().optional(),
  costBreakdown: z.any().optional(),
  status: z.string().optional(),
  travelers: z.number().optional(),
  preferences: z.record(z.any()).optional(),
  createdAt: z.union([z.date(), z.string()]).optional(),
});

export const api = {
  auth: {
    login: {
      method: "POST",
      path: "/api/auth/login",
      input: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({
          user: userSchema,
          token: z.string().optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    register: {
      method: "POST",
      path: "/api/auth/register",
      input: z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        email: z.string().email(),
      }),
      responses: {
        201: userSchema,
        400: errorSchemas.validation,
      },
    },
    logout: {
      method: "POST",
      path: "/api/auth/logout",
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: "GET",
      path: "/api/auth/me",
      responses: {
        200: userSchema,
        401: errorSchemas.unauthorized,
      },
    },
    updatePassword: {
      method: "POST",
      path: "/api/auth/change-password",
      input: z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
      }),
      responses: {
        200: z.object({ message: z.string() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    updateProfile: {
      method: "PUT",
      path: "/api/auth/profile",
      input: z.object({
        username: z.string().min(3).optional(),
        email: z.string().email().optional(),
        profilePicture: z.string().optional(),
        preferences: z.record(z.any()).optional(),
      }),
      responses: {
        200: userSchema,
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    revokeSessions: {
      method: "POST",
      path: "/api/auth/revoke-sessions",
      responses: {
        200: z.object({ message: z.string() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  trips: {
    list: {
      method: "GET",
      path: "/api/trips",
      responses: {
        200: z.array(tripSchema),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET",
      path: "/api/trips/:id",
      responses: {
        200: tripSchema,
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: "POST",
      path: "/api/trips",
      input: z.object({
        destination: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        days: z.number(),
        budget: z.string(),
        currency: z.string().optional(),
        travelStyle: z.string(),
        interests: z.array(z.string()),
        travelers: z.number().optional(),
        status: z.string().optional(),
        preferences: z.any().optional(),
        itinerary: z.any().optional(),
        costBreakdown: z.any().optional(),
      }),
      responses: {
        201: tripSchema,
        401: errorSchemas.unauthorized,
      },
    },
    generate: {
      method: "POST",
      path: "/api/trips/generate",
      input: z.object({
        destination: z.string(),
        days: z.number(),
        budget: z.string(),
        travelStyle: z.string(),
        interests: z.array(z.string()),
      }),
      responses: {
        200: z.object({ itinerary: z.any(), costBreakdown: z.any() }),
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: "DELETE",
      path: "/api/trips/:id",
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: "PATCH",
      path: "/api/trips/:id",
      input: z.object({
        destination: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        days: z.number().optional(),
        budget: z.string().optional(),
        currency: z.string().optional(),
        travelStyle: z.string().optional(),
        interests: z.array(z.string()).optional(),
        travelers: z.number().optional(),
        status: z.string().optional(),
        preferences: z.any().optional(),
        itinerary: z.any().optional(),
        costBreakdown: z.any().optional(),
      }),
      responses: {
        200: tripSchema,
        404: errorSchemas.notFound,
      },
    },
  },
  admin: {
    users: {
      method: "GET",
      path: "/api/admin/users",
    },
    stats: {
      method: "GET",
      path: "/api/admin/stats",
    },
    updateUser: {
      method: "PATCH",
      path: "/api/admin/users/:id",
    },
    deleteUser: {
      method: "DELETE",
      path: "/api/admin/users/:id",
    },
    allTrips: {
      method: "GET",
      path: "/api/admin/trips",
    },
  },
};

export function buildUrl(path, params = {}) {
  let url = path;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });
  return url;
}
