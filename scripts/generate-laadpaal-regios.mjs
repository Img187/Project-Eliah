import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  laadpaalRegionPageEntries,
  laadpaalRegionPageFile,
} from './laadpaal-regios.mjs';
import { root, secureHtml } from './prepare-pages.mjs';
import { origin, renderSitemap } from './sitemap.mjs';

const baseFile = 'laadpalen.html';
const headingId = 'laadpalenSectLaadpaalLatenInstallerenH1';
const introId = 'laadpalenSectLaadpaalLatenInstallerenP01';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function laadpaalRegionPageUrl(page, audience) {
  return `${origin}/${laadpaalRegionPageFile(page, audience)}`;
}

export function laadpaalRegionPhrase(page, audience) {
  return audience.key === 'bedrijven'
    ? `Zakelijke laadpaal plaatsen in ${page.searchName}`
    : `Laadpaal thuis laten installeren in ${page.searchName}`;
}

export function laadpaalRegionDescription(page, audience) {
  return audience.key === 'bedrijven'
    ? `Zakelijke laadpaal plaatsen in ${page.searchName}? Advies over aansluiting, load balancing en slim laden door Sparky Energies.`
    : `Laadpaal thuis laten installeren in ${page.searchName}? Advies over meterkast, aansluiting, load balancing en slim thuisladen door Sparky Energies.`;
}

export function laadpaalRegionHeroIntro(page, audience) {
  return audience.key === 'bedrijven'
    ? `Wilt u een zakelijke laadpaal plaatsen in ${page.searchName}? Wij combineren de juiste laadoplossing met een veilige elektrische aansluiting, load balancing en—waar gewenst—zonnestroom of dynamisch laden.`
    : `Wilt u een laadpaal thuis laten installeren in ${page.searchName}? Wij combineren de juiste laadpaal met een veilige elektrische aansluiting, load balancing en—waar gewenst—zonnestroom of dynamisch laden.`;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`${label} ontbreekt in ${baseFile}.`);
  return source.replace(pattern, replacement);
}

function replaceElementText(source, tag, id, value) {
  const pattern = new RegExp(`(<${tag}\\b[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(</${tag}>)`);
  return replaceRequired(source, pattern, `$1${escapeHtml(value)}$2`, `${tag}#${id}`);
}

function renderStructuredData(source, page, audience, title, description, url) {
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
  webPage.name = title;
  webPage.description = description;
  webPage.mainEntity = { '@id': `${url}#service` };

  service['@id'] = `${url}#service`;
  service.name = laadpaalRegionPhrase(page, audience);
  service.serviceType = audience.key === 'bedrijven'
    ? 'Advies en installatie van zakelijke laadpalen'
    : 'Advies en installatie van laadpalen aan huis';
  service.url = url;
  service.description = description;
  service.areaServed = page.kind === 'province'
    ? { '@type': 'AdministrativeArea', name: page.name }
    : {
        '@type': 'City',
        name: page.name,
        containedInPlace: { '@type': 'AdministrativeArea', name: page.province },
      };

  const json = JSON.stringify(data, null, 2).split('\n').map((line) => `  ${line}`).join('\n');
  return source.replace(scriptPattern, `<script type="application/ld+json">\n${json}\n  </script>`);
}

export async function renderLaadpaalRegionPage(page, audience, baseSource, endpoint) {
  const url = laadpaalRegionPageUrl(page, audience);
  const phrase = laadpaalRegionPhrase(page, audience);
  const title = `${phrase} | Sparky Energies`;
  const description = laadpaalRegionDescription(page, audience);
  if (description.length > 165) throw new Error(`Meta description voor ${page.name} (${audience.key}) is langer dan 165 tekens.`);
  let html = baseSource.replace(/\r\n/g, '\n');

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title');
  html = replaceRequired(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`, 'meta description');
  html = replaceRequired(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'og:title');
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`, 'og:description');
  html = replaceRequired(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  html = replaceRequired(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'twitter:title');
  html = replaceRequired(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`, 'twitter:description');
  html = renderStructuredData(html, page, audience, title, description, url);
  html = replaceElementText(html, 'h1', headingId, phrase);
  html = replaceElementText(html, 'p', introId, laadpaalRegionHeroIntro(page, audience));

  return secureHtml(html, endpoint);
}

export async function generateLaadpaalRegionPages(directory = root) {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(directory, baseFile), 'utf8'),
    readFile(join(directory, 'data/reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);
  const generated = [];
  for (const { page, audience } of laadpaalRegionPageEntries) {
    const file = laadpaalRegionPageFile(page, audience);
    await writeFile(join(directory, file), await renderLaadpaalRegionPage(page, audience, baseSource, endpoint));
    generated.push(file);
  }
  await writeFile(join(directory, 'sitemap.xml'), renderSitemap());
  return generated;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const generated = await generateLaadpaalRegionPages();
  console.log(`${generated.length} regionale laadpaalpagina's gegenereerd.`);
}
