const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { sampleLight, DEFAULT_POSITIONS } = require('../physics/light-mix.js');

test('RGB overlap produces secondary colors, white, darkness and variable brightness', () => {
  const lights = DEFAULT_POSITIONS.map(([x, y]) => ({ x, y, enabled: true, power: 100 }));
  assert.deepEqual(sampleLight(lights, 480, 350), [255, 255, 255]);
  lights[2].enabled = false;
  assert.deepEqual(sampleLight(lights, 480, 350), [255, 255, 0]);
  lights[0].enabled = false; lights[2].enabled = true;
  assert.deepEqual(sampleLight(lights, 480, 350), [0, 255, 255]);
  lights[1].enabled = false; lights[0].enabled = true;
  assert.deepEqual(sampleLight(lights, 480, 350), [255, 0, 255]);
  lights[0].power = 50;
  assert.deepEqual(sampleLight(lights, 480, 350), [128, 0, 255]);
  assert.deepEqual(sampleLight(lights, 0, 0), [0, 0, 0]);
});

test('light experiment presets, controls, pointer movement and reset update the screen sample', () => {
  const elements = new Map();
  const ctx = new Proxy({}, { get: (_, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
  function element(id) {
    if (!elements.has(id)) elements.set(id, { style: {}, dataset: {}, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute(key, value) { this[key] = value; } });
    return elements.get(id);
  }
  const selects = [0, 1, 2].map(i => Object.assign(element('select-' + i), { dataset: { select: String(i) } }));
  const presets = ['redgreen', 'greenblue', 'redblue', 'all', 'apart'].map(key => Object.assign(element(key), { dataset: { preset: key } }));
  Object.assign(element('screen'), { getContext: () => ctx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 700 }), setPointerCapture() {}, releasePointerCapture() {} });
  const html = fs.readFileSync(require.resolve('../physics/light-mixing.html'), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean).join('\n');
  vm.runInNewContext(script, { LightMix: { DEFAULT_POSITIONS, RADIUS: 175, sampleLight }, document: { getElementById: element, querySelectorAll: selector => selector === '[data-select]' ? selects : presets } });
  const click = id => element(id).handlers.click();
  const sample = () => element('swatch').style.background;
  assert.equal(sample(), 'rgb(255,255,255)');
  for (const [preset, color] of [['redgreen', 'rgb(255,255,0)'], ['greenblue', 'rgb(0,255,255)'], ['redblue', 'rgb(255,0,255)'], ['all', 'rgb(255,255,255)']]) {
    click(preset); assert.equal(sample(), color);
  }
  element('power-0').handlers.input({ target: { value: '50' } });
  assert.equal(sample(), 'rgb(128,255,255)');
  element('enabled-1').handlers.change({ target: { checked: false } });
  assert.equal(sample(), 'rgb(128,0,255)');
  click('apart'); assert.equal(sample(), 'rgb(0,0,0)');
  click('select-0');
  element('screen').handlers.pointerdown({ pointerId: 1, pointerType: 'touch', clientX: 480, clientY: 350 });
  assert.equal(sample(), 'rgb(255,0,0)');
  // A second finger does not take over the first finger's light.
  element('screen').handlers.pointerdown({ pointerId: 2, pointerType: 'touch', clientX: 175, clientY: 175 });
  assert.equal(sample(), 'rgb(255,0,0)');
  click('reset'); assert.equal(sample(), 'rgb(255,255,255)');
  assert.equal(element('power-0').value, 100);
  assert.equal(element('enabled-1').checked, true);
  assert.equal(element('select-0')['aria-pressed'], 'true');
});
