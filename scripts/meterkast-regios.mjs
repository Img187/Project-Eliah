import { regionGroups, regionPages } from './thuisbatterij-regios.mjs';

// Dezelfde regio-indeling geldt voor alle lokale dienstenpagina's:
// zes provincies en per provincie de vier grootste opgenomen steden.
export const meterkastRegionGroups = regionGroups;
export const meterkastRegionPages = regionPages;
export const meterkastRegionPageFiles = meterkastRegionPages.map(({ slug }) => `meterkast-vervangen-in-${slug}.html`);
