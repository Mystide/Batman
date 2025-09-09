import { render } from './render.js';
import { escapeHtml } from './api.js';

export function buildFilters(state, el){
  const items = state.items;
  const collator = new Intl.Collator('de');
  const bySeries = Array.from(
    new Set(items.map(x => x.series).filter(Boolean))
  ).sort(collator.compare);
  const byEvent = Array.from(new Set(items.map(x => x.event).filter(Boolean))).sort();
  const byYear = new Set(items.map(x => x.year).filter(y => y !== '' && !Number.isNaN(Number(y))));
  const byChar = Array.from(new Set(items.flatMap(x => x.characters || []))).sort();
  fillSelect(el.mseries, ['Alle Serien', ...bySeries]);
  fillSelect(el.mevent, ['Alle Events', ...byEvent]);
  fillSelect(el.myear, ['Alle Jahre', ...Array.from(byYear).map(Number).sort((a,b)=>a-b).map(String)]);
  if (el.mchar) fillSelect(el.mchar, ['Alle Figuren', ...byChar]);
}

function fillSelect(sel,items){
  sel.innerHTML = items
    .map((v,i) => {
      const text = escapeHtml(String(v));
      const value = i ? escapeHtml(String(v)) : '';
      return `<option value="${value}">${text}</option>`;
    })
    .join('');
}

export function apply(state, el, collator){
  const q=(el.mq.value||'').toLowerCase().trim();
  const tokens = q ? q.split(/\s+/) : [];
  const fSeries=el.mseries.value; const fYear=el.myear.value; const fEvent=el.mevent.value; const fChar=el.mchar?el.mchar.value:'';
  const hideRead = !!(el.quickHideRead && el.quickHideRead.checked);

  let items=state.items.filter(x=>{
    if(fSeries && x.series!==fSeries) return false;
    if(fYear && String(x.year)!==String(fYear)) return false;
    if(fEvent && x.event!==fEvent) return false;
    if(fChar && !x.characters?.includes(fChar)) return false;
    if(hideRead && state.readSet.has(x.id)) return false;
    if(tokens.length && !tokens.every(tok=>x.search.includes(tok))) return false;
    return true;
  });

  switch(el.msort.value){
    case'dateAsc':items.sort((a,b)=>a.ts-b.ts||collator.compare(a.title,b.title));break;
    case'dateDesc':items.sort((a,b)=>b.ts-a.ts||collator.compare(a.title,b.title));break;
    case'titleAsc':items.sort((a,b)=>collator.compare(a.title,b.title));break;
    case'titleDesc':items.sort((a,b)=>collator.compare(b.title,a.title));break;
  }

  state.view=items;
  saveFilters(el);
  render(state, el);
}

export function bindUI(el, applyFn){
  el.openFilters?.addEventListener('click',()=>drawer(el,true));
  el.closeDrawer?.addEventListener('click',()=>drawer(el,false));
  el.closeDrawerBtn?.addEventListener('click',()=>drawer(el,false));

  window.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      if(document.activeElement===el.mq && el.mq.value){ el.mq.value=''; applyFn(); }
      else { drawer(el,false); }
    }
  });

  el.mResetFilters?.addEventListener('click',()=>{
    el.mseries.value=''; el.myear.value=''; el.mevent.value=''; if(el.mchar) el.mchar.value=''; el.msort.value='dateAsc';
    el.mq.value=''; if(el.quickHideRead) el.quickHideRead.checked=false; applyFn();
  });
  el.clearSearch?.addEventListener('click',()=>{ el.mq.value=''; applyFn(); el.mq.focus(); });

  [el.mq, el.mseries, el.myear, el.mevent, el.mchar, el.msort]
    .forEach(c=>c && c.addEventListener('input', applyFn));
  el.quickHideRead?.addEventListener('input', applyFn);
}

function drawer(el, open){ el.drawer.classList.toggle('open',open); document.body.classList.toggle('no-scroll',open); }

export function saveFilters(el){
  const p={ q:el.mq.value||'', series:el.mseries.value||'', year:el.myear.value||'', event:el.mevent.value||'', char:el.mchar?el.mchar.value:'', sort:el.msort.value||'dateAsc', hide:!!(el.quickHideRead&&el.quickHideRead.checked) };
  try { localStorage.setItem('bat-filters', JSON.stringify(p)); } catch (e) { /* empty */ }
}

export function loadFilters(el){
  try{
    const raw=localStorage.getItem('bat-filters'); if(!raw) return;
    const p=JSON.parse(raw)||{};
    if('q'in p) el.mq.value=p.q||'';
    if('series'in p) el.mseries.value=p.series||'';
    if('year'in p) el.myear.value=p.year||'';
    if('event'in p) el.mevent.value=p.event||'';
    if('char'in p && el.mchar) el.mchar.value=p.char||'';
    if('sort'in p) el.msort.value=p.sort||'dateAsc';
    if('hide'in p && el.quickHideRead){ el.quickHideRead.checked=!!p.hide; }
  } catch (e) { /* empty */ }
}
