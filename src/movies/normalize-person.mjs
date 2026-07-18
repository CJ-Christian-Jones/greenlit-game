export function normalizePerson(person) {
  const movieCredits = person.movie_credits || {};

  return {
    personId: person.id,
    name: person.name,
    knownForDepartment: person.known_for_department || null,
    biography: person.biography || null,
    birthday: person.birthday || null,
    placeOfBirth: person.place_of_birth || null,
    profilePath: person.profile_path || null,
    popularity: person.popularity ?? null,
    actingCredits: (movieCredits.cast || []).length,
    crewCredits: (movieCredits.crew || []).length,
  };
}
