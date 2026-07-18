import { getMovieById } from "../../src/tmdb/movies.mjs";
import { requireArgument, requireNumericString } from "../../src/utils/validation.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\show-movie.mjs 49047
  const movieId = requireNumericString(
    requireArgument(
      process.argv[2],
      "Missing TMDB movie ID. Example: node .\\scripts\\tmdb\\show-movie.mjs 49047"
    ),
    "TMDB movie ID"
  );

  const movie = await getMovieById(movieId);
  const genres = (movie.genres || []).map((genre) => genre.name).join(", ");

  console.log(`Title: ${movie.title}`);
  console.log(`Original title: ${movie.original_title}`);
  console.log(`TMDB ID: ${movie.id}`);
  console.log(`Release date: ${movie.release_date}`);
  console.log(`Runtime: ${movie.runtime} minutes`);
  console.log(`Genres: ${genres}`);
  console.log(`Rating: ${movie.vote_average}`);
  console.log(`Vote count: ${movie.vote_count}`);
  console.log(`Popularity: ${movie.popularity}`);
  console.log(`Poster path: ${movie.poster_path}`);
  console.log("");
  console.log("Overview:");
  console.log(movie.overview);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
