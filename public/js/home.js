/**
 * home.js
 *
 * Drives the GreenLit home page:
 *   - TMDB API key modal (saves token to localStorage)
 *   - Live TMDB data fetch (popular / discover / now-playing)
 *   - Hero carousel (auto-advance, prev/next, dot indicators)
 *   - Recommendation rows built from live API data
 *   - All movies guaranteed to have a real poster_path before display
 *   - onerror fallback hides any card whose image still fails to load
 */

'use strict';

// ============================================================
// 1. Constants
// ============================================================

const STORAGE_KEY      = 'TMDB_ACCESS_TOKEN';
const TMDB_API_BASE    = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE  = 'https://image.tmdb.org/t/p';
const POSTER_SIZE      = 'w500';
const BACKDROP_SIZE    = 'w1280';
const ADVANCE_MS       = 7000;

// Number of movies to show per recommendation row
const ROW_MOVIE_COUNT  = 10;
// Number of slides in the hero carousel
const HERO_SLIDE_COUNT = 5;


// ============================================================
// 2. Token helpers
// ============================================================

export function getTmdbToken() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

function buildImageUrl(path, size) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}


// ============================================================
// 3. TMDB API client (browser-native fetch)
// ============================================================

async function tmdbFetch(pathname, query = {}) {
  const token = getTmdbToken();
  const url   = new URL(`${TMDB_API_BASE}${pathname}`);

  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Normalise a raw TMDB movie object into our display shape.
// Returns null if the movie has no poster — callers must filter those out.
function normalizeMovie(raw) {
  if (!raw.poster_path) return null;

  return {
    id:         raw.id,
    title:      raw.title || raw.original_title || 'Untitled',
    tagline:    raw.tagline || null,
    year:       raw.release_date ? Number(raw.release_date.slice(0, 4)) : null,
    runtime:    raw.runtime || null,
    rating:     raw.vote_average ?? 0,
    genres:     (raw.genres || []).map((g) => g.name),
    overview:   raw.overview || '',
    posterUrl:  buildImageUrl(raw.poster_path, POSTER_SIZE),
    backdropUrl: buildImageUrl(raw.backdrop_path, BACKDROP_SIZE),
  };
}


// ============================================================
// 4. Data fetching
// ============================================================

async function fetchHeroMovies() {
  // Use the top popular movies; each is fetched with full details
  // so we get runtime, tagline, and genres.
  const data   = await tmdbFetch('/movie/popular', { language: 'en-US', page: 1 });
  const movies = (data.results || []).filter((m) => m.poster_path && m.backdrop_path);

  // Fetch full details in parallel for the first HERO_SLIDE_COUNT movies
  const detailRequests = movies.slice(0, HERO_SLIDE_COUNT * 2).map((m) =>
    tmdbFetch(`/movie/${m.id}`, { language: 'en-US' }).catch(() => null)
  );

  const details = (await Promise.all(detailRequests))
    .filter(Boolean)
    .map(normalizeMovie)
    .filter(Boolean)
    .slice(0, HERO_SLIDE_COUNT);

  return details;
}

async function fetchRowMovies(endpoint, query = {}) {
  const data   = await tmdbFetch(endpoint, { language: 'en-US', page: 1, ...query });
  const movies = (data.results || [])
    .map(normalizeMovie)
    .filter(Boolean)          // removes any without poster_path
    .slice(0, ROW_MOVIE_COUNT);

  return movies;
}

async function fetchAllRows() {
  const [newReleases, classics, topRated] = await Promise.all([
    // New Releases — movies currently in theatres
    fetchRowMovies('/movie/now_playing').catch(() => []),

    // Classics — highly rated movies released before 1995
    fetchRowMovies('/discover/movie', {
      sort_by:                     'vote_average.desc',
      'vote_count.gte':            1000,
      'primary_release_date.lte':  '1994-12-31',
    }).catch(() => []),

    // Popular Right Now — overall trending (week)
    fetchRowMovies('/trending/movie/week').catch(() => []),
  ]);

  return [
    { title: 'Now Playing',       movies: newReleases },
    { title: 'Classics',          movies: classics    },
    { title: 'Popular Right Now', movies: topRated    },
  ].filter((row) => row.movies.length > 0);
}


// ============================================================
// 5. Hero Carousel
// ============================================================

const heroTrack = document.getElementById('heroTrack');
const heroDots  = document.getElementById('heroDots');
const heroPrev  = document.getElementById('heroPrev');
const heroNext  = document.getElementById('heroNext');
const heroEl    = document.querySelector('.hero-carousel');

let currentSlide = 0;
let totalSlides  = 0;
let autoAdvance;

function buildSlide(movie) {
  const slide = document.createElement('div');
  slide.className = 'hero-slide';
  slide.style.backgroundImage = `url('${movie.backdropUrl || movie.posterUrl}')`;

  const ratingText = movie.rating ? movie.rating.toFixed(1) : 'N/A';
  const runtimeText = movie.runtime ? `${movie.runtime} min` : '';
  const genreText  = (movie.genres || []).slice(0, 2).join(', ');

  slide.innerHTML = `
    <div class="hero-slide__overlay-side"   aria-hidden="true"></div>
    <div class="hero-slide__overlay-bottom" aria-hidden="true"></div>
    <div class="hero-slide__content">
      <h1 class="hero-slide__title">${movie.title}</h1>
      <p class="hero-slide__meta">
        ${movie.year ? `<span>${movie.year}</span><span class="hero-slide__meta-dot" aria-hidden="true"></span>` : ''}
        <span class="hero-slide__meta-rating">&#9733; ${ratingText}</span>
        ${runtimeText ? `<span class="hero-slide__meta-dot" aria-hidden="true"></span><span>${runtimeText}</span>` : ''}
        ${genreText   ? `<span class="hero-slide__meta-dot" aria-hidden="true"></span><span>${genreText}</span>`   : ''}
      </p>
      <p class="hero-slide__description">${movie.overview}</p>
      <div class="hero-slide__buttons">
        <button class="btn-primary"   type="button" data-movie-id="${movie.id}">Take Over</button>
        <button class="btn-secondary" type="button" data-movie-id="${movie.id}">More Info</button>
      </div>
    </div>
  `;

  return slide;
}

function buildDot(index, total) {
  const li  = document.createElement('li');
  const btn = document.createElement('button');
  btn.className = 'hero-carousel__dot';
  btn.setAttribute('aria-label', `Go to slide ${index + 1}`);
  btn.addEventListener('click', () => { goToSlide(index); resetTimer(); });
  li.appendChild(btn);
  return li;
}

function goToSlide(index) {
  currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
  heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

  heroDots.querySelectorAll('.hero-carousel__dot').forEach((dot, i) => {
    dot.classList.toggle('hero-carousel__dot--active', i === currentSlide);
    dot.setAttribute('aria-current', i === currentSlide ? 'true' : 'false');
  });
}

function populateHeroCarousel(movies) {
  // Clear any existing content (e.g. loading placeholder)
  heroTrack.innerHTML = '';
  heroDots.innerHTML  = '';

  totalSlides = movies.length;

  movies.forEach((movie, index) => {
    heroTrack.appendChild(buildSlide(movie));
    heroDots.appendChild(buildDot(index, totalSlides));
  });

  goToSlide(0);
}

function initHeroCarousel() {
  heroPrev.addEventListener('click', () => { goToSlide(currentSlide - 1); resetTimer(); });
  heroNext.addEventListener('click', () => { goToSlide(currentSlide + 1); resetTimer(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goToSlide(currentSlide - 1); resetTimer(); }
    if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); resetTimer(); }
  });

  heroEl.addEventListener('mouseenter', stopTimer);
  heroEl.addEventListener('mouseleave', startTimer);
}

function startTimer() {
  if (totalSlides < 2) return;
  autoAdvance = setInterval(() => goToSlide(currentSlide + 1), ADVANCE_MS);
}

function stopTimer() {
  clearInterval(autoAdvance);
}

function resetTimer() {
  stopTimer();
  startTimer();
}


// ============================================================
// 6. Recommendation Rows
// ============================================================

function buildMovieCard(movie) {
  const li      = document.createElement('li');
  const article = document.createElement('article');
  article.className = 'movie-card';
  article.setAttribute('aria-label', movie.title);

  const genreText = (movie.genres || []).slice(0, 2).join(', ');
  const ratingText = (movie.rating || 0).toFixed(1);

  article.innerHTML = `
    <img
      class="movie-card__poster"
      src="${movie.posterUrl}"
      alt="Poster for ${movie.title}"
      loading="lazy"
    />
    <div class="movie-card__info">
      <p class="movie-card__title">${movie.title}</p>
      <p class="movie-card__meta">
        ${movie.year ? `<span>${movie.year}</span>` : ''}
        <span class="movie-card__rating">&#9733; ${ratingText}</span>
      </p>
    </div>
    <div class="movie-card__overlay" aria-hidden="true">
      <p class="movie-card__overlay-title">${movie.title}</p>
      <p class="movie-card__overlay-rating">&#9733; ${ratingText}</p>
      ${genreText ? `<p class="movie-card__overlay-genres">${genreText}</p>` : ''}
      <button class="movie-card__overlay-btn movie-card__overlay-btn--primary"   type="button" data-movie-id="${movie.id}">Take Over</button>
      <button class="movie-card__overlay-btn movie-card__overlay-btn--secondary" type="button" data-movie-id="${movie.id}">Details</button>
    </div>
  `;

  // If the image still fails to load (network error, wrong path, etc.)
  // hide the whole card so no empty slots appear in the row.
  const img = article.querySelector('img');
  img.addEventListener('error', () => { li.remove(); });

  li.appendChild(article);
  return li;
}

function buildMovieRow(rowData) {
  // Skip rows that ended up empty after poster filtering
  if (!rowData.movies || rowData.movies.length === 0) return null;

  const section = document.createElement('div');
  section.className = 'movie-row';

  const headingRow = document.createElement('div');
  headingRow.className = 'movie-row__heading-row';
  headingRow.innerHTML = `
    <h2 class="movie-row__title">${rowData.title}</h2>
    <a href="#" class="movie-row__see-all">See All</a>
  `;

  const list = document.createElement('ul');
  list.className = 'movie-row__list';
  list.setAttribute('aria-label', rowData.title);

  rowData.movies.forEach((movie) => {
    list.appendChild(buildMovieCard(movie));
  });

  section.appendChild(headingRow);
  section.appendChild(list);
  return section;
}

function populateRecommendationRows(rows) {
  const container = document.getElementById('recommendationContainer');
  container.innerHTML = '';

  rows.forEach((row) => {
    const el = buildMovieRow(row);
    if (el) container.appendChild(el);
  });
}


// ============================================================
// 7. Loading state helpers
// ============================================================

function showHeroLoading() {
  heroTrack.innerHTML = `
    <div class="hero-slide hero-slide--loading" aria-hidden="true">
      <div class="hero-slide__overlay-bottom"></div>
      <div class="hero-slide__content">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--meta"></div>
        <div class="skeleton skeleton--desc"></div>
      </div>
    </div>
  `;
  totalSlides = 1;
}

function showRowsLoading() {
  const container = document.getElementById('recommendationContainer');
  container.innerHTML = `
    <div class="movie-row">
      <div class="movie-row__heading-row">
        <div class="skeleton skeleton--heading"></div>
      </div>
      <ul class="movie-row__list">
        ${Array.from({ length: 5 }, () =>
          `<li><div class="movie-card skeleton skeleton--card"></div></li>`
        ).join('')}
      </ul>
    </div>
  `.repeat(3);
}


// ============================================================
// 8. Footer year
// ============================================================

function initFooterYear() {
  const yearEl = document.getElementById('footerYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}


// ============================================================
// 9. Load page data from TMDB
// ============================================================

async function loadPageData() {
  showHeroLoading();
  showRowsLoading();

  try {
    const [heroMovies, rows] = await Promise.all([
      fetchHeroMovies(),
      fetchAllRows(),
    ]);

    populateHeroCarousel(heroMovies);
    startTimer();

    populateRecommendationRows(rows);
  } catch (err) {
    console.error('Failed to load TMDB data:', err.message);

    const container = document.getElementById('recommendationContainer');
    container.innerHTML = `
      <p style="padding:32px 32px 16px; color:var(--color-muted); font-size:14px;">
        Could not load movies. Check that your TMDB token is valid and try again.
      </p>
      <div style="padding:0 32px 32px;">
        <button
          id="retryTokenBtn"
          style="background:var(--color-green);color:#111411;border:none;padding:10px 22px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;"
        >Update Token</button>
      </div>
    `;

    document.getElementById('retryTokenBtn')?.addEventListener('click', () => showModal());
  }
}


// ============================================================
// 10. TMDB API Key Modal
// ============================================================

// showModal() can be called from anywhere to re-open the token modal.
function showModal() {
  const backdrop   = document.getElementById('apiModalBackdrop');
  const skipBtn    = document.getElementById('apiModalSkip');
  const input      = document.getElementById('apiTokenInput');
  const savedToken = getTmdbToken();

  skipBtn.hidden = !savedToken;

  // Prefill with the current saved token so the user can see/replace it
  if (input) input.value = savedToken;

  backdrop.removeAttribute('aria-hidden');
  backdrop.style.display = '';
  backdrop.classList.remove('api-modal-backdrop--hidden');

  setTimeout(() => { if (input) input.focus(); }, 100);
}

function initApiKeyModal() {
  const backdrop = document.getElementById('apiModalBackdrop');
  const form     = document.getElementById('apiModalForm');
  const input    = document.getElementById('apiTokenInput');
  const toggle   = document.getElementById('apiTokenToggle');
  const errorMsg = document.getElementById('apiModalError');
  const skipBtn  = document.getElementById('apiModalSkip');

  const existingToken = getTmdbToken();

  // If a token is already saved, skip the modal entirely.
  if (existingToken) {
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.style.display = 'none';
  }

  toggle.addEventListener('click', () => {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    toggle.setAttribute('aria-label', isPassword ? 'Hide token' : 'Show token');
    toggle.style.color = isPassword ? 'var(--color-green)' : 'var(--color-muted)';
  });

  input.addEventListener('input', () => {
    input.classList.remove('api-modal__input--error');
    errorMsg.hidden = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const token = input.value.trim();

    if (!token) {
      input.classList.add('api-modal__input--error');
      errorMsg.hidden = false;
      input.focus();
      return;
    }

    localStorage.setItem(STORAGE_KEY, token);
    dismissModal();
    // Reload data with the newly entered token
    loadPageData();
  });

  skipBtn.addEventListener('click', dismissModal);

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop && getTmdbToken()) dismissModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getTmdbToken()) dismissModal();
  });

  function dismissModal() {
    backdrop.classList.add('api-modal-backdrop--hidden');
    setTimeout(() => {
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.style.display = 'none';
    }, 320);
  }

  if (!existingToken) {
    setTimeout(() => input.focus(), 350);
  }
}


// ============================================================
// 11. Bootstrap
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initFooterYear();
  initHeroCarousel();

  const token = getTmdbToken();
  initApiKeyModal();

  // Header "Update Token" button
  document.getElementById('updateTokenBtn')?.addEventListener('click', () => showModal());

  // If a token is already stored, load data immediately.
  if (token) {
    loadPageData();
  }
});



