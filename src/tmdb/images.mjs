export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export function buildImageUrl(filePath, size, baseUrl = TMDB_IMAGE_BASE_URL) {
  if (!filePath) {
    return null;
  }

  return `${baseUrl}/${size}${filePath}`;
}
