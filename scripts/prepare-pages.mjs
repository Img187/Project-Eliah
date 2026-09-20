import { createHash } from 'node:crypto';
import { copyFile, lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const pages = ['index.html', 'thuisbatterijen.html', 'zonnepanelen.html', 'laadpalen.html', 'elektrotechnische-renovaties.html', 'over-ons.html', 'contact.html'];
const runtime = ['network.js', 'main.js', 'cookie-consent.js', 'calculator-models.js', 'google-reviews.js'];
const fixed = [...pages, 'robots.txt', 'sitemap.xml', 'CNAME', '.nojekyll',
  'data/reviews-config.json',
  ...runtime.map(name => `assets/js/${name}`), 'assets/css/styles.css',
  'assets/documenten/algemene-voorwaarden-sparky-energies-vof.pdf',
  'assets/documenten/privacy-en-cookieverklaring-sparky-energies.pdf'];

export function secureHtml(source, endpoint = '') {
  let html = source.replace(/\r\n/g, '\n');
  if (!/<meta charset="utf-8"\s*\/?>/i.test(html)) throw new Error('Een expliciete UTF-8-metatag is vereist voor de beveiligingsconfiguratie.');
  const hashes = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/(?:^|\s)src\s*=/i.test(match[1])) continue;
    if (!/(?:^|\s)type="application\/ld\+json"/i.test(match[1])) throw new Error('Alle uitvoerbare scripts moeten in lokale JS-bestanden staan.');
    JSON.parse(match[2]);
    hashes.push(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  let reviewOrigin = '';
  if (endpoint) {
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.username || url.password || endpoint.length > 2048 || !/^(?:[a-z0-9][a-z0-9.-]*|\[[a-f0-9:]+\])$/i.test(url.hostname)) throw new Error('Reviews vereisen een HTTPS-endpoint zonder credentials en met een geldige hostnaam.');
    reviewOrigin = ` ${url.origin}`;
  }
  const policy = [
    "default-src 'none'", "base-uri 'none'", "object-src 'none'",
    `script-src 'self' https://www.googletagmanager.com ${hashes.join(' ')}`.trim(),
    "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'", "font-src 'self'",
    "img-src 'self' https://googleusercontent.com https://*.googleusercontent.com https://*.google-analytics.com https://www.googletagmanager.com",
    `connect-src 'self' https://formspree.io https://*.google-analytics.com https://www.googletagmanager.com https://*.google.com${reviewOrigin}`,
    'frame-src https://www.google.com', 'form-action https://formspree.io', "media-src 'self'", "manifest-src 'self'",
  ].join('; ');
  html = html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/gi, '')
    .replace(/\s*<meta name="referrer"[^>]*>/gi, '');
  const attribute = policy.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  html = html.replace(/(<meta charset="utf-8"\s*\/?>)/i, `$1\n  <meta http-equiv="Content-Security-Policy" content="${attribute}" />\n  <meta name="referrer" content="strict-origin-when-cross-origin" />`);
  if (!html.includes('src="assets/js/network.js"')) html = html.replace('<script src="assets/js/cookie-consent.js"', '<script src="assets/js/network.js" defer></script>\n  <script src="assets/js/cookie-consent.js"');
  return html;
}

export async function publicFiles(directory = root) {
  const result = [...fixed];
  // Lokale conceptsecties worden pas meegenomen als de gepubliceerde HTML ze werkelijk inschakelt.
  const homepage = (await readFile(join(directory, 'index.html'), 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  if (/<script\b[^>]*\ssrc="assets\/js\/projecten\.js"/i.test(homepage)) result.push('assets/js/projecten.js', 'data/projecten.json');
  if (/<link\b[^>]*\shref="assets\/css\/home-overzichten\.css"/i.test(homepage)) result.push('assets/css/home-overzichten.css');
  async function walk(relative, extensions) {
    for (const entry of await readdir(join(directory, relative), { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const path = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) throw new Error(`Symlink niet toegestaan in publicatie: ${path}`);
      if (entry.isDirectory()) await walk(path, extensions);
      else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) result.push(path);
    }
  }
  await walk('assets/img', new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.avif', '.ico']));
  await walk('assets/fonts', new Set(['.woff2']));
  return result.sort();
}

async function settings(directory) {
  const config = JSON.parse(await readFile(join(directory, 'data/reviews-config.json'), 'utf8'));
  if (typeof config?.endpoint !== 'string') throw new Error('Ongeldige reviewconfiguratie.');
  return config;
}

export async function syncSecurity(directory = root) {
  const { endpoint } = await settings(directory);
  for (const page of pages) {
    const file = join(directory, page);
    await writeFile(file, secureHtml(await readFile(file, 'utf8'), endpoint));
  }
}

export async function buildPages(directory = root) {
  // Alleen deze vaste, gegenereerde map mag worden opgeschoond. Weiger redirects via symlinks.
  const workspace = await realpath(directory);
  const build = join(workspace, 'build');
  await mkdir(build, { recursive: true });
  if ((await lstat(build)).isSymbolicLink() || await realpath(build) !== build) throw new Error('Onveilig buildpad.');
  const output = join(build, 'pages');
  const existing = await lstat(output).catch(error => { if (error.code !== 'ENOENT') throw error; return null; });
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink() || await realpath(output) !== output)) throw new Error('Onveilig publicatiepad.');
  const files = await publicFiles(workspace);
  const { endpoint } = await settings(workspace);
  // Eerst alle bronnen controleren; alleen complete geldige builds mogen worden gepubliceerd.
  for (const file of files) {
    const source = join(workspace, file);
    if (!(await lstat(source)).isFile() || await realpath(source) !== source) throw new Error(`Geen regulier publiek bestand: ${file}`);
    if (pages.includes(file)) {
      const html = await readFile(source, 'utf8');
      if (secureHtml(html, endpoint) !== html.replace(/\r\n/g, '\n')) throw new Error(`Beveiligingsconfiguratie bijwerken: node scripts/prepare-pages.mjs --sync (${file})`);
    }
  }
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const file of files) {
    const destination = join(output, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(workspace, file), destination);
  }
  return { output, files };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--sync')) await syncSecurity();
  else {
    const result = await buildPages();
    console.log(`${result.files.length} publieke bestanden voorbereid in ${result.output}`);
  }
}
