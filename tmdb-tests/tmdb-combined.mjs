// TMDB COMBINED MOVIE DATA TEST
//
// This file retrieves several categories of movie data
// using one TMDB API request.
//
// It retrieves:
// - Main movie details
// - Cast and crew
// - Keywords
// - External IDs
// - Release dates and certifications
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file with a TMDB movie ID:
//    node .\tmdb-tests\tmdb-combined.mjs 49047
//
// TMDB movie ID 49047 is Gravity.


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID from the terminal command.
//
// Example:
// node .\tmdb-tests\tmdb-combined.mjs 49047
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

  console.error(
    "Example: node .\\tmdb-tests\\tmdb-combined.mjs 49047"
  );

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must be a number.");

  console.error(
    "Example: node .\\tmdb-tests\\tmdb-combined.mjs 49047"
  );

  process.exit(1);
}


// These are the extra movie endpoints we want TMDB
// to include in the movie-details response.
const appendedSections = [
  "credits",
  "keywords",
  "external_ids",
  "release_dates",
];


// Convert the array into comma-separated text.
//
// Result:
// credits,keywords,external_ids,release_dates
const appendToResponse = appendedSections.join(",");


// Safely build the query parameters.
const parameters = new URLSearchParams({
  language: "en-US",
  append_to_response: appendToResponse,
});


// Build the complete request URL.
const url =
  `https://api.themoviedb.org/3/movie/${movieId}` +
  `?${parameters.toString()}`;


//
// HELPER FUNCTIONS
//


// Format a number as US currency.
//
// Example:
// 1000000 becomes $1,000,000
function formatMoney(amount) {
  if (!amount) {
    return "Unknown";
  }

  return `$${amount.toLocaleString("en-US")}`;
}


// Convert a date into its year.
//
// Example:
// "2013-10-03" becomes "2013"
function getYear(date) {
  if (!date) {
    return "Unknown";
  }

  return date.slice(0, 4);
}


// Remove duplicate people based on their person ID.
//
// Crew data can contain the same person several times
// when that person performed multiple jobs.
function removeDuplicatePeople(people) {
  const peopleById = new Map();

  people.forEach((person) => {
    if (!peopleById.has(person.id)) {
      peopleById.set(person.id, person);
    }
  });

  return [...peopleById.values()];
}


// Find a specific country's release-date information.
//
// TMDB stores release-date groups by country code.
//
// "US" means United States.
function findCountryReleaseData(releaseDateGroups, countryCode) {
  return releaseDateGroups.find((group) => {
    return group.iso_3166_1 === countryCode;
  });
}


// Convert TMDB's release type number into readable text.
//
// TMDB release types:
//
// 1 = Premiere
// 2 = Limited theatrical
// 3 = Theatrical
// 4 = Digital
// 5 = Physical
// 6 = Television
function getReleaseTypeName(type) {
  const releaseTypes = {
    1: "Premiere",
    2: "Limited theatrical",
    3: "Theatrical",
    4: "Digital",
    5: "Physical",
    6: "Television",
  };

  return releaseTypes[type] || `Unknown type: ${type}`;
}


//
// RETRIEVE THE COMBINED MOVIE DATA
//


async function getCombinedMovieData() {
  try {
    console.log(`Retrieving combined data for movie ID: ${movieId}`);
    console.log("--------------------------------");

    console.log("Appended sections:");
    console.log(appendedSections.join(", "));

    console.log("");


    // Send one request to TMDB.
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


    //
    // MAIN MOVIE DETAILS
    //

    const genres = (movie.genres || [])
      .map((genre) => genre.name)
      .join(", ");


    console.log("MOVIE DETAILS");
    console.log("--------------------------------");

    console.log(`Title: ${movie.title}`);
    console.log(`Original title: ${movie.original_title}`);
    console.log(`TMDB ID: ${movie.id}`);
    console.log(`Release date: ${movie.release_date || "Unknown"}`);
    console.log(`Release year: ${getYear(movie.release_date)}`);
    console.log(`Runtime: ${movie.runtime ?? "Unknown"} minutes`);
    console.log(`Genres: ${genres || "Unknown"}`);
    console.log(`Budget: ${formatMoney(movie.budget)}`);
    console.log(`Revenue: ${formatMoney(movie.revenue)}`);
    console.log(`Rating: ${movie.vote_average}`);
    console.log(`Vote count: ${movie.vote_count}`);
    console.log(`Popularity: ${movie.popularity}`);
    console.log(`Status: ${movie.status || "Unknown"}`);
    console.log(`Poster path: ${movie.poster_path || "None"}`);
    console.log(`Backdrop path: ${movie.backdrop_path || "None"}`);

    console.log("");


    //
    // CAST
    //

    const cast = movie.credits?.cast || [];
    const mainCast = cast.slice(0, 10);


    console.log("MAIN CAST");
    console.log("--------------------------------");


    if (mainCast.length === 0) {
      console.log("No cast members were found.");
    } else {
      mainCast.forEach((person, index) => {
        console.log(`${index + 1}. ${person.name}`);
        console.log(`   Character: ${person.character || "Unknown"}`);
        console.log(`   Person ID: ${person.id}`);
        console.log(`   Cast order: ${person.order}`);
        console.log(`   Profile path: ${person.profile_path || "None"}`);
        console.log("");
      });
    }


    //
    // CREW
    //

    const crew = movie.credits?.crew || [];


    const directors = removeDuplicatePeople(
      crew.filter((person) => person.job === "Director")
    );


    const writingJobs = [
      "Writer",
      "Screenplay",
      "Story",
      "Novel",
      "Characters",
    ];


    const writers = removeDuplicatePeople(
      crew.filter((person) => {
        return writingJobs.includes(person.job);
      })
    );


    const producerJobs = [
      "Producer",
      "Executive Producer",
      "Co-Producer",
      "Associate Producer",
    ];


    const producers = removeDuplicatePeople(
      crew.filter((person) => {
        return producerJobs.includes(person.job);
      })
    );


    console.log("DIRECTORS");
    console.log("--------------------------------");


    if (directors.length === 0) {
      console.log("No directors were found.");
    } else {
      directors.forEach((person) => {
        console.log(`${person.name} — Person ID: ${person.id}`);
      });
    }


    console.log("");
    console.log("WRITERS");
    console.log("--------------------------------");


    if (writers.length === 0) {
      console.log("No writers were found.");
    } else {
      writers.forEach((person) => {
        console.log(
          `${person.name} — ${person.job} — Person ID: ${person.id}`
        );
      });
    }


    console.log("");
    console.log("PRODUCERS");
    console.log("--------------------------------");


    if (producers.length === 0) {
      console.log("No producers were found.");
    } else {
      producers.forEach((person) => {
        console.log(
          `${person.name} — ${person.job} — Person ID: ${person.id}`
        );
      });
    }


    //
    // KEYWORDS
    //

    const keywords = movie.keywords?.keywords || [];


    console.log("");
    console.log("KEYWORDS");
    console.log("--------------------------------");


    if (keywords.length === 0) {
      console.log("No keywords were found.");
    } else {
      const keywordNames = keywords.map((keyword) => keyword.name);
      console.log(keywordNames.join(", "));
    }


    //
    // EXTERNAL IDS
    //

    const externalIds = movie.external_ids || {};


    console.log("");
    console.log("EXTERNAL IDS");
    console.log("--------------------------------");

    console.log(`IMDb ID: ${externalIds.imdb_id || "None"}`);
    console.log(`Wikidata ID: ${externalIds.wikidata_id || "None"}`);
    console.log(`Facebook ID: ${externalIds.facebook_id || "None"}`);
    console.log(`Instagram ID: ${externalIds.instagram_id || "None"}`);
    console.log(`Twitter ID: ${externalIds.twitter_id || "None"}`);


    //
    // UNITED STATES RELEASE DATES
    //

    const releaseDateGroups = movie.release_dates?.results || [];

    const usReleaseData = findCountryReleaseData(
      releaseDateGroups,
      "US"
    );


    console.log("");
    console.log("UNITED STATES RELEASES");
    console.log("--------------------------------");


    if (!usReleaseData) {
      console.log("No United States release data was found.");
    } else {
      usReleaseData.release_dates.forEach((release, index) => {
        console.log(`${index + 1}. ${getReleaseTypeName(release.type)}`);
        console.log(`   Date: ${release.release_date || "Unknown"}`);
        console.log(`   Certification: ${release.certification || "None"}`);
        console.log(`   Note: ${release.note || "None"}`);
        console.log("");
      });
    }


    //
    // OVERVIEW
    //

    console.log("OVERVIEW");
    console.log("--------------------------------");

    console.log(movie.overview || "No overview is available.");
  } catch (error) {
    console.error("Could not retrieve combined movie data.");
    console.error(error.message);
  }
}


// Start the request.
getCombinedMovieData();