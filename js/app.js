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

  // Skjult lager (selects/inputs – vises ikke i UI)
  genre: document.getElementById("genre-select"),
  language: document.getElementById("language-select"),
  difficulty: document.getElementById("difficulty-select"),
  ratingFrom: document.getElementById("rating-from"),
  ratingTo: document.getElementById("rating-to"),
  playFrom: document.getElementById("playtime-from"),
  playTo: document.getElementById("playtime-to"),
  availableOnly: document.getElementById("available-only"),
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

  // placeholders til rating-range
  const ratings = games.map((g) => g.rating).filter(Number.isFinite);
  if (ratings.length) {
    els.ratingFrom.placeholder = Math.min(...ratings).toFixed(1);
    els.ratingTo.placeholder = Math.max(...ratings).toFixed(1);
  }
  updateFavTabCounter();
}

function bindEvents() {
  // Inputs som trigger re-render
  [
    els.search,
    els.genre,
    els.language,
    els.difficulty,
    els.ratingFrom,
    els.ratingTo,
    els.playFrom,
    els.playTo,
    els.availableOnly,
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
  els.list.addEventListener("click", (e) => {
    // Toggle fav
    const favBtn = e.target.closest("button.fav[data-fav-id]");
    if (favBtn) {
      e.stopPropagation();
      const id = String(favBtn.dataset.favId).trim();
      if (FAVS.has(id)) {
        FAVS.delete(id);
        favBtn.classList.remove("active");
      } else {
        FAVS.add(id);
        favBtn.classList.add("active");
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

  // Tabbar
  els.tabAll?.addEventListener("click", () => {
    if (!bookingView?.hidden) closeBooking();
    SHOW_FAVS = false;
    setActiveTab(els.tabAll);
    render();
  });

  // Gør det muligt at åbne et spillekort med Enter, når selve kortet har fokus.
  // e.target === card gør, at Enter på favorit-hjertet ikke også åbner spillet.

 els.list.addEventListener("keydown", (e) => {
  const card = e.target.closest(".card[data-id]");

  if (card && e.target === card && e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
    openModalById(card.dataset.id);
  }
});

  els.tabFav?.addEventListener("click", () => {
    SHOW_FAVS = true;
    setActiveTab(els.tabFav);
    render();
  });

  els.tabRes?.addEventListener("click", () => {
    setActiveTab(els.tabRes);
    openBooking();
  });

  els.tabHome?.addEventListener("click", () => {
    if (!bookingView?.hidden) closeBooking();
    SHOW_FAVS = false;
    setActiveTab(null);
    render();
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

  // Dropdown-pill logik (kategori, spillere, alder, varighed + sort)
  setupDropdownFilters();
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
  ["rating-from", "rating-to", "playtime-from", "playtime-to"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  if (els.availableOnly) els.availableOnly.checked = false;
  if (els.sort) els.sort.value = "none";

  const sortButton = document.getElementById("sort-button");
  if (sortButton) sortButton.textContent = "Sorter efter ⌄";

  // Vis alle igen (fjern fav-filter)
  SHOW_FAVS = false;
  els.tabFav?.classList.remove("active");

  render();
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
    ratingFrom: num(els.ratingFrom?.value),
    ratingTo: num(els.ratingTo?.value),
    playFrom: num(els.playFrom?.value),
    playTo: num(els.playTo?.value),
    availableOnly: !!els.availableOnly?.checked,
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

    if (f.genre !== "all" && g.genre !== f.genre) return false;
    if (f.language !== "all" && g.language !== f.language) return false;
    if (f.difficulty !== "all" && g.difficulty !== f.difficulty) return false;
    if (f.ratingFrom != null && g.rating < f.ratingFrom) return false;
    if (f.ratingTo != null && g.rating > f.ratingTo) return false;
    if (f.playFrom != null && g.playtime < f.playFrom) return false;
    if (f.playTo != null && g.playtime > f.playTo) return false;
    if (f.availableOnly && !g.available) return false;

    if (f.agePill !== "all" && g.age < Number(f.agePill)) return false;

    if (f.playersPill !== "all") {
      const [minStr, maxStr] = f.playersPill.split("-");
      const wantMin = Number(minStr);
      const wantMax = maxStr?.includes("+") ? 99 : Number(maxStr);
      const gMin = g.players?.min ?? 1;
      const gMax = g.players?.max ?? 99;
      if (gMax < wantMin || gMin > wantMax) return false;
    }

    if (f.durationPill !== "all") {
      const [a, b] = f.durationPill.split("-");
      const from = Number(a);
      const to = b?.includes("+") ? 10000 : Number(b);
      if (g.playtime < from || g.playtime > to) return false;
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
    els.list.innerHTML = `<p style="color:#7b5647">Ingen spil matcher dine filtre.</p>`;
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
    const players = g.players ? `${g.players.min}–${g.players.max}` : "—";
    const rating = Number.isFinite(g.rating) ? g.rating.toFixed(1) : "—";
    const badgeAvail = g.available ? `<span class="badge">Ledig</span>` : ``;

    return `
    <article class="card" data-id="${g.id}" tabindex="0">
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
       <button class="fav ${favActive}" data-fav-id="${
    g.id
  }" aria-label="Føj til favoritter">❤</button>
     </div>
     <h3>${escapeHtml(g.title)}</h3>
     <div class="meta">
       <span>👥 ${players}</span>
       <span>⭐ ${rating}</span>
     </div>
     <div class="extra">
       ${g.shelf ? `<span>Placering: ${escapeHtml(g.shelf)}</span>` : ""}
     </div>
   </article>
 `;
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
    String(a).localeCompare(String(b), "da")
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

  // Titel + meta
  mTitle.textContent = g.title;
  mMeta.innerHTML = [
    Number.isFinite(g.rating) ? `⭐ ${g.rating.toFixed(1)}` : null,
    g.players ? `👥 ${g.players.min}–${g.players.max}` : null,
    Number.isFinite(g.playtime) ? `⏱️ ${g.playtime} min` : null,
    g.age ? `👶 ${g.age}+` : null,
  ]
    .filter(Boolean)
    .map((x) => `<span>${x}</span>`)
    .join("");

  // Beskrivelse + detaljer
  mDesc.textContent = g.description || "";
  mDetails.innerHTML = [
    g.genre ? `<span>🎭 Kategori: ${escapeHtml(g.genre)}</span>` : "",
    g.language ? `<span>🗣️ Sprog: ${escapeHtml(g.language)}</span>` : "",
    g.difficulty ? `<span>🎯 Sværhed: ${escapeHtml(g.difficulty)}</span>` : "",
    g.shelf ? `<span>📍 Placering: ${escapeHtml(g.shelf)}</span>` : "",
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

  function setFilter(type, rawValue) {
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
        openDD.__menuPlaceholder
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
    floatingMenu.querySelectorAll("button:not([disabled])")
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
      sortButton.textContent = `${item.textContent} ⌄`;
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
