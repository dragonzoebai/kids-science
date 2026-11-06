const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('earthquake loading ignores stale responses and supports failure/timeout retry', async () => {
  const html = fs.readFileSync(require.resolve('../earth/earthquake.html'), 'utf8');
  const code = html.slice(html.indexOf('      let dataRequest;'), html.indexOf('      /* ── 应用筛选'));
  const pending = [], timers = [], loading = {style: {}, append(button) {this.button = button;}};
  let applied = 0;
  const context = vm.createContext({AbortController, Date, Error, Array,
    document: {getElementById: () => loading, createElement: () => ({style: {}})},
    fetch: (url, options) => new Promise((resolve, reject) => pending.push({resolve, reject, options})),
    setTimeout: fn => {timers.push(fn); return timers.length;}, clearTimeout() {},
    USGS: {week: '/week', month: '/month'}, currentPeriod: 'week', allFeatures: [],
    applyFilter: () => {applied++;},
  });
  vm.runInContext(code, context);
  const response = mag => ({ok: true, json: async () => ({features: [{properties: {mag}, geometry: {coordinates: [0,0,2]}}], metadata: {generated: 0}})});
  const first = context.loadData();
  context.currentPeriod = 'month';
  const second = context.loadData();
  assert.equal(pending[0].options.signal.aborted, true);
  pending[1].resolve(response(5)); await second;
  pending[0].resolve(response(1)); await first;
  assert.equal(applied, 1);
  assert.equal(context.allFeatures[0].properties.mag, 5);
  const failed = context.loadData(); pending[2].resolve({ok: false, status: 503}); await failed;
  assert.match(loading.textContent, /加载失败/);
  assert.equal(loading.button.textContent, '重新加载');
  const retry = loading.button.onclick(); timers.at(-1)();
  assert.equal(pending[3].options.signal.aborted, true);
  pending[3].reject(new Error('aborted')); await retry;
  assert.match(loading.textContent, /网络有点慢/);
});
