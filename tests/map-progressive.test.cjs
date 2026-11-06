const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const handlers = new Map(), timers = [];
  let resolveFetch, options, removedLayers = [], style;
  const map = {
    on(type, fn) { const list = handlers.get(type) || []; list.push(fn); handlers.set(type, list); return this; },
    once(type, fn) { const wrap = (...args) => { this.off(type, wrap); fn(...args); }; return this.on(type, wrap); },
    off(type, fn) { handlers.set(type, (handlers.get(type) || []).filter(item => item !== fn)); },
    fire(type, event = {}) { for (const fn of [...handlers.get(type) || []]) fn(event); },
    getStyle: () => style, listImages: () => ['train'], getImage: () => ({data: {width: 1, height: 1}, pixelRatio: 2}),
    hasImage: () => false, addImage(id) { this.restoredImage = id; },
    getLayer: id => style.layers.find(layer => layer.id === id), getSource: id => style.sources[id],
    isSourceLoaded: () => map.tilesReady,
    removeLayer(id) { removedLayers.push(id); style.layers = style.layers.filter(layer => layer.id !== id); },
    addLayer(layer, before) { const i = style.layers.findIndex(item => item.id === before); style.layers.splice(i < 0 ? style.layers.length : i,0,layer); },
    addSource(id, source) { style.sources[id] = source; },
    setStyle(value) { style = value; },
  };
  const window = {};
  vm.runInNewContext(fs.readFileSync(require.resolve('../map-progressive.js'), 'utf8'), {
    window, URL, AbortController, document: {currentScript: {src: 'https://example.org/kids/map-progressive.js'}},
    mapboxgl: {accessToken: 'test', Map: function (value) { options = value; style = value.style; return map; }},
    fetch: () => new Promise(resolve => { resolveFetch = resolve; }),
    setTimeout(fn) { timers.push(fn); return fn; }, clearTimeout() {},
  });
  window.createKidMap({container: 'map', style: 'mapbox://styles/mapbox/dark-v11', center: [105,32], zoom: 3});
  return {map, timers, removedLayers, options, resolve(value) { resolveFetch(value); }};
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('local basemap appears first; remote tiles must be ready before reveal, while overlays and images survive', async () => {
  const t = setup(), {map, options} = t;
  assert.equal(map.kidBasemapState, 'local');
  assert.equal(options.style.sources['kid-local-earth'].tiles[0], 'https://example.org/kids/earth/earth-tiles/{z}/{x}/{y}.webp');
  const data = {type: 'FeatureCollection', features: []};
  map.getStyle().sources.business = {type: 'geojson', data};
  map.getStyle().layers.push({id: 'selected', type: 'line', source: 'business', filter: ['==', 'id', 7]});
  map.addImage('train', {width:1,height:1}, {pixelRatio:2});
  map.fire('style.load');
  t.resolve({ok: true, json: async () => ({version: 8, sources: {online: {type: 'vector'}}, layers: [{id: 'online-label', type: 'symbol', source: 'online', layout: {'text-field': ['get','name_en']}}]})});
  await tick();
  assert.equal(map.getStyle().sources.business.data, data);
  assert.deepEqual(Array.from(map.getStyle().layers, l => l.id), ['online-label','kid-local-earth','selected']);
  map.fire('render'); assert.equal(map.kidBasemapState, 'loading');
  assert.ok(map.getLayer('kid-local-earth'));
  assert.equal(map.restoredImage, 'train', 'business images are never removed');
  map.tilesReady = true; map.fire('render');
  assert.equal(map.kidBasemapState, 'online');
  assert.ok(!map.getLayer('kid-local-earth'));
  assert.ok(map.getLayer('selected'));
  assert.deepEqual(options.center, [105,32]);
  map.fire('error', {sourceId: 'online', error: new Error('tile unavailable')});
  assert.equal(map.kidBasemapState, 'local');
  assert.deepEqual(Array.from(map.getStyle().layers, l => l.id), ['online-label','kid-local-earth','selected']);
});

test('HTTP failure, resource errors and late responses retain the local cover', async () => {
  for (const failure of ['http','timeout','resource','remove']) {
    const t = setup(); t.map.fire('style.load');
    if (failure === 'timeout') t.timers[0]();
    if (failure === 'resource') t.map.fire('error', {error: new Error('Mapbox resource unavailable')});
    if (failure === 'remove') t.map.fire('remove');
    t.resolve({ok: failure !== 'http', json: async () => ({version:8,sources:{online:{type:'raster'}},layers:[]})});
    await tick(); t.map.tilesReady = true; t.map.fire('render');
    assert.ok(t.map.getLayer('kid-local-earth'), failure);
    assert.notEqual(t.map.kidBasemapState, 'online');
  }
});

test('every Mapbox page uses the shared local-first constructor', () => {
  const root = path.resolve(__dirname, '..');
  const pages = fs.readdirSync(path.join(root,'earth')).filter(name => name.endsWith('.html'));
  let count = 0;
  for (const name of pages) {
    const html = fs.readFileSync(path.join(root,'earth',name),'utf8');
    assert.ok(!html.includes('new mapboxgl.Map('), name);
    if (html.includes('window.createKidMap(') || name === 'rooster-map-mapbox.html') {
      assert.ok(html.includes('../map-progressive.js'),name); count++;
    }
  }
  assert.equal(count,11);
});
