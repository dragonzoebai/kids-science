const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('camera cancellation stops late streams and prevents late play completion from restoring camera UI', async () => {
  const html = fs.readFileSync(require.resolve('../threejs/ar-earth.html'), 'utf8');
  const script = html.slice(html.indexOf('let camStream = null;'), html.indexOf('/* ── 触摸'));
  let resolveMedia, resolvePlay, stopped = 0;
  const button = {disabled: false, classList: {toggle(name, on) {button.on = on;}}};
  const video = {style: {}, play: () => Promise.resolve()};
  const navigator = {mediaDevices: {getUserMedia: () => new Promise(resolve => {resolveMedia = resolve;})}};
  const context = vm.createContext({navigator, document: {hidden: false}, window: {isSecureContext: true},
    btnCam: button, video, stars: {}, setHint() {}, console,
  });
  vm.runInContext(script, context);
  const stream = () => ({getTracks: () => [{stop() {stopped++;}}]});
  const pending = context.setCamera(true);
  await context.setCamera(false);
  resolveMedia(stream()); await pending;
  assert.equal(stopped, 1); assert.equal(button.on, false); assert.equal(video.srcObject, null);
  video.play = () => new Promise(resolve => {resolvePlay = resolve;});
  const playing = context.setCamera(true); resolveMedia(stream()); await new Promise(resolve => setImmediate(resolve));
  await context.setCamera(false); resolvePlay(); await playing;
  assert.equal(stopped, 2); assert.equal(button.on, false); assert.equal(video.style.display, 'none');
  assert.equal(button.disabled, false);
  video.play = () => Promise.resolve();
  const current = context.setCamera(true); resolveMedia(stream()); await current;
  assert.equal(button.on, true); assert.equal(video.style.display, 'block');
  await context.setCamera(false); assert.equal(stopped, 3);
  const stale = context.setCamera(true), finishStale = resolveMedia;
  await context.setCamera(false);
  const fresh = context.setCamera(true); resolveMedia(stream()); await fresh;
  const chosen = video.srcObject;
  finishStale(stream()); await stale;
  assert.equal(video.srcObject, chosen, 'late cancelled requests cannot replace a newer camera');
  assert.equal(button.on, true);
  await context.setCamera(false);
});
