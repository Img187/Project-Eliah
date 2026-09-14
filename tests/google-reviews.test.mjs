import test from 'node:test';
import assert from 'node:assert/strict';
import { createReviewService, createReviewServer, readSettings } from '../server/google-reviews.mjs';

const settings = { clientId: 'test-client', clientSecret: 'test-secret', refreshToken: 'test-refresh', accountId: '123', locationId: '456', origins: ['https://www.sparkyenergies.com'] };
const raw = (id, comment = `Testreactie ${id}`) => ({ reviewId: id, reviewer: { displayName: `Testpersoon ${id}`, profilePhotoUrl: 'https://lh3.googleusercontent.com/example' }, comment, starRating: 'FIVE', createTime: '2026-09-10T12:00:00Z', updateTime: '2026-09-11T12:00:00Z' });
const page = (reviews, total = reviews.length, nextPageToken) => ({ reviews, totalReviewCount: total, averageRating: total ? 5 : 0, nextPageToken });
function harness() {
  let clock = Date.parse('2026-09-14T12:00:00Z');
  let pages = [];
  const requests = [];
  const service = createReviewService(settings, {
    now: () => clock,
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      if (url.includes('oauth2')) return { ok: true, json: async () => ({ access_token: 'test-access', expires_in: 3600 }) };
      const next = pages.shift();
      if (next instanceof Error || !next) throw new Error('test network error with secret');
      return { ok: true, json: async () => next };
    },
  });
  return { service, requests, setPages: data => { pages = data; }, advance: milliseconds => { clock += milliseconds; } };
}

test('haalt alle pagina’s op, deelt gelijktijdige verzoeken en geeft alleen publieke velden terug', async () => {
  const h = harness();
  h.setPages([page([raw('1'), raw('2')], 3, 'page-2'), page([raw('3')], 3)]);
  const [result, same] = await Promise.all([h.service.getReviews(), h.service.getReviews()]);
  assert.deepEqual(result, same);
  assert.equal(result.reviews.length, 3);
  assert.equal(h.requests.length, 3);
  assert.match(h.requests[2].url, /pageToken=page-2/);
  assert.match(h.requests[1].url, /pageSize=50/);
  assert.equal(result.stale, false);
  assert.doesNotMatch(JSON.stringify(result), /test-secret|test-refresh|test-access/);
  await h.service.getReviews();
  assert.equal(h.requests.length, 3, 'verse cache doet geen nieuw Google-verzoek');
});

test('neemt nieuwe en gewijzigde reviews over en verwijdert verdwenen reviews na volledige sync', async () => {
  const h = harness();
  h.setPages([page([raw('1'), raw('2')])]);
  await h.service.getReviews();
  h.advance(300001);
  h.setPages([page([raw('2', 'Bijgewerkt'), raw('3', '')])]);
  const result = await h.service.getReviews();
  assert.deepEqual(result.reviews.map(review => review.id), ['2', '3']);
  assert.equal(result.reviews[0].text, 'Bijgewerkt');
  assert.equal(result.reviews[1].text, '');
  h.advance(300001);
  h.setPages([page([])]);
  assert.equal((await h.service.getReviews()).totalReviewCount, 0);
});

test('onvolledige of kapotte paginering behoudt geldige cache, met begrensde herpogingen', async () => {
  const h = harness();
  h.setPages([page([raw('1'), raw('2')])]);
  const original = await h.service.getReviews();
  for (const broken of [
    [page([raw('1')], 2)],
    [page([raw('1')], 2, 'same'), page([raw('2')], 2, 'same')],
    [page([raw('1')], 2, 'next'), page([raw('1')], 2)],
    [page([raw('1')], 2, 'next'), new Error('failure')],
  ]) {
    h.advance(300001);
    h.setPages(broken);
    const result = await h.service.getReviews();
    assert.equal(result.stale, true);
    assert.deepEqual(result.reviews, original.reviews);
    assert.equal(result.fetchedAt, original.fetchedAt);
    const count = h.requests.length;
    await h.service.getReviews();
    assert.equal(h.requests.length, count);
  }
});

test('geeft na 24 uur storing geen verouderde cache terug en kan herstellen', async () => {
  const h = harness();
  h.setPages([page([raw('1')])]);
  await h.service.getReviews();
  h.advance(86400001);
  await assert.rejects(h.service.getReviews(), { message: 'reviews_unavailable' });
  h.advance(60001);
  h.setPages([page([raw('2')])]);
  assert.equal((await h.service.getReviews()).reviews[0].id, '2');
});

test('weert externe avatars en behoudt oorspronkelijke tekst als tekst', async () => {
  const h = harness();
  const review = raw('1', '<script>alert(1)</script>\nTweede regel');
  review.reviewer.profilePhotoUrl = 'https://googleusercontent.com.evil.example/pixel';
  h.setPages([page([review])]);
  const result = await h.service.getReviews();
  assert.equal(result.reviews[0].photoUrl, '');
  assert.equal(result.reviews[0].text, review.comment);
});

test('HTTP-endpoint beperkt origins/methoden en lekt geen foutdetails', async t => {
  const server = createReviewServer(settings, { getReviews: async () => { throw new Error('test-secret'); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/reviews`;
  const denied = await fetch(url, { headers: { Origin: 'https://example.com' } });
  assert.equal(denied.status, 403);
  const unavailable = await fetch(url, { headers: { Origin: settings.origins[0] } });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('Access-Control-Allow-Origin'), settings.origins[0]);
  assert.equal(unavailable.headers.get('Cache-Control'), 'no-store');
  assert.equal(await unavailable.text(), '{"error":"reviews_unavailable"}');
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
  assert.equal((await fetch(url, { method: 'OPTIONS' })).status, 204);
});

test('ontbrekende configuratie meldt alleen veldnamen', () => {
  assert.throws(() => readSettings({}), /GOOGLE_CLIENT_ID/);
});
