# Google Tag Manager

Doelcontainer: **GTM-WLFHDLMC**. GA4-webstream: **G-87KMB19788**.

De website laadt GTM na volledige cookietoestemming en zet onderstaande gebeurtenissen in `dataLayer`. De GA4-configuratie gebeurt in GTM; er hoort geen tweede losse GA4-installatie naast te staan. [Google beschrijft de Google tag en de Initialization-trigger](https://support.google.com/tagmanager/answer/14842872?hl=en).

| Gebeurtenis | Betekenis | Extra parameters |
| --- | --- | --- |
| `contact_click` | Klik op telefoon, WhatsApp of e-mail | `contact_method` (`phone`, `whatsapp`, `email`), `link_id` |
| `generate_lead` | Eenmalige bevestiging op `/bedankt` na een geslaagde contact-/offerteaanvraag | `form_id` |
| `calculator_started` | Calculator gestart | `calculator_type` |
| `calculator_completed` | Berekening afgerond | `calculator_type` |
| `calculator_contact_clicked` | Contactknop bij calculator gebruikt | `calculator_type` |
| `calculator_transferred` | Calculatoradvies op contactpagina overgenomen | `calculator_type` |

Elke gebeurtenis bevat ook `page_path` zonder querystring of fragment. Contactklikken bewijzen geen uitgevoerd gesprek of verzonden bericht. Calculatoracties zijn geen geslaagde aanvraag.

## Bedankpagina en formulierconversies

Na een succesvolle serverreactie op het contactformulier gaat de bezoeker naar **`/bedankt`**. Bij validatie- of serverfouten blijft de bezoeker op het formulier. De bedankpagina is ook rechtstreeks bereikbaar; alleen het bezoeken van deze URL bewijst daarom geen geslaagde aanvraag.

Voor `generate_lead` bewaart de website na succes tijdelijk alleen het formulier-ID en een tijdstip in `sessionStorage` onder `sparkyGeslaagdeAanvraag`. Op de bedankpagina wordt deze markering eenmalig verwijderd en, bij volledige cookietoestemming en een leeftijd van maximaal 10 minuten, als `generate_lead` doorgegeven. Er staat geen formulierinhoud in de markering. De gebeurtenis heeft `page_path=/bedankt` wanneer de bezoeker de standaard doorstuurroute volgt. Rechtstreeks openen, vernieuwen of opnieuw bezoeken van de bedankpagina levert geen extra `generate_lead` op. Zonder toestemming wordt de markering ook verbruikt; later toestemming geven meet deze aanvraag niet alsnog. Als sessieopslag wordt geblokkeerd, blijft de doorsturing werken, maar kan deze eigen lead-gebeurtenis ontbreken.

Het marketingteam kan **`/bedankt` als alternatieve conversie-URL** gebruiken. De Google tag registreert daarvoor na toestemming de gewone `page_view`. In GA4 kan een eigen gebeurtenis worden gemaakt op basis van `event_name=page_view` en een `page_location` die exact bij de bedank-URL past; stem protocol, domein en eventuele afsluitende slash af op de gepubliceerde URL. [Google beschrijft een conversie op basis van een bevestigingspagina](https://support.google.com/analytics/answer/10085872?hl=en).

Kies voor formulieraanvragen één conversiebron: de bestaande `generate_lead`, of de URL-gebaseerde meting. Gebruik de URL-gebaseerde gebeurtenis niet daarnaast als tweede belangrijke gebeurtenis of tweede primaire advertentieconversie voor dezelfde aanvraag. Als de URL-meting de bestaande GTM-tag vervangt, pauzeer dan **Sparky - GA4 - generate_lead** en pas de GA4-/advertentie-instellingen daarop aan. Een zuivere URL-meting kan ook rechtstreekse bezoeken en vernieuwen van de pagina meetellen; de eenmalige `generate_lead` voorkomt dat voor de eigen formuliermeting.

De eigen gebeurtenissen bevatten geen formulierinhoud, telefoonnummer, e-mailadres of linkbestemming. Google verzamelt daarnaast standaardmetadata, waaronder paginalocatie en verwijzende URL; dit is geen algemene garantie dat alle automatisch verzamelde gegevens vrij zijn van persoonsgegevens. Controleer URL's en de GA4-instellingen afzonderlijk. [Google documenteert de standaardwaarden](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).

## Importeren en activeren

Status op 4 november 2026: de publiek gepubliceerde container bevatte geen tags. De JSON is **lokaal gecontroleerd, import nog niet gevalideerd in GTM**. Er is vanuit deze werkomgeving geen aangemelde GTM-sessie beschikbaar; import, Preview, GA4-instellingen en publicatie zijn nog nodig.

1. Exporteer eerst de huidige doelcontainer als reservekopie. Open **GTM-WLFHDLMC → Admin → Import Container** en selecteer [gtm-sparky-energies.json](gtm-sparky-energies.json).
2. Kies een werkruimte en **Merge / Samenvoegen**. Bekijk alle wijzigingen: verwacht 4 tags, 3 triggers, 5 dataLayer-variabelen en de ingebouwde variabele `Event`. Er mogen geen onbedoelde verwijderingen zijn. Los naamconflicten bewust op; voorkom door hernoemen of herhaald importeren dubbele GA4-tags. [Google beschrijft import en Merge](https://support.google.com/tagmanager/answer/6106997?hl=en).
3. Controleer de Google tag: ID **G-87KMB19788**, **Initialization - All Pages**, eenmaal per pagina. Deze tag gebruikt de standaard automatische `page_view`; er is geen aparte pageview-eventtag. Controleer dat dezelfde stream niet ook via andere tags, websitecode of gekoppelde installaties wordt geconfigureerd. [Google legt dubbele pageviews uit](https://developers.google.com/analytics/devguides/collection/ga4/views).
4. Controleer bij alle 4 tags **Consent Settings → Require additional consent for tag to fire → analytics_storage**. De website geeft toestemming door vóór het laden van GTM; controleer dit ook in Preview. De expliciete extra controle voorkomt dat de eventtags uitsluitend op hun ingebouwde consentgedrag vertrouwen. [Google beschrijft deze controle](https://support.google.com/analytics/answer/10718549?hl=en).
5. Zet in de GA4-webstream onder **Enhanced measurement / Verbeterde meting → Form interactions / Formulierinteracties** de automatische formuliermeting uit. Gebruik standaard `generate_lead` op de bedankpagina voor geslaagde aanvragen; voeg geen GTM-trigger toe die iedere formulierverzending als succes telt. De automatische `form_submit` meet een verzendactie. [Google beschrijft de automatische formuliergebeurtenissen](https://support.google.com/analytics/answer/9216061?hl=en).
6. Markeer bij de standaardinrichting alleen `generate_lead` in GA4 als **key event / belangrijke gebeurtenis** voor geslaagde formulieraanvragen. Kies bij een URL-gebaseerde inrichting de vervangende gebeurtenis zoals hierboven beschreven. Maak eventgebonden custom dimensions voor `contact_method`, `form_id`, `calculator_type` en, indien nodig voor rapportage, `link_id` en `page_path`. [Key events instellen](https://support.google.com/analytics/answer/13128484?hl=en), [custom dimensions voor eventparameters](https://support.google.com/analytics/answer/12229021?hl=en).
7. Gebruik **Preview / Tag Assistant** en GA4 **DebugView**. Test weigeren, accepteren, intrekken en opnieuw laden; telefoon-, WhatsApp- en e-mailklikken; een geslaagde aanvraag met doorsturing naar `/bedankt`; validatiefouten en serverfouten zonder doorsturing; de calculatorroute. Verwacht geen eigen meetgebeurtenissen zonder volledige toestemming, één `page_view` per geladen pagina met toestemming, één `contact_click` per klik en één `generate_lead` op `/bedankt` na een geslaagde aanvraag met beschikbare sessieopslag en toestemming. Controleer dat rechtstreeks openen, vernieuwen en opnieuw bezoeken van `/bedankt` geen extra `generate_lead` opleveren, en dat een verlopen markering of een aanvraag zonder toestemming later geen lead oplevert. Test ook geblokkeerde sessieopslag: de bezoeker moet nog steeds naar `/bedankt` gaan. Controleer in Tag Assistant de tagstatus, parameterwaarden en consentstatus en in het netwerk de daadwerkelijke GA4-verzoeken. Verstuur alleen een afgesproken testaanvraag.
8. Publiceer de geteste GTM-werkruimte via **Submit / Verzenden**. Controleer daarna de gepubliceerde site en GA4 Realtime opnieuw. Alleen de websitecode publiceren activeert deze GTM-tags niet.

De numerieke account-, container- en versie-ID's `1` in het importbestand zijn placeholders voor het exportformaat, geen echte accountgegevens. Selecteer bij de import zelf de juiste doelcontainer. De JSON bevat native Google-/GA4-tags en geen Custom HTML.
