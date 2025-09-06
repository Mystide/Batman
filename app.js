import { loadData } from './api.js';
import { buildFilters, bindUI, loadFilters, apply } from './filters.js';

const $ = sel => document.querySelector(sel);

const state = { raw: [], view: [], readSet: new Set() };
const el = {
  grid: $('#grid'), empty: $('#empty'),
  mq: $('#mq'), mseries: $('#mseries'), myear: $('#myear'), mevent: $('#mevent'), msort: $('#msort'),
  quickHideRead: $('#quickHideRead'),
  count: $('#count'), readCount: $('#readCount'), progress: $('#progress'),
  openFilters: $('#openFilters'), drawer: $('#drawer'), closeDrawer: $('#closeDrawer'), closeDrawerBtn: $('#closeDrawerBtn'),
  mResetFilters: $('#mResetFilters'), clearSearch: $('#clearSearch'),
  tokenWarning: $('#tokenWarning'), tokenLink: $('#tokenLink'),
  tokenDialog: $('#tokenDialog'), tokenForm: $('#tokenForm'), tokenInput: $('#tokenInput'),
  openNav: $('#openNav'), navDrawer: $('#navDrawer'), closeNav: $('#closeNav'), closeNavBtn: $('#closeNavBtn'),
  layoutCols: $('#layoutCols')
};

const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
const GIST_ID = 'f4ac4f63f8f150bde113a52246bdea28';
const FILE = 'readStatus.json';

init();

async function init() {
  try {
    const token = localStorage.getItem('gistToken');
    if (!token) {
      showTokenNotice();
      throw new Error('Missing token');
    }
    const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      cache: 'no-store',
      headers: { Authorization: `token ${token}` }
    });
    if (res.ok) {
      const json = await res.json();
      const list = JSON.parse(json.files[FILE].content || '[]');
      state.readSet = new Set(list);
      localStorage.setItem('batman-read', JSON.stringify(list));
    } else if (res.status === 401 || res.status === 403) {
      showTokenNotice();
      throw new Error('Unauthorized');
    } else {
      throw new Error('Request failed');
    }
  } catch {
    state.readSet = new Set(
      JSON.parse(localStorage.getItem('batman-read') || '[]')
    );
  }

  state.raw = await loadData();
  buildFilters(state, el);
  loadFilters(el);
  const applyFn = () => apply(state, el, collator);
  bindUI(el, applyFn);
  bindNav();
  initLayout();
  applyFn();
}

function showTokenNotice() {
  el.tokenWarning.hidden = false;
}

function bindNav() {
  const toggle = open => {
    el.navDrawer.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
  };
  el.openNav?.addEventListener('click', () => toggle(true));
  el.closeNav?.addEventListener('click', () => toggle(false));
  el.closeNavBtn?.addEventListener('click', () => toggle(false));
}

function initLayout() {
  if (!el.layoutCols) return;
  const setCols = val => {
    el.grid.classList.remove('cols-1', 'cols-2', 'cols-3');
    el.grid.classList.add(`cols-${val}`);
    localStorage.setItem('layout-cols', val);
  };
  const saved = localStorage.getItem('layout-cols') || '3';
  setCols(saved);
  el.layoutCols.value = saved;
  el.layoutCols.addEventListener('change', e => setCols(e.target.value));
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
