import { promises as fs } from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

const sourceRoot = path.resolve("frontend", "src");

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(fullPath);
      }
      return [fullPath];
    }),
  );
  return files.flat();
}

function getOutputPath(filePath) {
  if (filePath.endsWith(".tsx")) {
    return filePath.slice(0, -4) + ".jsx";
  }
  if (filePath.endsWith(".ts")) {
    return filePath.slice(0, -3) + ".js";
  }
  return null;
}

const allFiles = await walk(sourceRoot);
const tsFiles = allFiles.filter((filePath) => /\.(ts|tsx)$/.test(filePath) && !filePath.endsWith(".d.ts"));

for (const filePath of tsFiles) {
  const outputPath = getOutputPath(filePath);
  if (!outputPath) continue;

  const loader = filePath.endsWith(".tsx") ? "tsx" : "ts";
  const source = await fs.readFile(filePath, "utf8");
  const result = await transform(source, {
    loader,
    format: "esm",
    target: "es2020",
    jsx: "automatic",
  });

  await fs.writeFile(outputPath, result.code, "utf8");
  await fs.unlink(filePath);
}

console.log(`Converted ${tsFiles.length} frontend TS/TSX files to JS/JSX.`);
