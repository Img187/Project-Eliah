const { test } = require('node:test');
const assert = require('node:assert/strict');
const models = require('../assets/js/calculator-models.js');
const values = (data) => new URLSearchParams(data);
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
const battery = (data = {}) => models.battery(values({ jaarverbruikKwh: 3650, zonnepanelenAanwezig: 'ja', terugleveringKwh: 3650, netaansluiting: '3-fase', ...data }));
const solar = (data = {}) => models.solar(values({ jaarverbruikKwh: 3650, dakrichting: 'oost-west', netaansluiting: '3-fase', ...data }));
const charger = (data = {}) => models.charger(values({ netaansluiting: '3-fase', afstandMeterkastMeter: 12, zonnepanelenAanwezig: 'ja', bidirectioneel: 'geen', ...data }));
const electrical = (data = {}) => models.electrical(values({ netaansluiting: '3-fase', ...data }));

test('battery uses one-way conversion, DoD once and capacity margin without adding energy', () => {
  const m = battery().metrics;
  near(m.dailyImport, 10);
  near(m.dailySurplus, 10);
  near(m.demandMin, 6);
  near(m.demandMax, 8);
  near(m.deliveredMin, 6);
  near(m.deliveredMax, 8);
  near(m.nominalMin, 6 / Math.sqrt(.9) * 1.15 / .9);
  near(m.nominalMax, 8 / Math.sqrt(.9) * 1.15 / .9);
  near(m.usableMin, m.nominalMin * .9);
  near(m.usableMax, m.nominalMax * .9);
  assert.match(battery().details.join(' '), /aanname, geen gemeten avondverbruik of NEN-eis/);
});

test('battery output is bounded by net demand and solar export after round-trip losses', () => {
  for (const importKwh of [0, 1, 2430, 10000, 1000000]) {
    for (const exportKwh of [0, 1, 1000, 10000]) {
      const m = battery({ jaarverbruikKwh: importKwh, terugleveringKwh: exportKwh }).metrics;
      assert.ok(m.deliveredMin <= m.deliveredMax);
      assert.ok(m.nominalMin <= m.nominalMax);
      assert.ok(m.deliveredMax <= importKwh / 365 * .8 + 1e-9);
      assert.ok(m.deliveredMax <= exportKwh / 365 * .9 + 1e-9);
      near(m.nominalMax / 1.15 * .9 * Math.sqrt(.9), m.deliveredMax);
    }
  }
});

test('export-limited battery collapses to one energy bound without a fixed minimum', () => {
  const m = battery({ terugleveringKwh: 365 }).metrics;
  near(m.deliveredMin, .9);
  near(m.deliveredMax, .9);
  near(m.nominalMin, m.nominalMax);
  assert.ok(battery({ jaarverbruikKwh: 1 }).metrics.nominalMax < .01);
  near(battery({ terugleveringKwh: 0 }).metrics.nominalMax, 0);
  near(battery({ jaarverbruikKwh: 0 }).metrics.nominalMax, 0);
});

test('battery needs no PV generation field and export may exceed grid import', () => {
  const m = battery({ jaarverbruikKwh: 1000, terugleveringKwh: 9000 }).metrics;
  near(m.exportKwh, 9000);
  near(m.deliveredMax, 1000 / 365 * .8);
});

test('no panels ignores stale export and never claims a solar storage capacity', () => {
  for (const stale of ['9000', 'not a number', '-10', '1e309']) {
    const result = battery({ zonnepanelenAanwezig: 'nee', terugleveringKwh: stale });
    near(result.metrics.exportKwh, 0);
    near(result.metrics.nominalMax, 0);
    assert.match(result.title, /Geen zonne-opslagcapaciteit/);
    assert.match(result.summary, /Zonder zonnepanelen/);
  }
});

test('checked appliances and backup wishes are context, never extra consumption or reserve', () => {
  const flags = { elektrischeAuto: 'ja', warmtepomp: 'ja', inductie: 'ja', noodstroom: 'ja' };
  assert.deepEqual(battery(), battery(flags));
  assert.deepEqual(solar(), solar(flags));
});

test('removed battery inputs have no hidden effect', () => {
  assert.deepEqual(battery(), battery({ zonneOpwekKwh: 'NaN', extraJaarverbruikKwh: 50000, avondAandeelPct: 0, avondVerbruikKwh: 100, dagOverschotKwh: 200, batterijRendementPct: 1, ontlaaddieptePct: 1, capaciteitsmargePct: 99, noodstroomKw: 99, noodstroomUren: 99, batterijPiekKw: 99 }));
});

test('PV targets extra annual output against grid import, not total demand or old PV output', () => {
  const m = solar().metrics;
  near(m.specificYieldMin, 675);
  near(m.specificYieldMax, 765);
  assert.equal(m.minPanels, 11);
  assert.equal(m.maxPanels, 13);
  near(m.powerKwpMin, 4.785);
  near(m.powerKwpMax, 5.655);
  assert.ok(m.yieldAtMinPanels >= m.importKwh);
  assert.ok(m.yieldAtMaxPanels >= m.importKwh);
  assert.match(solar().details.join(' '), /niet het totale stroomverbruik/);
  assert.deepEqual(solar(), solar({ bestaandePanelen: 24, bestaandeOpwekKwh: 9000, extraJaarverbruikKwh: 5000, dakoppervlakteM2: 1, paneelWp: 1000, opbrengstPerKwp: 1 }));
});

test('Zuid/Noord preserves both orientation extremes without assuming an equal split', () => {
  const result = solar({ dakrichting: 'zuid-noord' });
  const m = result.metrics;
  near(m.specificYieldMin, 405);
  near(m.specificYieldMax, 900);
  assert.equal(m.minPanels, 10);
  assert.equal(m.maxPanels, 21);
  assert.match(result.details.join(' '), /geen gelijke verdeling aangenomen/);
  assert.ok(m.maxPanels > solar().metrics.maxPanels);
});

test('zero PV demand is zero panels and rounding never leaves either scenario short', () => {
  const zero = solar({ jaarverbruikKwh: 0 }).metrics;
  assert.equal(zero.minPanels, 0);
  assert.equal(zero.maxPanels, 0);
  assert.equal(zero.powerKwpMax, 0);
  for (const direction of ['oost-west', 'zuid-noord']) {
    for (const demand of [1, 2430, 4350, 10000, 1000000]) {
      const m = solar({ dakrichting: direction, jaarverbruikKwh: demand }).metrics;
      assert.ok(m.minPanels <= m.maxPanels);
      assert.ok(m.yieldAtMinPanels >= demand);
      assert.ok(m.yieldAtMaxPanels >= demand);
      assert.ok((m.minPanels - 1) * .435 * m.specificYieldMax < demand);
      assert.ok((m.maxPanels - 1) * .435 * m.specificYieldMin < demand);
    }
  }
});

test('unknown roof dimensions cannot produce a fit or guaranteed reduction of net import', () => {
  const result = solar();
  assert.equal(result.metrics.availableRoof, null);
  assert.match(result.details.join(' '), /geen legplan/);
  assert.match(result.summary, /geen garantie op minder netafname of zelfvoorziening/);
});

test('grid choices retain unknown usable power without an invented ampere rating', () => {
  for (const netaansluiting of ['1-fase', '3-fase', 'onbekend']) {
    const phases = netaansluiting === 'onbekend' ? null : netaansluiting === '1-fase' ? 1 : 3;
    for (const model of [battery, solar, charger, electrical]) {
      const grid = model({ netaansluiting }).metrics.grid;
      assert.equal(grid.phases, phases);
      assert.equal(grid.nominalPower, null);
      assert.equal(grid.available, null);
      assert.equal(grid.known, false);
      assert.match(model({ netaansluiting }).details.join(' '), /hoofdzekering/);
    }
  }
});

test('charger stores distance but invents neither drive energy, charge time nor safe power', () => {
  const result = charger({ afstandMeterkastMeter: 47 });
  assert.equal(result.metrics.distance, 47);
  assert.equal(result.metrics.aggregatePower, null);
  assert.equal(result.metrics.chargeHoursNeeded, null);
  assert.equal(result.metrics.known, false);
  assert.match(result.details.join(' '), /47 meter/);
  assert.doesNotMatch(result.details.join(' '), /\d+(?:[,.]\d+)?\s*kWh|\d+(?:[,.]\d+)?\s*kW\b/);
  assert.deepEqual(charger(), charger({ kilometersPerDag: 200, hoofdzekeringA: 25, overigeBelastingKw: 0, aantalLaadpunten: 20, laadUren: 8, autoLaadvermogenKw: 11, laadpuntVermogenKw: 11 }));
});

test('bidirectional choices trigger a technical review without a made-up battery scenario', () => {
  for (const mode of ['v2h', 'v2g', 'beide']) {
    const result = charger({ bidirectioneel: mode });
    assert.equal(result.metrics.bidirectional, mode);
    assert.equal(result.metrics.known, false);
    const text = result.details.join(' ');
    assert.match(text, /Auto, lader, energiesturing en netkoppeling/);
    assert.match(text, /geen dagelijkse energieprognose/);
    assert.match(text, /garandeert geen noodstroom/);
    if (mode !== 'v2h') assert.match(text, /aanmelding/);
    assert.deepEqual(result, charger({ bidirectioneel: mode, autoAccuKwh: 60, aankomstSocPct: 80, reserveSocPct: 30, ontlaadVermogenKw: 3.6, terugleverLimietKw: 11 }));
  }
});

test('charger distinguishes present and planned PV without guaranteed extra capacity', () => {
  for (const presence of ['ja', 'nee', 'gepland']) {
    const result = charger({ zonnepanelenAanwezig: presence });
    assert.equal(result.metrics.solarPresent, presence);
    assert.equal(result.metrics.aggregatePower, null);
  }
  assert.match(charger({ zonnepanelenAanwezig: 'gepland' }).details.join(' '), /Zonnepanelen zijn gepland/);
  assert.match(charger({ zonnepanelenAanwezig: 'nee' }).details.join(' '), /Geen zonnepanelen/);
});

test('electrical is a review request from phases alone, never a passed capacity test', () => {
  const result = electrical();
  assert.equal(result.metrics.capacityKw, null);
  assert.equal(result.metrics.phaseCurrent, null);
  assert.equal(result.metrics.known, false);
  assert.match(result.summary, /geen uitspraak over geschiktheid/);
  assert.deepEqual(result, electrical({ aansluitvermogenKw: 99, hoofdzekeringA: 25, overigeBelastingKw: 3, gelijktijdigheidPct: 50, belastingFasen: 1, werkzaamheden: 'inductie' }));
});

test('all calculators distinguish NEN scopes and do not claim certification', () => {
  for (const model of [battery, solar, charger, electrical]) {
    const text = model().details.join(' ');
    assert.match(text, /Ontwerp, aanleg en verificatie.*NEN 1010/);
    assert.match(text, /veilige bedrijfsvoering.*NEN 3140/);
    assert.match(text, /geen keuring of bewijs van geschiktheid/);
  }
});

test('bad and missing numeric inputs fail with field-specific errors before NaN or Infinity', () => {
  for (const invalid of ['', ' ', '-1', 'NaN', 'Infinity', '1e309', '1e308', '0x20', '1,5']) {
    assert.throws(() => battery({ jaarverbruikKwh: invalid }), { name: 'InputError', field: 'jaarverbruikKwh' });
    assert.throws(() => solar({ jaarverbruikKwh: invalid }), { name: 'InputError', field: 'jaarverbruikKwh' });
    assert.throws(() => charger({ afstandMeterkastMeter: invalid }), { name: 'InputError', field: 'afstandMeterkastMeter' });
  }
  assert.throws(() => battery({ terugleveringKwh: '' }), { field: 'terugleveringKwh' });
  assert.throws(() => charger({ afstandMeterkastMeter: 0 }), { field: 'afstandMeterkastMeter' });
  assert.throws(() => models.battery(values({ netaansluiting: '1-fase', zonnepanelenAanwezig: 'nee' })), { field: 'jaarverbruikKwh' });
});

test('invalid grid, roof and presence choices never become silently assumed defaults', () => {
  for (const invalid of ['', 'grootverbruik', 'middenspanning', '4-fase']) {
    for (const model of [battery, solar, charger, electrical]) assert.throws(() => model({ netaansluiting: invalid }), { field: 'netaansluiting' });
  }
  assert.throws(() => battery({ zonnepanelenAanwezig: 'gepland' }), { field: 'zonnepanelenAanwezig' });
  assert.throws(() => solar({ dakrichting: 'zuid' }), { field: 'dakrichting' });
  assert.throws(() => charger({ zonnepanelenAanwezig: '' }), { field: 'zonnepanelenAanwezig' });
  assert.throws(() => charger({ bidirectioneel: 'v2l' }), { field: 'bidirectioneel' });
});

test('large accepted inputs remain finite and no artificial cap limits the panel count', () => {
  const finiteTree = (value) => {
    if (typeof value === 'number') assert.ok(Number.isFinite(value));
    if (value && typeof value === 'object') Object.values(value).forEach(finiteTree);
  };
  for (const model of [battery, solar]) {
    const result = model({ jaarverbruikKwh: Number.MAX_SAFE_INTEGER, terugleveringKwh: Number.MAX_SAFE_INTEGER });
    finiteTree(result.metrics);
    assert.doesNotMatch(JSON.stringify(result), /NaN|Infinity/);
  }
  assert.ok(solar({ jaarverbruikKwh: 1000000 }).metrics.maxPanels > 1000);
});
