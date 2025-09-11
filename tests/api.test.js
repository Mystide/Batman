import {
  formatDateDE,
  shortSeries,
  normalize,
  extractYearFromSeries,
  escapeHtml,
  firstOf,
  generateId
} from '../src/api.js';

describe('formatDateDE', () => {
  test('formats valid date', () => {
    expect(formatDateDE('2020-03-01')).toBe('01.03.2020');
  });

  test('falls back to year', () => {
    expect(formatDateDE('', 1999)).toBe('01.01.1999');
  });

  test('returns empty string for invalid input', () => {
    expect(formatDateDE('')).toBe('');
  });
});

describe('shortSeries', () => {
  test('shortens series with year', () => {
    expect(shortSeries('Batman (1987)')).toBe('Batman ’87');
  });

  test('returns original if no year', () => {
    expect(shortSeries('NoYear')).toBe('NoYear');
  });
});

describe('normalize', () => {
  test('normalizes basic fields', () => {
    const item = { title: 'Test', issue: '1', series: 'Series (2020)', cover: 'http://example.com/cover.jpg', date: '2020-01-01' };
    const result = normalize(item);
    expect(result.year).toBe(2020);
    expect(result.id).toBe('series__2020__1-test');
  });
  
  test('converts character string to array', () => {
    const item = { title: 'Test', characters: 'Batman, Joker, , Catwoman ' };
    const result = normalize(item);
    expect(result.characters).toEqual(['Batman', 'Joker', 'Catwoman']);
  });

  test('trims character array entries', () => {
    const item = { title: 'Test', characters: [' Batman', 'Joker ', '', ''] };
    const result = normalize(item);
    expect(result.characters).toEqual(['Batman', 'Joker']);
  });
});

describe('extractYearFromSeries', () => {
  test('extracts year', () => {
    expect(extractYearFromSeries('Series (1999)')).toBe(1999);
  });

  test('returns empty string for invalid input', () => {
    expect(extractYearFromSeries('Series')).toBe('');
  });
});

describe('escapeHtml', () => {
  test('escapes special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('firstOf', () => {
  test('returns first non-nullish value', () => {
    expect(firstOf(null, undefined, '', 'x', 'y')).toBe('x');
  });
});

describe('generateId', () => {
  test('replaces special characters and keeps inputs distinct', () => {
    const a = generateId({ title: 'A/B:C' });
    const b = generateId({ title: 'A-B-C' });
    const c = generateId({ title: 'ABC' });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });

  test('generates unique ids for different comics', () => {
    const items = [
      { series: 'Batman', issue: '1', title: 'Night' },
      { series: 'Batman', issue: '2', title: 'Night' },
      { series: 'Batman', issue: '1', title: 'Day' },
      { series: 'Superman', issue: '1', title: 'Night' },
    ];
    const ids = items.map((i) => generateId(i));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
