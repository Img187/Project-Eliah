# Sparky Energies – plain HTML/CSS/JS breakout

Deze versie bevat géén Relume, géén Tailwind-configuratie, géén npm-package en géén tijdelijke afbeeldingen.

## Starten in VS Code

Open deze map in VS Code en start bijvoorbeeld Live Server op `homepage.html`.

## Publiceren en beveiliging

De drie landelijke thuisbatterij-intentiepagina's worden gegenereerd met `node scripts/generate-thuisbatterij-intenties.mjs`; de regionale thuisbatterijpagina's met `node scripts/generate-thuisbatterij-regios.mjs`; de regionale meterkastpagina's met `node scripts/generate-meterkast-regios.mjs`; de regionale laadpaalpagina's met `node scripts/generate-laadpaal-regios.mjs`. Daarna wordt de website met `node scripts/prepare-pages.mjs` voorbereid in `build/pages`. De GitHub Actions-workflow publiceert uitsluitend die map na geslaagde tests. De Pages-publicatiebron staat op **GitHub Actions**. Zie [publicatie en beveiliging](docs/publicatie-security.md) voor de inrichting, controles vóór een commit en de resterende GitHub-/Formspree-instellingen.

Alle tests: `npm --prefix tests test`. Na wijzigen van landelijke thuisbatterij-intentiecontent, regionale content of de gedeelde header/footer: voer de bijbehorende generator(s) uit. Na overige wijzigingen van JSON-LD of de review-API-configuratie: `node scripts/prepare-pages.mjs --sync`, zodat de Content Security Policy weer overeenkomt.

## Structuur

- `homepage.html` (publieke route `/homepage`)
- `index.html` (doorverwijzing vanaf `/`)
- `thuisbatterij-laten-installeren.html`
- `thuisbatterij-kopen.html`, `thuisbatterij-kosten.html` en `thuisbatterij-voor-zonnepanelen.html` (gegenereerde landelijke intentiepagina's; niet in de hoofdnavigatie en bereikbaar via contextlinks)
- `thuisbatterijen.html` (legacy doorverwijzing naar de nieuwe URL)
- `zonnepanelen.html`
- `laadpalen.html`
- `meterkast-vervangen.html`
- `elektrotechnische-renovaties.html` (legacy doorverwijzing naar de nieuwe URL)
- `over-ons.html`
- `contact.html`
- `bedankt.html` (publieke route `/bedankt`, na geslaagde formulierverzending; `noindex` en buiten de sitemap)
- `thuisbatterij-installeren-in-*.html` (7 gegenereerde pagina's: zes provincies en Rotterdam)
- `laadpaal-thuis-laten-installeren-in-*.html` (7 gegenereerde pagina's: zes provincies en Rotterdam)
- `zakelijke-laadpaal-plaatsen-in-*.html` (7 gegenereerde pagina's: zes provincies en Rotterdam)
- `meterkast-vervangen-in-*.html` (7 gegenereerde pagina's: zes provincies en Rotterdam)
- `data/thuisbatterij-regios/*.json` (de unieke regionale broncopy)
- `scripts/generate-thuisbatterij-intenties.mjs`
- `scripts/generate-thuisbatterij-regios.mjs`
- `scripts/generate-laadpaal-regios.mjs`
- `scripts/generate-meterkast-regios.mjs`
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

Kenmerk- en ankerkaarten delen één typografische basis: lopende tekst volgt `--basisTekst` (minimaal `1rem`), met gewicht 400 en de algemene regelhoogte. Kaartkoppen zijn 1,25 keer zo groot en groeien ook mee met de grotere-tekststand. De gedeelde `--kaart*`-variabelen regelen de kopverhouding, regelhoogte, witruimte en minimale kolombreedte. Het raster past het aantal kolommen aan de beschikbare ruimte aan; kaarten groeien met hun inhoud en verkleinen hun tekst niet om deze passend te maken.

De klikbare kaarten bij Onze diensten, Wat wilt u laten uitvoeren? en Onze installaties en diensten delen dezelfde hoveranimatie: de volledige kaart vergroot 10% in 0,2 seconde en verschijnt boven aangrenzende kaarten. De focusrand omvat de hele link. Touchscreens gebruiken geen hoverzoom; bij `prefers-reduced-motion` vervalt de vergroting.

Mobiel en tablet delen dezelfde vaste contactbalk (Bel ons / Advies aanvragen). WhatsApp sluit direct aan op de bovenkant van deze balk zolang Terug naar boven verborgen is. Zodra de terugknop na 360 px scrollen verschijnt, schuift WhatsApp erboven; bij terugscrollen sluit hij weer aan op de contactbalk. De balk gebruikt dezelfde breekpunten als de compacte navigatie: onder 1024 px of bij touchbediening zonder hover. De zwevende knoppen en de onderruimte volgen de gemeten balk- en knophoogte, ook bij grotere tekst. Het navigatielogo staat tussen twee even brede kolommen. De losse Contact-knop verschijnt alleen op desktop; mobiel en tablet hebben Contact onderaan het uitklapmenu, inclusief de actieve-paginastatus.

De vijf hero-stroken tonen de bestaande NEN- en VCA-afbeeldingen en zeven lokale SVG-merklogo's. Solis en Pylontech krijgen extra nadruk zonder partnerschap te claimen. De strook schuift naar links, pauzeert bij aanwijzen met een muis of toetsenbordfocus. Bij verminderde beweging of zonder JavaScript worden alle items stilstaand getoond. Zie [logo's en bronnen](docs/merklogos-bronnen.md).

Het foto-uploadveld op Contact houdt aanvullende selecties bij en toont elk bestand op een eigen regel. De X opent een modaal bevestigingsvenster met Verwijderen en Terug. Annuleren of Escape behoudt het bestand; bevestigen werkt ook de echte bestandsselectie voor verzending bij. De focus keert terug naar de lijst of het uploadveld. Maximaal vijf foto's van elk 10 MB in JPG, PNG of WebP; ongeldige bestanden blijven zichtbaar en verwijderbaar. Tijdens verzending zijn uploadwijzigingen geblokkeerd. Een fout behoudt de selectie, een geslaagde aanvraag wist deze.

### Afspraken voor hoog contrast

- Hoog contrast verandert kleuren, randen en schaduwen, maar schakelt animaties niet uit. Bewegingsreductie blijft gekoppeld aan `prefers-reduced-motion`.
- Alle hoogcontrastregels staan bij elkaar onderaan `assets/css/styles.css`. Voeg uitzonderingen daar toe om tegenstrijdige kleurregels te voorkomen.
- Sectiehoogtes, witruimte, afbeeldingsafmetingen en borderbreedtes blijven gelijk aan de normale weergave, ook met grotere tekst. Gebruik een outline wanneer een extra omtrek nodig is.
- Donkere vlakken krijgen witte tekst; oranje knoppen en labels krijgen zwarte tekst. Invoervelden blijven wit met donkere waarden, placeholders en eenheden. Controleer ook hover, focus, geopende formulieren en meldingen.
- Tekst boven foto's blijft leesbaar door een donkere beeldlaag; de achtergrond blijft donker terwijl een foto nog wordt geladen.
- Geef open split-card- en mediavlakken die vanaf tabletbreedte de pagina-achtergrond moeten tonen de class `hoogContrastTransparantVlak`. Plaats de class zowel op de kaart als op het mediavlak; de mobiele weergave blijft daardoor ongewijzigd.

## Rekenformulier

De contactpagina bevat sectie `contactSectVragenformulierVoorBesparingEnInstallatiekosten`. De velden en JS-hooks staan klaar voor een toekomstige berekening van besparing, prijsindicatie en installatieconfiguratie. De definitieve formules staan bewust als TODO in `assets/js/main.js`.

## Google Tag Manager en Analytics

Alle indexeerbare contentpagina's gebruiken dezelfde consent-gestuurde Google Tag Manager-loader. De niet-indexeerbare legacy doorverwijzingen worden bewust niet apart gemeten om dubbele pageviews te voorkomen:

- Measurement ID: `G-87KMB19788`
- Tag Manager-container: `GTM-WLFHDLMC`

`assets/js/cookie-consent.js` initialiseert `dataLayer` en de standaard geweigerde toestemming. De loader injecteert het asynchrone `gtm.js`-script eenmalig tijdens een vrij browsermoment, uitsluitend nadat de bezoeker volledige toestemming heeft gegeven. Analytics wordt via de GTM-container ingesteld; de oude losse `gtag.js`-loader is vervallen.

- `Volledig`: Google Tag Manager wordt geladen en de Google Maps-iframe wordt toegestaan.
- `Weigeren`: Tag Manager wordt niet geladen, eventuele Analytics-cookies worden verwijderd en Maps wordt niet geladen. Intrekken van toestemming blokkeert nieuwe meetacties.

Na een geslaagde Formspree-verzending sturen alle aanvraagformulieren door naar `/bedankt`. Bij validatie- of verzendfouten blijft het formulier met de invoer staan. De schone URL wordt, net als de bestaande extensieloze routes, door GitHub Pages vanuit `bedankt.html` geserveerd.

De site geeft `contact_click` door voor telefoon-, WhatsApp- en e-mailklikken. `assets/js/bedankt.js` geeft `generate_lead` uitsluitend op de bedankpagina door, na een recente eenmalige succesmarkering uit het formulier. Direct openen of verversen levert geen extra lead-event op. De bestaande calculator-events blijven beschikbaar. Formulierinhoud en contactbestemmingen worden niet aan deze events toegevoegd. Marketing kan `/bedankt` als alternatieve conversiebron gebruiken; activeer die niet tegelijk met `generate_lead` voor dezelfde conversie. Zie [Tag Manager instellen](docs/google-tag-manager.md) en het [container-importbestand](docs/gtm-sparky-energies.json). De container moet worden geïmporteerd en gepubliceerd voordat Analytics deze meetacties kan ontvangen.

Bij het eerste bezoek staat de modale keuzelaag met transparante achtergrond vast onderaan het scherm. De bezoeker kan de pagina bekijken en scrollen, maar niet klikken, tekst selecteren of toetsenbordfocus buiten de laag verplaatsen. Na een keuze wordt de website volledig vrijgegeven. Onder `Sitemap` staan achtereenvolgens `Contact`, de hyperlink `Cookie Voorkeuren`, de downloadbare `Algemene voorwaarden` en de downloadbare `Privacy verklaring`. Beide juridische downloads staan bij de aanvraagformulieren; de privacy-download staat ook in de cookielaag. De interne `section-index.html` heeft `noindex` en wordt niet gemeten.

## Button-notities

Iedere knop heeft een eigen ID en data-attributen zoals `data-button-page`, `data-button-section`, `data-link-type`, `data-target-page`, `data-target-section` en waar nodig `data-link-note`. Zie `SECTION-INDEX.md`.
