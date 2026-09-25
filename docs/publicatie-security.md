# Beveiliging bij publicatie via GitHub Pages

De codewijzigingen richten zich op de publieke website. GitHub Pages serveert HTML/CSS/JavaScript en voert de Node-servers uit `server/` en `tests/` niet uit. De lokale previewserver is bewust buiten dit herstel gehouden.

## Wat is aangepast

- Alle 38 gepubliceerde HTML-bestanden (37 indexeerbare contentpagina's en één legacy doorverwijzing) bevatten een Content Security Policy vóór de geladen resources. Die beperkt scripts en netwerkbestemmingen, verbiedt uitvoerbare inline scripts/eventhandlers en `eval`, blokkeert object-embeds en beperkt formulierbestemmingen tot Formspree. Bestaande JSON-LD heeft een berekende hash. Inline CSS blijft toegestaan voor de bestaande dynamische vormgeving.
- Calculators weigeren te grote numerieke invoer en controleren eindresultaten op `Infinity`/`NaN`. Bij een fout verdwijnen het oude advies en de opgeslagen overdracht.
- Formulieren starten per formulier maximaal één gelijktijdige verzending. De volledige aanvraag, inclusief upload en lezen van de response, wordt na 90 seconden afgebroken. Er is geen automatische herhaling van POST-verzoeken. Een fout behoudt de invoer en herstelt de bediening.
- Uploadlijsten bewaren maximaal vijf bestanden. Een selectie van meer dan vijf tegelijk wordt vóór kopiëren/renderen geweigerd; eerdere selectie blijft behouden. Bestaande type- en 10 MiB-controles blijven van toepassing.
- `assets/js/network.js` begrenst daadwerkelijk ingelezen responsebytes, ook zonder correcte `Content-Length`. Reviewconfiguratie: 8 KiB/10s; reviews: 2 MiB/20s; Formspree-response: 64 KiB/90s. Een vaste bytebuffer voorkomt groei door extreem veel kleine chunks.
- Reviewgegevens krijgen ook grenzen voor aantallen en tekstlengtes. Ongeldige reviewupdates vervangen de laatste geldige cache niet.
- `scripts/prepare-pages.mjs` bouwt `build/pages` uit een expliciete publicatielijst: 37 indexeerbare pagina's, één legacy doorverwijzing, gebruikte scripts/CSS, afbeeldingen, WOFF2-fonts, twee publieke PDF's, de publieke reviewconfiguratie, robots/sitemap/CNAME. Tests, backend, tools, interne documentatie en sectie-index staan buiten het websitepakket. Symlinks worden geweigerd.
- De onafgemaakte projectsectie in `index.html` en de bijbehorende projectbestanden blijven lokaal. Deze veiligheidsupdate publiceert de bestaande homepage met alleen de nieuwe beveiligingsinstellingen. De publicatiebuilder neemt optionele projectcode pas mee wanneer de homepage die inschakelt.
- De nieuwe GitHub Actions-workflow test, controleert herkenbare tokenpatronen, voert een dependency-audit uit en bouwt het websitepakket. Alleen een geslaagde controle op `main` kan publiceren. Pull requests publiceren nooit. Actions zijn aan volledige commit-SHA's vastgezet; Dependabot volgt updates.

## Publicatie-inrichting

Op 20 september 2026 is de veiligheidscommit `c1bd4e9` naar `main` gepusht. De [controle- en publicatieworkflow](https://github.com/Img187/Project-Eliah/actions/runs/35521976078) slaagde. Vervolgens is de Pages-bron via de GitHub API omgezet van `legacy` naar `workflow` (GitHub Actions), zodat toekomstige pushes uitsluitend via de gecontroleerde publicatieroute lopen. De API bevestigde daarna `build_type: workflow`, het bestaande custom domain `www.sparkyenergies.com` en `https_enforced: true`. De repository is openbaar.

1. Houd de lokale projectsectie en bijbehorende bestanden bij volgende commits buiten de publicatie totdat die gereed zijn.
2. Behoud in [Settings → Pages](https://github.com/Img187/Project-Eliah/settings/pages) bij **Build and deployment → Source** de bron **GitHub Actions**. Terugschakelen naar branchpublicatie zou `build/pages` omzeilen en bestanden zonder de nieuwe controles publiceren.
3. Controleer dezelfde pagina op het bestaande custom domain `www.sparkyenergies.com` en **Enforce HTTPS**. Behoud de bestaande DNS-inrichting; `CNAME` wordt in het nieuwe websitepakket meegenomen.
4. Start zo nodig de workflow **Website controleren en publiceren** handmatig op `main`. Controleer dat zowel **Beveiliging en tests** als deployment slagen. De bestaande site blijft de laatste geslaagde publicatie gebruiken wanneer de nieuwe workflow niet kan publiceren.
5. Controleer na uitrollen de 37 indexeerbare pagina's, de legacy doorverwijzing, een echte normale formulierinzending en de externe Google-integraties met toestemming. Tests gebruiken synthetische responses en bewijzen geen Formspree-accountconfiguratie.

GitHub vereist dat de workflow als publicatiebron is ingesteld voordat een aangepaste Pages-workflow wordt gebruikt. [GitHub: aangepaste Pages-workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Voorkom dat een push geheimen openbaar maakt

Een apart websitepakket maakt bestanden niet geheim in een **openbare repository**. Iedereen kan gepushte broncode en eerdere commits lezen. Zet echte OAuth-secrets, refresh tokens, privésleutels en klantgegevens daarom nooit in deze repository. De `.gitignore` is uitgebreid voor gebruikelijke sleutelbestanden, maar haalt eerder gevolgde bestanden niet uit git.

Voer vóór commit uit:

```powershell
node scripts/check-secrets.mjs
node scripts/check-secrets.mjs --staged
npm --prefix tests test
node scripts/prepare-pages.mjs
```

`--staged` controleert de inhoud die werkelijk in de volgende commit komt, ook wanneer die verschilt van de werkmap. Het script drukt mogelijke geheime waarden niet af. Het is een beperkte patrooncontrole; controleer daarnaast de staged diff zelf. Het scant niet de volledige gitgeschiedenis.

Activeer/controleer in de GitHub-instellingen **secret scanning en push protection**, branchbescherming met pull-requestreview en de vereiste check **Beveiliging en tests**. Beperk wie naar `main` kan schrijven en gebruik tweefactorauthenticatie voor accounts met schrijftoegang. Deze account-/repositoryinstellingen zijn niet door deze codewijziging ingesteld. CI draait pas ná een push; een CI-waarschuwing voorkomt dus niet dat een geheim in die push al is uitgelekt. [GitHub: push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection).

## Grenzen die bij de externe dienst moeten worden afgedwongen

- **Aanvraagspam/brute force:** JavaScript, een uitgeschakelde knop en een honeypot houden directe HTTP-clients niet tegen. Controleer bij het gebruikte Formspree-formulier captcha/spamfilter, toegestane domeinen, servervalidatie en quota. De bestaande frontend vangt 429 en 413 af. Er is geen eigen wachtwoordlogin op deze site.
- **Uploads:** de eigen vijf-foto/10 MiB-regel is een browsercontrole. Controleer dezelfde grenzen, toegestane bestandstypen en veilige verwerking bij Formspree. De provider heeft eigen algemene limieten. [Formspree: uploads](https://help.formspree.io/articles/building-your-form/file-uploads), [Formspree: spam voorkomen](https://help.formspree.io/articles/troubleshooting/how-to-prevent-spam).
- **DDoS en verbindingen:** een statische pagina kan geen server-rate-limiter afdwingen. Voor de website geldt de hostingbescherming; voor formulierverwerking die van Formspree. Een toekomstige eigen review-API vraagt afzonderlijke verbinding-/requestlimieten, bytegrenzen en een bijgewerkte Node-runtime vóór ingebruikname. Die API is nu niet geconfigureerd.
- **Anti-framing:** `frame-ancestors` en `X-Frame-Options` kunnen niet effectief via een HTML-metatag worden ingesteld. Daarvoor is een ondersteunde HTTP-headerconfiguratie bij hosting/proxy nodig. De nieuwe CSP claimt geen clickjackingbescherming. [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

## Bij latere websitewijzigingen

Na aanpassen van JSON-LD of het review-endpoint: voer `node scripts/prepare-pages.mjs --sync` uit. Dit werkt CSP-hashes bij en voegt uitsluitend de geconfigureerde HTTPS-revieworigin aan `connect-src` toe. Commit de bijgewerkte HTML samen met de configuratie. De build weigert een niet-gesynchroniseerde policy. Gebruik geen tokens, gebruikersnaam of wachtwoord in het publieke endpoint.

Nieuwe scripts, stylesheets of downloadbare documenten moeten bewust aan de publicatielijst in `scripts/prepare-pages.mjs` worden toegevoegd. Interne documenten horen niet in die lijst. `build/pages` is gegenereerd en wordt bij bouwen opnieuw aangemaakt; plaats daar geen handmatig werk.

## Verificatie

De automatische suite voor deze publicatie bevat 49 tests, die lokaal en in GitHub Actions slagen. Ze controleren onder meer overflow, dubbele submit, vastgelopen responses, byteoverschrijding zonder betrouwbare lengteheader, behoud van geldige cache, XSS als tekst, uitsluiten van interne publicatiebestanden en detectie van een synthetisch token in staged inhoud. De dependency-audit vond geen bekende kwetsbaarheden. De zes extra tests voor het lokale projectconcept blijven eveneens lokaal.

Daarnaast is de gebouwde website lokaal in echte Chrome gecontroleerd: zeven pagina's zonder scriptfouten of onverwachte CSP-blokkades, normale calculator plus afwijzen van overflow, een synthetische Formspree-inzending, blokkeren van inline scripts/eventhandlers en onbekende fetchbestemmingen. Externe diensten zijn bij deze controle onderschept en gesimuleerd; er zijn geen echte formulierinzendingen gedaan.
