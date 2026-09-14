# Google-reviews voor de homepage

Status op 14 september 2026: server en frontend zijn geïmplementeerd en lokaal getest. **Nog geen live koppeling:** Googles aanvraaghulp meldt dat het profiel nog niet aan de criteria voldoet. De gevonden livegangbevestiging is van 20 augustus 2026; controleer de vereiste 60 dagen opnieuw rond 19 oktober. OAuth, API-goedkeuring en hosting moeten worden afgerond. De openbare configuratie heeft daarom nog een lege `endpoint`.

## Inrichten

1. Gebruik Cloud-project `sparky-website-reviews` (Sparky Website Reviews), projectnummer `840750538027`. Dit is op 14 september 2026 aangemaakt onder het zakelijke Google-account. Vraag na het voldoen aan de voorwaarden Business Profile API-toegang aan voor het **geverifieerde** Sparky Energies-profiel. Er staat ook een ongeverifieerd profiel met hetzelfde adres; gebruik dat niet voor de koppeling. Zie [Google-prerequisites](https://developers.google.com/my-business/content/prereqs) en de [aanvraagworkflow](https://support.google.com/business/workflow/16726127).
2. Na goedkeuring: activeer de vereiste Business Profile APIs en maak de OAuth-client voor deze eigen bedrijfsintegratie. De eigenaar autoriseert de scope `https://www.googleapis.com/auth/business.manage` met offline toegang. Deze Google-scope geeft ook beheermogelijkheden; deze server voert uitsluitend leesverzoeken uit. Laat de eigenaar de exacte Google-toestemming beoordelen voordat die wordt verleend. Zie [OAuth](https://developers.google.com/my-business/content/implement-oauth) en [basisinstellingen](https://developers.google.com/my-business/content/basic-setup).
3. Lees de numerieke account- en locatie-ID met de Account Management / Business Information API. De Google Maps-ID in de openbare reviewlink is hiervoor niet bruikbaar. Bewaar client secret en refresh token uitsluitend in de server-secretstore. Geen tokens in de chat, frontend, git, voortgangsdocumentatie of lokale LLM.
4. Host `google-reviews.mjs` als Node.js 22+-service achter HTTPS. Er zijn geen npm-afhankelijkheden. GitHub Pages kan deze servercode niet uitvoeren. Kies een bestaande geschikte host of rond hosting apart af; een lokale Node-server op de laptop is geen productievoorziening.
5. Vul de omgevingsvariabelen uit `.env.example` in. Voor een lokale test met echte toestemming: kopieer het voorbeeld naar `server/.env` (genegeerd door git) en start vanuit de repository-root met `node --env-file=server/.env server/google-reviews.mjs`. Voeg voor lokale frontendtests `http://127.0.0.1:5500` toe aan `ALLOWED_ORIGINS`.
6. Controleer `/health` en `/reviews`. `/health` meldt `ok`, `degraded` bij tijdelijke terugval of HTTP 503 wanneer geen bruikbare gegevens beschikbaar zijn. Vergelijk auteurs, sterren, teksten en het totale aantal met het echte Google-profiel.
7. Zet pas daarna de bereikbare HTTPS-URL met pad `/reviews` in `data/reviews-config.json`. De frontend verwijdert dan de statische proef en gebruikt uitsluitend de feed. Controleer via de uiteindelijke website-origin of CORS werkt. Verwijder bij definitieve ingebruikname ook de oude statische proefreview en het preview-commentaar uit de HTML; behoud de Google-overzichtslink als terugval en voor bezoekers zonder JavaScript.

## Gedrag

- Volledige paginering met maximaal 50 reviews per Google-verzoek. Geen selectie op sterren. Auteurs, tekst, sterren en de door Google geleverde totaalscore blijven behouden.
- Synchronisatie bij opstarten, iedere vijf minuten en bij een request met verouderde cache. Bij Google-vertraging verschijnt een nieuwe review dus niet noodzakelijk direct; vanaf beschikbaarheid in de API normaal binnen ongeveer 5–10 minuten in een geopende pagina.
- Eén gedeelde synchronisatie per serverproces. Een onvolledige paginareeks, dubbel ID, gewijzigde totaaltelling of Google-fout vervangt de bestaande cache niet. Herpogingen bij fouten zijn minimaal 60 seconden gespreid.
- Alleen tijdelijke geheugencache: vijf minuten vers, maximaal 24 uur terugval. Daarna HTTP 503 en alleen de Google-link in de frontend. Een herstart begint met een lege cache. Geen permanent reviewbestand in git of database. Zie [opslagbeleid](https://developers.google.com/my-business/content/policies) en [bekend pagineringsprobleem](https://developers.google.com/my-business/content/known-issues).
- Homepage: nieuwste reviews eerst, maximaal vijf kaarten en maximaal drie kolommen. Bij meer dan vijf wisselt iedere twaalf seconden één kaart; een wachtrij zorgt dat alle beschikbare reviews aan bod komen. Hover, toetsenbordfocus, verborgen tab en verminderde beweging pauzeren automatische wisseling. Bezoekers kunnen zelf pauzeren of andere reviews tonen.
- Configuratie zonder endpoint behoudt voorlopig de bestaande statische proef. Dit is nadrukkelijk geen automatische update.

## Controleren

`node --test tests/google-reviews.test.mjs`

Voor browser-QA zonder Google-toegang: `node tests/reviews-preview-server.mjs` en open `http://127.0.0.1:5501/index.html`. Dit gebruikt uitsluitend synthetische testreviews en schrijft niets naar Google of de siteconfiguratie. Het lokale testendpoint `/qa-case` kan via POST wisselen tussen aantallen, storingen en verlopen data; zie het testbestand. Gebruik dit nooit als productie-endpoint.
