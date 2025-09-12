import { jest } from '@jest/globals';
import { normalize } from '../src/api.js';

const renderMock = jest.fn();
const sortMock = jest.fn((items, order, dir) => {
  void order;
  void dir;
  return items;
});
await jest.unstable_mockModule('../src/render.js', () => ({ render: renderMock, sortItems: sortMock }));
const { apply } = await import('../src/filters.js');

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
      sortOrder: { value: 'title' },
      sortToggle: { dataset: { dir: 'asc' }, textContent: '↑', setAttribute: jest.fn() },
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
    apply(state, el);
    expect(state.view.map(x => x.id)).toEqual(['3']);
  });

  test('combines search and filters', () => {
    const state = createState();
    const el = createEl();
    el.mq.value = 'batman';
    el.mseries.value = 'Batman';
    el.mchar.value = 'Joker';
    apply(state, el);
    expect(state.view.map(x => x.id)).toEqual(['2']);
  });

  test('filters by character with mixed input types', () => {
    const raw = [
      { id: '1', title: 'Item1', characters: 'Batman, Joker' },
      { id: '2', title: 'Item2', characters: ['Batman', 'Robin'] }
    ];
    const items = raw.map(normalize);
    const state = {
      items,
      view: [],
      readSet: new Set(),
      idSet: new Set(items.map(x => x.id))
    };
    const el = createEl();
    el.mchar.value = 'Joker';
    apply(state, el);
    expect(state.view.map(x => x.id)).toEqual(['1']);
  });
  test('passes sort direction to sortItems', () => {
    const state = createState();
    const el = createEl();
    el.sortToggle.dataset.dir = 'desc';
    apply(state, el);
    expect(sortMock).toHaveBeenCalledWith(expect.any(Array), 'title', 'desc');
  });
});
