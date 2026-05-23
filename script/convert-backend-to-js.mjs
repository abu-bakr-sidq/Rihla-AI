import { promises as fs } from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const roots = [path.resolve("backend"), path.resolve("shared")];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return [fullPath];
    }),
  );
  return files.flat();
}

function outputPath(filePath) {
  if (filePath.endsWith(".ts")) return filePath.slice(0, -3) + ".js";
  return null;
}

let converted = 0;

for (const root of roots) {
  const files = await walk(root);
  const tsFiles = files.filter((f) => f.endsWith(".ts"));

  for (const filePath of tsFiles) {
    const out = outputPath(filePath);
    if (!out) continue;

    const source = await fs.readFile(filePath, "utf8");
    const result = await transform(source, {
      loader: "ts",
      format: "esm",
      target: "es2020",
    });

    await fs.writeFile(out, result.code, "utf8");
    await fs.unlink(filePath);
    converted += 1;
  }
}

// backend routes needs runtime path instead of tsconfig alias
const routesPath = path.resolve("backend", "routes.js");
let routes = await fs.readFile(routesPath, "utf8");
routes = routes.replace('from "@shared/routes";', 'from "../shared/routes.js";');
await fs.writeFile(routesPath, routes, "utf8");

// db file still references shared schema through alias
const dbPath = path.resolve("backend", "db.js");
let db = await fs.readFile(dbPath, "utf8");
db = db.replace('from "@shared/schema";', 'from "../shared/schema.js";');
await fs.writeFile(dbPath, db, "utf8");

console.log(`Converted ${converted} backend/shared TypeScript files to JavaScript.`);
