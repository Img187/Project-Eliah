import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';

const html = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
const main = await readFile(new URL('../assets/js/main.js', import.meta.url), 'utf8');
const network = await readFile(new URL('../assets/js/network.js', import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };

function harness(t, fetchImpl, shortenDeadline = false) {
  const dom = new JSDOM(html, { url: 'https://www.sparkyenergies.com/contact.html', runScripts: 'outside-only', pretendToBeVisual: true });
  t.after(() => dom.window.close());
  const { window } = dom;
  window.matchMedia = () => Object.assign(new window.EventTarget(), { matches: false });
  window.requestAnimationFrame = () => 1;
  window.scrollTo = () => {};
  window.TextDecoder = TextDecoder;
  window.AbortController = AbortController;
  window.fetch = fetchImpl;
  if (shortenDeadline) {
    const schedule = window.setTimeout.bind(window);
    window.setTimeout = (callback, milliseconds) => schedule(callback, milliseconds === 90000 ? 20 : milliseconds);
  }
  const upload = window.document.querySelector('[data-formspree-upload]');
  let files = [];
  Object.defineProperty(upload, 'files', { get: () => files, set: value => { files = value; } });
  window.DataTransfer = class {
    constructor() { this.files = []; this.items = { add: file => this.files.push(file) }; }
  };
  window.eval(network);
  window.eval(main);
  const form = window.document.querySelector('form[data-formspree-form]');
  form.checkValidity = () => true; // Deze tests richten zich op verzending; veldvalidatie blijft apart bestaan.
  return { window, form, upload, choose(value) { upload.files = value; upload.dispatchEvent(new window.Event('change')); } };
}

test('dubbele submit start één POST; fout herstelt bediening en behoudt invoer', async t => {
  let finish;
  let calls = 0;
  const h = harness(t, async () => { calls++; return new Promise(resolve => { finish = resolve; }); });
  const name = h.form.querySelector('input[type="text"]:not([name="_gotcha"])');
  name.value = 'Synthetische test';
  const button = h.form.querySelector('button[type="submit"]');
  h.form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  h.form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  assert.equal(calls, 1);
  assert.equal(button.disabled, true);
  finish(new Response('{"errors":[{"message":"<img src=x onerror=alert(1)>"}]}', { status: 400 }));
  await settle();
  assert.equal(button.disabled, false);
  assert.equal(name.value, 'Synthetische test');
  const note = h.form.querySelector('.formulierNotitie');
  assert.equal(note.dataset.status, 'error');
  assert.equal(note.querySelector('img'), null);
  assert.match(note.textContent, /<img/);
});

test('hangende formulierresponse wordt afgebroken zonder automatische herhaling', async t => {
  let cancelled = false;
  let calls = 0;
  const h = harness(t, async () => {
    calls++;
    return new Response(new ReadableStream({ start(controller) { controller.enqueue(Uint8Array.of(123)); }, cancel() { cancelled = true; } }));
  }, true);
  h.form.dispatchEvent(new h.window.Event('submit', { cancelable: true }));
  await new Promise(resolve => setTimeout(resolve, 60));
  assert.equal(cancelled, true);
  assert.equal(calls, 1);
  assert.equal(h.form.querySelector('button[type="submit"]').disabled, false);
  assert.equal(h.form.querySelector('.formulierNotitie').dataset.status, 'error');
});

test('grote uploadselectie wordt vóór renderen geweigerd; optellen blijft maximaal vijf', t => {
  const h = harness(t, () => { throw new Error('Geen netwerk verwacht'); });
  const file = name => new h.window.File(['synthetisch'], name, { type: 'image/png' });
  h.choose([file('eerste.png')]);
  h.choose(Array.from({ length: 1000 }, (_, i) => file(`${i}.png`)));
  assert.equal(h.upload.files.length, 1);
  assert.equal(h.window.document.querySelectorAll('.adviesBestand').length, 1);
  h.choose(Array.from({ length: 5 }, (_, i) => file(`extra-${i}.png`)));
  assert.equal(h.upload.files.length, 5);
  assert.equal(h.window.document.querySelectorAll('.adviesBestand').length, 5);
});
