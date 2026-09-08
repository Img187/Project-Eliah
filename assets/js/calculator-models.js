/* Indicatieve energie- en vermogensmodellen. Eenheden en bronnen: docs/calculator-rekenmodel.md. */
(function (root, factory) {
  const models = factory();
  if (typeof module === 'object' && module.exports) module.exports = models;
  else root.SparkyCalculators = models;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  class InputError extends Error {
    constructor(field, message) { super(message); this.field = field; }
  }
  const number = (v, key, fallback = null, min = 0, max = Infinity) => {
    const raw = v.get(key);
    if (raw === null || String(raw).trim() === '') return fallback;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new InputError(key, 'Vul een geldig getal binnen de aangegeven grenzen in.');
    }
    return value;
  };
  const positive = (v, key, fallback) => number(v, key, fallback, .000001);
  const fraction = (v, key, fallback) => number(v, key, fallback, 1, 100) / 100;
  const fmt = (value, digits = 1) => value.toLocaleString('nl-NL', { maximumFractionDigits: value > 0 && value < .1 ? Math.max(digits, 4) : digits });
  const kw = (value) => `${fmt(value)} kW`;
  const kwh = (value) => `${fmt(value)} kWh`;
  const advice = (type, topic, title, summary, details, metrics) => ({ type, topic, title, summary, details, metrics, fields: [] });

  function battery(v) {
    const importKwh = number(v, 'jaarverbruikKwh', 0);
    const solar = number(v, 'zonneOpwekKwh', 0);
    const exported = number(v, 'terugleveringKwh', 0);
    if (exported > solar) throw new InputError('terugleveringKwh', 'De teruggeleverde zonnestroom kan niet hoger zijn dan de totale zonne-opwek.');
    const extra = number(v, 'extraJaarverbruikKwh', 0);
    const nightShare = number(v, 'avondAandeelPct', 80, 0, 100) / 100;
    const measuredNight = number(v, 'avondVerbruikKwh');
    const measuredSurplus = number(v, 'dagOverschotKwh');
    if (measuredSurplus !== null && measuredSurplus > solar) throw new InputError('dagOverschotKwh', 'Het zonne-overschot op één dag kan niet groter zijn dan de opgegeven jaaropwek.');
    const night = measuredNight ?? (importKwh + extra) / 365 * nightShare;
    const surplus = measuredSurplus ?? exported / 365;
    const etaRoundTrip = fraction(v, 'batterijRendementPct', 90);
    // With only round-trip data, symmetric one-way efficiencies are an explicit approximation.
    const eta = Math.sqrt(etaRoundTrip);
    const dod = fraction(v, 'ontlaaddieptePct', 90);
    const margin = number(v, 'capaciteitsmargePct', 15, 0, 100) / 100;
    const cycleDc = Math.min(surplus * eta, night / eta);
    const delivered = cycleDc * eta;
    const backup = v.get('noodstroom') === 'ja';
    const backupPower = backup ? number(v, 'noodstroomKw', 0) : 0;
    const backupHours = backup ? number(v, 'noodstroomUren', 0) : 0;
    const reserveDc = backupPower * backupHours / eta;
    const nominal = (cycleDc + reserveDc) * (1 + margin) / dod;
    const chargeHours = positive(v, 'batterijLaadUren', 6);
    const dischargeHours = positive(v, 'batterijOntlaadUren', 8);
    if (chargeHours + dischargeHours > 24) throw new InputError('batterijOntlaadUren', 'Laaduren en ontlaaduren mogen samen niet meer dan 24 uur per rekendag zijn.');
    const chargingPower = cycleDc / eta / chargeHours;
    const dischargingPower = delivered / dischargeHours;
    const peak = number(v, 'batterijPiekKw', 0);
    const inverterFloor = Math.max(chargingPower, dischargingPower, backupPower, peak);
    const details = [
      `Rekendag: ${kwh(night)} avond-/nachtvraag en ${kwh(surplus)} overschot vóór opslagverlies. ${measuredSurplus === null ? 'Het overschot is een jaargemiddelde.' : 'Uw opgegeven dagoverschot vervangt het jaargemiddelde; een zomerdag is niet representatief voor de winter.'}`,
      `Verschuifbare zonnestroom: maximaal ${kwh(delivered)} op deze rekendag. Dit is geen voorspelling voor iedere dag of voor een heel jaar.`,
      `Capaciteit: ${kwh(nominal)} nominaal (DC), waarvan ${kwh(nominal * dod)} binnen de aangenomen ontlaaddiepte. De ${fmt(margin * 100)}% ontwerpruimte is extra capaciteit, geen extra beschikbare zonnestroom.`,
      `Rendement AC→AC: ${fmt(etaRoundTrip * 100)}%; geschat per richting ${fmt(eta * 100)}%. Ontlaaddiepte: ${fmt(dod * 100)}%. Controleer deze waarden bij de fabrikant.`,
      `Vermogensondergrens in dit scenario: ${kw(inverterFloor)} AC (laden gemiddeld ${kw(chargingPower)}, ontladen ${kw(dischargingPower)}). Pieken, laadcurve, C-rate, faseverdeling en netruimte bepalen de echte omvormerkeuze.`,
      extra > 0 ? `Alleen ${kwh(extra)} nieuwe jaarlijkse netafname is toegevoegd. Bestaande auto of warmtepomp wordt niet opnieuw meegeteld.` : 'Apparaatkeuzes voegen geen vaste kWh-toeslagen toe; bestaand verbruik zit al in uw jaarafname.',
      backup ? `Afzonderlijke noodreserve: ${kwh(backupPower * backupHours)} AC voor ${kw(backupPower)} gedurende ${fmt(backupHours)} uur. Deze reserve telt niet mee als dagelijkse zonnestroom. Noodstroom vraagt een daarvoor geschikte installatie.` : 'Dit scenario gaat over verschuiven van zonnestroom; energiehandel en noodstroom worden niet automatisch verondersteld.'
    ];
    return advice('thuisbatterij', 'thuisbatterij', nominal > 0 ? `Circa ${kwh(nominal)} nominale opslag` : 'Geen opslagcapaciteit uit dit profiel',
      nominal > 0 ? 'Een capaciteitsindicatie op basis van uw verbruik en vaste rendementsaannames. Laat het dagprofiel en piekvermogen controleren met meetgegevens.' : 'Er is geen verschuifbaar zonne-overschot of geen avondvraag ingevoerd. Voor opslag via het net is een afzonderlijk tijd- en tariefprofiel nodig.',
      details, { night, surplus, cycleDc, delivered, reserveDc, nominal, usableDc: nominal * dod, chargingPower, dischargingPower, inverterFloor, etaRoundTrip });
  }

  function solar(v) {
    const usage = number(v, 'jaarverbruikKwh', 0);
    const extra = number(v, 'extraJaarverbruikKwh', 0);
    const existingPanels = number(v, 'bestaandePanelen', 0);
    const direction = v.get('dakrichting') || 'onbekend';
    const factors = { zuid: 1, 'oost-west': .85, plat: .9, noord: .65, onbekend: .9 };
    const specifiedYield = positive(v, 'opbrengstPerKwp');
    const specificYield = specifiedYield ?? 875 * (factors[direction] ?? .9);
    const panelWp = positive(v, 'paneelWp', 435);
    const existingWp = positive(v, 'bestaandPaneelWp', 320);
    const measuredExisting = number(v, 'bestaandeOpwekKwh');
    const existingYield = measuredExisting ?? existingPanels * existingWp / 1000 * specificYield;
    const roofChoice = v.get('dakoppervlakteM2');
    const roofArea = roofChoice === 'meer-dan-1000' ? positive(v, 'dakoppervlakteExtraM2') : /^\d+(\.\d+)?$/.test(roofChoice || '') ? Number(roofChoice) : null;
    const areaPerPanel = positive(v, 'ruimtePerPaneelM2', 2);
    const existingArea = number(v, 'bestaandDakgebruikM2') ?? existingPanels * areaPerPanel;
    const availableRoof = roofArea === null ? null : Math.max(0, Math.floor((roofArea - existingArea) / areaPerPanel));
    const demand = usage + extra;
    const remaining = Math.max(0, demand - existingYield);
    const requiredPanels = Math.ceil(remaining / (panelWp / 1000 * specificYield));
    const panels = availableRoof === null ? requiredPanels : Math.min(requiredPanels, availableRoof);
    const powerKwp = panels * panelWp / 1000;
    const yieldKwh = powerKwp * specificYield;
    const roofLimited = panels < requiredPanels;
    return advice('zonnepanelen', 'zonnepanelen', panels > 0 ? `Circa ${fmt(panels, 0)} ${existingPanels > 0 ? 'extra ' : ''}zonnepanelen` : requiredPanels === 0 ? 'Jaarvraag al gedekt in deze berekening' : 'Geen ruimte voor extra panelen ingevoerd',
      roofLimited ? `De jaarvraag vraagt om ${fmt(requiredPanels, 0)} extra panelen; de opgegeven dakruimte begrenst dit tot ${fmt(panels, 0)}. Bekijk extra dakvlak of aanpassing van het legplan.` : `Richtpunt: ${fmt(powerKwp, 2)} kWp nieuw vermogen. Gelijke jaaropwek en jaarvraag betekenen niet dat u op ieder moment zelfvoorzienend bent.`,
      [
        `Huidige totale vraag plus alleen nieuw verbruik: ${kwh(demand)}/jaar. Bestaande opwek: ${kwh(existingYield)}/jaar (${measuredExisting === null ? 'geschat' : 'door u opgegeven'}).`,
        `Nieuwe opwek: circa ${kwh(yieldKwh)}/jaar bij ${fmt(panelWp, 0)} Wp per paneel en ${fmt(specificYield)} kWh/kWp per jaar.`,
        specifiedYield === null ? `Opbrengstaanname: 875 kWh/kWp × richtingsfactor ${fmt(factors[direction] ?? .9, 2)}. Een locatieberekening met PVGIS kan deze schatting nader bepalen.` : 'Uw netto opbrengst per kWp vervangt de richtingsaanname. Oriëntatie, schaduw en systeemverliezen worden niet een tweede keer afgetrokken.',
        roofArea === null ? 'Dakruimte onbekend: het aantal is uitsluitend op de jaarvraag gebaseerd.' : `Dakgrens: ${fmt(roofArea)} m² totaal, ${fmt(existingArea)} m² bestaand beslag en ${fmt(areaPerPanel, 2)} m² per nieuw paneel inclusief benodigde tussenruimte. Maximaal ${fmt(availableRoof, 0)} extra panelen in dit oppervlaktemodel.`,
        'Daktype en richting zijn ook gegevens voor het legplan. Obstakels, schaduw, constructie, kabels en omvormer/netruimte worden tijdens de dakcontrole vastgesteld.'
      ], { demand, existingYield, specificYield, requiredPanels, availableRoof, panels, powerKwp, yieldKwh, roofLimited });
  }

  function connection(v) {
    const type = v.get('netaansluiting');
    const phases = type === '1-fase' ? 1 : type === '3-fase' ? 3 : null;
    const amps = positive(v, 'hoofdzekeringA');
    const otherPower = number(v, 'overigeBelastingKw');
    const nominalPower = phases !== null && amps !== null ? phases * 230 * amps / 1000 : null;
    const available = nominalPower !== null && otherPower !== null ? Math.max(0, nominalPower - otherPower) : null;
    return { type, phases, amps, otherPower, nominalPower, available };
  }

  function charger(v) {
    const grid = connection(v);
    const points = positive(v, 'aantalLaadpunten', 1);
    const kilometers = number(v, 'kilometersPerDag', 0);
    const consumption = positive(v, 'autoVerbruikKwh', 20);
    const etaCharge = fraction(v, 'laadRendementPct', 90);
    const hours = positive(v, 'laadUren', 8);
    const tech = v.get('laadtechniek') || (grid.phases === 1 ? 'ac-1' : 'ac-3');
    const dc = tech === 'dc';
    const chargerPhases = tech === 'ac-1' ? 1 : 3;
    const defaultPower = chargerPhases === 1 ? 3.7 : 11;
    const carPower = positive(v, 'autoLaadvermogenKw', defaultPower);
    const pointPower = positive(v, 'laadpuntVermogenKw', defaultPower);
    const hardwarePower = Math.min(carPower, pointPower) / (dc ? etaCharge : 1);
    const minAmps = number(v, 'minimumLaadstroomA', 6, 6);
    const minimumPower = dc ? 0 : chargerPhases * 230 * minAmps / 1000;
    // An AC 3-phase scenario is not silently switched to 1 phase.
    const phaseMismatch = grid.phases === 1 && chargerPhases === 3;
    const phaseLimit = grid.available === null ? null : grid.available / grid.phases * chargerPhases;
    const perPointPower = phaseMismatch ? 0 : Math.min(hardwarePower, phaseLimit ?? Infinity);
    let activePoints = phaseMismatch || perPointPower < minimumPower ? 0 : Math.min(points,
      grid.available === null || minimumPower === 0 ? points : Math.floor((grid.available + 1e-9) / minimumPower));
    let aggregatePower = grid.available === null ? null : Math.min(grid.available, perPointPower * activePoints);
    if (tech === 'ac-1' && grid.available !== null) {
      const powerPerPhase = grid.available / grid.phases;
      const slotsPerPhase = Math.floor((powerPerPhase + 1e-9) / minimumPower);
      activePoints = hardwarePower < minimumPower ? 0 : Math.min(points, grid.phases * slotsPerPhase);
      aggregatePower = 0;
      for (let phase = 0; phase < grid.phases; phase += 1) {
        const pointsOnPhase = Math.floor(activePoints / grid.phases) + (phase < activePoints % grid.phases ? 1 : 0);
        aggregatePower += Math.min(powerPerPhase, pointsOnPhase * hardwarePower);
      }
    }
    const driveDc = kilometers * consumption / 100;
    const driveAc = driveDc / etaCharge;
    const chargeHoursNeeded = aggregatePower > 0 ? driveAc / aggregatePower : driveAc === 0 ? 0 : null;
    const dailyChargeCapacity = aggregatePower === null ? null : aggregatePower * hours;
    const details = [
      `Rijden: ${kwh(driveDc)} in de accu en circa ${kwh(driveAc)} aan de netzijde per dag bij ${fmt(consumption)} kWh/100 km en ${fmt(etaCharge * 100)}% laadrendement. De kilometers zijn het totaal voor alle voertuigen samen.`,
      `Rekenaanname per punt: ${kw(hardwarePower)} aan de AC-netzijde. ${dc ? 'DC-voertuig- en laadpuntvermogens zijn omgerekend inclusief het aangenomen laadverlies.' : `We rekenen met ${chargerPhases} fase(n) en minimaal ${fmt(minAmps)} A per actieve fase (${kw(minimumPower)} per auto). Controleer het werkelijke laadvermogen van auto en laadpunt.`}`,
      grid.available === null ? 'Netruimte onbekend: vul hoofdzekering én gelijktijdige overige belasting in voor een begrensd laadadvies. Grootverbruik en middenspanning vragen een afzonderlijke vermogensanalyse.' : `Netruimte voor laden: circa ${kw(grid.available)} van ${kw(grid.nominalPower)} totaal. Aangenomen is een evenwichtige faseverdeling; controleer vooral de zwaarst belaste fase.`,
      phaseMismatch ? 'Deze laadtechniek veronderstelt drie fasen. Een ondersteunde eenfasige laadoplossing of beoordeling van de aansluiting is nodig.' : aggregatePower === 0 ? 'Onvoldoende ruimte voor de aangenomen minimale laadstroom: laden moet pauzeren. Fasewisseling kan alleen met geschikte apparatuur.' : aggregatePower !== null ? `Verdeeld laadvermogen: maximaal ${kw(aggregatePower)} over maximaal ${fmt(activePoints, 0)} tegelijk actieve punten, met load balancing. Benodigde laadtijd voor rijden: ${fmt(chargeHoursNeeded)} uur; beschikbaar: ${fmt(hours)} uur.` : 'Zonder bekende netruimte kan de benodigde laadtijd nog niet betrouwbaar worden vastgesteld.'
    ];
    const mode = v.get('bidirectioneel') || 'geen';
    let bidirectional = null;
    if (mode !== 'geen') {
      const dischargeHours = positive(v, 'ontlaadUren', 4);
      if (hours + dischargeHours > 24) throw new InputError('ontlaadUren', 'Laaduren en ontlaaduren zijn afzonderlijke tijdvakken en mogen samen niet meer dan 24 uur zijn.');
      const capacity = positive(v, 'autoAccuKwh', 60);
      const soc = number(v, 'aankomstSocPct', 80, 0, 100);
      const reserve = number(v, 'reserveSocPct', 30, 0, 100);
      const etaDischarge = fraction(v, 'ontlaadRendementPct', 90);
      const dischargePower = positive(v, 'ontlaadVermogenKw', 3.6);
      const exportLimit = number(v, 'terugleverLimietKw');
      const homeDemand = number(v, 'woningVraagKwh', 8);
      const vehicleKm = number(v, 'bidirectioneleKilometers') ?? kilometers / points;
      if (vehicleKm > kilometers) throw new InputError('bidirectioneleKilometers', 'De kilometers van deze auto mogen niet hoger zijn dan het totaal voor alle voertuigen.');
      const vehicleDriveDc = vehicleKm * consumption / 100;
      const vehicleDriveAc = vehicleDriveDc / etaCharge;
      const departureSoc = soc + vehicleDriveDc / capacity * 100;
      const socFeasible = departureSoc <= 100 + 1e-9;
      const dischargePhases = v.get('ontlaadFasen') === '1' ? 1 : 3;
      const dischargePhaseMismatch = grid.phases === 1 && dischargePhases === 3;
      const availableDc = capacity * Math.max(0, soc - reserve) / 100;
      const physicalAc = Math.min(availableDc * etaDischarge, dischargePower * dischargeHours);
      // A daily repeatable scenario must also have time to replace both driving and discharged energy.
      // The bidirectional vehicle cannot refill at the combined power of the entire charging plaza.
      const refillHeadroom = dailyChargeCapacity === null ? null : Math.max(0, Math.min(
        dailyChargeCapacity - driveAc, Math.min(perPointPower, aggregatePower) * hours - vehicleDriveAc));
      const dailyBudget = refillHeadroom === null || !socFeasible || dischargePhaseMismatch ? 0 : Math.min(physicalAc, refillHeadroom * etaCharge * etaDischarge);
      const homeAc = mode === 'v2g' ? 0 : Math.min(dailyBudget, homeDemand);
      const remainingHours = Math.max(0, dischargeHours - homeAc / dischargePower);
      const exportConnectionCap = grid.nominalPower === null ? 0 : grid.nominalPower / grid.phases * Math.min(grid.phases, dischargePhases);
      const exportPower = dischargePhaseMismatch ? 0 : Math.min(dischargePower, exportLimit ?? 0, exportConnectionCap);
      const exportAc = mode === 'v2h' ? 0 : Math.min(Math.max(0, dailyBudget - homeAc), exportPower * remainingHours);
      const deliveredAc = homeAc + exportAc;
      const refillAc = deliveredAc / (etaCharge * etaDischarge);
      bidirectional = { availableDc, physicalAc, homeAc, exportAc, deliveredAc, refillAc, dailyBudget, exportPower, vehicleDriveAc, departureSoc, socFeasible, known: refillHeadroom !== null };
      details.push(`Bidirectioneel scenario voor één auto: ${kwh(availableDc)} DC boven de rijreserve (${fmt(soc)}% bij aankomst, minimaal ${fmt(reserve)}%). De rijreserve wordt niet nogmaals van de accu afgetrokken.`);
      details.push(`Rijvraag van deze auto: ${fmt(vehicleKm)} km/dag (${v.get('bidirectioneleKilometers') ? 'ingevuld' : 'totaal gelijk verdeeld over de laadpunten'}). Het dagelijkse scenario veronderstelt rijden buiten het laadvenster, zonder tussentijds laden elders.`);
      if (!socFeasible) details.push('De rijvraag past niet bij de opgegeven aankomstlading: volledig bijladen zou meer dan 100% accu vragen. Pas de aankomstlading/rijvraag aan; het dagelijkse bidirectionele scenario is daarom 0 kWh.');
      if (dischargePhaseMismatch) details.push('De gekozen bidirectionele omvormer veronderstelt drie fasen, terwijl één fase is opgegeven. Het dagelijkse ontlaadscenario is daarom 0 kWh.');
      details.push(refillHeadroom === null ? `Eenmalige technische energiegrens: ${kwh(physicalAc)} AC bij ${kw(dischargePower)} gedurende ${fmt(dischargeHours)} uur. Een dagelijks V2H/V2G-profiel wordt pas berekend zodra de netruimte voor bijladen bekend is.` : `Binnen accu, tijd en beschikbare bijlaadruimte: V2H ${kwh(homeAc)}, V2G ${kwh(exportAc)} per rekendag. Bij beide functies krijgt de woning voorrang; ze delen dezelfde accu en hetzelfde ontlaadvenster.`);
      if (mode !== 'v2h' && exportLimit === null) details.push('V2G nog niet doorgerekend: vul de voor deze auto beschikbare en toegestane terugleverruimte in, na andere opwek. Onbekend wordt niet als onbeperkt behandeld.');
      if (refillHeadroom !== null) details.push(`Aanvullend bijladen na V2H/V2G: ${kwh(refillAc)} aan de netzijde, boven op ${kwh(driveAc)} voor al het rijden. Totaal nodig: ${kwh(driveAc + refillAc)}; de laadcapaciteit in ${fmt(hours)} uur is ${kwh(dailyChargeCapacity)}.`);
      details.push('Dit is een technisch scenario, geen bevestiging van productcompatibiliteit. Auto, bidirectionele lader, energiesturing en netaansluiting moeten deze functie samen ondersteunen; V2G vraagt ook toegestane netkoppeling en aanmelding. V2H garandeert geen noodstroom bij netuitval.');
    }
    const functions = [v.get('zakelijkVerrekenen') === 'ja' && 'zakelijke verrekening', v.get('slimLaden') === 'ja' && 'sturing op zon of dynamische tarieven'].filter(Boolean);
    if (functions.length) details.push(`Gewenste functies: ${functions.join(' en ')}. Ze vragen geschikte apparatuur en instellingen; tariefvoordeel is niet in deze energieberekening opgenomen.`);
    if (['ja', 'gepland'].includes(v.get('zonnepanelenAanwezig'))) details.push('Zonnestroom kan een deel van het laden leveren, maar is zonder tijdprofiel niet als gegarandeerde extra laadruimte bijgeteld.');
    details.push(`Kabelafstand: ${fmt(number(v, 'afstandMeterkastMeter', 0))} m. Kabeldoorsnede, spanningsverlies, beveiliging en fasebelasting worden bij de installatiecontrole bepaald.`);
    const enoughTime = dailyChargeCapacity !== null && driveAc <= dailyChargeCapacity + 1e-9;
    return advice('laadpaal', 'laadpaal', aggregatePower === null ? 'Vul de beschikbare netruimte aan' : aggregatePower === 0 ? 'Laden vraagt meer beschikbare ruimte' : `Tot ${kw(aggregatePower)} verdeeld laadvermogen`,
      aggregatePower === null ? 'Uw energiebehoefte is berekend; voor het haalbare vermogen ontbreken nog aansluitgegevens.' : enoughTime ? 'De dagelijkse rijvraag past energetisch binnen het opgegeven laadvenster en de aangenomen faseverdeling.' : 'De dagelijkse rijvraag past niet binnen dit laadvenster. Meer beschikbare laaduren, vermogensruimte of een ander laadschema is nodig.',
      details, { grid, hardwarePower, minimumPower, aggregatePower, activePoints, driveDc, driveAc, chargeHoursNeeded, dailyChargeCapacity, enoughTime, bidirectional });
  }

  function electrical(v) {
    const grid = connection(v);
    const requested = number(v, 'aansluitvermogenKw');
    const factor = fraction(v, 'gelijktijdigheidPct', 100);
    const pf = fraction(v, 'arbeidsfactorPct', 100);
    const newLoadPhases = v.get('belastingFasen') ? (v.get('belastingFasen') === '1' ? 1 : 3) : (grid.phases || 3);
    const additional = requested === null ? null : requested * factor;
    const total = additional === null || grid.otherPower === null ? null : grid.otherPower + additional;
    // One stated power factor is a scenario for all loads; detailed mixed-load analysis remains necessary.
    const capacityKw = grid.nominalPower === null ? null : grid.nominalPower * pf;
    const phaseCurrent = total === null || grid.phases === null ? null :
      grid.otherPower * 1000 / (grid.phases * 230 * pf) + additional * 1000 / (Math.min(newLoadPhases, grid.phases) * 230 * pf);
    const exceeds = capacityKw !== null && total !== null && (total > capacityKw + 1e-9 || phaseCurrent > grid.amps + 1e-9);
    const mismatch = grid.phases === 1 && newLoadPhases === 3 && additional > 0;
    const work = v.getAll('werkzaamheden');
    const industrial = ['grootverbruik', 'middenspanning'].includes(grid.type) || ['industrie', 'datacenter'].includes(v.get('typeLocatie'));
    const known = capacityKw !== null && total !== null;
    return advice('elektrotechniek', 'groepenkast', mismatch ? 'Een driefasenbelasting vraagt een passende aansluiting' : exceeds ? 'Gevraagde belasting overschrijdt de aansluiting' : !known ? 'Aansluitgegevens aanvullen voor vermogenscontrole' : 'Vermogensindicatie voor uw uitbreiding',
      mismatch || exceeds ? 'Beoordeel vermogenssturing, spreiding over fasen of aanpassing van de aansluiting voordat deze uitbreiding wordt gekozen.' : known ? 'De berekende belasting blijft binnen de opgegeven stroomgrens onder deze aannames. De technische opname bepaalt of de installatie hiervoor geschikt is.' : 'Werkzaamheden zijn vastgelegd. Zonder stroomsterkte en gelijktijdige belasting volgt nog geen uitspraak over beschikbare ruimte.',
      [
        additional === null ? 'Nieuw vermogen is nog onbekend; de geselecteerde apparaten krijgen geen verzonnen vaste vermogenswaarde.' : `Nieuw vermogen: ${kw(requested)} × ${fmt(factor * 100)}% gelijktijdigheid = ${kw(additional)}. Bestaande belasting wordt afzonderlijk meegenomen.`,
        total === null ? 'Vul ook de bestaande gelijktijdige belasting in (0 alleen als er echt geen overige belasting is).' : `Totaal in dit scenario: ${kw(total)} bij arbeidsfactor ${fmt(pf, 2)}.`,
        capacityKw === null ? industrial ? 'Grootverbruik/middenspanning: onderzoek contractvermogen, transformator, verdelers en kwartierwaarden op locatie.' : 'Hoofdzekering en aantal fasen zijn nodig voor een capaciteitsvergelijking.' : `Nominale aansluitruimte: circa ${kw(capacityKw)} bij ${grid.phases} × ${fmt(grid.amps)} A en 230 V per fase.`,
        phaseCurrent === null ? 'Fasebelasting wordt vastgesteld tijdens de opname.' : `Fasestroom in dit model: circa ${fmt(phaseCurrent)} A; grens ${grid.amps === null ? 'onbekend' : `${fmt(grid.amps)} A`}. Bestaande belasting is gelijk verdeeld aangenomen, nieuwe belasting over ${Math.min(newLoadPhases, grid.phases)} fase(n). De werkelijke faseverdeling moet worden gecontroleerd.`,
        `${work.length} werkzaamheid/werkzaamheden geselecteerd. Leeftijd, vrije ruimte, aarding, beveiliging, selectiviteit en metingen blijven onderdeel van de opname.`,
        'Dit is een belastingberekening, geen NEN-keuring of kabel-/beveiligingsontwerp. NEN 1010 betreft de installatie; NEN 3140 de veilige bedrijfsvoering.'
      ], { grid, additional, total, capacityKw, phaseCurrent, exceeds, mismatch, known });
  }
  return Object.freeze({ battery, solar, charger, electrical, InputError });
}));
