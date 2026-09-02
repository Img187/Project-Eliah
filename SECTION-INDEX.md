# Sparky Energies – developer section index

> Gegenereerd op **2026-07-31** uit de zeven actuele publieke HTML-pagina’s. De JSON-bron is [`data/section-index.json`](data/section-index.json); de visuele versie staat in [`section-index.html`](section-index.html).

## Snelle samenvatting

| Nr. | Pagina | Bestand | Primaire secties | Ondersteunend | Buttons | Formulieren |
|---:|---|---|---:|---:|---:|---:|
| 1 | [Home](index.html) | `index.html` | 6 | 1 | 12 | 1 |
| 2 | [Thuisbatterijen](thuisbatterijen.html) | `thuisbatterijen.html` | 8 | 1 | 4 | 1 |
| 3 | [Zonnepanelen](zonnepanelen.html) | `zonnepanelen.html` | 8 | 1 | 4 | 1 |
| 4 | [Laadpalen](laadpalen.html) | `laadpalen.html` | 8 | 1 | 5 | 1 |
| 5 | [Elektrotechnische renovaties](elektrotechnische-renovaties.html) | `elektrotechnische-renovaties.html` | 9 | 1 | 4 | 1 |
| 6 | [Over ons](over-ons.html) | `over-ons.html` | 8 | 0 | 11 | 1 |
| 7 | [Contact](contact.html) | `contact.html` | 1 | 0 | 1 | 1 |

**Totaal:** 48 primaire secties, 5 ondersteunende main-secties, 41 buttons/hyperlinks, 7 formulieren en 204 paragrafen met een ID.

### Hoe deze index gelezen wordt

- **Section ID** is de stabiele selector en ankerwaarde voor development.
- **Data-titel** komt uit `data-section-title` en beschrijft de technische sectienaam.
- **Zichtbare heading** komt uit het element dat via `aria-labelledby` gekoppeld is.
- **Ondersteunende secties** staan binnen `main`, maar hebben geen eigen `data-section-number`.
- Bij een submit-button is **Bestemming** de actuele `action` van het bovenliggende formulier.

## Google-tagconfiguratie

- Measurement ID: `G-B8QNYQR8CY`
- Google Tag ID: `GT-PL9T2DJM`
- Stream ID: `15270728473`

| Pagina | Script in `head` | Config-ID | Dynamisch na volledig akkoord |
|---|---|---|---|
| Home | Nee | `G-B8QNYQR8CY` | Ja |
| Thuisbatterijen | Nee | `G-B8QNYQR8CY` | Ja |
| Zonnepanelen | Nee | `G-B8QNYQR8CY` | Ja |
| Laadpalen | Nee | `G-B8QNYQR8CY` | Ja |
| Elektrotechnische renovaties | Nee | `G-B8QNYQR8CY` | Ja |
| Over ons | Nee | `G-B8QNYQR8CY` | Ja |
| Contact | Nee | `G-B8QNYQR8CY` | Ja |

## Primaire secties

### 1. Home — `index.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Energie van nu, zekerheid voor morgen | H1: Energie van nu, zekerheid voor morgen. | `homeSectGecertificeerdeInstallateursMetVakmanschap` | `homeSectGecertificeerdeInstallateursMetVakmanschapH1` | — |
| 2 | Wat wij voor u installeren en onderhouden | H2: Onze diensten | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `homeSectWatWijVoorUInstallerenEnOnderhoudenH2` | `layoutServices` |
| 3 | Van idee tot installatie, van vonk tot vermogen | H4: Van idee tot installatie, van vonk tot vermogen. | `homeSectVanIdeeTotInstallatieVanVonkTotVermogen` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogenH4` | `layoutImageCta` |
| 4 | Twijfelt u of uw installatie geschikt is? | H2: Twijfelt u of uw installatie geschikt is? | `homeSectTwijfeltUOfUwInstallatieGeschiktIs` | `homeSectTwijfeltUOfUwInstallatieGeschiktIsH2` | `layoutText` |
| 5 | Recent werk | H2: Recent werk | `homeSectRecentWerk` | `homeSectRecentWerkH2` | `layoutPortfolio` |
| 7 | Klaar om uw woning toekomstbestendig te maken? | H2: Klaar om uw woning toekomstbestendig te maken? | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenH2` | `layoutEmailCta` |

### 2. Thuisbatterijen — `thuisbatterijen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Thuisbatterij laten installeren | H1: Thuisbatterij laten installeren | `thuisbatterijSectThuisbatterijLatenInstalleren` | `thuisbatterijSectThuisbatterijLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Slim opslaan, slim gebruiken en slim besparen | H2: Slim opslaan, slim gebruiken en slim besparen | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparen` | `thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparenH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Voor woning en bedrijf | H2: Voor woning en bedrijf | `thuisbatterijSectVoorWoningEnBedrijf` | `thuisbatterijSectVoorWoningEnBedrijfH2` | `layoutSplitCard` |
| 4 | Hoe werkt een thuisbatterij? | H2: Hoe werkt een thuisbatterij? | `thuisbatterijSectHoeWerktEenThuisbatterij` | `thuisbatterijSectHoeWerktEenThuisbatterijH2` | `layoutSplitCard` |
| 5 | Sla overtollige energie op voor gebruik wanneer de zon niet schijnt. | H2: Sla overtollige energie op voor gebruik wanneer de zon niet schijnt. | `thuisbatterijSectSlimEnergiebeheerMetEMSEnAISturing` | `thuisbatterijSectSlimEnergiebeheerMetEMSEnAISturingH2` | `layoutStickySplitCards` |
| 7 | Sparky Energies helpt u met een passend advies, veilige installatie en duidelijke uitleg. Wij kijken niet alleen naar de batterij, maar naar de volledige elektrische installatie. | H2: Sparky Energies helpt u met een passend advies, veilige installatie en duidelijke uitleg. Wij kijken niet alleen naar de batterij, maar naar de volledige elektrische installatie. | `thuisbatterijSectZoWerkenWij` | `thuisbatterijSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Vragen | H2: Veelgestelde vragen over thuisbatterijen, installatie en voordelen | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenH2` | `layoutFaq` |
| 9 | Ontdek welke batterij bij u past | H2: Ontdek welke batterij bij u past | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `thuisbatterijSectOntdekWelkeBatterijPastBijUH2` | `layoutEmailCta` |

### 3. Zonnepanelen — `zonnepanelen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Zonnepanelen laten installeren | H1: Zonnepanelen laten installeren | `zonnepanelenSectZonnepanelenLatenInstalleren` | `zonnepanelenSectZonnepanelenLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Profiteer van duurzame energie uit eigen dak | H2: Profiteer van duurzame energie uit eigen dak | `zonnepanelenSectProfiteerVanDuurzameEnergieUitEigenDak` | `zonnepanelenSectProfiteerVanDuurzameEnergieUitEigenDakH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Een installatie die past bij uw situatie | H2: Een installatie die past bij uw situatie | `zonnepanelenSectEenInstallatieDiePastBijUwSituatie` | `zonnepanelenSectEenInstallatieDiePastBijUwSituatieH2` | `layoutSplitCard` |
| 4 | Hoe werken zonnepanelen? | H2: Hoe werken zonnepanelen? | `zonnepanelenSectHoeWerkenZonnepanelen` | `zonnepanelenSectHoeWerkenZonnepanelenH2` | `layoutSplitCard` |
| 5 | Sla overtollige stroom op | H2: Sla overtollige stroom op | `zonnepanelenSectSlaOvertolligeStroomOp` | `zonnepanelenSectSlaOvertolligeStroomOpH2` | `layoutStickySplitCards` |
| 7 | Sparky Energies denkt met u mee over de juiste oplossing. Wij helpen met advies, installatie, onderhoud en uitbreiding van bestaande installaties. | H2: Sparky Energies denkt met u mee over de juiste oplossing. Wij helpen met advies, installatie, onderhoud en uitbreiding van bestaande installaties. | `zonnepanelenSectZoWerkenWij` | `zonnepanelenSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Antwoorden op de meest gestelde vragen over zonnepanelen. | H2: Veel gestelde vragen over zonnepanelen. | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenH2` | `layoutFaq` |
| 9 | Benieuwd hoeveel u kunt besparen? | H2: Benieuwd hoeveel u kunt besparen? | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenH2` | `layoutEmailCta` |

### 4. Laadpalen — `laadpalen.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Laadpaal laten installeren | H1: Laadpaal laten installeren | `laadpalenSectLaadpaalLatenInstalleren` | `laadpalenSectLaadpaalLatenInstallerenH1` | `layoutSplitCard` |
| 2 | Laad uw elektrische auto veilig en gemakkelijk op eigen locatie | H2: Laad uw elektrische auto veilig en gemakkelijk op eigen locatie | `laadpalenSectLaadUwElektrischeAutoVeiligEnGemakkelijkOpEigenLocatie` | `laadpalenSectLaadUwElektrischeAutoVeiligEnGemakkelijkOpEigenLocatieH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Slim, veilig en goedkoop laden op eigen locatie | H2: Slim, veilig en goedkoop laden op eigen locatie | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatie` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatieH2` | `layoutSplitCard` |
| 4 | Slim laden: veilig, voordelig en efficiënt | H2: Slim laden: veilig, voordelig en efficiënt | `laadpalenSectSlimLadenVeiligVoordeligEnEfficient` | `laadpalenSectSlimLadenVeiligVoordeligEnEfficientH2` | `layoutStickySplitCards` |
| 5 | Slim laden voor medewerkers, klanten en bedrijfswagens | H2: Slim laden voor medewerkers, klanten en bedrijfswagens | `laadpalenSectSlimLadenVoorMedewerkersKlantenEnBedrijfswagens` | `laadpalenSectSlimLadenVoorMedewerkersKlantenEnBedrijfswagensH2` | `layoutSplitCard` |
| 6 | Sparky Energies helpt u met eerlijk advies, een veilige installatie en duidelijke uitleg. Wij kijken naar uw auto, aansluiting, laadwens en toekomstplannen, zodat u een laadpaal krijgt die echt bij uw situatie past. | H2: Sparky Energies helpt u met eerlijk advies, een veilige installatie en duidelijke uitleg. Wij kijken naar uw auto, aansluiting, laadwens en toekomstplannen, zodat u een laadpaal krijgt die echt bij uw situatie past. | `laadpalenSectZoWerkenWij` | `laadpalenSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 7 | Antwoorden op de meest gestelde vragen over laadpalen. | H2: Veel gestelde vragen over laadpalen. | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenH2` | `layoutFaq` |
| 8 | Welke laadpaal past bij u? | H2: Welke laadpaal past bij u? | `laadpalenSectWelkeLaadpaalPastBijU` | `laadpalenSectWelkeLaadpaalPastBijUH2` | `layoutEmailCta` |

### 5. Elektrotechnische renovaties — `elektrotechnische-renovaties.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Groepenkast en elektrotechnische renovaties | H1: Groepenkast en elektrotechnische renovaties | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovaties` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesH1` | `layoutSplitCard` |
| 2 | Zorgeloos voorbereid op een duurzame toekomst | H2: Zorgeloos voorbereid op een duurzame toekomst | `elektrotechnischeRenovatiesSectZorgeloosVoorbereidOpEenDuurzameToekomst` | `elektrotechnischeRenovatiesSectZorgeloosVoorbereidOpEenDuurzameToekomstH2` | `kenmerkKaartenSectie`<br>`layoutFeatures` |
| 3 | Van het gas af? Wij bereiden uw installatie voor | H2: Van het gas af? Wij bereiden uw installatie voor | `elektrotechnischeRenovatiesSectVanHetGasAfWijBereidenUwInstallatieVoor` | `elektrotechnischeRenovatiesSectVanHetGasAfWijBereidenUwInstallatieVoorH2` | `layoutStickySplitCards` |
| 4 | Groepenkast: het hart van uw woning | H2: Groepenkast: het hart van uw woning | `elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoning` | `elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoningH2` | `kenmerkKaartenSectie`<br>`layoutSplitFeatures` |
| 5 | Extra elektra waar u het nodig heeft | H2: Extra elektra waar u het nodig heeft | `elektrotechnischeRenovatiesSectExtraElektraWaarUHetNodigHeeft` | `elektrotechnischeRenovatiesSectExtraElektraWaarUHetNodigHeeftH2` | `kenmerkKaartenSectie`<br>`layoutSplitFeatures` |
| 6 | Elektra voor bedrijfspanden | H2: Elektra voor bedrijfspanden | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `elektrotechnischeRenovatiesSectElektraVoorBedrijfspandenH2` | `kenmerkKaartenSectie`<br>`layoutFeatureColumnsTransparent` |
| 7 | Zo werken wij | H2: Sparky Energies helpt u met eerlijk advies, een veilige installatie en duidelijke uitleg. Wij kijken naar uw groepenkast, aansluiting, wensen en toekomstplannen, zodat uw elektrotechnische renovatie echt bij uw situatie past. | `elektrotechnischeRenovatiesSectZoWerkenWij` | `elektrotechnischeRenovatiesSectZoWerkenWijH2` | `layoutProcessTimeline` |
| 8 | Alles wat u weten moet over elektrotechnische aanpassingen | H2: Veelgestelde vragen over elektrotechnische aanpassingen | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenH2` | `layoutFaq` |
| 9 | Wilt u uw elektra veilig laten aanpassen? | H2: Wilt u uw elektra veilig laten aanpassen? | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenH2` | `layoutEmailCta` |

### 6. Over ons — `over-ons.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Jong, gedreven en gebouwd op vakmanschap | H1: Jong, gedreven en gebouwd op vakmanschap | `overOnsSectJongGedrevenEnGebouwdOpVakmanschap` | `overOnsSectJongGedrevenEnGebouwdOpVakmanschapH1` | — |
| 2 | Twee vrienden, één doel | H2: Twee vrienden, één doel | `overOnsSectTweeVriendenEenDoel` | `overOnsSectTweeVriendenEenDoelH2` | — |
| 3 | Rotterdamse mentaliteit, landelijke service. | H2: Rotterdamse mentaliteit, landelijke service. | `overOnsSectRotterdamseMentaliteitLandelijkeService` | `overOnsSectRotterdamseMentaliteitLandelijkeServiceH2` | `kenmerkKaartenSectie`<br>`layoutFeatureColumnsTransparent` |
| 4 | Persoonlijk contact en snelle service | H2: Persoonlijk contact en snelle service | `overOnsSectPersoonlijkContactEnSnelleService` | `overOnsSectPersoonlijkContactEnSnelleServiceH2` | — |
| 5 | Wat wij doen | H2: Wat wij doen | `overOnsSectWatWijDoen` | `overOnsSectWatWijDoenH2` | `layoutImageGrid` |
| 6 | Werken volgens normen en fabrikantsrichtlijnen | H2: Wij werken volgens de geldende normen, voorschriften en fabrikantsrichtlijnen. Onze monteurs beschikken over de benodigde certificering, kennis en ervaring om installaties professioneel aan te leggen, te controleren en op te leveren. | `overOnsSectWerkenVolgensNormenEnFabrikantsrichtlijnen` | `overOnsSectWerkenVolgensNormenEnFabrikantsrichtlijnenH2` | `layoutCertificationLogos` |
| 7 | Samen bouwen aan de energie van morgen | H2: Samen bouwen aan de energie van morgen | `overOnsSectSamenBouwenAanDeEnergieVanMorgen` | `overOnsSectSamenBouwenAanDeEnergieVanMorgenH2` | — |
| 8 | Klaar voor de volgende stap? | H2: Klaar voor de volgende stap? | `overOnsSectKlaarVoorDeVolgendeStap` | `overOnsSectKlaarVoorDeVolgendeStapH2` | `layoutEmailCta` |

### 7. Contact — `contact.html`

| Nr. | Data-titel | Zichtbare heading | Section ID | Heading ID | Layout/shared classes |
|---:|---|---|---|---|---|
| 1 | Laten we beginnen | H1: Laten we beginnen | `contactSectLatenWeBeginnen` | `contactSectLatenWeBeginnenH1` | `layoutContactOfferte` |

## Ondersteunende main-secties

Deze secties zijn belangrijk voor styling en toegankelijkheid, maar tellen niet mee in de paginanummering.

| Pagina | Bovenliggende sectie | Section ID | Heading | Classes |
|---|---|---|---|---|
| Home | `homeSectGecertificeerdeInstallateursMetVakmanschap` | `homeSectGecertificeerdeInstallateursMetVakmanschapKaarten` | H2: Gecertificeerde installateurs met vakmanschap | `siteSectie`<br>`homeSectGecertificeerdeInstallateursMetVakmanschapKaarten`<br>`kenmerkKaartenSectie`<br>`layoutFeatures` |
| Thuisbatterijen | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenVragen` | — | `faqLijst` |
| Zonnepanelen | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenVragen` | — | `faqLijst` |
| Laadpalen | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenVragen` | — | `faqLijst` |
| Elektrotechnische renovaties | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenVragen` | — | `faqLijst` |

## Buttons en hyperlinks

### 1. Home

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Offerte | `a` | `homeSectGecertificeerdeInstallateursMetVakmanschapBtn01Offerte` | `homeSectGecertificeerdeInstallateursMetVakmanschap` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Lees meer | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn01LeesMeer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `thuisbatterijen.html` | `interne-pagina` |
| Ontdek | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn02Ontdek` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `zonnepanelen.html` | `interne-pagina` |
| Meer | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn03Meer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `laadpalen.html` | `interne-pagina` |
| Meer | `a` | `homeSectWatWijVoorUInstallerenEnOnderhoudenBtn04Meer` | `homeSectWatWijVoorUInstallerenEnOnderhouden` | `elektrotechnische-renovaties.html` | `interne-pagina` |
| Ontdek Sparky | `a` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogenBtn01OntdekSparky` | `homeSectVanIdeeTotInstallatieVanVonkTotVermogen` | `over-ons.html` | `interne-pagina` |
| Bekijk | `a` | `homeSectRecentWerkBtn01Bekijk` | `homeSectRecentWerk` | `#linkNogToevoegen` | `todo` |
| Bekijk | `a` | `homeSectRecentWerkBtn04Bekijk` | `homeSectRecentWerk` | `#linkNogToevoegen` | `todo` |
| Bekijk | `a` | `homeSectRecentWerkBtn02Bekijk` | `homeSectRecentWerk` | `#linkNogToevoegen` | `todo` |
| Bekijk | `a` | `homeSectRecentWerkBtn03Bekijk` | `homeSectRecentWerk` | `#linkNogToevoegen` | `todo` |
| Alle projecten | `a` | `homeSectRecentWerkBtn01AlleProjecten` | `homeSectRecentWerk` | `#linkNogToevoegen` | `todo` |
| Aanvragen | `button` | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenBtn01Aanvragen` | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 2. Thuisbatterijen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Offerte | `a` | `thuisbatterijSectThuisbatterijLatenInstallerenBtn01Offerte` | `thuisbatterijSectThuisbatterijLatenInstalleren` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Meer | `a` | `thuisbatterijSectZoWerkenWijBtn01Meer` | `thuisbatterijSectZoWerkenWij` | `#thuisbatterijSectOntdekWelkeBatterijPastBijU` | `interne-sectie` |
| Contact | `a` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelenBtn01Contact` | `thuisbatterijSectVeelGesteldeVragenOverThuisbatterijenInstallatieEnVoordelen` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Aanvragen | `button` | `thuisbatterijSectOntdekWelkeBatterijPastBijUBtn01Aanvragen` | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 3. Zonnepanelen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Offerte | `a` | `zonnepanelenSectZonnepanelenLatenInstallerenBtn01Offerte` | `zonnepanelenSectZonnepanelenLatenInstalleren` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Meer | `a` | `zonnepanelenSectZoWerkenWijBtn01Meer` | `zonnepanelenSectZoWerkenWij` | `#zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `interne-sectie` |
| Contact | `a` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelenBtn01Contact` | `zonnepanelenSectAntwoordenOpDeMeestGesteldeVragenOverZonnepanelen` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Aanvragen | `button` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenBtn01Aanvragen` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 4. Laadpalen

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Offerte | `a` | `laadpalenSectLaadpaalLatenInstallerenBtn01Offerte` | `laadpalenSectLaadpaalLatenInstalleren` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Meer | `a` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatieBtn02Meer` | `laadpalenSectSlimVeiligEnGoedkoopLadenOpEigenLocatie` | `#laadpalenSectWelkeLaadpaalPastBijU` | `interne-sectie` |
| Meer | `a` | `laadpalenSectZoWerkenWijBtn01Meer` | `laadpalenSectZoWerkenWij` | `#laadpalenSectWelkeLaadpaalPastBijU` | `interne-sectie` |
| Contact | `a` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalenBtn01Contact` | `laadpalenSectAntwoordenOpDeMeestGesteldeVragenOverLaadpalen` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Aanvragen | `button` | `laadpalenSectWelkeLaadpaalPastBijUBtn01Aanvragen` | `laadpalenSectWelkeLaadpaalPastBijU` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 5. Elektrotechnische renovaties

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Offerte | `a` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesBtn01Offerte` | `elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovaties` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Meer | `a` | `elektrotechnischeRenovatiesSectZoWerkenWijBtn01Meer` | `elektrotechnischeRenovatiesSectZoWerkenWij` | `#elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `interne-sectie` |
| Contact | `a` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingenBtn01Contact` | `elektrotechnischeRenovatiesSectAllesWatUWetenMoetOverElektrotechnischeAanpassingen` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Aanvragen | `button` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenBtn01Aanvragen` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 6. Over ons

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Meer | `a` | `overOnsSectPersoonlijkContactEnSnelleServiceBtn01Meer` | `overOnsSectPersoonlijkContactEnSnelleService` | `#overOnsSectKlaarVoorDeVolgendeStap` | `interne-sectie` |
| Contact | `a` | `overOnsSectPersoonlijkContactEnSnelleServiceBtn02Contact` | `overOnsSectPersoonlijkContactEnSnelleService` | `contact.html#contactSectLatenWeBeginnen` | `interne-pagina-sectie` |
| Thuisbatterijen | `a` | `overOnsSectWatWijDoenLink01Thuisbatterijen` | `overOnsSectWatWijDoen` | `thuisbatterijen.html` | `interne-pagina` |
| Zonnepanelen | `a` | `overOnsSectWatWijDoenLink02Zonnepanelen` | `overOnsSectWatWijDoen` | `zonnepanelen.html` | `interne-pagina` |
| Laadpalen | `a` | `overOnsSectWatWijDoenLink03Laadpalen` | `overOnsSectWatWijDoen` | `laadpalen.html` | `interne-pagina` |
| Groepenkasten | `a` | `overOnsSectWatWijDoenLink04Groepenkasten` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectGroepenkastHetHartVanUwWoning` | `interne-pagina-sectie` |
| Elektrotechnische renovaties | `a` | `overOnsSectWatWijDoenLink05ElektrotechnischeRenovaties` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html` | `interne-pagina` |
| Krachtstroom | `a` | `overOnsSectWatWijDoenLink06Krachtstroom` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `interne-pagina-sectie` |
| Inspectie, onderhoud en service | `a` | `overOnsSectWatWijDoenLink07InspectieOnderhoudEnService` | `overOnsSectWatWijDoen` | `#overOnsSectWerkenVolgensNormenEnFabrikantsrichtlijnen` | `interne-sectie` |
| Industriële oplossingen | `a` | `overOnsSectWatWijDoenLink08IndustrieleOplossingen` | `overOnsSectWatWijDoen` | `elektrotechnische-renovaties.html#elektrotechnischeRenovatiesSectElektraVoorBedrijfspanden` | `interne-pagina-sectie` |
| Aanvragen | `button` | `overOnsSectKlaarVoorDeVolgendeStapBtn01Aanvragen` | `overOnsSectKlaarVoorDeVolgendeStap` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

### 7. Contact

| Label | Element | Element ID | Section ID | Bestemming | Linktype |
|---|---|---|---|---|---|
| Versturen | `button` | `contactSectLatenWeBeginnenBtn01Versturen` | `contactSectLatenWeBeginnen` | `https://formspree.io/f/xnjenvqd` | `formulier-versturen` |

## Formulieren

| Pagina | Form ID | Section ID | Methode | Action | Provider | Doel |
|---|---|---|---|---|---|---|
| Home | `homeSectKlaarOmUwWoningToekomstbestendigTeMakenFormulier` | `homeSectKlaarOmUwWoningToekomstbestendigTeMaken` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor woningverduurzaming. |
| Thuisbatterijen | `thuisbatterijSectOntdekWelkeBatterijPastBijUFormulier` | `thuisbatterijSectOntdekWelkeBatterijPastBijU` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor persoonlijk thuisbatterijadvies. |
| Zonnepanelen | `zonnepanelenSectBenieuwdHoeveelUKuntBesparenFormulier` | `zonnepanelenSectBenieuwdHoeveelUKuntBesparen` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor een zonnepanelenofferte. |
| Laadpalen | `laadpalenSectWelkeLaadpaalPastBijUFormulier` | `laadpalenSectWelkeLaadpaalPastBijU` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor laadpaaladvies. |
| Elektrotechnische renovaties | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenFormulier` | `elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassen` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte aanvraag voor elektrotechnische aanpassingen. |
| Over ons | `overOnsSectKlaarVoorDeVolgendeStapFormulier` | `overOnsSectKlaarVoorDeVolgendeStap` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Korte algemene aanvraag vanaf de pagina Over ons. |
| Contact | `contactSectLatenWeBeginnenFormulier` | `contactSectLatenWeBeginnen` | `POST` | `https://formspree.io/f/xnjenvqd` | Formspree | Uitgebreide offerte- en contactaanvraag. |

## Developer-aandachtspunten

- Geen ontbrekende primaire headings gevonden.
- Geen dubbele ID’s binnen een pagina gevonden.
- Alle gedocumenteerde interne buttonbestemmingen bestaan.
- 9 primaire secties gebruiken bewust of historisch een andere `data-section-title` dan de zichtbare heading. Beide waarden staan daarom apart in deze index.
- Alle 7 formulieren posten momenteel via Formspree naar `https://formspree.io/f/xnjenvqd`.

## JSON-structuur

- `metadata`: bronbestanden, schema en aantallen.
- `tracking`: Google Tag-ID’s, stream-ID en controle per pagina.
- `sections`: primaire, genummerde secties.
- `supporting_sections`: aanvullende main-secties, waaronder de gedeelde kaarten- en FAQ-regio’s.
- `paragraphs`: alle paragrafen met ID, tekst, classes en bovenliggende sectie.
- `buttons`: links en buttons met developmentmetadata en actuele bestemming.
- `forms`: actuele formulier-actions, methode en provider.
- `validation`: dubbele ID’s, ontbrekende headings, ontbrekende interne doelen en titelverschillen.
