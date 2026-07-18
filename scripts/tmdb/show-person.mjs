import { getPersonById } from "../../src/tmdb/people.mjs";
import { normalizePerson } from "../../src/movies/normalize-person.mjs";
import { requireArgument, requireNumericString } from "../../src/utils/validation.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\show-person.mjs 18277
  const personId = requireNumericString(
    requireArgument(
      process.argv[2],
      "Missing TMDB person ID. Example: node .\\scripts\\tmdb\\show-person.mjs 18277"
    ),
    "TMDB person ID"
  );

  const person = await getPersonById(personId, {
    append_to_response: "movie_credits",
    language: "en-US",
  });
  const normalized = normalizePerson(person);

  console.log(`Name: ${normalized.name}`);
  console.log(`TMDB person ID: ${normalized.personId}`);
  console.log(`Known for: ${normalized.knownForDepartment || "Unknown"}`);
  console.log(`Birthday: ${normalized.birthday || "Unknown"}`);
  console.log(`Place of birth: ${normalized.placeOfBirth || "Unknown"}`);
  console.log(`Popularity: ${normalized.popularity}`);
  console.log(`Acting movie credits: ${normalized.actingCredits}`);
  console.log(`Crew movie credits: ${normalized.crewCredits}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
