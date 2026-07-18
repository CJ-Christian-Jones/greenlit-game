// TMDB RANDOM MOVIE TEST
//
// This file selects one random movie that matches
// a set of TMDB Discover filters.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file:
//    node .\tmdb-tests\tmdb-random.mjs
//
// This version keeps the filters inside the code.
// Later, GreenLit will get them from player controls.


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
// RANDOM MOVIE FILTERS
// --------------------------------------------------


// Find movies released during this year.
const releaseYear = 2013;


// TMDB genre IDs.
//
// 878 = Science Fiction
// 18  = Drama
//
// A comma means AND:
// "878,18" means Science Fiction AND Drama.
//
// A pipe means OR:
// "878|18" means Science Fiction OR Drama.
const genreIds = "878,18";


// Ignore movies below this rating.
const minimumRating = 6;


// Ignore movies with fewer than this many votes.
const minimumVoteCount = 100;


// Sort the matching results.
//
// Using popularity.desc does not directly determine
// which movie gets selected.
//
// It determines how TMDB divides the results into pages.
const sortBy = "popularity.desc";


// Do not include adult titles.
const includeAdult = false;


// Do not include video-only entries.
const includeVideo = false;


// TMDB allows page numbers from 1 through 500.
//
// Even if more than 500 result pages exist,
// we cannot request a page above 500.
const maximumTmdbPage = 500;


// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------


// Return a random whole number between min and max,
// including both endpoints.
//
// Example:
// randomInteger(1, 5)
// could return 1, 2, 3, 4, or 5.
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Build the Discover request URL for a particular page.
function buildDiscoverUrl(page) {
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

  return (
    "https://api.themoviedb.org/3/discover/movie?" +
    parameters.toString()
  );
}


// Send one authenticated request to TMDB.
//
// This helper prevents us from repeating the same
// fetch and error-handling code twice.
async function requestTmdb(url) {
  const response = await fetch(url, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${tmdbToken}`,
      Accept: "application/json",
    },
  });


  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `TMDB request failed: ${response.status} ${response.statusText}\n` +
      errorText
    );
  }


  return response.json();
}


// --------------------------------------------------
// SELECT A RANDOM MOVIE
// --------------------------------------------------


async function getRandomMovie() {
  try {
    console.log("Finding a random movie with these filters:");
    console.log("--------------------------------");

    console.log(`Release year: ${releaseYear}`);
    console.log(`Genre IDs: ${genreIds}`);
    console.log(`Minimum rating: ${minimumRating}`);
    console.log(`Minimum vote count: ${minimumVoteCount}`);
    console.log(`Sort order: ${sortBy}`);

    console.log("");


    // First, request page 1.
    //
    // We need this request to learn:
    // - How many movies match
    // - How many pages exist
    const firstPageUrl = buildDiscoverUrl(1);
    const firstPageData = await requestTmdb(firstPageUrl);


    console.log(`Total matching movies: ${firstPageData.total_results}`);
    console.log(`Total matching pages: ${firstPageData.total_pages}`);


    // Stop if no movies matched the filters.
    if (
      firstPageData.total_results === 0 ||
      firstPageData.results.length === 0
    ) {
      console.log("");
      console.log("No movies matched these filters.");
      console.log("Try loosening one or more filters.");
      return;
    }


    // Never request a page above TMDB's maximum page number.
    const highestUsablePage = Math.min(
      firstPageData.total_pages,
      maximumTmdbPage
    );


    // Choose a random result page.
    const randomPage = randomInteger(1, highestUsablePage);


    console.log(`Randomly selected page: ${randomPage}`);
    console.log("");


    // We already retrieved page 1.
    //
    // If page 1 was selected, reuse that data instead of
    // making the same API request again.
    let randomPageData;

    if (randomPage === 1) {
      randomPageData = firstPageData;
    } else {
      const randomPageUrl = buildDiscoverUrl(randomPage);
      randomPageData = await requestTmdb(randomPageUrl);
    }


    const movies = randomPageData.results;


    // This should be unusual, but protects us in case
    // the selected page unexpectedly contains no movies.
    if (!Array.isArray(movies) || movies.length === 0) {
      throw new Error(
        `TMDB page ${randomPage} did not contain any movies.`
      );
    }


    // Choose a random position in the page's movie array.
    //
    // Arrays start at index 0, so the highest valid index is:
    // movies.length - 1
    const randomMovieIndex = randomInteger(
      0,
      movies.length - 1
    );


    const movie = movies[randomMovieIndex];


    const movieReleaseYear = movie.release_date
      ? movie.release_date.slice(0, 4)
      : "Unknown year";


    console.log("RANDOM MOVIE");
    console.log("--------------------------------");

    console.log(`Title: ${movie.title}`);
    console.log(`TMDB ID: ${movie.id}`);
    console.log(`Release date: ${movie.release_date || "Unknown"}`);
    console.log(`Release year: ${movieReleaseYear}`);
    console.log(`Rating: ${movie.vote_average}`);
    console.log(`Vote count: ${movie.vote_count}`);
    console.log(`Popularity: ${movie.popularity}`);

    console.log(
      `Genre IDs: ${
        movie.genre_ids.length > 0
          ? movie.genre_ids.join(", ")
          : "None"
      }`
    );

    console.log(`Poster path: ${movie.poster_path || "None"}`);

    console.log("");
    console.log("Overview:");
    console.log(movie.overview || "No overview is available.");

    console.log("");
    console.log(
      `Selected result ${randomMovieIndex + 1} from page ${randomPage}.`
    );
  } catch (error) {
    console.error("Could not select a random movie.");
    console.error(error.message);
  }
}


// Start the random movie selection.
getRandomMovie();