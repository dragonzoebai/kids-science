const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('map loading exposes slow/offline retry feedback and cleans up after removal', () => {
  const mapHandlers = {}, windowHandlers = {}, timers = [], mounted = [];
  let reloads = 0;
  const element = () => ({children: [], setAttribute() {}, append(...children) {this.children.push(...children);}, remove() {this.removed = true;}});
  const window = {location: {reload() {reloads++;}}, addEventListener(type, fn) {windowHandlers[type] = fn;}, removeEventListener(type) {delete windowHandlers[type];}};
  const navigator = {onLine: true};
  const document = {createElement: element, getElementById: () => null, body: {append(el) {mounted.push(el);}}, head: {append() {}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../map-health.js'), 'utf8'), {
    window, document, navigator,
    setTimeout(fn) {timers.push(fn); return fn;}, clearTimeout(fn) {if (fn) fn.cancelled = true;},
  });
  window.watchKidMap({on(type, fn) {mapHandlers[type] = fn;}});
  const panel = mounted[0], [message, retry] = panel.children;
  assert.equal(panel.hidden, true);
  timers[0](); assert.match(message.textContent, /有点慢/);
  mapHandlers.idle(); assert.equal(panel.hidden, true);
  navigator.onLine = false; windowHandlers.offline();
  assert.equal(panel.hidden, false); assert.match(message.textContent, /网络断开/);
  mapHandlers.idle(); assert.equal(panel.hidden, false, 'idle after a failed request must not hide failure');
  navigator.onLine = true; windowHandlers.online(); assert.match(message.textContent, /网络恢复/);
  retry.onclick(); assert.equal(reloads, 1);
  mapHandlers.remove(); assert.equal(panel.removed, true);
  assert.equal(windowHandlers.online, undefined); assert.equal(windowHandlers.offline, undefined);
});
