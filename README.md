# Sparky Energies – plain HTML/CSS/JS breakout

Deze versie bevat géén Relume, géén Tailwind-configuratie, géén npm-package en géén tijdelijke afbeeldingen.

## Starten in VS Code

Open deze map in VS Code en start bijvoorbeeld Live Server op `index.html`.

## Structuur

- `index.html`
- `thuisbatterijen.html`
- `zonnepanelen.html`
- `laadpalen.html`
- `elektrotechnische-renovaties.html`
- `over-ons.html`
- `contact.html`
- `assets/css/styles.css`
- `assets/js/main.js`
- `assets/js/cookie-consent.js`
- `assets/documenten/algemene-voorwaarden-sparky-energies-vof.pdf`
- `assets/documenten/privacy-en-cookieverklaring-sparky-energies.pdf`
- `assets/fonts/README.md`
- `SECTION-INDEX.md`
- `section-index.html`
- `data/section-index.json`

## Logo en afbeeldingen

Het definitieve Sparky Energies-logo en de achtergrondfoto `SparkyEnergies_Algemeen_Afbeelding_09.jpg` staan in `assets/img/`. Voor overige media zijn bewust geen tijdelijke afbeeldingen toegevoegd; de HTML gebruikt `NOTITIE MEDIA`-blokken totdat echte afbeeldingen of video’s beschikbaar zijn.

### Responsive afbeeldingsafspraken

- Foto's, placeholders en decoratieve sectiebeelden die hun vlak volledig moeten vullen gebruiken `width: 100%`, `height: 100%` en `object-fit: cover`.
- De vijf hero-afbeeldingen hebben WebP-varianten in `assets/img/responsive/` en gebruiken een gekoppelde `srcset`, `sizes` en responsive preload. Houd de preloadwaarden gelijk aan die van het bijbehorende `<img>`-element.
- De grote CTA-achtergrond op Home wordt via `IntersectionObserver` pas geladen wanneer de sectie bijna in beeld komt.
- CSS-achtergrondafbeeldingen gebruiken `background-size: cover`, `background-position: center` en `background-repeat: no-repeat`.
- Logo's en certificeringsbeelden mogen niet worden afgesneden en gebruiken daarom `object-fit: contain`.
- Hoog contrast mag filters en overlays veranderen, maar niet het responsive vulgedrag van een afbeelding.

## Kleuren

Gebruikt uit de aangeleverde huisstijl:

- Donkerblauw: `#0B3C5D`
- Lichtblauw: `#1E88E5`
- Lichtgrijs: `#F3F6F8`
- Oranje: `#F9A825`
- Donker: `#2E2E2E`

## Fonts

De lokale huisstijlfonts zijn als gesubsette WOFF2-bestanden via `@font-face` gekoppeld in `assets/css/styles.css`:

- `Futura PT Heavy` voor koppen
- `Futura Light` voor lichte Futura-tekst
- `Open Sans` in Light, Regular, Semibold, Bold en Extrabold, inclusief cursieven

Lopende tekst gebruikt standaard Open Sans Light; elementen met een zwaarder `font-weight` laden automatisch het bijbehorende lokale bestand. Elke openbare pagina preload alleen Futura PT Heavy en Open Sans Light.

## Toegankelijkheid

De header bevat knoppen voor grotere tekst, hoog contrast, voorlezen en stoppen met voorlezen. Daarnaast zijn semantische elementen gebruikt: `header`, `nav`, `main`, `section`, `article`, `footer`, `h1/h2/h3`, `p`, `ul/li`, `ol/li`, `form`, `fieldset`, `legend`, `label`, `button` en duidelijke focus-states.

De website gebruikt altijd de lichte weergave als standaard: witte achtergronden, donkerblauwe koppen en donkere lopende tekst. Hoog contrast wordt uitsluitend geactiveerd via de toegankelijkheidsknop en wordt in `localStorage` bewaard.

### Afspraken voor hoog contrast

- Hoog contrast verandert kleuren, randen en schaduwen, maar schakelt animaties niet uit. Bewegingsreductie blijft gekoppeld aan `prefers-reduced-motion`.
- Geef open split-card- en mediavlakken die vanaf tabletbreedte de pagina-achtergrond moeten tonen de class `hoogContrastTransparantVlak`. Plaats de class zowel op de kaart als op het mediavlak; de mobiele weergave blijft daardoor ongewijzigd.

## Rekenformulier

De contactpagina bevat sectie `contactSectVragenformulierVoorBesparingEnInstallatiekosten`. De velden en JS-hooks staan klaar voor een toekomstige berekening van besparing, prijsindicatie en installatieconfiguratie. De definitieve formules staan bewust als TODO in `assets/js/main.js`.

## Google Analytics

De zeven openbare pagina's gebruiken de Google-tag voor de GA4-webstream van Sparky Energies:

- Stream-ID: `15270728473`
- Google tag ID: `GT-PL9T2DJM`
- Measurement ID: `G-B8QNYQR8CY`

De Google-tag staat niet in de HTML-head en wordt dus niet standaard gedownload. `assets/js/cookie-consent.js` injecteert het Analytics-script eenmalig tijdens een vrij browsermoment, uitsluitend nadat de bezoeker volledige toestemming heeft gegeven:

- `Volledig`: Google Analytics wordt geladen en de Google Maps-iframe wordt toegestaan.
- `Weigeren`: Analytics wordt niet geladen, eventuele Analytics-cookies worden verwijderd en Maps wordt niet geladen.

Bij het eerste bezoek staat de modale keuzelaag met transparante achtergrond vast onderaan het scherm. De bezoeker kan de pagina bekijken en scrollen, maar niet klikken, tekst selecteren of toetsenbordfocus buiten de laag verplaatsen. Na een keuze wordt de website volledig vrijgegeven. Onder `Sitemap` staan achtereenvolgens `Contact`, de hyperlink `Cookie Voorkeuren`, de downloadbare `Algemene voorwaarden` en de downloadbare `Privacy verklaring`. Beide juridische downloads staan bij de aanvraagformulieren; de privacy-download staat ook in de cookielaag. De interne `section-index.html` heeft `noindex` en wordt niet gemeten.

## Button-notities

Iedere knop heeft een eigen ID en data-attributen zoals `data-button-page`, `data-button-section`, `data-link-type`, `data-target-page`, `data-target-section` en waar nodig `data-link-note`. Zie `SECTION-INDEX.md`.
