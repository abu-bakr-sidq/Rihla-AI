import express from "express";
import authRoutes from "./authRoutes.js";
import tripRoutes from "./tripRoutes.js";
import chatbotRoutes from "./chatbotRoutes.js";
import adminRoutes from "./adminRoutes.js";
import placeImageRoutes from "./placeImageRoutes.js";
import tourPackageRoutes from "./tourPackageRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/trips", tripRoutes);
router.use("/chat", chatbotRoutes);
router.use("/admin", adminRoutes);
router.use("/place-image", placeImageRoutes);
router.use("/tour-packages", tourPackageRoutes);

export default router;

