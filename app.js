import { loadData, normalize } from './api.js';
import { buildFilters, bindUI, loadFilters, apply } from './filters.js';

const $ = sel => document.querySelector(sel);

const state = { raw: [], items: [], view: [], readSet: new Set(), idSet: new Set() };
const el = {
  grid: $('#grid'), empty: $('#empty'),
  mq: $('#mq'), mseries: $('#mseries'), myear: $('#myear'), mevent: $('#mevent'), mchar: $('#mchar'), msort: $('#msort'),
  quickHideRead: $('#quickHideRead'),
  toggleView: $('#toggleView'),
  count: $('#count'), readCount: $('#readCount'), progress: $('#progress'),
  openFilters: $('#openFilters'), drawer: $('#drawer'), closeDrawer: $('#closeDrawer'), closeDrawerBtn: $('#closeDrawerBtn'),
  mResetFilters: $('#mResetFilters'), clearSearch: $('#clearSearch'),
  tokenWarning: $('#tokenWarning'), tokenLink: $('#tokenLink'),
  tokenDialog: $('#tokenDialog'), tokenForm: $('#tokenForm'), tokenInput: $('#tokenInput')
};

const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
const GIST_ID = 'f4ac4f63f8f150bde113a52246bdea28';
const FILE = 'readStatus.json';
const LS_KEY = 'comic-tracker-read';
const VIEW_KEY = 'comic-tracker-view';

if (localStorage.getItem(VIEW_KEY) === 'cover') {
  document.body.classList.add('cover-mode');
}

init();

async function init() {
  const token = localStorage.getItem('gistToken');
  if (token) {
    try {
      const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        cache: 'no-store',
        headers: { Authorization: `token ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const list = JSON.parse(json.files[FILE].content || '[]');
        state.readSet = new Set(list);
        localStorage.setItem(LS_KEY, JSON.stringify(list));
      } else if (res.status === 401 || res.status === 403) {
        showTokenNotice();
      } else {
        console.warn('Request failed', res.status);
      }
    } catch (err) {
      console.warn('Failed to fetch gist', err);
      showTokenNotice();
    }
  } else {
    showTokenNotice();
  }

  if (state.readSet.size === 0) {
    const list = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    state.readSet = new Set(list);
  }

  state.raw = await loadData();
  state.items = state.raw.map(normalize);
  state.idSet = new Set(state.items.map(x => x.id));

  buildFilters(state, el);
  loadFilters(el);
  const applyFn = () => apply(state, el, collator);
  bindUI(el, applyFn);
  applyFn();
}

function showTokenNotice() {
  el.tokenWarning.hidden = false;
}

el.tokenLink.addEventListener('click', e => {
  e.preventDefault();
  el.tokenDialog.showModal();
});

el.tokenForm.addEventListener('submit', e => {
  e.preventDefault();
  const token = el.tokenInput.value.trim();
  if (token) {
    localStorage.setItem('gistToken', token);
    el.tokenDialog.close();
    location.reload();
  }
});

el.toggleView.addEventListener('click', () => {
  const isCover = document.body.classList.toggle('cover-mode');
  localStorage.setItem(VIEW_KEY, isCover ? 'cover' : 'list');
});
