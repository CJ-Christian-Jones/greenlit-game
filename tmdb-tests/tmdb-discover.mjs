// TMDB MOVIE DISCOVER TEST
//
// This file finds movies using filters instead of a title search.
//
// GreenLit will eventually use this for:
// - Choosing a release year
// - Choosing one or more genres
// - Randomizing a movie
// - Removing obscure or poorly rated results
// - Sorting by popularity, rating, or release date
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run the file:
//
//    node .\tmdb-tests\tmdb-discover.mjs
//
// This first version uses filters written directly in the code.
// Later, we will let you type the filters into the terminal
// and eventually choose them in the GreenLit interface.


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Stop if the token is missing.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");

  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// --------------------------------------------------
// DISCOVER FILTERS
// --------------------------------------------------
//
// Change these values to test different searches.


// Find movies released during this year.
const releaseYear = 2013;


// TMDB genre IDs.
//
// 878 = Science Fiction
// 18  = Drama
//
// A comma means the movie must contain BOTH genres.
//
// Example:
// "878,18" means Science Fiction AND Drama.
//
// A pipe means either genre is acceptable.
//
// Example:
// "878|18" means Science Fiction OR Drama.
const genreIds = "878,18";


// Ignore movies below this average rating.
const minimumRating = 6;


// Ignore movies with fewer than this many votes.
//
// This prevents obscure movies with only one or two votes
// from appearing as highly rated results.
const minimumVoteCount = 100;


// Choose how TMDB sorts the movies.
//
// Common options:
//
// "popularity.desc"
// "popularity.asc"
// "vote_average.desc"
// "vote_average.asc"
// "primary_release_date.desc"
// "primary_release_date.asc"
// "revenue.desc"
const sortBy = "popularity.desc";


// Choose which page of results to request.
//
// TMDB usually returns up to 20 movies per page.
const page = 1;


// Include adult movies?
const includeAdult = false;


// Include video-only entries?
const includeVideo = false;


// --------------------------------------------------
// BUILD THE REQUEST URL
// --------------------------------------------------


// URLSearchParams safely builds query parameters.
//
// It handles details such as:
// - Equal signs
// - Ampersands
// - Commas
// - Pipes
// - Spaces
const parameters = new URLSearchParams({
  include_adult: includeAdult.toString(),
  include_video: includeVideo.toString(),
  language: "en-US",
  page: page.toString(),
  sort_by: sortBy,
  primary_release_year: releaseYear.toString(),
  with_genres: genreIds,
  "vote_average.gte": minimumRating.toString(),
  "vote_count.gte": minimumVoteCount.toString(),
});


// Build the complete TMDB discover URL.
const url =
  `https://api.themoviedb.org/3/discover/movie?${parameters.toString()}`;

discoverMovies();


// --------------------------------------------------
// DISCOVER MOVIES
// --------------------------------------------------


async function discoverMovies() {
  try {
    console.log("Discovering movies with these filters:");
    console.log("--------------------------------");

    console.log(`Release year: ${releaseYear}`);
    console.log(`Genre IDs: ${genreIds}`);
    console.log(`Minimum rating: ${minimumRating}`);
    console.log(`Minimum vote count: ${minimumVoteCount}`);
    console.log(`Sort order: ${sortBy}`);
    console.log(`Page: ${page}`);

    console.log("");
    console.log("Request URL:");
    console.log(url);

    console.log("");
    console.log("--------------------------------");


    // Send the request to TMDB.
    const response = await fetch(url, {
      method: "GET",

      headers: {
        Authorization: `Bearer ${tmdbToken}`,
        Accept: "application/json",
      },
    });


    // Check whether TMDB accepted the request.
    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `TMDB request failed: ${response.status} ${response.statusText}\n` +
        errorText
      );
    }


    // Convert TMDB's JSON response into a JavaScript object.
    const data = await response.json();


    // Discover results are stored inside data.results.
    const movies = data.results;


    if (!Array.isArray(movies)) {
      throw new Error("TMDB did not return a valid movie list.");
    }


    console.log(`Total matching movies: ${data.total_results}`);
    console.log(`Total result pages: ${data.total_pages}`);
    console.log(`Current page: ${data.page}`);
    console.log("");


    // Handle filters that return no matching movies.
    if (movies.length === 0) {
      console.log("No movies matched these filters.");
      console.log("Try lowering the rating or vote-count requirement.");
      return;
    }


    console.log("DISCOVERED MOVIES");
    console.log("--------------------------------");


    movies.forEach((movie, index) => {
      const releaseYear = movie.release_date
        ? movie.release_date.slice(0, 4)
        : "Unknown year";

      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   TMDB ID: ${movie.id}`);
      console.log(`   Release year: ${releaseYear}`);
      console.log(`   Rating: ${movie.vote_average}`);
      console.log(`   Vote count: ${movie.vote_count}`);
      console.log(`   Popularity: ${movie.popularity}`);

      console.log(
        `   Genre IDs: ${
          movie.genre_ids.length > 0
            ? movie.genre_ids.join(", ")
            : "None"
        }`
      );

      console.log(`   Poster path: ${movie.poster_path || "None"}`);
      console.log("");
    });
  } catch (error) {
    console.error("Could not discover movies.");
    console.error(error.message);
  }
}