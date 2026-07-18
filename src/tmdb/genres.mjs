import { tmdbGet } from "./client.mjs";

export function getMovieGenres(query = { language: "en-US" }) {
  return tmdbGet("/genre/movie/list", query);
}
