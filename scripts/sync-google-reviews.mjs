import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const featureId = '0x47c433950f503f1d:0x4caacae818dda9f3';
export const publicPlaceUrl = `https://www.google.com/maps/place/Sparky+Energies/data=!4m2!3m1!1s${featureId}?hl=nl`;
const snapshotPath = new URL('../data/google-reviews.snapshot.json', import.meta.url);
const homepagePath = new URL('../homepage.html', import.meta.url);
const allowedPhoto = value => {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || !(url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) throw new Error('Ongeldige Google-profielfoto.');
  return url.href;
};

export function validateReview(review) {
  if (!review || typeof review.id !== 'string' || !/^[A-Za-z0-9_-]{10,256}$/.test(review.id) || typeof review.author !== 'string' || !review.author.trim() || review.author.length > 512 || typeof review.text !== 'string' || review.text.length > 10000 || typeof review.sourceUrl !== 'string' || review.sourceUrl.length > 2048 || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) throw new Error('Onvolledige review.');
  if (review.publishedAt !== null && (typeof review.publishedAt !== 'string' || !Number.isFinite(Date.parse(review.publishedAt)))) throw new Error('Ongeldige reviewdatum.');
  const url = new URL(review.sourceUrl);
  if (url.origin !== 'https://www.google.com' || !url.pathname.startsWith('/maps/reviews/data=') || !url.pathname.includes(`!1s${review.id}!`) || !url.pathname.includes('0x0:0x4caacae818dda9f3!') || url.username || url.password) throw new Error('Reviewlink hoort niet bij het Sparky-profiel.');
  return { id: review.id, author: review.author, rating: review.rating, text: review.text, publishedAt: review.publishedAt, photoUrl: allowedPhoto(review.photoUrl), sourceUrl: url.href };
}

export function parsePublicPlace(text) {
  if (!text.startsWith(")]}'\n")) throw new Error('Google levert geen leesbare openbare reviewgegevens.');
  const data = JSON.parse(text.slice(5));
  const place = data?.[6];
  const totalReviewCount = place?.[4]?.[8];
  const averageRating = place?.[4]?.[7];
  if (place?.[10] !== featureId || place?.[11] !== 'Sparky Energies' || !Number.isInteger(totalReviewCount) || totalReviewCount < 0 || totalReviewCount > 1000 || !Number.isFinite(averageRating) || averageRating < 0 || averageRating > 5) throw new Error('Onverwacht Google-bedrijfsprofiel of ontbrekend reviewtotaal.');
  const rows = place?.[175]?.[9]?.[0]?.[0] ?? (totalReviewCount === 0 ? [] : null);
  if (!Array.isArray(rows) || (totalReviewCount > 0 && rows.length === 0)) throw new Error('Google-reviewlijst ontbreekt.');
  const reviews = rows.map(row => {
    const record = row?.[0];
    const microseconds = record?.[1]?.[2];
    if (!Number.isSafeInteger(microseconds) || microseconds <= 0) throw new Error('Exacte Google-reviewdatum ontbreekt.');
    return validateReview({
      id: record?.[0], author: record?.[1]?.[4]?.[5]?.[0], rating: record?.[2]?.[0]?.[0],
      text: record?.[2]?.[15]?.[0]?.[0] ?? '', publishedAt: new Date(microseconds / 1000).toISOString(),
      photoUrl: record?.[1]?.[4]?.[5]?.[1] ?? '', sourceUrl: record?.[4]?.[3]?.[0],
    });
  });
  if (new Set(reviews.map(review => review.id)).size !== reviews.length || reviews.length > totalReviewCount) throw new Error('Dubbele of inconsistente Google-reviewgegevens.');
  return { totalReviewCount, averageRating, reviews };
}

export function mergePublicReviews(snapshot, source) {
  if (!source || !Array.isArray(source.reviews) || !Number.isInteger(source.totalReviewCount) || source.totalReviewCount < 0 || source.totalReviewCount > 1000 || (source.totalReviewCount > 0 && source.reviews.length === 0)) throw new Error('Openbare bron bevat geen geldige reviewrecords.');
  const previous = snapshot.reviews.map(validateReview);
  if (new Set(previous.map(review => review.id)).size !== previous.length) throw new Error('Dubbele reviews in bestaande snapshot.');
  // Een openbare Maps-preview is geen volledige export. Een ontbrekende kaart is
  // daarom nooit bewijs dat Google die review heeft verwijderd.
  const incoming = new Map(source.reviews.map(review => [review.id, validateReview(review)]));
  if (incoming.size !== source.reviews.length) throw new Error('Dubbele reviews in nieuwe bron.');
  if (source.totalReviewCount < previous.length) throw new Error('Google meldt minder reviews. Volledige handmatige controle nodig; bestaande kaarten blijven staan.');
  const reviews = previous.map(review => {
    const update = incoming.get(review.id);
    incoming.delete(review.id);
    return update ?? review;
  });
  reviews.push(...incoming.values());
  if (reviews.length !== source.totalReviewCount) throw new Error(`Onvolledige openbare bron: ${reviews.length} bekende reviews tegenover ${source.totalReviewCount} op Google. Geen bestanden bijgewerkt.`);
  const calculated = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  if (!Number.isFinite(source.averageRating) || Math.abs(calculated - source.averageRating) > 0.11) throw new Error('Bekende sterren komen niet overeen met de Google-totaalscore. Volledige controle nodig.');
  return { totalReviewCount: source.totalReviewCount, averageRating: source.averageRating, reviews };
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' });

export function renderCards(reviews) {
  return reviews.map((value, index) => {
    const review = validateReview(value);
    const number = String(index + 1).padStart(2, '0');
    const id = `homeReview${createHash('sha256').update(review.id).digest('hex').slice(0, 12)}`;
    const initials = review.author.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
    const avatar = review.photoUrl ? `<img src="${escapeHtml(review.photoUrl)}" alt="" width="44" height="44" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : escapeHtml(initials);
    const text = review.text ? `“${escapeHtml(review.text).replace(/\r\n?|\n/g, '<br>')}”` : 'Deze klant heeft alleen een sterrenbeoordeling gegeven.';
    const date = review.publishedAt ? `            <time datetime="${escapeHtml(review.publishedAt)}">${dateFormat.format(new Date(review.publishedAt))}</time>\n` : '';
    return `      <li data-review-id="${escapeHtml(review.id)}">
        <article id="homeSectWatKlantenOverOnsZeggenArtikel${number}" class="testimonialKaart kaart googleReviewKaart" aria-labelledby="${id}Naam">
          <header class="googleReviewKop">
            <span class="googleReviewAvatar" aria-hidden="true">${avatar}</span>
            <div class="googleReviewAuteur">
              <h3 id="${id}Naam">${escapeHtml(review.author)}</h3>
              <p class="googleReviewWaardering"><span class="googleReviewSterren" aria-hidden="true">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span><span class="srOnly">${review.rating} uit 5 sterren</span></p>
            </div>
          </header>
          <blockquote><p id="homeSectWatKlantenOverOnsZeggenArtikel${number}P01">${text}</p></blockquote>
          <footer class="googleReviewVoet">
${date}            <a id="homeSectWatKlantenOverOnsZeggenBtn${number}Google" class="googleReviewBron" href="${escapeHtml(review.sourceUrl)}" target="_blank" rel="noopener noreferrer" data-button-page="Home" data-button-section="Wat klanten over ons zeggen" data-link-type="extern">Google <span aria-hidden="true">↗</span><span class="srOnly">: bekijk deze review (opent in een nieuw tabblad)</span></a>
          </footer>
        </article>
      </li>`;
  }).join('\n');
}

export function updateHomepage(html, snapshot) {
  const listPattern = /(<ul\b[^>]*id="homeSectWatKlantenOverOnsZeggenLijst"[^>]*>)[\s\S]*?(<\/ul>)/g;
  if ([...html.matchAll(listPattern)].length !== 1) throw new Error('Geen unieke reviewlijst in homepage.');
  const cards = renderCards(snapshot.reviews);
  return html.replace(listPattern, (_, open, close) => `${open}\n${cards}\n  ${close}`)
    .replace('data-review-mode="preview"', 'data-review-mode="static"')
    .replace(/<!-- Tijdelijke statische fallback zolang de Business Profile API[\s\S]*?-->/, '<!-- Statische Google-reviewkaarten; openbare bron wordt eenmaal per week gecontroleerd. -->');
}

async function publicText(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { 'User-Agent': 'SparkyEnergiesReviewSync/1.0 (+https://www.sparkyenergies.com)', 'Accept-Language': 'nl-NL,nl;q=0.9' }, signal: AbortSignal.timeout(25000) });
  const final = new URL(response.url || url);
  if (!response.ok || final.origin !== 'https://www.google.com' || !final.pathname.startsWith('/maps/')) throw new Error('Openbare Google-bron niet bereikbaar; geen wijzigingen.');
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 2 * 1024 * 1024) throw new Error('Google-bron overschrijdt de maximale grootte.');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  const text = Buffer.concat(chunks).toString('utf8');
  if (/unusual traffic|ongebruikelijk verkeer|<title>[^<]*(?:sorry|captcha)/i.test(text)) throw new Error('Google vraagt om menselijke controle; geen wijzigingen.');
  return text;
}

export async function fetchPublicReviews(fetchImpl = fetch) {
  const html = await publicText(publicPlaceUrl, fetchImpl);
  const href = html.match(/<link href="([^"]*\/maps\/preview\/place\?[^"]*)"/)?.[1]?.replaceAll('&amp;', '&');
  if (!href) throw new Error('Openbare Maps-bronlink ontbreekt; geen wijzigingen.');
  const source = new URL(href, 'https://www.google.com');
  if (source.origin !== 'https://www.google.com' || source.pathname !== '/maps/preview/place' || source.username || source.password) throw new Error('Onverwachte Maps-bronlink.');
  return parsePublicPlace(await publicText(source.href, fetchImpl));
}

export async function syncGoogleReviews() {
  const [stored, html] = await Promise.all([readFile(snapshotPath, 'utf8'), readFile(homepagePath, 'utf8')]);
  const snapshot = JSON.parse(stored);
  const source = await fetchPublicReviews();
  const merged = mergePublicReviews(snapshot, source);
  const changed = JSON.stringify(merged) !== JSON.stringify({ totalReviewCount: snapshot.totalReviewCount, averageRating: snapshot.averageRating, reviews: snapshot.reviews });
  const updated = { ...merged, updatedAt: changed ? new Date().toISOString() : snapshot.updatedAt };
  // Valideer en genereer alles voor de eerste bestandswijziging. De workflow
  // commit en publiceert alleen wanneer ook alle tests en de build slagen.
  const nextHtml = updateHomepage(html, updated);
  const nextJson = `${JSON.stringify(updated, null, 2)}\n`;
  if (nextHtml !== html) await writeFile(homepagePath, nextHtml);
  if (nextJson !== stored) await writeFile(snapshotPath, nextJson);
  console.log(`Google-reviews gecontroleerd: ${source.reviews.length} openbaar uitgelezen, ${merged.reviews.length} bekende beoordelingen, totaal op Google ${source.totalReviewCount}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  syncGoogleReviews().catch(error => { console.error(error.message); process.exitCode = 1; });
}
