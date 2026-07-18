import { getTmdbAccessToken } from "../config/environment.mjs";
import { buildTmdbUrl } from "./urls.mjs";

export async function tmdbGet(pathname, query = {}) {
  const token = getTmdbAccessToken();
  const url = buildTmdbUrl(pathname, query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `TMDB request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json();
}
