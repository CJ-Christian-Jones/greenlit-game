export function getTmdbAccessToken() {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'Missing TMDB_ACCESS_TOKEN. Set it first, for example: $env:TMDB_ACCESS_TOKEN="PASTE_YOUR_FULL_TOKEN_HERE"'
    );
  }

  return token;
}
