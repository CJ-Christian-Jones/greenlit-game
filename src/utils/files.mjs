import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function resolveProjectRootFromMeta(metaUrl) {
  const currentFile = fileURLToPath(metaUrl);
  const currentDir = path.dirname(currentFile);

  // scripts/tmdb/<file>.mjs -> project root
  return path.resolve(currentDir, "..", "..");
}

export async function ensureDirectory(directoryPath) {
  await mkdir(directoryPath, { recursive: true });
}

export async function writeJsonFile(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
