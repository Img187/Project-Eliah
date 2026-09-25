import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import {
  meterkastHeroIntro,
  meterkastMetaDescription,
  meterkastPageFile,
  meterkastPhrase,
  renderMeterkastRegionPage,
} from '../scripts/generate-meterkast-regios.mjs';
import {
  meterkastRegionGroups,
  meterkastRegionPageFiles,
  meterkastRegionPages,
} from '../scripts/meterkast-regios.mjs';
import { redirectPages, root } from '../scripts/prepare-pages.mjs';

const origin = 'https://www.sparkyenergies.com';
const headingId = 'elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesH1';
const introId = 'elektrotechnischeRenovatiesSectGroepenkastEnElektrotechnischeRenovatiesP01';
const regionalFiles = new Set(meterkastRegionPageFiles);
const keywords = [
  'meterkast vervangen',
  'groepenkast vervangen',
  'stoppenkast vervangen',
  'groepenkast uitbreiden',
];

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

function linkedFile(link) {
  const pathname = new URL(link.href).pathname;
  return decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1));
}

test('meterkastcluster bevat zes provincies en vier steden per provincie', () => {
  assert.equal(meterkastRegionGroups.length, 6);
  assert.equal(meterkastRegionPages.length, 30);
  assert.equal(meterkastRegionPageFiles.length, 30);
  assert.equal(regionalFiles.size, 30);
  for (const group of meterkastRegionGroups) {
    assert.equal(group.province.kind, 'province');
    assert.equal(group.cities.length, 4, `${group.province.name} moet vier steden bevatten.`);
  }
});

test('hoofdpagina en oude elektrotechniek-URL zijn SEO-consistent', async () => {
  const primaryFile = 'meterkast-vervangen.html';
  const legacyFile = 'elektrotechnische-renovaties.html';
  const primaryUrl = absoluteUrl(primaryFile);
  assert.ok(redirectPages.includes(legacyFile));
  const [primaryHtml, legacyHtml] = await Promise.all([
    readFile(join(root, primaryFile), 'utf8'),
    readFile(join(root, legacyFile), 'utf8'),
  ]);
  const primaryDom = new JSDOM(primaryHtml, { url: primaryUrl });
  const legacyDom = new JSDOM(legacyHtml, { url: absoluteUrl(legacyFile) });

  try {
    const primary = primaryDom.window.document;
    const title = singleElement(primary, 'title', `${primaryFile}: title`).textContent.trim();
    assert.equal(title, 'Meterkast en groepenkast vervangen | Sparky Energies');
    assert.equal(singleElement(primary, 'h1', `${primaryFile}: H1`).textContent.trim(), 'Meterkast en groepenkast vervangen');
    const hero = singleElement(primary, `#${introId}`, `${primaryFile}: hero-intro`).textContent.toLocaleLowerCase('nl-NL');
    for (const keyword of keywords) assert.ok(hero.includes(keyword), `${primaryFile} mist “${keyword}” in de hero-intro.`);
    assert.equal(singleElement(primary, 'link[rel="canonical"]', `${primaryFile}: canonical`).href, primaryUrl);
    assert.equal(singleElement(primary, 'meta[property="og:url"]', `${primaryFile}: og:url`).content, primaryUrl);

    const legacy = legacyDom.window.document;
    const robots = singleElement(legacy, 'meta[name="robots"]', `${legacyFile}: robots`).content
      .toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim());
    assert.ok(robots.includes('noindex'));
    assert.ok(robots.includes('follow'));
    assert.equal(singleElement(legacy, 'link[rel="canonical"]', `${legacyFile}: canonical`).href, primaryUrl);
    const refresh = singleElement(legacy, 'meta[http-equiv="refresh"]', `${legacyFile}: redirect`).content
      .match(/^\s*(\d+)\s*;\s*url\s*=\s*(.+?)\s*$/i);
    assert.ok(refresh);
    assert.equal(refresh[1], '0');
    assert.equal(new URL(refresh[2], absoluteUrl(legacyFile)).href, primaryUrl);
  } finally {
    primaryDom.window.close();
    legacyDom.window.close();
  }
});

test('alle meterkast-regiopagina\'s wijzigen alleen SEO en de bestaande hero', async () => {
  const baseFile = 'meterkast-vervangen.html';
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
  for (const [index, page] of meterkastRegionPages.entries()) {
    const file = meterkastRegionPageFiles[index];
    const expectedFile = meterkastPageFile(page);
    const expectedUrl = absoluteUrl(expectedFile);
    const phrase = meterkastPhrase(page);
    const expectedTitle = `${phrase} | Sparky Energies`;
    const expectedDescription = meterkastMetaDescription(page);
    assert.equal(file, expectedFile);
    assert.ok((await stat(join(root, file))).isFile(), `${file} ontbreekt.`);
    const dom = new JSDOM(await readFile(join(root, file), 'utf8'), { url: expectedUrl });

    try {
      const document = dom.window.document;
      const title = singleElement(document, 'title', `${file}: title`).textContent.trim();
      const description = singleElement(document, 'meta[name="description"]', `${file}: description`).content.trim();
      const canonical = singleElement(document, 'link[rel="canonical"]', `${file}: canonical`).href;
      assert.equal(title, expectedTitle);
      assert.equal(description, expectedDescription);
      assert.ok(description.length <= 165);
      assert.equal(canonical, expectedUrl);
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

      assert.equal(singleElement(document, `#${headingId}`, `${file}: H1`).textContent.trim(), phrase);
      const hero = singleElement(document, `#${introId}`, `${file}: hero-intro`).textContent.trim();
      assert.equal(hero, meterkastHeroIntro(page));
      for (const keyword of keywords) {
        assert.ok(hero.toLocaleLowerCase('nl-NL').includes(keyword), `${file} mist “${keyword}” in de hero-intro.`);
      }

      const graph = structuredData(document, file);
      const webPage = graph.filter((node) => node?.['@type'] === 'WebPage');
      const service = graph.filter((node) => node?.['@type'] === 'Service');
      assert.equal(webPage.length, 1);
      assert.equal(service.length, 1);
      assert.equal(webPage[0].url, expectedUrl);
      assert.equal(webPage[0]['@id'], `${expectedUrl}#webpage`);
      assert.equal(service[0].url, expectedUrl);
      assert.equal(service[0]['@id'], `${expectedUrl}#service`);
      assert.equal(service[0].name, phrase);
      for (const keyword of keywords) {
        assert.ok(service[0].serviceType.toLocaleLowerCase('nl-NL').includes(keyword));
      }
      const expectedArea = page.kind === 'province'
        ? { '@type': 'AdministrativeArea', name: page.name }
        : {
            '@type': 'City',
            name: page.name,
            containedInPlace: { '@type': 'AdministrativeArea', name: page.province },
          };
      assert.deepEqual(service[0].areaServed, expectedArea);

      const navigation = singleElement(document, '#primaireNavigatieLijst', `${file}: navigatie`);
      assert.equal(normalizedOuterHtml(navigation), expectedNavigation);
      assert.deepEqual([...navigation.querySelectorAll('a[href]')].map(linkedFile).filter((linked) => regionalFiles.has(linked)), []);
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

test('meterkast-regiopagina\'s zijn byte-voor-byte actueel', async () => {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(root, 'meterkast-vervangen.html'), 'utf8'),
    readFile(join(root, 'data', 'reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);
  for (const [index, page] of meterkastRegionPages.entries()) {
    const file = meterkastRegionPageFiles[index];
    const [actual, rendered] = await Promise.all([
      readFile(join(root, file)),
      renderMeterkastRegionPage(page, baseSource, endpoint),
    ]);
    assert.equal(
      Buffer.compare(actual, Buffer.from(rendered, 'utf8')),
      0,
      `${file} wijkt af van scripts/generate-meterkast-regios.mjs.`,
    );
  }
});
