import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { renderIntentPage } from '../scripts/generate-thuisbatterij-intenties.mjs';
import {
  batteryIntentPageFiles,
  batteryIntentPages,
} from '../scripts/thuisbatterij-intenties.mjs';
import { root } from '../scripts/prepare-pages.mjs';

const origin = 'https://www.sparkyenergies.com';
const baseFile = 'thuisbatterij-laten-installeren.html';
const expectedFiles = [
  'thuisbatterij-kopen.html',
  'thuisbatterij-kosten.html',
  'thuisbatterij-voor-zonnepanelen.html',
];
const heroSelector = '#thuisbatterijSectThuisbatterijLatenInstallerenP01';

function absoluteUrl(file) {
  return `${origin}/${file}`;
}

function singleElement(document, selector, label) {
  const elements = document.querySelectorAll(selector);
  assert.equal(elements.length, 1, `${label} moet exact eenmaal voorkomen.`);
  return elements[0];
}

function normalizedOuterHtml(element) {
  return element.outerHTML.replace(/\r\n?/g, '\n').replace(/>\s+</g, '><').trim();
}

function normalizedText(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function lower(value) {
  return normalizedText(value).toLocaleLowerCase('nl-NL');
}

function linkedFile(link, baseUrl) {
  const url = new URL(link.getAttribute('href'), baseUrl);
  if (url.origin !== origin) return null;
  return decodeURIComponent(url.pathname.slice(url.pathname.lastIndexOf('/') + 1));
}

function structuredData(document, file) {
  return [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script, index) => {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch (error) {
      assert.fail(`${file} bevat ongeldige JSON-LD in script ${index + 1}: ${error.message}`);
    }
    return Array.isArray(data?.['@graph']) ? data['@graph'] : [data];
  });
}

function assertUnique(items, field) {
  const values = items.map((item) => normalizedText(item[field]));
  assert.ok(values.every(Boolean), `Iedere intentie moet een niet-lege ${field} bevatten.`);
  assert.equal(new Set(values).size, values.length, `Iedere intentie moet een unieke ${field} bevatten.`);
}

test('thuisbatterijcluster bevat exact drie unieke landelijke zoekintenties', () => {
  assert.equal(batteryIntentPages.length, 3);
  assert.equal(batteryIntentPageFiles.length, 3);
  assert.deepEqual([...batteryIntentPageFiles].sort(), [...expectedFiles].sort());
  assert.deepEqual(batteryIntentPages.map((page) => page.file), batteryIntentPageFiles);

  for (const page of batteryIntentPages) {
    assert.ok(normalizedText(page.slug), `${page.file ?? 'Onbekende intentie'} mist configveld slug.`);
    assert.ok(normalizedText(page.file), `${page.slug ?? 'Onbekende intentie'} mist configveld file.`);
    assert.ok(page.file.includes(page.slug), `${page.file} moet de slug “${page.slug}” bevatten.`);
    for (const field of ['phrase', 'title', 'h1', 'metaDescription', 'hero', 'serviceType']) {
      assert.ok(normalizedText(page[field]), `${page.file} mist configveld ${field}.`);
    }
    assert.ok(normalizedText(page.intentSection?.id), `${page.file} mist intentSection.id.`);
  }

  for (const field of ['slug', 'file', 'title', 'metaDescription']) assertUnique(batteryIntentPages, field);
  assert.equal(
    new Set(batteryIntentPages.map((page) => page.intentSection.id)).size,
    batteryIntentPages.length,
    'Iedere intentie moet een uniek intentsection-ID hebben.',
  );
});

test('landelijke thuisbatterijpagina\'s hebben unieke inhoud en consistente SEO-signalen', async () => {
  const baseHtml = await readFile(join(root, baseFile), 'utf8');
  const baseDom = new JSDOM(baseHtml, { url: absoluteUrl(baseFile) });
  let expectedHeader;
  let expectedNavigation;
  let expectedFooter;

  try {
    const { document } = baseDom.window;
    expectedHeader = normalizedOuterHtml(singleElement(document, 'body > header', `${baseFile}: header`));
    expectedNavigation = normalizedOuterHtml(singleElement(document, '#primaireNavigatieLijst', `${baseFile}: hoofdnavigatie`));
    expectedFooter = normalizedOuterHtml(singleElement(document, 'body > footer', `${baseFile}: footer`));
  } finally {
    baseDom.window.close();
  }

  const renderedMains = [];
  const seoRecords = [];

  for (const page of batteryIntentPages) {
    const file = page.file;
    const url = absoluteUrl(file);
    assert.ok((await stat(join(root, file))).isFile(), `${file} moet als regulier bestand bestaan.`);

    const html = await readFile(join(root, file), 'utf8');
    const dom = new JSDOM(html, { url });
    try {
      const { document } = dom.window;
      const title = normalizedText(singleElement(document, 'title', `${file}: title`).textContent);
      const description = normalizedText(
        singleElement(document, 'meta[name="description"]', `${file}: meta description`).getAttribute('content'),
      );
      const canonical = singleElement(document, 'link[rel="canonical"]', `${file}: canonical`).href;
      const h1 = normalizedText(singleElement(document, 'h1', `${file}: H1`).textContent);
      const hero = normalizedText(singleElement(document, heroSelector, `${file}: hero`).textContent);

      assert.equal(title, page.title);
      assert.equal(description, page.metaDescription);
      assert.equal(h1, page.h1);
      assert.equal(hero, page.hero);
      assert.ok(lower(title).includes(lower(page.phrase)), `${file}: title mist “${page.phrase}”.`);
      assert.ok(lower(description).includes(lower(page.phrase)), `${file}: meta description mist “${page.phrase}”.`);
      assert.ok(lower(h1).includes(lower(page.phrase)), `${file}: H1 mist “${page.phrase}”.`);
      assert.ok(lower(hero).includes(lower(page.phrase)), `${file}: hero mist “${page.phrase}”.`);
      assert.ok(file.toLocaleLowerCase('nl-NL').includes(page.slug.toLocaleLowerCase('nl-NL')));

      assert.equal(canonical, url);
      assert.equal(singleElement(document, 'meta[property="og:title"]', `${file}: og:title`).content, title);
      assert.equal(singleElement(document, 'meta[property="og:description"]', `${file}: og:description`).content, description);
      assert.equal(singleElement(document, 'meta[property="og:url"]', `${file}: og:url`).content, url);
      assert.equal(singleElement(document, 'meta[name="twitter:title"]', `${file}: twitter:title`).content, title);
      assert.equal(singleElement(document, 'meta[name="twitter:description"]', `${file}: twitter:description`).content, description);

      const robots = singleElement(document, 'meta[name="robots"]', `${file}: robots`).content
        .toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim()).filter(Boolean);
      assert.ok(robots.includes('index'), `${file} moet index toestaan.`);
      assert.ok(robots.includes('follow'), `${file} moet follow toestaan.`);
      assert.ok(!robots.includes('noindex'), `${file} mag geen noindex bevatten.`);
      assert.ok(!robots.includes('nofollow'), `${file} mag geen nofollow bevatten.`);

      const graph = structuredData(document, file);
      const webPages = graph.filter((node) => node?.['@type'] === 'WebPage');
      const services = graph.filter((node) => node?.['@type'] === 'Service');
      assert.equal(webPages.length, 1, `${file} moet exact één WebPage-object bevatten.`);
      assert.equal(services.length, 1, `${file} moet exact één Service-object bevatten.`);
      const [webPage] = webPages;
      const [service] = services;
      assert.equal(webPage['@id'], `${url}#webpage`);
      assert.equal(webPage.url, url);
      assert.equal(webPage.name, title);
      assert.equal(webPage.description, description);
      assert.deepEqual(webPage.mainEntity, { '@id': `${url}#service` });
      assert.equal(service['@id'], `${url}#service`);
      assert.equal(service.url, url);
      assert.equal(service.name, page.h1);
      assert.equal(service.description, description);
      assert.equal(service.serviceType, page.serviceType);
      assert.deepEqual(service.areaServed, { '@type': 'Country', name: 'Nederland' });

      const navigation = singleElement(document, '#primaireNavigatieLijst', `${file}: hoofdnavigatie`);
      assert.equal(normalizedOuterHtml(navigation), expectedNavigation);
      assert.deepEqual(
        [...navigation.querySelectorAll('a[href]')]
          .map((link) => linkedFile(link, url))
          .filter((linked) => batteryIntentPageFiles.includes(linked)),
        [],
        `${file}: landelijke intentiepagina's horen niet in de hoofdnavigatie.`,
      );
      assert.equal(normalizedOuterHtml(singleElement(document, 'body > header', `${file}: header`)), expectedHeader);
      assert.equal(normalizedOuterHtml(singleElement(document, 'body > footer', `${file}: footer`)), expectedFooter);
      assert.equal(document.querySelectorAll('.regioBreadcrumb').length, 0, `${file} mag geen regiobreadcrumb bevatten.`);
      assert.ok(document.getElementById(page.intentSection.id), `${file} mist intentsection #${page.intentSection.id}.`);
      assert.equal(
        [...document.querySelectorAll('[id]')].filter((element) => element.id === page.intentSection.id).length,
        1,
        `${file} moet intentsection #${page.intentSection.id} exact eenmaal bevatten.`,
      );

      const main = singleElement(document, '#mainContent', `${file}: hoofdinhoud`);
      renderedMains.push(normalizedOuterHtml(main));
      seoRecords.push({ title, description, canonical });
    } finally {
      dom.window.close();
    }
  }

  assert.equal(new Set(renderedMains).size, batteryIntentPages.length, 'Iedere intentiepagina moet unieke hoofdinhoud hebben.');
  for (const field of ['title', 'description', 'canonical']) assertUnique(seoRecords, field);
});

test('de primaire thuisbatterijpagina linkt crawlbaar naar alle landelijke intenties', async () => {
  const dom = new JSDOM(await readFile(join(root, baseFile), 'utf8'), { url: absoluteUrl(baseFile) });
  try {
    const links = [...dom.window.document.querySelectorAll('#mainContent a[href]')];
    for (const file of batteryIntentPageFiles) {
      const matching = links.filter((link) => linkedFile(link, absoluteUrl(baseFile)) === file);
      assert.ok(matching.length >= 1, `${baseFile} mist een crawlbare inhoudslink naar ${file}.`);
      for (const link of matching) {
        const rel = (link.getAttribute('rel') ?? '').toLocaleLowerCase('nl-NL').split(/\s+/).filter(Boolean);
        assert.ok(!rel.includes('nofollow'), `${baseFile}: link naar ${file} mag geen nofollow hebben.`);
        assert.equal(link.closest('[hidden]'), null, `${baseFile}: link naar ${file} mag niet verborgen zijn.`);
        assert.notEqual(link.getAttribute('aria-disabled'), 'true', `${baseFile}: link naar ${file} moet bruikbaar zijn.`);
      }
    }
  } finally {
    dom.window.close();
  }
});

test('gegenereerde landelijke thuisbatterijpagina\'s zijn byte-voor-byte actueel', async () => {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(root, baseFile), 'utf8'),
    readFile(join(root, 'data', 'reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);

  for (const page of batteryIntentPages) {
    const [actual, rendered] = await Promise.all([
      readFile(join(root, page.file)),
      renderIntentPage(page, baseSource, endpoint),
    ]);
    assert.equal(
      Buffer.compare(actual, Buffer.from(rendered, 'utf8')),
      0,
      `${page.file} wijkt af van de generator; voer node scripts/generate-thuisbatterij-intenties.mjs uit.`,
    );
  }
});
