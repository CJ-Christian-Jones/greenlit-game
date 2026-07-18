export function getYear(date) {
  if (!date) {
    return null;
  }

  const year = Number(date.slice(0, 4));
  return Number.isNaN(year) ? null : year;
}

export function toSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
