import path from "node:path";
import { ensureDirectory, writeJsonFile } from "../utils/files.mjs";
import { toSlug } from "../utils/text.mjs";

export async function saveMovie(movie, projectRoot) {
  const outputFolder = path.join(projectRoot, "data", "saved-movies");
  await ensureDirectory(outputFolder);

  const movieSlug = toSlug(movie.title.display) || "untitled-movie";
  const fileName = `${movieSlug}-${movie.identifiers.tmdbId}.json`;
  const outputPath = path.join(outputFolder, fileName);

  await writeJsonFile(outputPath, movie);
  return { fileName, outputPath };
}
