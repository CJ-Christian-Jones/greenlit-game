// TMDB MOVIE NORMALIZATION TEST
//
// This file:
// 1. Retrieves a movie from TMDB.
// 2. Retrieves related credits, keywords, IDs, and release dates.
// 3. Converts TMDB's large response into a smaller GreenLit movie object.
//
// HOW TO RUN:
//
// 1. Open the VS Code terminal.
//
// 2. Add your TMDB API Read Access Token:
//    $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"
//
// 3. Run this file with a TMDB movie ID:
//    node .\tmdb-tests\tmdb-normalize.mjs 49047
//
// TMDB movie ID 49047 is Gravity.


// Read the TMDB token from the PowerShell environment.
const tmdbToken = process.env.TMDB_ACCESS_TOKEN;


// Read the movie ID from the terminal command.
//
// Example:
// node .\tmdb-tests\tmdb-normalize.mjs 49047
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

  console.error(
    "Example: node .\\tmdb-tests\\tmdb-normalize.mjs 49047"
  );

  process.exit(1);
}


// Make sure the movie ID contains only numbers.
if (!/^\d+$/.test(movieId)) {
  console.error("The TMDB movie ID must contain only numbers.");

  console.error(
    "Example: node .\\tmdb-tests\\tmdb-normalize.mjs 49047"
  );

  process.exit(1);
}


// TMDB's image base URL.
//
// We tested retrieving this through the configuration endpoint.
// For this normalization test, we use the known secure base URL.
const imageBaseUrl = "https://image.tmdb.org/t/p";


// Preferred image sizes for GreenLit.
const posterSize = "w500";
const backdropSize = "w780";
const profileSize = "w185";


// Extra data to attach to the movie-details request.
const appendedSections = [
  "credits",
  "keywords",
  "external_ids",
  "release_dates",
];


// Build the request parameters.
const parameters = new URLSearchParams({
  language: "en-US",
  append_to_response: appendedSections.join(","),
});


// Build the complete TMDB request URL.
const url =
  `https://api.themoviedb.org/3/movie/${movieId}` +
  `?${parameters.toString()}`;


//
// HELPER FUNCTIONS
//


// Build a complete TMDB image URL.
//
// TMDB may return null when an image is unavailable.
function buildImageUrl(filePath, size) {
  if (!filePath) {
    return null;
  }

  return `${imageBaseUrl}/${size}${filePath}`;
}


// Convert a date into a four-digit year.
//
// Example:
// "2013-10-03" becomes 2013
function getYear(date) {
  if (!date) {
    return null;
  }

  const year = Number(date.slice(0, 4));

  return Number.isNaN(year) ? null : year;
}


// Combine duplicate crew credits into one person object.
//
// A crew member can have several jobs on the same movie.
//
// Example:
// Alfonso Cuarón may appear as:
// - Director
// - Writer
// - Producer
//
// Instead of keeping three separate copies, this function creates:
//
// {
//   id: 11218,
//   name: "Alfonso Cuarón",
//   jobs: ["Director", "Writer", "Producer"],
//   departments: ["Directing", "Writing", "Production"]
// }
function groupCrewByPerson(crewMembers) {
  const peopleById = new Map();

  crewMembers.forEach((person) => {
    // Create the person the first time their ID appears.
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


    // Retrieve the existing grouped person.
    const groupedPerson = peopleById.get(person.id);


    // Save every unique credit ID.
    if (
      person.credit_id &&
      !groupedPerson.creditIds.includes(person.credit_id)
    ) {
      groupedPerson.creditIds.push(person.credit_id);
    }


    // Save every unique job.
    if (
      person.job &&
      !groupedPerson.jobs.includes(person.job)
    ) {
      groupedPerson.jobs.push(person.job);
    }


    // Save every unique department.
    if (
      person.department &&
      !groupedPerson.departments.includes(person.department)
    ) {
      groupedPerson.departments.push(person.department);
    }
  });


  return [...peopleById.values()];
}


// Find one country's release records.
//
// "US" represents the United States.
function findCountryReleases(releaseGroups, countryCode) {
  const countryGroup = releaseGroups.find((group) => {
    return group.iso_3166_1 === countryCode;
  });

  return countryGroup?.release_dates || [];
}


// Convert TMDB's numbered release type into text.
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


// Find the preferred US certification.
//
// We prioritize a normal theatrical release,
// followed by limited theatrical, premiere, and other types.
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


// Normalize one cast member.
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


// Normalize one crew member.
// Normalize one grouped crew member.
//
// The person mays have several jobs and departments.
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


// Normalize one release record.
function normalizeRelease(release) {
  return {
    certification: release.certification || null,
    releaseDate: release.release_date || null,
    releaseType: release.type,
    releaseTypeName: getReleaseTypeName(release.type),
    note: release.note || null,
  };
}


// Convert the full TMDB response into a GreenLit movie object.
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


 // Group each category by person so nobody loses additional jobs.
const directors = groupCrewByPerson(
  crew.filter((person) => {
    return person.job === "Director";
  })
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


// Keep a complete grouped crew list as well.
//
// This lets GreenLit access cinematographers, editors,
// composers, costume designers, and other departments later.
const completeCrew = groupCrewByPerson(crew);


  // Find United States release information.
  const releaseGroups = movie.release_dates?.results || [];

  const usReleases = findCountryReleases(
    releaseGroups,
    "US"
  );


  // Return the new GreenLit movie shape.
  return {
    source: "tmdb",

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

      productionCountries: (
        movie.production_countries || []
      ).map((country) => {
        return {
          countryCode: country.iso_3166_1,
          name: country.name,
        };
      }),

      spokenLanguages: (
        movie.spoken_languages || []
      ).map((language) => {
        return {
          languageCode: language.iso_639_1,
          englishName: language.english_name,
          name: language.name,
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
      // GreenLit currently has five casting slots,
      // so we save the first five cast members separately.
      primaryCast: cast
        .slice(0, 5)
        .map(normalizeCastMember),

      // Keep more cast members available in case the game expands.
      extendedCast: cast
        .slice(0, 20)
        .map(normalizeCastMember),

        directors: directors.map(normalizeCrewMember),
        writers: writers.map(normalizeCrewMember),
        producers: producers.map(normalizeCrewMember),

        // This may be a large array, but it preserves the full crew
        // without storing the same person repeatedly.
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

    collection: movie.belongs_to_collection
      ? {
          id: movie.belongs_to_collection.id,
          name: movie.belongs_to_collection.name,
          posterPath:
            movie.belongs_to_collection.poster_path || null,
          backdropPath:
            movie.belongs_to_collection.backdrop_path || null,
        }
      : null,
  };
}


// Retrieve data from TMDB.
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


// Run the normalization test.
async function runNormalizationTest() {
  try {
    console.log(`Retrieving TMDB movie ID: ${movieId}`);
    console.log("--------------------------------");


    // Retrieve the original large TMDB response.
    const rawMovie = await requestMovie();


    // Convert it into GreenLit's smaller structure.
    const greenlitMovie = normalizeMovie(rawMovie);


    console.log("NORMALIZED GREENLIT MOVIE");
    console.log("--------------------------------");


    // JSON.stringify converts the JavaScript object
    // into formatted JSON text.
    //
    // null means no custom replacer is being used.
    // 2 means indent each level by two spaces.
    console.log(
      JSON.stringify(greenlitMovie, null, 2)
    );


    console.log("");
    console.log("NORMALIZATION SUMMARY");
    console.log("--------------------------------");

    console.log(
      `Movie: ${greenlitMovie.title.display}`
    );

    console.log(
      `Primary cast members: ` +
      `${greenlitMovie.people.primaryCast.length}`
    );

    console.log(
      `Directors: ${greenlitMovie.people.directors.length}`
    );

    console.log(
      `Genres: ${greenlitMovie.production.genres.length}`
    );

    console.log(
      `Keywords: ${greenlitMovie.keywords.length}`
    );

    console.log(
      `US certification: ` +
      `${greenlitMovie.release.usCertification || "Unknown"}`
    );
  } catch (error) {
    console.error("Could not normalize the movie.");
    console.error(error.message);
  }
}


// Start the test.
runNormalizationTest();