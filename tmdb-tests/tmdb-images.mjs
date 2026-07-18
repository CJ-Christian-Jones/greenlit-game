// TMDB IMAGE URL TEST
//
// This file retrieves one movie and its credits,
// then turns TMDB image paths into complete image URLs.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file with a TMDB movie ID:
//    node .\tmdb-tests\tmdb-images.mjs 49047
//
// TMDB movie ID 49047 is Gravity.


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID from the terminal command.
//
// Example:
// node .\tmdb-images.mjs 49047
const movieId = process.argv[2];


// Stop if the token is missing.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");
  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// Stop if no movie ID was entered.
if (!movieId) {
  console.error("Missing TMDB movie ID.");
  console.error("Example: node .\\tmdb-images.mjs 49047");

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must be a number.");
  console.error("Example: node .\\tmdb-images.mjs 49047");

  process.exit(1);
}


// TMDB's image base URL.
//
// Later, we can retrieve this from TMDB's configuration endpoint.
// For this first image test, we are keeping it simple.
const imageBaseUrl = "https://image.tmdb.org/t/p";


// Choose image sizes.
//
// w500 means the image is resized to 500 pixels wide.
// w780 means the image is resized to 780 pixels wide.
const posterSize = "w500";
const backdropSize = "w780";
const profileSize = "w185";


// Build the movie request URL.
//
// append_to_response=credits tells TMDB to include
// the cast and crew in the same response.
const url =
  `https://api.themoviedb.org/3/movie/${movieId}` +
  `?append_to_response=credits` +
  `&language=en-US`;


// Build a complete TMDB image URL.
//
// Example:
//
// imageBaseUrl:
// https://image.tmdb.org/t/p
//
// size:
// w500
//
// filePath:
// /example.jpg
//
// result:
// https://image.tmdb.org/t/p/w500/example.jpg
function buildImageUrl(filePath, size) {
  // TMDB sometimes returns null when an image is unavailable.
  if (!filePath) {
    return null;
  }

  return `${imageBaseUrl}/${size}${filePath}`;
}


// Retrieve the movie and build its image URLs.
async function getMovieImages() {
  try {
    console.log(`Retrieving images for TMDB movie ID: ${movieId}`);
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
    const movie = await response.json();


    // Build the movie poster URL.
    const posterUrl = buildImageUrl(
      movie.poster_path,
      posterSize
    );


    // Build the movie backdrop URL.
    const backdropUrl = buildImageUrl(
      movie.backdrop_path,
      backdropSize
    );


    console.log("MOVIE IMAGES");
    console.log("--------------------------------");

    console.log(`Movie: ${movie.title}`);

    console.log(
      `Poster path: ${movie.poster_path || "None"}`
    );

    console.log(
      `Poster URL: ${posterUrl || "No poster available"}`
    );

    console.log("");

    console.log(
      `Backdrop path: ${movie.backdrop_path || "None"}`
    );

    console.log(
      `Backdrop URL: ${backdropUrl || "No backdrop available"}`
    );

    console.log("");


    // The credits were included through append_to_response.
    const cast = movie.credits?.cast || [];


    // Show image URLs for the first 10 cast members.
    const firstTenCastMembers = cast.slice(0, 10);


    console.log("CAST PROFILE IMAGES");
    console.log("--------------------------------");


    if (firstTenCastMembers.length === 0) {
      console.log("No cast members were found.");
      return;
    }


    firstTenCastMembers.forEach((person, index) => {
      const profileUrl = buildImageUrl(
        person.profile_path,
        profileSize
      );

      console.log(`${index + 1}. ${person.name}`);
      console.log(`   Character: ${person.character || "Unknown"}`);

      console.log(
        `   Profile path: ${person.profile_path || "None"}`
      );

      console.log(
        `   Profile URL: ${profileUrl || "No profile image available"}`
      );

      console.log("");
    });
  } catch (error) {
    console.error("Could not retrieve movie images.");
    console.error(error.message);
  }
}


// Start the request.
getMovieImages();