import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

// De echte homepage-markup en het echte script, zonder browser of netwerk.
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sectionHtml = html.match(/<section\b[^>]*class="[^"]*googleReviewsSectie[\s\S]*?<\/section>/)[0];
const script = await readFile(new URL('../assets/js/google-reviews.js', import.meta.url), 'utf8');
const start = Date.parse('2026-09-14T12:00:00Z');
const feed = (count, overrides = {}) => ({
  fetchedAt: new Date(start).toISOString(), totalReviewCount: count, averageRating: count ? 3 : 0,
  reviews: Array.from({ length: count }, (_, i) => ({
    id: `test-${i + 1}`, author: `Testpersoon ${i + 1}`, rating: i % 5 + 1, photoUrl: '',
    text: `Fictieve testreview ${i + 1}`, publishedAt: new Date(start - i * 86400000).toISOString(),
  })),
  ...overrides,
});
const settle = async () => { for (let i = 0; i < 4; i++) await new Promise(resolve => setImmediate(resolve)); };

async function harness(t, { data = feed(7), endpoint = 'https://reviews.example/reviews', hover = false, withoutStatic = false } = {}) {
  const dom = new JSDOM(sectionHtml, { url: 'https://www.sparkyenergies.com/', runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  const section = window.document.querySelector('section');
  const list = section.querySelector('.googleReviewLijst');
  if (withoutStatic) list.replaceChildren();
  const initial = list.innerHTML;
  let clock = start;
  let hidden = false;
  let failure = false;
  let requests = 0;
  const intervals = new Map();
  const reduced = Object.assign(new window.EventTarget(), { matches: false });
  window.matchMedia = () => reduced;
  window.Date.now = () => clock;
  window.setInterval = (fn, delay) => { intervals.set(delay, fn); return delay; };
  Object.defineProperty(window.document, 'hidden', { get: () => hidden });
  const matches = list.matches.bind(list);
  list.matches = selector => selector === ':hover' ? hover : matches(selector);
  window.fetch = async url => {
    if (url === 'data/reviews-config.json') return { ok: true, json: async () => ({ endpoint }) };
    assert.equal(url, endpoint);
    requests++;
    const snapshot = structuredClone(data);
    return { ok: !failure, json: async () => snapshot };
  };
  window.eval(script);
  await settle();
  return {
    window, section, list, initial,
    controls: section.querySelector('[data-review-controls]'),
    pause: section.querySelector('[data-review-pause]'),
    next: section.querySelector('[data-review-next]'),
    status: section.querySelector('[data-review-status]'),
    ids: () => [...list.children].map(li => li.dataset.reviewId),
    setFeed: value => { data = value; },
    setFailure: value => { failure = value; },
    setHover: value => { hover = value; },
    setHidden: value => { hidden = value; },
    setReduced: value => { reduced.matches = value; reduced.dispatchEvent(new window.Event('change')); },
    advance: milliseconds => { clock += milliseconds; },
    requests: () => requests,
    tick: async () => { intervals.get(12000)(); await settle(); },
    refresh: async () => { await intervals.get(300000)(); await settle(); },
  };
}

test('0, 2, 5 en 7 reviews: maximaal vijf kaarten en alle beoordelingen komen aan bod', async t => {
  for (const count of [0, 2, 5, 7]) {
    const h = await harness(t, { data: feed(count), withoutStatic: true });
    assert.equal(h.list.children.length, Math.min(count, 5));
    assert.equal(h.controls.hidden, count <= 5);
    assert.equal(h.section.dataset.reviewMode, 'live');
    if (!count) assert.match(h.status.textContent, /nog geen reviews/);
    const seen = new Set(h.ids());
    for (let i = 0; i < 7; i++) {
      await h.tick();
      assert.equal(new Set(h.ids()).size, Math.min(count, 5));
      h.ids().forEach(id => seen.add(id));
    }
    assert.equal(seen.size, count);
  }
});

test('nieuwe, gewijzigde en verwijderde reviews verversen; hover en focus beschermen de gelezen kaart', async t => {
  const h = await harness(t);
  const first = h.list.firstElementChild;
  const updated = feed(3);
  updated.reviews[0] = { ...updated.reviews[0], id: 'new', text: 'Nieuwe review', publishedAt: new Date(start + 1000).toISOString() };
  updated.reviews[1].text = 'Gewijzigde tekst';
  h.setHover(true);
  h.setFeed(updated);
  await h.refresh();
  await h.tick();
  assert.equal(h.list.firstElementChild, first);
  h.setHover(false);
  const focused = first.querySelector('a');
  focused.focus();
  await h.tick();
  assert.equal(h.window.document.activeElement, focused);
  assert.equal(h.list.firstElementChild, first);
  focused.blur();
  await h.tick();
  assert.deepEqual(h.ids(), ['new', 'test-2', 'test-3']);
  assert.match(h.list.textContent, /Gewijzigde tekst/);
  assert.equal(h.controls.hidden, true);
  const unchanged = h.list.firstElementChild;
  await h.refresh();
  assert.equal(h.list.firstElementChild, unchanged, 'ongewijzigde feed bouwt kaarten niet opnieuw');
});

test('pauzeknop, hover, focus, verborgen tab en verminderde beweging stoppen automatisch wisselen', async t => {
  const h = await harness(t);
  const original = h.ids();
  h.pause.click();
  await h.tick();
  assert.deepEqual(h.ids(), original);
  assert.equal(h.pause.getAttribute('aria-pressed'), 'true');
  h.pause.click();
  h.setHover(true);
  await h.tick();
  assert.deepEqual(h.ids(), original);
  h.setHover(false);
  const focused = h.list.querySelector('a');
  focused.focus();
  await h.tick();
  assert.equal(h.window.document.activeElement, focused);
  assert.deepEqual(h.ids(), original);
  focused.blur();
  h.setHidden(true);
  await h.tick();
  await h.refresh();
  assert.equal(h.requests(), 1);
  assert.deepEqual(h.ids(), original);
  h.setHidden(false);
  h.setReduced(true);
  await h.tick();
  assert.deepEqual(h.ids(), original);
  assert.equal(h.pause.disabled, true);
  h.next.click();
  assert.notDeepEqual(h.ids(), original, 'handmatig wisselen blijft beschikbaar');
  h.setReduced(false);
  const before = h.ids();
  await h.tick();
  assert.notDeepEqual(h.ids(), before);
});

test('teksten en namen zijn geen HTML; tekstloze reviews en kapotte avatars hebben terugval', async t => {
  const data = feed(3);
  data.reviews[0].author = '<script>injected()</script>';
  data.reviews[0].text = '<img src=x onerror=alert(1)>\nTweede regel';
  data.reviews[0].photoUrl = 'https://googleusercontent.com.evil.example/pixel';
  data.reviews[1].text = '';
  data.reviews[2].photoUrl = 'https://lh3.googleusercontent.com/test';
  const h = await harness(t, { data });
  assert.equal(h.list.querySelectorAll('script, blockquote img').length, 0);
  assert.equal(h.list.querySelector('blockquote p').textContent, data.reviews[0].text);
  assert.equal(h.list.querySelector('h3').textContent, data.reviews[0].author);
  assert.match(h.list.textContent, /alleen een sterrenbeoordeling/);
  assert.equal(h.list.querySelector('.googleReviewSterren').textContent, '★☆☆☆☆');
  assert.equal(h.list.querySelectorAll('img').length, 1);
  const image = h.list.querySelector('img');
  const avatar = image.parentElement;
  image.dispatchEvent(new h.window.Event('error'));
  assert.equal(avatar.textContent, 'T3');
  assert.equal(avatar.querySelector('img'), null);
});

test('zonder endpoint blijft de proef staan; ingestelde maar kapotte feed toont geen proef als live review', async t => {
  const unconfigured = await harness(t, { endpoint: '' });
  assert.equal(unconfigured.list.innerHTML, unconfigured.initial);
  assert.equal(unconfigured.requests(), 0);
  const unavailable = await harness(t, { data: { reviews: [] } });
  assert.equal(unavailable.list.children.length, 0);
  assert.equal(unavailable.status.hidden, false);
  assert.match(unavailable.status.textContent, /niet worden vernieuwd/);
  assert.equal(unavailable.section.dataset.reviewMode, 'unavailable');
  assert.ok(unavailable.section.querySelector('.googleReviewsAlle').href.startsWith('https://www.google.com/'));
});

test('ongeldige verversing bewaart geldige kaarten; na 24 uur verdwijnen ze en herstel werkt', async t => {
  const h = await harness(t, { data: feed(2) });
  const original = h.list.firstElementChild;
  for (const invalid of [
    feed(3, { totalReviewCount: 4 }),
    feed(3, { fetchedAt: new Date(start - 86400001).toISOString() }),
    feed(3, { fetchedAt: new Date(start + 60001).toISOString() }),
    feed(3, { reviews: [feed(1).reviews[0], feed(1).reviews[0], null] }),
  ]) {
    h.setFeed(invalid);
    await h.refresh();
    assert.equal(h.list.firstElementChild, original);
  }
  h.setFailure(true);
  await h.refresh();
  assert.equal(h.list.firstElementChild, original);
  h.advance(86400001);
  await h.tick();
  assert.equal(h.list.children.length, 0);
  assert.equal(h.section.dataset.reviewMode, 'unavailable');
  assert.equal(h.controls.hidden, true);
  h.setFailure(false);
  h.setFeed(feed(1, { fetchedAt: new Date(start + 86400001).toISOString() }));
  await h.refresh();
  assert.equal(h.list.children.length, 1);
  assert.equal(h.status.hidden, true);
});

test('een tijdens het lezen uitgestelde feed mag na 24 uur niet alsnog verschijnen', async t => {
  const h = await harness(t, { hover: true });
  assert.equal(h.list.children.length, 0);
  h.advance(86400001);
  h.setFailure(true);
  h.setHover(false);
  await h.tick();
  assert.equal(h.list.children.length, 0);
  assert.equal(h.section.dataset.reviewMode, 'unavailable');
});
