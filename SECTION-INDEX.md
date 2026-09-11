# Sparky Energies – developer section index

> Gegenereerd op **2026-09-11** uit de zeven actuele publieke HTML-pagina’s. De JSON-bron is [`data/section-index.json`](data/section-index.json); de visuele versie staat in [`section-index.html`](section-index.html).

## Snelle samenvatting

| Nr. | Pagina | Bestand | Primaire secties | Ondersteunend | Buttons | Formulieren |
|---:|---|---|---:|---:|---:|---:|
| 1 | [Home](index.html) | `index.html` | 5 | 3 | 7 | 1 |
| 2 | [Thuisbatterijen](thuisbatterijen.html) | `thuisbatterijen.html` | 8 | 3 | 4 | 1 |
| 3 | [Zonnepanelen](zonnepanelen.html) | `zonnepanelen.html` | 7 | 2 | 4 | 1 |
| 4 | [Laadpalen](laadpalen.html) | `laadpalen.html` | 8 | 2 | 6 | 1 |
| 5 | [Elektrotechnische renovaties](elektrotechnische-renovaties.html) | `elektrotechnische-renovaties.html` | 9 | 2 | 6 | 1 |
| 6 | [Over ons](over-ons.html) | `over-ons.html` | 5 | 1 | 9 | 1 |
| 7 | [Contact](contact.html) | `contact.html` | 0 | 1 | 1 | 2 |

**Totaal:** 42 primaire secties, 14 ondersteunende main-secties, 37 buttons/hyperlinks, 8 formulieren en 174 paragrafen met een ID.

### Hoe deze index gelezen wordt

- **Section ID** is de stabiele selector en ankerwaarde voor development.
- **Data-titel** komt uit `data-section-title` en beschrijft de technische sectienaam.
- **Zichtbare heading** komt uit het element dat via `aria-labelledby` gekoppeld is.
- **Ondersteunende secties** staan binnen `main`, maar hebben geen eigen `data-section-number`.
- Bij een submit-button is **Bestemming** de actuele `action` van het bovenliggende formulier.

## Google-tagconfiguratie

- Measurement ID: `G-87KMB19788`

Alle zeven publieke pagina's laden deze tag via `assets/js/cookie-consent.js` na volledige toestemming. De tabel hieronder controleert uitsluitend directe Google-tags in de HTML-head.

| Pagina | Script in `head` | Config-ID | Consent-default in `head` |
|---|---|---|---|
| Home | Nee | — | Nee |
| Thuisbatterijen | Nee | — | Nee |
| Zonnepanelen | Nee | — | Nee |
| Laadpalen | Nee | — | Nee |
| Elektrotechnische renovaties | Nee | — | Nee |
| Over ons | Nee | — | Nee |
| Contact | Nee | — | Nee |

## Primaire secties

### 1. Home — `index.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Eén installateur voor uw complete elektrische installatie | H1: Eén installateur voor uw complete elektrische installatie. | `homeSectGecertificeerdeInstallateursMetVakmanschap` | `homeSectGecertificeerdeInstallateursMetVakmanschapH1` | — |
| 2 | Wat wij voor u installeren en onderhouden | H2: Onze diensten | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `homeSectWatWijVoorUInstallerenEnOnderhoudenH2` | `layoutServices` |
| 4 | Alles werkt samen | H2: Alles werkt samen Uw woning wordt steeds elektrischer | `homeSectTwijfeltUOfUwInstallatieGeschiktIs` | `homeSectTwijfeltUOfUwInstallatieGeschiktIsH2` | `layoutText` |
| 8 | Over Sparky Energies | H2: Energie van nu, zekerheid voor morgen. | `homeSectVanIdeeTotInstallatieVanVonkTotVermogen` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogenH2` | `layoutImageCta` |
| 7 | Klaar om uw woning toekomstbestendig te maken? | H2: Klaar om uw woning toekomstbestendig te maken? | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenH2` | `layoutEmailCta` |

### 2. Thuisbatterijen — `thuisbatterijen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Thuisbatterij laten installeren | H1: Thuisbatterij laten installeren | `thuisbatterijSectThuisbatterijLatenInstalleren` | `thuisbatterijSectThuisbatterijLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Slim opslaan, slim gebruiken en slim besparen | H2: Wat een thuisbatterij voor u kan doen | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparen` | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparenH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Voor woning en bedrijf | H2: Wanneer is een thuisbatterij interessant? | `thuisbatterijSectVoorWoningEnBedrijf` | `thuisbatterijSectVoorWoningEnBedrijfH2` | `layoutSplitCard` |
| 4 | Hoe werkt een thuisbatterij? | H2: Hoe werkt een thuisbatterij? | `thuisbatterijSectHoeWerktEenThuisbatterij` | `thuisbatterijSectHoeWerktEenThuisbatterijH2` | `layoutSplitCard` |
| 5 | Sla overtollige energie op voor gebruik wanneer de zon niet schijnt. | H2: Slim energiebeheer, inzicht en noodstroom | `thuisbatterijSectSlimEnergiebeheerMetEMSEnAISturing` | `thuisbatterijSectSlimEnergiebeheerMetEMSEnAISturingH2` | `layoutStickySplitCards` |
| 7 | Sparky Energies helpt u met een passend advies, veilige installatie en duidelijke uitleg. Wij kijken niet alleen naar de batterij, maar naar de volledige elektrische installatie. | H2: Zo installeren wij uw thuisbatterij | `thuisbatterijSectZoWerkenWij` | `thuisbatterijSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Vragen | H2: Veelgestelde vragen over thuisbatterijen, installatie en voordelen | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenH2` | `layoutFaq` |
| 9 | Ontdek welke batterij bij u past | H2: Laat uw batterijadvies controleren | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `thuisbatterijSectOntdekWelkeBatterijPastBijUH2` | `layoutEmailCta` |

### 3. Zonnepanelen — `zonnepanelen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Zonnepanelen laten installeren | H1: Zonnepanelen laten installeren | `zonnepanelenSectZonnepanelenLatenInstalleren` | `zonnepanelenSectZonnepanelenLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Van zonlicht naar eigen stroom | H2: Van zonlicht naar eigen stroom | `zonnepanelenSectProfiteerVanDuurzameEnergieUitEigenDak` | `zonnepanelenSectProfiteerVanDuurzameEnergieUitEigenDakH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Een installatie die past bij uw situatie | H2: Een installatie die past bij uw situatie | `zonnepanelenSectEenInstallatieDiePastBijUwSituatie` | `zonnepanelenSectEenInstallatieDiePastBijUwSituatieH2` | `layoutSplitCard` |
| 5 | Sla overtollige stroom op | H2: Haal meer uit uw zonnestroom | `zonnepanelenSectSlaOvertolligeStroomOp` | `zonnepanelenSectSlaOvertolligeStroomOpH2` | `layoutStickySplitCards` |
| 7 | Sparky Energies denkt met u mee over de juiste oplossing. Wij helpen met advies, installatie, onderhoud en uitbreiding van bestaande installaties. | H2: Zo werken wij | `zonnepanelenSectZoWerkenWij` | `zonnepanelenSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Antwoorden op de meest gestelde vragen over zonnepanelen. | H2: Veel gestelde vragen over zonnepanelen. | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenH2` | `layoutFaq` |
| 9 | Benieuwd hoeveel u kunt besparen? | H2: Ontvang uw installatievoorstel | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenH2` | `layoutEmailCta` |

### 4. Laadpalen — `laadpalen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Laadpaal laten installeren | H1: Laadpaal thuis of op het werk laten installeren | `laadpalenSectLaadpaalLatenInstalleren` | `laadpalenSectLaadpaalLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Laad uw elektrische auto veilig en gemakkelijk op eigen locatie | H2: Waarom een eigen laadpaal? | `laadpalenSectLaadUwElektrischeAutoVeiligEnGemakkelijkOpEigenLocatie` | `laadpalenSectLaadUwElektrischeAutoVeiligEnGemakkelijkOpEigenLocatieH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Slim laden: veilig, voordelig en efficiënt | H2: Load balancing en slim laden | `laadpalenSectSlimLadenVeiligVoordeligEnEfficient` | `laadpalenSectSlimLadenVeiligVoordeligEnEfficientH2` | `layoutStickySplitCards` |
| 4 | Slim, veilig en goedkoop laden op eigen locatie | H2: Een laadoplossing die bij uw situatie past | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatie` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatieH2` | `layoutSplitCard` |
| 5 | Slim laden voor medewerkers, klanten en bedrijfswagens | H2: Slim laden voor medewerkers, klanten en bedrijfswagens | `laadpalenSectSlimLadenVoorMedewerkersKlantenEnBedrijfswagens` | `laadpalenSectSlimLadenVoorMedewerkersKlantenEnBedrijfswagensH2` | `layoutSplitCard` |
| 6 | Sparky Energies helpt u met eerlijk advies, een veilige installatie en duidelijke uitleg. Wij kijken naar uw auto, aansluiting, laadwens en toekomstplannen, zodat u een laadpaal krijgt die echt bij uw situatie past. | H2: Zo installeren wij uw laadpaal | `laadpalenSectZoWerkenWij` | `laadpalenSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 7 | Antwoorden op de meest gestelde vragen over laadpalen. | H2: Veel gestelde vragen over laadpalen. | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenH2` | `layoutFaq` |
| 8 | Welke laadpaal past bij u? | H2: Laat uw laadoplossing controleren | `laadpalenSectWelkeLaadpaalPastBijU` | `laadpalenSectWelkeLaadpaalPastBijUH2` | `layoutEmailCta` |

### 5. Elektrotechnische renovaties — `elektrotechnische-renovaties.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Groepenkast en elektrotechnische renovaties | H1: Groepenkast & elektrotechnische installaties | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovaties` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesH1` | `layoutSplitCard` |
| 2 | Zorgeloos voorbereid op een duurzame toekomst | H2: Wat wilt u laten uitvoeren? | `elektrotechnischeRenovatiesSectZorgeloosVoorbereidOpEenDuurzameToekomst` | `elektrotechnischeRenovatiesSectZorgeloosVoorbereidOpEenDuurzameToekomstH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Groepenkast vervangen of uitbreiden | H2: Groepenkast vervangen of uitbreiden | `elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoning` | `elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoningH2` | `kenmerkKaartenSectie`<br>`layoutSplitFeatures` |
| 3 | Van het gas af? Wij bereiden uw installatie voor | H2: Maak uw woning klaar voor elektrisch wonen | `elektrotechnischeRenovatiesSectVanHetGasAfWijBereidenUwInstallatieVoor` | `elektrotechnischeRenovatiesSectVanHetGasAfWijBereidenUwInstallatieVoorH2` | `layoutStickySplitCards` |
| 5 | Extra elektra waar u het nodig heeft | H2: Extra elektra waar u het nodig heeft | `elektrotechnischeRenovatiesSectExtraElektraWaarUHetNodigHeeft` | `elektrotechnischeRenovatiesSectExtraElektraWaarUHetNodigHeeftH2` | `kenmerkKaartenSectie`<br>`layoutSplitFeatures` |
| 6 | Elektra voor bedrijfspanden | H2: Elektra voor bedrijfspanden | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspandenH2` | `kenmerkKaartenSectie`<br>`layoutFeatureColumnsTransparent` |
| 7 | Zo werken wij | H2: Zo werken wij | `elektrotechnischeRenovatiesSectZoWerkenWij` | `elektrotechnischeRenovatiesSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Alles wat u weten moet over elektrotechnische aanpassingen | H2: Veelgestelde vragen over elektrotechnische aanpassingen | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenH2` | `layoutFaq` |
| 9 | Wilt u uw elektra veilig laten aanpassen? | H2: Laat uw elektrische installatie beoordelen | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenH2` | `layoutEmailCta` |

### 6. Over ons — `over-ons.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Jong, gedreven en gebouwd op vakmanschap | H1: Jong, gedreven en gebouwd op vakmanschap | `overOnsSectJongGedrevenEnGebouwdOpVakmanschap` | `overOnsSectJongGedrevenEnGebouwdOpVakmanschapH1` | — |
| 2 | Van idee tot installatie | H2: Van idee tot installatie, van vonk tot vermogen | `overOnsSectTweeVriendenEenDoel` | `overOnsSectTweeVriendenEenDoelH2` | — |
| 3 | Waarom klanten met Sparky werken | H2: Waarom klanten met Sparky werken | `overOnsSectRotterdamseMentaliteitLandelijkeService` | `overOnsSectRotterdamseMentaliteitLandelijkeServiceH2` | `kenmerkKaartenSectie`<br>`layoutFeatureColumnsTransparent` |
| 5 | Wat wij doen | H2: Onze installaties en diensten | `overOnsSectWatWijDoen` | `overOnsSectWatWijDoenH2` | `layoutImageGrid` |
| 8 | Klaar voor de volgende stap? | H2: Wilt u uw project met ons bespreken? | `overOnsSectKlaarVoorDeVolgendeStap` | `overOnsSectKlaarVoorDeVolgendeStapH2` | `layoutEmailCta` |

### 7. Contact — `contact.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|


## Ondersteunende main-secties

Deze secties zijn belangrijk voor styling en toegankelijkheid, maar tellen niet mee in de paginanummering.

| Pagina | Bovenliggende sectie | Section ID | Heading | Classes |
|---|---|---|---|---|
| Home | `homeSectTwijfeltUOfUwInstallatieGeschiktIs` | `homeSectKeuzehulp` | H2: Waar kunnen we u bij helpen? | `siteSectie`<br>`keuzehulpSectie` |
| Home | `homeSectTwijfeltUOfUwInstallatieGeschiktIs` | `homeSectWaaromSparky` | H2: Eén partij die het complete systeem overziet | `siteSectie`<br>`kenmerkKaartenSectie`<br>`layoutFeatures` |
| Home | `homeSectTwijfeltUOfUwInstallatieGeschiktIs` | `homeSectZoWerkenWij` | H2: Zo werken wij | `siteSectie`<br>`homeSectZoWerkenWij`<br>`thuisbatterijSectZoWerkenWij`<br>`layoutProcessTimeline` |
| Thuisbatterijen | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparen` | `thuisbatterijSectWanneerWachten` | H2: Wanneer zouden wij nog wachten? | `siteSectie`<br>`layoutText` |
| Thuisbatterijen | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparen` | `thuisbatterijCalculator` | H2: Welke thuisbatterij past bij uw situatie? | `siteSectie`<br>`adviesCalculatorSectie` |
| Thuisbatterijen | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenVragen` | — | `faqLijst` |
| Zonnepanelen | `zonnepanelenSectProfiteerVanDuurzameEnergieUitEigenDak` | `zonnepanelenCalculator` | H2: Hoeveel zonnepanelen passen bij uw situatie? | `siteSectie`<br>`adviesCalculatorSectie` |
| Zonnepanelen | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenVragen` | — | `faqLijst` |
| Laadpalen | `laadpalenSectLaadUwElektrischeAutoVeiligEnGemakkelijkOpEigenLocatie` | `laadpalenKeuzehulp` | H2: Welke laadoplossing past bij u? | `siteSectie`<br>`adviesCalculatorSectie` |
| Laadpalen | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenVragen` | — | `faqLijst` |
| Elektrotechnische renovaties | `elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoning` | `groepenkastCheck` | H2: Is uw groepenkast geschikt? | `siteSectie`<br>`adviesCalculatorSectie` |
| Elektrotechnische renovaties | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenVragen` | — | `faqLijst` |
| Over ons | `overOnsSectTweeVriendenEenDoel` | `overOnsSectWerkenVolgensNormen` | H2: Werk volgens normen en duidelijke afspraken | `siteSectie`<br>`overOnsBewijsSectie` |
| Contact | — | `contactRouteKeuze` | H1: Waar kunnen we u mee helpen? | `siteSectie`<br>`contactRouteKeuze` |

## Buttons en hyperlinks

### 1. Home

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Ontvang advies + prijsindicatie | `a` | `homeSectGecertificeerdeInstallateursMetVakmanschapBtn01Offerte` | `homeSectGecertificeerdeInstallateursMetVakmanschap` | `contact.html#contactRouteKeuze` | `interne-pagina-sectie` |
| Thuisbatterijen Gebruik meer van uw eigen stroomSla zonnestroom op, stuur slim op energieprijzen en kies indien gewenst voor noodstroom. | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn01LeesMeer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `thuisbatterijen.html` | `interne-pagina` |
| Zonnepanelen Maak meer gebruik van energie van uw eigen dakEen zonnepaneleninstallatie afgestemd op uw verbruik, dak en toekomstige elektrische apparatuur. | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn02Ontdek` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `zonnepanelen.html` | `interne-pagina` |
| Laadpalen Laad thuis veilig en slimVan laadpunt en load balancing tot laden met eigen zonnestroom. | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn03Meer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `laadpalen.html` | `interne-pagina` |
| Elektrotechniek Maak uw elektrische installatie toekomstbestendigGroepenkast, inductie, Quooker, voorbereiding voor een warmtepomp, extra elektra en zakelijke installaties. | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn04Meer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `elektrotechnische-renovaties.html` | `interne-pagina` |
| Bekijk hoe wij werken | `a` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogenBtn01OntdekSparkyNieuw` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogen` | `over-ons.html` | `interne-pagina` |
| Ontvang advies + prijsindicatie | `button` | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenBtn01Aanvragen` | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 2. Thuisbatterijen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Bereken welke batterij bij mij past | `a` | `thuisbatterijSectThuisbatterijLatenInstallerenBtn01Offerte` | `thuisbatterijSectThuisbatterijLatenInstalleren` | `#thuisbatterijCalculator` | `interne-sectie` |
| Bekijk de keuzehulp | `a` | `thuisbatterijSectZoWerkenWijBtn01Meer` | `thuisbatterijSectZoWerkenWij` | `#thuisbatterijCalculator` | `interne-sectie` |
| Bel voor advies | `a` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenBtn01Contact` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `tel:+31107934002` | `telefoon` |
| Persoonlijk advies aanvragen | `button` | `thuisbatterijSectOntdekWelkeBatterijPastBijUBtn01Aanvragen` | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 3. Zonnepanelen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Bereken mijn zonnepanelen | `a` | `zonnepanelenSectZonnepanelenLatenInstallerenBtn01Offerte` | `zonnepanelenSectZonnepanelenLatenInstalleren` | `#zonnepanelenCalculator` | `interne-sectie` |
| Bekijk de calculatorplek | `a` | `zonnepanelenSectZoWerkenWijBtn01Meer` | `zonnepanelenSectZoWerkenWij` | `#zonnepanelenCalculator` | `interne-sectie` |
| Bel voor advies | `a` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenBtn01Contact` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `tel:+31107934002` | `telefoon` |
| Ontvang persoonlijk advies | `button` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenBtn01Aanvragen` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 4. Laadpalen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Vind mijn laadoplossing | `a` | `laadpalenSectLaadpaalLatenInstallerenBtn01Offerte` | `laadpalenSectLaadpaalLatenInstalleren` | `#laadpalenKeuzehulp` | `interne-sectie` |
| Ontvang installatieprijs | `a` | `laadpalenSectLaadpaalLatenInstallerenBtn02Adviesgesprek` | `laadpalenSectLaadpaalLatenInstalleren` | `contact.html#contactRouteKeuze` | `interne-pagina-sectie` |
| Bekijk de keuzehulp | `a` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatieBtn02Meer` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatie` | `#laadpalenKeuzehulp` | `interne-sectie` |
| Vind mijn laadoplossing | `a` | `laadpalenSectZoWerkenWijBtn01Meer` | `laadpalenSectZoWerkenWij` | `#laadpalenKeuzehulp` | `interne-sectie` |
| Contact | `a` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenBtn01Contact` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Ontvang installatieprijs | `button` | `laadpalenSectWelkeLaadpaalPastBijUBtn01Aanvragen` | `laadpalenSectWelkeLaadpaalPastBijU` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 5. Elektrotechnische renovaties

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Laat mijn installatie beoordelen | `a` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesBtn01Offerte` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovaties` | `contact.html?onderwerp=elektrotechniek#contactRouteKeuze` | `interne-pagina-sectie` |
| Bekijk werkzaamheden ↓ | `a` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesBtn02Bespreken` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovaties` | `#elektrotechnischeRenovatiesSectZorgeloosVoorbereidOpEenDuurzameToekomst` | `interne-sectie` |
| Bespreek een zakelijke installatie | `a` | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspandenBtn02MeerInformatie` | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `contact.html?onderwerp=zakelijk#contactRouteKeuze` | `interne-pagina-sectie` |
| Laat mijn installatie beoordelen | `a` | `elektrotechnischeRenovatiesSectZoWerkenWijBtn01Meer` | `elektrotechnischeRenovatiesSectZoWerkenWij` | `contact.html?onderwerp=elektrotechniek#contactRouteKeuze` | `interne-pagina-sectie` |
| 010 - 793 4002 | `a` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenBtn01Contact` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `tel:+31107934002` | `telefoon` |
| Ontvang beoordeling + prijsindicatie | `button` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenBtn01Aanvragen` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 6. Over ons

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Thuisbatterijen | `a` | `overOnsSectWatWijDoenLink01Thuisbatterijen` | `overOnsSectWatWijDoen` | `thuisbatterijen.html` | `interne-pagina` |
| Zonnepanelen | `a` | `overOnsSectWatWijDoenLink02Zonnepanelen` | `overOnsSectWatWijDoen` | `zonnepanelen.html` | `interne-pagina` |
| Laadpalen | `a` | `overOnsSectWatWijDoenLink03Laadpalen` | `overOnsSectWatWijDoen` | `laadpalen.html` | `interne-pagina` |
| Groepenkasten | `a` | `overOnsSectWatWijDoenLink04Groepenkasten` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoning` | `interne-pagina-sectie` |
| Elektrotechniek | `a` | `overOnsSectWatWijDoenLink05ElektrotechnischeRenovaties` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html` | `interne-pagina` |
| Krachtstroom | `a` | `overOnsSectWatWijDoenLink06Krachtstroom` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `interne-pagina-sectie` |
| Inspectie, onderhoud en service | `a` | `overOnsSectWatWijDoenLink07InspectieOnderhoudEnService` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `interne-pagina-sectie` |
| Industriële oplossingen | `a` | `overOnsSectWatWijDoenLink08IndustrieleOplossingen` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `interne-pagina-sectie` |
| Bespreek uw project met Sparky | `button` | `overOnsSectKlaarVoorDeVolgendeStapBtn01Aanvragen` | `overOnsSectKlaarVoorDeVolgendeStap` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 7. Contact

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Vraag offerte aan | `button` | `contactSectLatenWeBeginnenBtn01Versturen` | — | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

## Formulieren

| Pagina | Form ID | Section ID | Methode | Action | Provider | Doel |
|---|---|---|---|---|---|---|
| Home | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenFormulier` | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor woningverduurzaming. |
| Thuisbatterijen | `thuisbatterijSectOntdekWelkeBatterijPastBijUFormulier` | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor persoonlijk thuisbatterijadvies. |
| Zonnepanelen | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenFormulier` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor een zonnepanelenofferte. |
| Laadpalen | `laadpalenSectWelkeLaadpaalPastBijUFormulier` | `laadpalenSectWelkeLaadpaalPastBijU` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor laadpaaladvies. |
| Elektrotechnische renovaties | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenFormulier` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor elektrotechnische aanpassingen. |
| Over ons | `overOnsSectKlaarVoorDeVolgendeStapFormulier` | `overOnsSectKlaarVoorDeVolgendeStap` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte algemene aanvraag vanaf de pagina Over ons. |
| Contact | `contactSnelAdviesFormulier` | — | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree |  |
| Contact | `contactSectLatenWeBeginnenFormulier` | — | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Uitgebreide offerte- en contactaanvraag. |

## Developer-aandachtspunten

- Geen ontbrekende primaire headings gevonden.
- Geen dubbele ID’s binnen een pagina gevonden.
- Alle gedocumenteerde interne buttonbestemmingen bestaan.
- 29 primaire secties gebruiken bewust of historisch een andere `data-section-title` dan de zichtbare heading. Beide waarden staan daarom apart in deze index.
- Alle 8 formulieren posten momenteel via Formspree naar `https://formspree.io/f/xnjenvqd`.

## JSON-structuur

- `metadata`: bronbestanden, schema en aantallen.
- `tracking`: Google Tag-ID’s, stream-ID en controle per pagina.
- `sections`: primaire, genummerde secties.
- `supporting_sections`: aanvullende main-secties, waaronder de gedeelde kaarten- en FAQ-regio’s.
- `paragraphs`: alle paragrafen met ID, tekst, classes en bovenliggende sectie.
- `buttons`: links en buttons met developmentmetadata en actuele bestemming.
- `forms`: actuele formulier-actions, methode en provider.
- `validation`: dubbele ID’s, ontbrekende headings, ontbrekende interne doelen en titelverschillen.
