import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { ADMIN_ACCOUNT, isAdminIdentity } from "../services/adminAccountService.js";

function getGoogleCallbackUrl() {
    const explicitCallback = String(process.env.GOOGLE_CALLBACK_URL || "").trim();
    if (/^https?:\/\//i.test(explicitCallback)) {
        return explicitCallback;
    }

    const backendBase = String(
        process.env.BACKEND_URL || "http://localhost:5000"
    ).replace(/\/+$/, "");

    return `${backendBase}/api/auth/google/callback`;
}

export function setupPassport(app) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        new LocalStrategy(
            { usernameField: "email" },
            async (email, password, done) => {
                try {
                    const normalizedEmail = String(email || "").trim().toLowerCase();
                    const user = await User.findOne({ email: normalizedEmail }).select("+password");
                    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
                        return done(null, false, { message: "Invalid email or password" });
                    }

                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || "PROVIDE_ME",
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || "PROVIDE_ME",
                callbackURL: getGoogleCallbackUrl(),
                scope: ["profile", "email"],
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value?.toLowerCase();
                    const profilePicture = profile.photos?.[0]?.value;
                    if (!email) return done(new Error("No email found in Google profile"));

                    let user = await User.findOne({ email });
                    if (!user) {
                        user = await User.create({
                            username: isAdminIdentity(email)
                                ? ADMIN_ACCOUNT.username
                                : (profile.displayName || email.split("@")[0]),
                            email,
                            googleId: profile.id,
                            profilePicture,
                            role: isAdminIdentity(email) ? "admin" : "user",
                        });
                    } else {
                        // Ensure Google image is captured even for users who registered via email first
                        let needsUpdate = false;
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            needsUpdate = true;
                        }
                        if (profilePicture && user.profilePicture !== profilePicture) {
                            user.profilePicture = profilePicture;
                            needsUpdate = true;
                        }
                        const desiredRole = isAdminIdentity(email) ? "admin" : user.role;
                        if (user.role !== desiredRole) {
                            user.role = desiredRole;
                            needsUpdate = true;
                        }
                        if (isAdminIdentity(email) && user.username !== ADMIN_ACCOUNT.username) {
                            user.username = ADMIN_ACCOUNT.username;
                            needsUpdate = true;
                        }
                        if (needsUpdate) {
                            await User.updateOne({ _id: user._id }, { 
                                $set: { 
                                    googleId: user.googleId, 
                                    profilePicture: user.profilePicture,
                                    role: user.role,
                                    username: user.username,
                                } 
                            });
                        }
                    }
                    return done(null, user);
                } catch (err) {
                    return done(err);
                }
            }
        )
    );

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}
