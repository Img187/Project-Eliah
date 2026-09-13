# Logo's in de hero-strook

De vijf bestaande hero-stroken gebruiken lokale bestanden. Er worden geen logo's van externe servers geladen tijdens een bezoek. Solis en Pylontech krijgen een bredere tegel met een oranje rand. De strook noemt geen partnerschap.

Opgehaald op 13 september 2026:

| Bestand in `assets/img/merken` | Bron |
| --- | --- |
| `solis.svg` | [Solis, beeldmerk op de officiële website](https://www.solisinverters.com/static/static/image/solisstorage-float-logo.svg) |
| `pylontech.svg` | [Pylontech, Engelstalige website](https://en.pylontech.com.cn/_nuxt/logo.B5hjion9.svg) |
| `growatt.svg` | [Growatt, officiële webshop](https://cdn.shopify.com/s/files/1/0588/4765/8171/files/logo.svg?v=1682228911) |
| `enphase.svg` | [Wikimedia Commons, afkomstig uit het Enphase ESG-rapport 2022](https://commons.wikimedia.org/wiki/File:Enphase_logo.svg), [SVG](https://upload.wikimedia.org/wikipedia/commons/2/2d/Enphase_logo.svg) |
| `aeg.svg` | [AEG Solar](https://aeg-solar.com/wp-content/uploads/2020/03/AEG_Logo_Red_RGB.svg) |
| `tesla.svg` | [CompaniesLogo, Tesla-woordmerk](https://companieslogo.com/tesla/logo/), [SVG](https://companieslogo.com/img/orig/TSLA_BIG-ae533047.svg?t=1740128273) |
| `dyness.svg` | [Dyness, officiële website](https://www.dyness.com/Public/Uploads/uploadfile/images/20241031/comlogonav01.svg) |

Solis gebruikt het originele zonvormige beeldmerk met de leesbare merknaam ernaast. Dyness gebruikt de originele witte variant op een donkerblauw vlak. De vectorvormen en merkkleuren zijn behouden. De bestanden zijn gecontroleerd op scripts, eventhandlers, externe verwijzingen en ingebedde rasterbeelden.

De bestaande NEN 1010-, NEN 3140- en VCA-afbeeldingen worden hergebruikt uit de footer: `assets/img/SparkyEnergies_Algemeen_Afbeelding_04.png`, `05.png` en `06.png`. Hiervoor zijn geen nieuwe keurmerken gemaakt. De oorspronkelijke merk- en auteursrechten blijven bij de eigenaren; deze bronlijst verleent geen licentie.

## Gedrag

- De strook schuift in 65 seconden naar links en herhaalt naadloos.
- De tweede groep is een niet-interactieve kopie, verborgen voor hulptechnologie.
- Op verzoek staat er geen pauzeknop. De strook pauzeert bij aanwijzen met een muis of toetsenbordfocus en hervat zodra aanwijzer/focus weggaat.
- Bij `prefers-reduced-motion: reduce` en zonder JavaScript staan alle logo's stil in een raster. De kopie is dan verborgen.
- Merklogo's behouden hun eigen lichte of donkere achtergrond in de hoogcontraststand.
