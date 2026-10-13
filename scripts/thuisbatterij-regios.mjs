import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const contentDirectory = join(repositoryRoot, 'data', 'thuisbatterij-regios');
const provinceOrder = ['zuid-holland', 'provincie-utrecht', 'overijssel', 'noord-brabant', 'zeeland', 'limburg'];

function requireText(value, field, source) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${source}: ${field} moet gevulde tekst bevatten.`);
  return value.trim();
}

function normalizeSectionCopy(copy, source) {
  if (copy === undefined) return undefined;
  if (!copy || typeof copy !== 'object' || Array.isArray(copy)) throw new Error(`${source}: sectionCopy moet een object zijn.`);
  return Object.fromEntries(Object.entries(copy).map(([selector, content]) => {
    if (!/^#[a-zA-Z][a-zA-Z0-9_-]*(?: \.sectieIntro)?$/.test(selector)) throw new Error(`${source}: ongeldige tekstselector ${selector}.`);
    if (typeof content === 'string') return [selector, requireText(content, selector, source)];
    if (!Array.isArray(content) || !content.length) throw new Error(`${source}: ${selector} mist tekst.`);
    const parts = content.map((part) => {
      if (typeof part === 'string' && part.trim()) return part;
      const text = requireText(part?.text, `${selector}.text`, source);
      const href = requireText(part?.href, `${selector}.href`, source);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(href)) throw new Error(`${source}: ${selector} vereist een interne HTML-link.`);
      return { text, href };
    });
    return [selector, parts];
  }));
}

function normalizePage(page, province, source, kind) {
  const normalized = {
    kind,
    province: province.name,
    provinceSlug: province.slug,
    name: requireText(page.name, 'name', source),
    searchName: typeof page.searchName === 'string' && page.searchName.trim() ? page.searchName.trim() : requireText(page.name, 'name', source),
    slug: requireText(page.slug, 'slug', source),
    metaDescription: requireText(page.metaDescription, 'metaDescription', source),
    intro: requireText(page.intro, 'intro', source),
    contextHeading: requireText(page.contextHeading, 'contextHeading', source),
    contextParagraphs: page.contextParagraphs,
    cards: page.cards,
    areaHeading: requireText(page.areaHeading, 'areaHeading', source),
    areaParagraphs: page.areaParagraphs,
    faqLocal: page.faqLocal,
    ...(page.sectionCopy === undefined ? {} : { sectionCopy: normalizeSectionCopy(page.sectionCopy, source) }),
  };

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized.slug)) throw new Error(`${source}: ongeldige slug ${normalized.slug}.`);
  if (!Array.isArray(normalized.contextParagraphs) || normalized.contextParagraphs.length !== 2) throw new Error(`${source}: contextParagraphs moet exact twee teksten bevatten.`);
  normalized.contextParagraphs = normalized.contextParagraphs.map((value, index) => requireText(value, `contextParagraphs[${index}]`, source));
  if (!Array.isArray(normalized.cards) || normalized.cards.length !== 3) throw new Error(`${source}: cards moet exact drie kaarten bevatten.`);
  normalized.cards = normalized.cards.map((card, index) => ({
    title: requireText(card?.title, `cards[${index}].title`, source),
    text: requireText(card?.text, `cards[${index}].text`, source),
  }));
  if (!Array.isArray(normalized.areaParagraphs) || normalized.areaParagraphs.length !== 2) throw new Error(`${source}: areaParagraphs moet exact twee teksten bevatten.`);
  normalized.areaParagraphs = normalized.areaParagraphs.map((value, index) => requireText(value, `areaParagraphs[${index}]`, source));
  normalized.faqLocal = {
    question: requireText(normalized.faqLocal?.question, 'faqLocal.question', source),
    answer: requireText(normalized.faqLocal?.answer, 'faqLocal.answer', source),
  };

  const keyphrase = `thuisbatterij installeren in ${normalized.searchName}`.toLocaleLowerCase('nl-NL');
  if (!normalized.intro.toLocaleLowerCase('nl-NL').includes(keyphrase)) throw new Error(`${source}: intro mist de exacte zoekterm “Thuisbatterij installeren in ${normalized.searchName}”.`);
  if (normalized.metaDescription.length > 165) throw new Error(`${source}: metaDescription voor ${normalized.name} is langer dan 165 tekens.`);
  return normalized;
}

async function loadProvinceGroups() {
  const files = (await readdir(contentDirectory)).filter((name) => name.endsWith('.json')).sort();
  if (!files.length) throw new Error('Geen thuisbatterij-regiocontent gevonden.');

  const groups = [];
  for (const file of files) {
    const source = `data/thuisbatterij-regios/${file}`;
    const data = JSON.parse(await readFile(join(contentDirectory, file), 'utf8'));
    const provinceBase = {
      name: requireText(data?.province?.name, 'province.name', source),
      slug: requireText(data?.province?.slug, 'province.slug', source),
    };
    const province = normalizePage(data.province, provinceBase, source, 'province');
    if (!Array.isArray(data.cities) || data.cities.length !== 4) throw new Error(`${source}: iedere provincie moet exact vier steden bevatten.`);
    const cities = data.cities.map((city, index) => normalizePage(city, provinceBase, `${source} cities[${index}]`, 'city'));
    groups.push({ province, cities });
  }

  groups.sort((left, right) => provinceOrder.indexOf(left.province.slug) - provinceOrder.indexOf(right.province.slug));

  const pages = groups.flatMap(({ province, cities }) => [province, ...cities]);
  const slugs = new Set();
  for (const page of pages) {
    if (slugs.has(page.slug)) throw new Error(`Dubbele regioslug: ${page.slug}.`);
    slugs.add(page.slug);
  }
  return groups;
}

export const regionGroups = await loadProvinceGroups();
export const regionPages = regionGroups.flatMap(({ province, cities }) => [province, ...cities]);
export const regionPageFiles = regionPages.map(({ slug }) => `thuisbatterij-installeren-in-${slug}.html`);

export function groupForPage(page) {
  return regionGroups.find(({ province }) => province.slug === page.provinceSlug);
}
