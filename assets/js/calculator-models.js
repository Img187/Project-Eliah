/* Indicatieve energiescenario's. Eenheden en bronnen: docs/calculator-rekenmodel.md. */
(function (root, factory) {
  const models = factory();
  if (typeof module === 'object' && module.exports) module.exports = models;
  else root.SparkyCalculators = models;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class InputError extends Error {
    constructor(field, message) { super(message); this.name = 'InputError'; this.field = field; }
  }

  function number(v, key, positive = false) {
    const raw = v.get(key);
    const text = raw === null ? '' : String(raw).trim();
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) {
      throw new InputError(key, 'Vul een geldig getal binnen de aangegeven grenzen in.');
    }
    const value = Number(text);
    // Technische getalgrens, geen uitspraak over een geschikte installatiegrootte.
    if (!Number.isFinite(value) || value > Number.MAX_SAFE_INTEGER || (positive && value <= 0)) {
      throw new InputError(key, 'Vul een geldig getal binnen de aangegeven grenzen in.');
    }
    return value;
  }

  function choice(v, key, allowed, fallback) {
    const raw = v.get(key);
    const value = raw === null || raw === '' ? fallback : raw;
    if (!allowed.includes(value)) throw new InputError(key, 'Kies een van de aangegeven opties.');
    return value;
  }

  function assertFinite(value) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new InputError('', 'Deze waarden leveren een te grote berekening op. Controleer uw invoer.');
    }
    if (value && typeof value === 'object') Object.values(value).forEach(assertFinite);
  }

  const fmt = (value, digits = 1) => {
    assertFinite(value);
    return value.toLocaleString('nl-NL', { maximumFractionDigits: value > 0 && value < .1 ? Math.max(digits, 4) : digits });
  };
  const range = (min, max, digits = 1) => min === max ? fmt(min, digits) : `${fmt(min, digits)}–${fmt(max, digits)}`;
  const advice = (type, topic, title, summary, details, metrics) => {
    assertFinite(metrics);
    return { type, topic, title, summary, details, metrics, fields: [] };
  };
  const consumptionNote = 'De opgegeven jaarafname bevat het bestaande verbruik van uw apparaten. Er komen geen vaste kWh-toeslagen bij. Verandert uw situatie binnenkort, dan is een nieuw onderbouwd jaarprofiel nodig.';
  const installationNote = 'Ontwerp, aanleg en verificatie vragen een beoordeling volgens de toepasselijke NEN 1010; veilige bedrijfsvoering valt onder NEN 3140. Deze indicatie is geen keuring of bewijs van geschiktheid.';

  function connection(v) {
    const type = choice(v, 'netaansluiting', ['1-fase', '3-fase', 'onbekend']);
    const phases = type === '1-fase' ? 1 : type === '3-fase' ? 3 : null;
    // Fasen bepalen zonder stroomsterkte en fasebelasting geen beschikbare netruimte.
    return { type, phases, nominalPower: null, available: null, known: false };
  }

  function connectionNote(grid) {
    return grid.phases === null
      ? 'Netaansluiting onbekend: Sparky stelt het aantal fasen, de hoofdzekering en de werkelijke fasebelasting vast.'
      : `Opgegeven aansluiting: ${grid.phases === 1 ? '1-fase' : '3-fase'}. De hoofdzekering en gelijktijdige belasting zijn nog onbekend; hieruit volgt geen beschikbaar vermogen.`;
  }

  function battery(v) {
    const importKwh = number(v, 'jaarverbruikKwh');
    const hasSolar = choice(v, 'zonnepanelenAanwezig', ['ja', 'nee']) === 'ja';
    // Een verborgen, oude terugleverwaarde telt bij 'nee' niet mee.
    const exportKwh = hasSolar ? number(v, 'terugleveringKwh') : 0;
    const grid = connection(v);
    const dailyImport = importKwh / 365;
    const dailySurplus = exportKwh / 365;
    const etaRoundTrip = .9;
    const etaOneWay = Math.sqrt(etaRoundTrip);
    const depthOfDischarge = .9;
    const capacityMargin = .15;
    // Twee rekenscenario's, geen gemeten verdeling van de netafname over de dag.
    const demandMin = dailyImport * .6;
    const demandMax = dailyImport * .8;
    const deliveredMin = Math.min(dailySurplus * etaRoundTrip, demandMin);
    const deliveredMax = Math.min(dailySurplus * etaRoundTrip, demandMax);
    const nominalMin = deliveredMin / etaOneWay * (1 + capacityMargin) / depthOfDischarge;
    const nominalMax = deliveredMax / etaOneWay * (1 + capacityMargin) / depthOfDischarge;
    const usableMin = nominalMin * depthOfDischarge;
    const usableMax = nominalMax * depthOfDischarge;
    const hasCapacity = nominalMax > 0;
    const details = [
      `Netafname vóór salderen: ${fmt(importKwh, 0)} kWh/jaar. ${hasSolar ? `Teruggeleverde zonnestroom: ${fmt(exportKwh, 0)} kWh/jaar.` : 'Er zijn geen zonnepanelen opgegeven; zonnestroomexport is daarom niet meegerekend.'}`,
      `Daggemiddelden: ${fmt(dailyImport)} kWh netafname en ${fmt(dailySurplus)} kWh zonne-overschot. Jaargegevens laten seizoensverschillen en het werkelijke dagprofiel niet zien.`,
      `Rekenband: 60–80% van de gemiddelde dagelijkse netafname is in dit scenario verschuifbare vraag (${range(demandMin, demandMax)} kWh). Dit is een aanname, geen gemeten avondverbruik of NEN-eis.`,
      'De 60–80%-band is een huishoudelijk vuistregelscenario. Bedrijven, industrie en datacenters vragen een locatiespecifiek verbruiksprofiel voor dimensionering.',
      `Verschoven zonnestroom na verliezen: ${range(deliveredMin, deliveredMax)} kWh op de gemiddelde rekendag, begrensd door vraag en overschot. Dit is geen voorspelling voor elke dag of voor het hele jaar.`,
      `Opslagindicatie: ${range(nominalMin, nominalMax)} kWh nominaal (DC), waarvan ${range(usableMin, usableMax)} kWh binnen de aangenomen ontlaaddiepte. Rekenwaarden: 90% AC→AC-rendement, 90% ontlaaddiepte en 15% capaciteitsmarge; controleer productgegevens.`,
      consumptionNote,
      'Zonder kwartierprofiel en productgegevens wordt geen omvormervermogen, noodreserve, opbrengst uit energiehandel of terugverdientijd berekend.',
      connectionNote(grid), installationNote
    ];
    return advice('thuisbatterij', 'thuisbatterij',
      hasCapacity ? `Circa ${range(nominalMin, nominalMax)} kWh nominale opslag` : 'Geen zonne-opslagcapaciteit uit deze gegevens',
      hasCapacity
        ? 'Een rekenband op basis van jaargemiddelden. Laat verbruik, teruglevering en pieken per kwartier controleren voordat u een batterij kiest.'
        : hasSolar ? 'Zonder zonne-overschot of netafname volgt hier geen opslagbehoefte uit. Een batterij voor andere toepassingen vraagt aanvullende gegevens.'
          : 'Zonder zonnepanelen volgt geen advies voor opslag van eigen zonnestroom. Opslag via het net vraagt een afzonderlijk verbruiks- en tariefprofiel.',
      details, { importKwh, hasSolar, exportKwh, dailyImport, dailySurplus, demandMin, demandMax, deliveredMin, deliveredMax, nominalMin, nominalMax, usableMin, usableMax, etaRoundTrip, etaOneWay, depthOfDischarge, capacityMargin, grid });
  }

  function solar(v) {
    const importKwh = number(v, 'jaarverbruikKwh');
    const direction = choice(v, 'dakrichting', ['oost-west', 'zuid-noord']);
    const grid = connection(v);
    const panelWp = 435;
    const referenceYield = 900;
    // Richtingstabel Milieu Centraal, voorbeeldhellingen 15–45 graden.
    // Zuid/Noord bevat beide uitersten; geen verzonnen 50/50-verdeling.
    const factors = direction === 'oost-west' ? [.75, .85] : [.45, 1];
    const specificYieldMin = referenceYield * factors[0];
    const specificYieldMax = referenceYield * factors[1];
    const minPanels = Math.ceil(importKwh / (panelWp / 1000 * specificYieldMax));
    const maxPanels = Math.ceil(importKwh / (panelWp / 1000 * specificYieldMin));
    const powerKwpMin = minPanels * panelWp / 1000;
    const powerKwpMax = maxPanels * panelWp / 1000;
    const yieldAtMinPanels = powerKwpMin * specificYieldMax;
    const yieldAtMaxPanels = powerKwpMax * specificYieldMin;
    return advice('zonnepanelen', 'zonnepanelen',
      maxPanels > 0 ? `Circa ${range(minPanels, maxPanels, 0)} zonnepanelen` : 'Geen extra jaaropwek gevraagd',
      maxPanels > 0
        ? `Vermogensband: ${range(powerKwpMin, powerKwpMax, 2)} kWp. Het richtpunt is extra jaaropwek ter grootte van uw huidige netafname; dit is geen garantie op minder netafname of zelfvoorziening.`
        : 'Bij 0 kWh netafname volgt geen extra opwekbehoefte uit deze vergelijking. De gewenste installatie vraagt een apart locatieadvies.',
      [
        `Opgegeven netafname vóór salderen: ${fmt(importKwh, 0)} kWh/jaar. Dit is de resterende afname uit het net, niet het totale stroomverbruik als u al zonnepanelen heeft. Bestaande opwek wordt niet nogmaals afgetrokken.`,
        `Voorbeeldpaneel: ${panelWp} Wp. Referentie: ${referenceYield} kWh/kWp per jaar op zuid, met een richtingsband van ${range(factors[0] * 100, factors[1] * 100, 0)}%. Dit zijn rekenaannames voor voorbeeldhellingen van 15–45 graden.`,
        direction === 'oost-west'
          ? 'Oost/West: de rekenband houdt rekening met de verschillende voorbeeldhellingen. De daadwerkelijke plaatsing kan een andere opbrengst geven.'
          : 'Zuid/Noord: de ruime band omvat een zuidvlak én een noordvlak. De verdeling over die vlakken is onbekend; er is geen gelijke verdeling aangenomen.',
        v.get('daktype') === 'plat' ? 'Op een plat dak bepaalt de nog te kiezen paneelopstelling de richting en helling; de gebouwrichting alleen is daarvoor niet voldoende.' : 'De opgegeven dakrichting bepaalt nog niet welk dakvlak wordt benut; dat volgt uit het legplan.',
        `${fmt(minPanels, 0)} panelen bij ${fmt(specificYieldMax, 0)} kWh/kWp leveren circa ${fmt(yieldAtMinPanels, 0)} kWh/jaar; ${fmt(maxPanels, 0)} panelen bij ${fmt(specificYieldMin, 0)} kWh/kWp circa ${fmt(yieldAtMaxPanels, 0)} kWh/jaar. Dit zijn twee afzonderlijke opbrengstscenario’s.`,
        'Dakmaat, schaduw, helling, constructie en plaatsing zijn nog niet vastgesteld. Dit aantal is geen legplan of bevestiging dat de panelen op uw dak passen; een locatieberekening verfijnt de indicatie.',
        consumptionNote, connectionNote(grid), installationNote
      ], { importKwh, direction, panelWp, referenceYield, specificYieldMin, specificYieldMax, minPanels, maxPanels, powerKwpMin, powerKwpMax, yieldAtMinPanels, yieldAtMaxPanels, availableRoof: null, grid });
  }

  function charger(v) {
    const grid = connection(v);
    const distance = number(v, 'afstandMeterkastMeter', true);
    const solarPresent = choice(v, 'zonnepanelenAanwezig', ['ja', 'nee', 'gepland']);
    const bidirectional = choice(v, 'bidirectioneel', ['geen', 'v2h', 'v2g', 'beide'], 'geen');
    const details = [
      connectionNote(grid),
      `Afstand tot de (hoofd)-groepenkast: ${fmt(distance)} meter. De werkelijke kabelroute, aanlegwijze, spanningsverlies, aarding en beveiligingen bepalen de uitvoering. Uit afstand alleen volgt geen kabeldoorsnede.`,
      'Laadvermogen en laadduur worden nog niet berekend: hoofdzekering, gelijktijdige fasebelasting en de gegevens van auto en laadpunt ontbreken. Load balancing moet op de werkelijke aansluiting worden afgestemd.',
      solarPresent === 'nee' ? 'Geen zonnepanelen opgegeven. Het laadadvies veronderstelt geen beschikbare zonnestroom.'
        : solarPresent === 'gepland' ? 'Zonnepanelen zijn gepland. Hun toekomstige opwek is zonder ontwerp en tijdprofiel geen gegarandeerde extra laadruimte.'
          : 'Zonnepanelen zijn aanwezig. Hun opwek is zonder tijdprofiel geen gegarandeerde extra laadruimte.'
    ];
    if (bidirectional !== 'geen') {
      const mode = { v2h: 'V2H: naar de woning', v2g: 'V2G: naar het net', beide: 'V2H én V2G' }[bidirectional];
      details.push(`Gewenst: ${mode}. Auto, lader, energiesturing en netkoppeling moeten deze functie samen ondersteunen. Zonder productgegevens, acculading en laad-/ontlaadprofiel volgt geen dagelijkse energieprognose.`);
      if (bidirectional !== 'v2h') details.push('V2G vraagt bevestiging van de toepasselijke netkoppelingsvoorwaarden, beschikbare terugleverruimte en aanmelding voor de concrete installatie.');
      details.push('V2H bij aanwezig net garandeert geen noodstroom bij netuitval; daarvoor zijn een geschikte systeemfunctie en aanvullende installatievoorzieningen nodig.');
    }
    details.push('Foto’s voor uw aanvraag: een overzicht van de meterkast met de groepenkast en de meter eronder, close-ups van de zichtbare componenten van de groepenkast en de gewenste laadplek. Voeg indien mogelijk foto’s van het kabeltracé toe met de meterkast als herkenbaar referentiepunt. Laat beschermkappen op hun plaats.', installationNote);
    return advice('laadpaal', 'laadpaal',
      bidirectional === 'geen' ? 'Technische opname voor uw laadpunt' : 'Controleer uw bidirectionele laadcombinatie',
      'Uw situatie is vastgelegd. Met deze gegevens kan Sparky de technische vervolgstap bepalen; het beschikbare laadvermogen staat nog niet vast.',
      details, { grid, distance, solarPresent, bidirectional, aggregatePower: null, chargeHoursNeeded: null, known: false });
  }

  function electrical(v) {
    const grid = connection(v);
    return advice('elektrotechniek', 'groepenkast',
      grid.phases === null ? 'Laat uw netaansluiting vaststellen' : 'Laat uw groepenkast beoordelen',
      'Het aantal fasen is een eerste uitgangspunt. Zonder hoofdzekering, belasting en inspectie kan geen uitspraak over geschiktheid of resterende capaciteit worden gedaan.',
      [
        connectionNote(grid),
        grid.phases === 1 ? 'Bij een gewenste driefasenbelasting moet eerst worden vastgesteld of aanpassing van de netaansluiting en groepenkast nodig is.'
          : grid.phases === 3 ? 'Een driefasenaansluiting vraagt nog steeds controle van de belasting op iedere fase en van de bestaande groepenkast.'
            : 'Sparky controleert de aansluitgegevens samen met de uitvoering van de groepenkast.',
        'De technische opname beoordeelt onder meer aarding, beveiligingen, selectiviteit, vrije ruimte, toestand en benodigde metingen. Er worden geen vermogens of groepen afgeleid uit alleen het aantal fasen.',
        'Foto’s voor uw aanvraag: een overzicht van de meterkast met de groepenkast en de meter eronder, close-ups van de zichtbare componenten van de groepenkast en de gewenste installatielocatie. Voeg indien mogelijk foto’s van het kabeltracé toe met de meterkast als herkenbaar referentiepunt. Laat beschermkappen op hun plaats.', installationNote
      ], { grid, capacityKw: null, phaseCurrent: null, known: false });
  }

  return Object.freeze({ battery, solar, charger, electrical, InputError });
}));
