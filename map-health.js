// 地图网络失败时保留页面上的名录和控件，提供可轻触的重新加载入口。
window.watchKidMap = function (map) {
  const options = document.getElementById('controls');
  let optionsButton;
  function syncOptions() {
    if (!options) return;
    const wasOpen = options.classList.contains('kid-options-open');
    options.classList.remove('kid-options-open');
    const collapsed = getComputedStyle(options).display === 'none';
    options.classList.toggle('kid-options-open', collapsed && wasOpen);
    optionsButton.hidden = !collapsed;
    optionsButton.setAttribute('aria-expanded', String(collapsed && wasOpen));
    optionsButton.textContent = collapsed && wasOpen ? '收起选项' : '地图选项';
    const heading = document.getElementById('header') || document.getElementById('title');
    const titleBottom = heading?.getBoundingClientRect().bottom || 60;
    const top = Math.max(12, Math.min(titleBottom + 8, window.innerHeight / 4));
    optionsButton.style.top = `${top}px`;
    options.style.setProperty('--kid-options-top', `${top + 52}px`);
  }
  if (options) {
    optionsButton = document.createElement('button');
    optionsButton.type = 'button'; optionsButton.className = 'kid-map-options';
    optionsButton.setAttribute('aria-controls', 'controls');
    optionsButton.onclick = () => { options.classList.toggle('kid-options-open'); syncOptions(); };
    document.body.append(optionsButton); syncOptions();
    window.addEventListener('resize', syncOptions);
  }
  const panel = document.createElement('div');
  panel.className = 'kid-map-status'; panel.hidden = true;
  panel.setAttribute('role', 'status'); panel.setAttribute('data-speak-ignore', '');
  const message = document.createElement('span');
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = '重新加载';
  retry.onclick = () => window.location.reload();
  panel.append(message, retry); document.body.append(panel);
  if (!document.getElementById('kid-map-status-style')) {
    const style = document.createElement('style'); style.id = 'kid-map-status-style';
    style.textContent = '.kid-map-status{position:fixed;z-index:10000;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);width:max-content;display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid #f0c66d;border-radius:16px;background:#fff9e9;color:#392d17;font:16px/1.4 system-ui;box-shadow:0 3px 16px #0003}.kid-map-status[hidden]{display:none}.kid-map-status button{flex-shrink:0;min-height:44px;padding:8px 12px;border:1px solid #b99344;border-radius:12px;background:#fff;color:#392d17;font:inherit;touch-action:manipulation;cursor:pointer}';
    style.textContent += '.kid-map-options{position:fixed;right:12px;top:70px;z-index:10001;min-height:44px;padding:8px 14px;border:1px solid #84bdd0;border-radius:14px;background:#102438;color:#fff;font:16px system-ui;cursor:pointer;touch-action:manipulation}.kid-map-options[hidden]{display:none}#controls.kid-options-open{display:block!important;position:fixed;top:var(--kid-options-top,122px);left:12px;right:auto;bottom:auto;max-height:calc(100dvh - var(--kid-options-top,122px) - 24px);max-width:calc(100vw - 24px);width:280px;overflow:auto;z-index:10000;box-sizing:border-box}';
    document.head.append(style);
  }
  let failed = false;
  function show(text) { message.textContent = text; panel.hidden = false; }
  const slow = setTimeout(() => show('地图加载有点慢，可以稍等或重试。'), 15000);
  function onError() {
    failed = true; clearTimeout(slow);
    show(navigator.onLine === false ? '网络断开了，连上后再试一次。' : '部分地图没加载好，请再试一次。');
  }
  function onIdle() { clearTimeout(slow); if (!failed) panel.hidden = true; }
  function onOnline() { if (failed || !panel.hidden) show('网络恢复了，可以重新加载地图。'); }
  map.on('error', onError); map.on('idle', onIdle);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onError);
  map.on('remove', () => {
    clearTimeout(slow); panel.remove();
    if (optionsButton) { optionsButton.remove(); window.removeEventListener('resize', syncOptions); options.classList.remove('kid-options-open'); }
    window.removeEventListener('online', onOnline); window.removeEventListener('offline', onError);
  });
  return { showError: onError };
};
