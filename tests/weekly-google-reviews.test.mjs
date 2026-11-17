import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { featureId, fetchPublicReviews, mergePublicReviews, parsePublicPlace, renderCards, updateHomepage } from '../scripts/sync-google-reviews.mjs';

const review = (id = 'Synthetic_review_1', changes = {}) => ({
  id, author: 'Fictieve klant', rating: 5, text: 'Een synthetische review.\nTweede alinea.',
  publishedAt: '2026-11-01T12:00:00.000Z', photoUrl: '',
  sourceUrl: `https://www.google.com/maps/reviews/data=!4m8!1s${id}!2m1!1s0x0:0x4caacae818dda9f3!3m1!1s2@1:test?hl=nl`,
  ...changes,
});
function payload(reviews, total = reviews.length) {
  const place = [];
  place[4] = [null, null, null, null, null, null, null, total ? 5 : 0, total];
  place[10] = featureId;
  place[11] = 'Sparky Energies';
  const rows = reviews.map(value => {
    const record = [];
    record[0] = value.id;
    record[1] = [null, null, Date.parse(value.publishedAt) * 1000, null, [null, null, null, null, null, [value.author, value.photoUrl]]];
    record[2] = [[value.rating]];
    if (value.text) record[2][15] = [[value.text]];
    record[4] = [null, null, null, [value.sourceUrl]];
    return [record];
  });
  place[175] = [];
  place[175][9] = [[rows]];
  const data = [];
  data[6] = place;
  return ")]}'\n" + JSON.stringify(data);
}
const source = (reviews, total = reviews.length) => ({ reviews, totalReviewCount: total, averageRating: total ? 5 : 0 });

test('openbare bron behoudt oorspronkelijke tekst, exacte datum, sterren en eigen Google-link', () => {
  const expected = review('Synthetic_review_1', { text: '<script> & "citaat"\n\nLetterlijke tekst.' });
  assert.deepEqual(parsePublicPlace(payload([expected])), source([expected]));
  const starsOnly = review('Synthetic_review_2', { text: '' });
  assert.equal(parsePublicPlace(payload([starsOnly])).reviews[0].text, '');
  assert.deepEqual(parsePublicPlace(payload([])), source([]));
});

test('kapotte bronnen, verkeerd profiel, dubbele IDs en onjuiste bronlinks worden geweigerd', () => {
  for (const input of ['<html>toegang nodig</html>', payload([], 7), payload([review(), review()]), payload([review()]).replace(featureId, '0x1:0x2'), payload([review('Synthetic_review_1', { sourceUrl: 'https://example.com/review' })])]) {
    assert.throws(() => parsePublicPlace(input));
  }
});

test('onvolledige preview voegt nooit een onvolledige set toe en verwijdert geen bestaande kaarten', () => {
  const snapshot = { reviews: [review()] };
  const before = structuredClone(snapshot);
  assert.throws(() => mergePublicReviews(snapshot, source([review('Synthetic_review_2')], 7)), /Onvolledige/);
  assert.throws(() => mergePublicReviews(snapshot, source([], 1)), /geen geldige reviewrecords/);
  assert.deepEqual(snapshot, before);
  assert.throws(() => mergePublicReviews(snapshot, source([], 0)), /minder reviews/);
  assert.deepEqual(snapshot, before);
});

test('bevestigde toevoegingen en wijzigingen worden samengevoegd; niet getoonde bekende reviews blijven staan', () => {
  const first = review();
  const second = review('Synthetic_review_2');
  const changed = review('Synthetic_review_1', { text: 'Gewijzigde tekst' });
  const merged = mergePublicReviews({ reviews: [first, second] }, source([changed, review('Synthetic_review_3')], 3));
  assert.equal(merged.reviews.length, 3);
  assert.equal(merged.reviews[0].text, 'Gewijzigde tekst');
  assert.deepEqual(merged.reviews[1], second);
  assert.equal(new Set(merged.reviews.map(value => value.id)).size, 3);
  assert.throws(() => mergePublicReviews({ reviews: [first] }, source([first, first], 2)), /Dubbele/);
  assert.throws(() => mergePublicReviews({ reviews: [first] }, { ...source([first]), averageRating: 3 }), /sterren/);
});

test('HTML blijft veilig; beoordelingen zonder vrije tekst of exacte datum krijgen geen verzonnen inhoud', () => {
  const dangerous = review('Synthetic_review_1', { author: '<img src=x onerror=alert(1)>', text: '<script>alert(1)</script>\n& "tekst"' });
  const starsOnly = review('Synthetic_review_2', { text: '', publishedAt: null });
  const dom = new JSDOM(`<ul>${renderCards([dangerous, starsOnly])}</ul>`);
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('script, [onerror]').length, 0);
    assert.equal(document.querySelector('h3').textContent, dangerous.author);
    assert.match(document.querySelector('blockquote').textContent, /<script>alert\(1\)<\/script>/);
    assert.equal(document.querySelectorAll('blockquote br').length, 1);
    const second = document.querySelectorAll('article')[1];
    assert.equal(second.querySelector('time'), null);
    assert.match(second.textContent, /alleen een sterrenbeoordeling/);
  } finally { dom.window.close(); }
});

test('alleen de unieke reviewlijst wordt vervangen; foutieve markup wordt niet aangepast', () => {
  const html = '<h1>Behouden</h1><ul id="homeSectWatKlantenOverOnsZeggenLijst"><li>oud</li></ul><footer>Behouden</footer>';
  const updated = updateHomepage(html, source([review()]));
  assert.ok(updated.startsWith('<h1>Behouden</h1>'));
  assert.ok(updated.endsWith('<footer>Behouden</footer>'));
  assert.match(updated, /Synthetic_review_1/);
  assert.throws(() => updateHomepage('<h1>Geen reviewlijst</h1>', source([review()])));
  assert.throws(() => updateHomepage(html + html, source([review()])));
});

test('fetch volgt uitsluitend een openbare Google-bronlink en weigert inlogpagina’s en te grote responses', async () => {
  let calls = 0;
  const mock = async () => new Response(++calls === 1 ? '<link href="/maps/preview/place?hl=nl&amp;pb=test">' : payload([review()]));
  assert.equal((await fetchPublicReviews(mock)).reviews.length, 1);
  assert.equal(calls, 2);
  await assert.rejects(fetchPublicReviews(async () => new Response('<link href="https://example.com/maps/preview/place?pb=test">')), /Onverwachte/);
  await assert.rejects(fetchPublicReviews(async () => new Response('x'.repeat(2 * 1024 * 1024 + 1))), /maximale grootte/);
  await assert.rejects(fetchPublicReviews(async () => { const response = new Response('<html>Login</html>'); Object.defineProperty(response, 'url', { value: 'https://accounts.google.com/' }); return response; }), /niet bereikbaar/);
});
