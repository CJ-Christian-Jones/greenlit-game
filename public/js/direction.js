/**
 * direction.js
 *
 * Drives the GreenLit "Project Direction" page (Page 2):
 *   - Reads ?id= from URL for the TMDB movie ID
 *   - Fetches movie details + credits from TMDB API
 *   - Renders: movie header, release strategy, genre direction,
 *     creative direction cards, cast with Keep/Undecided/Replace toggles
 *   - Live-updates the sticky summary panel as the player makes choices
 *   - Saves project to localStorage on Continue
 */

'use strict';

// ============================================================
// 1. Constants
// ============================================================

const STORAGE_KEY  = 'TMDB_ACCESS_TOKEN';
const PROJECT_KEY  = 'GREENLIT_CURRENT_PROJECT';
const TMDB_BASE    = 'https://api.themoviedb.org/3';
const IMG_BASE     = 'https://image.tmdb.org/t/p';

const TMDB_GENRES = [
  { id: 28,    name: 'Action'          },
  { id: 12,    name: 'Adventure'       },
  { id: 16,    name: 'Animation'       },
  { id: 35,    name: 'Comedy'          },
  { id: 80,    name: 'Crime'           },
  { id: 99,    name: 'Documentary'     },
  { id: 18,    name: 'Drama'           },
  { id: 10751, name: 'Family'          },
  { id: 14,    name: 'Fantasy'         },
  { id: 36,    name: 'History'         },
  { id: 27,    name: 'Horror'          },
  { id: 10402, name: 'Music'           },
  { id: 9648,  name: 'Mystery'         },
  { id: 10749, name: 'Romance'         },
  { id: 878,   name: 'Science Fiction' },
  { id: 53,    name: 'Thriller'        },
  { id: 10752, name: 'War'             },
  { id: 37,    name: 'Western'         },
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const MONTH_HINTS = {
  1:  'Quiet start to the year. Lower competition.',
  2:  'Romance and awards season.',
  3:  'Transitional release window.',
  4:  'Pre-summer buildup.',
  5:  'Summer blockbuster season opens.',
  6:  'High audience traffic. Intense competition.',
  7:  'Peak summer. Maximum competition.',
  8:  'Late summer. Moderate competition.',
  9:  'Slower theatrical period.',
  10: 'Strong for thriller and horror.',
  11: 'Holiday blockbusters and awards.',
  12: 'Holiday traffic and awards campaigns.',
};

const CREATIVE_OPTIONS = [
  {
    id:          'faithful',
    title:       'FAITHFUL',
    description: "Preserve the original film's story, tone, and identity while updating its production.",
    stats:       { 'Creative freedom': 'Low', 'Audience familiarity': 'High', 'Risk': 'Low', 'Originality potential': 'Low' },
    feedback:    "A Faithful approach builds on existing goodwill, but leaves little room for creative surprises.",
  },
  {
    id:          'reimagining',
    title:       'REIMAGINING',
    description: "Keep the original concept, but reinterpret its tone, characters, setting, or style.",
    stats:       { 'Creative freedom': 'Medium', 'Audience familiarity': 'Medium', 'Risk': 'Medium', 'Originality potential': 'Medium' },
    feedback:    "A Reimagining balances familiarity with fresh ideas. Most audiences will give it a chance.",
  },
  {
    id:          'reinvention',
    title:       'REINVENTION',
    description: "Transform the movie into something fundamentally new while retaining a recognizable piece of its identity.",
    stats:       { 'Creative freedom': 'High', 'Audience familiarity': 'Low', 'Risk': 'High', 'Originality potential': 'High' },
    feedback:    "A Reinvention gives you more casting freedom, but original fans may be harder to satisfy.",
  },
];

const STAT_LEVEL = { Low: 1, Medium: 2, High: 3 };

// Genre combinations — natural fits per primary genre
const NATURAL_FITS = {
  'Science Fiction': ['Thriller', 'Action', 'Adventure', 'Horror', 'Mystery'],
  'Action':          ['Thriller', 'Adventure', 'Crime', 'Science Fiction'],
  'Horror':          ['Mystery', 'Thriller', 'Science Fiction'],
  'Thriller':        ['Mystery', 'Crime', 'Action', 'Science Fiction', 'Horror', 'Drama'],
  'Drama':           ['Romance', 'History', 'Crime', 'Mystery', 'War'],
  'Comedy':          ['Romance', 'Family', 'Animation'],
  'Adventure':       ['Action', 'Fantasy', 'Science Fiction', 'Family'],
  'Fantasy':         ['Adventure', 'Action', 'Romance'],
  'Crime':           ['Thriller', 'Drama', 'Mystery', 'Action'],
  'Mystery':         ['Thriller', 'Crime', 'Horror'],
  'Romance':         ['Drama', 'Comedy'],
  'History':         ['Drama', 'War'],
  'War':             ['History', 'Drama', 'Action'],
  'Animation':       ['Comedy', 'Family', 'Adventure', 'Fantasy'],
  'Family':          ['Adventure', 'Comedy', 'Animation'],
  'Documentary':     ['History', 'War'],
  'Music':           ['Romance', 'Drama'],
  'Western':         ['Action', 'Drama'],
};

// Wild/major departure combinations
const WILD_COMBOS = {
  'Science Fiction': ['Music', 'Romance', 'Western', 'Documentary', 'Family', 'Comedy'],
  'Action':          ['Documentary', 'Music', 'Romance', 'Family', 'Animation'],
  'Horror':          ['Comedy', 'Romance', 'Music', 'Family', 'Documentary', 'Animation', 'Western'],
  'Drama':           ['Science Fiction', 'Horror', 'Animation'],
  'Comedy':          ['Horror', 'War', 'Science Fiction', 'History', 'Western'],
  'Thriller':        ['Animation', 'Music', 'Family', 'Documentary'],
  'Fantasy':         ['Documentary', 'War', 'History'],
  'Mystery':         ['Family', 'Animation', 'Music'],
  'Adventure':       ['Documentary', 'History', 'War'],
  'Romance':         ['Horror', 'Science Fiction', 'War', 'Documentary'],
  'Animation':       ['Horror', 'War', 'Crime', 'Thriller'],
  'Western':         ['Science Fiction', 'Horror', 'Animation', 'Music'],
};


// ============================================================
// 2. Module-level state
// ============================================================

/** Raw TMDB movie response (set after fetch) */
let movieData = null;

/** Player choices — updated by each section's event handlers */
const state = {
  releaseYear:             null,
  releaseMonth:            null,   // 1–12
  primaryGenreId:          null,
  primaryGenreName:        null,
  origSecondaryGenreId:    null,
  origSecondaryGenreName:  null,
  newSecondaryGenreId:     null,
  newSecondaryGenreName:   null,
  creativeDirection:       null,   // 'faithful' | 'reimagining' | 'reinvention'
  castDecisions:           [],     // [{personTmdbId, name, character, decision}]
};


// ============================================================
// 3. TMDB helpers
// ============================================================

function getToken() {
  return localStorage.getItem(STORAGE_KEY) || '';
}

async function tmdbFetch(pathname, query = {}) {
  const token = getToken();
  if (!token) throw new Error('No TMDB token found');

  const url = new URL(`${TMDB_BASE}${pathname}`);
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
  let errorDetails = "";

  try {
    const errorData = await res.json();
    errorDetails =
      errorData.status_message ||
      errorData.message ||
      "";
  } catch {
    // TMDB did not return readable JSON.
  }

  throw new Error(
    `TMDB ${res.status}: ${errorDetails || res.statusText || "Request failed"}`
  );
}
  return res.json();
}

function imgUrl(path, size) {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

function formatMoney(n) {
  if (!n || n === 0) return null;
  const millions = n / 1_000_000;
  if (millions >= 1000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  return `$${millions.toFixed(0)}M`;
}

function formatReleaseDate(dateStr) {
  if (!dateStr) return null;
  const [y, m] = dateStr.split('-').map(Number);
  return `${MONTH_FULL[m - 1]} ${y}`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// ============================================================
// 4. Genre compatibility helpers
// ============================================================

function getCompatibility(primaryName, secondaryName) {
  if (!primaryName || !secondaryName) return null;
  if (primaryName === secondaryName) return 'blocked';
  if ((NATURAL_FITS[primaryName] || []).includes(secondaryName)) return 'natural';
  if ((WILD_COMBOS[primaryName]  || []).includes(secondaryName)) return 'wild';
  return 'interesting';
}

function compatLabel(compat) {
  switch (compat) {
    case 'natural':     return 'Natural Fit';
    case 'interesting': return 'Interesting Shift';
    case 'wild':        return 'Major Departure';
    default:            return '';
  }
}

function compatCssClass(compat) {
  switch (compat) {
    case 'natural':     return 'compat--natural';
    case 'interesting': return 'compat--interesting';
    case 'wild':        return 'compat--wild';
    default:            return '';
  }
}


// ============================================================
// 5. Render: Movie Header
// ============================================================

function renderMovieHeader(movie) {
  const el = document.getElementById('movieHeader');
  if (!el) return;

  const backdropUrl = imgUrl(movie.backdrop_path, 'w1280') || '';
  const posterUrl   = imgUrl(movie.poster_path,   'w500')  || '';

  const director  = (movie.credits?.crew || []).find(c => c.job === 'Director');
  const dirName   = director ? escHtml(director.name) : 'Unknown';

  const released  = formatReleaseDate(movie.release_date) || 'Original release date unavailable';
  const genres    = (movie.genres || []).map(g => escHtml(g.name)).slice(0, 3).join(' / ');
  const runtime   = movie.runtime ? `${movie.runtime} minutes` : '';
  const budget    = formatMoney(movie.budget);
  const revenue   = formatMoney(movie.revenue);
  const rating    = (movie.vote_average != null) ? Number(movie.vote_average).toFixed(1) : 'N/A';

  const posterHtml = posterUrl
    ? `<img class="dir-movie-header__poster" src="${posterUrl}" alt="Poster for ${escHtml(movie.title)}" />`
    : `<div class="dir-movie-header__poster-placeholder">🎬</div>`;

  el.innerHTML = `
    <div class="dir-movie-header__backdrop" style="background-image:url('${backdropUrl}')" aria-hidden="true"></div>
    <div class="dir-movie-header__overlay" aria-hidden="true"></div>
    <div class="dir-movie-header__content">
      <div class="dir-movie-header__poster-wrap">${posterHtml}</div>
      <div class="dir-movie-header__info">
        <span class="dir-movie-header__label">ORIGINAL FILM</span>
        <h1 class="dir-movie-header__title">${escHtml(movie.title)}</h1>
        <div class="dir-movie-header__meta">
          <span>Released: ${released}</span>
          ${genres  ? `<span>${genres}</span>`                       : ''}
          ${runtime ? `<span>${escHtml(runtime)}</span>`             : ''}
          <span>Director: ${dirName}</span>
          ${budget  ? `<span>Budget: ${budget}</span>`               : '<span>Budget unavailable</span>'}
          ${revenue ? `<span>Revenue: ${revenue}</span>`             : ''}
          <span class="dir-movie-header__rating">★ ${rating}</span>
        </div>
        <p class="dir-movie-header__overview">${escHtml(movie.overview || '')}</p>
      </div>
    </div>
  `;
}


// ============================================================
// 6. Render: Release Strategy
// ============================================================

function renderReleaseSection(movie) {
  const releaseDate = movie.release_date || '';
  const origYear  = releaseDate ? Number(releaseDate.slice(0, 4)) : new Date().getFullYear();
  const origMonth = releaseDate ? Number(releaseDate.slice(5, 7)) : 1;
  const origLabel = releaseDate
    ? `${MONTH_FULL[origMonth - 1]} ${origYear}`
    : 'unavailable';

  // Defaults: original year + 4, same month
  const currentYear = new Date().getFullYear();

  const defaultYear = Math.min(
    Math.max(origYear + 4, currentYear),
    currentYear + 10
  );
  const defaultMonth = origMonth;

  state.releaseYear  = defaultYear;
  state.releaseMonth = defaultMonth;

  // Original release info label
  const origInfoEl = document.getElementById('releaseOrigInfo');
  if (origInfoEl) origInfoEl.textContent = `Original release: ${origLabel}`;

  // Year <select>
  const select = document.getElementById("releaseYear");

  if (!select) {
    throw new Error(
      'Missing HTML element: <select id="releaseYear">'
    );
  }

select.innerHTML = "";

  select.innerHTML = "";
  const earliestYear = currentYear;
  const latestYear = currentYear + 10;

  for (let y = earliestYear; y <= latestYear; y++) {
    const opt = document.createElement('option');
    opt.value       = y;
    opt.textContent = y;
    if (y === defaultYear) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    state.releaseYear = Number(select.value);
    updateSummary();
    updateContinueBtn();
  });

  // Month pills
  const pillsEl = document.getElementById("monthPills");

  if (!pillsEl) {
    throw new Error(
      'Missing HTML element: id="monthPills"'
    );
  }

  pillsEl.innerHTML = "";

  MONTH_SHORT.forEach((name, i) => {
    const monthNum = i + 1;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'month-pill' + (monthNum === defaultMonth ? ' month-pill--active' : '');
    btn.textContent = name;
    btn.dataset.month = monthNum;
    btn.setAttribute('aria-pressed', String(monthNum === defaultMonth));

    btn.addEventListener('click', () => {
      state.releaseMonth = monthNum;
      pillsEl.querySelectorAll('.month-pill').forEach(p => {
        const active = p === btn;
        p.classList.toggle('month-pill--active', active);
        p.setAttribute('aria-pressed', String(active));
      });
      setMonthHint(monthNum);
      updateSummary();
      updateContinueBtn();
    });

    pillsEl.appendChild(btn);
  });

  setMonthHint(defaultMonth);
}

function setMonthHint(month) {
  const el = document.getElementById('monthHint');
  if (!el) return;
  const hint = MONTH_HINTS[month];
  el.textContent = hint ? `${MONTH_FULL[month - 1]} — ${hint}` : '';
}


// ============================================================
// 7. Render: Genre Direction
// ============================================================

function renderGenreSection(movie) {
  const genres       = movie.genres || [];
  const primary      = genres[0] || null;
  const origSecond   = genres[1] || null;

  state.primaryGenreId         = primary?.id   ?? null;
  state.primaryGenreName       = primary?.name ?? null;
  state.origSecondaryGenreId   = origSecond?.id   ?? null;
  state.origSecondaryGenreName = origSecond?.name ?? null;

  // Start with the original secondary genre selected.
// The player may keep it or choose a different one.
state.newSecondaryGenreId = origSecond?.id ?? null;
state.newSecondaryGenreName = origSecond?.name ?? null;

  // Primary (locked)
  const primaryEl = document.getElementById('genrePrimary');
  if (primaryEl && primary) {
    primaryEl.innerHTML = `
      <span class="genre-locked-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        Primary genre: <strong>${escHtml(primary.name)}</strong>
      </span>
    `;
  }

  // Original secondary (greyed-out reference)
  const secondEl = document.getElementById('genreOrigSecondary');
  if (secondEl) {
    secondEl.innerHTML = origSecond
      ? `<span class="genre-orig-badge">Original secondary genre: <strong>${escHtml(origSecond.name)}</strong></span>`
      : '';
  }

  // Genre pill grid
  const pillsEl = document.getElementById("genrePills");
  pillsEl.innerHTML = "";

  TMDB_GENRES.forEach((genre) => {
    const isPrimary = genre.id === primary?.id;
    const btn = document.createElement('button');
    btn.type = 'button';
    const isSelected = genre.id === state.newSecondaryGenreId;

    btn.className =
      "genre-pill" +
      (isPrimary ? " genre-pill--disabled" : "") +
      (isSelected ? " genre-pill--active" : "");
    btn.textContent = genre.name;
    btn.dataset.genreId   = genre.id;
    btn.dataset.genreName = genre.name;
    btn.disabled = isPrimary;
    if (isPrimary) btn.title = 'Cannot choose the primary genre as secondary';
    btn.setAttribute("aria-pressed", String(isSelected));

    btn.addEventListener('click', () => {
      if (isPrimary) return;

    // A secondary genre is required.
    // Clicking the currently selected genre does nothing.
    if (state.newSecondaryGenreId === genre.id) {
      return;
    }

      // Select new
      state.newSecondaryGenreId   = genre.id;
      state.newSecondaryGenreName = genre.name;

      pillsEl.querySelectorAll('.genre-pill:not(.genre-pill--disabled)').forEach(p => {
        p.classList.remove('genre-pill--active');
        p.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('genre-pill--active');
      btn.setAttribute('aria-pressed', 'true');

      const compat = getCompatibility(state.primaryGenreName, genre.name);
      updateGenreCompatHint(compat, genre.name);
      updateSummary();
      updateContinueBtn();
    });

    pillsEl.appendChild(btn);
  });
}

function updateGenreCompatHint(compat, genreName) {
  const el = document.getElementById('genreCompatHint');
  if (!el) return;
  if (!compat || !genreName) {
    el.textContent = '';
    el.className   = 'genre-compat-hint';
    return;
  }
  switch (compat) {
    case 'natural':
      el.textContent = `${genreName} is a natural fit with ${state.primaryGenreName}.`;
      break;
    case 'interesting':
      el.textContent = `${genreName} creates an interesting tonal shift.`;
      break;
    case 'wild':
      el.textContent = `${genreName} is a major departure from the original tone.`;
      break;
    default:
      el.textContent = '';
  }
  el.className = `genre-compat-hint ${compatCssClass(compat)}`;
}


// ============================================================
// 8. Render: Creative Direction
// ============================================================

function renderCreativeSection() {
  const container = document.getElementById('creativeCards');
  if (!container) return;

  CREATIVE_OPTIONS.forEach(option => {
    const card = document.createElement('div');
    card.className = 'creative-card';
    card.dataset.id = option.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');

    const statsHtml = Object.entries(option.stats).map(([label, level]) => {
      const filled = STAT_LEVEL[level] || 0;
      const segs   = Array.from({ length: 3 }, (_, i) =>
        `<span class="stat-bar__segment${i < filled ? ' stat-bar__segment--filled' : ''}"></span>`
      ).join('');
      return `
        <div class="stat-row">
          <span class="stat-row__label">${label}</span>
          <span class="stat-row__level">${level}</span>
          <div class="stat-bar" aria-label="${label}: ${level}">${segs}</div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <p class="creative-card__title">${option.title}</p>
      <p class="creative-card__desc">${option.description}</p>
      <div class="creative-card__stats">${statsHtml}</div>
    `;

    function selectCard() {
      state.creativeDirection = option.id;
      container.querySelectorAll('.creative-card').forEach(c => {
        const isThis = c === card;
        c.classList.toggle('creative-card--selected', isThis);
        c.setAttribute('aria-pressed', String(isThis));
      });
      const feedbackEl = document.getElementById('creativeFeedback');
      if (feedbackEl) feedbackEl.textContent = option.feedback;
      updateSummary();
      updateContinueBtn();
    }

    card.addEventListener('click', selectCard);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCard(); }
    });

    container.appendChild(card);
  });
}


// ============================================================
// 9. Render: Cast Section
// ============================================================

function renderCastSection(movie) {
  const sortedCast = (movie.credits?.cast || []).slice().sort((a, b) => a.order - b.order);
  const top5 = sortedCast.slice(0, 5);
  const rest  = sortedCast.slice(5);

  // Initialise all decisions to 'undecided'
  state.castDecisions = sortedCast.map(actor => ({
    personTmdbId: actor.id,
    name:         actor.name,
    character:    actor.character || '',
    decision:     'undecided',
  }));

  const listEl    = document.getElementById('castList');
  const expandBtn = document.getElementById('castExpandBtn');
  const expandEl  = document.getElementById('castExpanded');

  if (!listEl) {
  throw new Error(
    'Missing HTML element: id="castList"'
  );
}

if (!expandBtn) {
  throw new Error(
    'Missing HTML element: id="castExpandBtn"'
  );
}

if (!expandEl) {
  throw new Error(
    'Missing HTML element: id="castExpanded"'
  );
}

  top5.forEach((actor, idx) => {
    listEl.appendChild(buildCastCard(actor, idx));
  });

  if (rest.length > 0) {
    expandBtn.hidden = false;
    rest.forEach((actor, idx) => {
      expandEl.appendChild(buildCastCard(actor, 5 + idx));
    });

    let open = false;
    expandBtn.addEventListener('click', () => {
      open = !open;
      expandEl.hidden = !open;
      expandBtn.textContent = open ? 'Hide Full Cast ▴' : 'View Full Cast ▾';
    });
  }
}

function billingTier(order) {
  if (order <= 1) return 'Lead';
  if (order <= 5) return 'Supporting';
  return 'Minor';
}

function buildCastCard(actor, stateIndex) {
  const photoUrl = actor.profile_path ? imgUrl(actor.profile_path, 'w185') : null;
  const tier     = billingTier(actor.order);
  const tierCls  = tier.toLowerCase();

  const card = document.createElement('div');
  card.className = 'cast-card';
  card.dataset.personId = actor.id;

  const photoHtml = photoUrl
    ? `<img class="cast-card__photo" src="${photoUrl}" alt="${escHtml(actor.name)}" loading="lazy" />`
    : `<div class="cast-card__photo-placeholder">🎬</div>`;

  card.innerHTML = `
    <div class="cast-card__photo-wrap">${photoHtml}</div>
    <div class="cast-card__info">
      <p class="cast-card__name">${escHtml(actor.name)}</p>
      <p class="cast-card__character">${escHtml(actor.character || '')}</p>
      <span class="cast-card__tier cast-card__tier--${tierCls}">${tier}</span>
    </div>
    <div class="cast-card__toggles" role="group" aria-label="Decision for ${escHtml(actor.name)}">
      <button type="button" class="cast-toggle cast-toggle--keep"                   data-decision="keep"      aria-pressed="false">Keep</button>
      <button type="button" class="cast-toggle cast-toggle--undecided cast-toggle--active" data-decision="undecided" aria-pressed="true">Undecided</button>
      <button type="button" class="cast-toggle cast-toggle--replace"                data-decision="replace"   aria-pressed="false">Replace</button>
    </div>
  `;

  // Wire toggle buttons
  const toggleBtns = card.querySelectorAll('.cast-toggle');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const decision = btn.dataset.decision;
      if (state.castDecisions[stateIndex]) {
        state.castDecisions[stateIndex].decision = decision;
      }
      toggleBtns.forEach(t => {
        const isActive = t === btn;
        t.classList.toggle('cast-toggle--active', isActive);
        t.setAttribute('aria-pressed', String(isActive));
      });
      updateSummary();
    });
  });

  return card;
}


// ============================================================
// 10. Summary Panel
// ============================================================

function updateSummary() {
  // Release
  const releaseEl = document.getElementById('summaryRelease');
  if (releaseEl) {
    releaseEl.textContent = (state.releaseMonth && state.releaseYear)
      ? `${MONTH_FULL[state.releaseMonth - 1]} ${state.releaseYear}`
      : '—';
  }

  // Genre combination
  const genreEl  = document.getElementById('summaryGenre');
  const compatEl = document.getElementById('summaryCompat');
  if (genreEl) {
    if (state.primaryGenreName && state.newSecondaryGenreName) {
      genreEl.textContent = `${state.primaryGenreName} / ${state.newSecondaryGenreName}`;
      const compat = getCompatibility(state.primaryGenreName, state.newSecondaryGenreName);
      const label  = compatLabel(compat);
      if (compatEl) {
        compatEl.textContent = label;
        compatEl.className   = label ? `summary-compat-badge ${compatCssClass(compat)}` : 'summary-compat-badge';
      }
    } else {
      genreEl.textContent = state.primaryGenreName ? `${state.primaryGenreName} / —` : '—';
      if (compatEl) { compatEl.textContent = ''; compatEl.className = 'summary-compat-badge'; }
    }
  }

  // Creative direction
  const creativeEl = document.getElementById('summaryCreative');
  if (creativeEl) {
    if (state.creativeDirection) {
      const opt = CREATIVE_OPTIONS.find(o => o.id === state.creativeDirection);
      creativeEl.textContent = opt
        ? opt.title.charAt(0).toUpperCase() + opt.title.slice(1).toLowerCase()
        : 'Not chosen';
    } else {
      creativeEl.textContent = 'Not chosen';
    }
  }

  // Cast plan (top 5 only in summary)
  const castEl = document.getElementById('summaryCast');
  if (castEl && state.castDecisions.length > 0) {
    const top5 = state.castDecisions.slice(0, 5);
    const keep      = top5.filter(d => d.decision === 'keep').length;
    const replace   = top5.filter(d => d.decision === 'replace').length;
    const undecided = top5.filter(d => d.decision === 'undecided').length;
    castEl.textContent = `${keep} Keep · ${replace} Replace · ${undecided} Undecided`;
  } else if (castEl) {
    castEl.textContent = '—';
  }

  checkWarning();
}

function checkWarning() {
  const el = document.getElementById('summaryWarning');
  if (!el) return;
  const compat = state.newSecondaryGenreName
    ? getCompatibility(state.primaryGenreName, state.newSecondaryGenreName)
    : null;
  const show = state.creativeDirection === 'faithful' && compat === 'wild';
  el.hidden      = !show;
  el.textContent = show
    ? 'High-risk combination: Faithful direction with major genre change.'
    : '';
}


// ============================================================
// 11. Continue button
// ============================================================

function updateContinueBtn() {
  const btn   = document.getElementById('continueBtn');
  if (!btn) return;
  const ready =
    state.releaseYear          !== null &&
    state.releaseMonth         !== null &&
    state.newSecondaryGenreId  !== null &&
    state.creativeDirection    !== null;
  btn.disabled = !ready;
  btn.setAttribute('aria-disabled', String(!ready));
}

function initContinueBtn() {
  const btn = document.getElementById("continueBtn");

  if (!btn) return;

  btn.addEventListener("click", () => {
    // Stop if the movie has not loaded yet.
    if (!movieData) {
      console.error("Cannot save project because movieData is missing.");
      return;
    }

    // Find the original movie's director in the crew list.
    const director = (movieData.credits?.crew || []).find(
      (crewMember) => crewMember.job === "Director"
    );

    // Build one project object containing both:
    // 1. The original movie information
    // 2. The player's new production choices
    const project = {
      sourceMovieTmdbId: movieData.id,

      originalMovie: {
        tmdbId: movieData.id,
        title: movieData.title,
        overview: movieData.overview || "",
        releaseDate: movieData.release_date || null,
        runtime: movieData.runtime || null,
        budget: movieData.budget || null,
        revenue: movieData.revenue || null,
        rating: movieData.vote_average || null,
        voteCount: movieData.vote_count || null,
        popularity: movieData.popularity || null,
        posterPath: movieData.poster_path || null,
        backdropPath: movieData.backdrop_path || null,
        genres: movieData.genres || [],

        director: director
          ? {
              tmdbId: director.id,
              name: director.name,
            }
          : null,
      },

      // These older top-level fields can stay for now because
      // other parts of your game may already expect them.
      title: movieData.title,

      posterUrl:
        imgUrl(movieData.poster_path, "w500") || "",

      backdropUrl:
        imgUrl(movieData.backdrop_path, "w1280") || "",

      originalReleaseYear: movieData.release_date
        ? Number(movieData.release_date.slice(0, 4))
        : null,

      originalReleaseMonth: movieData.release_date
        ? Number(movieData.release_date.slice(5, 7))
        : null,

      // Player choices
      newReleaseYear: state.releaseYear,
      newReleaseMonth: state.releaseMonth,

      primaryGenreId: state.primaryGenreId,
      primaryGenreName: state.primaryGenreName,

      originalSecondaryGenreId:
        state.origSecondaryGenreId,

      originalSecondaryGenreName:
        state.origSecondaryGenreName,

      newSecondaryGenreId:
        state.newSecondaryGenreId,

      newSecondaryGenreName:
        state.newSecondaryGenreName,

      creativeDirection:
        state.creativeDirection,

      castDecisions:
        state.castDecisions.slice(),
    };

    // Save the complete project in browser storage.
    localStorage.setItem(
      PROJECT_KEY,
      JSON.stringify(project)
    );

    // Temporary confirmation until casting.html exists.
    alert("Project saved successfully.");

    // Restore this after the casting page has been created:
    // window.location.href = "casting.html";
  });
}

// ============================================================
// 12. Profile avatar
// ============================================================

function initProfileAvatar() {
  try {
    const profile =
      JSON.parse(
        localStorage.getItem("GREENLIT_PROFILE")
      ) || {};

    const name =
      profile.name || "Producer";

    const color =
      profile.color || "#9BE564";

    const letter =
      name.trim()[0]?.toUpperCase() || "P";

    const el =
      document.getElementById("dirProfileAvatar");

    if (el) {
      el.textContent = letter;

      if (el.parentElement) {
        el.parentElement.style.background = color;
      }
    }
  } catch (error) {
    console.warn(
      "Could not load the profile avatar.",
      error
    );
  }
}

// ============================================================
// 13. Page state helpers
// ============================================================

function showLoading() {
  document.getElementById('loadingState').hidden = false;
  document.getElementById('errorState').hidden   = true;
  document.getElementById('pageContent').hidden  = true;
}

function showError(title, message, onRetry) {
  document.getElementById('loadingState').hidden = true;
  document.getElementById('errorState').hidden   = false;
  document.getElementById('pageContent').hidden  = true;
  document.getElementById('errorTitle').textContent   = title;
  document.getElementById('errorMessage').textContent = message;

  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn && onRetry) {
    // Remove old listeners by cloning
    const fresh = retryBtn.cloneNode(true);
    retryBtn.replaceWith(fresh);
    fresh.addEventListener('click', onRetry);
  }
}

function showContent() {
  document.getElementById('loadingState').hidden = true;
  document.getElementById('errorState').hidden   = true;
  document.getElementById('pageContent').hidden  = false;
}


// ============================================================
// 14. Bootstrap
// ============================================================

async function init() {
  initProfileAvatar();

  const params  = new URLSearchParams(location.search);
  const movieId = params.get('id');

  if (!movieId) {
    showError(
      'No movie selected',
      'Please go back and select a movie to direct.',
      () => { window.location.href = 'index.html'; }
    );
    return;
  }

  if (!getToken()) {
    showError(
      'No TMDB token',
      'A TMDB access token is required. Return to the home page to set one up.',
      () => { window.location.href = 'index.html'; }
    );
    return;
  }

  showLoading();

  async function loadMovie() {
    showLoading();
    
    try {
      movieData = await tmdbFetch(`/movie/${movieId}`, {
        append_to_response: 'credits',
        language:           'en-US',
      });

      // Render sections
      renderMovieHeader(movieData);
      renderReleaseSection(movieData);
      renderGenreSection(movieData);
      renderCreativeSection();
      renderCastSection(movieData);

      // Set summary title
      const titleEl = document.getElementById('summaryTitle');
      if (titleEl) titleEl.textContent = movieData.title || '—';

      initContinueBtn();
      updateSummary();
      updateContinueBtn();

      // Update page <title>
      document.title = `${movieData.title} – Project Direction · GreenLit`;

      showContent();
    } catch (err) {
      const is401 = err.message.includes('401');
      showError(
        is401 ? 'Token rejected (401)' : 'Could not load movie',
        is401
          ? 'Your TMDB token was rejected. Return home to update it.'
          : `Failed to fetch movie data: ${err.message}`,
        loadMovie
      );
    }
  }

  await loadMovie();
}

document.addEventListener('DOMContentLoaded', init);
