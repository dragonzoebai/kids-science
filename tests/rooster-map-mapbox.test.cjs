const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
test('Mapbox adapter retains early highlights until data and style are loaded', () => {
  const layers = new Map(), sources = new Map(), handlers = new Map(), paints = new Map();
  let selected;
  const map = { addControl() {}, on(type, layer, callback) { handlers.set(typeof layer === 'function' ? type : type + ':' + layer, typeof layer === 'function' ? layer : callback); },
    getLayer: id => layers.get(id), getSource: id => sources.get(id), addSource(id, source) { sources.set(id, source); }, addLayer(layer) { layers.set(layer.id, layer); },
    setPaintProperty(id, property, value) { paints.set(id + ':' + property, value); }, setFog() {}, resize() {}, flyTo() {}, getCanvas: () => ({ style: {} }),
  };
  const elements = new Map();
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, { addEventListener() {} }); return elements.get(id); } };
  const mapboxgl = { supported: () => true, Map: function () { return map; }, AttributionControl: function () {}, NavigationControl: function () {} };
  const window = { mapboxgl };
  vm.runInNewContext(fs.readFileSync(require.resolve('../earth/rooster-map-mapbox.js'), 'utf8'), { window, mapboxgl, document, ResizeObserver: class { observe() {} } });
  const renderer = window.createRoosterMapbox(code => { selected = code; });
  renderer.highlight([210000,220000,230000], null);
  renderer.setData(JSON.parse(fs.readFileSync(require.resolve('../earth/china-provinces.json'), 'utf8')));
  assert.equal(layers.size, 0);
  handlers.get('load')();
  assert.ok(layers.has('province-fill') && layers.has('province-labels'));
  assert.equal(sources.get('province-labels').data.features.length, 34);
  assert.ok(JSON.stringify(paints.get('province-fill:fill-color')).includes('230000'));
  renderer.highlight([460000, '100000_JD'], null);
  assert.ok(JSON.stringify(paints.get('province-lines:line-color')).includes('100000_JD'));
  handlers.get('click:province-fill')({ features: [{ properties: { adcode: 710000 } }] });
  assert.equal(selected, 710000);
  renderer.highlight([], 710000);
  assert.ok(JSON.stringify(paints.get('province-fill:fill-color')).includes('710000'));
});
