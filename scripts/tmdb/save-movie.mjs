import { getMovieWithAppend } from "../../src/tmdb/movies.mjs";
import { normalizeMovie } from "../../src/movies/normalize-movie.mjs";
import { saveMovie } from "../../src/movies/save-movie.mjs";
import { resolveProjectRootFromMeta } from "../../src/utils/files.mjs";
import { requireArgument, requireNumericString } from "../../src/utils/validation.mjs";

const appendedSections = ["credits", "keywords", "external_ids", "release_dates"];

async function main() {
  // Run with: node .\scripts\tmdb\save-movie.mjs 49047
  const movieId = requireNumericString(
    requireArgument(
      process.argv[2],
      "Missing TMDB movie ID. Example: node .\\scripts\\tmdb\\save-movie.mjs 49047"
    ),
    "TMDB movie ID"
  );

  const rawMovie = await getMovieWithAppend(movieId, appendedSections);
  const greenlitMovie = normalizeMovie(rawMovie);
  const projectRoot = resolveProjectRootFromMeta(import.meta.url);
  const saved = await saveMovie(greenlitMovie, projectRoot);

  console.log("MOVIE SAVED");
  console.log("--------------------------------");
  console.log(`Movie: ${greenlitMovie.title.display}`);
  console.log(`TMDB ID: ${greenlitMovie.identifiers.tmdbId}`);
  console.log(`Filename: ${saved.fileName}`);
  console.log(`Location: ${saved.outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
