import { jest } from '@jest/globals';

const renderMock = jest.fn();
await jest.unstable_mockModule('../render.js', () => ({ render: renderMock }));
const { apply } = await import('../filters.js');

describe('apply', () => {
  function createState() {
    const items = [
      { id: '1', title: 'Batman #1', series: 'Batman', year: 2020, event: 'Event1', characters: ['Batman'], search: 'batman first issue', ts: 1 },
      { id: '2', title: 'Batman vs Joker', series: 'Batman', year: 2021, event: 'Event2', characters: ['Batman', 'Joker'], search: 'batman vs joker', ts: 2 },
      { id: '3', title: 'Superman Returns', series: 'Superman', year: 2020, event: 'Event1', characters: ['Superman'], search: 'superman returns', ts: 3 }
    ];
    return {
      items,
      view: [],
      readSet: new Set(),
      idSet: new Set(items.map(x => x.id))
    };
  }

  function createEl() {
    return {
      mq: { value: '' },
      mseries: { value: '' },
      myear: { value: '' },
      mevent: { value: '' },
      mchar: { value: '' },
      msort: { value: 'dateAsc' },
      quickHideRead: { checked: false }
    };
  }

  beforeEach(() => {
    renderMock.mockClear();
    globalThis.localStorage = {
      store: {},
      setItem(key, value) { this.store[key] = String(value); },
      getItem(key) { return this.store[key] || null; },
      removeItem(key) { delete this.store[key]; }
    };
  });

  test('filters by search query', () => {
    const state = createState();
    const el = createEl();
    el.mq.value = 'superman';
    apply(state, el, new Intl.Collator('de'));
    expect(state.view.map(x => x.id)).toEqual(['3']);
  });

  test('combines search and filters', () => {
    const state = createState();
    const el = createEl();
    el.mq.value = 'batman';
    el.mseries.value = 'Batman';
    el.mchar.value = 'Joker';
    apply(state, el, new Intl.Collator('de'));
    expect(state.view.map(x => x.id)).toEqual(['2']);
  });
});
