import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { root, pages, publishedHtmlPages, publicFiles, secureHtml } from '../scripts/prepare-pages.mjs';

test('publicatielijst sluit interne code en documenten uit en bevat alle lokale paginabronnen', async () => {
  const files = await publicFiles();
  assert.equal(files.filter(file => file.endsWith('.html')).length, publishedHtmlPages.length);
  assert.ok(files.every(file => !/^(?:server|tests|docs|tools|scripts|\.git|\.github)\//.test(file)));
  assert.ok(!files.includes('section-index.html'));
  assert.ok(!files.includes('data/section-index.json'));
  assert.ok(files.every(file => !/\.(?:md|ttf|otf|env|pem|key)$/.test(file)));
  for (const page of publishedHtmlPages) {
    const dom = new JSDOM(await readFile(join(root, page), 'utf8'), { url: `https://www.sparkyenergies.com/${page}` });
    try {
      for (const node of dom.window.document.querySelectorAll('[src], link[href], a[href]')) {
        const raw = node.getAttribute('src') ?? node.getAttribute('href');
        const url = new URL(raw, dom.window.location.href);
        if (url.origin !== dom.window.location.origin) continue;
        const file = decodeURIComponent(url.pathname.slice(1)) || 'index.html';
        if (pages.includes(page)) assert.notEqual(file, 'thuisbatterijen.html', `${page} verwijst nog naar de legacy-URL.`);
        assert.ok(files.includes(file), `${page} verwijst naar uitgesloten bestand ${file}`);
        assert.ok((await stat(join(root, file))).isFile());
      }
    } finally { dom.window.close(); }
  }
});

test('alle pagina’s bevatten actuele CSP vóór resources, zonder uitvoerbare inline scripts', async () => {
  const { endpoint } = JSON.parse(await readFile(join(root, 'data/reviews-config.json'), 'utf8'));
  for (const page of publishedHtmlPages) {
    const html = (await readFile(join(root, page), 'utf8')).replace(/\r\n/g, '\n');
    assert.equal(html, secureHtml(html, endpoint), `CSP synchroniseren in ${page}`);
    const dom = new JSDOM(html);
    try {
      const document = dom.window.document;
      const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
      const scriptPolicy = policy.split('; ').find(rule => rule.startsWith('script-src '));
      assert.doesNotMatch(scriptPolicy, /unsafe-inline|unsafe-eval/);
      assert.match(policy, /base-uri 'none'/);
      assert.match(policy, /object-src 'none'/);
      assert.match(policy, /form-action https:\/\/formspree\.io/);
      const firstScript = html.indexOf('<script');
      assert.ok(firstScript === -1 || html.indexOf('Content-Security-Policy') < firstScript);
      if (pages.includes(page)) assert.ok(html.indexOf('network.js') < html.indexOf('main.js'));
      for (const node of document.querySelectorAll('*')) {
        assert.ok([...node.attributes].every(attr => !/^on/i.test(attr.name)), 'Geen inline eventhandlers');
      }
    } finally { dom.window.close(); }
  }
});

test('alle indexeerbare contentpagina\'s laden dezelfde consent-gestuurde Google-tag', async () => {
  const analyticsSource = await readFile(join(root, 'assets/js/cookie-consent.js'), 'utf8');
  const measurementId = analyticsSource.match(/const MEASUREMENT_ID = '(G-[A-Z0-9]+)'/)?.[1];
  assert.equal(measurementId, 'G-87KMB19788');
  assert.match(analyticsSource, /googletagmanager\.com\/gtag\/js\?id=/);
  assert.match(analyticsSource, /currentChoice !== CHOICE_FULL/);

  for (const page of pages) {
    const html = await readFile(join(root, page), 'utf8');
    const dom = new JSDOM(html);
    try {
      const document = dom.window.document;
      assert.equal(
        document.querySelectorAll('script[src="assets/js/cookie-consent.js"]').length,
        1,
        `${page} moet de Google-tagloader exact eenmaal laden.`,
      );
      const policy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content ?? '';
      assert.match(policy, /script-src[^;]*https:\/\/www\.googletagmanager\.com/, `${page} blokkeert de Google-tag.`);
      assert.match(policy, /connect-src[^;]*https:\/\/\*\.google-analytics\.com/, `${page} blokkeert Analytics-metingen.`);
    } finally { dom.window.close(); }
  }
});

test('buildbeleid weigert uitvoerbare inline scripts en onveilige review-endpoints', () => {
  const basic = '<head><meta charset="utf-8" /></head>';
  assert.throws(() => secureHtml(basic + '<script>alert(1)</script>'));
  assert.throws(() => secureHtml(basic + '<script data-src="fixture">alert(1)</script>'));
  assert.throws(() => secureHtml('<head></head>'));
  assert.throws(() => secureHtml(basic, 'http://reviews.example/reviews'));
  assert.throws(() => secureHtml(basic, 'https://user:password@reviews.example/reviews'));
  assert.throws(() => secureHtml(basic, 'https://x".example/reviews'));
  assert.match(secureHtml(basic, 'https://reviews.example/reviews'), /connect-src[^;]+https:\/\/reviews\.example/);
});
