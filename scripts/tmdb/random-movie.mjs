import { discoverMovies } from "../../src/tmdb/movies.mjs";

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // Run with: node .\scripts\tmdb\random-movie.mjs
  const filters = {
    primary_release_year: 2013,
    with_genres: "878,18",
    "vote_average.gte": 6,
    "vote_count.gte": 100,
    sort_by: "popularity.desc",
    page: 1,
  };

  const firstPage = await discoverMovies(filters);
  if (!firstPage.total_results) {
    console.log("No movies matched these filters.");
    return;
  }

  const maxPage = Math.min(firstPage.total_pages, 500);
  const selectedPage = randomInteger(1, maxPage);
  const pageData =
    selectedPage === 1 ? firstPage : await discoverMovies({ ...filters, page: selectedPage });

  const movies = pageData.results || [];
  const movie = movies[randomInteger(0, movies.length - 1)];

  console.log("RANDOM MOVIE");
  console.log("--------------------------------");
  console.log(`Title: ${movie.title}`);
  console.log(`TMDB ID: ${movie.id}`);
  console.log(`Release date: ${movie.release_date || "Unknown"}`);
  console.log(`Rating: ${movie.vote_average}`);
  console.log("");
  console.log("Overview:");
  console.log(movie.overview || "No overview is available.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
