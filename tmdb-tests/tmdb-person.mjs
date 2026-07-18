// TMDB PERSON DETAILS TEST
//
// This file retrieves information about one actor or crew member,
// along with their movie credits.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file with a TMDB person ID:
//    node .\tmdb-tests\tmdb-person.mjs 18277
//
// You can find a person's ID by running:
//    node .\tmdb-tests\tmdb-credits.mjs 49047
//
// The person ID shown above is just an example.
// Use any Person ID printed by your credits file.


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the person ID entered in the terminal.
//
// Example:
// node .\tmdb-person.mjs 18277
//
// process.argv[2] contains:
// "18277"
const personId = process.argv[2];


// Stop if the token is missing.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");
  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// Stop if no person ID was entered.
if (!personId) {
  console.error("Missing TMDB person ID.");
  console.error("Example: node .\\tmdb-person.mjs 18277");

  process.exit(1);
}


// Make sure the person ID contains only numbers.
if (!/^\d+$/.test(personId)) {
  console.error("The TMDB person ID must be a number.");
  console.error("Example: node .\\tmdb-person.mjs 18277");

  process.exit(1);
}


// Use append_to_response to request movie credits
// alongside the person's main details.
//
// This lets us get both sets of information
// with one API request.
const url =
  `https://api.themoviedb.org/3/person/${personId}` +
  `?append_to_response=movie_credits` +
  `&language=en-US`;


// Retrieve the person's information from TMDB.
async function getPersonDetails() {
  try {
    console.log(`Retrieving TMDB person ID: ${personId}`);
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
    const person = await response.json();


    console.log("PERSON DETAILS");
    console.log("--------------------------------");

    console.log(`Name: ${person.name}`);
    console.log(`TMDB person ID: ${person.id}`);

    console.log(
      `Known for: ${person.known_for_department || "Unknown"}`
    );

    console.log(
      `Birthday: ${person.birthday || "Unknown"}`
    );

    console.log(
      `Place of birth: ${person.place_of_birth || "Unknown"}`
    );

    console.log(
      `Profile path: ${person.profile_path || "None"}`
    );

    console.log(
      `Popularity: ${person.popularity}`
    );

    console.log("");


    // Some people may not have a biography.
    console.log("BIOGRAPHY");
    console.log("--------------------------------");

    if (person.biography) {
      console.log(person.biography);
    } else {
      console.log("No biography is available.");
    }

    console.log("");


    // Movie credits are included because we used:
    // append_to_response=movie_credits
    const movieCredits = person.movie_credits;


    // A person's movie credits contain two main arrays:
    //
    // movieCredits.cast
    // movieCredits.crew
    //
    // Actors usually have entries in cast.
    // Directors, writers, and producers usually have entries in crew.
    const castCredits = movieCredits.cast || [];
    const crewCredits = movieCredits.crew || [];


    console.log(`Acting movie credits: ${castCredits.length}`);
    console.log(`Crew movie credits: ${crewCredits.length}`);
    console.log("");


    // Sort acting credits by release date.
    //
    // Movies without release dates are placed last.
    const sortedActingCredits = [...castCredits].sort((a, b) => {
      const dateA = a.release_date || "";
      const dateB = b.release_date || "";

      return dateB.localeCompare(dateA);
    });


    // Show only the first 15 acting credits.
    const recentActingCredits = sortedActingCredits.slice(0, 15);


    console.log("RECENT ACTING CREDITS");
    console.log("--------------------------------");


    if (recentActingCredits.length === 0) {
      console.log("No acting movie credits were found.");
    } else {
      recentActingCredits.forEach((movie, index) => {
        const releaseYear = movie.release_date
          ? movie.release_date.slice(0, 4)
          : "Unknown year";

        console.log(`${index + 1}. ${movie.title}`);
        console.log(`   Year: ${releaseYear}`);
        console.log(`   Character: ${movie.character || "Unknown"}`);
        console.log(`   Movie ID: ${movie.id}`);
        console.log(`   Rating: ${movie.vote_average}`);
        console.log("");
      });
    }


    // Show the first 15 crew credits separately.
    const recentCrewCredits = [...crewCredits]
      .sort((a, b) => {
        const dateA = a.release_date || "";
        const dateB = b.release_date || "";

        return dateB.localeCompare(dateA);
      })
      .slice(0, 15);


    console.log("RECENT CREW CREDITS");
    console.log("--------------------------------");


    if (recentCrewCredits.length === 0) {
      console.log("No crew movie credits were found.");
    } else {
      recentCrewCredits.forEach((movie, index) => {
        const releaseYear = movie.release_date
          ? movie.release_date.slice(0, 4)
          : "Unknown year";

        console.log(`${index + 1}. ${movie.title}`);
        console.log(`   Year: ${releaseYear}`);
        console.log(`   Department: ${movie.department || "Unknown"}`);
        console.log(`   Job: ${movie.job || "Unknown"}`);
        console.log(`   Movie ID: ${movie.id}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Could not retrieve person details.");
    console.error(error.message);
  }
}


// Start the request.
getPersonDetails();