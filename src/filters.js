import { render, sortItems } from './render.js';

let lastFocusedEl = null;

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

function fillSelect(sel, items) {
  sel.textContent = '';
  items.forEach((v, i) => {
    const text = String(v);
    const value = i ? String(v) : '';
    sel.appendChild(new Option(text, value));
  });
}

export function apply(state, el){
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

  const order = el.sortOrder ? el.sortOrder.value : 'title';
  const dir = el.sortToggle?.dataset.dir || 'asc';
  state.view = sortItems(items, order, dir);
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
    el.mseries.value=''; el.myear.value=''; el.mevent.value=''; if(el.mchar) el.mchar.value=''; el.sortOrder.value='title';
    if(el.sortToggle){ el.sortToggle.dataset.dir='asc'; el.sortToggle.textContent='↑'; el.sortToggle.setAttribute('aria-label','Aufsteigend sortieren'); }
    el.mq.value=''; if(el.quickHideRead) el.quickHideRead.checked=false; applyFn();
  });
  el.clearSearch?.addEventListener('click',()=>{ el.mq.value=''; applyFn(); el.mq.focus(); });

  [el.mq, el.mseries, el.myear, el.mevent, el.mchar, el.sortOrder]
    .forEach(c=>c && c.addEventListener('input', applyFn));
  el.quickHideRead?.addEventListener('input', applyFn);
el.sortToggle?.addEventListener('click', () => {
    const dir = el.sortToggle.dataset.dir === 'desc' ? 'asc' : 'desc';
    el.sortToggle.dataset.dir = dir;
    el.sortToggle.textContent = dir === 'desc' ? '↓' : '↑';
    el.sortToggle.setAttribute('aria-label', dir === 'desc' ? 'Absteigend sortieren' : 'Aufsteigend sortieren');
    applyFn();
  });
}

function drawer(el, open){
  el.drawer.classList.toggle('open', open);
  document.body.classList.toggle('no-scroll', open);
  el.drawer.setAttribute('aria-hidden', open ? 'false' : 'true');

  if (open) {
    lastFocusedEl = document.activeElement;
    const focusable = Array.from(
      el.drawer.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const trap = (e) => {
      if (e.key === 'Tab') {
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.drawer.addEventListener('keydown', trap);
    el.drawer._focusTrap = trap;
    first?.focus();
  } else {
    if (el.drawer._focusTrap) {
      el.drawer.removeEventListener('keydown', el.drawer._focusTrap);
      delete el.drawer._focusTrap;
    }
    lastFocusedEl?.focus();
  }
}

export function saveFilters(el){
  const p={ q:el.mq.value||'', series:el.mseries.value||'', year:el.myear.value||'', event:el.mevent.value||'', char:el.mchar?el.mchar.value:'', sortOrder:el.sortOrder.value||'title', dir:el.sortToggle?.dataset.dir||'asc', hide:!!(el.quickHideRead&&el.quickHideRead.checked) };
  try { localStorage.setItem('bat-filters', JSON.stringify(p)); }
  catch (e) { console.warn('Failed to save filters:', e); }
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
    if('sortOrder'in p) el.sortOrder.value=p.sortOrder||'title';
    if('dir' in p && el.sortToggle){
      const d=p.dir==='desc'?'desc':'asc';
      el.sortToggle.dataset.dir=d;
      el.sortToggle.textContent=d==='desc'?'↓':'↑';
      el.sortToggle.setAttribute('aria-label', d==='desc'?'Absteigend sortieren':'Aufsteigend sortieren');
    } else if(el.sortToggle){
      el.sortToggle.dataset.dir='asc';
      el.sortToggle.textContent='↑';
      el.sortToggle.setAttribute('aria-label','Aufsteigend sortieren');
    }
    if('hide'in p && el.quickHideRead){ el.quickHideRead.checked=!!p.hide; }
  }
  catch (e) {
    console.warn('Failed to load filters:', e);
    if (e instanceof SyntaxError) { localStorage.removeItem('bat-filters'); }
  }
}
