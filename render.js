import { formatDateDE, shortSeries, escapeHtml } from './api.js';
import config from './config.json' assert { type: 'json' };

const AUTH_TOKEN = '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';

const SERVER_URL =
  (typeof process !== 'undefined' && process.env.SERVER_URL) ||
  config.SERVER_URL ||
  'https://meinserver.example:3000';

export function updateStats(state, el) {
  const rawIds = new Set(
    state.raw.map(it =>
      (it.id || `${it.series || ''}#${it.issue || ''}-${it.title || ''}`)
        .toLowerCase()
        .replace(/\s+/g, '_')
    )
  );
  const read = [...state.readSet].filter(id => rawIds.has(id)).length;
  el.readCount.textContent = String(read);
  const total = state.raw.length || 1;
  const pct = Math.min(100, Math.round((read / total) * 100));
  el.progress.style.width = pct + '%';
  el.progress.title = pct + '% abgeschlossen';
  el.count.textContent = String(state.view.length);
}

export function render(state, el) {
  el.grid.innerHTML = '';
  state.view.forEach(x => {
    const isRead = state.readSet.has(x.id);
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <button class="read-toggle ${isRead ? 'active' : ''}" aria-pressed="${isRead}" data-id="${escapeHtml(x.id)}">${isRead ? 'Gelesen' : 'Ungelesen'}</button>
      <div class="cover-wrap">
        ${
          x.cover
            ? `<img class="cover" alt="${escapeHtml(x.title)} Cover" loading="lazy" decoding="async"
                 src="${escapeHtml(x.cover)}" referrerpolicy="no-referrer"
                 onerror="this.style.display='none'; this.closest('.cover-wrap').insertAdjacentHTML('beforeend', '<div class=\\\\'tag\\\\' style=\\\\'opacity:.7\\\\'>Kein Cover</div>');">`
            : '<div class="tag" style="opacity:.7">Kein Cover</div>'
        }
      </div>
      <div class="content">
        <div class="h">${escapeHtml(x.title)}${x.issue ? ` <small style="color:var(--muted)">#${escapeHtml(x.issue)}</small>` : ''}</div>
        <div class="meta">
          ${formatDateDE(x.dateRaw, x.year) ? `<span class="tag">${formatDateDE(x.dateRaw, x.year)}</span>` : ''}
          ${x.series ? `<span class="tag">${escapeHtml(shortSeries(x.series))}</span>` : ''}
          ${x.event ? `<span class="tag">${escapeHtml(x.event)}</span>` : ''}
        </div>
      </div>`;

    const btn = card.querySelector('.read-toggle');
    btn.addEventListener('click', () => {
      const id = x.id;
      const wasRead = state.readSet.has(id);
      if (wasRead) state.readSet.delete(id);
      else state.readSet.add(id);

      const payload = [...state.readSet];
      fetch(`${SERVER_URL}/read-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AUTH_TOKEN}`
        },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed');
          localStorage.setItem('batman-read', JSON.stringify(payload));
        })
        .catch(() => {
          localStorage.setItem('batman-read', JSON.stringify(payload));
        });

      const nowRead = state.readSet.has(id);
      btn.classList.toggle('active', nowRead);
      btn.setAttribute('aria-pressed', nowRead);
      btn.textContent = nowRead ? 'Gelesen' : 'Ungelesen';

      if (el.quickHideRead && el.quickHideRead.checked && nowRead) {
        card.remove();
        updateStats(state, el);
        return;
      }
      updateStats(state, el);
    });

    el.grid.appendChild(card);
  });
  updateStats(state, el);
  el.empty.hidden = state.view.length > 0;
}
