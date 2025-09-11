export const DATA_LIST_URL = new URL('../data/list.json', import.meta.url).href;

export async function loadData() {
  let loaded = false;
  let raw = [];

  // Cache prüfen
  try {
    const cacheStr = localStorage.getItem('data-cache');
    const cacheTs = Number(localStorage.getItem('data-cache-ts'));
    if (cacheStr && Date.now() - cacheTs < 86400000) {
      raw = JSON.parse(cacheStr);
      loaded = Array.isArray(raw) && raw.length > 0;
    }
  } catch (e) {
    console.warn('Cache konnte nicht gelesen werden', e);
    localStorage.removeItem('data-cache');
    localStorage.removeItem('data-cache-ts');
  }

  if (!loaded) {
    try {
      const listRes = await fetch(DATA_LIST_URL, { cache: 'default' });
      if (listRes.ok) {
        const files = await listRes.json();
        if (Array.isArray(files) && files.length) {
          const base = new URL('.', DATA_LIST_URL);
          const arrays = await Promise.all(
            files.map((p) =>
              fetch(new URL(p, base).href, { cache: 'default' })
                .then((r) => (r.ok ? r.json() : []))
                .catch((err) => (console.warn('failed to load', p, err), [])),
            ),
          );
          const merged = arrays.flat();
          if (merged && merged.length) {
            raw = merged;
            loaded = true;
          }
        }
      }
    } catch (e) {
      console.warn('Liste konnte nicht geladen werden', e);
    }

    if (loaded) {
      try {
        localStorage.setItem('data-cache', JSON.stringify(raw));
        localStorage.setItem('data-cache-ts', String(Date.now()));
      } catch (e) {
        console.warn('Cache konnte nicht gespeichert werden', e);
      }
    }
  }

  if (!loaded) {
     try {
      const demoModule = await import('./demo-data.js');
      raw = Array.isArray(demoModule.default)
        ? demoModule.default.slice()
        : [];
    } catch {
      raw = [];
    }
  }

  const seen = new Set();
  raw = raw.filter((x) => {
    const id = generateId(x);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return raw;
}

export function firstOf(...vals) {
  for (const v of vals) {
    if (v != null && v !== '') return v;
  }
  return '';
}

export function extractYearFromSeries(series) {
  const m = /.*\((\d{4})\)\s*$/.exec(String(series || ''));
  return m ? Number(m[1]) : '';
}

export function generateId({ id, series, issue, title }) {
  return (id || `${series || ''}#${issue || ''}-${title || ''}`)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/\s+/g, '_');
}

export function deriveYear(item, dateRaw) {
  let year = Number(item.year);
  if (!Number.isFinite(year)) {
    const d = new Date(dateRaw || '');
    year = !isNaN(d) ? d.getFullYear() : extractYearFromSeries(item.series);
  }
  return Number.isFinite(year) ? year : '';
}

export function buildSearchString(item) {
  return `${item.title || ''} ${item.series || ''} ${item.event || ''}`.toLowerCase();
}

export function normalize(item) {
  const { dcui_link, dcui, ...rest } = item;
  const charRaw = rest.characters;
  let characters = [];
  if (typeof charRaw === 'string') {
    characters = charRaw.split(',').map((c) => c.trim()).filter(Boolean);
  } else if (Array.isArray(charRaw)) {
    characters = charRaw.map((c) => String(c).trim()).filter(Boolean);
  }
  rest.characters = characters;
  const dateRaw = firstOf(
    rest.date,
    rest.release_date,
    rest.publication_date,
    rest.published,
  );
  const year = deriveYear(rest, dateRaw);
  const coverUrl = firstOf(rest.cover, rest.covers, rest.image, rest.thumbnail);
  const id = generateId(rest);
  const ts = dateRaw
    ? new Date(dateRaw).getTime()
    : Number.isFinite(year)
      ? new Date(year, 0, 1).getTime()
      : 0;
  const search = buildSearchString(rest);
  return {
    ...rest,
    dcui: firstOf(dcui, dcui_link),
    id,
    year,
    dateRaw,
    cover: coverUrl,
    ts,
    search,
  };
}

export function formatDateDE(dateRaw, year) {
  if (dateRaw) {
    const d = new Date(dateRaw);
    if (!isNaN(d)) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const yearStr = String(d.getFullYear()).padStart(4, '0');
      return `${day}.${month}.${yearStr}`;
    }
  }
  if (year !== '' && year != null)
    return `01.01.${String(Number(year)).padStart(4, '0')}`;
  return '';
}

export function shortSeries(s) {
  const m = /^(.*)\((\d{4})\)\s*$/.exec(String(s || '').trim());
  return m ? `${m[1].trim()} ’${String(m[2]).slice(2)}` : s || '';
}

export function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[m]
  );
}
