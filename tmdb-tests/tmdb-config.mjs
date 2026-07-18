// TMDB CONFIGURATION TEST
//
// This file retrieves TMDB's current image configuration.
//
// TMDB image URLs are built using:
//
// base URL + image size + image path
//
// Example:
//
// https://image.tmdb.org/t/p/
// +
// w500
// +
// /poster-file.jpg
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file:
//    node .\tmdb-tests\tmdb-config.mjs


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


// TMDB's configuration endpoint.
//
// This endpoint does not need a movie ID because it returns
// general settings used throughout the entire TMDB API.
const url = "https://api.themoviedb.org/3/configuration";


// Retrieve TMDB configuration information.
async function getTmdbConfiguration() {
  try {
    console.log("Retrieving TMDB configuration...");
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
    const configuration = await response.json();


    // Image-related settings are stored inside:
    //
    // configuration.images
    const images = configuration.images;


    console.log("IMAGE BASE URLS");
    console.log("--------------------------------");

    console.log(`Base URL: ${images.base_url}`);
    console.log(`Secure base URL: ${images.secure_base_url}`);

    console.log("");


    // join(", ") converts an array into readable text.
    //
    // Example:
    // ["w92", "w154", "w500"]
    //
    // becomes:
    // w92, w154, w500
    console.log("BACKDROP SIZES");
    console.log("--------------------------------");
    console.log(images.backdrop_sizes.join(", "));

    console.log("");


    console.log("LOGO SIZES");
    console.log("--------------------------------");
    console.log(images.logo_sizes.join(", "));

    console.log("");


    console.log("POSTER SIZES");
    console.log("--------------------------------");
    console.log(images.poster_sizes.join(", "));

    console.log("");


    console.log("PROFILE SIZES");
    console.log("--------------------------------");
    console.log(images.profile_sizes.join(", "));

    console.log("");


    console.log("STILL IMAGE SIZES");
    console.log("--------------------------------");
    console.log(images.still_sizes.join(", "));

    console.log("");


    console.log("SUPPORTED IMAGE FORMATS");
    console.log("--------------------------------");

    console.log(
      `Backdrop formats: ${images.backdrop_sizes.length} sizes`
    );

    console.log(
      `Poster formats: ${images.poster_sizes.length} sizes`
    );

    console.log(
      `Profile formats: ${images.profile_sizes.length} sizes`
    );


    // Print one example image prefix that can later be
    // combined with a poster path.
    //
    // Example output:
    // https://image.tmdb.org/t/p/w500
    const preferredPosterSize = images.poster_sizes.includes("w500")
      ? "w500"
      : images.poster_sizes[0];


    const examplePosterPrefix =
      `${images.secure_base_url}${preferredPosterSize}`;


    console.log("");
    console.log("EXAMPLE POSTER PREFIX");
    console.log("--------------------------------");

    console.log(examplePosterPrefix);
  } catch (error) {
    console.error("Could not retrieve TMDB configuration.");
    console.error(error.message);
  }
}


// Start the request.
getTmdbConfiguration();