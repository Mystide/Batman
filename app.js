import { loadData } from './api.js';
import { buildFilters, bindUI, loadFilters, apply } from './filters.js';

const $ = sel => document.querySelector(sel);

const state = { raw: [], view: [], readSet: new Set() };
const el = {
  grid:$('#grid'), empty:$('#empty'),
  mq:$('#mq'), mseries:$('#mseries'), myear:$('#myear'), mevent:$('#mevent'), msort:$('#msort'),
  quickHideRead:$('#quickHideRead'),
  count:$('#count'), readCount:$('#readCount'), progress:$('#progress'),
  openFilters:$('#openFilters'), drawer:$('#drawer'), closeDrawer:$('#closeDrawer'), closeDrawerBtn:$('#closeDrawerBtn'),
  mResetFilters:$('#mResetFilters'), clearSearch:$('#clearSearch')
};

const collator = new Intl.Collator('de', {numeric:true, sensitivity:'base'});

init();
async function init(){
    try {
    const res = await fetch('/read-status');
    if (res.ok) {
      const list = await res.json();
      state.readSet = new Set(list);
      localStorage.setItem('batman-read', JSON.stringify(list));
    } else {
      throw new Error('Request failed');
    }
  } catch {
    state.readSet = new Set(JSON.parse(localStorage.getItem('batman-read') || '[]'));
  }

  state.raw = await loadData();
  buildFilters(state, el);
  loadFilters(el);
  const applyFn = () => apply(state, el, collator);
  bindUI(el, applyFn);
  applyFn();
}
