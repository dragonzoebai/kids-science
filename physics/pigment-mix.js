(function (root) {
  'use strict';
  const COLORS = { cyan: [0, 255, 255], magenta: [255, 0, 255], yellow: [255, 255, 0] };
  // 理想 CMY 减色教学模型：青吸收红、品红吸收绿、黄吸收蓝。
  // 以最多的份数归一化，展示比例对色相的影响，不模拟溶剂浓度或真实光谱。
  function mixPigments(counts) {
    const amounts = Object.keys(COLORS).map(key => counts[key] || 0);
    const maximum = Math.max(...amounts);
    if (!maximum) return null;
    return amounts.map(amount => Math.round(255 * (1 - amount / maximum)));
  }
  const api = { COLORS, mixPigments };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PigmentMix = api;
})(typeof window !== 'undefined' ? window : globalThis);
