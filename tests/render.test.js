// tests/render.test.js
import { render } from '../render.js';

describe('render', () => {
  test('creates cards with title and toggle', () => {
    const state = {
      view: [{ id: 1, title: 'Batman #1', cover: null }],
      readSet: new Set(),
    };
    const el = {
      grid: document.createElement('div'),
      readCount: document.createElement('span'),
      progress: document.createElement('i'),
      count: document.createElement('span'),
    };
    render(state, el);
    expect(el.grid.querySelector('.card .h').textContent).toBe('Batman #1');
  });
});
