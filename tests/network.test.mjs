import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/network.js', import.meta.url), 'utf8');
function client(fetchImpl) {
  const context = { window: {}, fetch: fetchImpl, AbortController, TextDecoder, setTimeout, clearTimeout };
  vm.runInNewContext(source, context);
  return context.window.SparkyNetwork.fetchJson;
}

test('JSON-limiet telt echte bytes zonder betrouwbare Content-Length en annuleert de stream', async () => {
  for (const headers of [{}, { 'Content-Length': '1' }]) {
    let cancelled = false;
    const stream = new ReadableStream({
      start(controller) { controller.enqueue(new TextEncoder().encode('"' + 'x'.repeat(100))); },
      cancel() { cancelled = true; },
    });
    const fetchJson = client(async () => new Response(stream, { headers }));
    await assert.rejects(fetchJson('/fixture', {}, { maxBytes: 10 }), { code: 'size' });
    assert.equal(cancelled, true);
  }
});

test('UTF-8 over chunkgrenzen werkt precies tot het byteplafond', async () => {
  const bytes = new TextEncoder().encode('{"text":"é🌞"}');
  const fetchJson = client(async () => new Response(new ReadableStream({
    start(controller) { for (const byte of bytes) controller.enqueue(Uint8Array.of(byte)); controller.close(); },
  })));
  const result = await fetchJson('/fixture', {}, { maxBytes: bytes.length });
  assert.equal(result.data.text, 'é🌞');
});

test('deadline werkt vóór headers en tijdens een hangende responsebody', async () => {
  let aborted = false;
  const neverHeaders = client(async (_url, { signal }) => {
    signal.addEventListener('abort', () => { aborted = true; });
    return new Promise(() => {});
  });
  await assert.rejects(neverHeaders('/fixture', {}, { timeoutMs: 20 }), { code: 'timeout' });
  assert.equal(aborted, true);
  let cancelled = false;
  const neverBody = client(async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(Uint8Array.of(123)); },
    cancel() { cancelled = true; },
  })));
  await assert.rejects(neverBody('/fixture', {}, { timeoutMs: 20 }), { code: 'timeout' });
  assert.equal(cancelled, true);
});

test('optionele JSON-terugval verbergt geen limietfouten en volgend verzoek kan herstellen', async () => {
  let value = 'ongeldige JSON';
  const fetchJson = client(async () => new Response(value));
  const fallback = await fetchJson('/fixture', {}, { allowInvalidJson: true });
  assert.equal(Object.keys(fallback.data).length, 0);
  await assert.rejects(fetchJson('/fixture', {}, { maxBytes: 4, allowInvalidJson: true }), { code: 'size' });
  value = '{"ok":true}';
  assert.equal((await fetchJson('/fixture')).data.ok, true);
});
