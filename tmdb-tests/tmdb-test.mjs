// Get the private TMDB token from your computer's environment.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;

// Stop if no toek has been provided.
if (!tmdbToken) {
    console.error("No TMDB access token provided.");
    console.error("Set the token in PowerShell before running this file.");
    process.exit(1);
}

// TMDB movie ID 11 corresponds to the movie "Star Wars: Episode IV - A New Hope"
const movieID = 11;

// The adress of the TMDB movie-details endpoint.
const url = `https://api.themoviedb.org/3/movie/${movieID}?api_key=${tmdbToken}`;

async function getMovie() {
    try {
        // Send a GET request to TMDB.
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${tmdbToken}`,
                Accept: "application/json",
            },
        });

        // TMDB return errors (401, 404, etc.)
        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `TMDB request failed: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        // Convert TMDB's JSON into a Javascript object.
        const movie = await response.json();

        console.log("Successfully connected to TMDB.");
        console.log("--------------------------------");
        console.log(`Title: ${movie.title}`);
        console.log(`Release date: ${movie.release_date}`);
        console.log(`Runtime: ${movie.runtime} minutes`);
        console.log(`TMDB ID: ${movie.id}`);
        console.log(`Overview: ${movie.overview}`);
    } catch (error) {
        console.error("Could not retrieve the movie.");
        console.error(error.message);
    }
}

// start the request.
getMovie();

// HOW TO RUN THIS TMDB CONNECTION TEST AGAIN:
//
// 1. Open the VS Code terminal:
//    Terminal > New Terminal
//
// 2. Make sure the terminal is inside the folder containing tmdb-test.mjs.
//
// 3. Temporarily add your TMDB API Read Access Token to PowerShell:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 4. Press Enter.
//    PowerShell usually does not show a success message. That is normal.
//
// 5. Optional: Check that the token was saved:
//    $env:TMDB_ACCESS_TOKEN
//
// 6. Run this JavaScript file:
//    node .\tmdb-tests\tmdb-test.mjs
//
// 7. You should see movie information printed in the terminal.