import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { basePages, root, secureHtml } from './prepare-pages.mjs';
import { regionPages } from './thuisbatterij-regios.mjs';

const origin = 'https://www.sparkyenergies.com';
const pagePrefix = 'thuisbatterij-plaatsen-in-';
const baseFile = 'thuisbatterij-laten-installeren.html';
const basePageLastModified = {
  'index.html': '2026-07-16',
  [baseFile]: '2026-09-25',
  'zonnepanelen.html': '2026-07-16',
  'laadpalen.html': '2026-07-16',
  'elektrotechnische-renovaties.html': '2026-07-16',
  'over-ons.html': '2026-07-16',
  'contact.html': '2026-07-16',
};
const regionalLastModified = '2026-09-25';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pageFile(page) {
  return `${pagePrefix}${page.slug}.html`;
}

function pageUrl(page) {
  return `${origin}/${pageFile(page)}`;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`${label} ontbreekt in ${baseFile}.`);
  return source.replace(pattern, replacement);
}

function replaceElementText(source, tag, id, value) {
  const pattern = new RegExp(`(<${tag}\\b[^>]*\\bid="${id}"[^>]*>)[\\s\\S]*?(</${tag}>)`);
  return replaceRequired(source, pattern, `$1${escapeHtml(value)}$2`, `${tag}#${id}`);
}

function renderStructuredData(source, page, title, url) {
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
  webPage.description = page.metaDescription;
  webPage.mainEntity = { '@id': `${url}#service` };

  service['@id'] = `${url}#service`;
  service.name = `Thuisbatterij plaatsen in ${page.searchName}`;
  service.url = url;
  service.description = page.metaDescription;
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

export async function renderRegionPage(page, baseSource, endpoint) {
  const url = pageUrl(page);
  const phrase = `Thuisbatterij plaatsen in ${page.searchName}`;
  const title = `${phrase} | Sparky Energies`;
  let html = baseSource.replace(/\r\n/g, '\n');

  html = replaceRequired(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`, 'title');
  html = replaceRequired(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(page.metaDescription)}" />`, 'meta description');
  html = replaceRequired(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceRequired(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`, 'og:title');
  html = replaceRequired(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(page.metaDescription)}" />`, 'og:description');
  html = replaceRequired(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  html = replaceRequired(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`, 'twitter:title');
  html = replaceRequired(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(page.metaDescription)}" />`, 'twitter:description');
  html = renderStructuredData(html, page, title, url);
  html = replaceElementText(html, 'h1', 'thuisbatterijSectThuisbatterijLatenInstallerenH1', phrase);
  html = replaceElementText(html, 'p', 'thuisbatterijSectThuisbatterijLatenInstallerenP01', page.intro);

  return secureHtml(html, endpoint);
}

export function renderSitemap() {
  const records = [
    ...basePages.map((file) => ({
      location: file === 'index.html' ? `${origin}/` : `${origin}/${file}`,
      lastModified: basePageLastModified[file],
    })),
    ...regionPages.map((page) => ({ location: pageUrl(page), lastModified: regionalLastModified })),
  ];
  const urls = records.map(({ location, lastModified }) => `  <url>\n    <loc>${location}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export async function generateRegionPages(directory = root) {
  const [baseSource, configSource] = await Promise.all([
    readFile(join(directory, baseFile), 'utf8'),
    readFile(join(directory, 'data/reviews-config.json'), 'utf8'),
  ]);
  const { endpoint } = JSON.parse(configSource);
  const generated = [];
  for (const page of regionPages) {
    const file = pageFile(page);
    await writeFile(join(directory, file), await renderRegionPage(page, baseSource, endpoint));
    generated.push(file);
  }
  await writeFile(join(directory, 'sitemap.xml'), renderSitemap());
  return generated;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const generated = await generateRegionPages();
  console.log(`${generated.length} regionale thuisbatterijpagina’s gegenereerd.`);
}
