const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');

test('map taps prefer the topmost label, speak once, persist, and dismiss on blank taps', () => {
  const handlers = new Map();
  const spoken = [];
  let hits = [], selected = 0, shown = 0, open = false, ignored = false;
  const element = {
    textContent: 'Station A',
    setAttribute() { ignored = true; },
    removeAttribute() { ignored = false; },
  };
  const popup = {
    getElement: () => element,
    isOpen: () => open,
    remove() { open = false; },
  };
  const map = {
    on(type, layer, fn) {
      const key = typeof layer === 'function' ? type : `${type}:${layer}`;
      handlers.set(key, typeof layer === 'function' ? layer : fn);
    },
    getLayer: () => true,
    getCanvas: () => ({ style: {} }),
    queryRenderedFeatures: () => hits,
  };
  const window = { kidSpeak: text => spoken.push(text) };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'map-interactions.js'), 'utf8'), { window });
  const show = () => { shown++; open = true; };
  window.bindMapPopup(map, popup, { layers: ['line'], show });
  window.bindMapPopup(map, popup, {
    layers: ['point', 'label'], show, onSelect: () => selected++,
  });
  hits = [{ layer: { id: 'label' } }, { layer: { id: 'point' } }, { layer: { id: 'line' } }];
  handlers.get('click')({ point: {} });
  assert.equal(selected, 1);
  assert.equal(shown, 1);
  assert.deepEqual(spoken, ['Station A']);
  assert.equal(ignored, true);
  handlers.get('mouseleave:label')();
  handlers.get('mouseenter:line')({});
  assert.equal(open, true);
  assert.equal(shown, 1);
  hits = [];
  handlers.get('click')({ point: {} });
  assert.equal(open, false);
  handlers.get('mouseenter:label')({});
  assert.equal(shown, 2);
  assert.equal(ignored, false);
});

test('canvas taps work while drags, pinch gestures and cancelled gestures do not select', () => {
  const handlers = {};
  class Canvas {}
  const target = new Canvas();
  vm.runInNewContext(fs.readFileSync(path.join(root, 'touch.js'), 'utf8'), {
    document: { addEventListener: (name, fn) => { handlers[name] = fn; } },
    HTMLCanvasElement: Canvas, performance: { now: () => 100 },
  });
  const pointer = (id, x = 10) => ({ target, pointerId: id, clientX: x, clientY: 10 });
  function clickBlocked() {
    let blocked = false;
    handlers.click({ target, preventDefault() {}, stopImmediatePropagation() { blocked = true; } });
    return blocked;
  }
  handlers.pointerdown(pointer(1));
  handlers.pointerup(pointer(1));
  assert.equal(clickBlocked(), false);
  handlers.pointerdown(pointer(1));
  handlers.pointermove(pointer(1, 40));
  handlers.pointerup(pointer(1, 40));
  assert.equal(clickBlocked(), true);
  handlers.pointerdown(pointer(1));
  handlers.pointerdown(pointer(2));
  handlers.pointerup(pointer(2));
  handlers.pointerup(pointer(1));
  assert.equal(clickBlocked(), true);
  handlers.pointerdown(pointer(1));
  handlers.pointercancel(pointer(1));
  assert.equal(clickBlocked(), true);
  handlers.pointerdown(pointer(1));
  handlers.pointerup(pointer(1));
  assert.equal(clickBlocked(), false);
});

test('all project HTML pages have a viewport and valid inline JavaScript', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'science-pages-check-'));
  try {
    for (const dir of ['.', 'earth', 'threejs', 'biology', 'physics']) {
      for (const file of fs.readdirSync(path.join(root, dir))) {
        if (!file.endsWith('.html')) continue;
        const name = path.join(dir, file);
        const html = fs.readFileSync(path.join(root, name), 'utf8');
        assert.match(html, /name=["']viewport["']/, name);
        for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
          if (/importmap/.test(match[1])) { JSON.parse(match[2]); continue; }
          if (!match[2].trim()) continue;
          const script = path.join(temp, /type=["']module/.test(match[1]) ? 'check.mjs' : 'check.cjs');
          fs.writeFileSync(script, match[2]);
          const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
          assert.equal(result.status, 0, `${name}\n${result.stderr}`);
        }
      }
    }
  } finally {
    for (const file of fs.readdirSync(temp)) fs.unlinkSync(path.join(temp, file));
    fs.rmdirSync(temp);
  }
});
