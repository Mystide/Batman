/** @jest-environment jsdom */
import { jest } from '@jest/globals';
const renderMock = jest.fn();
await jest.unstable_mockModule('../src/render.js', () => ({ render: renderMock, sortItems: jest.fn() }));
const { bindUI } = await import('../src/filters.js');

function setup(){
  document.body.innerHTML = `
    <button id="openFilters">Open</button>
    <div id="drawer">
      <div id="closeDrawer"></div>
      <aside>
        <input id="mq" />
        <button id="closeDrawerBtn">Close</button>
      </aside>
    </div>`;
  return {
    openFilters: document.getElementById('openFilters'),
    closeDrawer: document.getElementById('closeDrawer'),
    closeDrawerBtn: document.getElementById('closeDrawerBtn'),
    drawer: document.getElementById('drawer'),
    mq: document.getElementById('mq'),
    mseries: document.createElement('select'),
    myear: document.createElement('select'),
    mevent: document.createElement('select'),
    mchar: null,
    sortOrder: document.createElement('select')
  };
}

test('drawer traps focus and restores it on close', () => {
  const el = setup();
  const applyFn = jest.fn();
  bindUI(el, applyFn);
  el.openFilters.focus();
  el.openFilters.click();
  expect(document.activeElement).toBe(el.mq);

  el.closeDrawerBtn.focus();
  el.closeDrawerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
  expect(document.activeElement).toBe(el.mq);

  el.mq.focus();
  el.mq.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
  expect(document.activeElement).toBe(el.closeDrawerBtn);

  el.closeDrawerBtn.click();
  expect(document.activeElement).toBe(el.openFilters);
});
