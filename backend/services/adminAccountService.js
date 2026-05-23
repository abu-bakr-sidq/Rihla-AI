import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

export const ADMIN_ACCOUNT = {
    username: "Rihla Admin",
    email: "Rihla.AI.Travel@gmail.com",
    password: "Rihla867",
    role: "admin",
};

export async function ensureAdminUser() {
    const email = ADMIN_ACCOUNT.email.toLowerCase();
    const existing = await User.findOne({ email }).select("+password");

    if (!existing) {
        const password = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);
        await User.create({
            username: ADMIN_ACCOUNT.username,
            email,
            password,
            role: ADMIN_ACCOUNT.role,
        });
    } else {
        const updates = {};
        const passwordMatches = existing.password
            ? await bcrypt.compare(ADMIN_ACCOUNT.password, existing.password)
            : false;

        if (existing.username !== ADMIN_ACCOUNT.username) {
            updates.username = ADMIN_ACCOUNT.username;
        }
        if (existing.role !== ADMIN_ACCOUNT.role) {
            updates.role = ADMIN_ACCOUNT.role;
        }
        if (!passwordMatches) {
            updates.password = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);
        }

        if (Object.keys(updates).length > 0) {
            await User.updateOne({ _id: existing._id }, { $set: updates });
        }
    }

    await User.updateMany(
        { email: { $ne: email }, role: "admin" },
        { $set: { role: "user" } }
    );

    return User.findOne({ email });
}
