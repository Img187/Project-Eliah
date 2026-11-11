# Rekenmodel websitecalculators

Versie 3, 11 november 2026. Implementatie: `assets/js/calculator-models.js`; formulier en contactoverdracht: `assets/js/main.js`.

## Gegevens en betekenis

De vier calculators vragen alleen de vereenvoudigde gegevens. Netaansluiting heeft overal dezelfde keuzes: 1-fase, 3-fase en weet ik niet. Fasen bepalen geen stroomsterkte of beschikbare vermogensruimte. Daarom worden nergens een hoofdzekering, verbruikspiek of veilige kabeldoorsnede aangenomen.

Voor batterij en zonnepanelen is `jaarverbruikKwh` de **jaarlijkse afname uit het net vóór salderen**. Zonder zonnepanelen komt dit overeen met het afgenomen elektriciteitsverbruik. Met zonnepanelen geldt: totale elektriciteitsvraag = netafname + direct gebruikte zonnestroom. Die laatste hoeveelheid is met de beperkte invoer onbekend. Teruglevering wordt afzonderlijk gevraagd bij de batterij als zonnepanelen aanwezig zijn; teruglevering is geen negatieve netafname.

De opgegeven jaarafname omvat bestaande elektrische auto, laadpaal, warmtepomp en inductiekookplaat voor zover deze al zijn gebruikt. Checkboxen leggen de situatie voor Sparky vast en tellen geen vaste kWh of kW op. Geplande apparaten zijn nog geen gemeten verbruik: daarvoor vraagt Sparky een onderbouwd toekomstig jaar- en dagprofiel. Ook de wens voor noodstroom is alleen een gesprekspunt; capaciteit, overbruggingsduur en omschakeling zijn niet bekend.

De [bronnenverantwoording](calculator-bronnen.md) onderscheidt energieaannames van installatie-eisen. Geen uitkomst is een offerte, productkeuze, terugverdientijd, vermogensgoedkeuring of integrale NEN-toets.

## Thuisbatterij

Invoer: netafname, zonnepanelen ja/nee, aantal zonnepanelen en teruglevering alleen bij ja, type locatie, energiecontract, netaansluiting en situatiecheckboxen. Het aantal is een positief geheel getal en gaat mee als informatie voor de aanvraag; het vervangt de gemeten teruglevering niet en bepaalt geen veronderstelde opwek. Bij nee worden het aantal en eventuele oude terugleverinvoer niet meegenomen. Zonder panelen volgt geen op zonnestroom gebaseerde capaciteit; een netlaadstrategie vereist aparte meet- en tariefgegevens.

Voor een eerste **scenario**, geen gemeten nachtprofiel, rekenen we met 60–80% van de gemiddelde dagelijkse netafname als te verschuiven vraag. De publiek beschreven 60–80%-vuistregel voor dagelijks huishoudelijk verbruik is hier toegepast op de bekende netafname; dat is een expliciete modelkeuze. Bij bedrijven, industrie en datacenters kan het werkelijke profiel sterk afwijken. De band is geen statistisch betrouwbaarheidsinterval.

```text
D = jaarlijkse netafname / 365
S = jaarlijkse zonnestroomteruglevering / 365
ηrt = 0,90; ηladen = ηontladen = √ηrt
DoD = 0,90; capaciteitsmarge = 0,15
Voor f = 0,60 en f = 0,80:
  Everschoven_AC = min(S × ηrt, D × f)
  Cnominaal_DC = Everschoven_AC / ηontladen × (1 + marge) / DoD
  Cbruikbaar_DC = Cnominaal_DC × DoD
```

90% round-trip-rendement, 90% ontlaaddiepte en 15% marge zijn vaste scenarioaannames uit het eerdere rekenmodel, geen NEN-eisen of universele productgegevens. De marge voegt capaciteit toe, geen zonne-energie. Nul export of nul netafname geeft nul zonne-opslag in dit model, zonder vaste minimumaccu. Er wordt geen omvormervermogen berekend. Teruglevering mag groter zijn dan netafname; de onbekende totale opwek wordt niet gereconstrueerd.

Een jaargemiddelde kan seizoenen, gelijktijdigheid, curtailment, bestaand batterijgebruik en netgeladen export niet beschrijven. Voor definitieve dimensionering zijn minstens dag-/kwartierprofielen en productgegevens nodig. Een bestaand opslagsysteem vraagt een afzonderlijke analyse.

## Zonnepanelen

Invoer: netafname, type locatie, daktype, huidige dakrichting Oost/West of Zuid/Noord, netaansluiting en situatiecheckboxen. Het model berekent hoeveel **nieuwe jaaropwek overeenkomt met de resterende netafname**. Bestaande PV-opwek en direct zelfverbruik zijn onbekend en worden niet nogmaals opgeteld of afgetrokken. Dit is geen claim dat een nieuwe installatie alle stroomvraag dekt of de netafname met hetzelfde aantal kWh vermindert.

```text
Paneelvermogen = 435 Wp (voorbeeldpaneel)
Referentieopbrengst zuid = 900 kWh/kWp/jaar
Oost/West: richtingsfactor 0,75–0,85
Zuid/Noord: richtingsfactor 0,45–1,00
Ylaag/hoog = 900 × betreffende factor
Nmin = ceil(netafname / (0,435 × Yhoog))
Nmax = ceil(netafname / (0,435 × Ylaag))
Pmin/max = Nmin/max × 0,435 kWp
```

De richtingsband gebruikt voorbeelden bij 15–45° paneelhelling, zonder schaduw, uit de dakrichtingtabel van Milieu Centraal. Zuid/Noord heeft een brede band omdat het gekozen dakvlak en de verdeling niet zijn gevraagd; er wordt geen gelijke verdeling aangenomen. De 900 kWh/kWp is een afgeronde referentie, geen locatie-uitkomst. Op een plat dak is de paneelopstelling nog te bepalen; de richting van het gebouw bewijst geen richting van de panelen. Daktype veroorzaakt geen extra vaste opbrengstcorrectie.

Het model kent geen dakmaat en garandeert dus geen passend aantal. Legplan, bruikbaar dakoppervlak, constructie, helling, schaduw, lokale PVGIS-opbrengst en omvormer/netruimte moeten worden bepaald. Het aantal panelen kan buiten deze rekenband vallen. Er wordt geen vast zelfverbruikspercentage toegepast: circa 30% is een huishoudelijk gemiddelde, geen klantmeting.

## Laadpaal

Invoer: afstand tot de (hoofd)-groepenkast, zonnepanelen aanwezig/gepland, aantal zonnepanelen alleen bij aanwezig, netaansluiting en bidirectioneel laden (alleen laden, V2H, V2G of beide). Het aantal gaat mee in de aanvraag en wordt zonder paneelvermogen en tijdprofiel niet omgerekend naar opwek of laadruimte.

Zonder stroomsterkte, fasebelasting, voertuig, laadpunt en laadprofiel is geen beschikbaar kW-vermogen, laadtijd of dagelijkse kWh-vraag bekend. Het model toont daarom alleen gerichte vervolgstappen. Ook 3-fase is geen toezegging van 11 of 22 kW. Zonnepanelen leveren zonder tijdprofiel geen gegarandeerde laadruimte.

De afstand is informatie voor de opname, geen kabelberekening. Kabelroute, aanlegwijze, spanningsverlies, overstroom- en aardlekbeveiliging, aarding en faseverdeling moeten worden beoordeeld. Load balancing moet bij voertuig, laadpunt en aansluiting passen en creëert geen extra netcapaciteit.

V2H/V2G-keuze legt de wens vast. Er worden geen voorbeeldautoaccu, SOC, rijreserve, energieopbrengst of bijlaadruimte ingevuld. De compatibele voertuig-laadpuntcombinatie, energiesturing, toegestane netkoppeling en aanmelding moeten worden gecontroleerd. V2H garandeert geen noodstroom.

## Groepenkast

Invoer: uitsluitend netaansluiting. De uitkomst is een controleadvies. Leeftijd, adres, type locatie, werkzaamheden, geïnstalleerd vermogen, hoofdzekering en gelijktijdige belasting worden niet gevraagd of stilzwijgend aangenomen. Geschiktheid, uitbreiding of verzwaring kan hiermee niet worden vastgesteld.

NEN 1010 betreft ontwerp, aanleg en verificatie; NEN 3140 betreft veilige bedrijfsvoering. De installateur bepaalt de toepasselijke editie en beoordeelt onder meer aarding, beveiliging, faseverdeling, vrije ruimte en meetresultaten.

## Contact en foto's

Berekenen verstuurt niets. De actuele indicatie en invoer worden lokaal in sessieopslag bewaard (versie 3, maximaal 24 uur). Wijzigen of resetten verwijdert de vorige indicatie. Verouderde versie-2-adviezen worden niet overgenomen.

Via de contactknop komen rekeninvoer/resultaten in de zichtbare omschrijving en `calculator_samenvatting`. Aangevinkte apparaten en noodstroom gaan uitsluitend als `calculator_situatie` mee in de aanvraag aan Sparky; ze verschijnen niet als extra resultaatregels of verbruikstoeslagen. De bezoeker krijgt te zien dat de aangevinkte situatie meegaat.

Het bestaande contactformulier laat maximaal vijf JPG-, PNG- of WebP-foto's van maximaal 10 MB per foto toevoegen. Foto's worden niet in sessieopslag opgeslagen of automatisch verstuurd. De bezoeker voegt ze zelf toe en verzendt de aanvraag. Het fotoverzoek vraagt om een overzicht van de meterkast met de groepenkast en de meter eronder, gevolgd door close-ups van zichtbare groepenkastcomponenten. Indien mogelijk worden foto's van het kabeltracé gevraagd, met de meterkast als herkenbaar referentiepunt. Ook de gewenste installatielocatie helpt; voor zonnepanelen het dak vanaf een veilige plek. Beschermkappen blijven op hun plaats. Na een geslaagde verzending worden de calculatoroverdracht en situatievelden opgeruimd.

## Controle

`npm --prefix tests test` controleert onder meer de energiegrenzen, rendementsverwerking, richtingsbanden, nulwaarden, onbekende aansluitgegevens, verwijderde invoervelden, voorwaardelijke teruglevering, situatieoverdracht, resultaatverversing, foto's en bestaande formulier- en trackingbeveiliging. De publicatiebuild wordt lokaal voorbereid; deze wijziging publiceert of verzendt geen aanvraag.
