// DATA & KONSTANTER

const DATA_URL =
  "https://raw.githubusercontent.com/cederdorff/race/refs/heads/master/data/games.json";
const STORAGE_KEY = "favs"; // localStorage-nøgle til favoritter

// DOM-REFERENCER (samlet ét sted)

const els = {
  // Pill-værdier (kan mangle i HTML – så laver vi dem skjult)
  agePill: document.getElementById("age-pill"),
  playersPill: document.getElementById("players-pill"),
  durationPill: document.getElementById("duration-pill"),

  // Søg + liste
  search: document.getElementById("search-input"),
  list: document.getElementById("game-list"),
  popularGames: document.getElementById("popular-games"),

  // Skjult lager (selects/inputs – vises ikke i UI)
  genre: document.getElementById("genre-select"),
  language: document.getElementById("language-select"),
  difficulty: document.getElementById("difficulty-select"),
  ratingFrom: document.getElementById("rating-from"),
  ratingTo: document.getElementById("rating-to"),
  sort: document.getElementById("sort-select"),
  clear: document.getElementById("clear-filters"),

  // Top/back
  backBtn: document.getElementById("go-back"),

  // Tabbar
  tabAll: document.getElementById("tab-all"),
  tabHome: document.getElementById("tab-home"),
  tabFav: document.getElementById("filter-favourites"),
  tabRes: document.getElementById("tab-reserve"),
};

// Modal (spildetaljer)
const modal = document.getElementById("game-modal");
const mImg = document.getElementById("modal-image");
const mTitle = document.getElementById("modal-title");
const mMeta = document.getElementById("modal-meta");
const mDesc = document.getElementById("modal-desc");
const mDetails = document.getElementById("modal-details");
const mRulesWrap = document.getElementById("modal-rules-wrap");
const mRules = document.getElementById("modal-rules");
const rulesBtn = document.getElementById("rules-toggle");
const rulesContent = document.getElementById("rules-content");

// De to hovedvisninger i appen.
const homeView = document.getElementById("home-view");
const gamesView = document.getElementById("games-view");

// HJÆLPEFUNKTION: sørg for skjulte pill-inputs findes

function ensureHiddenPill(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("input");
    el.type = "hidden";
    el.id = id;
    el.value = "all";
    document.body.appendChild(el);
  }
  return el;
}
els.agePill = els.agePill || ensureHiddenPill("age-pill");
els.playersPill = els.playersPill || ensureHiddenPill("players-pill");
els.durationPill = els.durationPill || ensureHiddenPill("duration-pill");

// STATE

let GAMES = [];
let SHOW_FAVS = false;
let FAVS = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));

// Gemmer de filtre, hvor brugeren kan vælge flere muligheder.
const MULTI_FILTERS = {
  genre: new Set(),
  players: new Set(),
  duration: new Set(),
};

// Gemmer det element der havde fokus, inden en modal åbnes, så fokus kan sendes tilbage til samme sted, når modalen lukkes.
let lastFocusedElement = null;

// INIT

init();
async function init() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("Kunne ikke hente data");
    GAMES = await res.json();

    hydrateSelects(GAMES);
    bindEvents();
    render();
    renderPopularGames();
  } catch (err) {
    console.error(err);
    els.list.innerHTML = `<p>Kunne ikke indlæse spil.</p>`;
  }
}

// UI INITIALISERING (selects, events)

function hydrateSelects(games) {
  fillUniqueOptions(els.genre, unique(games.map((g) => g.genre)));
  fillUniqueOptions(els.language, unique(games.map((g) => g.language)));
  fillUniqueOptions(els.difficulty, unique(games.map((g) => g.difficulty)));
  updateFavTabCounter();
}

function bindEvents() {
  // Inputs som trigger re-render
  [
    els.search,
    els.genre,
    els.language,
    els.difficulty,
    els.sort,
    els.agePill,
    els.playersPill,
    els.durationPill,
  ].forEach((el) => el?.addEventListener("input", render));

  // “Ryd filtre” – både synlig og skjult knap
  document
    .getElementById("clear-filters-pill")
    ?.addEventListener("click", clearAllFilters);
  els.clear?.addEventListener("click", clearAllFilters);

  // Klik i grid: ❤️ eller åbn modal
  [els.list, els.popularGames].forEach((list) => {
    list?.addEventListener("click", (e) => {
      // Toggle fav
      const favBtn = e.target.closest("button.fav[data-fav-id]");
      if (favBtn) {
        e.stopPropagation();
        const id = String(favBtn.dataset.favId).trim();
        if (FAVS.has(id)) {
          FAVS.delete(id);
          favBtn.classList.remove("active");
          favBtn.setAttribute("aria-label", "Tilføj til favoritter");

          // Giver skærmlæseren besked om, at spillet er fjernet.
          const feedback = document.getElementById("filter-feedback");
          if (feedback) {
            feedback.textContent = "Fjernet fra favoritter";
          }
        } else {
          FAVS.add(id);
          favBtn.classList.add("active");
          favBtn.setAttribute("aria-label", "Fjern fra favoritter");

          // Giver skærmlæseren besked om, at spillet er tilføjet.
          const feedback = document.getElementById("filter-feedback");
          if (feedback) {
            feedback.textContent = "Tilføjet til favoritter";
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...FAVS]));
        updateFavTabCounter();
        if (SHOW_FAVS) render();
        return;
      }
      // Åbn modal
      const card = e.target.closest(".card[data-id]");
      if (card) openModalById(card.dataset.id);
    });
  });

  // Tabbar
  els.tabAll?.addEventListener("click", () => {
    if (!bookingView?.hidden) closeBooking();
    SHOW_FAVS = false;
    homeView.hidden = true;
    gamesView.hidden = false;
    setActiveTab(els.tabAll);
    document.getElementById("page-title").textContent = "ALLE SPIL";
    render();
  });

  // Gør det muligt at åbne et spillekort med Enter, når selve kortet har fokus.
  // e.target === card gør, at Enter på favorit-hjertet ikke også åbner spillet.

  [els.list, els.popularGames].forEach((list) => {
    list?.addEventListener("keydown", (e) => {
      const card = e.target.closest(".card[data-id]");

      if (card && e.target === card && e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        openModalById(card.dataset.id);
      }
    });
  });

  els.tabFav?.addEventListener("click", () => {
    // Lukker bookingvisningen, hvis brugeren går direkte til favoritter.
    if (!bookingView?.hidden) closeBooking();

    SHOW_FAVS = true;
    homeView.hidden = true;
    gamesView.hidden = false;
    setActiveTab(els.tabFav);
    document.getElementById("page-title").textContent = "DINE FAVORITTER";
    render();
  });

  els.tabRes?.addEventListener("click", () => {
    setActiveTab(els.tabRes);
    openBooking();
  });

  els.tabHome?.addEventListener("click", () => {
    if (!bookingView?.hidden) closeBooking();

    SHOW_FAVS = false;

    // Viser forsiden og skjuler spiloversigten.
    homeView.hidden = false;
    gamesView.hidden = true;

    setActiveTab(els.tabHome);
  });

  // Tilbageknap – luk modal/booking hvis åbne
  els.backBtn?.addEventListener("click", () => {
    if (modal && modal.hidden === false) {
      closeModal();
      return;
    }
    if (bookingView && bookingView.hidden === false) {
      closeBooking();
      return;
    }
    // ellers ingen handling
  });

  // Starter dropdown til sortering.
  setupDropdownFilters();

  // Starter den nye samlede filtermenu.
  setupFilterMenu();
  // Knap på forsiden åbner siden med alle spil.
  document
    .getElementById("home-games-button")
    ?.addEventListener("click", () => {
      els.tabAll?.click();
    });

  // Knap på forsiden åbner den eksisterende booking.
  document
    .getElementById("home-booking-button")
    ?.addEventListener("click", () => {
      document.getElementById("tab-reserve")?.click();
    });
}

function setFilter(type, rawValue) {
  // Kategori, spillere og varighed kan have flere aktive valg.
  if (type === "genre" || type === "players" || type === "duration") {
    const selected = MULTI_FILTERS[type];

    if (rawValue === "all") {
      selected.clear();
    } else if (selected.has(rawValue)) {
      selected.delete(rawValue);
    } else {
      selected.add(rawValue);
    }

    return true;
  }
  if (type === "genre") {
    const sel = document.getElementById("genre-select");
    if (!sel) return false;

    if (rawValue === "all") {
      sel.value = "all";
      return true;
    }

    const opts = Array.from(sel.options);
    const lower = String(rawValue).toLowerCase();

    let match =
      opts.find((o) => o.value.toLowerCase() === lower) ||
      opts.find((o) => o.textContent.toLowerCase() === lower) ||
      opts.find((o) => o.textContent.toLowerCase().includes(lower));

    sel.value = match ? match.value : "all";
    return true;
  }

  if (type === "players") {
    (els.playersPill || ensureHiddenPill("players-pill")).value = rawValue;
    return true;
  }

  if (type === "age") {
    (els.agePill || ensureHiddenPill("age-pill")).value = rawValue;
    return true;
  }

  if (type === "duration") {
    (els.durationPill || ensureHiddenPill("duration-pill")).value = rawValue;
    return true;
  }

  return false;
}

// Viser hvilke filtre brugeren har valgt.
function updateActiveFilters() {
  const filterOptions = document.getElementById("filter-options");
  const tagContainer = document.getElementById("active-filter-tags");

  if (!filterOptions || !tagContainer) return;

  // Fjerner tidligere markeringer.
  filterOptions.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.remove("selected-filter");
  });

  // Markerer alle valgte filtre med flueben.
  Object.entries(MULTI_FILTERS).forEach(([type, values]) => {
    values.forEach((value) => {
      const button = filterOptions.querySelector(
        `[data-filter="${type}"][data-value="${value}"]`,
      );

      button?.classList.add("selected-filter");
    });
  });

  // Alder har fortsat kun ét aktivt valg.
  const age = els.agePill?.value || "all";

  if (age !== "all") {
    const ageButton = filterOptions.querySelector(
      `[data-filter="age"][data-value="${age}"]`,
    );

    ageButton?.classList.add("selected-filter");
  }

  // Viser de aktive filtre som tags på større skærme.
  const tags = [];

  filterOptions.querySelectorAll(".selected-filter").forEach((button) => {
    tags.push(
      `<span class="active-filter-tag">${button.textContent.trim()}</span>`,
    );
  });

  tagContainer.innerHTML = tags.join("");
}

// Styrer den samlede filtermenu med mus og tastatur.
function setupFilterMenu() {
  const filterButton = document.getElementById("filter-main-btn");
  const filterOptions = document.getElementById("filter-options");

  if (!filterButton || !filterOptions) return;

  const groups = filterOptions.querySelectorAll(".filter-group");

  // Åbner hovedmenuen.
  function openFilterMenu() {
    filterOptions.hidden = false;
    filterButton.setAttribute("aria-expanded", "true");
  }

  // Lukker alle undermenuer.
  function closeSubmenus() {
    groups.forEach((group) => {
      const button = group.querySelector(".filter-group-btn");
      const submenu = group.querySelector(".filter-submenu");

      submenu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    });
  }

  // Lukker hele filtermenuen.
  function closeFilterMenu() {
    filterOptions.hidden = true;
    filterButton.setAttribute("aria-expanded", "false");
    closeSubmenus();
  }

  // Åbner og lukker hovedmenuen.
  filterButton.addEventListener("click", () => {
    const isOpen = filterButton.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeFilterMenu();
    } else {
      openFilterMenu();
    }
  });

  // Gør kategorierne i filtermenuen interaktive.
  groups.forEach((group) => {
    const groupButton = group.querySelector(".filter-group-btn");
    const submenu = group.querySelector(".filter-submenu");
    const choices = submenu.querySelectorAll("button");

    function openSubmenu() {
      // Lukker de andre undermenuer først.
      groups.forEach((otherGroup) => {
        if (otherGroup === group) return;

        const otherButton = otherGroup.querySelector(".filter-group-btn");
        const otherSubmenu = otherGroup.querySelector(".filter-submenu");

        otherSubmenu.hidden = true;
        otherButton.setAttribute("aria-expanded", "false");
      });

      submenu.hidden = false;
      groupButton.setAttribute("aria-expanded", "true");
    }

    function closeSubmenu() {
      submenu.hidden = true;
      groupButton.setAttribute("aria-expanded", "false");
    }

    // Hover åbner undermenuen for brugere med mus.
    group.addEventListener("mouseenter", openSubmenu);

    // Enter eller klik åbner samme menu.
    groupButton.addEventListener("click", () => {
      const isOpen = groupButton.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeSubmenu();
      } else {
        openSubmenu();
      }
    });

    // Enter på en filtermulighed vælger filteret.
    // Et klik på en filtermulighed vælger filteret.
    choices.forEach((choice) => {
      choice.addEventListener("click", () => {
        const type = choice.dataset.filter;
        const value = choice.dataset.value;

        // Gemmer det valgte filter.
        setFilter(type, value);

        // Opdaterer markeringen af de valgte filtre.
        updateActiveFilters();

        // Opdaterer spillelisten med det valgte filter.
        render();
        // Lukker filtermenuen efter valget.
        closeFilterMenu();

        // Sender fokus tilbage til FILTRE efter valget.
        filterButton.focus();
      });
    });
  });

  // Escape lukker menuen og sender fokus tilbage.
  filterOptions.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFilterMenu();
      filterButton.focus();
    }
  });

  // Escape virker også, hvis fokus stadig står på hovedknappen.
  filterButton.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeFilterMenu();
    }
  });

  // Lukker menuen, hvis brugeren klikker udenfor.
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".filter-menu")) {
      closeFilterMenu();
    }
  });
}

// Marker aktiv tab
function setActiveTab(el) {
  document
    .querySelectorAll(".tabbar .tab")
    .forEach((t) => t.classList.remove("active"));
  if (el?.classList.contains("tab")) el.classList.add("active");
}

// RYD FILTRE

function clearAllFilters() {
  if (els.search) els.search.value = "";

  // Pills
  els.agePill.value = "all";
  els.playersPill.value = "all";
  els.durationPill.value = "all";

  // Skjulte selects/inputs
  ["genre", "language", "difficulty"].forEach((k) => {
    const s = document.getElementById(`${k}-select`);
    if (s) s.value = "all";
  });

  if (els.sort) els.sort.value = "none";

  const sortButton = document.getElementById("sort-button");
  if (sortButton) sortButton.textContent = "SORTER";

  // Vis alle igen (fjern fav-filter)
  SHOW_FAVS = false;
  els.tabFav?.classList.remove("active");

  // Rydder filtre med flere valgmuligheder.
  MULTI_FILTERS.genre.clear();
  MULTI_FILTERS.players.clear();
  MULTI_FILTERS.duration.clear();
  updateActiveFilters();

  render();

  // Giver skærmlæseren besked om, at filtrene er blevet ryddet.
  const feedback = document.getElementById("filter-feedback");
  if (feedback) {
    feedback.textContent = "Filtre er ryddet";
  }
}

// FILTER / SORT

const valueOrAll = (el) => (el && el.value ? el.value : "all");

function getFilters() {
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    query: (els.search?.value || "").trim().toLowerCase(),
    genre: valueOrAll(els.genre),
    language: valueOrAll(els.language),
    difficulty: valueOrAll(els.difficulty),
    sort: valueOrAll(els.sort),
    agePill: valueOrAll(els.agePill),
    playersPill: valueOrAll(els.playersPill),
    durationPill: valueOrAll(els.durationPill),
  };
}

function applyFilters(arr, f) {
  return arr.filter((g) => {
    const text = (
      g.title +
      " " +
      (g.description || "") +
      " " +
      (g.rules || "")
    ).toLowerCase();
    if (f.query && !text.includes(f.query)) return false;

    // Spillet skal passe til mindst én af de valgte kategorier.
    if (MULTI_FILTERS.genre.size > 0 && !MULTI_FILTERS.genre.has(g.genre)) {
      return false;
    }
    if (f.language !== "all" && g.language !== f.language) return false;
    if (f.difficulty !== "all" && g.difficulty !== f.difficulty) return false;

    if (f.agePill !== "all" && g.age < Number(f.agePill)) return false;

    // Spillet skal passe til mindst ét af de valgte spillerintervaller.
    if (MULTI_FILTERS.players.size > 0) {
      const matchesPlayers = [...MULTI_FILTERS.players].some((value) => {
        const [minStr, maxStr] = value.split("-");
        const wantMin = Number(minStr);
        const wantMax = maxStr?.includes("+") ? 99 : Number(maxStr);

        const gMin = g.players?.min ?? 1;
        const gMax = g.players?.max ?? 99;

        return !(gMax < wantMin || gMin > wantMax);
      });

      if (!matchesPlayers) return false;
    }

    // Spillet skal passe til mindst ét af de valgte tidsintervaller.
    if (MULTI_FILTERS.duration.size > 0) {
      const matchesDuration = [...MULTI_FILTERS.duration].some((value) => {
        const [a, b] = value.split("-");
        const from = Number(a);
        const to = b?.includes("+") ? 10000 : Number(b);

        return g.playtime >= from && g.playtime <= to;
      });

      if (!matchesDuration) return false;
    }

    if (SHOW_FAVS && !FAVS.has(String(g.id))) return false;
    return true;
  });
}

function applySort(arr, key) {
  const out = [...arr];
  switch (key) {
    case "title":
      out.sort((a, b) => a.title.localeCompare(b.title, "da"));
      break;
    case "playtime":
      out.sort((a, b) => (a.playtime ?? 0) - (b.playtime ?? 0));
      break;
    case "rating":
      out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
  }
  return out;
}

// RENDER

function render() {
  const f = getFilters();
  const filtered = applyFilters(GAMES, f);
  const sorted = applySort(filtered, f.sort);

  if (!sorted.length) {
    if (SHOW_FAVS && FAVS.size === 0) {
      els.list.innerHTML = `
      <div class="empty-favorites">
        <h2>Du har endnu ingen favoritter</h2>
        <p>Find alle dine yndlingsspil her</p>
        <button type="button" id="show-all-games">SE ALLE SPIL</button>
      </div>
    `;
      // Sender brugeren tilbage til visningen med alle spil.
      document
        .getElementById("show-all-games")
        ?.addEventListener("click", () => {
          els.tabAll?.click();
        });
    } else {
      els.list.innerHTML = `
      <p style="color:#7b5647">Ingen spil matcher dine filtre.</p>
    `;
    }

    updateBackIcon();
    return;
  }
  els.list.innerHTML = sorted.map(gameCard).join("");
  updateFavTabCounter();
  updateBackIcon();
}

// Opretter spillekortene.
// tabindex="0" gør, at selve kortet kan få fokus ved navigation med tastatur.
function gameCard(g) {
  const imageName = g.image.split("/").pop();
  const imageBase = imageName.replace(".webp", "");
  const favActive = FAVS.has(String(g.id)) ? "active" : "";
  // Fortæller skærmlæseren, om spillet kan tilføjes eller fjernes fra favoritter.
  const favLabel = FAVS.has(String(g.id))
    ? "Fjern fra favoritter"
    : "Tilføj til favoritter";
  const players = g.players ? `${g.players.min}–${g.players.max}` : "—";
  const rating = Number.isFinite(g.rating) ? g.rating.toFixed(1) : "—";
  const badgeAvail = g.available ? `<span class="badge">Ledig</span>` : ``;

  return `
    <article class="card" data-id="${g.id}" tabindex="0" role="button" aria-label="${escapeHtml(g.title)}">
     <div class="thumb">
       <picture>
  <source
    media="(max-width: 600px)"
    srcset="images/games/${imageBase}-200.webp"
  >
  <img
    src="images/games/${imageBase}-400.webp"
    alt="${escapeHtml(g.title)}"
    style="object-fit:contain;"
  >
</picture>
       <div class="badges">${badgeAvail}</div>
     </div>
     <h3>${escapeHtml(g.title)}</h3>
     <div class="meta">
       <span>
          <img src="images/profile.svg" alt="">${players}
       </span>

       <span>
        <img src="images/star.svg" alt="">${rating}
        <span>
     </div>
     <div class="extra">
       ${g.shelf ? `<span>Placering: ${escapeHtml(g.shelf)}</span>` : ""}
     </div>
      <button class="fav ${favActive}" data-fav-id="${
        g.id
      }" aria-label="${favLabel}">❤</button>
   </article>
 `;
}

// Viser de bedst bedømte spil på forsiden.
function renderPopularGames() {
  const popularGames = document.getElementById("popular-games");

  if (!popularGames || !GAMES.length) return;

  const games = [...GAMES]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);

  popularGames.innerHTML = games.map(gameCard).join("");
}

// HELPERS

function fillUniqueOptions(select, arr) {
  if (!select) return;
  unique(arr).forEach((v) => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = v;
    select.appendChild(o);
  });
}
function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "da"),
  );
}
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function updateFavTabCounter() {
  const s = els.tabFav?.querySelector("small");
  if (s) s.textContent = `Favoritter (${FAVS.size})`;
}

// MODAL (spildetaljer)

function openModalById(id) {
  const g = GAMES.find((x) => String(x.id) === String(id));
  if (!g || !modal) return;
  // Gemmer det kort brugeren står på, så fokus kan komme tilbage hertil bagefter.
  lastFocusedElement = document.activeElement;

  // Billede
  mImg.src = g.image;
  mImg.alt = g.title;

  // Viser spillets navn i modalvinduet.
  mTitle.textContent = g.title;

  // Viser de vigtigste informationer om spillet.
  mMeta.innerHTML = [
    Number.isFinite(g.rating)
      ? `<span><img src="images/star.svg" alt=""> ${g.rating.toFixed(1)}</span>`
      : null,

    g.players
      ? `<span><img src="images/profile.svg" alt=""> ${g.players.min}–${g.players.max}</span>`
      : null,

    Number.isFinite(g.playtime)
      ? `<span><img src="images/ur.svg" alt=""> ${g.playtime} min</span>`
      : null,

    g.age ? `<span>${g.age}+</span>` : null,
  ]
    .filter(Boolean)
    .join("");

  // Beskrivelse + detaljer
  mDesc.textContent = g.description || "";
  mDetails.innerHTML = [
    g.genre ? `<span> Kategori: ${escapeHtml(g.genre)}</span>` : "",
    g.language ? `<span> Sprog: ${escapeHtml(g.language)}</span>` : "",
    g.difficulty ? `<span> Sværhed: ${escapeHtml(g.difficulty)}</span>` : "",
    g.shelf ? `<span> Placering: ${escapeHtml(g.shelf)}</span>` : "",
    g.available != null
      ? `<span>${g.available ? "✅ Ledig" : "❌ Udlånt"}</span>`
      : "",
  ].join("");

  // Regler (fold-ud)
  mRules.textContent =
    g.rules || "Der er endnu ikke tilføjet regler for dette spil.";
  mRulesWrap.hidden = false;
  rulesContent.classList.remove("open");
  rulesBtn.setAttribute("aria-expanded", "false");

  modal.hidden = false;
  document.body.style.overflow = "hidden";
  updateBackIcon();

  // Flytter fokus til luk-knappen, når modalen er blevet vist.
  requestAnimationFrame(() => {
    modal.querySelector(".modal-close").focus();
  });
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  updateBackIcon();
  // Sender fokus tilbage til det kort, som brugeren åbnede modalvinduet fra.
  lastFocusedElement?.focus();
}

// Regler-toggle
rulesBtn?.addEventListener("click", () => {
  const isOpen = rulesContent.classList.toggle("open");
  rulesBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

// Luk modal ved klik på backdrop/× eller Escape
modal?.addEventListener("click", (e) => {
  if (
    e.target.matches("[data-close]") ||
    e.target.classList.contains("modal-backdrop")
  ) {
    closeModal();
  }
});

// Tastaturstyring i modalvinduet.
// Escape lukker modalen, og Tab/Shift + Tab holder fokus mellem
// luk-knappen og Regler, så fokus ikke fortsætter til siden bagved.

document.addEventListener("keydown", (e) => {
  if (!modal || modal.hidden) return;

  if (e.key === "Escape") {
    closeModal();
    return;
  }

  if (e.key === "Tab") {
    const closeBtn = modal.querySelector(".modal-close");

    if (e.shiftKey && document.activeElement === closeBtn) {
      e.preventDefault();
      rulesBtn.focus();
    } else if (!e.shiftKey && document.activeElement === rulesBtn) {
      e.preventDefault();
      closeBtn.focus();
    }
  }
});

// TOP-FILTERS (dropdown-pills)

function setupDropdownFilters() {
  const row = document.querySelector(".filterbar");
  let openDD = null;
  let floatingMenu = null;
  // Gemmer den knap der åbnede dropdown-menuen, så fokus kan komme tilbage til den efter et valg.
  let activePill = null;

  function openDropdown(dd, pill) {
    closeDropdown();
    // Gemmer den knap brugeren åbner dropdown-menuen fra, så fokus kan komme tilbage til den efter et valg.
    activePill = pill;
    dd.classList.add("open");
    const menu = dd.querySelector(".dropdown-menu");
    if (!menu) return;

    const r = pill.getBoundingClientRect();
    const w = Math.max(180, r.width);

    floatingMenu = menu;
    floatingMenu.classList.add("dropdown-floating");
    floatingMenu.style.minWidth = w + "px";
    floatingMenu.style.left = r.left + "px";
    floatingMenu.style.top = r.bottom + 6 + "px";

    dd.__menuPlaceholder = document.createComment("menu-placeholder");
    menu.parentNode.insertBefore(dd.__menuPlaceholder, menu);
    document.body.appendChild(floatingMenu);

    openDD = dd;

    window.addEventListener("scroll", closeDropdown, {
      passive: true,
      once: true,
    });
    window.addEventListener("resize", closeDropdown, {
      passive: true,
      once: true,
    });
  }

  function closeDropdown() {
    if (!openDD) return;
    if (floatingMenu && openDD.__menuPlaceholder) {
      openDD.__menuPlaceholder.parentNode.insertBefore(
        floatingMenu,
        openDD.__menuPlaceholder,
      );
      openDD.__menuPlaceholder.remove();
      floatingMenu.classList.remove("dropdown-floating");
      floatingMenu.style.left = "";
      floatingMenu.style.top = "";
      floatingMenu.style.minWidth = "";
    }
    floatingMenu = null;
    openDD.classList.remove("open");
    openDD = null;
  }

  // Åbn/luk dropdowns
  row?.addEventListener("pointerdown", (e) => {
    const pill = e.target.closest(".filter-dropdown .pill");
    if (!pill) return;

    e.preventDefault();
    e.stopPropagation();

    const dd = pill.closest(".filter-dropdown");

    if (openDD === dd) {
      closeDropdown();
    } else {
      openDropdown(dd, pill);
    }
  });

  // Gør det muligt at åbne og lukke dropdowns med Enter.
  row?.addEventListener("keydown", (e) => {
    const pill = e.target.closest(".filter-dropdown .pill");
    if (!pill || e.key !== "Enter") return;

    e.preventDefault();

    const dd = pill.closest(".filter-dropdown");

    if (openDD === dd) {
      closeDropdown();
    } else {
      openDropdown(dd, pill);

      // Flytter fokus til den første valgmulighed i den åbne dropdown.
      const firstOption = floatingMenu?.querySelector("button");
      firstOption?.focus();
    }
  });

  // Holder fokus inde i den dropdown der er åben.
  // Først når dropdownen lukkes, kan Tab gå videre til næste filter.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab" || !openDD || !floatingMenu) return;

    // Finder knappen til den dropdown der er åben.
    const filterButton = openDD.querySelector(".pill");

    // Finder alle valgmuligheder i den åbne dropdown.
    const options = Array.from(
      floatingMenu.querySelectorAll("button:not([disabled])"),
    );

    if (!filterButton || options.length === 0) return;

    const firstOption = options[0];
    const lastOption = options[options.length - 1];
    const currentFocus = document.activeElement;

    // Tab fra sidste valg går tilbage til filterknappen.
    if (!e.shiftKey && currentFocus === lastOption) {
      e.preventDefault();
      filterButton.focus();
      return;
    }

    // Tab fra filterknappen går til første valg.
    if (!e.shiftKey && currentFocus === filterButton) {
      e.preventDefault();
      firstOption.focus();
      return;
    }

    // Shift + Tab fra første valg går tilbage til filterknappen.
    if (e.shiftKey && currentFocus === firstOption) {
      e.preventDefault();
      filterButton.focus();
      return;
    }

    // Shift + Tab fra filterknappen går til sidste valg.
    if (e.shiftKey && currentFocus === filterButton) {
      e.preventDefault();
      lastOption.focus();
    }
  });

  // Klik på menupunkt
  document.addEventListener("click", (e) => {
    const item = e.target.closest(".dropdown-menu button");
    if (!item) return;

    // Sortering
    if (item.dataset.sortValue) {
      if (els.sort) {
        els.sort.value = item.dataset.sortValue;
      }

      // Vis den valgte sortering på knappen
      const sortButton = document.getElementById("sort-button");
      if (sortButton) {
        sortButton.textContent = `${item.textContent}`;
      }

      render();
      closeDropdown();
      // Sender fokus tilbage til den dropdown-knap brugeren kom fra.
      activePill?.focus();
      e.stopPropagation();
      return;
    }

    // Filtrering
    const ok = setFilter(item.dataset.filter, item.dataset.value);

    if (ok) render();
    closeDropdown();
    // Sender fokus tilbage til den dropdown-knap brugeren kom fra, når menuen er blevet lukket.
    requestAnimationFrame(() => {
      activePill?.focus();
    });
    e.stopPropagation();
  });

  // Klik udenfor lukker
  document.addEventListener("pointerdown", (e) => {
    if (!openDD) return;
    const inside = e.target.closest(".filter-dropdown");
    const inMenu = e.target.closest(".dropdown-menu");
    if (!inside && !inMenu) closeDropdown();
  });
}

// Tilbageknap – kun synlig når modal eller booking er åben

function isHomeView() {
  const modalOpen = modal && modal.hidden === false;
  const bookingOpen = bookingView && bookingView.hidden === false;
  return !(modalOpen || bookingOpen);
}
function updateBackIcon() {
  if (!els.backBtn) return;
  els.backBtn.style.visibility = isHomeView() ? "hidden" : "visible";
}
