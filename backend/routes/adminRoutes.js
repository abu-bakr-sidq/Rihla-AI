import express from "express";
import { getUsers, updateUser, deleteUser, getAllTrips, deleteTrip, getStats, getActivity } from "../controllers/adminController.js";
import { ensureAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(ensureAdmin);

router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/trips", getAllTrips);
router.delete("/trips/:id", deleteTrip);
router.get("/stats", getStats);
router.get("/activity", getActivity);

export default router;
