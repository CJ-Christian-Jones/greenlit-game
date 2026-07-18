import { searchMoviesByTitle } from "../../src/tmdb/movies.mjs";
import { requireArgument } from "../../src/utils/validation.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\search-movies.mjs "Gravity"
  const movieTitle = requireArgument(
    process.argv[2],
    'Missing movie title. Example: node .\\scripts\\tmdb\\search-movies.mjs "Gravity"'
  );

  const data = await searchMoviesByTitle(movieTitle);
  const movies = data.results || [];

  console.log(`Found ${data.total_results} total matches.`);
  console.log("--------------------------------");

  movies.slice(0, 10).forEach((movie, index) => {
    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "Unknown year";
    console.log(`${index + 1}. ${movie.title}`);
    console.log(`   Year: ${releaseYear}`);
    console.log(`   TMDB ID: ${movie.id}`);
    console.log(`   Rating: ${movie.vote_average}`);
    console.log("");
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
