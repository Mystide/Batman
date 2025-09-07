import {
  formatDateDE,
  shortSeries,
  normalize,
  extractYearFromSeries,
  escapeHtml,
  firstOf
} from '../api.js';

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
    expect(result.id).toBe('series_(2020)#1-test');
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
