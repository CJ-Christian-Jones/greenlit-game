import { getMovieGenres } from "../../src/tmdb/genres.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\show-genres.mjs
  const data = await getMovieGenres();
  const genres = data.genres || [];

  console.log(`Total movie genres: ${genres.length}`);
  console.log("");
  console.log("MOVIE GENRES");
  console.log("--------------------------------");

  genres.forEach((genre, index) => {
    console.log(`${index + 1}. ${genre.name}`);
    console.log(`   Genre ID: ${genre.id}`);
    console.log("");
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
