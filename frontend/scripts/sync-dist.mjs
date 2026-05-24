import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.resolve(__dirname, "..", "dist");
const rootPublicDist = path.resolve(__dirname, "..", "..", "dist", "public");

if (!existsSync(frontendDist)) {
  throw new Error(`Frontend dist not found: ${frontendDist}`);
}

mkdirSync(rootPublicDist, { recursive: true });
cpSync(frontendDist, rootPublicDist, { recursive: true, force: true });

console.log(`Synced frontend build to ${rootPublicDist}`);
