import { regionGroups, regionPages } from './thuisbatterij-regios.mjs';

// Dezelfde regio-indeling geldt voor beide lokale laadpaaldiensten:
// zes provincies en per provincie de vier grootste opgenomen steden.
export const laadpaalRegionGroups = regionGroups;
export const laadpaalRegionPages = regionPages;

export const laadpaalAudiences = [
  {
    key: 'particulieren',
    filePrefix: 'laadpaal-thuis-laten-installeren-in-',
    fileSuffix: '',
  },
  {
    key: 'bedrijven',
    filePrefix: 'zakelijke-laadpaal-plaatsen-in-',
    fileSuffix: '',
  },
];

export function laadpaalRegionPageFile(page, audience) {
  return `${audience.filePrefix}${page.slug}${audience.fileSuffix}.html`;
}

export const laadpaalRegionPageEntries = laadpaalAudiences.flatMap((audience) =>
  laadpaalRegionPages.map((page) => ({ audience, page })),
);

export const laadpaalRegionPageFiles = laadpaalRegionPageEntries.map(({ audience, page }) =>
  laadpaalRegionPageFile(page, audience),
);
