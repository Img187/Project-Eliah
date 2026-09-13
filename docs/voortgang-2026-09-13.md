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
