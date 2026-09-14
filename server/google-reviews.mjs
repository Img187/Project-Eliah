import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const RETRY_MS = 60 * 1000;
const RATINGS = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export function readSettings(env = process.env) {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REFRESH_TOKEN', 'GOOGLE_ACCOUNT_ID', 'GOOGLE_LOCATION_ID'];
  const missing = required.filter(key => !env[key]);
  if (missing.length) throw new Error(`Ontbrekende instellingen: ${missing.join(', ')}`);
  if (!/^\d+$/.test(env.GOOGLE_ACCOUNT_ID) || !/^\d+$/.test(env.GOOGLE_LOCATION_ID)) throw new Error('Account- en locatie-ID moeten numeriek zijn.');
  const origins = (env.ALLOWED_ORIGINS || 'https://www.sparkyenergies.com,https://sparkyenergies.com').split(',').map(value => value.trim());
  if (origins.some(value => new URL(value).origin !== value)) throw new Error('ALLOWED_ORIGINS vereist volledige origins zonder pad.');
  const port = Number(env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Ongeldige PORT.');
  return { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, refreshToken: env.GOOGLE_REFRESH_TOKEN, accountId: env.GOOGLE_ACCOUNT_ID, locationId: env.GOOGLE_LOCATION_ID, origins, port };
}

function normalize(review) {
  const rating = RATINGS[review.starRating];
  if (!review.reviewId || !rating || !Number.isFinite(Date.parse(review.createTime)) || (review.comment !== undefined && typeof review.comment !== 'string')) throw new Error('invalid_review');
  let photoUrl = '';
  try {
    const photo = new URL(review.reviewer?.profilePhotoUrl);
    if (photo.protocol === 'https:' && (photo.hostname === 'googleusercontent.com' || photo.hostname.endsWith('.googleusercontent.com'))) photoUrl = photo.href;
  } catch { /* Een avatar is optioneel. */ }
  return {
    id: String(review.reviewId),
    author: review.reviewer?.displayName || 'Google-gebruiker',
    photoUrl,
    rating,
    text: review.comment || '',
    publishedAt: review.createTime,
    updatedAt: review.updateTime || review.createTime,
  };
}

/** Eigen geautoriseerde locatie; tijdelijke geheugencache, geen permanent reviewarchief. */
export function createReviewService(settings, { fetchImpl = fetch, now = Date.now } = {}) {
  let snapshot = null;
  let inFlight = null;
  let lastFailure = -Infinity;
  let accessToken = '';
  let tokenExpires = 0;

  async function googleJson(url, options, signal) {
    const response = await fetchImpl(url, { ...options, signal });
    if (!response.ok) {
      if (response.status === 401) { accessToken = ''; tokenExpires = 0; }
      // Google-responsebodies kunnen gevoelige informatie bevatten: nooit doorgeven/loggen.
      throw new Error('google_request_failed');
    }
    return response.json();
  }

  async function synchronize() {
    const signal = AbortSignal.timeout(60000);
    if (!accessToken || now() >= tokenExpires) {
      const token = await googleJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: settings.clientId, client_secret: settings.clientSecret, refresh_token: settings.refreshToken, grant_type: 'refresh_token' }),
      }, signal);
      if (!token.access_token || !Number.isFinite(Number(token.expires_in))) throw new Error('invalid_token_response');
      accessToken = token.access_token;
      tokenExpires = now() + Math.max(0, Number(token.expires_in) - 60) * 1000;
    }
    const collected = new Map();
    const tokens = new Set();
    let nextPageToken = '';
    let total;
    let average;
    let pages = 0;
    do {
      if (++pages > 1000) throw new Error('too_many_pages');
      const url = new URL(`https://mybusiness.googleapis.com/v4/accounts/${settings.accountId}/locations/${settings.locationId}/reviews`);
      url.searchParams.set('pageSize', '50');
      url.searchParams.set('orderBy', 'updateTime desc');
      if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);
      const page = await googleJson(url.href, { headers: { Authorization: `Bearer ${accessToken}` } }, signal);
      const pageTotal = page.totalReviewCount ?? 0;
      if (!Number.isInteger(pageTotal) || pageTotal < 0 || (total !== undefined && pageTotal !== total) || (page.reviews !== undefined && !Array.isArray(page.reviews))) throw new Error('inconsistent_page');
      total = pageTotal;
      const pageAverage = page.averageRating ?? 0;
      if (!Number.isFinite(pageAverage) || (total && (pageAverage < 1 || pageAverage > 5)) || (average !== undefined && pageAverage !== average)) throw new Error('inconsistent_rating');
      average = pageAverage;
      for (const raw of page.reviews || []) {
        const review = normalize(raw);
        if (collected.has(review.id)) throw new Error('duplicate_review');
        collected.set(review.id, review);
      }
      nextPageToken = page.nextPageToken || '';
      if (nextPageToken && tokens.has(nextPageToken)) throw new Error('repeated_page_token');
      tokens.add(nextPageToken);
    } while (nextPageToken);
    // Google meldt een pagineringsprobleem. Een onvolledige reeks vervangt nooit de cache.
    if (collected.size !== total) throw new Error('incomplete_reviews');
    const completed = {
      fetchedAt: new Date(now()).toISOString(),
      averageRating: average,
      totalReviewCount: total,
      reviews: [...collected.values()],
    };
    snapshot = completed;
    lastFailure = -Infinity;
    return completed;
  }

  async function getReviews() {
    if (snapshot && now() - Date.parse(snapshot.fetchedAt) > STALE_MS) snapshot = null;
    if (snapshot && now() - Date.parse(snapshot.fetchedAt) < FRESH_MS) return { ...snapshot, stale: false };
    if (!inFlight && now() - lastFailure >= RETRY_MS) {
      inFlight = synchronize().catch(() => { lastFailure = now(); }).finally(() => { inFlight = null; });
    }
    if (inFlight) await inFlight;
    if (snapshot && now() - Date.parse(snapshot.fetchedAt) <= STALE_MS) return { ...snapshot, stale: now() - Date.parse(snapshot.fetchedAt) >= FRESH_MS };
    snapshot = null;
    throw new Error('reviews_unavailable');
  }
  return { getReviews };
}

export function createReviewServer(settings, service = createReviewService(settings)) {
  return createServer(async (request, response) => {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', Vary: 'Origin' };
    const origin = request.headers.origin;
    if (origin && !settings.origins.includes(origin)) {
      response.writeHead(403, headers).end(JSON.stringify({ error: 'origin_not_allowed' }));
      return;
    }
    if (origin) headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    if (request.method === 'OPTIONS') { response.writeHead(204, headers).end(); return; }
    if (request.method !== 'GET') { response.writeHead(405, { ...headers, Allow: 'GET, OPTIONS' }).end(JSON.stringify({ error: 'method_not_allowed' })); return; }
    let path;
    try { path = new URL(request.url, 'http://localhost').pathname; }
    catch { response.writeHead(400, headers).end(JSON.stringify({ error: 'invalid_request' })); return; }
    if (path !== '/reviews' && path !== '/health') { response.writeHead(404, headers).end(JSON.stringify({ error: 'not_found' })); return; }
    try {
      const data = await service.getReviews();
      response.writeHead(200, headers).end(JSON.stringify(path === '/health' ? { status: data.stale ? 'degraded' : 'ok', fetchedAt: data.fetchedAt } : data));
    } catch {
      response.writeHead(503, { ...headers, 'Retry-After': '60' }).end(JSON.stringify({ error: 'reviews_unavailable' }));
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const settings = readSettings();
    const service = createReviewService(settings);
    const server = createReviewServer(settings, service);
    const refresh = () => service.getReviews().catch(() => { console.warn('Google-reviews momenteel niet beschikbaar; instellingen/toegang controleren.'); });
    server.listen(settings.port, () => { console.log(`Reviewservice luistert op poort ${settings.port}.`); refresh(); });
    const timer = setInterval(refresh, FRESH_MS);
    timer.unref();
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { clearInterval(timer); server.close(); });
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
