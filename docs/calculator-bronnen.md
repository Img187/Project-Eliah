# Bronnen en grenzen van de calculators

Geraadpleegd op **8 september 2026**. De calculators geven een indicatie voor een eerste gesprek. De formules, aannames en vergelijking met het aangeleverde rekenblad staan in `calculator-rekenmodel.md`.

## Installatienormen

- **NEN 1010:2020+C1:2024** behandelt ontwerp, aanleg, uitbreiding en verificatie van laagspanningsinstallaties. De Nederlandse norm bouwt voort op de Europese HD 60364- en internationale IEC 60364-reeksen. **NEN 1010-8:2026** behandelt aanvullende functionele aspecten, waaronder lokale productie en opslag. Zie [NEN-overzicht](https://www.nen.nl/en/elektrotechniek/installatievoorschriften/nen-1010-laagspanningsinstallaties) en [NEN 1010-8:2026](https://www.nen.nl/nen-1010-8-2026-nl-338683).
- **NEN 3140:2011+A3:2019** betreft veilige bedrijfsvoering, inspectie en onderhoud. **NEN 3140:2026 Ontw.** is op de raadpleegdatum een ontwerp, geen definitieve nieuwe editie. Zie [NEN 3140](https://www.nen.nl/elektrotechniek/werkvoorschriften/laagspanninginstallaties) en [ontwerp 2026](https://www.nen.nl/nen-3140-2026-ontw-nl-349693).

Deze verantwoording gebruikt openbare omschrijvingen en toelichtingen. Er is geen volledige normtekst overgenomen of integrale normtoets uitgevoerd. Een capaciteit-, energie- of vermogensberekening is geen conformiteitsverklaring. De toepasselijke normeditie en de installatie moeten bij ontwerp en opname worden vastgesteld; onder meer bekabeling, beveiligingen, aarding, faseverdeling en verificatiemetingen vallen buiten deze online indicatie.

## Vermogen en AC-laden

Bij nominale **230 V tussen fase en nul**, met arbeidsfactor ongeveer 1, volgt uit de elektrische vermogensrelatie:

```text
1 fase: P (kW) ≈ 230 × I (A) / 1000
3 fasen, gelijkmatig belast: P (kW) ≈ 3 × 230 × I (A) / 1000
```

Dit is een rekenkundige benadering, geen normformule die een geschikte installatie bewijst. [Liander](https://www.liander.nl/aansluitingen/soorten-aansluitingen) publiceert overeenkomstige afgeronde aansluitvermogens. Een 3×25 A-aansluiting heeft circa 17,25 kW totaal; een eenfasige lader kan daarvan slechts de ruimte op zijn eigen 25 A-fase gebruiken. Andere gelijktijdige belasting vermindert die ruimte. Load balancing maakt geen extra vermogen beschikbaar.

Volgens [Alfen](https://aceservice.alfen.com/en-us/knowledgebase/article/KA-01197) is **6 A per actieve fase** een gebruikelijke ondergrens voor AC-laden: ongeveer 1,4 kW eenfasig of 4,2 kW driefasig. Sommige voertuigen hebben een hogere ondergrens. Fasewisseling hangt af van voertuig, laadpunt en configuratie. Deze AC-grens is geen algemene minimumgrens voor DC-laden of ontladen.

## Bidirectioneel laden

- [ISO 15118-20:2022](https://www.iso.org/standard/77845.html), met **Amd 1:2026**, beschrijft communicatie tussen voertuig en laadpunt, inclusief bidirectionele energieoverdracht. Een protocolvermelding alleen bewijst geen werkende productcombinatie.
- [IEC 61851-23:2023](https://webstore.iec.ch/en/publication/32973) betreft DC-laadapparatuur; de openbare scope begrenst de uitgewerkte bidirectionele eisen tot systeem A. [IEC 61851-24:2023](https://webstore.iec.ch/en/publication/32582) betreft digitale communicatie voor DC-energieoverdracht. Dit zijn internationale edities; de toepasselijke Europese/Nederlandse productnormen moeten bij de gekozen apparatuur worden gecontroleerd.
- [NEN-EN 50549-1:2019/A1:2023](https://www.nen.nl/nen-en-50549-1-2019-a1-2023-en-317053) betreft parallel op het laagspanningsdistributienet aangesloten opwek. [Netbeheer Nederland](https://www.netbeheernederland.nl/requirements-generators) beschrijft technische eisen, verificatie en aanmelding van opwek en opslag.

De [Nationale Routekaart Bidirectioneel Laden, juni 2026](https://open.overheid.nl/overheid/openbaarmakingen/api/v0/attachment/7e8c20da-49de-4438-9702-3714ba3e7729), pagina 11, beschrijft voor 2026 maatwerk met vaste voertuig-laadpaalcombinaties en registratie per locatie bij de netbeheerder. Compatibiliteit met energiemanagement, zonnepanelen en thuisbatterijen is niet vanzelfsprekend. V2L voor losse apparaten bewijst geen V2H/V2G-ondersteuning. Aanmelding en toepasselijke teruglevervoorwaarden moeten voor de concrete combinatie worden bevestigd.

V2H bij aanwezig net garandeert geen noodstroom bij netuitval. Daarvoor zijn een geschikte systeemfunctie en aanvullende installatievoorzieningen nodig. [Wallbox](https://support.wallbox.com/wp-content/uploads/ht_kb/2025/02/V2_FA_QX2NA_User-Guide-NA.pdf) onderscheidt bijvoorbeeld een V2H-kit en een backupkit met extra hardware; dit is een productvoorbeeld, geen algemene productspecificatie voor Nederland.

## Opbrengst en opslagrendement

[EU-JRC PVGIS](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis_en) berekent PV-opbrengst op basis van onder meer locatie en systeemconfiguratie. Een vaste jaarlijkse kWh/kWp-factor op de website blijft een aanname; het is geen locatiespecifieke PVGIS-uitkomst. Verliezen worden [multiplicatief verwerkt](https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/getting-started-pvgis/using-pvgis-frequently-asked-questions_en). Verliezen die al in een opbrengstfactor zitten mogen niet opnieuw worden afgetrokken.

[HTW Berlin, opslagonderzoek 2026](https://solar.htw-berlin.de/studien/stromspeicher-inspektion-2026/), laat verschillen in deellastrendement en standbyverbruik zien. Een vast opslagrendement is daarom een modelaanname, geen universele productwaarde. Nominale capaciteit, bruikbare capaciteit en laad-/ontlaadrendement moeten afzonderlijk worden behandeld. Voor nauwkeuriger dimensionering zijn productgegevens en tijdreeksen van verbruik en opwek nodig.
