const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { COLORS, mixPigments } = require('../physics/pigment-mix.js');

test('CMY primaries produce RGB secondary colors and black with equal ratios', () => {
  assert.equal(mixPigments({}), null);
  for (const key of Object.keys(COLORS)) assert.deepEqual(mixPigments({ [key]: 3 }), COLORS[key]);
  assert.deepEqual(mixPigments({ cyan: 1, yellow: 1 }), [0, 255, 0]);
  assert.deepEqual(mixPigments({ magenta: 1, yellow: 1 }), [255, 0, 0]);
  assert.deepEqual(mixPigments({ cyan: 1, magenta: 1 }), [0, 0, 255]);
  assert.deepEqual(mixPigments({ cyan: 1, magenta: 1, yellow: 1 }), [0, 0, 0]);
  assert.deepEqual(mixPigments({ cyan: 1, yellow: 2 }), mixPigments({ cyan: 3, yellow: 6 }));
  const moreYellow = mixPigments({ cyan: 1, yellow: 3 });
  assert.ok(moreYellow[0] > 0 && moreYellow[1] === 255 && moreYellow[2] === 0);
});

test('experiment supports adding, stirring, continued mixing and reset during animation', () => {
  const elements = new Map(), frames = new Map();
  let nextFrame = 0;
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
  function element(id) {
    if (!elements.has(id)) elements.set(id, { textContent: '', style: {}, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; } });
    return elements.get(id);
  }
  const buttons = Object.keys(COLORS).map(key => Object.assign(element(key), { dataset: { color: key } }));
  element('plate').getContext = () => ctx;
  const html = fs.readFileSync(path.join(__dirname, '../physics/color-mixing.html'), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean).join('\n');
  vm.runInNewContext(script, {
    PigmentMix: { COLORS, mixPigments },
    document: { getElementById: element, querySelectorAll: () => buttons },
    performance: { now: () => 0 }, matchMedia: () => ({ matches: false }),
    requestAnimationFrame(fn) { frames.set(++nextFrame, fn); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  const click = id => element(id).handlers.click();
  const finish = () => { const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(2000)); };
  assert.equal(element('stir').disabled, true);
  click('yellow'); click('cyan'); click('yellow');
  assert.equal(element('yellow-count').textContent, 2);
  assert.equal(element('cyan-count').textContent, 1);
  click('stir');
  assert.ok(buttons.every(button => button.disabled));
  click('magenta');
  assert.equal(element('magenta-count').textContent, 0);
  finish();
  assert.equal(element('swatch').style.background, `rgb(${mixPigments({ yellow: 2, cyan: 1 }).join(',')})`);
  assert.equal(element('stir').disabled, true);
  click('magenta'); click('stir'); finish();
  assert.equal(element('swatch').style.background, `rgb(${mixPigments({ yellow: 2, cyan: 1, magenta: 1 }).join(',')})`);
  click('magenta'); click('stir'); click('reset');
  assert.equal(frames.size, 0);
  assert.equal(element('magenta-count').textContent, 0);
  assert.equal(element('empty').hidden, false);
  assert.equal(element('stir').disabled, true);
  assert.ok(buttons.every(button => !button.disabled));
  for (let i = 0; i < 65; i++) click('magenta');
  assert.equal(element('magenta-count').textContent, 60);
  assert.ok(buttons.every(button => button.disabled));
});
