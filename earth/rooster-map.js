(() => {
  'use strict';
  const PARTS = [
    { name: '鸡头 · 东北', title: '从“鸡头”认识东北', codes: [210000,220000,230000], text: '先看地图右上方。黑龙江、吉林、辽宁合称东北三省，像雄鸡昂起的头。地图上方是北，右方是东。' },
    { name: '鸡背 · 北方', title: '沿着“鸡背”向西走', codes: [150000,620000], text: '内蒙古横跨北方，形状细长。再往西南找甘肃，它像一条长长的走廊。把它们想成雄鸡背部的一段，帮我们记住位置。' },
    { name: '鸡尾 · 西部', title: '到西部找“鸡尾”', codes: [650000,540000], text: '把目光移到地图左边，也就是西方。西北部有新疆，西南部有西藏，它们都很辽阔，可以联想成雄鸡展开的尾羽。' },
    { name: '鸡胸 · 东部', title: '沿着东部看“鸡胸”', codes: [370000,320000,310000,330000], text: '看看地图东边的海岸，依次找找山东、江苏、上海和浙江。东部沿海这段外形，可以联想成雄鸡挺起的胸部。' },
    { name: '鸡腹 · 中南部', title: '走进“鸡腹”找邻居', codes: [410000,420000,430000,360000,350000,450000], text: '雄鸡身体里面藏着许多省份。这里先找河南、湖北、湖南、江西，再看看东南的福建和南边的广西。它们都可以帮助我们认识中南部的位置。' },
    { name: '鸡腿 · 南方', title: '到南方寻找“鸡腿”', codes: [530000,440000,460000], text: '地图下方是南。西南的云南、南边的广东，可以联想成雄鸡腿部附近。再向南看，海南岛在海上；右下角的小框展示南海诸岛。' },
  ];
  const NAMES = ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','台湾','香港','澳门'];
  const CODES = [110000,120000,130000,140000,150000,210000,220000,230000,310000,320000,330000,340000,350000,360000,370000,410000,420000,430000,440000,450000,460000,500000,510000,520000,530000,540000,610000,620000,630000,640000,650000,710000,810000,820000];
  const NS = 'http://www.w3.org/2000/svg';
  const audio = createLabAudio({ intro: '中国地图的外形，让人联想到一只昂首挺胸的雄鸡。点朗读儿歌，跟着歌词找省份，也可以点选一句从那里开始。朗读时对应区域会变成暖黄色。轻触地图或下方的省份名字，还能单独认识一个省级行政区。' });
  let current = 0, chosen = null, features = [];
  const LYRICS = [
    ['中国地图像雄鸡，', CODES], ['昂首挺胸真神气。', CODES],
    ['东北三省在鸡头，', [210000,220000,230000]], ['内蒙甘肃在鸡背；', [150000,620000]],
    ['新疆西藏在鸡尾，', [650000,540000]], ['云南广东在鸡腿；', [530000,440000]],
    ['海南南海诸群岛，', [460000,'100000_JD']], ['就像雄鸡长长的脚；', [460000,'100000_JD']],
    ['广西福建在鸡腹，', [450000,350000]], ['浙江上海在鸡胸；', [330000,310000]],
    ['江苏山东临黄海，', [320000,370000]], ['台湾围在东海中；', [710000]],
    ['天津河北守鸡口，', [120000,130000]], ['保卫首都北京城。', [110000]],
    ['看地图，记地名，', CODES], ['祖国就在我心中', CODES],
  ];
  let poemCodes = null, poemIndex = 0, poemPlaying = false, poemGeneration = 0;
  const lyricButtons = [];
  const status = document.getElementById('status');
  const mapRenderer = typeof createRoosterMapbox === 'function' ? createRoosterMapbox(selectProvince) : null;
  function svgElement(name, attributes) { const el = document.createElementNS(NS, name); Object.entries(attributes).forEach(([key,value]) => el.setAttribute(key,value)); return el; }
  function shortName(code) { return NAMES[CODES.indexOf(Number(code))] || ''; }
  function selectPart(index, speak = true) {
    stopPoem();
    current = index; chosen = null;
    const part = PARTS[index];
    document.getElementById('heading').textContent = part.title;
    document.getElementById('description').textContent = part.text;
    document.getElementById('province-name').textContent = part.codes.map(shortName).join(' · ');
    status.textContent = '点“朗读儿歌”，跟着歌词认识地图。';
    update(); if (speak) { audio.effect(); audio.say(part.text); }
  }
  function selectProvince(code) {
    stopPoem();
    const name = shortName(code); if (!name) return;
    chosen = Number(code);
    const index = PARTS.findIndex(part => part.codes.includes(chosen));
    document.getElementById('heading').textContent = '找到你啦，' + name;
    const feature = features.find(item => Number(item.properties.adcode) === chosen);
    const fullName = feature?.properties.name || name;
    const text = index >= 0 ? `${fullName}在这儿！在我们的形状联想中，可以到“${PARTS[index].name.split(' · ')[0]}”附近找它。` : `${fullName}在这儿！并不是每个省份都要对应雄鸡的一个部位。记住它与周围省份的位置，也很有帮助。`;
    document.getElementById('description').textContent = text;
    document.getElementById('province-name').textContent = fullName;
    status.textContent = `已选中${fullName}。地图中橙色区域就是它。`;
    update(); audio.effect(); audio.say(text);
  }
  function update() {
    mapRenderer?.highlight(poemCodes || (chosen === null ? PARTS[current].codes : []), chosen);
    document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(chosen === null && Number(button.dataset.part) === current)));
    document.querySelectorAll('[data-dot]').forEach(dot => dot.classList.toggle('active', chosen === null && Number(dot.dataset.dot) === current));
    document.querySelectorAll('[data-province]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.province) === chosen)));
    document.querySelectorAll('.province').forEach(path => {
      const code = Number(path.dataset.code);
      path.classList.toggle('active', poemCodes ? poemCodes.includes(code) : chosen === null && PARTS[current].codes.includes(code));
      path.classList.toggle('chosen', code === chosen);
    });
    document.querySelectorAll('.border-lines').forEach(path => {
      path.setAttribute('stroke', poemCodes?.includes('100000_JD') ? '#dc8933' : '#718f86');
      path.setAttribute('stroke-width', poemCodes?.includes('100000_JD') ? 3 : 1.2);
    });
  }
  function poemControls() {
    document.getElementById('poem-play').textContent = poemPlaying ? 'Ⅱ 暂停' : poemCodes ? '▶ 继续朗读' : '▶ 朗读儿歌';
    document.getElementById('poem-play').setAttribute('aria-label', poemPlaying ? '暂停朗读' : poemCodes ? '继续朗读' : '朗读儿歌');
  }
  function stopPoem(clear = true) {
    poemGeneration++;
    if (poemPlaying) audio.stop?.();
    poemPlaying = false;
    if (clear) { poemCodes = null; lyricButtons.forEach(button => { button.setAttribute('aria-current', 'false'); button.style.background = 'transparent'; }); }
    poemControls();
  }
  function readLine() {
    const generation = ++poemGeneration;
    poemPlaying = true; chosen = null; poemCodes = LYRICS[poemIndex][1];
    lyricButtons.forEach((button,index) => {
      button.setAttribute('aria-current', String(index === poemIndex));
      button.style.background = index === poemIndex ? '#f7d890' : 'transparent';
    });
    // 只滚动歌词容器，不使用 scrollIntoView，避免带动整页和地图。
    const lyricPanel = document.getElementById('poem-lines');
    const activeLine = lyricButtons[poemIndex];
    if (Number.isFinite(activeLine.offsetTop) && lyricPanel.clientHeight > 0) {
      lyricPanel.scrollTop = Math.max(0, activeLine.offsetTop - (lyricPanel.clientHeight - activeLine.offsetHeight) / 2);
    }
    document.getElementById('heading').textContent = '儿歌 · 第 ' + (poemIndex + 1) + ' 句';
    document.getElementById('description').textContent = LYRICS[poemIndex][0];
    document.getElementById('province-name').textContent = poemCodes.length === CODES.length ? '中国 · 全图' : poemCodes.map(code => shortName(code) || '南海诸岛').join(' · ');
    status.textContent = '';
    update(); poemControls();
    const utterance = audio.say(LYRICS[poemIndex][0], () => {
      if (generation !== poemGeneration || !poemPlaying) return;
      if (poemIndex < LYRICS.length - 1) { poemIndex++; readLine(); }
      else { stopPoem(false); poemIndex = 0; document.getElementById('poem-play').textContent = '▶ 再读一遍'; status.textContent = '儿歌朗读完成！点选一句可以从那里重新开始。'; }
    });
    if (!utterance) { stopPoem(false); status.textContent = '请先打开“讲解”开关；若浏览器不支持语音，仍可点选歌词查看区域。'; }
    else {
      const originalError = utterance.onerror;
      utterance.onerror = event => { originalError?.(event); if (generation === poemGeneration) { stopPoem(false); status.textContent = '朗读已停止，可点继续重试。'; } };
    }
  }
  LYRICS.forEach(([line],index) => {
    const button = document.createElement('button'); button.textContent = line;
    button.style.cssText = 'display:block;min-height:52px;width:100%;text-align:left;border:0;border-radius:8px;padding:10px 12px;background:transparent;font-size:19px;line-height:1.7;font-weight:550';
    button.addEventListener('click', () => { stopPoem(); poemIndex = index; readLine(); });
    lyricButtons.push(button); document.getElementById('poem-lines').appendChild(button);
  });
  document.getElementById('poem-play').addEventListener('click', () => {
    if (poemPlaying) { stopPoem(false); status.textContent = '已暂停，继续时从本句重新朗读。'; }
    else readLine();
  });
  document.getElementById('poem-restart').addEventListener('click', () => { stopPoem(); poemIndex = 0; readLine(); });
  document.getElementById('audio-controls').addEventListener('click', event => {
    if (event.target.closest?.('#audio-speech, #audio-intro')) { stopPoem(); update(); }
  });
  document.addEventListener?.('visibilitychange', () => { if (document.hidden && poemPlaying) stopPoem(false); });
  NAMES.forEach((name,index) => {
    const button = document.createElement('button'); button.textContent = name; button.dataset.province = CODES[index]; button.addEventListener('click', () => selectProvince(CODES[index])); document.getElementById('province-list').appendChild(button);
  });
  const project = ([lon,lat]) => [(lon - 73) * 12.2 + 28, (54 - lat) * 14.3 + 12];
  const seaProject = ([lon,lat]) => [750 + (lon - 105) * 6.4, 465 + (24 - lat) * 8.1];
  function pathData(geometry, projection) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon => polygon.map(ring => ring.map((point,index) => { const [x,y] = projection(point); return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; }).join(' ') + 'Z').join(' ')).join(' ');
  }
  function drawMap(data) {
    features = data.features;
    if (CODES.some(code => !features.some(feature => Number(feature.properties.adcode) === code))) throw new Error('Incomplete province data');
    if (mapRenderer) { mapRenderer.setData(data); update(); status.textContent = '省界数据已准备好，点“朗读儿歌”开始。'; return; }
    features.forEach(feature => {
      const code = feature.properties.adcode, name = shortName(code);
      for (const [id,projection] of [['main-map',project],['sea-map',seaProject]]) {
        const path = svgElement('path', { d: pathData(feature.geometry,projection), class: name ? 'province' : 'border-lines', 'fill-rule': 'evenodd' });
        if (name) { path.dataset.code = code; const title = svgElement('title', {}); title.textContent = feature.properties.name; path.appendChild(title); path.addEventListener('click', () => selectProvince(code)); }
        document.getElementById(id).appendChild(path);
      }
      if (name && feature.properties.center) {
        const center = feature.properties.centroid || feature.properties.center;
        if (center[1] < 18) return;
        const [x,y] = project(center);
        const label = svgElement('text', { x, y, 'text-anchor': 'middle', class: 'map-label' + ([310000,810000,820000,110000,120000].includes(Number(code)) ? ' tiny-label' : '') });
        label.textContent = name;
        // 珠三角的小区域用引线分开标注。
        if (Number(code) === 810000 || Number(code) === 820000) {
          const offset = Number(code) === 810000 ? 45 : -38;
          document.getElementById('labels').appendChild(svgElement('path', { d: `M${x},${y} l${offset},20`, fill: 'none', stroke: '#6e887b', 'stroke-width': 1 }));
          label.setAttribute('x', x + offset); label.setAttribute('y', y + 30);
        }
        document.getElementById('labels').appendChild(label);
      }
    });
    update(); status.textContent = '地图准备好啦！点“朗读儿歌”开始，也可以点选一句歌词。';
  }
  selectPart(0,false);
  fetch('china-provinces.json').then(response => { if (!response.ok) throw new Error('Map fetch failed'); return response.json(); }).then(drawMap).catch(() => {
    document.getElementById('error').hidden = false; status.textContent = '地图加载失败，可以先朗读儿歌，或刷新重试。';
  });
})();
