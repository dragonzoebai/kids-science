(function (root) {
  'use strict';
  const DEFAULT_POSITIONS = [[400, 280], [560, 280], [480, 415]];
  const RADIUS = 175;
  function sampleLight(lights, x, y) {
    return lights.map(light => {
      const distance = Math.hypot(x - light.x, y - light.y) / RADIUS;
      const coverage = distance <= .84 ? 1 : Math.max(0, (1 - distance) / .16);
      return Math.round((light.enabled ? light.power : 0) / 100 * 255 * coverage);
    });
  }
  const api = { DEFAULT_POSITIONS, RADIUS, sampleLight };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LightMix = api;
})(typeof window !== 'undefined' ? window : globalThis);
