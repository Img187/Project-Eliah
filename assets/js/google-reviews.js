(() => {
  'use strict';
  const section = document.querySelector('.googleReviewsSectie');
  if (!section) return;
  const list = section.querySelector('.googleReviewLijst');
  const googleUrl = section.querySelector('.googleReviewsAlle')?.href;
  if (!googleUrl) return;
  const controls = section.querySelector('[data-review-controls]');
  const pauseButton = section.querySelector('[data-review-pause]');
  const summary = section.querySelector('[data-review-summary]');
  const status = section.querySelector('[data-review-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const MAX_VISIBLE = 5;
  const MAX_AGE = 24 * 60 * 60 * 1000;
  let reviews = [];
  let visible = [];
  let queue = [];
  let slot = 0;
  let paused = false;
  let endpoint = '';
  let fetchedAt = 0;
  let busy = false;
  let pending = null;
  let signature = '';

  const node = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };
  const reading = () => list.matches(':hover') || list.contains(document.activeElement);
  function updateControls() {
    controls.hidden = reviews.length <= MAX_VISIBLE;
    pauseButton.textContent = paused || reduced.matches ? 'Reviews afspelen' : 'Reviews pauzeren';
    pauseButton.setAttribute('aria-pressed', String(paused || reduced.matches));
    pauseButton.disabled = reduced.matches;
  }
  function render() {
    const cards = visible.map(review => {
      const li = node('li');
      li.dataset.reviewId = review.id;
      const card = node('article', 'testimonialKaart kaart googleReviewKaart');
      const header = node('header', 'googleReviewKop');
      const initials = review.author.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();
      const avatar = node('span', 'googleReviewAvatar', initials);
      avatar.setAttribute('aria-hidden', 'true');
      if (review.photoUrl) {
        try {
          const url = new URL(review.photoUrl);
          if (url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) {
            const img = node('img');
            img.alt = '';
            img.loading = 'lazy';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('error', () => avatar.replaceChildren(document.createTextNode(initials)), { once: true });
            img.src = url.href;
            avatar.replaceChildren(img);
          }
        } catch { /* Initialen blijven zichtbaar bij een ongeldige foto-URL. */ }
      }
      const author = node('div', 'googleReviewAuteur');
      const stars = node('span', 'googleReviewSterren', '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating));
      stars.setAttribute('aria-hidden', 'true');
      const rating = node('p', 'googleReviewWaardering');
      rating.append(stars, node('span', 'srOnly', `${review.rating} uit 5 sterren`));
      author.append(node('h3', '', review.author), rating);
      header.append(avatar, author);
      const quote = node('blockquote');
      quote.append(node('p', '', review.text || 'Deze klant heeft alleen een sterrenbeoordeling gegeven.'));
      const footer = node('footer', 'googleReviewVoet');
      const time = node('time', '', new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(review.publishedAt)));
      time.dateTime = review.publishedAt;
      const source = node('a', 'googleReviewBron', 'Google ↗');
      source.href = googleUrl;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.append(node('span', 'srOnly', ': bekijk reviews (opent in een nieuw tabblad)'));
      footer.append(time, source);
      card.append(header, quote, footer);
      li.append(card);
      return li;
    });
    list.replaceChildren(...cards);
    updateControls();
  }
  function applyFeed(data) {
    if (reading()) { pending = data; return; }
    pending = null;
    const newSignature = JSON.stringify(data.reviews);
    if (newSignature !== signature) {
      signature = newSignature;
      reviews = data.reviews.slice().sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id));
      visible = reviews.slice(0, MAX_VISIBLE);
      queue = reviews.slice(MAX_VISIBLE);
      slot = 0;
      render();
    }
    fetchedAt = Date.parse(data.fetchedAt);
    section.dataset.reviewMode = data.stale ? 'cached' : 'live';
    summary.hidden = reviews.length === 0;
    summary.textContent = `${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(data.averageRating)} / 5 op Google · ${data.totalReviewCount} ${data.totalReviewCount === 1 ? 'review' : 'reviews'}`;
    status.textContent = reviews.length === 0 ? 'Er zijn nog geen reviews beschikbaar.' : data.stale ? 'Google is tijdelijk niet bereikbaar. We tonen de laatst opgehaalde reviews.' : '';
    status.hidden = !status.textContent;
  }
  function next() {
    if (!queue.length) return;
    const outgoing = visible[slot];
    visible[slot] = queue.shift();
    queue.push(outgoing);
    slot = (slot + 1) % visible.length;
    render();
  }
  function unavailable(message = 'De reviews zijn tijdelijk niet beschikbaar. Bekijk alle beoordelingen op Google.') {
    reviews = []; visible = []; queue = []; signature = ''; fetchedAt = 0;
    render();
    summary.hidden = true;
    section.dataset.reviewMode = 'unavailable';
    status.hidden = false;
    status.textContent = message;
  }
  function expire() {
    if (pending) {
      const pendingTime = Date.parse(pending.fetchedAt);
      if (!Number.isFinite(pendingTime) || pendingTime > Date.now() + 60000 || Date.now() - pendingTime > MAX_AGE) {
        pending = null;
        if (!fetchedAt && endpoint) unavailable();
      }
    }
    if (fetchedAt && Date.now() - fetchedAt > MAX_AGE) {
      unavailable();
    }
  }
  function validate(data) {
    const time = Date.parse(data?.fetchedAt);
    if (!Number.isFinite(time) || time > Date.now() + 60000 || Date.now() - time > MAX_AGE || !Array.isArray(data.reviews) || data.totalReviewCount !== data.reviews.length || !Number.isFinite(data.averageRating) || (data.reviews.length && (data.averageRating < 1 || data.averageRating > 5))) throw new Error('Ongeldige reviewgegevens');
    const ids = new Set();
    for (const review of data.reviews) {
      if (typeof review.id !== 'string' || !review.id || ids.has(review.id) || typeof review.author !== 'string' || !review.author.trim() || typeof review.text !== 'string' || !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 || !Number.isFinite(Date.parse(review.publishedAt))) throw new Error('Ongeldige review');
      ids.add(review.id);
    }
    return data;
  }
  async function refresh() {
    expire();
    if (!endpoint || busy || document.hidden) return;
    busy = true;
    try {
      const response = await fetch(endpoint, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error('Reviews niet beschikbaar');
      applyFeed(validate(await response.json()));
    } catch {
      section.dataset.reviewMode = fetchedAt ? 'cached' : 'unavailable';
      status.hidden = false;
      status.textContent = 'Reviews konden niet worden vernieuwd. Bekijk alle beoordelingen op Google.';
    } finally { busy = false; }
  }
  section.querySelector('[data-review-next]').addEventListener('click', next);
  pauseButton.addEventListener('click', () => { paused = !paused; updateControls(); });
  reduced.addEventListener('change', updateControls);
  setInterval(() => {
    expire();
    if (document.hidden || reading()) return;
    if (pending) {
      const update = pending;
      pending = null;
      try { applyFeed(validate(update)); }
      catch { if (!fetchedAt) unavailable(); }
      return;
    }
    if (!paused && !reduced.matches) next();
  }, 12000);
  setInterval(refresh, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  fetch('data/reviews-config.json', { cache: 'no-cache' })
    .then(response => { if (!response.ok) throw new Error('Geen configuratie'); return response.json(); })
    .then(config => {
      if (!config.endpoint) return; // Bestaande proef blijft staan tot de koppeling is geconfigureerd.
      const url = new URL(config.endpoint, location.href);
      if (url.protocol !== 'https:' && !(location.hostname === '127.0.0.1' && url.hostname === '127.0.0.1' && url.protocol === 'http:')) throw new Error('HTTPS vereist');
      endpoint = url.href;
      // Een statische proef mag bij een API-storing niet als live resultaat doorgaan.
      list.replaceChildren();
      section.dataset.reviewMode = 'loading';
      status.hidden = false;
      status.textContent = 'Reviews laden…';
      refresh();
    })
    .catch(() => { /* Zonder configuratie blijft de bestaande statische weergave beschikbaar. */ });
})();
