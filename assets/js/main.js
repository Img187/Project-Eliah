/*
Sparky Energies - main.js
Alle selectors verwijzen naar vaste HTML-ID's of data-attributen.
*/
(function () {
  const body = document.body;
  const navButton = document.getElementById('navigatieMenuKnop');
  const navList = document.getElementById('primaireNavigatieLijst');
  const accessPanel = document.getElementById('toegankelijkheidPaneel');
  const desktopNavigationQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');

  function initializeLazyBackgrounds() {
    const lazyBackgrounds = Array.from(document.querySelectorAll('.layoutImageCta'));
    if (!lazyBackgrounds.length) return;

    const loadBackground = (element) => element.classList.add('isAchtergrondGeladen');
    if (!('IntersectionObserver' in window)) {
      lazyBackgrounds.forEach(loadBackground);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        loadBackground(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '300px 0px' });

    lazyBackgrounds.forEach((element) => observer.observe(element));
  }

  function initializePagePrefetch() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection && connection.effectiveType;
    if (connection && (connection.saveData || effectiveType === 'slow-2g' || effectiveType === '2g')) return;

    const prefetchedPages = new Set();
    const maximumPrefetches = 4;
    let hoverTimer = 0;
    let hoverLink = null;

    function normalizedPagePath(pathname) {
      return pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    }

    function getPrefetchableUrl(link) {
      if (!(link instanceof HTMLAnchorElement)) return null;
      const rawHref = link.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#')) return null;
      if (link.hasAttribute('download') || link.target && link.target !== '_self') return null;
      if (link.getAttribute('aria-disabled') === 'true' || link.dataset.linkStatus === 'todo' || link.dataset.noPrefetch !== undefined) return null;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return null;
      }

      if (!/^https?:$/.test(url.protocol) || url.origin !== window.location.origin) return null;
      if (!url.pathname.endsWith('/') && !/\.html$/i.test(url.pathname)) return null;

      const currentUrl = new URL(window.location.href);
      if (normalizedPagePath(url.pathname) === normalizedPagePath(currentUrl.pathname) && url.search === currentUrl.search) return null;
      url.hash = '';
      return url;
    }

    function prefetchPage(link) {
      if (prefetchedPages.size >= maximumPrefetches) return;
      const url = getPrefetchableUrl(link);
      if (!url || prefetchedPages.has(url.href)) return;

      const prefetchLink = document.createElement('link');
      prefetchLink.rel = 'prefetch';
      prefetchLink.as = 'document';
      prefetchLink.href = url.href;
      document.head.appendChild(prefetchLink);
      prefetchedPages.add(url.href);
    }

    document.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      const link = event.target.closest && event.target.closest('a[href]');
      if (!link || event.relatedTarget && link.contains(event.relatedTarget)) return;

      window.clearTimeout(hoverTimer);
      hoverLink = link;
      hoverTimer = window.setTimeout(() => {
        prefetchPage(link);
        hoverTimer = 0;
        hoverLink = null;
      }, 120);
    }, { passive: true });

    document.addEventListener('pointerout', (event) => {
      if (!hoverLink || event.relatedTarget && hoverLink.contains(event.relatedTarget)) return;
      window.clearTimeout(hoverTimer);
      hoverTimer = 0;
      hoverLink = null;
    }, { passive: true });

    document.addEventListener('focusin', (event) => {
      const link = event.target.closest && event.target.closest('a[href]');
      if (link) prefetchPage(link);
    });
  }

  function initializeContactTopic() {
    const requestedTopic = new URLSearchParams(window.location.search).get('onderwerp');
    if (!requestedTopic) return;

    const quickAdviceTopic = document.getElementById('contactSnelAdviesOnderwerp');
    if (quickAdviceTopic) quickAdviceTopic.value = requestedTopic;

    const topicMap = {
      zonnestroom: 'zonnepanelen',
      thuisbatterij: 'thuisbatterij',
      zonnepanelen: 'zonnepanelen',
      laadpaal: 'laadpaal',
      elektrotechniek: 'elektrotechniek',
      groepenkast: 'elektrotechniek',
      zakelijk: 'anders'
    };
    const topicCheckbox = document.querySelector(`input[name="situatie"][value="${topicMap[requestedTopic] || ''}"]`);
    if (topicCheckbox) topicCheckbox.checked = true;

    const requestType = document.getElementById('contactSectLatenWeBeginnenAanvraagtype');
    if (requestType) requestType.value = requestedTopic === 'advies' || requestedTopic === 'energierekening' ? 'advies' : 'offerte';
  }

  function initializeContactRouteAccordion() {
    const routeItems = Array.from(document.querySelectorAll('.contactRouteItem'));
    if (!routeItems.length) return;

    routeItems.forEach((item) => {
      item.addEventListener('toggle', () => {
        if (!item.open) return;
        routeItems.forEach((otherItem) => {
          if (otherItem !== item) otherItem.open = false;
        });
      });
    });

    const openRouteFromHash = () => {
      const hashId = window.location.hash.slice(1);
      if (!hashId) return;
      const target = document.getElementById(hashId);
      const routeItem = target && target.closest('.contactRouteItem');
      if (routeItem) routeItem.open = true;
    };

    openRouteFromHash();
    window.addEventListener('hashchange', openRouteFromHash);
  }

  function initializeSectionFlow() {
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll('.mainContent > .siteSectie'));
    if (!sections.length) return;

    const header = document.querySelector('.siteHeader');
    const footer = document.querySelector('.siteFooter');
    const internalAnimationSections = sections.filter((section) => section.matches('.layoutStickySplitCards'));
    let footerIsReleased = false;
    let animationFrame = 0;

    function setSectionVisibility(section, isVisible) {
      section.classList.toggle('sectieFlowInBeeld', isVisible);
      if (isVisible) section.classList.remove('sectieFlowVanBoven', 'sectieFlowVanOnder');
    }

    function classifyInactiveSections() {
      const viewportMiddle = window.innerHeight / 2;
      sections.forEach((section) => {
        if (section.classList.contains('sectieFlowInBeeld')) return;
        const sectionMiddle = section.getBoundingClientRect().top + section.offsetHeight / 2;
        const isBelow = sectionMiddle >= viewportMiddle;
        section.classList.toggle('sectieFlowVanOnder', isBelow);
        section.classList.toggle('sectieFlowVanBoven', !isBelow);
      });
    }

    function setInitialSectionVisibility() {
      const viewportInset = window.innerHeight * .08;
      sections.forEach((section) => {
        const bounds = section.getBoundingClientRect();
        const isVisible = bounds.bottom > viewportInset && bounds.top < window.innerHeight - viewportInset;
        setSectionVisibility(section, isVisible);
      });
    }

    function updateFooterRelease() {
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top;
      const releaseBoundary = window.innerHeight + 24;
      const restoreBoundary = window.innerHeight + 160;

      if (!footerIsReleased && footerTop <= releaseBoundary) footerIsReleased = true;
      if (footerIsReleased && footerTop > restoreBoundary) footerIsReleased = false;
      root.classList.toggle('sectieFlowFooterVrij', footerIsReleased);
    }

    function updateAccessibilityMode() {
      root.classList.toggle('sectieFlowToegankelijk', body.classList.contains('tekstGroot'));
    }

    function updateInternalAnimationMode() {
      const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
      const internalAnimationIsVisible = internalAnimationSections.some((section) => {
        const bounds = section.getBoundingClientRect();
        return bounds.top < window.innerHeight - 2 && bounds.bottom > headerBottom + 2;
      });
      root.classList.toggle('sectieFlowInterneAnimatieVrij', internalAnimationIsVisible);
    }

    function updateHeaderHeight() {
      if (!header) return;
      root.style.setProperty('--sectieFlowKophoogte', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    }

    function updateSectionFlow() {
      animationFrame = 0;
      updateHeaderHeight();
      classifyInactiveSections();
      updateInternalAnimationMode();
      updateFooterRelease();
    }

    function scheduleSectionFlowUpdate() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateSectionFlow);
    }

    setInitialSectionVisibility();
    updateHeaderHeight();
    classifyInactiveSections();
    updateInternalAnimationMode();
    updateFooterRelease();
    updateAccessibilityMode();
    root.classList.add('sectieFlowActief');

    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => setSectionVisibility(entry.target, entry.isIntersecting));
        classifyInactiveSections();
      }, { rootMargin: '-8% 0px -8% 0px', threshold: 0 });

      sections.forEach((section) => sectionObserver.observe(section));
    } else {
      sections.forEach((section) => section.classList.add('sectieFlowInBeeld'));
    }

    const accessibilityObserver = new MutationObserver(updateAccessibilityMode);
    accessibilityObserver.observe(body, { attributes: true, attributeFilter: ['class'] });

    if (header && 'ResizeObserver' in window) {
      const headerObserver = new ResizeObserver(scheduleSectionFlowUpdate);
      headerObserver.observe(header);
    }

    window.addEventListener('scroll', scheduleSectionFlowUpdate, { passive: true });
    window.addEventListener('resize', scheduleSectionFlowUpdate, { passive: true });
  }

  initializeLazyBackgrounds();
  initializePagePrefetch();
  initializeContactTopic();
  initializeContactRouteAccordion();
  initializeSectionFlow();

  if (navButton && navList) {
    navButton.addEventListener('click', () => {
      const isOpen = navButton.getAttribute('aria-expanded') === 'true';
      navButton.setAttribute('aria-expanded', String(!isOpen));
      navList.classList.toggle('isOpen', !isOpen);
      if (isOpen) closeDienstenSubmenu(navList);
    });

    navList.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        navButton.setAttribute('aria-expanded', 'false');
        navList.classList.remove('isOpen');
        closeDienstenSubmenu(navList);
      }
    });

    buildDienstenDropdown(navList);

    const closeMobileMenuOnDesktop = (mediaQuery) => {
      if (!mediaQuery.matches) return;
      navButton.setAttribute('aria-expanded', 'false');
      navList.classList.remove('isOpen');
      closeDienstenSubmenu(navList);
    };

    if ('addEventListener' in desktopNavigationQuery) {
      desktopNavigationQuery.addEventListener('change', closeMobileMenuOnDesktop);
    } else {
      desktopNavigationQuery.addListener(closeMobileMenuOnDesktop);
    }
    closeMobileMenuOnDesktop(desktopNavigationQuery);
  }

  if (accessPanel) {
    buildAccessibilityDropdown(accessPanel);
  }

  // Vaste WhatsApp- en back-to-topknoppen voor alle openbare pagina's.
  const floatingActionButtons = document.createElement('div');
  floatingActionButtons.className = 'vasteActieKnoppen';

  const whatsappPhoneNumber = '31107934002';
  const whatsappDesktopQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const whatsappButton = document.createElement('a');
  whatsappButton.id = 'siteWhatsAppKnop';
  whatsappButton.className = 'whatsAppKnop';
  whatsappButton.target = '_blank';
  whatsappButton.rel = 'noopener noreferrer';
  whatsappButton.setAttribute('aria-label', 'Chat met Sparky Energies via WhatsApp');
  whatsappButton.title = 'Chat met ons via WhatsApp';
  whatsappButton.innerHTML = '<img class="whatsAppKnopLogo" src="assets/img/SparkyEnergies_Algemeen_Afbeelding_08.svg" alt="" width="36" height="36" aria-hidden="true">';

  function updateWhatsAppDestination(mediaQuery) {
    const isDesktop = mediaQuery.matches;
    whatsappButton.href = isDesktop
      ? `https://web.whatsapp.com/send?phone=${whatsappPhoneNumber}`
      : `https://wa.me/${whatsappPhoneNumber}`;
    whatsappButton.dataset.whatsappBestemming = isDesktop ? 'web' : 'app';
  }

  if ('addEventListener' in whatsappDesktopQuery) {
    whatsappDesktopQuery.addEventListener('change', updateWhatsAppDestination);
  } else {
    whatsappDesktopQuery.addListener(updateWhatsAppDestination);
  }
  updateWhatsAppDestination(whatsappDesktopQuery);
  floatingActionButtons.appendChild(whatsappButton);

  // Eén vaste mobiele contactroute op elke pagina.
  const mobileContactBar = document.createElement('nav');
  mobileContactBar.className = 'mobieleContactBalk';
  mobileContactBar.setAttribute('aria-label', 'Snel contact');
  mobileContactBar.innerHTML = '<a href="tel:+31107934002">Bel ons</a><a href="contact.html#contactRouteKeuze">Advies aanvragen</a>';
  body.appendChild(mobileContactBar);

  const backToTopButton = document.createElement('button');
  backToTopButton.id = 'siteBackToTopKnop';
  backToTopButton.className = 'backNaarBovenKnop';
  backToTopButton.type = 'button';
  backToTopButton.setAttribute('aria-label', 'Terug naar het begin van de pagina');
  backToTopButton.setAttribute('aria-hidden', 'true');
  backToTopButton.setAttribute('tabindex', '-1');
  backToTopButton.title = 'Terug naar boven';
  backToTopButton.innerHTML = '<span class="backNaarBovenIcoon" aria-hidden="true">&uarr;</span><span class="backNaarBovenTekst">Terug naar boven</span>';
  floatingActionButtons.appendChild(backToTopButton);
  body.appendChild(floatingActionButtons);

  let backToTopFrame = 0;

  function updateBackToTopButton() {
    backToTopFrame = 0;
    const isVisible = window.scrollY > 360;
    backToTopButton.classList.toggle('isZichtbaar', isVisible);
    backToTopButton.setAttribute('aria-hidden', String(!isVisible));
    backToTopButton.setAttribute('tabindex', isVisible ? '0' : '-1');
  }

  function scheduleBackToTopUpdate() {
    if (backToTopFrame) return;
    backToTopFrame = window.requestAnimationFrame(updateBackToTopButton);
  }

  backToTopButton.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', scheduleBackToTopUpdate, { passive: true });
  updateBackToTopButton();

  function buildAccessibilityDropdown(panel) {
    const buttons = Array.from(panel.querySelectorAll('button[data-accessibility-action]'));
    if (!buttons.length) return;

    const details = document.createElement('details');
    details.className = 'toegankelijkheidDetails';

    const summary = document.createElement('summary');
    summary.className = 'toegankelijkheidToggle';
    summary.setAttribute('aria-label', 'Instellingen');
    summary.innerHTML = '<span class="toegankelijkheidToggleIcoon" aria-hidden="true">⚙</span><span class="srOnly">Instellingen</span>';

    const submenu = document.createElement('ul');
    submenu.id = 'toegankelijkheidSubmenu';
    submenu.className = 'toegankelijkheidSubmenu';
    submenu.setAttribute('role', 'menu');

    buttons.forEach((button) => {
      const item = document.createElement('li');
      item.appendChild(button);
      submenu.appendChild(item);
    });

    details.appendChild(summary);
    details.appendChild(submenu);

    panel.innerHTML = '';
    panel.appendChild(details);

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target)) {
        details.open = false;
      }
    });
  }

  function buildDienstenDropdown(navList) {
    const dienstLabels = ['Thuisbatterijen', 'Zonnepanelen', 'Laadpalen', 'Elektrotechniek'];
    const itemNodes = Array.from(navList.querySelectorAll('li'));
    const dienstItems = itemNodes.filter((item) => {
      const link = item.querySelector('a');
      return link && dienstLabels.includes(link.textContent.trim());
    });

    if (dienstItems.length !== dienstLabels.length) return;

    const submenu = document.createElement('ul');
    submenu.id = 'dienstenSubmenu';
    submenu.className = 'primaireNavigatieSubmenu';
    submenu.setAttribute('role', 'list');

    dienstItems.forEach((item) => submenu.appendChild(item));

    const toggleButton = document.createElement('button');
    toggleButton.className = 'primaireNavigatieLink primaireNavigatieSubmenuToggle';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.setAttribute('aria-controls', 'dienstenSubmenu');
    toggleButton.textContent = 'Diensten';

    const wrapper = document.createElement('li');
    wrapper.className = 'primaireNavigatieItem hasSubmenu';
    wrapper.appendChild(toggleButton);
    wrapper.appendChild(submenu);

    const firstServiceIndex = itemNodes.indexOf(dienstItems[0]);
    if (firstServiceIndex >= 0) {
      navList.insertBefore(wrapper, navList.children[firstServiceIndex]);
    } else {
      navList.appendChild(wrapper);
    }

    const setSubmenuOpen = (isOpen) => {
      toggleButton.setAttribute('aria-expanded', String(isOpen));
      submenu.classList.toggle('isOpen', isOpen);
    };

    toggleButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = toggleButton.getAttribute('aria-expanded') === 'true';
      setSubmenuOpen(!isOpen);
    });

    wrapper.addEventListener('mouseenter', () => {
      if (desktopNavigationQuery.matches) setSubmenuOpen(true);
    });

    Array.from(navList.children).forEach((item) => {
      if (item === wrapper) return;

      item.addEventListener('mouseenter', () => {
        if (desktopNavigationQuery.matches) setSubmenuOpen(false);
      });

      item.addEventListener('focusin', () => {
        setSubmenuOpen(false);
      });
    });

    document.addEventListener('click', (event) => {
      if (!wrapper.contains(event.target)) {
        setSubmenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || toggleButton.getAttribute('aria-expanded') !== 'true') return;
      setSubmenuOpen(false);
      toggleButton.focus();
    });
  }

  function closeDienstenSubmenu(navList) {
    const submenu = navList.querySelector('.primaireNavigatieSubmenu');
    const toggleButton = navList.querySelector('.primaireNavigatieSubmenuToggle');
    if (submenu) submenu.classList.remove('isOpen');
    if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
  }

  function setPressed(id, state) {
    const button = document.getElementById(id);
    if (button) button.setAttribute('aria-pressed', String(state));
  }

  function restoreAccessibilitySettings() {
    const textLarge = localStorage.getItem('sparkyTekstGroot') === 'true';
    const highContrast = localStorage.getItem('sparkyHoogContrast') === 'true';
    body.classList.toggle('tekstGroot', textLarge);
    body.classList.toggle('hoogContrast', highContrast);
    setPressed('knopGrotereTekst', textLarge);
    setPressed('knopHoogContrast', highContrast);
  }

  restoreAccessibilitySettings();

  document.querySelectorAll('[data-accessibility-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.accessibilityAction;
      if (action === 'toggle-text-size') {
        const state = !body.classList.contains('tekstGroot');
        body.classList.toggle('tekstGroot', state);
        localStorage.setItem('sparkyTekstGroot', String(state));
        button.setAttribute('aria-pressed', String(state));
      }
      if (action === 'toggle-contrast') {
        const state = !body.classList.contains('hoogContrast');
        body.classList.toggle('hoogContrast', state);
        localStorage.setItem('sparkyHoogContrast', String(state));
        button.setAttribute('aria-pressed', String(state));
      }
      if (action === 'read-page') readCurrentPageText();
      if (action === 'stop-reading') stopReading();
    });
  });

  function getReadableText() {
    const main = document.getElementById('mainContent');
    if (!main) return '';
    const clone = main.cloneNode(true);
    clone.querySelectorAll('form, button, nav, .mediaNotitie, .formulierNotitie').forEach((el) => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function readCurrentPageText() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      alert('Voorlezen wordt niet ondersteund in deze browser.');
      return;
    }
    stopReading();
    const utterance = new SpeechSynthesisUtterance(getReadableText());
    utterance.lang = 'nl-NL';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function stopReading() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  // Scrollknoppen: HTML gebruikt data-scroll-area, data-scroll-prev en data-scroll-next.
  const carouselReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const carouselScrollBehavior = carouselReducedMotion ? 'auto' : 'smooth';

  document.querySelectorAll('[data-scroll-prev], [data-scroll-next]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.scrollPrev || button.dataset.scrollNext;
      const section = document.getElementById(targetId);
      const scrollArea = section ? section.querySelector('[data-scroll-area]') : null;
      if (!scrollArea) return;
      const direction = button.dataset.scrollPrev ? -1 : 1;
      const paginationPositions = scrollArea.sparkyScrollPositions;

      if (Array.isArray(paginationPositions) && paginationPositions.length > 1) {
        const currentIndex = paginationPositions.reduce((closestIndex, position, index) => (
          Math.abs(position - scrollArea.scrollLeft) < Math.abs(paginationPositions[closestIndex] - scrollArea.scrollLeft)
            ? index
            : closestIndex
        ), 0);
        const targetIndex = Math.min(paginationPositions.length - 1, Math.max(0, currentIndex + direction));
        scrollArea.scrollTo({ left: paginationPositions[targetIndex], behavior: carouselScrollBehavior });
        return;
      }

      const amount = Math.max(280, scrollArea.clientWidth * 0.85);
      scrollArea.scrollBy({ left: direction * amount, behavior: carouselScrollBehavior });
    });
  });

  // Paginatiebolletjes: worden opnieuw berekend als de carrousel van formaat verandert.
  document.querySelectorAll('[data-scroll-pagination]').forEach((pagination) => {
    const targetId = pagination.dataset.scrollPagination;
    const section = document.getElementById(targetId);
    const scrollArea = section ? section.querySelector('[data-scroll-area]') : null;
    if (!scrollArea) return;

    const items = Array.from(scrollArea.children);
    const autoplayDelay = Number(pagination.dataset.scrollAutoplay || 0);
    let positions = [];
    let dots = [];
    let scrollFrame = 0;
    let autoplayTimer = 0;
    let isPointerOver = false;
    let isFocusWithin = false;
    let isPointerDown = false;

    function getActivePositionIndex() {
      return positions.reduce((closestIndex, position, index) => (
        Math.abs(position - scrollArea.scrollLeft) < Math.abs(positions[closestIndex] - scrollArea.scrollLeft)
          ? index
          : closestIndex
      ), 0);
    }

    function stopAutoplay() {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = 0;
    }

    function scheduleAutoplay() {
      stopAutoplay();
      const interactionPaused = isPointerOver || isFocusWithin || isPointerDown;
      if (!autoplayDelay || carouselReducedMotion || positions.length <= 1 || interactionPaused || document.hidden) return;

      autoplayTimer = window.setTimeout(() => {
        const nextIndex = (getActivePositionIndex() + 1) % positions.length;
        scrollArea.scrollTo({ left: positions[nextIndex], behavior: carouselScrollBehavior });
        scheduleAutoplay();
      }, autoplayDelay);
    }

    function updateActiveDot() {
      if (!positions.length) return;
      const activeIndex = getActivePositionIndex();

      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle('isActief', isActive);
        if (isActive) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
    }

    function rebuildPagination() {
      const scrollAreaRect = scrollArea.getBoundingClientRect();
      const maxScroll = Math.max(0, scrollArea.scrollWidth - scrollArea.clientWidth);
      const calculatedPositions = items.map((item) => {
        const itemPosition = item.getBoundingClientRect().left - scrollAreaRect.left + scrollArea.scrollLeft;
        return Math.min(maxScroll, Math.max(0, itemPosition));
      });

      positions = calculatedPositions.filter((position, index, allPositions) => (
        index === 0 || Math.abs(position - allPositions[index - 1]) > 2
      ));
      if (!positions.length) positions = [0];
      scrollArea.sparkyScrollPositions = positions;

      pagination.replaceChildren();
      dots = positions.map((position, index) => {
        const dot = document.createElement('button');
        dot.className = 'scrollPagineringBolletje';
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ga naar projectpositie ${index + 1} van ${positions.length}`);
        dot.addEventListener('click', () => {
          stopAutoplay();
          scrollArea.scrollTo({ left: position, behavior: carouselScrollBehavior });
          scheduleAutoplay();
        });
        pagination.appendChild(dot);
        return dot;
      });

      pagination.hidden = positions.length <= 1;
      updateActiveDot();
      scheduleAutoplay();
    }

    scrollArea.addEventListener('scroll', () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(updateActiveDot);
    }, { passive: true });

    section.addEventListener('mouseenter', () => {
      isPointerOver = true;
      stopAutoplay();
    });
    section.addEventListener('mouseleave', () => {
      isPointerOver = false;
      scheduleAutoplay();
    });
    section.addEventListener('focusin', () => {
      isFocusWithin = true;
      stopAutoplay();
    });
    section.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => {
        isFocusWithin = section.contains(document.activeElement);
        scheduleAutoplay();
      });
    });
    scrollArea.addEventListener('pointerdown', () => {
      isPointerDown = true;
      stopAutoplay();
    });
    window.addEventListener('pointerup', () => {
      if (!isPointerDown) return;
      isPointerDown = false;
      scheduleAutoplay();
    });
    window.addEventListener('pointercancel', () => {
      isPointerDown = false;
      scheduleAutoplay();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopAutoplay();
      else scheduleAutoplay();
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(rebuildPagination);
      resizeObserver.observe(scrollArea);
      scrollArea.sparkyResizeObserver = resizeObserver;
    } else {
      window.addEventListener('resize', rebuildPagination);
    }

    rebuildPagination();
  });

  // Sticky split-kaarten: maak alle kaarten even hoog en schaal de vorige tijdens het scrollen.
  const desktopAnimationQuery = window.matchMedia('(min-width: 1024px) and (min-height: 700px) and (hover: hover) and (pointer: fine)');
  document.querySelectorAll('[data-sticky-stack]').forEach((stack) => {
    const items = Array.from(stack.querySelectorAll('[data-sticky-card]'));
    const panels = items.map((item) => item.querySelector('[data-sticky-panel], .thuisbatterijEmsKaart'));
    if (items.length < 2 || panels.some((panel) => !panel)) return;

    let stackFrame = 0;
    let equalHeightFrame = 0;

    function isStickyLayoutActive() {
      return desktopAnimationQuery.matches
        && !carouselReducedMotion
        && !body.classList.contains('tekstGroot');
    }

    function updateStickyStack() {
      stackFrame = 0;
      const stickyLayoutActive = isStickyLayoutActive();

      panels.forEach((panel, index) => {
        if (!stickyLayoutActive || index === panels.length - 1) {
          panel.style.setProperty('--ems-kaart-schaal', '1');
          return;
        }

        const stickyTop = Number.parseFloat(window.getComputedStyle(items[index]).top) || 96;
        const nextTop = items[index + 1].getBoundingClientRect().top;
        const scrollDistance = Math.max(1, window.innerHeight - stickyTop);
        const progress = Math.min(1, Math.max(0, (window.innerHeight - nextTop) / scrollDistance));
        panel.style.setProperty('--ems-kaart-schaal', (1 - (progress * 0.2)).toFixed(3));
      });
    }

    function scheduleStickyStackUpdate() {
      if (stackFrame) return;
      stackFrame = window.requestAnimationFrame(updateStickyStack);
    }

    function handleStickyStackScroll() {
      if (!isStickyLayoutActive()) return;
      scheduleStickyStackUpdate();
    }

    function equalizePanelHeights() {
      equalHeightFrame = 0;
      panels.forEach((panel) => panel.style.removeProperty('min-height'));
      if (!isStickyLayoutActive()) {
        scheduleStickyStackUpdate();
        return;
      }
      const largestPanelHeight = Math.max(...panels.map((panel) => panel.offsetHeight));
      panels.forEach((panel) => panel.style.setProperty('min-height', `${largestPanelHeight}px`));
      scheduleStickyStackUpdate();
    }

    function scheduleEqualHeightUpdate() {
      if (equalHeightFrame) return;
      equalHeightFrame = window.requestAnimationFrame(equalizePanelHeights);
    }

    window.addEventListener('scroll', handleStickyStackScroll, { passive: true });
    window.addEventListener('resize', scheduleEqualHeightUpdate);
    if ('addEventListener' in desktopAnimationQuery) {
      desktopAnimationQuery.addEventListener('change', scheduleEqualHeightUpdate);
    } else {
      desktopAnimationQuery.addListener(scheduleEqualHeightUpdate);
    }

    if (document.readyState === 'complete') scheduleEqualHeightUpdate();
    else window.addEventListener('load', scheduleEqualHeightUpdate, { once: true });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleEqualHeightUpdate);
    }

    const bodyClassObserver = new MutationObserver(scheduleEqualHeightUpdate);
    bodyClassObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
    stack.sparkyBodyClassObserver = bodyClassObserver;

    equalizePanelHeights();
    updateStickyStack();
  });

  // Scrollafbeeldingen: vergroot het beeld vanaf het ingestelde triggerpunt (standaard 80%).
  document.querySelectorAll('[data-scroll-expand-image]').forEach((card) => {
    const media = card.querySelector('[data-scroll-expand-media], .laadpalenSplitKaartMedia');
    if (!media) return;

    const section = card.closest('.siteSectie') || card;
    const fullBleed = card.hasAttribute('data-scroll-expand-full-bleed');
    const configuredStartRatio = Number.parseFloat(card.dataset.scrollExpandStart || '0.8');
    const startRatio = Number.isFinite(configuredStartRatio)
      ? Math.min(1, Math.max(0, configuredStartRatio))
      : 0.8;
    const configuredDistanceRatio = Number.parseFloat(card.dataset.scrollExpandDistance || '0.5');
    const distanceRatio = Number.isFinite(configuredDistanceRatio)
      ? Math.min(2, Math.max(0.1, configuredDistanceRatio))
      : 0.5;
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clipPathSupported = window.CSS && window.CSS.supports('clip-path', 'inset(0 50% 0 0)');
    let imageFrame = 0;
    let focusWithin = false;
    let fullBleedBounds = null;

    function resetScrollImage() {
      card.classList.remove('isScrollAfbeeldingActief');
      card.style.removeProperty('--scroll-afbeelding-inset');
      card.style.removeProperty('--scroll-volledige-breedte-offset-links');
      card.style.removeProperty('--scroll-volledige-breedte');
      card.style.removeProperty('--scroll-afbeelding-inset-links');
      card.style.removeProperty('--scroll-afbeelding-inset-rechts');
      card.style.removeProperty('--scroll-afbeelding-radius');
      fullBleedBounds = null;
    }

    function updateScrollImage() {
      imageFrame = 0;
      const animationActive = clipPathSupported
        && !reducedMotionQuery.matches
        && !body.classList.contains('tekstGroot')
        && desktopAnimationQuery.matches;

      if (!animationActive) {
        resetScrollImage();
        return;
      }

      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      if (fullBleed && (!fullBleedBounds || fullBleedBounds.viewportWidth !== viewportWidth)) {
        const wasActive = card.classList.contains('isScrollAfbeeldingActief');
        card.classList.remove('isScrollAfbeeldingActief');
        const baseCardRect = card.getBoundingClientRect();
        const baseMediaRect = media.getBoundingClientRect();
        fullBleedBounds = {
          viewportWidth,
          offsetLeft: -baseCardRect.left,
          insetLeft: Math.max(0, baseMediaRect.left),
          insetRight: Math.max(0, viewportWidth - baseMediaRect.right),
        };
        card.classList.toggle('isScrollAfbeeldingActief', wasActive);
      }

      card.classList.add('isScrollAfbeeldingActief');
      const sectionRect = section.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const animationStartPoint = sectionRect.top + (sectionRect.height * startRatio);
      const animationDistance = Math.max(1, Math.min(sectionRect.height * distanceRatio, window.innerHeight * 0.75));
      const scrollProgress = Math.min(1, Math.max(0, (viewportCenter - animationStartPoint) / animationDistance));
      const progress = focusWithin ? 0 : scrollProgress;
      const imageInset = (1 - progress) * 50;

      if (fullBleed) {
        const hiddenPart = 1 - progress;
        card.style.setProperty('--scroll-volledige-breedte-offset-links', `${fullBleedBounds.offsetLeft.toFixed(2)}px`);
        card.style.setProperty('--scroll-volledige-breedte', `${viewportWidth.toFixed(2)}px`);
        card.style.setProperty('--scroll-afbeelding-inset-links', `${(fullBleedBounds.insetLeft * hiddenPart).toFixed(2)}px`);
        card.style.setProperty('--scroll-afbeelding-inset-rechts', `${(fullBleedBounds.insetRight * hiddenPart).toFixed(2)}px`);
        card.style.setProperty('--scroll-afbeelding-radius', `${(10 * hiddenPart).toFixed(2)}px`);
      } else {
        card.style.setProperty('--scroll-afbeelding-inset', `${imageInset.toFixed(2)}%`);
      }
    }

    function scheduleScrollImageUpdate() {
      if (imageFrame) return;
      imageFrame = window.requestAnimationFrame(updateScrollImage);
    }

    window.addEventListener('scroll', scheduleScrollImageUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollImageUpdate);
    if ('addEventListener' in reducedMotionQuery) {
      reducedMotionQuery.addEventListener('change', scheduleScrollImageUpdate);
    } else {
      reducedMotionQuery.addListener(scheduleScrollImageUpdate);
    }
    if ('addEventListener' in desktopAnimationQuery) {
      desktopAnimationQuery.addEventListener('change', scheduleScrollImageUpdate);
    } else {
      desktopAnimationQuery.addListener(scheduleScrollImageUpdate);
    }

    card.addEventListener('focusin', () => {
      focusWithin = true;
      scheduleScrollImageUpdate();
    });
    card.addEventListener('focusout', () => {
      window.requestAnimationFrame(() => {
        focusWithin = card.contains(document.activeElement);
        scheduleScrollImageUpdate();
      });
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleScrollImageUpdate);
    }

    if ('ResizeObserver' in window) {
      const imageResizeObserver = new ResizeObserver(scheduleScrollImageUpdate);
      imageResizeObserver.observe(section);
      card.sparkyResizeObserver = imageResizeObserver;
    }

    const imageBodyClassObserver = new MutationObserver(scheduleScrollImageUpdate);
    imageBodyClassObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
    card.sparkyBodyClassObserver = imageBodyClassObserver;

    updateScrollImage();
  });

  // Proces-tijdlijn: vul de verticale lijn op basis van de zichtbare scrollvoortgang.
  document.querySelectorAll('[data-process-timeline]').forEach((timeline) => {
    const progressBar = timeline.querySelector('[data-process-progress]');
    if (!progressBar) return;

    if (carouselReducedMotion) {
      progressBar.style.height = '100%';
      return;
    }

    let timelineFrame = 0;

    function updateProcessTimeline() {
      timelineFrame = 0;
      const timelineRect = timeline.getBoundingClientRect();
      const startOffset = window.innerHeight * 0.7;
      const endOffset = window.innerHeight * 0.3;
      const scrollDistance = Math.max(1, timelineRect.height + startOffset - endOffset);
      const progress = Math.min(1, Math.max(0, (startOffset - timelineRect.top) / scrollDistance));
      progressBar.style.height = `${(progress * 100).toFixed(2)}%`;
    }

    function scheduleProcessTimelineUpdate() {
      if (timelineFrame) return;
      timelineFrame = window.requestAnimationFrame(updateProcessTimeline);
    }

    window.addEventListener('scroll', scheduleProcessTimelineUpdate, { passive: true });
    window.addEventListener('resize', scheduleProcessTimelineUpdate);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleProcessTimelineUpdate);
    }

    const timelineBodyClassObserver = new MutationObserver(scheduleProcessTimelineUpdate);
    timelineBodyClassObserver.observe(body, { attributes: true, attributeFilter: ['class'] });
    timeline.sparkyBodyClassObserver = timelineBodyClassObserver;

    updateProcessTimeline();
  });

  // Voorkom dat TODO-links de gebruiker naar een lege plek sturen.
  document.querySelectorAll('a[data-link-status="todo"], a[aria-disabled="true"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const note = link.dataset.linkNote || 'Deze link moet later nog worden gekoppeld.';
      alert(note);
    });
  });

  // Verstuur aanvragen via Formspree zonder de bezoeker van de website weg te sturen.
  document.querySelectorAll('form[data-formspree-form]').forEach((form) => {
    const requiredCheckboxGroups = form.querySelectorAll('[data-required-checkbox-group]');

    const validateCheckboxGroup = (group) => {
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const firstCheckbox = checkboxes[0];
      if (!firstCheckbox) return;
      const hasSelection = checkboxes.some((checkbox) => checkbox.checked);
      firstCheckbox.setCustomValidity(hasSelection ? '' : 'Kies minimaal één optie.');
    };

    requiredCheckboxGroups.forEach((group) => {
      group.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => validateCheckboxGroup(group));
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const note = form.querySelector('.formulierNotitie');
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');

      requiredCheckboxGroups.forEach(validateCheckboxGroup);

      if (!form.checkValidity()) {
        form.reportValidity();
        if (note) {
          note.hidden = false;
          note.dataset.status = 'error';
          note.textContent = 'Controleer de verplichte velden.';
        }
        return;
      }

      if (submitButton) {
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.textContent = 'Versturen…';
      }

      if (note) {
        note.hidden = false;
        note.dataset.status = 'pending';
        note.textContent = 'Uw aanvraag wordt verstuurd…';
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          const formspreeMessage = Array.isArray(result.errors)
            ? result.errors.map((error) => error.message).filter(Boolean).join(' ')
            : '';
          throw new Error(formspreeMessage || 'De aanvraag kon niet worden verstuurd.');
        }

        form.reset();
        if (note) {
          note.dataset.status = 'success';
          note.textContent = 'Bedankt voor uw inzending! We nemen zo spoedig mogelijk contact met u op.';
        }
      } catch (error) {
        if (note) {
          note.dataset.status = 'error';
          note.textContent = `${error.message || 'Er ging iets mis bij het versturen.'} Probeer het opnieuw of mail naar info@sparkyenergies.com.`;
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-busy');
          submitButton.textContent = submitButton.dataset.originalText || 'Versturen';
          delete submitButton.dataset.originalText;
        }
      }
    });
  });

  const calculatorStorageKey = 'sparkyCalculatorAanvraag';

  function trackCalculatorEvent(eventName, calculatorType) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, {
      calculator_type: calculatorType,
      event_category: 'adviescalculator'
    });
  }

  function roundToFive(value) {
    return Math.max(5, Math.round(value / 5) * 5);
  }

  function getBatteryAdvice(values) {
    const usage = Number(values.get('jaarverbruikKwh'));
    const solarYield = Number(values.get('zonneOpwekKwh'));
    const panels = Number(values.get('aantalZonnepanelen'));
    const contract = String(values.get('energiecontract') || 'onbekend');
    const hasEv = values.get('elektrischeAuto') === 'ja';
    const hasHeatPump = values.get('warmtepomp') === 'ja';
    const wantsBackup = values.get('noodstroom') === 'ja';
    const dailyUse = usage / 365;
    const dailySolar = solarYield / 365;
    const profileAdjustment = (hasEv ? 2 : 0) + (hasHeatPump ? 2 : 0) + (wantsBackup ? 3 : 0);
    const centerCapacity = Math.min(40, roundToFive(Math.min(dailyUse * .65, dailySolar * .8) + profileAdjustment));
    const lowerCapacity = Math.max(5, centerCapacity - 5);
    const upperCapacity = Math.min(45, centerCapacity + 5);
    const suitability = solarYield >= usage * .35
      ? 'Uw verbruik en zonne-opwek geven een goede uitgangspositie voor opslag.'
      : solarYield > 0
        ? 'Opslag kan interessant zijn, maar de verhouding tussen opwek en verbruik moet eerst worden gecontroleerd.'
        : 'Zonder eigen opwek hangt de meerwaarde vooral af van uw energiecontract en verbruiksmomenten.';
    const additions = [hasEv && 'elektrische auto', hasHeatPump && 'warmtepomp', wantsBackup && 'noodstroom'].filter(Boolean);
    const details = [
      `Uitgangspunt: ${usage.toLocaleString('nl-NL')} kWh verbruik en ${solarYield.toLocaleString('nl-NL')} kWh zonne-opwek per jaar.`,
      additions.length ? `Extra rekening gehouden met: ${additions.join(', ')}.` : 'Er zijn geen extra grote stroomverbruikers geselecteerd.',
      contract === 'dynamisch' ? 'Slimme sturing kan ook inspelen op uurprijzen.' : 'Het contracttype en uw dagprofiel bepalen mede de uiteindelijke businesscase.'
    ];

    return {
      type: 'thuisbatterij',
      topic: 'thuisbatterij',
      title: `${lowerCapacity}–${upperCapacity} kWh opslag`,
      summary: suitability,
      details,
      fields: [
        ['Jaarverbruik', `${usage.toLocaleString('nl-NL')} kWh`],
        ['Zonne-opwek', `${solarYield.toLocaleString('nl-NL')} kWh`],
        ['Zonnepanelen', String(panels)],
        ['Energiecontract', contract],
        ['Elektrische auto', hasEv ? 'Ja' : 'Nee'],
        ['Warmtepomp', hasHeatPump ? 'Ja' : 'Nee'],
        ['Noodstroom gewenst', wantsBackup ? 'Ja' : 'Nee']
      ]
    };
  }

  function getSolarAdvice(values) {
    const usage = Number(values.get('jaarverbruikKwh'));
    const existingPanels = Number(values.get('bestaandePanelen'));
    const roofType = String(values.get('daktype'));
    const direction = String(values.get('dakrichting'));
    const hasEv = values.get('elektrischeAuto') === 'ja';
    const hasHeatPump = values.get('warmtepomp') === 'ja';
    const futureDemand = usage + (hasEv ? 2500 : 0) + (hasHeatPump ? 3500 : 0);
    const yieldPerPanelMap = { zuid: 380, 'oost-west': 340, plat: 360, noord: 270, onbekend: 330 };
    const yieldPerPanel = yieldPerPanelMap[direction] || 330;
    const existingYield = existingPanels * 340;
    const remainingDemand = Math.max(0, futureDemand - existingYield);
    const panelCount = Math.min(60, Math.ceil(remainingDemand / yieldPerPanel));
    const lowerCount = panelCount > 0 ? Math.max(1, panelCount - 1) : 0;
    const upperCount = Math.min(60, panelCount + 1);
    const systemPower = panelCount * .435;
    const estimatedYield = panelCount * yieldPerPanel;
    const title = panelCount > 0
      ? `${lowerCount}–${upperCount} ${existingPanels ? 'extra ' : ''}zonnepanelen`
      : 'Uw bestaande set kan passend zijn';
    const summary = panelCount > 0
      ? `Richtpunt: ongeveer ${systemPower.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kWp nieuw vermogen voor uw verwachte stroomvraag.`
      : 'Op basis van deze jaarwaarden lijkt eerst een opbrengstcontrole van uw huidige installatie logischer dan direct uitbreiden.';
    const additions = [hasEv && 'elektrische auto', hasHeatPump && 'warmtepomp'].filter(Boolean);

    return {
      type: 'zonnepanelen',
      topic: 'zonnepanelen',
      title,
      summary,
      details: [
        panelCount > 0 ? `Geschatte opbrengst van de uitbreiding: circa ${estimatedYield.toLocaleString('nl-NL')} kWh per jaar.` : `Geschatte bestaande opwek: circa ${existingYield.toLocaleString('nl-NL')} kWh per jaar.`,
        additions.length ? `Toekomstig verbruik meegenomen voor: ${additions.join(' en ')}.` : 'De indicatie is gebaseerd op uw huidige stroomverbruik.',
        direction === 'noord' ? 'Een noordgericht dak vraagt extra aandacht voor rendement en alternatieve dakvlakken.' : `Daktype en richting (${roofType}, ${direction}) zijn verwerkt als eerste opbrengstfactor.`
      ],
      fields: [
        ['Jaarverbruik', `${usage.toLocaleString('nl-NL')} kWh`],
        ['Bestaande panelen', String(existingPanels)],
        ['Daktype', roofType],
        ['Dakrichting', direction],
        ['Elektrische auto gepland', hasEv ? 'Ja' : 'Nee'],
        ['Warmtepomp gepland', hasHeatPump ? 'Ja' : 'Nee']
      ]
    };
  }

  function getChargerAdvice(values) {
    const location = String(values.get('gebruikslocatie'));
    const connection = String(values.get('netaansluiting'));
    const dailyKilometers = Number(values.get('kilometersPerDag'));
    const cableDistance = Number(values.get('afstandMeterkastMeter'));
    const solar = String(values.get('zonnepanelenAanwezig'));
    const businessSettlement = values.get('zakelijkVerrekenen') === 'ja';
    const smartCharging = values.get('slimLaden') === 'ja';
    const dailyEnergy = Math.max(1, Math.round(dailyKilometers * .2));
    const title = connection === '3-fase'
      ? '11 kW slim laden'
      : connection === '1-fase'
        ? '3,7 kW of aansluiting beoordelen'
        : 'Aansluiting eerst beoordelen';
    const summary = connection === '3-fase'
      ? `Dit laadvermogen past doorgaans goed bij circa ${dailyEnergy} kWh dagelijkse laadbehoefte, met dynamische load balancing.`
      : 'De beschikbare fase-aansluiting en hoofdzekering moeten worden gecontroleerd voordat het laadvermogen wordt vastgelegd.';
    const functions = [
      businessSettlement && 'automatische zakelijke verrekening',
      smartCharging && 'laden op zon of lage uurprijzen',
      solar !== 'nee' && 'zonnestroomoptimalisatie'
    ].filter(Boolean);

    return {
      type: 'laadpaal',
      topic: 'laadpaal',
      title,
      summary,
      details: [
        'Dynamische load balancing wordt aanbevolen om overbelasting van de hoofdaansluiting te voorkomen.',
        cableDistance > 20 ? `Bij ${cableDistance} meter kabelafstand is een aparte controle van tracé, spanningsverlies en graafwerk nodig.` : `De opgegeven kabelafstand van ${cableDistance} meter lijkt geschikt voor een gerichte tracécontrole.`,
        functions.length ? `Gewenste functies: ${functions.join(', ')}.` : 'Een basisoplossing zonder aanvullende slimme functies is als uitgangspunt genomen.'
      ],
      fields: [
        ['Gebruikslocatie', location],
        ['Netaansluiting', connection],
        ['Kilometers per dag', String(dailyKilometers)],
        ['Afstand meterkast', `${cableDistance} meter`],
        ['Zonnepanelen', solar],
        ['Zakelijk verrekenen', businessSettlement ? 'Ja' : 'Nee'],
        ['Slim laden', smartCharging ? 'Ja' : 'Nee']
      ]
    };
  }

  function getElectricalAdvice(values, form) {
    const workLabels = {
      vervangen: 'groepenkast vervangen',
      uitbreiden: 'groepenkast uitbreiden',
      inductie: 'inductiekookplaat',
      warmtepomp: 'warmtepomp voorbereiden',
      laadpaal: 'laadpaal voorbereiden',
      'extra-elektra': 'stopcontacten of verlichting'
    };
    const selectedWork = values.getAll('werkzaamheden').map((value) => workLabels[value] || value);
    const connection = String(values.get('netaansluiting'));
    const cabinetAge = String(values.get('leeftijdGroepenkast'));
    const postcode = String(values.get('postcode')).toUpperCase();
    const houseNumber = String(values.get('huisnummer'));
    const locationType = String(values.get('typeLocatie'));
    const upload = form.querySelector('[data-calculator-upload]');
    const photoCount = upload && upload.files ? Math.min(upload.files.length, 5) : 0;
    const hasHeavyNewLoad = selectedWork.some((item) => /inductie|warmtepomp|laadpaal/.test(item));
    const needsSurvey = cabinetAge === 'ouder-dan-25' || cabinetAge === 'onbekend' || selectedWork.length >= 3 || selectedWork.includes('groepenkast vervangen');
    const title = needsSurvey ? 'Technische opname aanbevolen' : 'Gerichte controle als eerste stap';
    const summary = needsSurvey
      ? 'Meerdere onderdelen of de leeftijd van de installatie vragen om een bredere controle voordat een veilige uitvoering kan worden gecalculeerd.'
      : 'Uw aanvraag lijkt voldoende afgebakend voor een eerste controle van foto’s, aansluiting en beschikbare ruimte.';

    return {
      type: 'elektrotechniek',
      topic: 'groepenkast',
      title,
      summary,
      details: [
        `Werkzaamheden: ${selectedWork.join(', ')}.`,
        connection === '1-fase' && hasHeavyNewLoad ? 'Bij de gekozen zware verbruiker moet ook een mogelijke 3-faseaanpassing worden beoordeeld.' : `De opgegeven ${connection}-aansluiting wordt meegenomen in de controle.`,
        photoCount ? `${photoCount} foto${photoCount === 1 ? '' : '’s'} gekozen voor de test; deze worden nog niet verzonden.` : 'Foto’s van groepenkast, hoofdschakelaar en meter versnellen de definitieve beoordeling.'
      ],
      fields: [
        ['Werkzaamheden', selectedWork.join(', ')],
        ['Netaansluiting', connection],
        ['Leeftijd groepenkast', cabinetAge],
        ['Locatie', `${postcode} ${houseNumber}`],
        ['Type locatie', locationType],
        ['Foto’s gekozen in test', String(photoCount)]
      ]
    };
  }

  function calculatorGroupsAreValid(form) {
    let valid = true;
    form.querySelectorAll('[data-calculator-required-group]').forEach((group) => {
      const checkboxes = Array.from(group.querySelectorAll('input[type="checkbox"]'));
      const firstCheckbox = checkboxes[0];
      const hasSelection = checkboxes.some((checkbox) => checkbox.checked);
      if (firstCheckbox) firstCheckbox.setCustomValidity(hasSelection ? '' : 'Kies minimaal één werkzaamheid.');
      if (!hasSelection) valid = false;
    });
    return valid;
  }

  function showCalculatorResult(form, advice) {
    const section = form.closest('.adviesCalculatorSectie');
    const output = section && section.querySelector('[data-calculation-output]');
    if (!output) return;
    const title = output.querySelector('[data-result-title]');
    const summary = output.querySelector('[data-result-summary]');
    const details = output.querySelector('[data-result-details]');
    const contactLink = output.querySelector('[data-calculation-contact]');
    if (title) title.textContent = advice.title;
    if (summary) summary.textContent = advice.summary;
    if (details) {
      details.replaceChildren(...advice.details.map((detail) => {
        const item = document.createElement('li');
        item.textContent = detail;
        return item;
      }));
    }
    if (contactLink) {
      contactLink.href = `contact.html?onderwerp=${encodeURIComponent(advice.topic)}&calculator=${encodeURIComponent(advice.type)}#contactRouteKeuze`;
      contactLink.hidden = false;
    }
    output.classList.add('heeftResultaat');
  }

  function saveCalculatorAdvice(advice) {
    try {
      window.sessionStorage.setItem(calculatorStorageKey, JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        ...advice
      }));
    } catch (error) {
      // De calculator blijft werken wanneer sessieopslag niet beschikbaar is.
    }
  }

  document.querySelectorAll('form[data-calculation-form="sparky-advies"]').forEach((form) => {
    form.addEventListener('focusin', () => {
      if (form.dataset.calculatorStarted === 'true') return;
      form.dataset.calculatorStarted = 'true';
      trackCalculatorEvent('calculator_started', form.dataset.calculatorType || 'onbekend');
    });

    form.querySelectorAll('[data-calculator-required-group] input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => calculatorGroupsAreValid(form));
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const groupsValid = calculatorGroupsAreValid(form);
      if (!groupsValid || !form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const values = new FormData(form);
      const calculatorType = form.dataset.calculatorType;
      const calculators = {
        thuisbatterij: () => getBatteryAdvice(values),
        zonnepanelen: () => getSolarAdvice(values),
        laadpaal: () => getChargerAdvice(values),
        elektrotechniek: () => getElectricalAdvice(values, form)
      };
      const advice = calculators[calculatorType] ? calculators[calculatorType]() : null;
      if (!advice) return;
      showCalculatorResult(form, advice);
      saveCalculatorAdvice(advice);
      trackCalculatorEvent('calculator_completed', calculatorType);
    });

    const contactLink = form.closest('.adviesCalculatorSectie') && form.closest('.adviesCalculatorSectie').querySelector('[data-calculation-contact]');
    if (contactLink) {
      contactLink.addEventListener('click', () => {
        trackCalculatorEvent('calculator_contact_clicked', form.dataset.calculatorType || 'onbekend');
      });
    }
  });

  document.querySelectorAll('[data-calculator-upload]').forEach((upload) => {
    upload.addEventListener('change', () => {
      const status = upload.closest('.contactFormulierVeld') && upload.closest('.contactFormulierVeld').querySelector('[data-upload-status]');
      const fileCount = upload.files ? upload.files.length : 0;
      const tooManyFiles = fileCount > 5;
      upload.setCustomValidity(tooManyFiles ? 'Kies maximaal 5 foto’s.' : '');
      if (!status) return;
      status.textContent = tooManyFiles
        ? 'U heeft meer dan 5 foto’s gekozen. Verwijder enkele bestanden.'
        : fileCount
          ? `${fileCount} foto${fileCount === 1 ? '' : '’s'} gekozen voor deze test.`
          : 'Nog geen foto’s gekozen.';
    });
  });

  function initializeCalculatorTransfer() {
    const requestedCalculator = new URLSearchParams(window.location.search).get('calculator');
    if (!requestedCalculator) return;
    let advice;
    try {
      advice = JSON.parse(window.sessionStorage.getItem(calculatorStorageKey) || 'null');
    } catch (error) {
      return;
    }
    const isRecent = advice && Date.now() - Number(advice.savedAt) < 24 * 60 * 60 * 1000;
    if (!isRecent || advice.type !== requestedCalculator || !Array.isArray(advice.fields)) return;

    const detailedRoute = document.getElementById('contactSectLatenWeBeginnen');
    const quickRoute = document.getElementById('contactSnelAdvies');
    const form = document.getElementById('contactSectLatenWeBeginnenFormulier');
    const description = document.getElementById('contactSectLatenWeBeginnenOmschrijving');
    const requestType = document.getElementById('contactSectLatenWeBeginnenAanvraagtype');
    if (!detailedRoute || !form || !description) return;

    if (quickRoute) quickRoute.open = false;
    detailedRoute.open = true;
    if (requestType) requestType.value = 'advies';

    const topicMap = { thuisbatterij: 'thuisbatterij', zonnepanelen: 'zonnepanelen', laadpaal: 'laadpaal', groepenkast: 'elektrotechniek' };
    const topicCheckbox = document.querySelector(`input[name="situatie"][value="${topicMap[advice.topic] || ''}"]`);
    if (topicCheckbox) topicCheckbox.checked = true;

    const inputLines = advice.fields.map(([label, value]) => `- ${label}: ${value}`);
    const transferText = `Calculatorindicatie: ${advice.title}\n${advice.summary}\n\nInvoer:\n${inputLines.join('\n')}`;
    if (!description.value.trim()) description.value = `${transferText}\n\nIk wil deze indicatie graag laten controleren.`;

    const hiddenSummary = document.createElement('input');
    hiddenSummary.type = 'hidden';
    hiddenSummary.name = 'calculator_samenvatting';
    hiddenSummary.value = transferText;
    form.prepend(hiddenSummary);

    const notice = document.createElement('aside');
    notice.className = 'calculatorOverdrachtMelding';
    notice.setAttribute('role', 'status');
    const noticeTitle = document.createElement('strong');
    noticeTitle.textContent = 'Uw calculatorgegevens zijn overgenomen';
    const noticeText = document.createElement('p');
    noticeText.textContent = `${advice.title}. Controleer de samenvatting en vul alleen uw contactgegevens nog aan.`;
    notice.append(noticeTitle, noticeText);
    form.prepend(notice);
    trackCalculatorEvent('calculator_transferred', requestedCalculator);
  }

  initializeCalculatorTransfer();
}());
