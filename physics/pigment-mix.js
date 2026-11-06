(function (root) {
  'use strict';
  const COLORS = { red: [222, 53, 64], green: [40, 153, 94], yellow: [250, 205, 48] };
  // 用反射率的几何平均近似颜料的吸光混合，不是光的 RGB 相加。
  function mixPigments(counts) {
    const total = Object.keys(COLORS).reduce((sum, key) => sum + (counts[key] || 0), 0);
    if (!total) return null;
    return [0, 1, 2].map(channel => Math.round(255 * Math.exp(
      Object.keys(COLORS).reduce((sum, key) => sum + (counts[key] || 0) / total * Math.log(COLORS[key][channel] / 255), 0)
    )));
  }
  const api = { COLORS, mixPigments };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PigmentMix = api;
})(typeof window !== 'undefined' ? window : globalThis);
