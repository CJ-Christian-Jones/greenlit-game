import { tmdbGet } from "./client.mjs";

export function getTmdbConfiguration() {
  return tmdbGet("/configuration");
}
