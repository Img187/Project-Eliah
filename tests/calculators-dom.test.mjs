import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const script = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const models = await readFile(new URL('../assets/js/calculator-models.js', import.meta.url), 'utf8');
const storageKey = 'sparkyCalculatorAanvraag';
const pages = {
  thuisbatterij: 'thuisbatterij-laten-installeren.html',
  zonnepanelen: 'zonnepanelen.html',
  laadpaal: 'laadpalen.html',
  elektrotechniek: 'meterkast-vervangen.html'
};
const source = Object.fromEntries(await Promise.all([...Object.entries(pages), ['contact', 'contact.html']]
  .map(async ([type, page]) => [type, await readFile(new URL(`../${page}`, import.meta.url), 'utf8')])));

function harness(t, type, advice) {
  const path = type === 'contact' ? `contact.html?calculator=${advice.type}&onderwerp=${advice.topic}` : pages[type];
  const dom = new JSDOM(source[type], {
    url: `https://www.sparkyenergies.com/${path}`,
    runScripts: 'outside-only', pretendToBeVisual: true
  });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.matchMedia = () => Object.assign(new window.EventTarget(), { matches: false });
  window.requestAnimationFrame = () => 1;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.fetch = () => { throw new Error('Deze calculator- en overdrachtstests mogen niets verzenden.'); };
  window.DataTransfer = class {
    constructor() { this.files = []; this.items = { add: file => this.files.push(file) }; }
  };
  window.document.querySelectorAll('[data-formspree-upload]').forEach(upload => {
    let files = [];
    Object.defineProperty(upload, 'files', { get: () => files, set: value => { files = value; } });
  });
  if (advice) window.sessionStorage.setItem(storageKey, JSON.stringify(advice));
  window.eval(models);
  window.eval(script);
  const form = window.document.querySelector('form[data-calculator-type]');
  const output = window.document.querySelector('[data-calculation-output]');
  return {
    window, form, output,
    fill(data) {
      for (const [name, value] of Object.entries(data)) {
        const input = form.elements.namedItem(name);
        assert.ok(input, `Invoer ${name} bestaat`);
        if (input.type === 'checkbox') input.checked = value;
        else input.value = String(value);
        input.dispatchEvent(new window.Event('input', { bubbles: true }));
        input.dispatchEvent(new window.Event('change', { bubbles: true }));
      }
    },
    submit() {
      assert.equal(form.checkValidity(), true, 'Het normale formulier moet geldig zijn');
      form.dispatchEvent(new window.Event('submit', { cancelable: true }));
      const stored = window.sessionStorage.getItem(storageKey);
      assert.ok(stored, 'De berekening levert een contactoverdracht op');
      assert.equal(output.classList.contains('heeftResultaat'), true);
      return JSON.parse(stored);
    }
  };
}

function batteryInput(h, extra = {}) {
  h.fill({ jaarverbruikKwh: 3650, zonnepanelenAanwezig: 'ja', terugleveringKwh: 2000,
    typeLocatie: 'woning', energiecontract: 'vast-variabel', netaansluiting: '3-fase', ...extra });
}

test('alle vier formulieren bevatten uitsluitend de afgesproken invoer en dezelfde fasekeuze', t => {
  const expected = {
    thuisbatterij: ['jaarverbruikKwh', 'zonnepanelenAanwezig', 'terugleveringKwh', 'typeLocatie', 'energiecontract', 'netaansluiting', 'elektrischeAuto', 'warmtepomp', 'inductie', 'noodstroom'],
    zonnepanelen: ['jaarverbruikKwh', 'typeLocatie', 'daktype', 'dakrichting', 'netaansluiting', 'elektrischeAuto', 'warmtepomp', 'inductie'],
    laadpaal: ['afstandMeterkastMeter', 'zonnepanelenAanwezig', 'netaansluiting', 'bidirectioneel'],
    elektrotechniek: ['netaansluiting']
  };
  for (const type of Object.keys(pages)) {
    const h = harness(t, type);
    const fields = [...h.form.querySelectorAll('input[name],select[name],textarea[name]')];
    assert.deepEqual(fields.map(field => field.name).sort(), expected[type].sort(), type);
    const phaseOptions = [...h.form.elements.namedItem('netaansluiting').options]
      .filter(option => option.value).map(option => option.value);
    assert.deepEqual(phaseOptions, ['1-fase', '3-fase', 'onbekend'], type);
    assert.ok(fields.every(field => field.labels?.length), `Elk veld heeft een label: ${type}`);
    assert.equal(h.form.querySelector('input[type="file"]'), null);
    assert.match(h.form.querySelector('.adviesFotoVoorbereiding').textContent, /foto/i);
  }
  const pv = harness(t, 'zonnepanelen');
  assert.deepEqual([...pv.form.elements.namedItem('dakrichting').options].filter(option => option.value)
    .map(option => [option.value, option.textContent.trim()]), [['oost-west', 'Oost/West'], ['zuid-noord', 'Zuid/Noord']]);
  const ev = harness(t, 'laadpaal');
  assert.equal(ev.form.elements.namedItem('afstandMeterkastMeter').labels[0].textContent.trim(), 'Afstand tot de (hoofd)-groepenkast');
});

test('batterij vraagt teruglevering alleen bij zonnepanelen en negeert de oude waarde na nee', t => {
  const h = harness(t, 'thuisbatterij');
  const exported = h.form.elements.namedItem('terugleveringKwh');
  const condition = exported.closest('[data-calculator-condition]');
  assert.equal(condition.hidden, true);
  assert.equal(exported.disabled, true);
  batteryInput(h);
  assert.equal(condition.hidden, false);
  assert.equal(exported.disabled, false);
  assert.equal(exported.required, true);
  const withPv = h.submit();
  assert.ok(withPv.fields.some(([label]) => /teruggelever|teruglevering/i.test(label)));
  h.fill({ zonnepanelenAanwezig: 'nee' });
  assert.equal(condition.hidden, true);
  assert.equal(exported.disabled, true);
  assert.equal(exported.value, '2000');
  assert.equal(new h.window.FormData(h.form).has('terugleveringKwh'), false);
  const withoutPv = h.submit();
  assert.ok(withoutPv.fields.every(([label]) => !/teruggelever|teruglevering/i.test(label)));
  const direct = h.window.SparkyCalculators.battery(new h.window.FormData(h.form));
  assert.deepEqual(withoutPv.metrics, JSON.parse(JSON.stringify(direct.metrics)));
  assert.notDeepEqual(withoutPv.metrics, withPv.metrics);
});

test('een leeg verplicht terugleverveld levert geen resultaat of aanvraag op', t => {
  const h = harness(t, 'thuisbatterij');
  batteryInput(h, { terugleveringKwh: '' });
  assert.equal(h.form.checkValidity(), false);
  h.form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  assert.equal(h.window.sessionStorage.getItem(storageKey), null);
  assert.equal(h.output.classList.contains('heeftResultaat'), false);
});

test('aangevinkte apparaten veranderen de batterij-uitkomst niet en gaan alleen mee als aanvraagcontext', t => {
  const h = harness(t, 'thuisbatterij');
  batteryInput(h);
  const initial = h.submit();
  const initialOutput = h.output.textContent;
  h.fill({ elektrischeAuto: true, warmtepomp: true, inductie: true, noodstroom: true });
  const selected = h.submit();
  assert.deepEqual(selected.metrics, initial.metrics);
  assert.equal(h.output.textContent, initialOutput);
  assert.equal(selected.contextFields.length, 4);
  assert.ok(selected.contextFields.every(([, value]) => value === 'Ja'));
  assert.ok(selected.fields.every(([label]) => !selected.contextFields.some(([context]) => context === label)));

  const contact = harness(t, 'contact', selected);
  const form = contact.window.document.getElementById('contactSectLatenWeBeginnenFormulier');
  const context = form.querySelector('input[name="calculator_situatie"]');
  assert.ok(context);
  for (const [label] of selected.contextFields) assert.ok(context.value.includes(label));
  assert.equal(new contact.window.FormData(form).get('calculator_situatie'), context.value);
  const summary = form.querySelector('input[name="calculator_samenvatting"]').value;
  const description = form.querySelector('textarea').value;
  assert.ok(summary.includes(selected.title));
  for (const [label] of selected.contextFields) {
    assert.equal(summary.includes(`- ${label}: Ja`), false);
    assert.equal(description.includes(`- ${label}: Ja`), false);
  }
  assert.equal(contact.window.document.getElementById('contactSectLatenWeBeginnen').open, true);
  assert.match(form.querySelector('.calculatorOverdrachtMelding').textContent, /foto/i);
  const upload = form.querySelector('[data-formspree-upload]');
  assert.ok(upload);
  assert.equal(upload.required, false);
  assert.equal(upload.multiple, true);
  assert.equal(upload.accept, 'image/jpeg,image/png,image/webp');
  assert.equal(upload.files.length, 0);
});

test('zonnepanelen gebruikt de netafname en twee dakrichtingen zonder verbruik dubbel te tellen', t => {
  const h = harness(t, 'zonnepanelen');
  h.fill({ jaarverbruikKwh: 4500, typeLocatie: 'woning', daktype: 'schuin', dakrichting: 'oost-west', netaansluiting: '1-fase' });
  const before = h.submit();
  const result = h.output.textContent;
  h.fill({ elektrischeAuto: true, warmtepomp: true, inductie: true });
  const after = h.submit();
  assert.deepEqual(after.metrics, before.metrics);
  assert.equal(h.output.textContent, result);
  assert.equal(after.contextFields.length, 3);
  h.fill({ dakrichting: 'zuid-noord' });
  const otherRoof = h.submit();
  assert.notDeepEqual(otherRoof.metrics, before.metrics);
});

test('iedere EV-keuze en onbekende netaansluiting werkt zonder verwijderde technische invoer', t => {
  const h = harness(t, 'laadpaal');
  for (const mode of ['geen', 'v2h', 'v2g', 'beide']) {
    h.fill({ afstandMeterkastMeter: 12, zonnepanelenAanwezig: 'ja', netaansluiting: 'onbekend', bidirectioneel: mode });
    const advice = h.submit();
    assert.equal(advice.type, 'laadpaal');
    assert.ok(advice.fields.some(([label, value]) => label === 'Netaansluiting' && value === 'Weet ik niet'));
    assert.doesNotMatch(h.output.textContent, /\bNaN\b|Infinity/);
    assert.doesNotMatch(h.output.textContent, /\d[\d,.]*\s*kW(?:h)?\b/);
  }
  const electrical = harness(t, 'elektrotechniek');
  for (const type of ['1-fase', '3-fase', 'onbekend']) {
    electrical.fill({ netaansluiting: type });
    const advice = electrical.submit();
    assert.equal(advice.type, 'elektrotechniek');
    assert.doesNotMatch(electrical.output.textContent, /\d[\d,.]*\s*kW(?:h)?\b/);
  }
});

test('een wijziging maakt de vorige indicatie en contactoverdracht ongeldig', t => {
  const h = harness(t, 'thuisbatterij');
  batteryInput(h);
  h.submit();
  h.fill({ jaarverbruikKwh: 4000 });
  assert.equal(h.window.sessionStorage.getItem(storageKey), null);
  assert.equal(h.output.classList.contains('heeftResultaat'), false);
  assert.equal(h.output.querySelector('[data-calculation-contact]').hidden, true);
  assert.equal(h.output.querySelector('[data-result-details]').children.length, 0);
  h.submit();
  const connection = h.form.elements.namedItem('netaansluiting');
  connection.value = 'onbekend';
  connection.dispatchEvent(new h.window.Event('change', { bubbles: true }));
  assert.equal(h.window.sessionStorage.getItem(storageKey), null);
  assert.equal(h.output.querySelector('[data-calculation-contact]').hidden, true);
});

test('formulierreset herstelt voorwaardelijke velden en verwijdert verouderd advies', async t => {
  const h = harness(t, 'thuisbatterij');
  batteryInput(h, { elektrischeAuto: true });
  h.submit();
  h.form.reset();
  await new Promise(resolve => h.window.setTimeout(resolve, 0));
  const exported = h.form.elements.namedItem('terugleveringKwh');
  assert.equal(exported.closest('[data-calculator-condition]').hidden, true);
  assert.equal(exported.disabled, true);
  assert.equal(h.form.elements.namedItem('elektrischeAuto').checked, false);
  assert.equal(h.window.sessionStorage.getItem(storageKey), null);
  assert.equal(h.output.classList.contains('heeftResultaat'), false);
  assert.equal(h.output.querySelector('[data-calculation-contact]').hidden, true);
});

test('oude opgeslagen adviezen brengen verwijderde adres- of vermogensvelden niet terug', t => {
  const stale = { version: 2, savedAt: Date.now(), type: 'elektrotechniek', topic: 'groepenkast',
    title: 'Verouderde aanvraag', summary: 'Oude invoer', details: ['Oud resultaat'],
    fields: [['Postcode', '0000 AA'], ['Huisnummer', '123'], ['Nieuw vermogen', '11 kW']] };
  const h = harness(t, 'contact', stale);
  const form = h.window.document.getElementById('contactSectLatenWeBeginnenFormulier');
  assert.equal(form.querySelector('input[name="calculator_samenvatting"], input[name="calculator_situatie"], .calculatorOverdrachtMelding'), null);
  assert.equal(form.querySelector('textarea').value.includes('Verouderde aanvraag'), false);
});
