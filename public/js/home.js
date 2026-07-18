/**
 * home.js
 *
 * Drives the GreenLit home page:
 *   - Hero carousel (auto-advance, prev/next, dot indicators)
 *   - Recommendation rows (rendered from data arrays)
 *   - Footer year
 *
 * HOW TO RUN:
 *   Open public/index.html in a browser (local server or file://).
 *   Set TMDB_ACCESS_TOKEN as needed for live data; hard-coded objects
 *   are used for the first-version static build.
 */

'use strict';

// ============================================================
// 1. Hard-coded hero movies
//    Each entry represents one carousel slide.
//    Replace or extend this array when pulling live TMDB data.
// ============================================================

const HERO_MOVIES = [
  {
    id: 49047,
    title: 'Gravity',
    tagline: 'Take over the production.',
    year: 2013,
    runtime: 91,
    rating: 7.7,
    genres: ['Science Fiction', 'Thriller'],
    overview:
      'Dr. Ryan Stone, a brilliant medical engineer on her first shuttle mission, is accompanied by veteran astronaut Matt Kowalski. But on a seemingly routine spacewalk, disaster strikes.',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/y3bPtXMjgK5etDe3ELMPW3M5P6G.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/fkM6n29q3s1KJwxJEGHFzZz5bQN.jpg',
  },
  {
    id: 157336,
    title: 'Interstellar',
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    year: 2014,
    runtime: 169,
    rating: 8.4,
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    overview:
      'A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  },
  {
    id: 550,
    title: 'Fight Club',
    tagline: 'Mischief. Mayhem. Soap.',
    year: 1999,
    runtime: 139,
    rating: 8.4,
    genres: ['Drama', 'Thriller'],
    overview:
      'An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much, much more.',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/87hTDiay2N2qWyX4Ds7ybXi9h8I.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  },
  {
    id: 238,
    title: 'The Godfather',
    tagline: 'An offer you can\'t refuse.',
    year: 1972,
    runtime: 175,
    rating: 8.7,
    genres: ['Drama', 'Crime'],
    overview:
      'Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLlegkKDBAngela.jpg',
  },
  {
    id: 603,
    title: 'The Matrix',
    tagline: 'Free your mind.',
    year: 1999,
    runtime: 136,
    rating: 8.2,
    genres: ['Action', 'Science Fiction'],
    overview:
      'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting against the powerful computers who now rule the earth.',
    backdropUrl: 'https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  },
];


// ============================================================
// 2. Hard-coded recommendation rows
//    Each category has a title and an array of movie objects.
//    Adding a new row later = adding one more entry here.
// ============================================================

const RECOMMENDATION_ROWS = [
  {
    title: 'New Releases',
    movies: [
      { id: 746036, title: 'The Fall Guy',   year: 2024, rating: 7.0, genres: ['Action', 'Comedy'],          posterUrl: 'https://image.tmdb.org/t/p/w500/tSz1qsmSJon0rqjHBxXZmrotuse.jpg' },
      { id: 653346, title: 'Kingdom of the Planet of the Apes', year: 2024, rating: 7.1, genres: ['Action', 'Science Fiction'], posterUrl: 'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg' },
      { id: 519182, title: 'Despicable Me 4', year: 2024, rating: 7.2, genres: ['Animation', 'Comedy'],       posterUrl: 'https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdyCyUoAuu5Vnd4.jpg' },
      { id: 718821, title: 'Twisters',       year: 2024, rating: 7.0, genres: ['Action', 'Drama'],           posterUrl: 'https://image.tmdb.org/t/p/w500/pjnD08FlMAIXsfOLKQbIt9byM6W.jpg' },
      { id: 573435, title: 'Bad Boys: Ride or Die', year: 2024, rating: 7.3, genres: ['Action', 'Comedy'],   posterUrl: 'https://image.tmdb.org/t/p/w500/nP6RliHjxsz4irTKsxe8uRbLE4X.jpg' },
    ],
  },
  {
    title: 'Classics',
    movies: [
      { id: 238,    title: 'The Godfather',    year: 1972, rating: 8.7, genres: ['Drama', 'Crime'],              posterUrl: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsLlegkKDBAngela.jpg' },
      { id: 278,    title: 'The Shawshank Redemption', year: 1994, rating: 8.7, genres: ['Drama', 'Crime'],      posterUrl: 'https://image.tmdb.org/t/p/w500/lyQBXzOQSuE59IsHyhrp0qIiPAz.jpg' },
      { id: 240,    title: 'The Godfather Part II', year: 1974, rating: 8.6, genres: ['Drama', 'Crime'],          posterUrl: 'https://image.tmdb.org/t/p/w500/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg' },
      { id: 424,    title: "Schindler's List", year: 1993, rating: 8.6, genres: ['History', 'Drama', 'War'],      posterUrl: 'https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg' },
      { id: 389,    title: '12 Angry Men',     year: 1957, rating: 8.5, genres: ['Drama'],                       posterUrl: 'https://image.tmdb.org/t/p/w500/ppd84D2i9W8jXmsyInGyihiSyqz.jpg' },
    ],
  },
  {
    title: 'Seasonal Picks',
    movies: [
      { id: 11324,  title: "Edward Scissorhands", year: 1990, rating: 7.9, genres: ['Fantasy', 'Drama', 'Romance'], posterUrl: 'https://image.tmdb.org/t/p/w500/1RFIbuW9Z3ZFrLSikBh42acBUxd.jpg' },
      { id: 8844,   title: 'Beetlejuice',          year: 1988, rating: 7.5, genres: ['Comedy', 'Fantasy'],           posterUrl: 'https://image.tmdb.org/t/p/w500/nnZeNkBJBBBNuBaECzqbLhVJNOL.jpg' },
      { id: 637,    title: 'La La Land',            year: 2016, rating: 7.9, genres: ['Drama', 'Romance', 'Music'],   posterUrl: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg' },
      { id: 14836,  title: 'The Holiday',           year: 2006, rating: 7.2, genres: ['Romance', 'Comedy'],           posterUrl: 'https://image.tmdb.org/t/p/w500/7gFo1PEbe1CoSgNTnjCGdZbw0zP.jpg' },
      { id: 9479,   title: 'Home Alone',            year: 1990, rating: 7.4, genres: ['Family', 'Comedy'],            posterUrl: 'https://image.tmdb.org/t/p/w500/onTSipZ8R3bliBdKfPtsDaxA2wT.jpg' },
    ],
  },
];


// ============================================================
// 3. Hero Carousel
// ============================================================

const heroTrack = document.getElementById('heroTrack');
const heroDots  = document.getElementById('heroDots');
const heroPrev  = document.getElementById('heroPrev');
const heroNext  = document.getElementById('heroNext');
const heroEl    = document.querySelector('.hero-carousel');

let currentSlide   = 0;
let autoAdvance;
const ADVANCE_MS   = 7000;

function buildSlide(movie) {
  const slide = document.createElement('div');
  slide.className = 'hero-slide';
  slide.style.backgroundImage = `url('${movie.backdropUrl}')`;

  slide.innerHTML = `
    <div class="hero-slide__overlay-side"   aria-hidden="true"></div>
    <div class="hero-slide__overlay-bottom" aria-hidden="true"></div>
    <div class="hero-slide__content">
      <h1 class="hero-slide__title">${movie.title}</h1>
      <p class="hero-slide__meta">
        <span>${movie.year}</span>
        <span class="hero-slide__meta-dot" aria-hidden="true"></span>
        <span class="hero-slide__meta-rating">&#9733; ${movie.rating.toFixed(1)}</span>
        <span class="hero-slide__meta-dot" aria-hidden="true"></span>
        <span>${movie.runtime} min</span>
        <span class="hero-slide__meta-dot" aria-hidden="true"></span>
        <span>${movie.genres.slice(0, 2).join(', ')}</span>
      </p>
      <p class="hero-slide__description">${movie.overview}</p>
      <div class="hero-slide__buttons">
        <button class="btn-primary" type="button">Take Over</button>
        <button class="btn-secondary" type="button">More Info</button>
      </div>
    </div>
  `;

  return slide;
}

function buildDot(index) {
  const li  = document.createElement('li');
  const btn = document.createElement('button');
  btn.className  = 'hero-carousel__dot';
  btn.setAttribute('aria-label', `Go to slide ${index + 1}`);
  btn.addEventListener('click', () => goToSlide(index));
  li.appendChild(btn);
  return li;
}

function goToSlide(index) {
  currentSlide = (index + HERO_MOVIES.length) % HERO_MOVIES.length;
  heroTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

  // Update dots
  heroDots.querySelectorAll('.hero-carousel__dot').forEach((dot, i) => {
    dot.classList.toggle('hero-carousel__dot--active', i === currentSlide);
    dot.setAttribute('aria-current', i === currentSlide ? 'true' : 'false');
  });
}

function initHeroCarousel() {
  HERO_MOVIES.forEach((movie, index) => {
    heroTrack.appendChild(buildSlide(movie));
    heroDots.appendChild(buildDot(index));
  });

  goToSlide(0);

  heroPrev.addEventListener('click', () => {
    goToSlide(currentSlide - 1);
    resetTimer();
  });

  heroNext.addEventListener('click', () => {
    goToSlide(currentSlide + 1);
    resetTimer();
  });

  // Keyboard support for arrow buttons
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { goToSlide(currentSlide - 1); resetTimer(); }
    if (e.key === 'ArrowRight') { goToSlide(currentSlide + 1); resetTimer(); }
  });

  // Auto-advance — pause on hover
  startTimer();
  heroEl.addEventListener('mouseenter', stopTimer);
  heroEl.addEventListener('mouseleave', startTimer);
}

function startTimer() {
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
// 4. Recommendation Rows
// ============================================================

function buildMovieCard(movie) {
  const article = document.createElement('article');
  article.className = 'movie-card';
  article.setAttribute('aria-label', movie.title);

  const genreText = (movie.genres || []).slice(0, 2).join(', ');

  article.innerHTML = `
    ${
      movie.posterUrl
        ? `<img
             class="movie-card__poster"
             src="${movie.posterUrl}"
             alt="Poster for ${movie.title}"
             loading="lazy"
           />`
        : `<div class="movie-card__poster-placeholder" aria-hidden="true">🎬</div>`
    }
    <div class="movie-card__info">
      <p class="movie-card__title">${movie.title}</p>
      <p class="movie-card__meta">
        <span>${movie.year}</span>
        <span class="movie-card__rating">&#9733; ${(movie.rating || 0).toFixed(1)}</span>
      </p>
    </div>
    <div class="movie-card__overlay" aria-hidden="true">
      <p class="movie-card__overlay-title">${movie.title}</p>
      <p class="movie-card__overlay-rating">&#9733; ${(movie.rating || 0).toFixed(1)}</p>
      ${genreText ? `<p class="movie-card__overlay-genres">${genreText}</p>` : ''}
      <button class="movie-card__overlay-btn movie-card__overlay-btn--primary" type="button">
        Take Over
      </button>
      <button class="movie-card__overlay-btn movie-card__overlay-btn--secondary" type="button">
        Details
      </button>
    </div>
  `;

  return article;
}

function buildMovieRow(rowData) {
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
    const li = document.createElement('li');
    li.appendChild(buildMovieCard(movie));
    list.appendChild(li);
  });

  section.appendChild(headingRow);
  section.appendChild(list);
  return section;
}

function initRecommendationRows() {
  const container = document.getElementById('recommendationContainer');
  RECOMMENDATION_ROWS.forEach((row) => {
    container.appendChild(buildMovieRow(row));
  });
}


// ============================================================
// 5. Footer year
// ============================================================

function initFooterYear() {
  const yearEl = document.getElementById('footerYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}


// ============================================================
// 6. Bootstrap
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  initRecommendationRows();
  initFooterYear();
});
