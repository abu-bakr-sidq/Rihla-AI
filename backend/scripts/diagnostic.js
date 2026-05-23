import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb://127.0.0.1/AI-TP-Connection";

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: { type: String, select: false },
  role: String,
});

const User = mongoose.model("UserDiagnostic", userSchema, "users");

async function check() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const allUsers = await User.find({}).select("+password");
        console.log(`\nAll users in database (${allUsers.length}):`);
        allUsers.forEach(u => {
            console.log(`- ${u.email}: Role=${u.role}, HasPassword=${!!u.password}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
