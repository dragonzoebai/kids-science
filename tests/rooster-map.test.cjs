const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const data = JSON.parse(fs.readFileSync(require.resolve('../earth/china-provinces.json'), 'utf8'));

test('rooster map renders all 34 regions, highlights provinces and supports guided reset', async () => {
  const nodes = [], ids = new Map(), spoken = [], utterances = [];
  function node() {
    const classes = new Set();
    const el = { dataset: {}, style: {}, children: [], attributes: {}, handlers: {}, textContent: '', hidden: true,
      setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'class') String(value).split(' ').forEach(item => classes.add(item)); },
      addEventListener(key, value) { this.handlers[key] = value; }, appendChild(child) { this.children.push(child); },
      classList: { toggle(key, enabled) { if (enabled) classes.add(key); else classes.delete(key); }, contains: key => classes.has(key) },
    };
    nodes.push(el); return el;
  }
  const document = {
    getElementById(id) { if (!ids.has(id)) ids.set(id, node()); return ids.get(id); },
    createElement: node, createElementNS: node,
    querySelectorAll(selector) {
      if (selector === '.province') return nodes.filter(el => el.classList.contains('province'));
      const property = { '[data-part]': 'part', '[data-dot]': 'dot', '[data-province]': 'province' }[selector];
      return nodes.filter(el => Object.hasOwn(el.dataset, property));
    },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../earth/rooster-map.js'), 'utf8'), {
    document, createLabAudio: () => ({ say(text, onend) { spoken.push(text); const u = { onend }; utterances.push(u); return u; }, effect() {}, stop() {} }),
    fetch: async () => ({ ok: true, json: async () => data }),
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(document.getElementById('province-list').children.length, 34);
  assert.equal(document.getElementById('regions').children.length, 6);
  const paths = document.querySelectorAll('.province');
  assert.equal(paths.length, 68, 'all provinces are drawn on main map and inset');
  assert.ok(paths.every(path => !/NaN|undefined/.test(path.attributes.d)));
  assert.equal(paths.filter(path => path.classList.contains('active')).length, 6);
  assert.equal(spoken.length, 0, 'narration waits for interaction');
  // Speech completion, rather than estimated timers, advances the highlighted line.
  document.getElementById('poem-lines').children[2].handlers.click();
  assert.equal(paths.filter(path => path.classList.contains('active')).length, 6);
  assert.match(document.getElementById('description').textContent, /东北三省/);
  utterances.at(-1).onend();
  assert.match(document.getElementById('description').textContent, /内蒙甘肃/);
  assert.equal(paths.filter(path => path.classList.contains('active')).length, 4);
  const stale = utterances.at(-1).onend;
  document.getElementById('poem-pause').handlers.click(); stale();
  assert.match(document.getElementById('description').textContent, /内蒙甘肃/);
  document.getElementById('poem-play').handlers.click();
  assert.match(spoken.at(-1), /内蒙甘肃/);
  document.getElementById('poem-restart').handlers.click();
  assert.match(spoken.at(-1), /中国地图像雄鸡/);
  document.getElementById('reset').handlers.click();
  assert.equal(paths.filter(path => path.classList.contains('active')).length, 6);
  spoken.length = 0;
  const taiwan = document.querySelectorAll('[data-province]').find(button => Number(button.dataset.province) === 710000);
  taiwan.handlers.click();
  assert.equal(paths.filter(path => path.classList.contains('chosen')).length, 2);
  assert.match(document.getElementById('heading').textContent, /台湾/);
  assert.equal(spoken.length, 1);
  document.getElementById('next').handlers.click();
  assert.match(document.getElementById('heading').textContent, /鸡背/);
  assert.equal(paths.filter(path => path.classList.contains('chosen')).length, 0);
  document.getElementById('reset').handlers.click();
  assert.match(document.getElementById('heading').textContent, /鸡头/);
  assert.equal(paths.filter(path => path.classList.contains('active')).length, 6);
});

test('map data preserves province identities and the South China Sea boundary feature', () => {
  assert.equal(data.features.filter(feature => feature.properties.name).length, 34);
  assert.ok(data.features.some(feature => feature.properties.adcode === '100000_JD'));
  for (const code of [710000, 810000, 820000, 460000]) assert.ok(data.features.some(feature => Number(feature.properties.adcode) === code));
});
