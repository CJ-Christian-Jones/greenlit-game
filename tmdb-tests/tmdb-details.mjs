// TMDB MOVIE DETAILS TEST
//
// This file retrieves full information about one movie
// using its TMDB movie ID.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file with a TMDB movie ID:
//    node .\tmdb-tests\tmdb-details.mjs 49047
//
// TMDB movie ID 49047 is Gravity.
//
// You can get movie IDs by running:
//    node .\tmdb-search.mjs "Gravity"


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID from the terminal command.
//
// Example:
// node .\tmdb-details.mjs 49047
//
// process.argv[2] will contain:
// "49047"
const movieId = process.argv[2];


// Stop if the token is missing.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");
  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// Stop if the movie ID is missing.
if (!movieId) {
  console.error("Missing TMDB movie ID.");
  console.error("Example: node .\\tmdb-details.mjs 49047");

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must be a number.");
  console.error("Example: node .\\tmdb-details.mjs 49047");

  process.exit(1);
}


// Build the movie-details URL.
const url =
  `https://api.themoviedb.org/3/movie/${movieId}` +
  `?language=en-US`;


// Retrieve one movie from TMDB.
async function getMovieDetails() {
  try {
    console.log(`Retrieving TMDB movie ID: ${movieId}`);
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


    // Convert the JSON response into a JavaScript object.
    const movie = await response.json();


    // Turn the genres array into readable text.
    //
    // TMDB returns something like:
    // [
    //   { id: 18, name: "Drama" },
    //   { id: 878, name: "Science Fiction" }
    // ]
    //
    // This converts it into:
    // "Drama, Science Fiction"
    const genres = movie.genres
      .map((genre) => genre.name)
      .join(", ");


    // TMDB may not have a budget or revenue for every movie.
    const budget = movie.budget
      ? `$${movie.budget.toLocaleString()}`
      : "Unknown";

    const revenue = movie.revenue
      ? `$${movie.revenue.toLocaleString()}`
      : "Unknown";


    console.log(`Title: ${movie.title}`);
    console.log(`Original title: ${movie.original_title}`);
    console.log(`TMDB ID: ${movie.id}`);
    console.log(`Release date: ${movie.release_date}`);
    console.log(`Runtime: ${movie.runtime} minutes`);
    console.log(`Genres: ${genres}`);
    console.log(`Budget: ${budget}`);
    console.log(`Revenue: ${revenue}`);
    console.log(`Rating: ${movie.vote_average}`);
    console.log(`Vote count: ${movie.vote_count}`);
    console.log(`Popularity: ${movie.popularity}`);
    console.log(`Status: ${movie.status}`);
    console.log(`Original language: ${movie.original_language}`);
    console.log(`Poster path: ${movie.poster_path}`);
    console.log("");
    console.log("Overview:");
    console.log(movie.overview);
  } catch (error) {
    console.error("Could not retrieve movie details.");
    console.error(error.message);
  }
}


// Start the request.
getMovieDetails();