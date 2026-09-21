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

### Flytning af spilbilleder

I den oprindelige løsning blev spilbillederne hentet fra en ekstern GitHub-kilde. I forbindelse med billedoptimeringen har jeg flyttet billederne til projektets egen `images/games`-mappe og ændret JavaScript-koden, så appen anvender de lokale filer.

Billederne flyttes allerede på dette tidspunkt, fordi de efterfølgende skal optimeres i forhold til blandt andet dimensioner og filstørrelse. Det giver mulighed for at arbejde direkte med billedfilerne i projektet og undgår, at de senere skal flyttes igen.

Flytningen hænger samtidig sammen med en anbefaling fra auditten om at flytte spilbillederne til projektets egen hosting som en del af arbejdet med caching. Selve caching-optimeringen behandles dog først senere.

Efter ændringen kontrollerede jeg i DevTools, at spilbillederne blev hentet fra projektets lokale mappe. Herefter blev Lighthouse Performance-testen gentaget.

Resultatet efter ændringen:
- Performance: 73
- First Contentful Paint (FCP): 0,9 sek.
- Largest Contentful Paint (LCP): 6,1 sek.
- Total Blocking Time (TBT): 0 ms
- Cumulative Layout Shift (CLS): 0,133
- Speed Index: 0,9 sek.
- Estimeret besparelse under "Improve image delivery": 2.788 KiB

![Lighthouse efter billederne er flyttet ](dokumentation/lighthouse-lokal-hosting-efter.png)

Målingen viser fortsat et optimeringspotentiale for billederne. Næste trin er derfor at optimere billedernes dimensioner og filstørrelse.

### Optimering af billedstørrelser

Efter spilbillederne var flyttet lokalt, blev deres dimensioner undersøgt. Flere af billederne var over 1000 px, selvom de bliver vist væsentligt mindre på siden.

Billederne var allerede i WebP-format, så det var ikke nødvendigt at konvertere dem. I stedet har jeg reduceret de billeder, der var større end 800 px, til maksimalt 800 px. Billederne er gemt med en kvalitet på 80 % for at reducere filstørrelsen uden at forringe kvaliteten for meget.

Efter ændringen blev Lighthouse-testen gentaget. Her viste "Improve image delivery" en estimeret besparelse på 791 KiB. Det er en tydelig reduktion sammenlignet med førmålingen, hvor den estimerede besparelse var 2.788 KiB.

Performance-scoren blev dog ikke forbedret og lå efter ændringen på 71. Selvom billedoptimeringen har reduceret den estimerede besparelse under "Improve image delivery", kan der altså endnu ikke ses en forbedring i den samlede Performance-score. Performance påvirkes også af andre forhold på siden, som undersøges senere.

![Lighthouse efter optimering af spilbilleder](dokumentation/optimering-efter.png)

### Optimering af logo

Lighthouse viste efterfølgende, at logoet stadig havde et stort optimeringspotentiale. Logoet blev hentet fra en ekstern Squarespace-adresse og havde oprindeligt dimensionerne 2500 × 1892 px.

Jeg har derfor flyttet logoet til projektets egen `images`-mappe, reduceret dimensionerne og gemt det som WebP. Logoet blev efterfølgende komprimeret fra ca. 68 KB til 17 KB.

Efter optimeringen blev Lighthouse-testen gentaget. "Improve image delivery" blev reduceret fra 588 KiB til 537 KiB, og logoet fremgår ikke længere som et billede med optimeringspotentiale.

![Lighthouse før optimering af logo](dokumentation/logo-før.png)
![Lighthouse efter optimering af logo](dokumentation/logo-efter.png)

Der er stadig et optimeringspotentiale på 537 KiB for spilbillederne. Lighthouse viser blandt andet, at nogle af billederne bliver hentet i større dimensioner, end de bliver vist i. Derfor undersøges responsive billeder som næste del af billedoptimeringen.


Som en del af optimeringen blev billeder over 800 px reduceret til maksimalt 800 px. Tabellen viser eksempler på, hvordan dette har påvirket billedernes dimensioner og filstørrelse:

| Billede | Før dimensioner | Efter dimensioner | Før filstørrelse | Efter filstørrelse |
|---|---:|---:|---:|---:|
| Catan | 1533 × 1533 px | 800 × 800 px | 525 KB | 64,6 KB |
| Cluedo | 1122 × 1122 px | 800 × 800 px | 380 KB | 84,6 KB |
| Exploding Kittens | 1116 × 1116 px | 800 × 800 px | 300 KB | 47,8 KB |
| Carcassonne | 1069 × 1068 px | 800 × 800 px | 259 KB | 58,0 KB |
| Azul | 1000 × 1000 px | 800 × 800 px | 312 KB | 84,1 KB |