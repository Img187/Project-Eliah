const { test } = require('node:test');
const assert = require('node:assert/strict');
const models = require('../assets/js/calculator-models.js');
const values = (data) => new URLSearchParams(data);
const near = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
const battery = (data = {}) => models.battery(values({ jaarverbruikKwh: 3650, zonneOpwekKwh: 4000, terugleveringKwh: 2000, ...data }));
const charger = (data = {}) => models.charger(values({ netaansluiting: '3-fase', hoofdzekeringA: 25, overigeBelastingKw: 0, kilometersPerDag: 55, ...data }));
const electrical = (data = {}) => models.electrical(values({ netaansluiting: '3-fase', hoofdzekeringA: 25, overigeBelastingKw: 3, aansluitvermogenKw: 11, ...data }));

test('Excel case: one-way losses, DoD once, 15% design margin; no forced 0.5C inverter', () => {
  const m = battery({ jaarverbruikKwh: 12000, zonneOpwekKwh: 10920, terugleveringKwh: 9000, extraJaarverbruikKwh: 5000, dagOverschotKwh: 60, batterijPiekKw: 13.095 }).metrics;
  near(m.night, 17000 / 365 * .8);
  near(m.nominal, 50.18571547948599);
  near(m.delivered, m.night);
  near(m.inverterFloor, 13.095);
  assert.ok(m.delivered <= 60 * .9);
});
test('battery zero surplus/zero night/tiny demand: no fixed 5 kWh minimum or checkbox additions', () => {
  near(battery({ terugleveringKwh: 0 }).metrics.nominal, 0);
  near(battery({ avondAandeelPct: 0 }).metrics.nominal, 0);
  assert.ok(battery({ jaarverbruikKwh: 1 }).metrics.nominal < .01);
  assert.deepEqual(battery().metrics, battery({ elektrischeAuto: 'ja', warmtepomp: 'ja' }).metrics);
});
test('backup is separate energy reserve, not daily solar output', () => {
  const b = battery().metrics;
  const m = battery({ noodstroom: 'ja', noodstroomKw: 2, noodstroomUren: 5 }).metrics;
  near(m.delivered, b.delivered);
  near(m.reserveDc, 10 / Math.sqrt(.9));
  near(m.nominal - b.nominal, m.reserveDc * 1.15 / .9);
  near(battery({ noodstroomKw: 100, noodstroomUren: 100 }).metrics.nominal, b.nominal);
});
test('inconsistent battery export and impossible day windows are rejected', () => {
  assert.throws(() => battery({ terugleveringKwh: 5000 }), { field: 'terugleveringKwh' });
  assert.throws(() => battery({ dagOverschotKwh: 5000 }), { field: 'dagOverschotKwh' });
  assert.throws(() => battery({ batterijLaadUren: 20, batterijOntlaadUren: 8 }), { field: 'batterijOntlaadUren' });
});
test('PV roof regression: a 5 m² roof never yields a 3-panel recommendation', () => {
  const result = models.solar(values({ jaarverbruikKwh: 760, dakoppervlakteM2: 5, dakrichting: 'zuid' }));
  assert.equal(result.metrics.panels, 2);
  assert.equal(result.metrics.availableRoof, 2);
  assert.match(result.title, /2 zonnepanelen/);
});
test('PV measured yield overrides direction; existing output and footprint counted exactly once', () => {
  const result = models.solar(values({ jaarverbruikKwh: 5000, extraJaarverbruikKwh: 1000, bestaandePanelen: 10, bestaandeOpwekKwh: 3000, dakrichting: 'noord', opbrengstPerKwp: 1000, paneelWp: 500, dakoppervlakteM2: 30, bestaandDakgebruikM2: 20, ruimtePerPaneelM2: 2 })).metrics;
  assert.equal(result.requiredPanels, 6);
  assert.equal(result.panels, 5);
  assert.equal(result.yieldKwh, 2500);
  assert.equal(result.specificYield, 1000);
  assert.equal(result.roofLimited, true);
});
test('PV unknown/full roof and already covered demand', () => {
  assert.equal(models.solar(values({ jaarverbruikKwh: 10000, dakoppervlakteM2: 'onbekend' })).metrics.availableRoof, null);
  assert.equal(models.solar(values({ jaarverbruikKwh: 10000, dakoppervlakteM2: 5, bestaandePanelen: 3 })).metrics.panels, 0);
  assert.equal(models.solar(values({ jaarverbruikKwh: 3000, bestaandeOpwekKwh: 4000 })).metrics.panels, 0);
  assert.ok(models.solar(values({ jaarverbruikKwh: 1e8, dakoppervlakteM2: 'meer-dan-1000', dakoppervlakteExtraM2: 100000 })).metrics.panels > 1000);
});
test('charger totals: total km are not multiplied by number of points, losses are included', () => {
  near(charger().metrics.driveDc, 11);
  near(charger().metrics.driveAc, 11 / .9);
  near(charger({ aantalLaadpunten: 4 }).metrics.driveDc, 11);
  near(charger({ kilometersPerDag: 0 }).metrics.driveAc, 0);
});
test('1-phase car is limited to one main fuse on a 3-phase service', () => {
  const hardware = { laadtechniek: 'ac-1', autoLaadvermogenKw: 11, laadpuntVermogenKw: 11 };
  const m = charger(hardware).metrics;
  near(m.aggregatePower, 5.75);
  near(charger({ ...hardware, aantalLaadpunten: 2 }).metrics.aggregatePower, 11.5);
  near(charger({ ...hardware, aantalLaadpunten: 3 }).metrics.aggregatePower, 17.25);
});
test('simple forms work without technical settings, including a 1-phase connection', () => {
  const m = charger({ netaansluiting: '1-fase' }).metrics;
  near(m.aggregatePower, 3.7);
  near(m.minimumPower, 1.38);
  const e = electrical({ netaansluiting: '1-fase', overigeBelastingKw: 1, aansluitvermogenKw: 1 }).metrics;
  assert.equal(e.mismatch, false);
  near(e.phaseCurrent, 2000 / 230);
});
test('AC minimum current is respected, including per-phase count and equipment limit', () => {
  near(charger({ overigeBelastingKw: 14 }).metrics.aggregatePower, 0);
  near(charger({ netaansluiting: '1-fase', laadtechniek: 'ac-3' }).metrics.aggregatePower, 0);
  const m = charger({ hoofdzekeringA: 15, laadtechniek: 'ac-1', aantalLaadpunten: 7 }).metrics;
  assert.equal(m.activePoints, 6);
  near(m.aggregatePower, 10.35);
  near(charger({ laadtechniek: 'ac-1', autoLaadvermogenKw: 1 }).metrics.aggregatePower, 0);
});
test('unknown service/current/other load does not yield a made-up available power', () => {
  for (const data of [{ hoofdzekeringA: '' }, { overigeBelastingKw: '' }, { netaansluiting: 'onbekend' }, { netaansluiting: 'middenspanning' }]) {
    const m = charger(data).metrics;
    assert.equal(m.aggregatePower, null);
    assert.equal(m.chargeHoursNeeded, null);
    assert.equal(m.enoughTime, false);
  }
});
test('DC charging uses its own power limits and conversion, not the AC minimum', () => {
  const m = charger({ laadtechniek: 'dc', autoLaadvermogenKw: 9, laadpuntVermogenKw: 20 }).metrics;
  near(m.hardwarePower, 10);
  near(m.aggregatePower, 10);
  assert.equal(m.minimumPower, 0);
});
test('V2H and V2G share one battery, time window and round-trip refill budget', () => {
  const m = charger({ bidirectioneel: 'beide', terugleverLimietKw: 3.6 }).metrics;
  const b = m.bidirectional;
  near(b.availableDc, 30);
  near(b.homeAc, 8);
  near(b.exportAc, 6.4);
  near(b.refillAc, 14.4 / .81);
  assert.ok(b.deliveredAc <= b.availableDc * .9);
  assert.ok(m.driveAc + b.refillAc <= m.dailyChargeCapacity);
});
test('V2 modes, zero/reserved SOC, missing/zero export allowance', () => {
  assert.equal(charger().metrics.bidirectional, null);
  assert.equal(charger({ bidirectioneel: 'v2h' }).metrics.bidirectional.exportAc, 0);
  assert.equal(charger({ bidirectioneel: 'v2g', terugleverLimietKw: 5 }).metrics.bidirectional.homeAc, 0);
  for (const data of [{ aankomstSocPct: 20, reserveSocPct: 30 }, { terugleverLimietKw: 0 }, {}]) {
    assert.equal(charger({ bidirectioneel: 'v2g', ...data }).metrics.bidirectional.deliveredAc, 0);
  }
  assert.equal(charger({ bidirectioneel: 'beide', hoofdzekeringA: '' }).metrics.bidirectional.known, false);
});
test('one bidirectional vehicle cannot refill at the whole charging plaza power', () => {
  const m = charger({ hoofdzekeringA: 63, aantalLaadpunten: 2, kilometersPerDag: 0, laadUren: 1, bidirectioneel: 'v2g', ontlaadVermogenKw: 11, terugleverLimietKw: 11 }).metrics;
  near(m.aggregatePower, 22);
  near(m.bidirectional.refillAc, 11);
  near(m.bidirectional.exportAc, 8.91);
});
test('V2G is bounded by its own inverter phases, not the entire 3-phase supply', () => {
  const b = charger({ kilometersPerDag: 0, bidirectioneel: 'v2g', ontlaadFasen: '1', ontlaadVermogenKw: 11, terugleverLimietKw: 11 }).metrics.bidirectional;
  near(b.exportPower, 5.75);
});
test('daily bidirectional scenario cannot charge above 100% or use an impossible window', () => {
  const b = charger({ kilometersPerDag: 200, bidirectioneel: 'beide', terugleverLimietKw: 3 }).metrics.bidirectional;
  assert.equal(b.socFeasible, false);
  assert.equal(b.deliveredAc, 0);
  assert.throws(() => charger({ bidirectioneel: 'beide', laadUren: 22, ontlaadUren: 4 }), { field: 'ontlaadUren' });
  assert.throws(() => charger({ bidirectioneel: 'beide', bidirectioneleKilometers: 100 }), { field: 'bidirectioneleKilometers' });
});
test('electricity demand really affects advice, even below 100 kW', () => {
  assert.equal(electrical().metrics.exceeds, false);
  assert.equal(electrical({ aansluitvermogenKw: 99 }).metrics.exceeds, true);
  assert.equal(electrical({ aansluitvermogenKw: '' }).metrics.known, false);
  assert.equal(electrical({ overigeBelastingKw: '' }).metrics.known, false);
});
test('single-phase new load can overload a phase while total kW remains below the service limit', () => {
  const m = electrical({ aansluitvermogenKw: 7, belastingFasen: '1' }).metrics;
  assert.ok(m.total < m.capacityKw);
  assert.equal(m.exceeds, true);
  near(m.phaseCurrent, 8000 / 230);
});
test('electrical simultaneity/power factor and unsupported grid type', () => {
  const m = electrical({ aansluitvermogenKw: 20, gelijktijdigheidPct: 50, arbeidsfactorPct: 80 }).metrics;
  near(m.total, 13);
  near(m.capacityKw, 13.8);
  assert.equal(electrical({ netaansluiting: 'middenspanning' }).metrics.known, false);
});
test('invalid nonfinite inputs and zero efficiencies are rejected instead of Infinity/NaN output', () => {
  assert.throws(() => charger({ laadRendementPct: 0 }), models.InputError);
  assert.throws(() => charger({ minimumLaadstroomA: 5 }), models.InputError);
  assert.throws(() => battery({ jaarverbruikKwh: 'NaN' }), models.InputError);
  assert.throws(() => charger({ kilometersPerDag: '1e309' }), models.InputError);
});
