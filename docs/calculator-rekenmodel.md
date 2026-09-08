# Rekenmodel websitecalculators

Versie 2.1, 8 september 2026. Implementatie: `assets/js/calculator-models.js`; formulierkoppeling en contactoverdracht: `assets/js/main.js`. De modellen rekenen lokaal in de browser. Alle ingevulde uitgangspunten en resultaatregels gaan mee wanneer een bezoeker de contactroute kiest. Het contactformulier verstuurt pas na de eigen verzendactie van de bezoeker.

De website toont alleen het gewone formulier, zonder aparte instellingen of subsecties. Technische parameters zoals rendement, DoD, capaciteitsmarge, paneelvermogen, gelijktijdigheid en arbeidsfactor staan als standaardwaarden in de rekenlogica. De hieronder beschreven optionele modelparameters kunnen intern worden gebruikt voor vergelijking en verificatie; ze zijn geen extra invoervelden voor bezoekers. Noodstroom en V2H/V2G tonen hun benodigde invoer als gewone velden in hetzelfde formulier, alleen na selectie van die functie.

De [bronnenverantwoording](calculator-bronnen.md) onderscheidt NEN-installatie-eisen, Europese/internationale product- en communicatiestandaarden en rekenaannames. Dit model voert geen integrale normtoets uit. Er worden geen kabeldoorsneden, beveiligingen, keuringsverklaringen of gegarandeerde financiële opbrengsten berekend. Jaarwaarden leveren een scenario op, geen tijdreeks of economisch optimale systeemkeuze.

## Vergelijking met het aangeleverde Excelbestand

Het bestand `Sparky_Energies_accu_omvormer_calculator_v3.xlsx` is alleen gelezen. De vijf tabbladen bevatten een batterij-/omvormermodel, geplande verbruikers, PV-vermogen, maandfactoren en capaciteitsscenario's. Het is geen volledige laadpaal- of installatiecalculator.

| Excelonderdeel | Bevinding en verwerking in de website |
| --- | --- |
| `Invoer!B4:B10` | Netafname, teruglevering, dagoverschot, avondfractie, marge, rendement en DoD zijn nuttige afzonderlijke gegevens. Netafname betekent vóór salderen, niet het saldo op de jaarrekening. |
| `Invoer!F22:F26`, `B29:B30` | Alleen geplande jaarlijkse verbruikers worden bijgeteld. De website volgt dit met één expliciete extra jaarvraag; checkboxen voegen geen vaste kWh toe. Vul verwachte nieuwe netafname en een passend toekomstig overschot in. |
| `Invoer!E23` | De warmtepompvraag is afgeleid van PV-vermogen (`B18 × 650`, begrensd op 2.000–6.000 kWh). Dit is niet overgenomen: PV-grootte bepaalt geen warmtebehoefte. Gebruik gemeten verbruik of een onderbouwde warmte-/SCOP-berekening. |
| `Invoer!B34` | Het maximum van gemiddeld dagoverschot × zomerfactor en een gemeten zomerdag selecteert een hoge zomervraag. Website gebruikt standaard het jaargemiddelde; een ingevulde rekendag vervangt dat expliciet en wordt niet als heeljaarsprognose gepresenteerd. |
| `Invoer!B36:B37` | Excel deelt de benodigde AC-energie door het gehele round-trip-rendement en DoD. Website onderscheidt beide conversierichtingen en DC-capaciteit. Bij alleen een round-trip-waarde is gelijke efficiëntie per richting een zichtbare benadering. |
| `Invoer!B39:B40` | De ondergrens van 0,5 × nominale kWh dwingt 0,5C als omvormerkeuze af. Website leidt een vermogensondergrens af uit laad-/ontlaaduren en gewenst piekvermogen. Een C-rate is een productgrens die daarna moet worden getoetst, geen universeel vereist vermogen. Er is geen vaste productladder. |
| `Resultaat!B6` | Het veld voor de aanbevolen standaard accugrootte is leeg; de website beweert daarom geen productselectie uit Excel over te nemen. |
| `Maandfactoren!B2:B13` | De twaalf factoren hebben gemiddeld circa 0,904 en vormen geen genormaliseerd jaarprofiel. Ze zijn niet gebruikt voor een jaarlijkse energieprognose. |

Rekenvoorbeeld met dezelfde energie-uitgangspunten als Excel: 12.000 kWh netafname, 5.000 kWh uitsluitend nieuw verbruik, 10.920 kWh PV-opwek, 9.000 kWh jaarlijkse export, 60 kWh expliciet dagoverschot, 80% avond-/nachtfractie, 90% round-trip-rendement, 90% DoD en 15% capaciteitsmarge. Avondvraag is 37,2603 kWh AC. Excel geeft circa **52,9 kWh nominaal en 30 kW standaardomvormer**. Het gewijzigde energieboekhoudmodel geeft **50,2 kWh nominaal**. Met 6 laaduren, 8 ontlaaduren en expliciet gewenst piekvermogen 13,095 kW (Excel-piek 26,19 × 50%) volgt een **ondergrens van 13,1 kW AC**, geen definitieve omvormerkeuze. Met de standaard jaargemiddelde dagexport in plaats van de 60-kWh-zomerdag wordt dit circa 29,9 kWh nominaal. Dat verschil laat zien waarom het dagprofiel doorslaggevend is.

## Thuisbatterij

Alle energieën zijn kWh; vermogen is kW en tijd is uren. De gekozen dag kent afzonderlijke laad- en ontlaadvensters, samen maximaal 24 uur. Een handmatig ingevulde avondvraag of dagoverschot vervangt de jaarlijkse schatting, ook wanneer die handmatige waarde 0 is.

```text
D = gemeten avondvraag, anders (jaarlijkse netafname + nieuwe netafname) / 365 × avondfractie
S = opgegeven dagoverschot, anders jaarlijkse zonnestroomexport / 365
ηc = ηd = √(round-trip-rendement)
Ccyclus_DC = min(S × ηc, D / ηd)
Everschoven_AC = Ccyclus_DC × ηd
Creserve_DC = noodvermogen × nooduren / ηd, uitsluitend bij gekozen noodstroom
Cnominaal_DC = (Ccyclus_DC + Creserve_DC) × (1 + marge) / DoD
Cbruikbaar_DC = Cnominaal_DC × DoD
Plaad_AC = Ccyclus_DC / ηc / laaduren
Pontlaad_AC = Everschoven_AC / ontlaaduren
Pondergrens_AC = max(Plaad_AC, Pontlaad_AC, noodvermogen, gewenst piekvermogen)
```

Standaardwaarden 80% avondfractie, 90% round-trip, 90% DoD en 15% marge komen uit Excel. De 6/8 uur zijn vaste websiteaannames. De marge is capaciteitshoofdruimte, geen extra dagelijkse energie. Noodreserve telt apart en wordt niet als dagelijks verschoven zonnestroom geteld. Zonder zonne-overschot of avondvraag wordt geen vaste minimumaccu voorgesteld. Netarbitrage, seizoensopslag, degradatie, standbyverbruik en kwartierprofielen vragen een verdergaande berekening. Het aantal panelen, contracttype en apparaatkeuzes blijven context voor het adviesgesprek.

## Zonnepanelen

Deze calculator vraagt het **totale huidige elektriciteitsverbruik**, inclusief direct gebruikte zonnestroom. Extra jaarvraag bevat alleen nog niet meegeteld nieuw verbruik.

```text
J = huidige totale jaarvraag + uitsluitend nieuwe jaarvraag
Y = ingevulde netto jaaropbrengst/kWp, anders 875 × richtingsfactor
Ebestaand = gemeten jaaropwek, anders bestaand aantal × bestaand Wp / 1000 × Y
Nnodig = ceil(max(0, J − Ebestaand) / (nieuw Wp / 1000 × Y))
Abestaand = ingevuld bestaand dakbeslag, anders bestaand aantal × ruimte/paneel
Ndak = max(0, floor((totale bruikbare dakruimte − Abestaand) / ruimte/paneel))
Nnieuw = min(Nnodig, Ndak), of alleen Nnodig wanneer dakruimte onbekend is
Pnieuw_kWp = Nnieuw × nieuw Wp / 1000
Enieuw = Pnieuw_kWp × Y
```

875 kWh/kWp en 320 Wp voor oude panelen zijn Excelaannames; 435 Wp voor nieuwe panelen is de bestaande websiteaanname. Richtingsfactoren zijn expliciete scenario's: zuid 1, oost/west 0,85, vrije oriëntatie op plat dak 0,9, noord 0,65 en onbekend 0,9. Ze zijn geen PVGIS-resultaat. Een ingevulde netto opbrengst vervangt de hele richtingsaanname; verliezen worden niet opnieuw toegepast. Bij afwijkende bestaande oriëntatie gebruikt men gemeten bestaande opwek. De website rekent met 2 m²/paneel inclusief tussenruimte; een legplan kan deze interne aanname verfijnen. Daktype stuurt geen verzonnen extra opbrengstfactor. De oude bovengrens `aantal + 1` is verwijderd: het resultaat overschrijdt de opgegeven dakcapaciteit niet.

## Laden en bidirectioneel laden

Voor kleinverbruik wordt gerekend met 230 V per fase, arbeidsfactor circa 1 en gelijkmatig verdeelde overige belasting. `Pnet = fasen × 230 × hoofdzekering_A / 1000`; laadruimte is `max(0, Pnet − overige_kW)`. Onbekende fasen, hoofdzekering of overige belasting leveren **geen bekende laadruimte** op. Grootverbruik/middenspanning vraagt een locatieanalyse. Een ingevulde 0 kW overige belasting is een uitdrukkelijke aanname.

Voertuig- en laadpuntlimiet begrenzen het vermogen per punt. Bij DC zijn de ingevoerde limieten DC-uitgangsvermogen en wordt de benodigde AC-input met het laadrendement omgerekend. De DC-optie veronderstelt een driefasenvoeding. AC volgt de gekozen een- of driefasenstand, zonder automatische fasewisseling. De website gebruikt 6 A als minimumstroom; de rekenkern ondersteunt intern een hogere productwaarde. Eenfasige punten worden in het model zo gelijk mogelijk over de aanwezige fasen verdeeld; per fase wordt ook het aantal gelijktijdige minimumlaadstromen begrensd. Werkelijke bedrading en zwaarste fase moeten dit ondersteunen.

```text
Erijden_DC = totaal gereden km × kWh/100km / 100
Erijden_AC = Erijden_DC / ηladen
Eruimte_AC = gezamenlijk begrensd laadvermogen × laaduren
tbenodigd = Erijden_AC / gezamenlijk begrensd laadvermogen
```

De eenvoudige website gebruikt 20 kWh/100 km, 90% laad-efficiëntie en een AC-laadscenario passend bij de opgegeven aansluiting: één fase met 3,7 kW, anders drie fasen met 11 kW als apparatuurgrens. Dit zijn interne aannames; werkelijk voertuig- en laadpuntvermogen moeten worden gecontroleerd. Laaduren blijven een gewoon invoerveld (standaard 8). Totaalkilometers worden niet nogmaals met het aantal punten vermenigvuldigd. Onder de AC-minimumstroom wordt pauzeren getoond. Het model veronderstelt vergelijkbare voertuigen, dezelfde laadvensters en vermogenssturing, en berekent geen voertuigvolgorde of laadcurve. De rekenkern houdt interne ondersteuning voor expliciete AC-/DC-productgegevens.

V2H/V2G geldt voor **één** bidirectionele auto. Autoaccu 60 bruikbare kWh, aankomst 80%, minimum 30%, 3,6 kW AC-ontladen, 4 ontlaaduren, 8 kWh woningvraag zijn voorbeeldwaarden in de gewone velden. Het ontlaadrendement van 90% is een interne aanname. Bruikbare autoaccu krijgt geen tweede DoD-korting. De reserve omvat de rijreserve. De website verdeelt het kilometerverbruik gelijk over het aantal punten. De rekenkern ondersteunt intern een aparte rijvraag voor deze auto. Het dagelijkse model gaat uit van rijden buiten het laadvenster, zonder elders bijladen. Als aankomst-SOC plus de te herstellen rij-energie meer dan 100% vraagt, is geen dagelijks bidirectioneel scenario berekend.

```text
Eauto_DC = bruikbare autoaccu × max(0, SOCaankomst − SOCreserve) / 100
Efysiek_AC = min(Eauto_DC × ηontladen, Pontladen_AC × ontlaaduren)
Ebijlaadruimte_AC = max(0, min(Eruimte_AC − Erijden_AC,
                             laadruimte van één punt × laaduren − rij-energie van deze auto_AC))
Ebudget_AC = min(Efysiek_AC, Ebijlaadruimte_AC × ηladen × ηontladen)
EV2H_AC = min(Ebudget_AC, woningvraag in het venster), alleen in V2H/beide
trestant = ontlaaduren − EV2H_AC / Pontladen_AC
PV2G = min(Pontladen_AC, ingevulde resterende toegestane exportlimiet,
           aansluitvermogen op de fasen van de bidirectionele omvormer)
EV2G_AC = min(Ebudget_AC − EV2H_AC, PV2G × trestant), alleen in V2G/beide
Ebijvullen_AC = (EV2H_AC + EV2G_AC) / (ηladen × ηontladen)
```

V2H krijgt eerst een deel van het ontlaadvenster, V2G het restant: de twee energieën worden niet onafhankelijk uit dezelfde volledige accu berekend. Deze vereenvoudigde volgorde vraagt een passend werkelijk woningprofiel; het is geen optimalisatie van gelijktijdige vermogens/tarieven. De accu kan later alleen worden bijgevuld binnen de eigen voertuig-/puntlimiet én de gezamenlijke netruimte. Zonder bekende bijlaadruimte wordt alleen een eenmalige fysieke energiegrens getoond. Zonder bekende exportlimiet wordt V2G niet berekend. Auto/lader/HEMS-compatibiliteit, toegestane netkoppeling, aanmelding, garanties, bedrijfsmodus en noodstroomvoorzieningen moeten afzonderlijk worden bevestigd. Er wordt geen V2G-inkomen of jaaraantal volledige cycli beloofd.

## Elektrotechniek

Nieuw geïnstalleerd **elektrisch** vermogen wordt vermenigvuldigd met de expliciete gelijktijdigheid (standaard 100%). Bestaande gelijktijdige belasting telt apart. Eén opgegeven arbeidsfactor (standaard 100%) geldt als benadering voor alle lasten.

```text
Pnieuw = nieuw geïnstalleerd vermogen × gelijktijdigheid
Ptotaal = Pbestaand + Pnieuw
Paansluiting = aantal fasen × 230 × hoofdzekering_A × arbeidsfactor / 1000
Izwaarste = Pbestaand × 1000 / (netfasen × 230 × arbeidsfactor)
          + Pnieuw × 1000 / (fasen nieuwe belasting × 230 × arbeidsfactor)
```

Bestaand vermogen is gelijk verdeeld verondersteld. De eenvoudige website neemt ook voor nieuw vermogen verdeling over de beschikbare netfasen aan. De rekenkern kan intern een afwijkende faseverdeling ontvangen; dan wordt die gebruikt. Zowel totale kW als fase-A worden gecontroleerd. Een expliciet opgegeven driefasenbelasting op een eenfasenaansluiting wordt afzonderlijk gemeld. De werkelijke faseverdeling blijft een controlepunt tijdens de opname. Ontbrekende gegevens geven geen capaciteitsakkoord. Selectiviteit, inschakelstromen, harmonischen, aanlegwijze, omgeving, kabeltracé en metingen blijven buiten dit model.

## Verificatie

Voer `node --test tests/calculators.test.cjs` uit. De tests bevatten het Excelvoorbeeld, de dakgrensregressie, nul-/onbekende invoer, afzonderlijke backupreserve, fasestroom en AC-minimum, AC/DC-verliezen, V2H/V2G-budgetten, de eigen laadlimiet van één auto op een laadplein, onmogelijke tijd/SOC-invoer en faseoverbelasting bij een laag totaalvermogen.

De vier formulieren zijn daarnaast in Chrome getest op echte formulierinvoer, conditionele velden in het gewone formulier, afwezigheid van de verwijderde instellingen/subsecties, verouderde resultaten en volledige contactoverdracht via een lokale HTTP-server. Uitlijning en horizontale overloop zijn gecontroleerd op 1440, 1024, 768 en 390 CSS-pixels. De bronwerkmap is niet aangepast en er is niets verstuurd of gepubliceerd.
