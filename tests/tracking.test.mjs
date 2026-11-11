import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const consent = await readFile(new URL('../assets/js/cookie-consent.js', import.meta.url), 'utf8');
const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const thankYou = await readFile(new URL('../assets/js/bedankt.js', import.meta.url), 'utf8');
const network = await readFile(new URL('../assets/js/network.js', import.meta.url), 'utf8');
const models = await readFile(new URL('../assets/js/calculator-models.js', import.meta.url), 'utf8');
const contactHtml = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
const calculatorHtml = await readFile(new URL('../laadpalen.html', import.meta.url), 'utf8');
const minimalHtml = '<!doctype html><html><head></head><body><main>Website</main><footer><ul class="footerNavigatieLijst"></ul></footer></body></html>';
const storageKey = 'sparky-cookie-toestemming';
const requestStorageKey = 'sparkyGeslaagdeAanvraag';
const settle = async () => { for (let index = 0; index < 5; index++) await new Promise(resolve => setImmediate(resolve)); };

function harness(t, { html = minimalHtml, choice, runMain = false, fetchImpl, url = 'https://www.sparkyenergies.com/contact.html?private=do-not-track#private', advice, requestMarker } = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  const idleCallbacks = [];
  const navigations = [];
  window.requestIdleCallback = callback => { idleCallbacks.push(callback); return idleCallbacks.length; };
  window.matchMedia = () => Object.assign(new window.EventTarget(), { matches: false });
  window.requestAnimationFrame = () => 1;
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.TextDecoder = TextDecoder;
  window.AbortController = AbortController;
  window.fetch = fetchImpl || (() => { throw new Error('Geen netwerk verwacht.'); });
  if (choice) window.localStorage.setItem(storageKey, choice);
  if (advice) window.sessionStorage.setItem('sparkyCalculatorAanvraag', JSON.stringify(advice));
  if (requestMarker !== undefined) window.sessionStorage.setItem(requestStorageKey, requestMarker);
  if (runMain) {
    window.DataTransfer = class {
      constructor() { this.files = []; this.items = { add: file => this.files.push(file) }; }
    };
    window.document.querySelectorAll('[data-formspree-upload]').forEach(upload => {
      let files = [];
      Object.defineProperty(upload, 'files', { get: () => files, set: value => { files = value; } });
    });
  }
  window.eval(consent);
  if (runMain) {
    window.eval(network);
    window.eval(models);
    // Keep jsdom's real location for tracking; intercept navigation only in main.js.
    const runtimeWindow = Object.create(window);
    const location = new URL(url);
    Object.defineProperties(runtimeWindow, {
      location: { value: { href: location.href, pathname: location.pathname, origin: location.origin, search: location.search, hash: location.hash, assign: path => navigations.push(path) } },
      addEventListener: { value: window.addEventListener.bind(window) }
    });
    new window.Function('window', main)(runtimeWindow);
  }
  window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return {
    window,
    navigations,
    visitThankYou() { window.eval(thankYou); },
    choose(value) {
      window.document.getElementById(value === 'volledig' ? 'cookieToestemmingVolledig' : 'cookieToestemmingWeigeren').click();
    },
    flushIdle() { while (idleCallbacks.length) idleCallbacks.shift()(); },
    events(name) { return JSON.parse(JSON.stringify(window.dataLayer.filter(entry => entry.event && (!name || entry.event === name)))); },
    clickLink(href, id = 'testContactLink') {
      const link = window.document.createElement('a');
      link.id = id;
      link.href = href;
      const icon = window.document.createElement('span');
      icon.textContent = 'Neem contact op';
      link.appendChild(icon);
      window.document.body.appendChild(link);
      link.addEventListener('click', event => event.preventDefault());
      icon.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
      return link;
    }
  };
}

test('zonder toestemming en na weigering worden geen Google-scripts of meetevents geladen', t => {
  const h = harness(t);
  assert.equal(h.window.dataLayer[0][0], 'consent');
  assert.equal(h.window.dataLayer[0][1], 'default');
  assert.equal(h.window.dataLayer[0][2].analytics_storage, 'denied');
  assert.equal(h.window.SparkyTracking.track('generate_lead', { form_id: 'testForm' }), false);
  h.clickLink('tel:+31000000000');
  h.choose('functioneel');
  h.clickLink('mailto:synthetic@example.com');
  h.flushIdle();
  assert.equal(h.window.document.querySelectorAll('script').length, 0);
  assert.deepEqual(h.events(), []);
});

test('na volledige toestemming laadt één GTM-container met toestemming vóór de start', t => {
  const h = harness(t);
  h.choose('volledig');
  h.choose('volledig');
  h.flushIdle();
  h.choose('volledig');
  h.flushIdle();
  const scripts = [...h.window.document.querySelectorAll('script')];
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-WLFHDLMC');
  assert.equal(scripts[0].async, true);
  assert.equal(h.events('gtm.js').length, 1);
  assert.equal(typeof h.events('gtm.js')[0]['gtm.start'], 'number');
  const commands = h.window.dataLayer.filter(entry => !entry.event);
  assert.equal(commands.filter(entry => entry[0] === 'js').length, 1);
  assert.equal(commands.some(entry => entry[0] === 'config'), false);
  const startIndex = h.window.dataLayer.findIndex(entry => entry.event === 'gtm.js');
  assert.ok(h.window.dataLayer.slice(0, startIndex).some(entry => entry[0] === 'consent' && entry[1] === 'update' && entry[2].analytics_storage === 'granted'));
});

test('intrekken blokkeert events, wist Analytics-cookies en hervatten laadt GTM niet dubbel', t => {
  const h = harness(t, { choice: 'volledig' });
  h.flushIdle();
  h.window.document.cookie = '_ga=synthetic; Path=/';
  h.choose('functioneel');
  assert.equal(h.window['ga-disable-G-87KMB19788'], true);
  assert.doesNotMatch(h.window.document.cookie, /_ga=/);
  assert.equal(h.window.SparkyTracking.track('generate_lead', { form_id: 'testForm' }), false);
  h.clickLink('https://wa.me/31000000000');
  assert.deepEqual(h.events('contact_click'), []);
  h.choose('volledig');
  h.flushIdle();
  assert.equal(h.window['ga-disable-G-87KMB19788'], false);
  assert.equal(h.window.document.querySelectorAll('script').length, 1);
  assert.equal(h.events('gtm.js').length, 1);
  h.clickLink('tel:+31000000000');
  assert.equal(h.events('contact_click').length, 1);
});

test('intrekken tijdens de wachttijd voorkomt het laden van GTM', t => {
  const h = harness(t);
  h.choose('volledig');
  h.choose('functioneel');
  h.flushIdle();
  assert.equal(h.window.document.querySelectorAll('script').length, 0);
  assert.deepEqual(h.events(), []);
});

test('cookiekeuze uit een andere tab werkt door zonder opslag terug te schrijven', t => {
  const html = minimalHtml.replace('<main>Website</main>', '<main>Website<iframe data-cookie-src="https://www.google.com/maps/embed?synthetic"></iframe></main>');
  const h = harness(t, { html, choice: 'volledig' });
  h.flushIdle();
  const { window } = h;
  const frame = window.document.querySelector('iframe');
  const layer = window.document.getElementById('cookieToestemmingLaag');
  const storagePrototype = Object.getPrototypeOf(window.localStorage);
  const originalSetItem = storagePrototype.setItem;
  let writes = 0;
  storagePrototype.setItem = function (...args) { writes++; return originalSetItem.apply(this, args); };
  const receive = value => {
    const oldValue = window.localStorage.getItem(storageKey);
    originalSetItem.call(window.localStorage, storageKey, value);
    window.dispatchEvent(new window.StorageEvent('storage', { key: storageKey, oldValue, newValue: value, storageArea: window.localStorage }));
  };

  window.document.cookie = '_ga=synthetic; Path=/';
  receive('functioneel');
  assert.equal(window['ga-disable-G-87KMB19788'], true);
  assert.equal(window.SparkyTracking.track('generate_lead', { form_id: 'testForm' }), false);
  assert.doesNotMatch(window.document.cookie, /_ga=/);
  assert.equal(frame.hidden, true);
  assert.equal(frame.hasAttribute('src'), false);
  assert.equal(layer.hidden, true);

  receive('volledig');
  h.flushIdle();
  assert.equal(window['ga-disable-G-87KMB19788'], false);
  assert.equal(frame.hidden, false);
  assert.equal(frame.src, frame.dataset.cookieSrc);
  assert.equal(window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), true);
  assert.equal(window.document.querySelectorAll('#googleTagManagerTag').length, 1);
  assert.equal(h.events('gtm.js').length, 1);
  assert.equal(writes, 0);
  assert.equal(window.localStorage.getItem(storageKey), 'volledig');
});

test('een vertraagd toestaan-event kan een inmiddels ingetrokken keuze niet herstellen', t => {
  const h = harness(t, { choice: 'functioneel' });
  const { window } = h;
  // Een andere tab heeft achtereenvolgens toegestaan en alweer ingetrokken.
  window.localStorage.setItem(storageKey, 'functioneel');
  window.dispatchEvent(new window.StorageEvent('storage', {
    key: storageKey,
    oldValue: 'functioneel',
    newValue: 'volledig',
    storageArea: window.localStorage
  }));
  h.flushIdle();
  assert.equal(window.localStorage.getItem(storageKey), 'functioneel');
  assert.equal(window['ga-disable-G-87KMB19788'], true);
  assert.equal(window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), false);
  assert.equal(window.document.getElementById('googleTagManagerTag'), null);
  assert.deepEqual(h.events(), []);
});

test('clear of ongeldige externe toestemming weigert meten; andere opslag verandert de keuze niet', t => {
  for (const externalValue of [null, 'ongeldige-keuze']) {
    const h = harness(t, { choice: 'volledig' });
    const { window } = h;
    if (externalValue === null) window.localStorage.clear();
    else window.localStorage.setItem(storageKey, externalValue);
    window.dispatchEvent(new window.StorageEvent('storage', {
      key: externalValue === null ? null : storageKey,
      oldValue: externalValue === null ? null : 'volledig',
      newValue: externalValue,
      storageArea: window.localStorage
    }));
    h.flushIdle();
    assert.equal(window['ga-disable-G-87KMB19788'], true);
    assert.equal(window.document.getElementById('cookieToestemmingLaag').hidden, false);
    assert.equal(window.SparkyTracking.track('generate_lead', { form_id: 'testForm' }), false);
    assert.equal(window.document.querySelector('#googleTagManagerTag'), null);

    window.localStorage.setItem('unrelated-choice', 'volledig');
    window.dispatchEvent(new window.StorageEvent('storage', { key: 'unrelated-choice', newValue: 'volledig', storageArea: window.localStorage }));
    window.sessionStorage.setItem(storageKey, 'volledig');
    window.dispatchEvent(new window.StorageEvent('storage', { key: storageKey, newValue: 'volledig', storageArea: window.sessionStorage }));
    assert.equal(window['ga-disable-G-87KMB19788'], true);
    assert.equal(window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), false);
    assert.equal(window.document.getElementById('cookieToestemmingLaag').hidden, false);

    window.localStorage.setItem(storageKey, 'volledig');
    window.dispatchEvent(new window.StorageEvent('storage', { key: storageKey, newValue: 'volledig', storageArea: window.localStorage }));
    assert.equal(window.document.getElementById('cookieToestemmingLaag').hidden, true);
    assert.equal(window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), true);
  }
});

test('een mislukte GTM-download kan na een nieuwe toestemmingskeuze opnieuw zonder dubbele start', t => {
  const h = harness(t, { choice: 'volledig' });
  h.flushIdle();
  const first = h.window.document.getElementById('googleTagManagerTag');
  first.dispatchEvent(new h.window.Event('error'));
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), null);
  h.choose('volledig');
  h.flushIdle();
  const second = h.window.document.getElementById('googleTagManagerTag');
  assert.ok(second);
  assert.notEqual(second, first);
  first.dispatchEvent(new h.window.Event('error'));
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), second);
  assert.equal(h.events('gtm.js').length, 1);
  assert.equal(h.window.dataLayer.filter(entry => entry[0] === 'js').length, 1);
});

test('online herstelt een mislukte download alleen bij toestemming en oude idle-taken proberen niet door', t => {
  const h = harness(t, { choice: 'volledig' });
  assert.equal(h.window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), true);
  h.window.document.getElementById('googleTagManagerTag').dispatchEvent(new h.window.Event('error'));
  h.flushIdle();
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), null);

  h.window.dispatchEvent(new h.window.Event('online'));
  const recovered = h.window.document.getElementById('googleTagManagerTag');
  assert.ok(recovered);
  h.window.dispatchEvent(new h.window.Event('online'));
  assert.equal(h.window.document.querySelectorAll('#googleTagManagerTag').length, 1);
  recovered.dispatchEvent(new h.window.Event('error'));
  h.choose('functioneel');
  h.window.dispatchEvent(new h.window.Event('online'));
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), null);
  assert.equal(h.window.SparkyTracking.track('contact_click', { contact_method: 'phone' }), false);
  h.choose('volledig');
  h.window.dispatchEvent(new h.window.Event('online'));
  h.flushIdle();
  assert.equal(h.window.document.querySelectorAll('#googleTagManagerTag').length, 1);
  assert.equal(h.events('gtm.js').length, 1);
});

test('de eerste geldige interactie start GTM vóór haar event zonder op idle te wachten', t => {
  const h = harness(t, { choice: 'volledig' });
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), null);
  assert.equal(h.window.SparkyTracking.track('unknown_event'), false);
  assert.equal(h.window.SparkyTracking.track('contact_click', { contact_method: 'invalid' }), false);
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), null);
  h.clickLink('tel:+31000000000');
  const script = h.window.document.getElementById('googleTagManagerTag');
  assert.ok(script);
  const startIndex = h.window.dataLayer.findIndex(entry => entry.event === 'gtm.js');
  const eventIndex = h.window.dataLayer.findIndex(entry => entry.event === 'contact_click');
  assert.ok(startIndex >= 0 && startIndex < eventIndex);
  h.flushIdle();
  assert.equal(h.window.document.getElementById('googleTagManagerTag'), script);
  assert.equal(h.events('gtm.js').length, 1);
});

test('bestaande en dynamische contactlinks meten alleen methode, ID en pad', t => {
  const h = harness(t, { choice: 'volledig' });
  h.clickLink('tel:+31000000000', 'phoneLink');
  h.clickLink('https://wa.me/31000000000?text=do-not-track', 'whatsappLink');
  h.clickLink('https://web.whatsapp.com/send?phone=31000000000', 'whatsappDesktopLink');
  h.clickLink('mailto:synthetic@example.com?subject=do-not-track', 'emailLink');
  h.clickLink('https://whatsapp.com.evil.invalid/send', 'notAContactLink');
  assert.deepEqual(h.events('contact_click'), [
    { event: 'contact_click', page_path: '/contact.html', contact_method: 'phone', link_id: 'phoneLink' },
    { event: 'contact_click', page_path: '/contact.html', contact_method: 'whatsapp', link_id: 'whatsappLink' },
    { event: 'contact_click', page_path: '/contact.html', contact_method: 'whatsapp', link_id: 'whatsappDesktopLink' },
    { event: 'contact_click', page_path: '/contact.html', contact_method: 'email', link_id: 'emailLink' }
  ]);
  assert.doesNotMatch(JSON.stringify(h.events()), /synthetic|31000000000|private|do-not-track/);
  h.window.SparkyTracking.track('contact_click', { contact_method: 'email', link_id: 'safeLink', email: 'synthetic@example.com', href: 'do-not-track' });
  assert.deepEqual(Object.keys(h.events('contact_click').at(-1)).sort(), ['contact_method', 'event', 'link_id', 'page_path']);
  assert.equal(h.window.SparkyTracking.track('unknown_event', { arbitrary: 'value' }), false);
});

for (const [formId, html] of [
  ['contactSnelAdviesFormulier', contactHtml],
  ['contactSectLatenWeBeginnenFormulier', contactHtml],
  ['laadpalenSectWelkeLaadpaalPastBijUFormulier', calculatorHtml]
]) {
  test(`${formId}: alleen bevestigde verzending opent /bedankt; dubbele submit geeft één verzending en conversie`, async t => {
    let complete;
    let calls = 0;
    const h = harness(t, { html, choice: 'volledig', runMain: true, fetchImpl: async () => {
      calls++;
      return new Promise(resolve => { complete = resolve; });
    } });
    const form = h.window.document.getElementById(formId);
    form.checkValidity = () => true;
    const email = form.querySelector('input[type="email"]');
    email.value = 'synthetic@example.com';
    form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
    form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
    assert.equal(calls, 1);
    assert.deepEqual(h.navigations, []);
    assert.equal(h.window.sessionStorage.getItem(requestStorageKey), null);
    assert.deepEqual(h.events('generate_lead'), []);
    complete(new Response('{"ok":true}', { status: 200 }));
    await settle();
    assert.deepEqual(h.navigations, ['/bedankt']);
    assert.equal(email.value, '');
    assert.equal(form.querySelector('.formulierNotitie').dataset.status, 'success');
    assert.equal(form.querySelector('button[type="submit"]').disabled, true);
    form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
    assert.equal(calls, 1);
    assert.deepEqual(h.navigations, ['/bedankt']);
    assert.deepEqual(h.events('generate_lead'), []);
    const requestMarker = h.window.sessionStorage.getItem(requestStorageKey);
    const request = JSON.parse(requestMarker);
    assert.equal(request.formId, formId);
    assert.ok(Date.now() - request.createdAt < 10000);
    assert.deepEqual(Object.keys(request).sort(), ['createdAt', 'formId']);
    const thanks = harness(t, { choice: 'volledig', requestMarker, url: 'https://www.sparkyenergies.com/bedankt' });
    thanks.visitThankYou();
    assert.deepEqual(thanks.events('generate_lead'), [{ event: 'generate_lead', page_path: '/bedankt', form_id: formId }]);
    assert.equal(thanks.window.sessionStorage.getItem(requestStorageKey), null);
    thanks.visitThankYou();
    assert.equal(thanks.events('generate_lead').length, 1);
  });
}

test('een geslaagde aanvraag opent /bedankt als sessieopslag geblokkeerd is', async t => {
  const h = harness(t, { html: contactHtml, runMain: true, fetchImpl: async () => new Response('{"ok":true}', { status: 200 }) });
  const form = h.window.document.getElementById('contactSnelAdviesFormulier');
  form.checkValidity = () => true;
  const email = form.querySelector('input[type="email"]');
  email.value = 'synthetic@example.com';
  Object.defineProperty(h.window, 'sessionStorage', { get() { throw new Error('Synthetisch geblokkeerd.'); } });
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(email.value, '');
  assert.equal(form.querySelector('.formulierNotitie').dataset.status, 'success');
  assert.equal(form.querySelector('button[type="submit"]').disabled, true);
  assert.deepEqual(h.navigations, ['/bedankt']);
  assert.deepEqual(h.events('generate_lead'), []);
});

test('na succes wordt overgenomen calculatoradvies opgeruimd vóór de bedankpagina', async t => {
  const h = harness(t, {
    html: contactHtml, runMain: true, fetchImpl: async () => new Response('{"ok":true}', { status: 200 }),
    url: 'https://www.sparkyenergies.com/contact.html?calculator=laadpaal&onderwerp=laadpaal',
    advice: { version: 3, savedAt: Date.now(), type: 'laadpaal', topic: 'laadpaal', title: 'Synthetisch advies', summary: 'Niet meten', details: ['Niet meten'], fields: [['Naam', 'Niet meten']], contextFields: [['Warmtepomp', 'Ja']] }
  });
  const form = h.window.document.getElementById('contactSectLatenWeBeginnenFormulier');
  assert.ok(form.querySelector('input[name="calculator_samenvatting"]'));
  form.checkValidity = () => true;
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(form.querySelector('input[name="calculator_samenvatting"], input[name="calculator_situatie"], .calculatorOverdrachtMelding'), null);
  assert.equal(h.window.sessionStorage.getItem('sparkyCalculatorAanvraag'), null);
  assert.deepEqual(h.navigations, ['/bedankt']);
});

test('validatie-, server- en netwerkfouten behouden invoer en openen geen bedankpagina', async t => {
  let calls = 0;
  const h = harness(t, { html: contactHtml, choice: 'volledig', runMain: true, fetchImpl: async () => {
    calls++;
    return new Response('{"errors":[{"message":"Synthetische fout"}]}', { status: 400 });
  } });
  const form = h.window.document.getElementById('contactSnelAdviesFormulier');
  const email = form.querySelector('input[type="email"]');
  email.value = 'synthetic@example.com';
  form.checkValidity = () => false;
  form.reportValidity = () => false;
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  assert.equal(calls, 0);
  assert.deepEqual(h.navigations, []);
  assert.equal(email.value, 'synthetic@example.com');
  form.checkValidity = () => true;
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(calls, 1);
  assert.equal(email.value, 'synthetic@example.com');
  assert.deepEqual(h.navigations, []);
  assert.equal(form.querySelector('.formulierNotitie').dataset.status, 'error');
  h.window.fetch = async () => { throw new TypeError('Synthetische netwerkfout'); };
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(email.value, 'synthetic@example.com');
  assert.equal(form.querySelector('.formulierNotitie').dataset.status, 'error');
  assert.equal(form.querySelector('button[type="submit"]').disabled, false);
  assert.deepEqual(h.navigations, []);
  assert.equal(h.window.sessionStorage.getItem(requestStorageKey), null);
  assert.deepEqual(h.events('generate_lead'), []);
  h.choose('functioneel');
  h.window.fetch = async () => new Response('{"ok":true}', { status: 200 });
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await settle();
  assert.equal(form.querySelector('.formulierNotitie').dataset.status, 'success');
  assert.deepEqual(h.navigations, ['/bedankt']);
  assert.deepEqual(h.events('generate_lead'), []);
});

test('rechtstreeks bezoek, ongeldige en verlopen bevestigingen meten geen conversie', t => {
  const formId = 'contactSnelAdviesFormulier';
  for (const requestMarker of [
    undefined, 'geen json', 'null', '{}',
    JSON.stringify({ formId: 'onbekendFormulier', createdAt: Date.now() }),
    JSON.stringify({ formId, createdAt: String(Date.now()) }),
    JSON.stringify({ formId, createdAt: Date.now() + 60000 }),
    JSON.stringify({ formId, createdAt: Date.now() - 10 * 60 * 1000 })
  ]) {
    const h = harness(t, { choice: 'volledig', requestMarker, url: 'https://www.sparkyenergies.com/bedankt' });
    h.visitThankYou();
    assert.deepEqual(h.events('generate_lead'), []);
    assert.equal(h.window.sessionStorage.getItem(requestStorageKey), null);
  }
});

test('een bedankbevestiging wordt ook zonder toestemming verbruikt', t => {
  for (const choice of [undefined, 'functioneel']) {
    const h = harness(t, { choice, url: 'https://www.sparkyenergies.com/bedankt', requestMarker: JSON.stringify({ formId: 'contactSnelAdviesFormulier', createdAt: Date.now() }) });
    h.visitThankYou();
    assert.deepEqual(h.events('generate_lead'), []);
    assert.equal(h.window.sessionStorage.getItem(requestStorageKey), null);
    h.choose('volledig');
    h.visitThankYou();
    assert.deepEqual(h.events('generate_lead'), []);
  }
});

test('bedankmeting werkt alleen op de bedankroutes en blijft veilig bij geblokkeerde meting of opslag', t => {
  const requestMarker = JSON.stringify({ formId: 'contactSnelAdviesFormulier', createdAt: Date.now() });
  for (const path of ['/bedankt.html', '/bedankt/']) {
    const h = harness(t, { choice: 'volledig', requestMarker, url: `https://www.sparkyenergies.com${path}?private=do-not-track` });
    h.visitThankYou();
    assert.equal(h.events('generate_lead').length, 1);
    assert.equal(h.events('generate_lead')[0].page_path, path);
  }
  const other = harness(t, { choice: 'volledig', requestMarker });
  other.visitThankYou();
  assert.deepEqual(other.events('generate_lead'), []);
  assert.equal(other.window.sessionStorage.getItem(requestStorageKey), requestMarker);
  const blocked = harness(t, { choice: 'volledig', requestMarker, url: 'https://www.sparkyenergies.com/bedankt' });
  blocked.window.dataLayer.push = () => { throw new Error('Synthetisch geblokkeerd.'); };
  assert.doesNotThrow(() => blocked.visitThankYou());
  assert.deepEqual(blocked.events('generate_lead'), []);
  assert.equal(blocked.window.sessionStorage.getItem(requestStorageKey), null);
  const blockedStorage = harness(t, { choice: 'volledig', requestMarker, url: 'https://www.sparkyenergies.com/bedankt' });
  Object.defineProperty(blockedStorage.window, 'sessionStorage', { get() { throw new Error('Synthetisch geblokkeerd.'); } });
  assert.doesNotThrow(() => blockedStorage.visitThankYou());
  assert.deepEqual(blockedStorage.events('generate_lead'), []);
});

test('calculatorgebruik blijft via GTM gemeten zonder invoer en stopt na intrekken', t => {
  const h = harness(t, { html: calculatorHtml, choice: 'volledig', runMain: true, url: 'https://www.sparkyenergies.com/laadpalen.html' });
  const form = h.window.document.querySelector('form[data-calculator-type="laadpaal"]');
  form.elements.namedItem('netaansluiting').value = '3-fase';
  form.elements.namedItem('afstandMeterkastMeter').value = '8';
  form.elements.namedItem('zonnepanelenAanwezig').value = 'nee';
  const input = form.querySelector('input');
  input.dispatchEvent(new h.window.FocusEvent('focusin', { bubbles: true }));
  input.dispatchEvent(new h.window.FocusEvent('focusin', { bubbles: true }));
  assert.equal(h.events('calculator_started').length, 1);
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  assert.deepEqual(h.events('calculator_completed'), [{ event: 'calculator_completed', page_path: '/laadpalen.html', calculator_type: 'laadpaal' }]);
  const link = h.window.document.querySelector('[data-calculation-contact]');
  link.addEventListener('click', event => event.preventDefault());
  link.click();
  assert.equal(h.events('calculator_contact_clicked').length, 1);
  h.choose('functioneel');
  form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  link.click();
  assert.equal(h.events('calculator_completed').length, 1);
  assert.equal(h.events('calculator_contact_clicked').length, 1);
});

test('overgenomen calculatoradvies stuurt alleen het calculatortype naar GTM', t => {
  const h = harness(t, {
    html: contactHtml, choice: 'volledig', runMain: true,
    url: 'https://www.sparkyenergies.com/contact.html?calculator=laadpaal&onderwerp=laadpaal',
    advice: { version: 3, savedAt: Date.now(), type: 'laadpaal', topic: 'laadpaal', title: 'Synthetisch advies', summary: 'Niet meten', details: ['Niet meten'], fields: [['Naam', 'Niet meten']], contextFields: [['Warmtepomp', 'Ja']] }
  });
  assert.deepEqual(h.events('calculator_transferred'), [{ event: 'calculator_transferred', page_path: '/contact.html', calculator_type: 'laadpaal' }]);
  const transferIndex = h.window.dataLayer.findIndex(entry => entry.event === 'calculator_transferred');
  assert.ok(h.window.dataLayer.slice(0, transferIndex).some(entry => entry[0] === 'consent' && entry[1] === 'update' && entry[2].analytics_storage === 'granted'));
  // main.js neemt het advies in de harness vóór DOMContentLoaded over.
  assert.ok(h.window.document.getElementById('googleTagManagerTag'));
  const startIndex = h.window.dataLayer.findIndex(entry => entry.event === 'gtm.js');
  assert.ok(startIndex >= 0 && startIndex < transferIndex);
  h.flushIdle();
  assert.equal(h.events('gtm.js').length, 1);
});
