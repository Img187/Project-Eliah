import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import {
  laadpaalRegionDescription,
  laadpaalRegionHeroIntro,
  laadpaalRegionPhrase,
  laadpaalRegionPageUrl,
  renderLaadpaalRegionPage,
} from '../scripts/generate-laadpaal-regios.mjs';
import {
  laadpaalAudiences,
  laadpaalRegionGroups,
  laadpaalRegionPageEntries,
  laadpaalRegionPageFile,
  laadpaalRegionPageFiles,
  laadpaalRegionPages,
} from '../scripts/laadpaal-regios.mjs';
import { pages, root } from '../scripts/prepare-pages.mjs';

const origin = 'https://www.sparkyenergies.com';
const baseFile = 'laadpalen.html';
const headingId = 'laadpalenSectLaadpaalLatenInstallerenH1';
const introId = 'laadpalenSectLaadpaalLatenInstallerenP01';
const regionalFiles = new Set(laadpaalRegionPageFiles);

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

test('laadpaalcluster bevat twee doelgroepen en dertig regio\'s per doelgroep', () => {
  assert.equal(laadpaalRegionGroups.length, 6);
  assert.equal(laadpaalRegionPages.length, 30);
  assert.equal(laadpaalAudiences.length, 2);
  assert.equal(laadpaalRegionPageEntries.length, 60);
  assert.equal(laadpaalRegionPageFiles.length, 60);
  assert.equal(regionalFiles.size, 60);

  for (const group of laadpaalRegionGroups) {
    assert.equal(group.province.kind, 'province');
    assert.equal(group.cities.length, 4, `${group.province.name} moet vier steden bevatten.`);
  }
  for (const file of laadpaalRegionPageFiles) {
    assert.ok(pages.includes(file), `${file} ontbreekt in de publieke paginalijst.`);
  }
});

test('alle laadpaal-regiopagina\'s stemmen URL, title, H1 en hero-P per doelgroep op elkaar af', async () => {
  const baseHtml = await readFile(join(root, baseFile), 'utf8');
  const baseDom = new JSDOM(baseHtml, { url: absoluteUrl(baseFile) });
  let expectedHeader;
  let expectedNavigation;
  let expectedFooter;
  let expectedMain;
  let baseHeading;
  let baseIntro;

  try {
    const document = baseDom.window.document;
    expectedHeader = normalizedOuterHtml(singleElement(document, 'body > header', `${baseFile}: header`));
    expectedNavigation = normalizedOuterHtml(singleElement(document, '#primaireNavigatieLijst', `${baseFile}: navigatie`));
    expectedFooter = normalizedOuterHtml(singleElement(document, 'body > footer', `${baseFile}: footer`));
    expectedMain = normalizedOuterHtml(singleElement(document, '#mainContent', `${baseFile}: main`));
    baseHeading = singleElement(document, `#${headingId}`, `${baseFile}: hero-H1`).textContent;
    baseIntro = singleElement(document, `#${introId}`, `${baseFile}: hero-intro`).textContent;
  } finally {
    baseDom.window.close();
  }

  const unique = { title: new Set(), description: new Set(), canonical: new Set() };
  for (const { page, audience } of laadpaalRegionPageEntries) {
    const file = laadpaalRegionPageFile(page, audience);
    const expectedUrl = laadpaalRegionPageUrl(page, audience);
    const phrase = audience.key === 'bedrijven'
      ? `Zakelijke laadpaal plaatsen in ${page.searchName}`
      : `Laadpaal thuis laten installeren in ${page.searchName}`;
    const expectedPrefix = audience.key === 'bedrijven'
      ? 'zakelijke-laadpaal-plaatsen-in-'
      : 'laadpaal-thuis-laten-installeren-in-';
    assert.equal(file, `${expectedPrefix}${page.slug}.html`);
    assert.equal(laadpaalRegionPhrase(page, audience), phrase);
    const expectedTitle = `${phrase} | Sparky Energies`;
    const expectedDescription = laadpaalRegionDescription(page, audience);
    const expectedIntro = laadpaalRegionHeroIntro(page, audience);

    assert.equal(expectedUrl, absoluteUrl(file));
    assert.ok((await stat(join(root, file))).isFile(), `${file} ontbreekt.`);
    const dom = new JSDOM(await readFile(join(root, file), 'utf8'), { url: expectedUrl });

    try {
      const document = dom.window.document;
      const title = singleElement(document, 'title', `${file}: title`).textContent.trim();
      const description = singleElement(document, 'meta[name="description"]', `${file}: description`).content.trim();
      const canonical = singleElement(document, 'link[rel="canonical"]', `${file}: canonical`).href;
      const h1 = singleElement(document, `#${headingId}`, `${file}: H1`).textContent.trim();
      const intro = singleElement(document, `#${introId}`, `${file}: hero-intro`).textContent.trim();

      assert.equal(title, expectedTitle);
      assert.equal(description, expectedDescription);
      assert.ok(description.length <= 165);
      assert.equal(canonical, expectedUrl);
      assert.equal(h1, phrase);
      assert.equal(intro, expectedIntro);
      assert.ok(intro.toLocaleLowerCase('nl-NL').includes(phrase.toLocaleLowerCase('nl-NL')));
      assert.ok(title.toLocaleLowerCase('nl-NL').includes(phrase.toLocaleLowerCase('nl-NL')));
      assert.ok(intro.toLocaleLowerCase('nl-NL').includes(phrase.toLocaleLowerCase('nl-NL')));
      assert.ok(expectedUrl.includes(file));
      assert.ok(!/voor-(?:particulieren|bedrijven)/.test(file), `${file} bevat een interne doelgroepnotitie.`);
      assert.ok(!/voor (?:particulieren|bedrijven)/i.test(`${title}\n${h1}\n${intro}`), `${file} toont een interne doelgroepnotitie.`);

      assert.equal(singleElement(document, 'meta[property="og:title"]', `${file}: og:title`).content, title);
      assert.equal(singleElement(document, 'meta[property="og:description"]', `${file}: og:description`).content, description);
      assert.equal(singleElement(document, 'meta[property="og:url"]', `${file}: og:url`).content, expectedUrl);
      assert.equal(singleElement(document, 'meta[name="twitter:title"]', `${file}: twitter:title`).content, title);
      assert.equal(singleElement(document, 'meta[name="twitter:description"]', `${file}: twitter:description`).content, description);
      for (const [field, value] of Object.entries({ title, description, canonical })) {
        assert.ok(!unique[field].has(value), `${file} heeft een dubbele ${field}.`);
        unique[field].add(value);
      }

      const robots = singleElement(document, 'meta[name="robots"]', `${file}: robots`).content
        .toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim());
      assert.ok(robots.includes('index'));
      assert.ok(robots.includes('follow'));
      assert.ok(!robots.includes('noindex'));

      const graph = structuredData(document, file);
      const webPages = graph.filter((node) => node?.['@type'] === 'WebPage');
      const services = graph.filter((node) => node?.['@type'] === 'Service');
      assert.equal(webPages.length, 1);
      assert.equal(services.length, 1);
      assert.equal(webPages[0].url, expectedUrl);
      assert.equal(webPages[0]['@id'], `${expectedUrl}#webpage`);
      assert.equal(services[0].url, expectedUrl);
      assert.equal(services[0]['@id'], `${expectedUrl}#service`);
      assert.equal(services[0].name, phrase);
      const expectedArea = page.kind === 'province'
        ? { '@type': 'AdministrativeArea', name: page.name }
        : {
            '@type': 'City',
            name: page.name,
            containedInPlace: { '@type': 'AdministrativeArea', name: page.province },
          };
      assert.deepEqual(services[0].areaServed, expectedArea);

      const navigation = singleElement(document, '#primaireNavigatieLijst', `${file}: navigatie`);
      assert.equal(normalizedOuterHtml(navigation), expectedNavigation);
      assert.equal(normalizedOuterHtml(singleElement(document, 'body > header', `${file}: header`)), expectedHeader);
      assert.equal(normalizedOuterHtml(singleElement(document, 'body > footer', `${file}: footer`)), expectedFooter);
      assert.equal(document.querySelectorAll('.regioBreadcrumb').length, 0, `${file} mag geen breadcrumb hebben.`);

      const normalizedMain = singleElement(document, '#mainContent', `${file}: main`).cloneNode(true);
      singleElement(normalizedMain, `#${headingId}`, `${file}: gekloonde H1`).textContent = baseHeading;
      singleElement(normalizedMain, `#${introId}`, `${file}: gekloonde intro`).textContent = baseIntro;
      assert.equal(
        normalizedOuterHtml(normalizedMain),
        expectedMain,
        `${file} mag zichtbaar alleen de hero-H1 en hero-paragraaf wijzigen.`,
      );
    } finally {
      dom.window.close();
    }
  }
});

test('alle laadpaal-regiopagina\'s staan exact eenmaal in de sitemap', async () => {
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const dom = new JSDOM(sitemap, { contentType: 'application/xml' });
  try {
    const locations = [...dom.window.document.getElementsByTagName('loc')].map((node) => node.textContent.trim());
    for (const file of laadpaalRegionPageFiles) {
      const expected = absoluteUrl(file);
      assert.equal(locations.filter((location) => location === expected).length, 1, `${expected} moet exact eenmaal voorkomen.`);
    }
  } finally {
    dom.window.close();
  }
});

test('gegenereerde laadpaal-regiopagina\'s zijn byte-voor-byte actueel', async () => {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(root, baseFile), 'utf8'),
    readFile(join(root, 'data/reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);
  for (const { page, audience } of laadpaalRegionPageEntries) {
    const file = laadpaalRegionPageFile(page, audience);
    const [actual, rendered] = await Promise.all([
      readFile(join(root, file)),
      renderLaadpaalRegionPage(page, audience, baseSource, endpoint),
    ]);
    assert.equal(
      Buffer.compare(actual, Buffer.from(rendered, 'utf8')),
      0,
      `${file} wijkt af van scripts/generate-laadpaal-regios.mjs.`,
    );
  }
});
