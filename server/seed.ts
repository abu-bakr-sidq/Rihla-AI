import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log("🌱 Seeding Drizzle Database...");
  
  const email = "jabubackersiddiq@gmail.com";
  const username = "Abubacker";
  const password = "Siddiq@867";
  
  const [existingEmail] = await db.select().from(users).where(eq(users.email, email));
  const [existingUser] = await db.select().from(users).where(eq(users.username, username));
  
  if (existingEmail || existingUser) {
    console.log("✔ Admin user already exists. Updating credentials...");
    const hashedPassword = await hashPassword(password);
    await db.update(users)
      .set({ 
        username, 
        email, 
        password: hashedPassword, 
        role: "admin",
        status: "active" 
      })
      .where(eq(users.id, (existingEmail || existingUser).id));
  } else {
    console.log("✔ Creating new Admin user...");
    const hashedPassword = await hashPassword(password);
    await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active"
    });
  }
  
  console.log("✅ Seed Complete.");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
