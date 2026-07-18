// TMDB MOVIE GENRES TEST
//
// This file retrieves TMDB's official movie genre list.
//
// GreenLit will eventually use these genre IDs for:
// - Genre filter dropdowns
// - Random movie searches
// - First and second genre selection
// - Discovering movies by genre
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file:
//    node .\tmdb-tests\tmdb-genres.mjs


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


// TMDB endpoint for the official movie genre list.
const url =
  "https://api.themoviedb.org/3/genre/movie/list?language=en-US";


// Retrieve the movie genres.
async function getMovieGenres() {
  try {
    console.log("Retrieving TMDB movie genres...");
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


    // TMDB stores the genre list inside:
    //
    // data.genres
    //
    // Example:
    //
    // [
    //   { id: 28, name: "Action" },
    //   { id: 35, name: "Comedy" }
    // ]
    const genres = data.genres;


    // Make sure TMDB returned an array.
    if (!Array.isArray(genres)) {
      throw new Error("TMDB did not return a valid genre list.");
    }


    console.log(`Total movie genres: ${genres.length}`);
    console.log("");


    console.log("MOVIE GENRES");
    console.log("--------------------------------");


    // Print each official genre.
    genres.forEach((genre, index) => {
      console.log(`${index + 1}. ${genre.name}`);
      console.log(`   Genre ID: ${genre.id}`);
      console.log("");
    });


    // Create an object where the genre ID is the key.
    //
    // Example:
    //
    // {
    //   28: "Action",
    //   35: "Comedy"
    // }
    //
    // This will be useful when TMDB gives us only an array
    // of genre IDs in movie search results.
    const genreLookup = {};


    genres.forEach((genre) => {
      genreLookup[genre.id] = genre.name;
    });


    console.log("GENRE LOOKUP OBJECT");
    console.log("--------------------------------");

    console.log(genreLookup);
    console.log("");


    // Demonstrate how to translate genre IDs into names.
    //
    // Search results often contain something like:
    //
    // genre_ids: [18, 878, 53]
    const exampleGenreIds = [18, 878, 53];


    const exampleGenreNames = exampleGenreIds.map((genreId) => {
      return genreLookup[genreId] || `Unknown genre: ${genreId}`;
    });


    console.log("GENRE TRANSLATION EXAMPLE");
    console.log("--------------------------------");

    console.log(`IDs: ${exampleGenreIds.join(", ")}`);
    console.log(`Names: ${exampleGenreNames.join(", ")}`);
  } catch (error) {
    console.error("Could not retrieve movie genres.");
    console.error(error.message);
  }
}


// Start the request.
getMovieGenres();