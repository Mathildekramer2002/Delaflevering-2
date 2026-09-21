Vi har i fællesskab fået udarbejdet en velfungerende løsning af vores prototype
Gruppe 8 
Kübra, Anna, Mathilde og Frederikke 

# Delaflevering 2 – Sustainable Web

I denne version arbejder jeg videre med den tidligere udviklede webapp for Spilcaféen. 
Ud fra resultaterne fra min audit i delaflevering 1 optimerer jeg løbende løsningen med fokus på bæredygtighed, webtilgængelighed, responsivt design og forretningspotentiale.

## Arbejdsproces

Jeg arbejder med én ændring ad gangen, så jeg kan teste løsningen løbende og se, hvilken effekt de enkelte ændringer har. Ændringerne bliver løbende dokumenteret gennem GitHub commits.

---

## Kodeoprydning og struktur

### Opdeling af CSS

Bookingens styling lå tidligere sammen med resten af sidens styling i `app.css`.

Jeg har flyttet den styling, der kun hører til bookingflowet, over i en separat `booking.css`.

Formålet var at:
- gøre CSS-koden mere overskuelig
- samle bookingens styling ét sted
- gøre det lettere at finde og ændre kode senere

Der er ikke ændret på designet eller funktionaliteten i forbindelse med denne ændring. Siden blev testet efter opdelingen for at sikre, at den fortsat så ud som før.

### Opdeling af JavaScript

Bookingfunktionen lå tidligere sammen med resten af funktionaliteten i `app.js`.

Jeg har flyttet bookingflowet over i en separat `booking.js`, mens den øvrige funktionalitet fortsat ligger i `app.js`.

`openBooking()` og `closeBooking()` er gjort tilgængelige via `window`, så de fortsat kan bruges fra `app.js`.

Jeg har samtidig fjernet bookingens afhængighed af `els.tabRes` og `updateBackIcon()`.

Formålet var at:
- gøre JavaScript-koden mere overskuelig
- samle bookingfunktionaliteten ét sted
- gøre koden lettere at vedligeholde og arbejde videre med

Efter ændringen testede jeg hele bookingflowet fra valg af café til afsluttet booking. Funktionen virkede fortsat som før.

---

## Kommende optimeringer

Her dokumenterer jeg løbende de næste ændringer og resultater fra mine tests.

## Billedoptimering

### Førmåling

Inden billedoptimeringen blev der udført en Lighthouse Performance-test på mobil for at have et udgangspunkt, som resultatet efter optimeringen kan sammenlignes med.

Testen viste:
- Performance: 76
- First Contentful Paint (FCP): 0,9 sek.
- Largest Contentful Paint (LCP): 5,1 sek.
- Total Blocking Time (TBT): 0 ms
- Cumulative Layout Shift (CLS): 0,133
- Samlet network payload: 7.424 KiB

Lighthouse viste desuden et optimeringspotentiale under "Improve image delivery" med en estimeret besparelse på 2.788 KiB.

![Lighthouse før billedoptimering](dokumentation/lighthouse-performance-foer.png)

![Lighthouse før billedoptimering](dokumentation/lighthouse-billeder-foer.png)

På baggrund af målingen optimeres billederne, hvorefter den samme Lighthouse-test udføres igen for at undersøge effekten.
