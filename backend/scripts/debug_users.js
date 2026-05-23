import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/User.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1/AI-TP-Connection");
        console.log("Connected to MongoDB");

        const users = await User.find({}).select("+password");
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- ${u.email}: Role=${u.role}, HasPassword=${!!u.password}, GoogleId=${u.googleId}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
