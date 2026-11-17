# Wekelijkse Google-reviewkaarten

De website gebruikt vaste kaarten in `homepage.html`. Een GitHub Actions-taak controleert de openbare Google Maps-bron iedere **maandag om 09:17, Europe/Amsterdam**. De taak draait op GitHub; de laptop hoeft daarvoor niet aan te staan. Gewone websitebezoekers halen geen Google-reviews op.

`scripts/sync-google-reviews.mjs` leest de openbare profielpagina en de openbare Maps-bronlink die daarin staat. Er worden geen Google-account, wachtwoord, cookies, API-sleutel of OAuth-machtigingen gebruikt. De bestaande API-route in `server/` blijft beschikbaar voor later; `data/reviews-config.json` houdt een lege endpoint.

De gecontroleerde kaarten staan tevens in `data/google-reviews.snapshot.json`. Nieuwe openbare records worden op hun Google-review-ID toegevoegd en bekende records worden bijgewerkt. Auteursnamen, sterren, oorspronkelijke teksten en eigen reviewlinks blijven behouden. De generator maakt dezelfde kaartstructuur, inclusief Meer/Minder. Vier kaarten zijn tegelijk zichtbaar; de overige komen via de bestaande bediening en rotatie aan bod. Die rotatie doet geen netwerkverzoeken.

## Grenzen van de openbare bron

De openbare Maps-preview is **geen volledige review-export**. Bij de controle op 17 november 2026 meldde Google zeven reviews en bevatte de anonieme bron vijf records. Alle zeven beoordelingen zijn toen afzonderlijk gecontroleerd in de bestaande aangemelde Maps-interface. De vier eerdere kaarten zijn behouden en Theo Voskuilen, Jeroen Winters en Mattia R zijn toegevoegd. Mattia R gaf sterren en een gestructureerde prijsbeoordeling; er is geen vrije reviewtekst overgenomen. Omdat alleen een relatieve datum zichtbaar was, is geen exacte datum verzonnen.

De wekelijkse taak werkt de zichtbare bronrecords bij en bewaart bekende kaarten die niet in de preview staan. Alleen als het aantal bekende, unieke reviews na samenvoegen gelijk is aan het Google-totaal en de sterren overeenkomen met de totaalscore, mag een nieuwe snapshot worden opgeslagen.

Als een nieuwe review niet in de openbare preview verschijnt, Google minder reviews meldt, de bronstructuur wijzigt of een controle faalt, stopt de taak met een fout. Er wordt dan niets gecommit of gepubliceerd en de bestaande website blijft staan. Een ontbrekende previewkaart wordt nooit automatisch als verwijderd beschouwd. Volledige controle in Maps of een latere officiële API-koppeling blijft nodig om zulke gevallen op te lossen. Dit is dus een wekelijkse controle van de beschikbare openbare bron, geen gegarandeerde volledige synchronisatie.

## Controleren en publiceren

Lokaal:

```powershell
node scripts/sync-google-reviews.mjs
node --test tests/google-reviews.test.mjs tests/google-reviews-dom.test.mjs tests/weekly-google-reviews.test.mjs
node scripts/prepare-pages.mjs
```

Handmatig op GitHub: open **Actions → Website controleren en publiceren → Run workflow**, kies `main` en vink **Google-reviews nu controleren** aan. Voor een gewone herpublicatie hoeft dat vinkje niet aan.

Voor een expliciete controle via de bestaande Git-login kan ook `[reviews-check]` in een commitbericht worden gebruikt. Alleen die expliciete marker start bij een push een extra fetch; normale websitewijzigingen doen dat niet.

De reviewjob controleert de kaarten en de build en commit uitsluitend `homepage.html` en `data/google-reviews.snapshot.json`. Daarna doorloopt exact die commit de volledige bestaande publicatiechecks en Pages-deployment. Een gelijktijdige nieuwe commit op `main` wordt niet overschreven. De JSON-snapshot en het collectorscript worden niet als losse websitebestanden gepubliceerd.

Volg de status in de GitHub Actions-run. GitHub kan geplande taken vertragen en schakelt schedules in openbare repositories na 60 dagen zonder repositoryactiviteit uit; controleer bij langdurige stilte of de workflow nog actief is. Zie [GitHub schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
