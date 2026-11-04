/* Sparky Energies - eenvoudige toestemming voor externe Google-diensten. */
(function () {
  'use strict';

  const STORAGE_KEY = 'sparky-cookie-toestemming';
  const CHOICE_FULL = 'volledig';
  const CHOICE_FUNCTIONAL = 'functioneel';
  const MEASUREMENT_ID = 'G-87KMB19788';
  const TAG_MANAGER_ID = 'GTM-WLFHDLMC';
  const GOOGLE_TAG_MANAGER_SCRIPT_ID = 'googleTagManagerTag';

  let currentChoice = readChoice();
  let consentLayer;
  let preferencesLink;
  let returnFocusElement;
  let lockedPageElements = [];
  let tagManagerLoadScheduled = false;
  let tagManagerConfigured = false;

  function readChoice() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return value === CHOICE_FULL || value === CHOICE_FUNCTIONAL ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    currentChoice = value;
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // De keuze blijft voor de huidige pagina actief als opslag niet beschikbaar is.
    }
  }

  function consentSettings(value) {
    const state = value === CHOICE_FULL ? 'granted' : 'denied';
    return {
      ad_storage: state,
      analytics_storage: state,
      ad_user_data: state,
      ad_personalization: state
    };
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };
  }

  // Alleen deze loader mag de Google-tag laden; de GA4-configuratie staat in GTM.
  function loadGoogleTagManager() {
    tagManagerLoadScheduled = false;
    if (currentChoice !== CHOICE_FULL || document.getElementById(GOOGLE_TAG_MANAGER_SCRIPT_ID)) return;

    ensureGtag();
    if (!tagManagerConfigured) {
      window.gtag('js', new Date());
      window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      tagManagerConfigured = true;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_TAG_MANAGER_SCRIPT_ID;
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(TAG_MANAGER_ID);
    document.head.appendChild(script);
  }

  function scheduleGoogleTagManagerLoad() {
    if (tagManagerLoadScheduled || document.getElementById(GOOGLE_TAG_MANAGER_SCRIPT_ID)) return;
    tagManagerLoadScheduled = true;

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(loadGoogleTagManager, { timeout: 1500 });
      return;
    }

    window.setTimeout(loadGoogleTagManager, 0);
  }

  function enableGoogleAnalytics() {
    window['ga-disable-' + MEASUREMENT_ID] = false;
    ensureGtag();
    window.gtag('consent', 'update', consentSettings(CHOICE_FULL));
    scheduleGoogleTagManagerLoad();
  }

  // Houd alleen vaste technische kenmerken bij: geen formulierinhoud of linkbestemming.
  function track(eventName, metadata = {}) {
    if (currentChoice !== CHOICE_FULL) return false;
    const event = { event: eventName, page_path: window.location.pathname };
    const identifier = (value) => typeof value === 'string' && /^[a-zA-Z][a-zA-Z0-9_-]{0,119}$/.test(value) ? value : '';

    if (eventName === 'contact_click') {
      if (!['phone', 'whatsapp', 'email'].includes(metadata.contact_method)) return false;
      event.contact_method = metadata.contact_method;
      event.link_id = identifier(metadata.link_id);
    } else if (eventName === 'generate_lead') {
      event.form_id = identifier(metadata.form_id);
      if (!event.form_id) return false;
    } else if (['calculator_started', 'calculator_completed', 'calculator_contact_clicked', 'calculator_transferred'].includes(eventName)) {
      if (!['thuisbatterij', 'zonnepanelen', 'laadpaal', 'elektrotechniek', 'onbekend'].includes(metadata.calculator_type)) return false;
      event.calculator_type = metadata.calculator_type;
    } else {
      return false;
    }

    try {
      window.dataLayer.push(event);
      return true;
    } catch (error) {
      // Meten mag een geslaagde aanvraag of een contactactie nooit onderbreken.
      return false;
    }
  }

  ensureGtag();
  window.gtag('consent', 'default', consentSettings(CHOICE_FUNCTIONAL));
  // main.js kan een opgeslagen calculatoradvies al vóór DOMContentLoaded overnemen.
  if (currentChoice === CHOICE_FULL) window.gtag('consent', 'update', consentSettings(CHOICE_FULL));
  window.SparkyTracking = Object.freeze({ track });

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element && event.target.closest('a[href]');
    if (!link) return;
    let destination;
    try { destination = new URL(link.href, window.location.href); }
    catch (error) { return; }
    let contactMethod;
    if (destination.protocol === 'tel:') contactMethod = 'phone';
    else if (destination.protocol === 'mailto:') contactMethod = 'email';
    else if (['https:', 'http:'].includes(destination.protocol)
      && (destination.hostname === 'wa.me' || destination.hostname === 'whatsapp.com' || destination.hostname.endsWith('.whatsapp.com'))) contactMethod = 'whatsapp';
    if (contactMethod) track('contact_click', { contact_method: contactMethod, link_id: link.id });
  });

  function deleteGoogleAnalyticsCookies() {
    const cookieNames = document.cookie
      .split(';')
      .map((cookie) => cookie.split('=')[0].trim())
      .filter((name) => /^(_ga|_gid|_gat|_gac_|_gcl_)/.test(name));

    const hostname = window.location.hostname;
    const hostnameParts = hostname.split('.').filter(Boolean);
    const domains = new Set(['', hostname, hostname ? '.' + hostname : '']);
    if (hostnameParts.length >= 2) {
      domains.add('.' + hostnameParts.slice(-2).join('.'));
    }

    cookieNames.forEach((name) => {
      domains.forEach((domain) => {
        const domainPart = domain ? '; Domain=' + domain : '';
        document.cookie = name + '=; Max-Age=0; Path=/' + domainPart + '; SameSite=Lax';
      });
    });
  }

  function disableGoogleAnalytics() {
    window['ga-disable-' + MEASUREMENT_ID] = true;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', consentSettings(CHOICE_FUNCTIONAL));
    }
    deleteGoogleAnalyticsCookies();
  }

  function createMapPlaceholder(frame) {
    const placeholder = document.createElement('div');
    placeholder.className = 'footerKaartToestemming';
    placeholder.dataset.cookieMapPlaceholder = '';
    placeholder.innerHTML = '<p>De kaart is beschikbaar met volledige toestemming.</p><button class="cookieKaartVoorkeurenKnop" type="button">Cookie Voorkeuren</button>';
    placeholder.querySelector('button').addEventListener('click', () => showConsentLayer(true));
    frame.insertAdjacentElement('beforebegin', placeholder);
  }

  function updateGoogleMaps(enabled) {
    document.querySelectorAll('iframe[data-cookie-src]').forEach((frame) => {
      const container = frame.parentElement;
      const placeholder = container && container.querySelector('[data-cookie-map-placeholder]');

      if (enabled) {
        if (!frame.src) frame.src = frame.dataset.cookieSrc;
        frame.hidden = false;
        if (placeholder) placeholder.remove();
        return;
      }

      frame.removeAttribute('src');
      frame.hidden = true;
      if (!placeholder) createMapPlaceholder(frame);
    });
  }

  function setPageLocked(locked) {
    if (locked) {
      document.body.classList.add('cookieKeuzeOpen');
      lockedPageElements = Array.from(document.body.children).filter((element) => {
        return element !== consentLayer && element.tagName !== 'SCRIPT';
      });
      lockedPageElements.forEach((element) => {
        if (!element.inert) {
          element.dataset.cookieConsentInert = '';
          element.inert = true;
        }
      });
      return;
    }

    document.body.classList.remove('cookieKeuzeOpen');
    lockedPageElements.forEach((element) => {
      if (element.hasAttribute('data-cookie-consent-inert')) {
        element.inert = false;
        delete element.dataset.cookieConsentInert;
      }
    });
    lockedPageElements = [];
  }

  function focusPageAfterChoice() {
    const target = returnFocusElement && returnFocusElement.isConnected
      ? returnFocusElement
      : document.getElementById('mainContent');

    returnFocusElement = null;
    if (!target) return;

    const needsTemporaryTabindex = !target.hasAttribute('tabindex') && target.id === 'mainContent';
    if (needsTemporaryTabindex) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (needsTemporaryTabindex) {
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
  }

  function closeConsentLayer() {
    consentLayer.hidden = true;
    setPageLocked(false);
    focusPageAfterChoice();
  }

  function showConsentLayer(moveFocus) {
    const activeElement = document.activeElement;
    returnFocusElement = activeElement && activeElement !== document.body ? activeElement : null;
    consentLayer.hidden = false;
    setPageLocked(true);
    if (moveFocus) {
      window.requestAnimationFrame(() => {
        document.getElementById('cookieToestemmingVolledig').focus({ preventScroll: true });
      });
    }
  }

  function chooseFullConsent() {
    saveChoice(CHOICE_FULL);
    enableGoogleAnalytics();
    updateGoogleMaps(true);
    closeConsentLayer();
  }

  function chooseFunctionalOnly() {
    saveChoice(CHOICE_FUNCTIONAL);
    disableGoogleAnalytics();
    updateGoogleMaps(false);
    closeConsentLayer();
  }

  function createConsentLayer() {
    consentLayer = document.createElement('section');
    consentLayer.id = 'cookieToestemmingLaag';
    consentLayer.className = 'cookieToestemmingLaag';
    consentLayer.setAttribute('role', 'dialog');
    consentLayer.setAttribute('aria-modal', 'true');
    consentLayer.setAttribute('aria-labelledby', 'cookieToestemmingTitel');
    consentLayer.setAttribute('aria-describedby', 'cookieToestemmingUitleg');
    consentLayer.hidden = true;
    consentLayer.innerHTML = [
      '<div class="cookieToestemmingInhoud">',
      '  <div class="cookieToestemmingTekst">',
      '    <h2 id="cookieToestemmingTitel">Uw cookiekeuze</h2>',
      '    <p id="cookieToestemmingUitleg"><strong>Volledig:</strong> functionele cookies, Google Analytics en Google Maps. <strong>Weigeren:</strong> alleen functionele cookies.</p>',
      '    <a class="cookiePrivacyLink" href="assets/documenten/privacy-en-cookieverklaring-sparky-energies.pdf" download="privacy-en-cookieverklaring-sparky-energies.pdf">Privacy verklaring</a>',
      '  </div>',
      '  <div class="cookieToestemmingActies">',
      '    <button id="cookieToestemmingVolledig" class="cookieToestemmingKnop cookieToestemmingVolledig" type="button" aria-label="Volledig: alle cookies toestaan">Volledig</button>',
      '    <button id="cookieToestemmingWeigeren" class="cookieToestemmingKnop cookieToestemmingWeigeren" type="button" aria-label="Weigeren: alleen functionele opslag toestaan">Weigeren</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(consentLayer);
    document.getElementById('cookieToestemmingVolledig').addEventListener('click', chooseFullConsent);
    document.getElementById('cookieToestemmingWeigeren').addEventListener('click', chooseFunctionalOnly);

    consentLayer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && currentChoice) {
        closeConsentLayer();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements = Array.from(consentLayer.querySelectorAll('a[href], button:not([disabled])'));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  function createPreferencesLink() {
    preferencesLink = document.createElement('a');
    preferencesLink.className = 'cookieVoorkeurenLink';
    preferencesLink.href = '#cookieToestemmingLaag';
    preferencesLink.textContent = 'Cookie Voorkeuren';
    preferencesLink.addEventListener('click', (event) => {
      event.preventDefault();
      showConsentLayer(true);
    });

    const footerNavigation = document.querySelector('.footerNavigatieLijst');
    if (footerNavigation) {
      const navigationItem = document.createElement('li');
      navigationItem.appendChild(preferencesLink);
      const legalItem = footerNavigation.querySelector('[data-terms-download], [data-privacy-download]')?.closest('li');
      footerNavigation.insertBefore(navigationItem, legalItem || null);
      return;
    }

    const copyright = document.querySelector('.footerCopyright');
    if (copyright) {
      copyright.insertAdjacentElement('beforebegin', preferencesLink);
    } else {
      document.body.appendChild(preferencesLink);
    }
  }

  function initializeCookieConsent() {
    createPreferencesLink();
    createConsentLayer();

    if (currentChoice === CHOICE_FULL) {
      enableGoogleAnalytics();
      updateGoogleMaps(true);
      return;
    }

    disableGoogleAnalytics();
    updateGoogleMaps(false);
    if (!currentChoice) showConsentLayer(true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCookieConsent, { once: true });
  } else {
    initializeCookieConsent();
  }
})();
