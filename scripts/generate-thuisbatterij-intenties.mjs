import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, secureHtml } from './prepare-pages.mjs';
import { origin, renderSitemap } from './sitemap.mjs';
import { batteryIntentPages } from './thuisbatterij-intenties.mjs';

const baseFile = 'thuisbatterij-laten-installeren.html';
const intentSectionAnchor = /<section id="thuisbatterijSectSlimOpslaanSlimGebruikenEnSlimBesparen"/;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pageUrl(page) {
  return `${origin}/${page.file}`;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`${label} ontbreekt in ${baseFile}.`);
  return source.replace(pattern, replacement);
}

function replaceElementText(source, id, value) {
  const pattern = new RegExp(`(<([a-z][a-z0-9:-]*)\\b[^>]*\\bid="${escapeRegExp(id)}"[^>]*>)[\\s\\S]*?(</\\2>)`, 'i');
  if (!pattern.test(source)) throw new Error(`Element #${id} ontbreekt in ${baseFile}.`);
  return source.replace(pattern, (_match, opening, _tag, closing) => `${opening}${escapeHtml(value)}${closing}`);
}

function replaceElementHtml(source, id, value) {
  const pattern = new RegExp(`(<([a-z][a-z0-9:-]*)\\b[^>]*\\bid="${escapeRegExp(id)}"[^>]*>)[\\s\\S]*?(</\\2>)`, 'i');
  if (!pattern.test(source)) throw new Error(`Element #${id} ontbreekt in ${baseFile}.`);
  return source.replace(pattern, (_match, opening, _tag, closing) => `${opening}${value}${closing}`);
}

function renderStructuredData(source, page, url) {
  const scriptPattern = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/;
  const match = source.match(scriptPattern);
  if (!match) throw new Error(`JSON-LD ontbreekt in ${baseFile}.`);
  const data = JSON.parse(match[1]);
  const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [];
  const webPage = graph.find((item) => item?.['@type'] === 'WebPage');
  const service = graph.find((item) => item?.['@type'] === 'Service');
  if (!webPage || !service) throw new Error(`WebPage of Service ontbreekt in de JSON-LD van ${baseFile}.`);

  webPage['@id'] = `${url}#webpage`;
  webPage.url = url;
  webPage.name = page.title;
  webPage.description = page.metaDescription;
  webPage.mainEntity = { '@id': `${url}#service` };

  service['@id'] = `${url}#service`;
  service.name = page.h1;
  service.serviceType = page.serviceType;
  service.url = url;
  service.description = page.metaDescription;
  service.areaServed = { '@type': 'Country', name: 'Nederland' };

  const json = JSON.stringify(data, null, 2).split('\n').map((line) => `  ${line}`).join('\n');
  return source.replace(scriptPattern, `<script type="application/ld+json">\n${json}\n  </script>`);
}

function renderIntentSection(page) {
  const { id, heading, intro, cards, closingHtml } = page.intentSection;
  const cardsHtml = cards.map((card, index) => {
    const number = String(index + 1).padStart(2, '0');
    return `  <li class="kaartLijstItem">\n    <article id="${id}Artikel${number}" class="kaart kenmerkKaart">\n      <h3 id="${id}Artikel${number}H3">${escapeHtml(card.heading)}</h3>\n      <p id="${id}Artikel${number}P01">${escapeHtml(card.text)}</p>\n    </article>\n  </li>`;
  }).join('\n');

  return `<section id="${id}" class="siteSectie kenmerkKaartenSectie layoutFeatures" aria-labelledby="${id}H2">\n<header class="sectieKop">\n  <h2 id="${id}H2" class="sectieTitel">${escapeHtml(heading)}</h2>\n  <p id="${id}P01" class="sectieIntro">${escapeHtml(intro)}</p>\n</header>\n<ul id="${id}Lijst" class="kaartLijst kenmerkKaartLijst kenmerkKaartLijstAutoHoogte" role="list">\n${cardsHtml}\n</ul>\n<p id="${id}P02" class="contentParagraaf">${closingHtml}</p>\n</section>\n`;
}

function listWithFinalAnd(items) {
  if (items.length < 2) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} en ${items.at(-1)}`;
}

function renderClusterLinks(page) {
  const targets = [
    { file: baseFile, label: 'een thuisbatterij laten installeren' },
    ...batteryIntentPages
      .filter((candidate) => candidate.file !== page.file)
      .map((candidate) => ({ file: candidate.file, label: candidate.linkLabel })),
  ];
  const links = targets.map(({ file, label }) => `<a href="${file}">${escapeHtml(label)}</a>`);
  return `${escapeHtml(page.clusterLead)} Lees ook over ${listWithFinalAnd(links)}.`;
}

export async function renderIntentPage(page, baseSource, endpoint) {
  const url = pageUrl(page);
  let html = baseSource.replace(/\r\n/g, '\n');

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)}</title>`, 'title');
  html = replaceRequired(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.metaDescription)}" />`, 'meta description');
  html = replaceRequired(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(page.title)}" />`, 'og:title');
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.metaDescription)}" />`, 'og:description');
  html = replaceRequired(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  html = replaceRequired(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`, 'twitter:title');
  html = replaceRequired(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(page.metaDescription)}" />`, 'twitter:description');
  html = renderStructuredData(html, page, url);
  html = replaceElementText(html, 'thuisbatterijSectThuisbatterijLatenInstallerenH1', page.h1);
  html = replaceElementText(html, 'thuisbatterijSectThuisbatterijLatenInstallerenP01', page.hero);
  html = replaceRequired(
    html,
    /data-section-title="Thuisbatterij laten installeren"/,
    `data-section-title="${escapeHtml(page.h1)}"`,
    'hero data-section-title',
  );
  html = replaceRequired(
    html,
    /aria-label="Acties voor sectie Thuisbatterij laten installeren"/,
    `aria-label="Acties voor sectie ${escapeHtml(page.h1)}"`,
    'hero actielabel',
  );
  html = replaceRequired(
    html,
    /data-button-section="Thuisbatterij laten installeren"/,
    `data-button-section="${escapeHtml(page.h1)}"`,
    'hero trackinglabel',
  );
  html = replaceRequired(
    html,
    /<input type="hidden" name="bron" value="[^"]*" \/>/,
    `<input type="hidden" name="bron" value="Thuisbatterijen – ${escapeHtml(page.phrase)}" />`,
    'formulierbron',
  );

  for (const [id, value] of Object.entries(page.replacements)) {
    html = replaceElementText(html, id, value);
  }

  html = replaceElementHtml(
    html,
    'thuisbatterijSectVoorWoningEnBedrijfP03',
    renderClusterLinks(page),
  );
  html = replaceRequired(
    html,
    intentSectionAnchor,
    (match) => `${renderIntentSection(page)}${match}`,
    'anker voor intentiesectie',
  );

  return secureHtml(html, endpoint);
}

export async function generateIntentPages(directory = root) {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(directory, baseFile), 'utf8'),
    readFile(join(directory, 'data/reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);
  const generated = [];
  for (const page of batteryIntentPages) {
    await writeFile(join(directory, page.file), await renderIntentPage(page, baseSource, endpoint));
    generated.push(page.file);
  }
  await writeFile(join(directory, 'sitemap.xml'), renderSitemap());
  return generated;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const generated = await generateIntentPages();
  console.log(`${generated.length} landelijke thuisbatterij-intentiepagina’s gegenereerd.`);
}
