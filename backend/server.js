import express from "express";
import "./env.js";
import cors from "cors";
import session from "express-session";
import { connectDB } from "./config/db.js";
import { setupPassport } from "./config/passport.js";
import routes from "./routes/index.js";
import { ensureAdminUser } from "./services/adminAccountService.js";

export const app = express();

if (process.env.NODE_ENV === "production") {
    if (!process.env.SESSION_SECRET || !process.env.JWT_SECRET) {
        console.error("CRITICAL: SESSION_SECRET or JWT_SECRET are missing in production. Halting process.");
        process.exit(1);
    }
}

app.use(cors({
    origin: true, // Allow all origins to send credentials
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "travel-ai-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        }
    })
);

setupPassport(app);
app.use("/api", routes);

app.use((err, req, res, next) => {
    console.error("Internal Server Error:", err);
    res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const PORT = parseInt(process.env.PORT || "5000", 10);

async function startServer() {
    try {
        await connectDB();
        await ensureAdminUser();

        if (process.env.NODE_ENV !== "test") {
            const server = app.listen(PORT, () => {
                console.log(`\x1b[32mOK\x1b[0m Server running and serving on port ${PORT}`);
            });

            server.on("error", (error) => {
                if (error.code === "EADDRINUSE") {
                    console.error(`\x1b[31mError: Port ${PORT} is already in use.\x1b[0m`);
                    console.error(`Please close any other processes using this port or change the PORT in your .env file.`);
                    process.exit(1);
                } else {
                    console.error("Server error:", error);
                    process.exit(1);
                }
            });
        }
    } catch (error) {
        console.error("Startup error:", error);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== "test") {
    startServer();
}
