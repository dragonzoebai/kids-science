const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../speak.js'), 'utf8');
const context = {};
vm.runInNewContext(source.slice(source.indexOf('  const clean ='), source.indexOf('  function ownText'))
  + '\nthis.clean = clean; this.readableText = readableText;', context);

test('speech omits emoji, flags, joined icons and keycaps while preserving science text', () => {
  for (const [input, expected] of [
    ['📷 相机背景', '相机背景'], ['🧭 陀螺仪 🎯 回到中国', '陀螺仪 回到中国'],
    ['👩🏽‍🔬 科学家 🇨🇳 中国 1️⃣ 探索', '科学家 中国 探索'],
    ['▶️ 播放 ⏸ 暂停', '播放 暂停'], ['🔊', ''],
    ['23.5° 100% 2 × 3 = 6 +1 −2 ½ H₂O', '23.5° 100% 2 × 3 = 6 +1 −2 ½ H₂O'],
  ]) assert.equal(context.clean(input), expected);
});

test('parent speech excludes icon nodes and keeps surrounding labels', () => {
  const icon = { nodeType: 1, matches: () => true };
  const text = { nodeType: 3, textContent: '相机背景' };
  const button = { matches: () => false, querySelector: () => icon, childNodes: [icon, text] };
  assert.equal(context.readableText(button), '相机背景');
  assert.equal(context.readableText(icon), '');
});
