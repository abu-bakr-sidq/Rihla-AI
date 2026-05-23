import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_FILES = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(__dirname, "..", ".env"),
  path.resolve(__dirname, "..", ".env.local"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, ".env.local")
];
const isQuoted = (value) => {
  if (value.length < 2) return false;
  const quote = value[0];
  return (quote === '"' || quote === "'") && value[value.length - 1] === quote;
};
for (const filePath of ENV_FILES) {
  if (!existsSync(filePath)) continue;
  const file = readFileSync(filePath, "utf8");
  for (const line of file.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key) {
      continue;
    }
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (isQuoted(value)) {
      value = value.slice(1, -1);
    }
    const existingValue = process.env[key];
    const shouldApply =
      !(key in process.env) ||
      existingValue == null ||
      (typeof existingValue === "string" && existingValue.trim() === "");

    if (shouldApply) {
      process.env[key] = value;
    }
  }
}
