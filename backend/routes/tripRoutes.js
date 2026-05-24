import express from "express";
import { createTrip, getUserTrips, getTripById, deleteTrip, deleteAllTrips, updateTrip, generateAITrip, getCacheStats } from "../controllers/tripController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/cache/stats", requireAuth, getCacheStats);
router.post("/generate",   requireAuth, generateAITrip);
router.post("/",           requireAuth, createTrip);
router.get("/",            requireAuth, getUserTrips);
router.get("/:id",         requireAuth, getTripById);
router.patch("/:id",       requireAuth, updateTrip);
router.delete("/",         requireAuth, deleteAllTrips);
router.delete("/:id",      requireAuth, deleteTrip);

export default router;
