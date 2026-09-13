# Voortgang 13 september 2026

## Opdracht

- Contact onderaan het uitklapmenu op mobiel en tablet; de losse headerknop alleen op desktop.
- Meerdere gekozen foto's onder elkaar, met een X per bestand en een bevestigingsvenster met Verwijderen en Terug. Bestaande bestanden behouden bij een aanvullende selectie; maximaal vijf foto's, maximaal 10 MB per foto, JPG/PNG/WebP.
- Vervang de vijf bestaande hero-trustbars door een doorlopende strook van rechts naar links. Toon normen/veiligheid en de merken Solis, Pylontech, Growatt, Enphase, AEG, Tesla en Dyness. Geef Solis en Pylontech meer nadruk; geen partnerschap suggereren.
- Sla SVG-merklogo's lokaal op in assets/img en leg bron-URL's vast.
- Maak voortgang hervatbaar. Gebruik de lokale helper voor kleine alleen-lezen controles wanneer beschikbaar.

## Status

- Werkboom was schoon bij aanvang, HEAD 89f8687 op main.
- Inventarisatie: vijf heroTrustBar-elementen; één foto-uploadveld in contact.html, verzonden via FormData in assets/js/main.js.
- Contact staat via de gedeelde navigatiecode onderaan het compacte menu. De desktopknop blijft beschikbaar op desktop.
- Uploadlijst en native bevestigingsdialoog zijn geïmplementeerd. Browsertest bevestigt toevoegen, annuleren, Escape, verwijderen, foutmeldingen, focusherstel en behoud/wissen van bestanden na respectievelijk mislukte/geslaagde verzending. Verzending wordt lokaal nagebootst; geen echte aanvragen verstuurd.
- De vijf stroken hebben zeven lokale SVG-merklogo's en de bestaande NEN/VCA-afbeeldingen uit de footer. Pauze bij hover/toetsenbordfocus, naadloze herhaling, verborgen kopie voor hulptechnologie en een stil raster bij verminderde beweging/zonder JavaScript zijn geïmplementeerd. Bronnen staan in merklogos-bronnen.md.
- De grote-tekstcontrole vond extra bestaande overloop in impliciete gridkolommen, media met aspectratio, lange CTA-knoppen en footerlinks. Deze basisregels zijn aangepast. E-mailvelden en CTA-knoppen verdelen de ruimte nu volgens hun beschikbare breedte en tekstgrootte.
- LM Studio draait met openai/gpt-oss-20b en 8192 contexttokens. De volledige lokale Codex-agent overschrijdt deze context. De genegeerde lokale helper tools/local-ai.ps1 kiest nu automatisch het geladen model en ondersteunt ContextFile/StartLine/LineCount voor korte, alleen-lezen fragmentcontroles via de lokale API. Twee korte controles geslaagd; claims zijn tegen de bron gecontroleerd. De helper blijft lokaal en komt niet in de commit.
- Op laatste verzoek van de gebruiker zijn de pauzeknop en Persoonlijk advies helemaal uit de vijf stroken verwijderd. De strook pauzeert bij hover/toetsenbordfocus; de verminderde-bewegingstand blijft actief.
- Eindcontrole geslaagd in headless Microsoft Edge: 224 combinaties van de zeven pagina's, breedtes 320–1440 px, standaard/200% tekst en touch/muis; menu, logo's en uploadgedrag zonder fouten. Daarnaast 96 geslaagde controles van WhatsApp/Terug naar boven en 69 extra controles van animatie, weergave zonder JavaScript, dubbele bestandsselectie, dialoog bij 320 px/200% tekst, toetsenbordbediening en bruikbare e-mailvelden. Geen JavaScript-fouten. JavaScript-syntax en git diff --check zijn geslaagd.
- Browserchecks en screenshots staan tijdelijk in %TEMP%/sparky-card-typography-qa: latest-check.cjs, floating-check.cjs en extra-check.cjs. De projectrepository krijgt geen extra npm-afhankelijkheden. De controles emuleren schermformaten; er is geen test op fysieke iOS-/Android-apparaten gedaan.
- Alle gevraagde implementatietaken zijn afgerond. Deze overdracht wordt samen met de wijzigingen gecommit en naar de bestaande upstream origin/main gepusht. Er zijn geen uitgestelde implementatietaken.

## Hervatten

Lees dit bestand, git status en de recente diff. Werk de status na iedere afgeronde stap bij. Er is geen automatische hervatting na een accountlimiet ingericht; dit bestand bewaart de overdracht voor een volgende uitvoering.

## Vervolgopdracht: Google-reviews op de homepage

### Verzoek en uitgangssituatie

- De gebruiker wil Google-reviews direct onder "Eén partij die het complete systeem overziet" en vraagt hoe we dat aanpakken. Volgens de gebruiker is de eerste Google-review binnen.
- De eerdere implementatie hierboven is afgerond in commit `8784a75`. De werkboom was schoon bij aanvang van deze vervolgopdracht.
- In `index.html:379-397` staat al een uitgecommentarieerde reviewsectie met ID `homeSectWatKlantenOverOnsZeggen`, precies tussen `homeSectWaaromSparky` en `homeSectZoWerkenWij`.
- Dit blok bevat fictieve voorbeeldinhoud (Jan de Vries); die mag niet als echte review worden geactiveerd. Bestaande classes: `layoutTestimonials`, `testimonialLijst` en `testimonialKaart kaart`.
- De bestaande CSS maakt testimoniallijsten vanaf een breekpunt tweekoloms (`assets/css/styles.css:1466`). Voor één review moet de nieuwe sectie daarom expliciet een passende enkele kaart krijgen.

### Onderzoek en bronstatus, 13 september 2026

- [Trustoo-bedrijfsprofiel](https://trustoo.nl/zuid-holland/rotterdam/thuisbatterij/sparky-energies-vof/) vermeldt één review, bij de reviews een score van 5,0, en een als Google aangeduide review van 10 september 2026 over de installatie van een thuisbatterij en nieuwe groepenkast. Dit is een secundaire bron; de Google-review, actuele Google-score en het Google-aantal zijn nog niet rechtstreeks gecontroleerd.
- De score 8,1 bovenaan Trustoo is een andere score en mag niet als Google-score worden overgenomen.
- De repository bevatte alleen een algemene Google Maps-adreszoeklink. Op de vraag om een deellink antwoordde de gebruiker: "zoek het zelf even". Niet opnieuw om die link vragen; zelf verder onderzoeken waar nodig.
- Vervolgens is in de openbare Trustoo-paginagegevens onder `reviewSources` de specifieke [Google-reviewoverzichtlink](https://www.google.com/search?q=Sparky+Energies+V.O.F.%2C+Anthonetta+Kuijlstraat%2C+%2C+ROTTERDAM#lrd=0x47c433950f503f1d:0x4caacae818dda9f3,1,,,) gevonden. Google-bedrijfsidentificatie in deze link: `0x47c433950f503f1d:0x4caacae818dda9f3`. Dit is een link naar het reviewoverzicht, nog geen deellink van één individuele review.
- Dezelfde bron vermeldt voor Google `rating: 5` en `nrRatings: 1`. Auteursnaam: Roberto Verde; datum: 2026-09-10; tekst: "Zeer tevreden over de service van Sparky energies. Wij zijn erg blij met de installatie van een thuisbatterij en nieuwe groepenkast."
- Rechtstreekse broncontrole geprobeerd via webzoektool, Google Maps in de gekoppelde Opera-browser en een openbare HTTP-aanvraag. De browser opent de tab met titel "Sparky Energies - Google Maps", maar kan niet aan de tab koppelen (`Cannot attach to this target`); HTTP geeft de Google-cookiekeuzepagina. De originele review is daarom nog niet rechtstreeks op Google uitgelezen. Geen CAPTCHA of beveiligingswaarschuwing omzeild. De link en reviewgegevens hierboven zijn expliciet afkomstig uit Trustoo, niet uit een geslaagde Google-controle.
- Voor automatisch ophalen zijn de officiële documentatie voor [Place Details](https://developers.google.com/maps/documentation/places/web-service/place-details) en [bronvermelding](https://developers.google.com/maps/documentation/places/web-service/policies) geraadpleegd. Een dergelijke koppeling vraagt inrichting en naleving van de toepasselijke weergave- en opslagregels. Er is geen API, widget of betaald abonnement ingericht.

### Bijgestelde aanpak: automatisch alle beschikbare reviews ophalen

- De gebruiker vraagt vervolgens expliciet om een API waarmee iedere review automatisch in het overzicht wordt verwerkt. Het eerdere voorstel voor handmatig beheer is daarmee niet meer het uitgangspunt.
- De [Places API](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places) geeft maximaal vijf reviews, geselecteerd op relevantie. Die route voldoet niet aan het doel om alle beschikbare reviews mee te nemen.
- De [Business Profile reviews.list-API](https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list) geeft gepagineerde reviews van een geverifieerde eigen/beheerde locatie, maximaal 50 per pagina, met `nextPageToken`, `averageRating` en `totalReviewCount`. Endpoint: `GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews`. Een Maps-bedrijfs-ID is niet hetzelfde als het account-/location-ID voor deze API.
- [Google vereist voor API-toegang](https://developers.google.com/my-business/content/prereqs) onder meer een geverifieerd en minimaal 60 dagen actief bedrijfsprofiel, een daaraan gekoppelde bedrijfswebsite en goedkeuring van het Cloud-project. Of Sparky al aan de leeftijdseis voldoet en API-toegang heeft, is nog onbekend. De datum van de eerste review zegt dit niet.
- Het bedrijfsaccount moet de koppeling autoriseren via [OAuth met offline toegang](https://developers.google.com/my-business/content/implement-oauth). Bewaar client secret en refresh token uitsluitend in de beveiligde serverconfiguratie; nooit in frontendcode, git, openbare JSON, voortgangsdocumenten of lokale LLM-prompts.
- DNS-controle op 13 september 2026: `www.sparkyenergies.com` is een CNAME naar `img187.github.io`. De repository bevat HTML/CSS/JS en geen aangetroffen backendconfiguratie. Voorgesteld: de website behouden en er een kleine serverfunctie met planning en tijdelijke opslag naast plaatsen. Provider is nog niet gekozen.

Voorgesteld gedrag:

1. De server haalt bijvoorbeeld ieder uur alle beschikbare reviewpagina's op. Synchroniseer op review-ID en neem gewijzigde inhoud over. Synchronisatie is periodiek; beloof geen onmiddellijke verwerking zodra een review wordt geschreven.
2. Vervang het overzicht pas na een volledige, geslaagde synchronisatie. Een verdwenen review wordt dan verwijderd. Een afgebroken of onvolledige paginareeks mag niet onbedoeld bestaande reviews wissen.
3. Laat de homepage sterren, oorspronkelijke tekst, auteursvermelding, datum, Google-bronlink, totaalaantal en het door Google geleverde gemiddelde tonen onder de gevraagde sectie. Geen selectie op uitsluitend positieve beoordelingen. Alle beschikbare reviews moeten bereikbaar blijven; bij groei kan "Meer reviews" de pagina overzichtelijk houden.
4. Hanteer korte tijdelijke caching, bijvoorbeeld één uur vers en maximaal 24 uur terugval bij storing, waarna de site alleen de Google-link toont. Dit is een ontwerpvoorstel binnen de [opslag- en weergaveregels](https://developers.google.com/my-business/content/policies): beperkte tijdelijke opslag voor prestaties, maximaal 30 dagen, beveiligd en zonder inhoudelijke manipulatie of aggregatie. Maak geen permanent reviewarchief in git. Stem de concrete publicatie en bronvermelding op die regels af.
5. Houd rekening met Googles [bekende pagineringsprobleem](https://developers.google.com/my-business/content/known-issues): vanaf pagina twee kunnen incidenteel reviews ontbreken. Vergelijk unieke opgehaalde IDs met het gerapporteerde totaal, plan een herpoging bij verschillen en toon onvolledige resultaten niet als volledig. Dit is bij de huidige ene review nog niet aan de orde.
6. Controleer bij implementatie nieuwe/gewijzigde/verwijderde en tekstloze reviews, paginering, onvolledige synchronisatie, verlopen autorisatie, tijdelijke Google-storing en veilige tekstweergave. Controleer daarnaast mobiel, desktop, grotere tekst, hoog contrast en toetsenbordbediening. Werk na HTML-wijzigingen de sectie-index bij via `tools/update-section-index.mjs`.

### Lokale LLM

- `lms ps --json` bevestigt geladen model `openai/gpt-oss-20b` met **8192 contexttokens**. De theoretische modelcapaciteit is niet de geladen limiet.
- `tools/local-ai.ps1` gebruikt in fragmentmodus maximaal 1600 outputtokens en accepteert maximaal 18000 tekens bron; dat tekenmaximum is geen garantie dat elk fragment in 8192 tokens past. Gebruik bij voorkeur 20-60 korte regels per taak en houd ook ruimte voor instructies en uitvoer.
- Twee kleine, alleen-lezen inventarisaties geprobeerd via `-ContextFile index.html`: eerst regels 360-399, daarna 379-397. Beide mislukten met HTTP 500: `The model produced output that does not match the expected peg-native format`. Ook het kortste fragment faalde; een contextoverschrijding is niet aangetoond.
- Er is geen bruikbaar lokaal modelantwoord gebruikt. De relevante HTML/CSS is rechtstreeks gecontroleerd. De helper en modelconfiguratie zijn niet gewijzigd. Deel geen reviewauteurs of andere persoonsgegevens met de lokale helper; beperk delegatie tot codefragmenten zonder persoonsgegevens.
- Bij de vervolgvraag over de API opnieuw één klein fragment geprobeerd (`README.md:1-26`, alleen inventarisatie van projectstructuur). Dezelfde HTTP 500-uitvoerfout trad op. Het model is nog steeds geladen met 8192 contexttokens; drie kleine pogingen hebben nu geen bruikbaar antwoord opgeleverd. Vermijd herhaalde identieke pogingen zolang de lokale modeluitvoer niet hersteld is. Actuele API-feiten zijn zelf in officiële Google-documentatie gecontroleerd.

### Status en hervatten

- De gebruiker heeft het API-voorstel positief ontvangen en vervolgens gevraagd: "Geef me een proefversie van hoe het eruit zou zien". Die lokale proefversie is nu geïmplementeerd in `index.html` en `assets/css/styles.css`.
- De reviewsectie staat zichtbaar direct tussen `homeSectWaaromSparky` en `homeSectZoWerkenWij`. Na feedback dat de eerste proef te groot was, is het losse scoreblok met de witte reviewkaart vervangen door compacte donkerblauwe reviewkaarten. Ronde avatar links, naam rechts daarvan, sterren direct onder de naam en de reviewtekst daaronder. Datum en Google-link staan klein onderaan.
- Er passen drie kaarten naast elkaar op desktop. De huidige ene review staat gecentreerd en blijft compact. Een flexlijst laat toekomstige kaarten naar nieuwe regels doorlopen; bij smallere schermen/grotere tekst passen er minder naast elkaar. Er zijn geen extra klantreacties verzonnen of op de homepage gedupliceerd.
- De blauwe bovenregel "Google reviews" is verwijderd. Kop en intro zijn expliciet gecentreerd; de tussenruimte is vergroot naar 28-38 px. De kop blijft semantisch een H2 binnen de homepage. De reviewsectie heeft geen geforceerde schermhoogte meer, zodat er minder lege ruimte rond de compacte inhoud staat.
- Er is nog geen gecontroleerde profielfoto beschikbaar. De ronde avatar toont daarom voorlopig RV. CSS voor een echte ronde profielfoto (`object-fit: cover`) is voorbereid voor de API-uitvoer.
- De proef gebruikt uitsluitend de eerder via Trustoo gevonden review en score. De oude fictieve Jan de Vries-review is vervangen. Markering: `data-review-mode="preview"` en een bron-/statuscommentaar in HTML. De zichtbare tekst "Proefweergave" is in de actuele werkboom verwijderd. Dit is geen live API-resultaat en geen bevestiging van een rechtstreekse Google-controle.
- Er is geen API-verzoek, extra JavaScript, widget, API-sleutel of externe afbeelding toegevoegd. Met één review is er geen knop "Meer reviews"; paginering volgt bij de echte koppeling.
- Lokale link: `http://127.0.0.1:5500/index.html#homeSectWatKlantenOverOnsZeggen`. Live Server was tijdens de controle beschikbaar op poort 5500.
- Laatste visuele QA via headless Microsoft Edge: 20 combinaties van breedtes 320/390/768/1024/1440 px, standaard/200% tekst en normaal/hoog contrast, met drie uitsluitend in de test toegevoegde kaarten. Geen horizontale overloop of JavaScript-fouten. Drie kaarten delen één rij bij 1024 px (elk 312 px breed) en 1440 px (elk 416 px breed). Testkopieën worden vóór screenshots verwijderd. De grotere-tekstknopstand, toetsenbordfocus, sectievolgorde en zichtbaarheid met normale bewegingsinstellingen zijn ook gecontroleerd.
- QA-script, rapport en PNG's staan in `%TEMP%/sparky-card-typography-qa`: `reviews-preview.cjs`, `google-reviews-report.json`, `google-reviews-desktop.png`, `google-reviews-mobiel.png` en `google-reviews-groot-contrast.png`. Voor de losse sectiescreenshots zijn uitsluitend via screenshotstijl de vaste WhatsApp-/terugknoppen en mobiele contactbalk verborgen; de website zelf behoudt deze bediening.
- `SECTION-INDEX.md`, `section-index.html` en `data/section-index.json` zijn bijgewerkt; geen ontbrekende headings, dubbele IDs of ontbrekende interne ankers. `git diff --check` geslaagd. De lokale genegeerde generator `tools/update-section-index.mjs` bleek nog verouderde tracking-ID's te bevatten en leest de actuele Measurement ID nu uit `cookie-consent.js`. De bestaande juiste trackinggegevens in de indexbestanden zijn daardoor behouden; de echte trackingcode is niet gewijzigd.
- De gekoppelde Opera-browser gaf ook bij de lokale tab nog `Cannot attach to this target`. De proef is daarom met de al aanwezige headless browseromgeving gecontroleerd. Geen nieuwe projectafhankelijkheden toegevoegd. De lokale LLM is na de drie eerder vastgelegde identieke fouten niet opnieuw belast voor deze visuele proef.
- Eerstvolgende stap voor uitvoering: controleer de bestaande Business Profile-/Google Cloud-toegang, profielverificatie en leeftijd; bepaal waar de serverfunctie draait. Bereid de concrete OAuth-koppeling voor, waarna de eigenaar via Google kan autoriseren. Vraag nooit om wachtwoorden/tokens in de chat. Er zijn nog geen account-/location-IDs, API-goedkeuring of serverinstellingen gecontroleerd of ingericht.
- De gevraagde visuele proef is klaar voor beoordeling. Verwerk eventuele ontwerpfeedback; vervang de proefdata en verwijder de proefmarkering pas wanneer de echte bron/koppeling is gecontroleerd. Publiceer de huidige statische proef niet als automatisch bijgewerkt reviewoverzicht.
- Gebruik voor publieke broncontrole de hierboven gevonden reviewlink; de gebruiker wil dat wij die zelf opzoeken en niet opnieuw om een deellink vragen. De voorkeur is nu automatische verwerking van alle beschikbare reviews.
- Herlees dit vervolgdeel en `git status` na een limiet. Werk deze status bij zodra broncontrole, implementatie of controles zijn afgerond.

### Commit en push op verzoek

- De gebruiker heeft na de compacte ontwerpversie expliciet gevraagd: "commit en push aub". De actuele wijzigingen worden daarom samen met deze overdracht gecommit en naar de bestaande upstream `origin/main` gepusht: `https://github.com/Img187/Project-Eliah.git`.
- Vooraf `origin` opgehaald: lokale `main` en `origin/main` stonden beide op dezelfde commit; geen conflicten of te integreren commits. `git diff --check` is geslaagd.
- Het betreft de statische reviewweergave en de bijgewerkte sectie-index/voortgang. De Google Business Profile API-koppeling blijft de volgende implementatiestap. De lokale helpers en tijdelijke QA-bestanden vallen buiten de commit.
