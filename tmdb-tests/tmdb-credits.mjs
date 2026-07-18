// TMDB MOVIE CREDITS TEST
//
// This file retrieves the cast and crew for one movie
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
//    node .\tmdb-tests\tmdb-credits.mjs 49047
//
// TMDB movie ID 49047 is Gravity.
//
// You can find movie IDs by running:
//    node .\tmdb-tests\tmdb-search.mjs "Gravity"


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID typed after the filename.
//
// Example:
// node .\tmdb-credits.mjs 49047
//
// process.argv[2] contains:
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


// Stop if no movie ID was entered.
if (!movieId) {
  console.error("Missing TMDB movie ID.");
  console.error("Example: node .\\tmdb-credits.mjs 49047");

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must be a number.");
  console.error("Example: node .\\tmdb-credits.mjs 49047");

  process.exit(1);
}


// Build the TMDB movie credits URL.
const url =
  `https://api.themoviedb.org/3/movie/${movieId}/credits` +
  `?language=en-US`;


// Retrieve the movie's cast and crew.
async function getMovieCredits() {
  try {
    console.log(`Retrieving credits for TMDB movie ID: ${movieId}`);
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
    const credits = await response.json();


    // The response contains two main arrays:
    //
    // credits.cast
    // credits.crew
    const cast = credits.cast;
    const crew = credits.crew;


    console.log(`Total cast members: ${cast.length}`);
    console.log(`Total crew credits: ${crew.length}`);
    console.log("");


    // Take the first 10 cast members.
    //
    // TMDB generally orders cast using the "order" field.
    const firstTenCastMembers = cast.slice(0, 10);


    console.log("MAIN CAST");
    console.log("--------------------------------");


    // Print the first 10 cast members.
    firstTenCastMembers.forEach((person, index) => {
      console.log(`${index + 1}. ${person.name}`);
      console.log(`   Character: ${person.character || "Unknown"}`);
      console.log(`   Person ID: ${person.id}`);
      console.log(`   Cast order: ${person.order}`);
      console.log(`   Profile path: ${person.profile_path || "None"}`);
      console.log("");
    });


    // Crew members can appear more than once because one person
    // may have several jobs on the same movie.
    //
    // Example:
    // A person could be both Writer and Producer.


    // Find the director.
    const directors = crew.filter(
      (person) => person.job === "Director"
    );


    // Find writers using common writing jobs.
    const writingJobs = [
      "Writer",
      "Screenplay",
      "Story",
      "Novel",
      "Characters",
    ];

    const writers = crew.filter((person) =>
      writingJobs.includes(person.job)
    );


    // Find producers using common producer jobs.
    const producerJobs = [
      "Producer",
      "Executive Producer",
      "Co-Producer",
      "Associate Producer",
    ];

    const producers = crew.filter((person) =>
      producerJobs.includes(person.job)
    );


    console.log("DIRECTOR");
    console.log("--------------------------------");

    if (directors.length === 0) {
      console.log("No director was listed.");
    } else {
      directors.forEach((person) => {
        console.log(`${person.name}`);
        console.log(`Person ID: ${person.id}`);
        console.log("");
      });
    }


    console.log("WRITERS");
    console.log("--------------------------------");

    if (writers.length === 0) {
      console.log("No writers were listed.");
    } else {
      writers.forEach((person) => {
        console.log(`${person.name}`);
        console.log(`Job: ${person.job}`);
        console.log(`Person ID: ${person.id}`);
        console.log("");
      });
    }


    console.log("PRODUCERS");
    console.log("--------------------------------");

    if (producers.length === 0) {
      console.log("No producers were listed.");
    } else {
      producers.forEach((person) => {
        console.log(`${person.name}`);
        console.log(`Job: ${person.job}`);
        console.log(`Person ID: ${person.id}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Could not retrieve movie credits.");
    console.error(error.message);
  }
}


// Start the request.
getMovieCredits();