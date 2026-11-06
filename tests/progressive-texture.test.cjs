const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const requests = [], timers = [];
  class Texture {
    constructor(image) {this.image = image; this.disposed = 0;}
    dispose() {this.disposed++;}
  }
  class Image {
    set src(value) {this.url = value; requests.push(this);}
  }
  const context = vm.createContext({THREE: {Texture}, Image,
    setTimeout: fn => timers.push(fn),
    document: {createElement: () => ({getContext: () => ({fillRect() {}})})},
  });
  const code = fs.readFileSync(require.resolve('../threejs/progressive-texture.js'), 'utf8')
    .replace(/^import .*;\r?\n/m, '').replace(/export function /g, 'function ');
  vm.runInContext(code, context);
  return {context, requests, timers};
}
const settle = async () => {for (let i=0;i<8;i++) await Promise.resolve();};

test('progressive textures retain texture identity/settings and survive either image failing', async () => {
  const {context, requests, timers} = setup();
  let updates = 0;
  const texture = context.loadProgressiveTexture('textures/2k_moon.webp', '#999', () => updates++);
  texture.colorSpace = 'srgb'; texture.anisotropy = 8;
  assert.equal(requests[0].url, 'textures/preview/2k_moon.webp');
  requests[0].onload(); await settle();
  assert.equal(texture.image, requests[0]);
  timers.shift()();
  requests[1].onload(); await settle();
  assert.equal(texture.image, requests[1]);
  assert.equal(texture.colorSpace, 'srgb'); assert.equal(texture.anisotropy, 8);
  assert.equal(texture.disposed, 2); assert.equal(updates, 2);
  const next = context.loadProgressiveTexture('textures/2k_sun.webp');
  requests[2].onload(); await settle(); timers.shift()();
  requests[3].onerror(); await settle();
  assert.equal(next.image, requests[2]);
  const failedPreview = context.loadProgressiveTexture('textures/2k_mars.webp');
  requests[4].onerror(); await settle(); timers.shift()();
  requests[5].onload(); await settle();
  assert.equal(failedPreview.image, requests[5]);
});

test('full image downloads are limited to two concurrent requests and release slots on failure', async () => {
  const {context, requests, timers} = setup();
  for (const name of ['sun','moon','mars']) context.loadProgressiveTexture(`textures/2k_${name}.webp`);
  requests.slice().forEach(request => request.onload()); await settle();
  timers.forEach(fn => fn());
  assert.equal(requests.length, 5);
  requests[3].onerror(); await settle();
  assert.equal(requests.length, 6);
  assert.equal(requests[5].url, 'textures/2k_mars.webp');
});
