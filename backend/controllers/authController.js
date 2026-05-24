import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendOTPEmail } from "../services/emailService.js";

const JWT_SECRET = process.env.JWT_SECRET || "travel-ai-jwt-secret";

export function isGoogleConfigured() {
    const cid = process.env.GOOGLE_CLIENT_ID;
    const csec = process.env.GOOGLE_CLIENT_SECRET;
    return !!(
        cid &&
        csec &&
        cid !== "your_google_client_id_here" &&
        csec !== "your_google_client_secret_here" &&
        cid !== "PROVIDE_ME" &&
        csec !== "PROVIDE_ME"
    );
}

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const normalizedEmail = String(email || "").trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username: username,
            email: normalizedEmail,
            password: hashedPassword,
            role: "user"
        });

        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            preferences: user.preferences
        };
        res.status(201).json(safeUser);
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

export const login = (req, res, next) => {
    // Expected to be used next to passport.authenticate
    if (!req.user) return res.status(401).json({ message: "Authentication failed" });

    const safeUser = {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        preferences: req.user.preferences
    };

    const token = jwt.sign(
        {
            userId: req.user._id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            profilePicture: req.user.profilePicture
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.json({ user: safeUser, token });
};

export const logout = (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: "Logout failed" });
        res.json({ success: true });
    });
};

export const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // Fetch full user from DB to include fields not in JWT (like profilePicture/preferences)
        const userId = req.user._id || req.user.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const safeUser = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            preferences: user.preferences
        };
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { username, email, preferences, profilePicture } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (username) user.username = username;
        if (email) user.email = email;
        if (profilePicture !== undefined) user.profilePicture = profilePicture;
        if (preferences) user.preferences = { ...user.preferences, ...preferences };

        await user.save();

        const safeUser = { _id: user._id, username: user.username, email: user.email, role: user.role, profilePicture: user.profilePicture, preferences: user.preferences };
        res.json(safeUser);
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Current and new password are required" });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check current password if one exists (email users)
        if (user.password && !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: "Invalid current password" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User doesn't exist" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            return res.status(500).json({ message: "Unable to deliver verification code." });
        }

        await User.updateOne(
            { _id: user._id },
            { $set: { resetOTP: otp, resetOTPExpires: new Date(Date.now() + 15 * 60 * 1000) } }
        );

        return res.json({
            success: true,
            message: "Verification code dispatched.",
            previewUrl: emailResult.previewUrl || null,
        });
    } catch (err) {
        return res.status(500).json({ message: "Unable to start password reset" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const email = String(req.body?.email || "").trim().toLowerCase();
        const otp = String(req.body?.otp || "").trim();
        const newPassword = String(req.body?.newPassword || "");

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Email, code, and new password are required" });
        }

        const user = await User.findOne({
            email,
            resetOTP: otp,
            resetOTPExpires: { $gt: new Date() },
        }).select("+password +resetOTP +resetOTPExpires");

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired recovery code" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetOTP = null;
        user.resetOTPExpires = null;
        await user.save();

        return res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
        console.error("Reset error:", err);
        return res.status(500).json({ message: "Unable to reset password" });
    }
};

export const googleStatus = (_req, res) => {
    res.json({ available: isGoogleConfigured() });
};

export const revokeSessions = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        await user.save();
        
        res.json({ message: "All other sessions revoked successfully" });
    } catch (error) {
        console.error("Revoke sessions error:", error);
        res.status(500).json({ message: "Failed to revoke sessions" });
    }
};
