import { discoverMovies } from "../../src/tmdb/movies.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\discover-movies.mjs
  const filters = {
    primary_release_year: 2013,
    with_genres: "878,18",
    "vote_average.gte": 6,
    "vote_count.gte": 100,
    sort_by: "popularity.desc",
    page: 1,
  };

  const data = await discoverMovies(filters);
  const movies = data.results || [];

  console.log(`Total matching movies: ${data.total_results}`);
  console.log(`Total result pages: ${data.total_pages}`);
  console.log("");
  console.log("DISCOVERED MOVIES");
  console.log("--------------------------------");

  movies.forEach((movie, index) => {
    const releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "Unknown year";
    console.log(`${index + 1}. ${movie.title}`);
    console.log(`   TMDB ID: ${movie.id}`);
    console.log(`   Release year: ${releaseYear}`);
    console.log(`   Rating: ${movie.vote_average}`);
    console.log("");
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
