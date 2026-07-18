import { tmdbGet } from "./client.mjs";

export function getMovieById(movieId, query = { language: "en-US" }) {
  return tmdbGet(`/movie/${movieId}`, query);
}

export function getMovieCreditsById(movieId, query = { language: "en-US" }) {
  return tmdbGet(`/movie/${movieId}/credits`, query);
}

export function searchMoviesByTitle(title, query = {}) {
  return tmdbGet("/search/movie", {
    query: title,
    include_adult: false,
    language: "en-US",
    page: 1,
    ...query,
  });
}

export function discoverMovies(query = {}) {
  return tmdbGet("/discover/movie", {
    include_adult: false,
    include_video: false,
    language: "en-US",
    page: 1,
    sort_by: "popularity.desc",
    ...query,
  });
}

export function getMovieWithAppend(movieId, sections = []) {
  return tmdbGet(`/movie/${movieId}`, {
    language: "en-US",
    append_to_response: sections.join(","),
  });
}
