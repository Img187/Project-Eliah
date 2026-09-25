import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { root, pages, redirectPages } from '../scripts/prepare-pages.mjs';
import { regionPages, regionPageFiles, regionGroups } from '../scripts/thuisbatterij-regios.mjs';
import { renderRegionPage } from '../scripts/generate-thuisbatterij-regios.mjs';

const origin = 'https://www.sparkyenergies.com';
const regionFileSet = new Set(regionPageFiles);

function absoluteUrl(file) {
  return file === 'index.html' ? `${origin}/` : `${origin}/${file}`;
}

function linkedFile(link) {
  const pathname = new URL(link.href).pathname;
  return decodeURIComponent(pathname.slice(pathname.lastIndexOf('/') + 1));
}

function singleElement(document, selector, label) {
  const elements = document.querySelectorAll(selector);
  assert.equal(elements.length, 1, `${label} moet exact eenmaal voorkomen.`);
  return elements[0];
}

function structuredData(document, file) {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  assert.ok(scripts.length > 0, `${file} mist JSON-LD.`);
  return scripts.flatMap((script, index) => {
    let data;
    try {
      data = JSON.parse(script.textContent);
    } catch (error) {
      assert.fail(`${file} bevat ongeldige JSON-LD in script ${index + 1}: ${error.message}`);
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.['@graph'])) return data['@graph'];
    return [data];
  });
}

function hasType(node, type) {
  const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
  return types.includes(type);
}

function assertUnique(records, field) {
  const seen = new Map();
  for (const record of records) {
    assert.ok(record[field], `${record.file} mist ${field}.`);
    assert.ok(!seen.has(record[field]), `${field} van ${record.file} dupliceert ${seen.get(record[field])}.`);
    seen.set(record[field], record.file);
  }
}

function normalizedOuterHtml(element) {
  return element.outerHTML
    .replace(/\r\n?/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();
}

function topLevelMainSections(document, file) {
  const main = singleElement(document, '#mainContent', `${file}: hoofdinhoud`);
  return [...main.children].filter((element) => element.tagName === 'SECTION');
}

test('regioconfiguratie bevat zes provinciegroepen en dertig unieke pagina\'s', () => {
  assert.equal(regionGroups.length, 6);
  assert.equal(regionPages.length, 30);
  assert.equal(regionPageFiles.length, 30);
  assert.equal(regionFileSet.size, 30, 'Iedere regiopagina moet een unieke bestandsnaam hebben.');

  for (const group of regionGroups) {
    assert.equal(group.province.kind, 'province', `${group.province.name} moet als provincie zijn gemarkeerd.`);
    assert.equal(group.cities.length, 4, `${group.province.name} moet exact vier steden bevatten.`);
    assert.ok(group.cities.every((city) => city.kind === 'city'), `${group.province.name} bevat een onjuist paginatype.`);
    assert.ok(group.cities.every((city) => city.provinceSlug === group.province.slug), `${group.province.name} bevat een stad met een onjuiste provincie.`);
  }

  assert.deepEqual(
    regionPages.map(({ slug }) => slug),
    regionGroups.flatMap(({ province, cities }) => [province, ...cities]).map(({ slug }) => slug),
    'regionPages moet dezelfde volgorde en inhoud hebben als regionGroups.',
  );
});

test('primaire thuisbatterij-URL en legacy doorverwijzing zijn SEO-consistent', async () => {
  const primaryFile = 'thuisbatterij-laten-installeren.html';
  const legacyFile = 'thuisbatterijen.html';
  const primaryUrl = absoluteUrl(primaryFile);
  assert.deepEqual(redirectPages, [legacyFile]);

  const [primaryHtml, legacyHtml] = await Promise.all([
    readFile(join(root, primaryFile), 'utf8'),
    readFile(join(root, legacyFile), 'utf8'),
  ]);
  const primaryDom = new JSDOM(primaryHtml, { url: primaryUrl });
  const legacyDom = new JSDOM(legacyHtml, { url: absoluteUrl(legacyFile) });

  try {
    const primaryDocument = primaryDom.window.document;
    const phrase = 'Thuisbatterij laten installeren';
    assert.equal(singleElement(primaryDocument, 'h1', `${primaryFile}: H1`).textContent.trim(), phrase);
    const heroIntro = singleElement(
      primaryDocument,
      '#thuisbatterijSectThuisbatterijLatenInstallerenP01',
      `${primaryFile}: hero-intro`,
    ).textContent.toLocaleLowerCase('nl-NL');
    assert.ok(heroIntro.includes(phrase.toLocaleLowerCase('nl-NL')), `${primaryFile} mist de zoekterm in de hero-paragraaf.`);
    assert.equal(
      singleElement(primaryDocument, 'link[rel="canonical"]', `${primaryFile}: canonical`).getAttribute('href'),
      primaryUrl,
    );
    assert.equal(
      singleElement(primaryDocument, 'meta[property="og:url"]', `${primaryFile}: og:url`).getAttribute('content'),
      primaryUrl,
    );
    const primaryRobots = singleElement(primaryDocument, 'meta[name="robots"]', `${primaryFile}: robots`)
      .getAttribute('content').toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim());
    assert.ok(primaryRobots.includes('index'));
    assert.ok(primaryRobots.includes('follow'));

    const legacyDocument = legacyDom.window.document;
    const legacyRobots = singleElement(legacyDocument, 'meta[name="robots"]', `${legacyFile}: robots`)
      .getAttribute('content').toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim());
    assert.ok(legacyRobots.includes('noindex'));
    assert.ok(legacyRobots.includes('follow'));
    assert.ok(!legacyRobots.includes('index'));
    assert.equal(
      singleElement(legacyDocument, 'link[rel="canonical"]', `${legacyFile}: canonical`).getAttribute('href'),
      primaryUrl,
    );
    const refresh = singleElement(legacyDocument, 'meta[http-equiv="refresh"]', `${legacyFile}: doorverwijzing`)
      .getAttribute('content').match(/^\s*(\d+)\s*;\s*url\s*=\s*(.+?)\s*$/i);
    assert.ok(refresh, `${legacyFile} heeft geen geldige meta-refresh.`);
    assert.equal(refresh[1], '0', `${legacyFile} moet direct doorverwijzen.`);
    assert.equal(new URL(refresh[2], absoluteUrl(legacyFile)).href, primaryUrl);
  } finally {
    primaryDom.window.close();
    legacyDom.window.close();
  }
});

test('alle regionale pagina\'s hebben consistente, unieke SEO-signalen', async () => {
  const records = [];
  const baseFile = 'thuisbatterij-laten-installeren.html';
  const baseHtml = await readFile(join(root, baseFile), 'utf8');
  const baseDom = new JSDOM(baseHtml, { url: absoluteUrl(baseFile) });
  let expectedNavigation;
  let expectedHeader;
  let expectedFooter;
  let expectedMain;
  let baseHeroHeading;
  let baseHeroIntro;
  let expectedSectionsAfterHero;

  try {
    const { document } = baseDom.window;
    expectedNavigation = normalizedOuterHtml(
      singleElement(document, '#primaireNavigatieLijst', `${baseFile}: hoofdnavigatie`),
    );
    expectedHeader = normalizedOuterHtml(singleElement(document, 'body > header', `${baseFile}: paginakop`));
    expectedFooter = normalizedOuterHtml(singleElement(document, 'body > footer', `${baseFile}: voettekst`));
    expectedMain = normalizedOuterHtml(singleElement(document, '#mainContent', `${baseFile}: hoofdinhoud`));
    baseHeroHeading = singleElement(
      document,
      '#thuisbatterijSectThuisbatterijLatenInstallerenH1',
      `${baseFile}: hero-H1`,
    ).textContent;
    baseHeroIntro = singleElement(
      document,
      '#thuisbatterijSectThuisbatterijLatenInstallerenP01',
      `${baseFile}: hero-intro`,
    ).textContent;
    const baseSections = topLevelMainSections(document, baseFile);
    assert.ok(baseSections.length >= 2, `${baseFile} moet een hero en minstens een vervolgsectie bevatten.`);
    expectedSectionsAfterHero = baseSections.slice(1).map(normalizedOuterHtml);
  } finally {
    baseDom.window.close();
  }

  for (const [index, page] of regionPages.entries()) {
    const file = regionPageFiles[index];
    const expectedFile = `thuisbatterij-plaatsen-in-${page.slug}.html`;
    const expectedUrl = absoluteUrl(expectedFile);
    const phrase = `Thuisbatterij plaatsen in ${page.searchName}`;
    assert.equal(file, expectedFile, `${page.name} heeft een onverwachte bestandsnaam.`);

    const path = join(root, file);
    assert.ok((await stat(path)).isFile(), `${file} moet als regulier bestand bestaan.`);
    const html = await readFile(path, 'utf8');
    const dom = new JSDOM(html, { url: expectedUrl });

    try {
      const { document } = dom.window;
      const title = singleElement(document, 'title', `${file}: title`).textContent.trim();
      const description = singleElement(document, 'meta[name="description"]', `${file}: meta description`).getAttribute('content')?.trim();
      const canonical = singleElement(document, 'link[rel="canonical"]', `${file}: canonical`).getAttribute('href')?.trim();
      const openGraphTitle = singleElement(document, 'meta[property="og:title"]', `${file}: og:title`).getAttribute('content')?.trim();
      const openGraphDescription = singleElement(document, 'meta[property="og:description"]', `${file}: og:description`).getAttribute('content')?.trim();
      const openGraphUrl = singleElement(document, 'meta[property="og:url"]', `${file}: og:url`).getAttribute('content')?.trim();
      const twitterTitle = singleElement(document, 'meta[name="twitter:title"]', `${file}: twitter:title`).getAttribute('content')?.trim();
      const twitterDescription = singleElement(document, 'meta[name="twitter:description"]', `${file}: twitter:description`).getAttribute('content')?.trim();

      assert.ok(title, `${file} heeft een lege title.`);
      assert.ok(description, `${file} heeft een lege meta description.`);
      assert.equal(canonical, expectedUrl, `${file} heeft niet de verwachte self-canonical.`);
      assert.equal(openGraphTitle, title, `${file} heeft geen consistente og:title.`);
      assert.equal(openGraphDescription, description, `${file} heeft geen consistente og:description.`);
      assert.equal(openGraphUrl, expectedUrl, `${file} heeft niet de verwachte og:url.`);
      assert.equal(twitterTitle, title, `${file} heeft geen consistente twitter:title.`);
      assert.equal(twitterDescription, description, `${file} heeft geen consistente twitter:description.`);
      assert.equal(canonical, openGraphUrl, `${file} heeft verschillende canonical- en og:url-waarden.`);
      records.push({ file, title, description, canonical });

      const robots = singleElement(document, 'meta[name="robots"]', `${file}: robots`).getAttribute('content')
        ?.toLocaleLowerCase('nl-NL').split(',').map((token) => token.trim()).filter(Boolean) ?? [];
      assert.ok(robots.includes('index'), `${file} moet index toestaan.`);
      assert.ok(robots.includes('follow'), `${file} moet follow toestaan.`);
      assert.ok(!robots.includes('noindex'), `${file} mag geen noindex bevatten.`);
      assert.ok(!robots.includes('nofollow'), `${file} mag geen nofollow bevatten.`);

      const h1 = singleElement(document, 'h1', `${file}: H1`);
      assert.equal(h1.textContent.trim(), phrase, `${file} heeft niet de verwachte H1.`);
      const heroIntro = singleElement(
        document,
        '#thuisbatterijSectThuisbatterijLatenInstallerenP01',
        `${file}: hero-intro`,
      );
      assert.ok(
        heroIntro.textContent.toLocaleLowerCase('nl-NL').includes(phrase.toLocaleLowerCase('nl-NL')),
        `${file} moet de exacte zoekterm in de hero-paragraaf bevatten.`,
      );

      const graph = structuredData(document, file);
      const webPages = graph.filter((node) => hasType(node, 'WebPage'));
      const services = graph.filter((node) => hasType(node, 'Service'));
      assert.equal(webPages.length, 1, `${file} moet exact één WebPage-object bevatten.`);
      assert.equal(services.length, 1, `${file} moet exact één Service-object bevatten.`);
      assert.equal(webPages[0].url, expectedUrl, `${file} heeft een onjuiste WebPage.url.`);
      assert.equal(webPages[0]['@id'], `${expectedUrl}#webpage`, `${file} heeft een onjuiste WebPage.@id.`);
      assert.equal(services[0].url, expectedUrl, `${file} heeft een onjuiste Service.url.`);
      assert.equal(services[0]['@id'], `${expectedUrl}#service`, `${file} heeft een onjuiste Service.@id.`);
      assert.equal(services[0].name, phrase, `${file} heeft een onjuiste Service.name.`);

      const expectedArea = page.kind === 'province'
        ? { '@type': 'AdministrativeArea', name: page.name }
        : {
            '@type': 'City',
            name: page.name,
            containedInPlace: { '@type': 'AdministrativeArea', name: page.province },
          };
      assert.deepEqual(services[0].areaServed, expectedArea, `${file} heeft een onjuist Service.areaServed.`);

      const primaryNavigation = singleElement(document, '#primaireNavigatieLijst', `${file}: hoofdnavigatie`);
      assert.equal(
        normalizedOuterHtml(primaryNavigation),
        expectedNavigation,
        `${file} moet exact dezelfde hoofdnavigatie als ${baseFile} behouden.`,
      );
      const regionalNavigationLinks = [...primaryNavigation.querySelectorAll('a[href]')]
        .map(linkedFile)
        .filter((linked) => regionFileSet.has(linked));
      assert.deepEqual(regionalNavigationLinks, [], `${file} mag geen regiopagina in de hoofdnavigatie opnemen.`);

      assert.equal(
        normalizedOuterHtml(singleElement(document, 'body > header', `${file}: paginakop`)),
        expectedHeader,
        `${file} moet exact dezelfde paginakop als ${baseFile} behouden.`,
      );
      assert.equal(
        normalizedOuterHtml(singleElement(document, 'body > footer', `${file}: voettekst`)),
        expectedFooter,
        `${file} moet exact dezelfde voettekst als ${baseFile} behouden.`,
      );

      assert.equal(
        document.querySelectorAll('.regioBreadcrumb').length,
        0,
        `${file} mag geen regionale breadcrumb bevatten.`,
      );

      const regionalSections = topLevelMainSections(document, file);
      assert.ok(regionalSections.length >= 2, `${file} moet een hero en minstens een vervolgsectie bevatten.`);
      assert.ok(regionalSections[0].contains(h1), `${file} moet de locatie-H1 in de eerste hero-sectie bevatten.`);

      const normalizedMain = singleElement(document, '#mainContent', `${file}: hoofdinhoud`).cloneNode(true);
      singleElement(
        normalizedMain,
        '#thuisbatterijSectThuisbatterijLatenInstallerenH1',
        `${file}: gekloonde hero-H1`,
      ).textContent = baseHeroHeading;
      singleElement(
        normalizedMain,
        '#thuisbatterijSectThuisbatterijLatenInstallerenP01',
        `${file}: gekloonde hero-intro`,
      ).textContent = baseHeroIntro;
      assert.equal(
        normalizedOuterHtml(normalizedMain),
        expectedMain,
        `${file} mag in de zichtbare hoofdinhoud uitsluitend de hero-H1 en hero-intro wijzigen.`,
      );
      assert.deepEqual(
        regionalSections.slice(1).map(normalizedOuterHtml),
        expectedSectionsAfterHero,
        `${file} moet vanaf de tweede hoofdsectie gelijk zijn aan ${baseFile}.`,
      );
    } finally {
      dom.window.close();
    }
  }

  assertUnique(records, 'title');
  assertUnique(records, 'description');
  assertUnique(records, 'canonical');
});

test('sitemap bevat iedere publieke pagina exact eenmaal', async () => {
  const sitemap = await readFile(join(root, 'sitemap.xml'), 'utf8');
  const dom = new JSDOM(sitemap, { contentType: 'application/xml' });

  try {
    const locations = [...dom.window.document.getElementsByTagName('loc')]
      .map((node) => node.textContent.trim());
    const expectedLocations = pages.map(absoluteUrl);
    assert.ok(locations.includes(absoluteUrl('thuisbatterij-laten-installeren.html')));
    assert.ok(!locations.includes(absoluteUrl('thuisbatterijen.html')), 'De legacy doorverwijzing mag niet in de sitemap staan.');
    assert.equal(new Set(pages).size, pages.length, 'De publieke paginalijst bevat dubbele bestanden.');
    assert.equal(locations.length, expectedLocations.length, 'De sitemap moet uitsluitend en volledig de publieke paginalijst bevatten.');
    for (const expected of expectedLocations) {
      assert.equal(
        locations.filter((location) => location === expected).length,
        1,
        `${expected} moet exact eenmaal in de sitemap staan.`,
      );
    }
    assert.deepEqual([...locations].sort(), [...expectedLocations].sort(), 'De sitemap en publieke paginalijst verschillen.');
  } finally {
    dom.window.close();
  }
});

test('gegenereerde regiopagina\'s zijn byte-voor-byte actueel', async () => {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(root, 'thuisbatterij-laten-installeren.html'), 'utf8'),
    readFile(join(root, 'data', 'reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);

  for (const [index, page] of regionPages.entries()) {
    const file = regionPageFiles[index];
    const [actual, rendered] = await Promise.all([
      readFile(join(root, file)),
      renderRegionPage(page, baseSource, endpoint),
    ]);
    const expected = Buffer.from(rendered, 'utf8');
    assert.equal(
      Buffer.compare(actual, expected),
      0,
      `${file} wijkt af van de generator; voer node scripts/generate-thuisbatterij-regios.mjs uit.`,
    );
  }
});
