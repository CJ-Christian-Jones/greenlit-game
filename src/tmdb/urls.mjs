export const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export function buildTmdbUrl(pathname, query = {}) {
  const url = new URL(`${TMDB_BASE_URL}${pathname}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}
