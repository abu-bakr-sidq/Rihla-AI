import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

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
                callbackURL: (process.env.BACKEND_URL || "http://localhost:5000") + "/api/auth/google/callback",
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
                            username: profile.displayName || email.split("@")[0],
                            email,
                            googleId: profile.id,
                            profilePicture,
                            role: "user",
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
                        if (needsUpdate) {
                            await User.updateOne({ _id: user._id }, { 
                                $set: { 
                                    googleId: user.googleId, 
                                    profilePicture: user.profilePicture 
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
