import express from "express";
import passport from "passport";
import {
    register,
    login,
    logout,
    me,
    forgotPassword,
    resetPassword,
    googleStatus,
    isGoogleConfigured,
    updateProfile,
    changePassword,
    revokeSessions,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";


import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "travel-ai-jwt-secret";
const router = express.Router();

router.post("/register", register);
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
        req.logIn(user, (err) => {
            if (err) return next(err);
            return login(req, res, next);
        });
    })(req, res, next);
});
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/google/status", googleStatus);
router.post("/revoke-sessions", requireAuth, revokeSessions);

router.get("/google", (req, res, next) => {
    passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account" })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", { failureRedirect: "/auth?error=GoogleAuthFailed" }, (err, user) => {
        if (err || !user) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=google_failed`);
        }
        req.login(user, (loginErr) => {
            if (loginErr) return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?error=google_failed`);

            const token = jwt.sign(
                {
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    profilePicture: user.profilePicture
                },
                JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?token=${token}`);
        });
    })(req, res, next);
});

export default router;
