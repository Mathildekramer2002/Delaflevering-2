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


### Responsive spilbilleder

Efter den første billedoptimering viste Lighthouse fortsat, at flere af spilbillederne var større end nødvendigt i forhold til den størrelse, de blev vist i. Samtidig havde jeg i den tidligere audit fundet, at spiloversigten på mobil med fordel kunne vises i to kolonner i stedet for én. Jeg ændrede derfor layoutet til to kolonner på mindre skærme.

Jeg testede efterfølgende layoutet manuelt ved forskellige skærmbredder. Ved 390 px vises spilkortene i to kolonner, så der kan vises flere spil på skærmen ad gangen.

![Responsiv visning ved 390 px](dokumentation/responsive-390px.png)

*Manuel test af spiloversigten ved en skærmbredde på 390 px.*

Layoutet blev også testet ved 320 px for at undersøge, om de to kolonner fortsat fungerede på en mindre skærm. Her bevares de to kolonner, og billederne tilpasser sig fortsat kortenes størrelse.

![Responsiv visning ved 320 px](dokumentation/responsive-320px.png)

*Manuel test ved 320 px, hvor spilkortene fortsat vises i to kolonner.*

Lighthouse viste, at spilbillederne blev vist i forskellige størrelser afhængigt af skærmstørrelsen. På mobil blev billederne vist omkring 252 × 252 px, mens de på større skærme blev vist omkring 403 × 403 px. Jeg lavede derfor to versioner af hvert spilbillede på ca. 252 × 252 px og 403 × 403 px.

I koden anvendes `<picture>` med et breakpoint ved 600 px, så den mindre billedfil indlæses på små skærme, mens den større version bruges på større skærme. På den måde tilpasses både layoutet og den indlæste billedfil til skærmstørrelsen.

Filnavnet til billederne dannes dynamisk ud fra det oprindelige billednavn:

```js
const imageName = g.image.split("/").pop();
const imageBase = imageName.replace(".webp", "");
```

Herefter bruges `imageBase` i `<picture>`, så den samme løsning automatisk kan bruges på alle spilkort:

```html
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
```

På skærme op til 600 px indlæses `-200.webp`-versionen, mens `-400.webp`-versionen bruges på større skærme. Filnavnene bruges til at skelne mellem de to versioner, mens billedernes faktiske dimensioner er ca. 252 × 252 px og 403 × 403 px.

Efter ændringen blev Lighthouse-testen gentaget. Det estimerede optimeringspotentiale under "Improve image delivery" blev reduceret fra 791 KiB efter den tidligere billedoptimering til 81 KiB.

![Lighthouse efter responsive billeder](dokumentation/responsive-billeder-efter.png)

*Efter implementeringen af responsive billeder er det estimerede optimeringspotentiale reduceret til 81 KiB. De resterende forslag handler primært om yderligere komprimering.*

De resterende forslag fra Lighthouse handler ikke længere om, at spilbilledernes dimensioner er for store, men primært om yderligere komprimering. Jeg har valgt ikke at komprimere billederne yderligere på nuværende tidspunkt, da jeg også ønsker at bevare en passende billedkvalitet.

Den samlede Performance-score blev også målt igen på mobil. I den oprindelige førmåling var scoren 76, mens den efter billedoptimeringerne blev målt til 80. Billedoptimeringen har dermed bidraget til en forbedret performance, da der nu indlæses væsentligt mindre billeddata. Samtidig blev optimeringspotentialet under "Improve image delivery" reduceret fra 2.788 KiB i den oprindelige måling til 81 KiB. Lighthouse-resultater kan variere mellem målinger, og derfor bruges scoren sammen med de konkrete målinger af billeddata til at vurdere effekten.

![Lighthouse Performance efter responsive billeder](dokumentation/lighthouse-responsive-billeder-efter.png)

*Mobilmåling efter optimeringerne med en Performance-score på 80.*


### Tydelig fokusmarkering

Keyboard-testen fra delaflevering 1 viste, at det flere steder var uklart, hvilket element der havde fokus ved tastaturnavigation. Det gjaldt blandt andet søgefeltet, sorteringsknapperne og bundnavigationen.

![Keyboard-test før optimering](dokumentation/keyboard-test.png)

*Figur: Keyboard-test fra delaflevering 1, som viser problemer med blandt andet manglende eller utydelig fokusmarkering.*

#### Optimering

For at gøre det tydeligere, hvor brugeren befinder sig ved navigation med tastatur, er der tilføjet en ensartet rød, stiplet fokusmarkering på interaktive elementer.

Søgefeltet får fokusmarkering omkring hele søgeboksen, mens knapper og andre interaktive elementer får markeringen omkring selve elementet.

Fokusmarkeringen er testet med både Tab og Shift + Tab.

![Fokusmarkering på søgefelt](dokumentation/fokus-sogefelt.png)

*Figur: Den nye fokusmarkering omkring søgefeltet ved tastaturnavigation.*

![Fokusmarkering på bundnavigation](dokumentation/fokus-bundnavigation.png)

*Figur: Den nye fokusmarkering i bundnavigationen ved tastaturnavigation.*

#### Filter- og sorteringsområdet

Ved test af den nye fokusmarkering blev det observeret, at dele af markeringen omkring filterknapperne blev skjult, fordi knapperne lå tæt sammen.

Sortering og filtrering blev samtidig adskilt tydeligere. De tre tidligere sorteringsknapper blev samlet i én "Sorter efter"-dropdown, som blev placeret ved siden af "Ryd filtre". Afstanden og luften omkring knapperne blev desuden øget, så fokusmarkeringen ikke længere bliver skjult.

Efter ændringerne blev området igen testet med Tab og Shift + Tab. Fokusmarkeringen er nu tydelig på både filterknapperne, "Sorter efter" og "Ryd filtre".

![Fokusmarkering på filter](dokumentation/filter-fokus-efter.png)

*Figur: Fokusmarkering på filter- og sorteringsområdet efter ændringen af strukturen.*

#### Videre test

Spillekortene kan på nuværende tidspunkt ikke modtage tastaturfokus. Dette var også et fund i den oprindelige keyboard-test og optimeres derfor separat.

Når de resterende problemer med tastaturbetjening er optimeret, gentages keyboard-testen fra delaflevering 1. Resultatet bruges til at sammenligne tastaturbetjeningen før og efter optimeringen.

### Søgefelt og lup-ikon

Keyboard-testen fra delaflevering 1 viste, at lup-ikonet i søgefeltet kunne modtage tastaturfokus, selvom det ikke havde nogen funktion. Det gav et unødvendigt stop ved navigation med Tab.

Lup-ikonet var opbygget som en knap, men er nu ændret til et dekorativt element, så det ikke længere indgår i Tab-rækkefølgen. Ikonet er samtidig udskiftet med et mørkt PNG-ikon.

```html
<div class="searchbar">
      <input type="text" id="search-input" placeholder="Søg" />
        <span class="icon-btn" aria-hidden="true">
          <img src="images/lup.png" alt="">
        </span>
    </div>
```

Efter ændringen er søgefeltet testet med tastatur, hvor fokus nu går direkte videre fra søgefeltet til næste interaktive element. WAVE registrerer heller ikke længere en kontrastfejl på lup-ikonet.

![Ingen kontrastfejl ved luppen](dokumentation/kontrast-lup-1.png)

*Figur: WAVE efter ændringen af lup-ikonet, hvor der ikke længere registreres en kontrastfejl ved ikonet.*

![Kun en kontrastfejl](dokumentation/kontrast-lup-2.png)

*Figur: WAVE registrerer efter ændringen én kontrastfejl på siden mod tidligere to.*


