// Alleen lokale QA: synthetische reviews, nooit een Google-bron of productieservice.
// Start vanuit de repo: node tests/reviews-preview-server.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
let count = 7;
let failure = false;
let expired = false;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:5501');
  const send = (status, data) => res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
  if (url.pathname === '/qa-case' && req.method === 'POST') {
    count = Math.max(0, Math.min(12, Number(url.searchParams.get('count') || 7)));
    failure = url.searchParams.get('failure') === '1';
    expired = url.searchParams.get('expired') === '1';
    send(200, { count, failure, expired });
    return;
  }
  if (url.pathname === '/data/reviews-config.json') { send(200, { endpoint: 'http://127.0.0.1:5501/qa-reviews' }); return; }
  if (url.pathname === '/qa-reviews') {
    if (failure) { send(503, { error: 'qa_failure' }); return; }
    const reviews = Array.from({ length: count }, (_, index) => ({
      id: `qa-${index + 1}`, author: `Testreview ${index + 1}`, photoUrl: '', rating: index % 5 + 1,
      text: index === 1 ? '' : index === 2 ? '<img src=x onerror=alert(1)> Dit moet letterlijk tekst blijven.' : `Dit is testreview ${index + 1}, uitsluitend voor controle van de weergave en het wisselen.`,
      publishedAt: new Date(Date.UTC(2026, 8, 14 - index)).toISOString(),
    }));
    send(200, { fetchedAt: new Date(Date.now() - (expired ? 90000000 : 0)).toISOString(), totalReviewCount: count, averageRating: count ? 3 : 0, reviews });
    return;
  }
  if (url.pathname !== '/index.html' && !url.pathname.startsWith('/assets/')) { send(404, {}); return; }
  const path = resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!path.startsWith(resolve(root) + sep)) { send(403, {}); return; }
  try {
    let body = await readFile(path);
    if (url.pathname === '/index.html') {
      body = Buffer.from(body.toString('utf8').replace('<title>', '<title>TESTDATA — ').replace(/<script[^>]+src="assets\/js\/cookie-consent\.js"[^>]*><\/script>/, ''));
    }
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  } catch { send(404, {}); }
}).listen(5501, '127.0.0.1', () => console.log('Uitsluitend testdata: http://127.0.0.1:5501/index.html'));
