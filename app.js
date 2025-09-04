import { loadData } from './api.js';
import { buildFilters, bindUI, loadFilters, apply } from './filters.js';

const $ = sel => document.querySelector(sel);

const state = { raw: [], view: [], readSet:new Set(JSON.parse(localStorage.getItem('batman-read')||'[]')) };
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
  state.raw = await loadData();
  buildFilters(state, el);
  loadFilters(el);
  const applyFn = () => apply(state, el, collator);
  bindUI(el, applyFn);
  applyFn();
}
