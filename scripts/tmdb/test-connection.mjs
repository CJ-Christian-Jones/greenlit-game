import { getMovieById } from "../../src/tmdb/movies.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\test-connection.mjs
  const movie = await getMovieById(11);

  console.log("Successfully connected to TMDB.");
  console.log("--------------------------------");
  console.log(`Title: ${movie.title}`);
  console.log(`Release date: ${movie.release_date}`);
  console.log(`Runtime: ${movie.runtime} minutes`);
  console.log(`TMDB ID: ${movie.id}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
