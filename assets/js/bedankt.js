/* Sparky Energies - eenmalige conversiemeting na een bevestigde aanvraag. */
(function () {
  'use strict';

  if (!/^\/bedankt(?:\.html|\/)?$/.test(window.location.pathname)) return;

  let savedRequest;
  try {
    try {
      savedRequest = window.sessionStorage.getItem('sparkyGeslaagdeAanvraag');
    } finally {
      window.sessionStorage.removeItem('sparkyGeslaagdeAanvraag');
    }
  } catch (error) {
    // Zonder een verbruikbare bevestiging meten we geen conversie.
    return;
  }

  let request;
  try {
    request = JSON.parse(savedRequest);
  } catch (error) {
    return;
  }

  const allowedForms = [
    'homeSectKlaarOmUwWoningToekomstbestendigTeMakenFormulier',
    'thuisbatterijSectOntdekWelkeBatterijPastBijUFormulier',
    'zonnepanelenSectBenieuwdHoeveelUKuntBesparenFormulier',
    'laadpalenSectWelkeLaadpaalPastBijUFormulier',
    'elektrotechnischeRenovatiesSectWiltUUwElektraVeiligLatenAanpassenFormulier',
    'overOnsSectKlaarVoorDeVolgendeStapFormulier',
    'contactSnelAdviesFormulier',
    'contactSectLatenWeBeginnenFormulier'
  ];
  if (!request || !allowedForms.includes(request.formId) || !Number.isFinite(request.createdAt)) return;
  const age = Date.now() - request.createdAt;
  if (age < 0 || age >= 10 * 60 * 1000) return;

  if (window.SparkyTracking) {
    window.SparkyTracking.track('generate_lead', { form_id: request.formId });
  }
}());
