// TMDB SAVE NORMALIZED MOVIE TEST
//
// This file:
// 1. Retrieves combined movie data from TMDB.
// 2. Normalizes it into GreenLit's preferred structure.
// 3. Saves that object as a local JSON file.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file using a TMDB movie ID:
//    node .\tmdb-tests\tmdb-save-json.mjs 49047
//
// The file will be saved inside:
//    saved-movies/


// Import Node's built-in file system tools.
import { mkdir, writeFile } from "node:fs/promises";


// Import tools for safely building file and folder paths.
import path from "node:path";


// Convert this file's URL into a normal Windows file path.
import { fileURLToPath } from "node:url";


// Read the private TMDB token from PowerShell.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID from the terminal.
const movieId = process.argv[2];


// Validate the token.
if (!tmdbToken) {
  console.error("Missing TMDB_ACCESS_TOKEN.");

  console.error(
    'Run: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
  );

  process.exit(1);
}


// Validate the movie ID.
if (!movieId) {
  console.error("Missing TMDB movie ID.");

  console.error(
    "Example: node .\\tmdb-tests\\tmdb-save-json.mjs 49047"
  );

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must contain only numbers.");

  process.exit(1);
}


// Find the location of this JavaScript file.
const currentFilePath = fileURLToPath(import.meta.url);


// Find the folder containing this JavaScript file.
//
// Result:
// greenlit-game/tmdb-tests
const currentFolder = path.dirname(currentFilePath);


// Move up one folder to the project root.
//
// Result:
// greenlit-game
const projectRoot = path.resolve(currentFolder, "..");


// Set the output folder.
//
// Result:
// greenlit-game/saved-movies
const outputFolder = path.join(
  projectRoot,
  "saved-movies"
);


// TMDB image settings.
const imageBaseUrl = "https://image.tmdb.org/t/p";

const posterSize = "w500";
const backdropSize = "w780";
const profileSize = "w185";


// Build the combined TMDB request.
const parameters = new URLSearchParams({
  language: "en-US",

  append_to_response: [
    "credits",
    "keywords",
    "external_ids",
    "release_dates",
  ].join(","),
});


const url =
  `https://api.themoviedb.org/3/movie/${movieId}` +
  `?${parameters.toString()}`;


//
// NORMALIZATION HELPERS
//


function buildImageUrl(filePath, size) {
  if (!filePath) {
    return null;
  }

  return `${imageBaseUrl}/${size}${filePath}`;
}


function getYear(date) {
  if (!date) {
    return null;
  }

  const year = Number(date.slice(0, 4));

  return Number.isNaN(year) ? null : year;
}


// Make text safe for use as a filename.
//
// Example:
// "Spider-Man: No Way Home"
//
// becomes:
// "spider-man-no-way-home"
function createFileSlug(text) {
  return text
    .toLowerCase()
    .trim()

    // Replace apostrophes with nothing.
    .replace(/['’]/g, "")

    // Replace groups of non-letter and non-number
    // characters with one hyphen.
    .replace(/[^a-z0-9]+/g, "-")

    // Remove hyphens from the beginning or end.
    .replace(/^-+|-+$/g, "");
}


// Combine all credits belonging to the same crew member.
function groupCrewByPerson(crewMembers) {
  const peopleById = new Map();


  crewMembers.forEach((person) => {
    if (!peopleById.has(person.id)) {
      peopleById.set(person.id, {
        id: person.id,
        name: person.name,
        originalName: person.original_name || person.name,
        gender: person.gender ?? null,
        popularity: person.popularity ?? null,
        profilePath: person.profile_path || null,

        creditIds: [],
        jobs: [],
        departments: [],
      });
    }


    const groupedPerson = peopleById.get(person.id);


    if (
      person.credit_id &&
      !groupedPerson.creditIds.includes(person.credit_id)
    ) {
      groupedPerson.creditIds.push(person.credit_id);
    }


    if (
      person.job &&
      !groupedPerson.jobs.includes(person.job)
    ) {
      groupedPerson.jobs.push(person.job);
    }


    if (
      person.department &&
      !groupedPerson.departments.includes(person.department)
    ) {
      groupedPerson.departments.push(person.department);
    }
  });


  return [...peopleById.values()];
}


function findCountryReleases(releaseGroups, countryCode) {
  const countryGroup = releaseGroups.find((group) => {
    return group.iso_3166_1 === countryCode;
  });


  return countryGroup?.release_dates || [];
}


function getReleaseTypeName(type) {
  const releaseTypes = {
    1: "premiere",
    2: "limited_theatrical",
    3: "theatrical",
    4: "digital",
    5: "physical",
    6: "television",
  };


  return releaseTypes[type] || "unknown";
}


function findUsCertification(releases) {
  const preferredReleaseTypes = [3, 2, 1, 4, 5, 6];


  for (const releaseType of preferredReleaseTypes) {
    const matchingRelease = releases.find((release) => {
      return (
        release.type === releaseType &&
        release.certification
      );
    });


    if (matchingRelease) {
      return matchingRelease.certification;
    }
  }


  return null;
}


function normalizeCastMember(person) {
  return {
    personId: person.id,
    creditId: person.credit_id || null,
    name: person.name,
    originalName: person.original_name || person.name,
    character: person.character || null,
    castOrder: person.order ?? null,
    gender: person.gender ?? null,
    popularity: person.popularity ?? null,

    profilePath: person.profile_path || null,

    profileUrl: buildImageUrl(
      person.profile_path,
      profileSize
    ),
  };
}


function normalizeCrewMember(person) {
  return {
    personId: person.id,
    name: person.name,
    originalName: person.originalName || person.name,

    creditIds: person.creditIds || [],
    jobs: person.jobs || [],
    departments: person.departments || [],

    gender: person.gender ?? null,
    popularity: person.popularity ?? null,

    profilePath: person.profilePath || null,

    profileUrl: buildImageUrl(
      person.profilePath,
      profileSize
    ),
  };
}


function normalizeRelease(release) {
  return {
    certification: release.certification || null,
    releaseDate: release.release_date || null,
    releaseType: release.type,
    releaseTypeName: getReleaseTypeName(release.type),
    note: release.note || null,
  };
}


// Convert the raw TMDB response into GreenLit's structure.
function normalizeMovie(movie) {
  const cast = movie.credits?.cast || [];
  const crew = movie.credits?.crew || [];


  const writingJobs = [
    "Writer",
    "Screenplay",
    "Story",
    "Novel",
    "Characters",
  ];


  const producerJobs = [
    "Producer",
    "Executive Producer",
    "Co-Producer",
    "Associate Producer",
  ];


  const directors = groupCrewByPerson(
    crew.filter((person) => person.job === "Director")
  );


  const writers = groupCrewByPerson(
    crew.filter((person) => {
      return writingJobs.includes(person.job);
    })
  );


  const producers = groupCrewByPerson(
    crew.filter((person) => {
      return producerJobs.includes(person.job);
    })
  );


  const completeCrew = groupCrewByPerson(crew);


  const releaseGroups = movie.release_dates?.results || [];

  const usReleases = findCountryReleases(
    releaseGroups,
    "US"
  );


  return {
    schemaVersion: 1,

    source: {
      provider: "tmdb",
      fetchedAt: new Date().toISOString(),
    },

    identifiers: {
      tmdbId: movie.id,
      imdbId: movie.external_ids?.imdb_id || null,
      wikidataId: movie.external_ids?.wikidata_id || null,
    },

    title: {
      display: movie.title,
      original: movie.original_title,
      tagline: movie.tagline || null,
    },

    description: {
      overview: movie.overview || null,
      homepage: movie.homepage || null,
    },

    release: {
      primaryDate: movie.release_date || null,
      primaryYear: getYear(movie.release_date),
      status: movie.status || null,
      originalLanguage: movie.original_language || null,
      countryCodes: movie.origin_country || [],

      usCertification: findUsCertification(usReleases),

      usReleases: usReleases.map(normalizeRelease),
    },

    production: {
      runtimeMinutes: movie.runtime ?? null,
      budget: movie.budget || null,
      revenue: movie.revenue || null,

      genres: (movie.genres || []).map((genre) => {
        return {
          id: genre.id,
          name: genre.name,
        };
      }),

      productionCompanies: (
        movie.production_companies || []
      ).map((company) => {
        return {
          id: company.id,
          name: company.name,
          countryCode: company.origin_country || null,
          logoPath: company.logo_path || null,

          logoUrl: buildImageUrl(
            company.logo_path,
            "w185"
          ),
        };
      }),
    },

    audienceData: {
      rating: movie.vote_average ?? null,
      voteCount: movie.vote_count ?? null,
      popularity: movie.popularity ?? null,
      adult: movie.adult ?? false,
    },

    images: {
      posterPath: movie.poster_path || null,
      backdropPath: movie.backdrop_path || null,

      posterUrl: buildImageUrl(
        movie.poster_path,
        posterSize
      ),

      backdropUrl: buildImageUrl(
        movie.backdrop_path,
        backdropSize
      ),
    },

    people: {
      primaryCast: cast
        .slice(0, 5)
        .map(normalizeCastMember),

      extendedCast: cast
        .slice(0, 20)
        .map(normalizeCastMember),

      directors: directors.map(normalizeCrewMember),
      writers: writers.map(normalizeCrewMember),
      producers: producers.map(normalizeCrewMember),
      completeCrew: completeCrew.map(normalizeCrewMember),
    },

    keywords: (movie.keywords?.keywords || []).map(
      (keyword) => {
        return {
          id: keyword.id,
          name: keyword.name,
        };
      }
    ),
  };
}


// Request the movie from TMDB.
async function requestMovie() {
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


// Save the normalized movie as JSON.
async function saveMovieJson() {
  try {
    console.log(`Retrieving TMDB movie ID: ${movieId}`);
    console.log("--------------------------------");


    const rawMovie = await requestMovie();

    const greenlitMovie = normalizeMovie(rawMovie);


    // Create the saved-movies folder if it does not exist.
    //
    // recursive: true means this will not fail when
    // the folder already exists.
    await mkdir(outputFolder, {
      recursive: true,
    });


    const movieSlug =
      createFileSlug(greenlitMovie.title.display) ||
      "untitled-movie";


    // Include the TMDB ID to prevent films with the
    // same title from overwriting one another.
    const fileName =
      `${movieSlug}-${greenlitMovie.identifiers.tmdbId}.json`;


    const outputPath = path.join(
      outputFolder,
      fileName
    );


    // Convert the object into formatted JSON.
    const jsonText =
      JSON.stringify(greenlitMovie, null, 2) + "\n";


    // Save the JSON using UTF-8 text encoding.
    await writeFile(
      outputPath,
      jsonText,
      "utf8"
    );


    console.log("MOVIE SAVED");
    console.log("--------------------------------");

    console.log(`Movie: ${greenlitMovie.title.display}`);
    console.log(`TMDB ID: ${greenlitMovie.identifiers.tmdbId}`);
    console.log(`Filename: ${fileName}`);
    console.log(`Location: ${outputPath}`);

    console.log("");
    console.log(
      `Cast saved: ${greenlitMovie.people.extendedCast.length}`
    );

    console.log(
      `Unique crew members saved: ` +
      `${greenlitMovie.people.completeCrew.length}`
    );
  } catch (error) {
    console.error("Could not save the movie.");
    console.error(error.message);
  }
}


// Start the process.
saveMovieJson();