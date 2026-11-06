const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('digestion initializes its high-DPI canvas and playback after other activities are removed', () => {
  function element() {
    return { children: [], textContent: '', append(...nodes) { this.children.push(...nodes); },
      setAttribute() {}, addEventListener() {} };
  }
  const elements = Object.fromEntries(['scene', 'controls', 'result', 'run', 'reset', 'explain'].map(id => [id, element()]));
  let draws = 0, stopped = 0, pending;
  const canvas = elements.scene;
  Object.assign(canvas, { width: 800, height: 500, clientWidth: 900, clientHeight: 700,
    getContext: () => ({ setTransform() {}, clearRect() {}, fillRect() {} }) });
  const document = { body: { dataset: { activity: 'digestion' } },
    getElementById: id => elements[id], createElement: element, addEventListener() {},
    querySelector: () => ({ getBoundingClientRect: () => ({left: 620, top: 16}) }) };
  elements.result.getBoundingClientRect = () => ({top: 620, bottom: 680});
  const activityContext = { window: { drawDigestiveSystem() { draws++; } } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../science-activities.js'), 'utf8'), activityContext);
  vm.runInNewContext(fs.readFileSync(require.resolve('../science-lab.js'), 'utf8'), {
    document, ScienceActivities: activityContext.window.ScienceActivities,
    window: { devicePixelRatio: 3, matchMedia: () => ({matches:false}), createLabAudio: () => ({ say() {}, stop() { stopped++; } }) },
    ResizeObserver: class { observe() {} },
    requestAnimationFrame: callback => { pending = callback; return 1; }, cancelAnimationFrame() {},
  });
  assert.equal(canvas.width, 2700);
  assert.equal(canvas.height, 2100);
  assert.match(elements.result.textContent, /^口腔/);
  assert.equal(elements.run.textContent, '播放');
  assert.ok(draws > 0);
  elements.run.onclick();
  assert.equal(elements.run.textContent, '暂停');
  pending(100);
  elements.reset.onclick();
  assert.equal(elements.run.textContent, '播放');
  assert.equal(stopped, 1);
});
