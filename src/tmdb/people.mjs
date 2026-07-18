import { tmdbGet } from "./client.mjs";

export function getPersonById(personId, query = { language: "en-US" }) {
  return tmdbGet(`/person/${personId}`, query);
}
