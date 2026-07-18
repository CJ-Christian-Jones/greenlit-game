import { getTmdbConfiguration } from "../../src/tmdb/configuration.mjs";

async function main() {
  // Run with: node .\scripts\tmdb\show-configuration.mjs
  const configuration = await getTmdbConfiguration();
  const images = configuration.images;

  console.log("IMAGE BASE URLS");
  console.log("--------------------------------");
  console.log(`Base URL: ${images.base_url}`);
  console.log(`Secure base URL: ${images.secure_base_url}`);
  console.log("");
  console.log("POSTER SIZES");
  console.log("--------------------------------");
  console.log(images.poster_sizes.join(", "));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
