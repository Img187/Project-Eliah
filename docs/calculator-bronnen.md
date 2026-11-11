# Bronnen en grenzen van de calculators

Geraadpleegd op **11 november 2026**. Het actieve [rekenmodel](calculator-rekenmodel.md) beschrijft alle invoer, formules en aannames. Openbare broninformatie ondersteunt de uitleg; er is geen volledige normtoets uitgevoerd.

## Installatie en veilige bedrijfsvoering

- [NEN 1010:2020+C1:2024](https://www.nen.nl/nen-1010-2020-c1-2024-nl-325089) beschrijft ontwerp, aanleg, uitbreiding en verificatie van laagspanningsinstallaties.
- [NEN 1010-8:2026](https://www.nen.nl/nen-1010-8-2026-nl-338683) voegt functionele aspecten toe, onder meer lokale opwek en opslag.
- [NEN 3140:2011+A3:2019](https://www.nen.nl/nen-3140-2011-a3-2019-nl-261555) betreft veilige bedrijfsvoering, inspectie en onderhoud. De [uitgave 2026 Ontw.](https://www.nen.nl/nen-3140-2026-ontw-nl-349693) staat op de raadpleegdatum als ontwerp vermeld; die wordt hier niet als definitief vervangende norm behandeld.

Een energie-inschatting met jaarwaarden bewijst geen veilige installatie. De installateur bepaalt de toepasselijke editie en controleert onder meer kabels, beveiliging, aarding, fasebelasting en metingen. De calculator specificeert geen kabeldoorsnede, beveiligingswaarde of inspectieverklaring.

## Aansluiting

[Liander: soorten aansluitingen](https://www.liander.nl/aansluitingen/soorten-aansluitingen) onderscheidt meerdere stroomsterkten en aansluittypen. Alleen 1-fase/3-fase zegt daarom niet hoeveel vermogen werkelijk beschikbaar is. Zonder stroomsterkte en gelijktijdige belasting geven laadpaal- en groepenkastcalculator geen numerieke capaciteitsbeoordeling.

De elementaire relatie bij 230 V en arbeidsfactor 1 is eenfasig P ≈ 230 × I en driefasig gelijkmatig belast P ≈ 3 × 230 × I. Dit is geen NEN-goedkeuring en wordt zonder bekende I niet als klantresultaat ingevuld.

## Jaarafname en apparaten

[Milieu Centraal: gemiddeld energieverbruik](https://www.milieucentraal.nl/energie-besparen/inzicht-in-je-energierekening/gemiddeld-energieverbruik/) noemt 2.430 kWh als huishoudelijk gemiddelde binnen een afgebakende woningpopulatie; volledig elektrisch verwarmde woningen zijn daarin niet meegenomen. Dat gemiddelde wordt niet als ontbrekende klantinvoer gebruikt, ook niet voor bedrijven.

[Milieu Centraal: eigen zonnestroom gebruiken](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/verbruik-zelf-meer-zonnestroom/) noemt circa 30% direct huishoudelijk zelfverbruik zonder actieve sturing. Dat is geen vast percentage voor een specifieke klant. De calculator reconstrueert daarom geen totale vraag of PV-opwek uit alleen netafname.

Bestaande apparaatverbruiken zitten in de gemeten afname voor zover ze al gebruikt zijn. Selecties melden de situatie aan Sparky. Toekomstige wijzigingen vereisen onderbouwde aanvullende gegevens; vaste kWh-toeslagen voor een warmtepomp, auto of kookplaat zijn niet toegepast.

## Batterijscenario

De [Consumentenbond, Consumentengids mei 2025, pagina 19](https://www.consumentenbond.nl/binaries/content/assets/cbhippowebsite/gidsen/consumentengids/2025/nummer-5---mei/202505p16-thuisbatterij-p.pdf) beschrijft onder meer een grove capaciteitsvuistregel van 60–80% van dagelijks stroomverbruik. De website gebruikt deze fracties als scenario voor de bekende gemiddelde netafname, begrensd door teruglevering na opslagverlies. Deze toepassing is een eigen rekenaanname, geen gemeten avondprofiel of NEN-bepaling. Voor bedrijfspanden kan de vuistregel sterk afwijken.

90% round-trip, 90% ontlaaddiepte en 15% capaciteitsmarge zijn behouden scenarioaannames uit het eerdere model. Het laad- en ontlaadrendement worden ieder als de wortel van round-trip benaderd. Productrendement, standbyverbruik, degradatie en werkelijk dag-/seizoensprofiel moeten apart worden onderzocht. Er is geen financieel rendement berekend.

## Zonneopbrengst

[RVO: Tool zonnestroom voor maatschappelijk vastgoed, pagina 6](https://www.rvo.nl/sites/default/files/2022/01/Tool-zonnestroom-voor-maatschappelijk-vastgoed.pdf) geeft als voorbeeld ongeveer 340 kWh per jaar voor 375 Wp op het zuiden zonder schaduw, circa 907 kWh/kWp. De website rondt dit af naar **900 kWh/kWp** als referentiescenario; het is geen locatiespecifiek advies of actueel productgegeven. **435 Wp** is een voorbeeldpaneel uit het bestaande model.

[Milieu Centraal: richting en helling van het dak](https://www.milieucentraal.nl/energie-besparen/zonnepanelen/zonnepanelen-hoe-geschikt-is-je-dak/) geeft bij 15–45° helling voor oost/west 75–85% van de optimale opbrengst en voor zuid/noord gezamenlijk een bereik van 45–100%. De website gebruikt deze bereiken zonder een fictieve verdeling van panelen over de dakvlakken. Op een plat dak kan de feitelijke paneelrichting afwijken van de gebouwrichting. Schaduw en andere hellingen kunnen buiten deze voorbeelden vallen.

[EU-JRC PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en) kan de opbrengst op basis van locatie en systeemconfiguratie nader bepalen. De calculator heeft geen dakmaat of locatie en bewijst daarom geen passend legplan of haalbare volledige dekking van de stroomvraag.

## Bidirectioneel laden

De V2H/V2G-keuze is uitsluitend een gewenste functie. Auto, laadpunt, energiesturing en netkoppeling moeten samen worden gecontroleerd. [Netbeheer Nederland: technische eisen opwek](https://www.netbeheernederland.nl/requirements-generators) beschrijft eisen, verificatie en aanmelding voor netgekoppelde opwek en opslag. De calculator verzint geen autoaccu, ontlaadvermogen, rijreserve of beschikbare exportlimiet. V2H op een aanwezig net bewijst geen noodstroomfunctie.

## Foto's

Foto's helpen de intake, maar vervangen geen metingen of inspectie. Het bestaande contactformulier accepteert maximaal vijf JPG-, PNG- of WebP-bestanden van maximaal 10 MB per foto. De bezoeker kiest deze zelf en verstuurt pas via de eigen verzendknop. Gevraagd worden een overzicht van de meterkast met groepenkast en meter, close-ups van zichtbare componenten en indien mogelijk het kabeltracé met de meterkast als referentiepunt. Beschermkappen blijven op hun plaats; dakfoto's worden vanaf een veilige plek op de grond gemaakt.
