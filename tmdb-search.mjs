// TMDB MOVIE SEARCH TEST
//
// This file searches TMDB using a movie title.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB token to the current PowerShell session:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file and place a movie title after the filename:
//    node .\tmdb-search.mjs "Gravity"


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// process.argv contains the terminal command used to run this file.
//
// Example:
// node .\tmdb-search.mjs "Gravity"
//
// process.argv[0] = location of Node
// process.argv[1] = location of this file
// process.argv[2] = "Gravity"
const movieTitle = process.argv[2];


// Stop if the token is missing.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");
  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// Stop if the user did not enter a movie title.
if (!movieTitle) {
  console.error("Missing movie title.");
  console.error('Example: node .\\tmdb-search.mjs "Gravity"');

  process.exit(1);
}


// Prepare the movie title for use inside a URL.
//
// Example:
// "The Batman" becomes "The%20Batman"
const encodedTitle = encodeURIComponent(movieTitle);


// Build the TMDB movie-search URL.
const url =
  `https://api.themoviedb.org/3/search/movie` +
  `?query=${encodedTitle}` +
  `&include_adult=false` +
  `&language=en-US` +
  `&page=1`;


// Search TMDB for movies matching the title.
async function searchMovies() {
  try {
    console.log(`Searching TMDB for: "${movieTitle}"`);
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


    // The movie matches are stored in data.results.
    const movies = data.results;


    // Handle a search with no matches.
    if (movies.length === 0) {
      console.log("No matching movies were found.");
      return;
    }


    console.log(`Found ${data.total_results} total matches.`);
    console.log("Showing the first 10:");
    console.log("--------------------------------");


    // Take only the first 10 movies from the results.
    const firstTenMovies = movies.slice(0, 10);


    // Print each movie.
    firstTenMovies.forEach((movie, index) => {
      // Some movies may not have a release date.
      const releaseYear = movie.release_date
        ? movie.release_date.slice(0, 4)
        : "Unknown year";

      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   Year: ${releaseYear}`);
      console.log(`   TMDB ID: ${movie.id}`);
      console.log(`   Rating: ${movie.vote_average}`);
      console.log("");
    });
  } catch (error) {
    console.error("Could not search for movies.");
    console.error(error.message);
  }
}


// Start the search.
searchMovies();