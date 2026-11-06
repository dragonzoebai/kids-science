const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('season playback stops exactly at every quarter and resumes past the current stop', () => {
  const html = fs.readFileSync(path.join(__dirname, '../threejs/season.html'), 'utf8');
  const button = { textContent: '', setAttribute() {}, addEventListener(type, fn) { this.click = fn; } };
  const context = vm.createContext({ document: { getElementById: () => button } });
  vm.runInContext(html.slice(html.indexOf('let playing = false;'), html.indexOf('/* ── Speed control')), context);
  assert.equal(vm.runInContext('playing', context), false);
  let angle = Math.PI;
  for (let stop = 3; stop <= 12; stop++) {
    button.click();
    assert.equal(vm.runInContext('playing', context), true);
    context.angle = angle;
    angle = vm.runInContext('advanceOrbit(angle, 0.01)', context);
    assert.equal(vm.runInContext('playing', context), true, 'resuming leaves the current node');
    context.angle = angle;
    angle = vm.runInContext('advanceOrbit(angle, 10)', context);
    assert.equal(angle, stop * Math.PI / 2, 'large frames cannot skip nodes');
    assert.equal(vm.runInContext('playing', context), false);
    assert.equal(button.textContent, '播放');
    context.angle = angle;
    assert.equal(vm.runInContext('advanceOrbit(angle, 0)', context), angle);
  }
});
