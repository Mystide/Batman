import { formatDateDE, shortSeries } from './api.js';
import { GIST_ID, FILE, LS_KEY } from '../constants.js';
import { showTokenNotice } from '../ui.js';

function isValidUrl(link) {
  const str = String(link || '').trim();
  if (str === 'null' || !str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function updateStats(state, el) {
  const rawIds = state.idSet;
  const read = [...state.readSet].filter(id => rawIds.has(id)).length;
  el.readCount.textContent = String(read);
  const total = state.items.length || 1;
  const pct = Math.min(100, Math.round((read / total) * 100));
  el.progress.style.width = pct + '%';
  el.progress.title = pct + '% abgeschlossen';
  el.count.textContent = String(state.view.length);
}

const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });

export function sortItems(items, order, dir = 'asc') {
  const arr = [...items];
  const mult = dir === 'desc' ? -1 : 1;
  switch (order) {
    case 'date':
      return arr.sort((a, b) => (a.ts - b.ts || collator.compare(a.title, b.title)) * mult);
    case 'event':
      return arr.sort(
        (a, b) =>
          (collator.compare(a.event || '', b.event || '') || collator.compare(a.title, b.title)) * mult
      );
    case 'title':
    default:
      return arr.sort((a, b) => collator.compare(a.title, b.title) * mult);
  }
}

let currentState;
let currentEl;
let currentGrid;

function fadeOutAndRemove(card) {
  card.classList.add('fade-out');
  card.addEventListener('transitionend', () => card.remove(), { once: true });
}

function createCard(x, isRead) {
  const formattedDate = formatDateDE(x.dateRaw, x.year);
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = x.id;
  card.style.opacity = '0';
  card.style.transform = 'translateY(10px)';
  const dcuiUrl = String(x.dcui || x.dcui_link || '').trim();
  const dcuiValid = isValidUrl(dcuiUrl);
  const coverUrl = isValidUrl(x.cover) ? x.cover : null;

  const toggle = document.createElement('button');
  toggle.className = 'read-toggle';
  if (isRead) toggle.classList.add('active');
  toggle.setAttribute('aria-pressed', String(isRead));
  toggle.dataset.id = x.id;
  toggle.textContent = isRead ? 'Gelesen' : 'Ungelesen';
  card.appendChild(toggle);

  const coverWrap = document.createElement('div');
  coverWrap.className = 'cover-wrap';
  if (coverUrl) {
    const img = document.createElement('img');
    img.className = 'cover';
    img.alt = `${x.title} Cover`;
    img.loading = 'lazy';
    img.fetchpriority = 'low';
    img.decoding = 'async';
    img.src = coverUrl;
    img.referrerPolicy = 'strict-origin-when-cross-origin';
    img.addEventListener('error', () => {
      img.style.display = 'none';
      const tag = document.createElement('div');
      tag.className = 'tag';
      tag.style.opacity = '.7';
      tag.textContent = 'Kein Cover';
      coverWrap.appendChild(tag);
    });
    coverWrap.appendChild(img);
  } else {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.style.opacity = '.7';
    tag.textContent = 'Kein Cover';
    coverWrap.appendChild(tag);
  }

  if (x.year) {
    const span = document.createElement('span');
    span.className = 'year-tag';
    span.textContent = String(x.year);
    coverWrap.appendChild(span);
  }
  if (dcuiValid) {
    const a = document.createElement('a');
    a.className = 'dcui-link';
    a.href = dcuiUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    const logo = document.createElement('img');
    logo.src = 'icons/dc-logo.png';
    logo.alt = 'DC Logo';
    a.appendChild(logo);
    coverWrap.appendChild(a);
  }
  card.appendChild(coverWrap);

  const content = document.createElement('div');
  content.className = 'content';
  const h = document.createElement('div');
  h.className = 'h';
  h.textContent = x.title;
  if (x.issue) {
    const small = document.createElement('small');
    small.className = 'issue-num';
    small.textContent = `#${x.issue}`;
    h.appendChild(document.createTextNode(' '));
    h.appendChild(small);
  }
  content.appendChild(h);

  const meta = document.createElement('div');
  meta.className = 'meta';

  if (formattedDate) {
    const row = document.createElement('div');
    row.className = 'meta-row';
    const b = document.createElement('b');
    b.textContent = 'Datum:';
    row.appendChild(b);
    row.appendChild(document.createTextNode(' ' + formattedDate));
    meta.appendChild(row);
  }
  if (x.series) {
    const row = document.createElement('div');
    row.className = 'meta-row';
    const b = document.createElement('b');
    b.textContent = 'Serie:';
    row.appendChild(b);
    const span = document.createElement('span');
    span.textContent = shortSeries(x.series);
    row.appendChild(span);
    meta.appendChild(row);
  }
  if (x.event) {
    const row = document.createElement('div');
    row.className = 'meta-row';
    const b = document.createElement('b');
    b.textContent = 'Event:';
    row.appendChild(b);
    row.appendChild(document.createTextNode(' ' + x.event));
    meta.appendChild(row);
  }
  content.appendChild(meta);
  card.appendChild(content);
  return card;
}

function handleToggle(btn, state, el) {
  const id = btn.dataset.id;
  const wasRead = state.readSet.has(id);
  if (wasRead) state.readSet.delete(id);
  else state.readSet.add(id);

  const payload = [...state.readSet];
  const token = localStorage.getItem('gistToken');

  if (token) {
    fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`
      },
      body: JSON.stringify({
        files: { [FILE]: { content: JSON.stringify(payload) } }
      })
    })
      .then(res => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('gistToken');
          showTokenNotice();
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          console.warn('Request failed', res.status);
          throw new Error('Failed');
        }
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      })
      .catch(err => {
        console.warn('Failed to update gist', err);
        localStorage.setItem(LS_KEY, JSON.stringify(payload));
      });
  } else {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }

  const nowRead = state.readSet.has(id);
  btn.classList.toggle('active', nowRead);
  btn.setAttribute('aria-pressed', nowRead);
  btn.textContent = nowRead ? 'Gelesen' : 'Ungelesen';

  if (el.quickHideRead && el.quickHideRead.checked && nowRead) {
    const card = btn.closest('.card');
    if (card) fadeOutAndRemove(card);
    updateStats(state, el);
    return;
  }
  updateStats(state, el);
}

function onGridClick(event) {
  const btn = event.target.closest('.read-toggle');
  if (!btn) return;
  handleToggle(btn, currentState, currentEl);
}

export function render(state, el) {
  currentState = state;
  currentEl = el;

  if (currentGrid !== el.grid) {
    if (currentGrid) currentGrid.removeEventListener('click', onGridClick);
    currentGrid = el.grid;
    currentGrid.addEventListener('click', onGridClick);
  }
  const existing = new Map();
  for (const card of Array.from(el.grid.children)) {
    if (card.dataset.id) existing.set(card.dataset.id, card);
  }
  const fragment = document.createDocumentFragment();
  const newCards = [];
  for (const x of state.view) {
    const isRead = state.readSet.has(x.id);
    let card = existing.get(String(x.id));
    if (card) {
      existing.delete(String(x.id));
      const toggle = card.querySelector('.read-toggle');
      if (toggle) {
        toggle.classList.toggle('active', isRead);
        toggle.setAttribute('aria-pressed', String(isRead));
        toggle.textContent = isRead ? 'Gelesen' : 'Ungelesen';
      }
    } else {
      card = createCard(x, isRead);
      newCards.push(card);
    }
    fragment.appendChild(card);
  }
  el.grid.appendChild(fragment);
  requestAnimationFrame(() => {
    for (const card of newCards) {
      card.style.opacity = '1';
      card.style.transform = '';
    }
  });
  for (const card of existing.values()) fadeOutAndRemove(card);
  updateStats(state, el);
  el.empty.hidden = state.view.length > 0;
}

export function cleanup() {
  if (currentGrid) {
    currentGrid.removeEventListener('click', onGridClick);
    currentGrid = null;
  }
  currentEl = undefined;
  currentState = undefined;
}
