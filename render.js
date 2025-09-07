// render.js
import { formatDateDE, shortSeries, escapeHtml } from './api.js';
import { GIST_ID, FILE, LS_KEY } from './constants.js';

function isValidUrl(link) {
  const str = String(link || '').trim();
  if (str === 'null' || !str) return false;
  try {
    new URL(str);
    return true;
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

export function render(state, el) {
  el.grid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (const x of state.view) {
    const isRead = state.readSet.has(x.id);
    const formattedDate = formatDateDE(x.dateRaw, x.year);
    const card = document.createElement('article');
    card.className = 'card';
    const dcuiUrl = String(x.dcui || x.dcui_link || '').trim();
    const dcuiValid = isValidUrl(dcuiUrl);
    const coverUrl = isValidUrl(x.cover) ? x.cover : null;
    card.innerHTML = `
       <button class="read-toggle ${isRead ? 'active' : ''}" aria-pressed="${isRead}" data-id="${escapeHtml(x.id)}">${isRead ? 'Gelesen' : 'Ungelesen'}</button>
       <div class="cover-wrap">
         ${
           coverUrl
             ? `<img class="cover" alt="${escapeHtml(x.title)} Cover" loading="lazy" fetchpriority="low" decoding="async" src="${escapeHtml(coverUrl)}" referrerpolicy="no-referrer">`
             : '<div class="tag" style="opacity:.7">Kein Cover</div>'
         }
       ${x.year ? `<span class="year-tag">${escapeHtml(String(x.year))}</span>` : ''}
       ${
           dcuiValid
             ? `<a class="dcui-link" href="${escapeHtml(dcuiUrl)}" target="_blank" rel="noopener noreferrer"><img src="dc-logo.png" alt="DC Logo"></a>`
             : ''
         }
        </div>
        <div class="content">
         <div class="h">${escapeHtml(x.title)}${x.issue ? ` <small class="issue-num">#${escapeHtml(x.issue)}</small>` : ''}</div>
         <div class="meta">
           ${formattedDate ? `<div class="meta-row"><b>Datum:</b> ${formattedDate}</div>` : ''}
           ${x.series ? `<div class="meta-row"><b>Serie:</b><span>${escapeHtml(shortSeries(x.series))}</span></div>` : ''}
           ${x.event ? `<div class="meta-row"><b>Event:</b> ${escapeHtml(x.event)}</div>` : ''}
         </div>
       </div>`;

    const cover = card.querySelector('.cover');
    cover?.addEventListener('error', () => {
      cover.style.display = 'none';
      cover.closest('.cover-wrap')
           ?.insertAdjacentHTML(
             'beforeend',
             "<div class='tag' style='opacity:.7'>Kein Cover</div>"
           );
    });

    const btn = card.querySelector('.read-toggle');
    btn.addEventListener('click', () => {
      const id = x.id;
      const wasRead = state.readSet.has(id);
      if (wasRead) state.readSet.delete(id);
      else state.readSet.add(id);

      const payload = [...state.readSet];
      const token = sessionStorage.getItem('gistToken');

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
            if (!res.ok) throw new Error('Failed');
            localStorage.setItem(LS_KEY, JSON.stringify(payload));
          })
          .catch(() => {
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
        card.remove();
        updateStats(state, el);
        return;
      }
      updateStats(state, el);
    });

    fragment.appendChild(card);
  }
  el.grid.appendChild(fragment);
  updateStats(state, el);
  el.empty.hidden = state.view.length > 0;
}
