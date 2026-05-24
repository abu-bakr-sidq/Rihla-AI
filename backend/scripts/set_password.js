import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb://127.0.0.1/AI-TP-Connection";

const userSchema = new mongoose.Schema({
  email: String,
  password: { type: String, select: false },
});

const User = mongoose.model("UserSetter", userSchema, "users");

async function run() {
    try {
        await mongoose.connect(MONGODB_URI);
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash("siddiq867", salt);
        
        await User.updateOne({ email: "jabubackersiddiq@gmail.com" }, { $set: { password: hash } });
        console.log("Password set for jabubackersiddiq@gmail.com");
        
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

run();
