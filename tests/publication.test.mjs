import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { root, pages, redirectPages, utilityPages, publishedHtmlPages, publicFiles, secureHtml } from '../scripts/prepare-pages.mjs';

const origin = 'https://www.sparkyenergies.com';
const homepageUrl = `${origin}/homepage`;
const publicPageUrl = page => page === 'homepage.html' ? homepageUrl : page === 'bedankt.html' ? `${origin}/bedankt` : `${origin}/${page}`;
const publicPathToFile = pathname => {
  const path = decodeURIComponent(pathname.slice(1));
  if (!path) return 'index.html';
  return ['homepage', 'bedankt'].includes(path) ? `${path}.html` : path;
};

test('publicatielijst sluit interne code en documenten uit en bevat alle lokale paginabronnen', async () => {
  const files = await publicFiles();
  assert.equal(files.filter(file => file.endsWith('.html')).length, publishedHtmlPages.length);
  assert.ok(files.every(file => !/^(?:server|tests|docs|tools|scripts|\.git|\.github)\//.test(file)));
  assert.ok(!files.includes('section-index.html'));
  assert.ok(!files.includes('data/section-index.json'));
  assert.ok(!files.includes('assets/js/projecten.js'));
  assert.ok(!files.includes('assets/css/home-overzichten.css'));
  assert.ok(!files.includes('data/projecten.json'));
  assert.ok(files.every(file => !/\.(?:md|ttf|otf|env|pem|key)$/.test(file)));
  for (const page of publishedHtmlPages) {
    const dom = new JSDOM(await readFile(join(root, page), 'utf8'), { url: publicPageUrl(page) });
    try {
      for (const node of dom.window.document.querySelectorAll('[src], link[href], a[href]')) {
        const raw = node.getAttribute('src') ?? node.getAttribute('href');
        const url = new URL(raw, dom.window.location.href);
        if (url.origin !== dom.window.location.origin) continue;
        const file = publicPathToFile(url.pathname);
        if (pages.includes(page)) assert.ok(!redirectPages.includes(file), `${page} verwijst nog naar legacy-URL ${file}.`);
        assert.ok(files.includes(file), `${page} verwijst naar uitgesloten bestand ${file}`);
        assert.ok((await stat(join(root, file))).isFile());
      }
    } finally { dom.window.close(); }
  }
});

test('alle contentpagina\'s verwijzen rechtstreeks naar homepage.html', async () => {
  for (const page of pages) {
    const dom = new JSDOM(await readFile(join(root, page), 'utf8'));
    try {
      const document = dom.window.document;
      assert.equal(document.querySelectorAll('a[href="index.html"]').length, 0, `${page} bevat nog een zichtbare index.html-link.`);
      assert.equal(document.querySelectorAll('a[href="/"]').length, 0, `${page} bevat nog een homepage-link naar /.`);
      assert.equal(document.querySelectorAll('a[href="/homepage"]').length, 0, `${page} bevat nog een indirecte /homepage-link.`);
      assert.equal(document.querySelectorAll('a[href="homepage.html"]').length, 4, `${page} moet vier verwijzingen naar homepage.html bevatten.`);
      assert.equal(document.querySelectorAll('a.skipLink[href="#mainContent"]').length, 1, `${page} mist de directe inhoudslink.`);
    } finally { dom.window.close(); }
  }
});

test('root verwijst naar homepage.html en homepage-SEO gebruikt de schone /homepage-URL', async () => {
  assert.ok(pages.includes('homepage.html'));
  assert.ok(!pages.includes('index.html'));
  assert.ok(redirectPages.includes('index.html'));

  const redirect = new JSDOM(await readFile(join(root, 'index.html'), 'utf8'), { url: `${origin}/` });
  try {
    const document = redirect.window.document;
    assert.match(document.querySelector('meta[name="robots"]')?.content || '', /^noindex,follow$/i);
    assert.equal(document.querySelector('meta[http-equiv="refresh"]')?.content, '0; url=homepage.html');
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, homepageUrl);
    assert.equal(document.querySelector('body a')?.href, `${origin}/homepage.html`);
  } finally { redirect.window.close(); }

  const homepage = new JSDOM(await readFile(join(root, 'homepage.html'), 'utf8'), { url: homepageUrl });
  try {
    const document = homepage.window.document;
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, homepageUrl);
    assert.equal(document.querySelector('meta[property="og:url"]')?.content, homepageUrl);
    const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
    const electrician = graph.find(item => item['@type'] === 'Electrician');
    const website = graph.find(item => item['@type'] === 'WebSite');
    const webpage = graph.find(item => item['@type'] === 'WebPage');
    assert.equal(electrician.url, homepageUrl);
    assert.equal(website.url, homepageUrl);
    assert.equal(webpage.url, homepageUrl);
    assert.equal(webpage['@id'], `${homepageUrl}#webpage`);
  } finally { homepage.window.close(); }
});

test('bedankpagina is openbaar bereikbaar en meetbaar, maar niet indexeerbaar of in de sitemap', async () => {
  assert.ok(utilityPages.includes('bedankt.html'));
  assert.ok(!pages.includes('bedankt.html'));
  assert.ok(!redirectPages.includes('bedankt.html'));
  const files = await publicFiles();
  assert.ok(files.includes('bedankt.html'));
  assert.ok(files.includes('assets/js/bedankt.js'));
  const dom = new JSDOM(await readFile(join(root, 'bedankt.html'), 'utf8'), { url: `${origin}/bedankt` });
  try {
    const document = dom.window.document;
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, `${origin}/bedankt`);
    assert.equal(document.querySelector('meta[property="og:url"]')?.content, `${origin}/bedankt`);
    assert.equal(document.querySelector('meta[name="robots"]')?.content, 'noindex,follow');
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.match(document.querySelector('h1').textContent, /Bedankt voor uw aanvraag/);
    assert.equal(document.querySelectorAll('form').length, 0);
    assert.equal(document.querySelector('#bedanktTerugNaarHome')?.href, `${origin}/homepage.html`);
    const scripts = [...document.querySelectorAll('script[src]')].map(script => script.getAttribute('src'));
    assert.equal(scripts.filter(src => src === 'assets/js/bedankt.js').length, 1);
    assert.ok(scripts.indexOf('assets/js/cookie-consent.js') < scripts.indexOf('assets/js/bedankt.js'));
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    assert.equal(new Set(ids).size, ids.length, 'De bedankpagina bevat dubbele IDs.');
  } finally { dom.window.close(); }
  assert.doesNotMatch(await readFile(join(root, 'sitemap.xml'), 'utf8'), /\/bedankt(?:\.html)?(?:<|\/)/);
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

test('CSP laat de vaste Google-meet- en previewbronnen toe zonder extra scriptrechten', () => {
  const html = secureHtml('<head><meta charset="utf-8" /><script type="application/ld+json">{"@type":"WebPage"}</script></head>');
  const dom = new JSDOM(html);
  try {
    const policy = dom.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]').content;
    const directives = new Map(policy.split('; ').map(rule => {
      const [name, ...sources] = rule.split(' ');
      return [name, sources];
    }));
    const previewResources = {
      'script-src': ['https://www.googletagmanager.com', 'https://tagmanager.google.com'],
      'style-src': ['https://www.googletagmanager.com', 'https://tagmanager.google.com', 'https://fonts.googleapis.com'],
      'font-src': ['https://fonts.gstatic.com', 'data:'],
      'img-src': ['https://www.googletagmanager.com', 'https://ssl.gstatic.com', 'https://www.gstatic.com', 'https://fonts.gstatic.com'],
    };
    for (const [directive, resources] of Object.entries(previewResources)) {
      for (const resource of resources) assert.ok(directives.get(directive).includes(resource), `${directive} blokkeert ${resource}`);
    }
    // Waargenomen meetroutes plus de generieke Google-origin en terugval op afbeeldingen.
    // Er worden alleen origins gecontroleerd, zonder meetverzoeken.
    for (const [directive, request] of [
      ['img-src', 'https://www.google.nl/ads/ga-audiences'],
      ['img-src', 'https://www.google.com/ads/ga-audiences'],
      ['connect-src', 'https://stats.g.doubleclick.net/g/collect'],
      ['img-src', 'https://stats.g.doubleclick.net/g/collect'],
      ['connect-src', 'https://www.google.nl/ads/ga-audiences'],
    ]) {
      assert.ok(directives.get(directive).includes(new URL(request).origin), `${directive} blokkeert ${request}`);
    }
    const scripts = directives.get('script-src');
    assert.ok(scripts.some(source => /^'sha256-[A-Za-z0-9+/]+=*'$/.test(source)), 'De JSON-LD-hash moet behouden blijven.');
    assert.ok(scripts.every(source => ["'self'", ...previewResources['script-src']].includes(source) || /^'sha256-[A-Za-z0-9+/]+=*'$/.test(source)), 'Scripts mogen geen brede of onveilige uitzondering krijgen.');
    assert.deepEqual(directives.get('script-src-attr'), ["'none'"]);
    assert.deepEqual(directives.get('default-src'), ["'none'"]);
    assert.deepEqual(directives.get('object-src'), ["'none'"]);
    assert.deepEqual(directives.get('frame-src'), ['https://www.google.com']);
  } finally { dom.window.close(); }
});

test('alle contentpagina\'s en de bedankpagina laden dezelfde consent-gestuurde GTM-container', async () => {
  const analyticsSource = await readFile(join(root, 'assets/js/cookie-consent.js'), 'utf8');
  const measurementId = analyticsSource.match(/const MEASUREMENT_ID = '(G-[A-Z0-9]+)'/)?.[1];
  assert.equal(measurementId, 'G-87KMB19788');
  assert.match(analyticsSource, /const TAG_MANAGER_ID = 'GTM-WLFHDLMC'/);
  assert.match(analyticsSource, /googletagmanager\.com\/gtm\.js\?id=/);
  assert.doesNotMatch(analyticsSource, /googletagmanager\.com\/gtag\/js|gtag\('config'/);
  assert.match(analyticsSource, /currentChoice !== CHOICE_FULL/);

  for (const page of [...pages, ...utilityPages]) {
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
