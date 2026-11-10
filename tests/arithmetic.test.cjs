const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('arithmetic supports bounded random questions, retries, zero, modes and solved locking', () => {
  function element(dataset = {}) {
    return { dataset, children: [], attrs: {}, handlers: {}, textContent: '',
      classList: { remove() {}, toggle() {} },
      append(...nodes) { this.children.push(...nodes); },
      replaceChildren(...nodes) { this.children = nodes; },
      setAttribute(k, v) { this.attrs[k] = v; },
      addEventListener(k, fn) { this.handlers[k] = fn; } };
  }
  const ids = Object.fromEntries(['left', 'right', 'operator', 'answer', 'feedback', 'next', 'prompt', 'apples', 'keys', 'read', 'check', 'erase', 'range-label'].map(id => [id, element()]));
  const modes = ['mixed', 'add', 'subtract'].map(mode => element({ mode }));
  const limits = [5, 10, 20].map(limit => element({ limit }));
  const keys = Array.from({ length: 10 }, (_, number) => element({ number }));
  const document = { getElementById: id => ids[id], createElement: () => element(),
    querySelector: () => element(), querySelectorAll: selector => selector === '[data-mode]' ? modes : selector === '[data-limit]' ? limits : keys,
    addEventListener() {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('../math/arithmetic.js'), 'utf8'), { document, window: {} });
  const clickNumber = number => ids.keys.handlers.click({ target: { closest: () => keys[number] } });
  const seen = new Set();
  for (const range of limits) {
  range.handlers.click();
  const limit = range.dataset.limit;
  for (const mode of modes) {
    mode.handlers.click();
    for (let i = 0; i < 300; i++) {
      const a = Number(ids.left.textContent), b = Number(ids.right.textContent), op = ids.operator.textContent;
      const result = op === '+' ? a + b : a - b;
      assert.ok(a >= 0 && a <= limit && b >= 0 && b <= limit && result >= 0 && result <= limit);
      if (mode.dataset.mode !== 'mixed') assert.equal(op, mode.dataset.mode === 'add' ? '+' : '−');
      seen.add(result);
      if (op === '−') assert.equal(ids.apples.children[0].children.filter(item => item.className.includes('gone')).length, b);
      clickNumber(9);
      clickNumber(9);
      ids.check.handlers.click();
      assert.match(ids.feedback.textContent, /再数/);
      assert.ok(keys.every(key => !key.disabled));
      ids.erase.handlers.click();
      ids.erase.handlers.click();
      ids.check.handlers.click();
      assert.equal(ids.answer.textContent, '?');
      for (const digit of String(result)) clickNumber(Number(digit));
      assert.doesNotMatch(ids.feedback.textContent, /^答对/);
      ids.check.handlers.click();
      assert.match(ids.feedback.textContent, /答对/);
      assert.ok(keys.every(key => key.disabled));
      clickNumber(9);
      assert.equal(Number(ids.answer.textContent), result);
      const previous = `${a}${op}${b}`;
      ids.next.handlers.click();
      assert.notEqual(`${ids.left.textContent}${ids.operator.textContent}${ids.right.textContent}`, previous);
      assert.equal(ids.answer.textContent, '?');
    }
  }
  }
  assert.ok(seen.has(0) && seen.has(10) && seen.has(20));
});
