// ui.js
export function showTokenNotice() {
  const notice = document.getElementById('tokenWarning');
  if (!notice) return;

  notice.hidden = false;
  // trigger header recalculation (init() in app.js listens to resize)
  window.dispatchEvent(new Event('resize'));
}
