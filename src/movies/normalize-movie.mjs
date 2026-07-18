import { buildImageUrl } from "../tmdb/images.mjs";
import { getYear } from "../utils/text.mjs";

const posterSize = "w500";
const backdropSize = "w780";
const profileSize = "w185";

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

    if (person.credit_id && !groupedPerson.creditIds.includes(person.credit_id)) {
      groupedPerson.creditIds.push(person.credit_id);
    }

    if (person.job && !groupedPerson.jobs.includes(person.job)) {
      groupedPerson.jobs.push(person.job);
    }

    if (person.department && !groupedPerson.departments.includes(person.department)) {
      groupedPerson.departments.push(person.department);
    }
  });

  return [...peopleById.values()];
}

function findCountryReleases(releaseGroups, countryCode) {
  const countryGroup = releaseGroups.find((group) => group.iso_3166_1 === countryCode);
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
    const match = releases.find(
      (release) => release.type === releaseType && release.certification
    );
    if (match) {
      return match.certification;
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
    profileUrl: buildImageUrl(person.profile_path, profileSize),
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
    profileUrl: buildImageUrl(person.profilePath, profileSize),
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

export function normalizeMovie(movie) {
  const cast = movie.credits?.cast || [];
  const crew = movie.credits?.crew || [];

  const writingJobs = ["Writer", "Screenplay", "Story", "Novel", "Characters"];
  const producerJobs = [
    "Producer",
    "Executive Producer",
    "Co-Producer",
    "Associate Producer",
  ];

  const directors = groupCrewByPerson(crew.filter((person) => person.job === "Director"));
  const writers = groupCrewByPerson(
    crew.filter((person) => writingJobs.includes(person.job))
  );
  const producers = groupCrewByPerson(
    crew.filter((person) => producerJobs.includes(person.job))
  );
  const completeCrew = groupCrewByPerson(crew);

  const releaseGroups = movie.release_dates?.results || [];
  const usReleases = findCountryReleases(releaseGroups, "US");

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
      genres: (movie.genres || []).map((genre) => ({ id: genre.id, name: genre.name })),
      productionCompanies: (movie.production_companies || []).map((company) => ({
        id: company.id,
        name: company.name,
        countryCode: company.origin_country || null,
        logoPath: company.logo_path || null,
        logoUrl: buildImageUrl(company.logo_path, "w185"),
      })),
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
      posterUrl: buildImageUrl(movie.poster_path, posterSize),
      backdropUrl: buildImageUrl(movie.backdrop_path, backdropSize),
    },
    people: {
      primaryCast: cast.slice(0, 5).map(normalizeCastMember),
      extendedCast: cast.slice(0, 20).map(normalizeCastMember),
      directors: directors.map(normalizeCrewMember),
      writers: writers.map(normalizeCrewMember),
      producers: producers.map(normalizeCrewMember),
      completeCrew: completeCrew.map(normalizeCrewMember),
    },
    keywords: (movie.keywords?.keywords || []).map((keyword) => ({
      id: keyword.id,
      name: keyword.name,
    })),
  };
}
