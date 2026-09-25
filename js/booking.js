// Booking view
const bookingView = document.getElementById("booking-view");
const bookingStage = document.getElementById("booking-stage");

// BOOKING FLOW (1 → 7) – uændret adfærd
const CAFES = [
  {
    id: "aarhus-v",
    name: "Aarhus V",
    address: "Vesterbrogade 36, 8000",
    img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "aarhus-c",
    name: "Aarhus C",
    address: "Søndergade 98, 8000",
    img: "https://images.unsplash.com/photo-1481833761820-0509d3217039?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "aalborg",
    name: "Aalborg",
    address: "Nytorv 21, 9000",
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: "odense",
    name: "Odense",
    address: "Kongensgade 11, 5000",
    img: "https://images.unsplash.com/photo-1498654200943-1088dd4438ae?q=80&w=800&auto=format&fit=crop",
  },
];

const booking = {
  step: 1,
  cafe: null,
  guests: null,
  month: null, // Date for 1. i måneden
  date: null, // YYYY-MM-DD
  time: null,
  type: null,
  name: "",
  phone: "",
  email: "",
  note: "",
};

function openBooking() {
  if (!bookingView || !bookingStage) return;

  // Starter bookingflowet på første trin.
  booking.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  booking.step = 1;
  renderBooking();
}

function closeBooking() {
  if (!bookingView) return;

  bookingView.hidden = true;
  document.querySelector("main.page").style.display = "";

  document
    .querySelectorAll(".tabbar .tab")
    .forEach((t) => t.classList.remove("active"));

  document.getElementById("tab-home")?.classList.add("active");
}

function renderBooking() {
  switch (booking.step) {
    case 1:
      return renderStepCafe();
    case 2:
      return renderStepGuests();
    case 3:
      return renderStepMonth();
    case 4:
      return renderStepDayAndTime();
    case 5:
      return renderStepType();
    case 6:
      return renderStepConfirm();
    case 7:
      return renderStepSuccess();
  }
}

function logo() {
  return `
   <img class="booking-logo"
     src="https://images.squarespace-cdn.com/content/v1/61fd2c9026a58c435d260f4c/1af90772-e642-4309-a2cb-f4161e36855e/SC-logo-2023-transparant-BG+Small+Crop.png"
     alt="Spilcaféen">
 `;
}

/* STEP 1 – café */
function renderStepCafe() {
  bookingStage.innerHTML = `
   ${logo()}
   <h1 class="booking-title">Vælg café</h1>
   <div class="booking-grid booking-cafes">
     ${CAFES.map(
       (c) => `
<article class="booking-card" data-cafe="${c.id}" tabindex="0">
         <img src="${"images/lokation-card.webp"}" alt="">
         <h2>${c.name}</h2>
         <p>${c.address}</p>
       </article>
     `,
     ).join("")}
   </div>
 `;
  bookingStage.querySelectorAll("[data-cafe]").forEach((card) => {
    // Vælger café og går videre til næste trin.
    function selectCafe() {
      booking.cafe = CAFES.find((c) => c.id === card.dataset.cafe);
      booking.step = 2;
      renderBooking();
    }

    card.addEventListener("click", selectCafe);

    // Gør det muligt at vælge café med Enter.
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        selectCafe();
      }
    });
  });
}

/* STEP 2 – gæster */
function renderStepGuests() {
  bookingStage.innerHTML = `
   ${logo()}
   <h2 class="booking-title">Hvor mange gæster er I?</h2>
   <div class="booking-bubbles">
     ${[2, 3, 4, 5, 6, 7, 8]
       .map((n) => `<button class="bubble" data-guests="${n}">${n}</button>`)
       .join("")}
   </div>
 `;
  bookingStage.querySelectorAll("[data-guests]").forEach((btn) => {
    btn.addEventListener("click", () => {
      booking.guests = Number(btn.dataset.guests);
      booking.step = 3;
      renderBooking();
    });
  });
}

/* STEP 3 – måned */
function renderStepMonth() {
  const d = booking.month || new Date();
  const ym = d.toLocaleDateString("da-DK", { month: "long", year: "numeric" });
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const startW = (first.getDay() + 6) % 7;
  const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const leading = Array.from(
    { length: startW },
    () => `<div class="cal-cell muted"></div>`,
  ).join("");
  const body = Array.from(
    { length: days },
    (_, i) => `<button class="cal-cell" data-day="${i + 1}">${i + 1}</button>`,
  ).join("");

  bookingStage.innerHTML = `
   ${logo()}
   <h2 class="booking-title">${ym}</h2>
   <div class="cal-header">
     <button class="cal-arrow" data-nav="-1">‹</button>
     <div style="min-width:140px"></div>
     <button class="cal-arrow" data-nav="1">›</button>
   </div>
   <div class="calendar">
     ${["ma", "ti", "on", "to", "fr", "lø", "sø"]
       .map((s) => `<div class="cal-day">${s}</div>`)
       .join("")}
     ${leading}${body}
   </div>
   <div class="legend"><span class="dot dot-green"></span> Ledige dage</div>
 `;

  bookingStage.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const diff = Number(btn.dataset.nav);
      booking.month = new Date(d.getFullYear(), d.getMonth() + diff, 1);
      renderStepMonth();
    });
  });
  bookingStage.querySelectorAll("[data-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const day = String(btn.dataset.day).padStart(2, "0");
      const mm = String((booking.month || d).getMonth() + 1).padStart(2, "0");
      const yy = (booking.month || d).getFullYear();
      booking.date = `${yy}-${mm}-${day}`;
      booking.step = 4;
      renderBooking();
    });
  });
}

/* STEP 4 – tid */
function renderStepDayAndTime() {
  const human = new Date(booking.date + "T00:00:00").toLocaleDateString(
    "da-DK",
    { day: "numeric", month: "long", year: "numeric" },
  );
  const slots = [];
  for (let h = 11; h <= 22; h++)
    ["00", "30"].forEach((m) =>
      slots.push(`${String(h).padStart(2, "0")}:${m}`),
    );
  const busy = new Set(["11:30", "14:00", "16:30", "18:00", "19:30", "20:30"]); // demo

  bookingStage.innerHTML = `
   ${logo()}
   <h2 class="booking-title">${human}</h2>
   <div class="booking-time">
     ${slots
       .map(
         (t) =>
           `<button class="slot ${
             busy.has(t) ? "busy" : ""
           }" data-time="${t}">${t}</button>`,
       )
       .join("")}
   </div>
   <div class="legend">
     <span class="dot dot-green"></span> Ledige tider &nbsp;&nbsp;
     <span class="dot dot-red"></span> Reserveret
   </div>
 `;
  bookingStage.querySelectorAll("[data-time]").forEach((btn) => {
    if (btn.classList.contains("busy")) return;
    btn.addEventListener("click", () => {
      booking.time = btn.dataset.time;
      booking.step = 5;
      renderBooking();
    });
  });
}

/* STEP 5 – type */
function renderStepType() {
  bookingStage.innerHTML = `
   ${logo()}
   <h2 class="booking-title">Vælg type</h2>
   <div class="booking-type">
     ${[1, 2, 3]
       .map(
         (n) => `
       <button class="slot primary" data-type="Vi spiller i ${n} time${
         n > 1 ? "r" : ""
       }">
         Vi spiller i ${n} time${n > 1 ? "r" : ""}
       </button>
     `,
       )
       .join("")}
   </div>
 `;
  bookingStage.querySelectorAll("[data-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      booking.type = btn.dataset.type;
      booking.step = 6;
      renderBooking();
    });
  });
}

/* STEP 6 – bekræft + kontakt */
function renderStepConfirm() {
  const place = booking.cafe
    ? `${booking.cafe.name} – ${booking.cafe.address}`
    : "";
  const humanDate = new Date(booking.date + "T00:00:00").toLocaleDateString(
    "da-DK",
    { day: "numeric", month: "long", year: "numeric" },
  );
  bookingStage.innerHTML = `
   ${logo()}
   <h2 class="booking-title">Bekræft</h2>
   <div class="booking-summary">
     <div><strong>Sted</strong><br>${place}</div>
     <div><strong>Dato</strong><br>${humanDate}</div>
     <div><strong>Tid</strong><br>${booking.time}</div>
     <div><strong>Antal gæster</strong><br>${booking.guests}</div>
     <div><strong>Type</strong><br>${booking.type}</div>
   </div>

   <form class="booking-form" id="confirm-form">
  <label for="booking-name" class="sr-only">Navn</label>
  <input id="booking-name" type="text" name="name" placeholder="Navn" required>

  <label for="booking-phone" class="sr-only">Mobil</label>
  <input id="booking-phone" type="tel" name="phone" placeholder="Mobil" required>

  <label for="booking-email" class="sr-only">E-mail</label>
  <input id="booking-email" type="email" name="email" placeholder="E-mail" required>

  <label for="booking-note" class="sr-only">Kommentar</label>
  <textarea id="booking-note" name="note" rows="3" placeholder="Kommentar"></textarea>

  <button class="booking-btn" type="submit">Bekræft booking</button>
</form>
 `;
  document.getElementById("confirm-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    booking.name = String(fd.get("name") || "");
    booking.phone = String(fd.get("phone") || "");
    booking.email = String(fd.get("email") || "");
    booking.note = String(fd.get("note") || "");
    booking.step = 7;
    renderBooking();
  });
}

/* STEP 7 – succes */
function renderStepSuccess() {
  const humanDate = new Date(booking.date + "T00:00:00").toLocaleDateString(
    "da-DK",
    { day: "numeric", month: "long", year: "numeric" },
  );
  bookingStage.innerHTML = `
   ${logo()}
   <div class="booking-success">
     <div class="success-big">Tak for din booking 😊</div>
     <div class="booking-summary" style="text-align:left">
       <div><strong>Sted</strong><br>${booking.cafe.name} – ${
         booking.cafe.address
       }</div>
       <div><strong>Dato</strong><br>${humanDate}</div>
       <div><strong>Tid</strong><br>${booking.time}</div>
       <div><strong>Antal gæster</strong><br>${booking.guests}</div>
       <div><strong>Type</strong><br>${booking.type}</div>
       <div><strong>Navn</strong><br>${booking.name}</div>
       <div><strong>Email</strong><br>${booking.email}</div>
       ${
         booking.note
           ? `<div><strong>Kommentar</strong><br>${escapeHtml(
               booking.note,
             )}</div>`
           : ""
       }
     </div>
     <button class="booking-btn" id="done-btn">Afslut</button>
   </div>
 `;
  document.getElementById("done-btn").addEventListener("click", () => {
    // Sender brugeren tilbage til forsiden efter gennemført booking.
    window.location.href = "index.html";
  });
}

// Gør booking-funktionerne tilgængelige, så de også kan bruges i app.js
window.openBooking = openBooking;
window.closeBooking = closeBooking;
// Starter bookingflowet automatisk på booking-siden.
openBooking();
