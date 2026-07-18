import { getMovieCreditsById } from "../../src/tmdb/movies.mjs";
import { requireArgument, requireNumericString } from "../../src/utils/validation.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\show-credits.mjs 49047
  const movieId = requireNumericString(
    requireArgument(
      process.argv[2],
      "Missing TMDB movie ID. Example: node .\\scripts\\tmdb\\show-credits.mjs 49047"
    ),
    "TMDB movie ID"
  );

  const credits = await getMovieCreditsById(movieId);
  const cast = credits.cast || [];
  const crew = credits.crew || [];

  console.log(`Total cast members: ${cast.length}`);
  console.log(`Total crew credits: ${crew.length}`);
  console.log("");
  console.log("MAIN CAST");
  console.log("--------------------------------");

  cast.slice(0, 10).forEach((person, index) => {
    console.log(`${index + 1}. ${person.name}`);
    console.log(`   Character: ${person.character || "Unknown"}`);
    console.log(`   Person ID: ${person.id}`);
    console.log("");
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
