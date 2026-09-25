import { basePages } from './prepare-pages.mjs';
import { meterkastRegionPages } from './meterkast-regios.mjs';
import { regionPages as thuisbatterijRegionPages } from './thuisbatterij-regios.mjs';

export const origin = 'https://www.sparkyenergies.com';
const regionalLastModified = '2026-09-25';
const basePageLastModified = {
  'index.html': '2026-07-16',
  'thuisbatterij-laten-installeren.html': '2026-09-25',
  'zonnepanelen.html': '2026-07-16',
  'laadpalen.html': '2026-07-16',
  'meterkast-vervangen.html': '2026-09-25',
  'over-ons.html': '2026-07-16',
  'contact.html': '2026-07-16',
};

function regionalRecord(prefix, page) {
  return {
    location: `${origin}/${prefix}${page.slug}.html`,
    lastModified: regionalLastModified,
  };
}

export function renderSitemap() {
  const records = [
    ...basePages.map((file) => ({
      location: file === 'index.html' ? `${origin}/` : `${origin}/${file}`,
      lastModified: basePageLastModified[file],
    })),
    ...thuisbatterijRegionPages.map((page) => regionalRecord('thuisbatterij-plaatsen-in-', page)),
    ...meterkastRegionPages.map((page) => regionalRecord('meterkast-vervangen-in-', page)),
  ];
  const urls = records
    .map(({ location, lastModified }) => `  <url>\n    <loc>${location}</loc>\n    <lastmod>${lastModified}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
