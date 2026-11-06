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
  const audio = createLabAudio({ intro: '中国地图的外形，让人联想到一只昂首挺胸的雄鸡。点选鸡头、鸡背、鸡尾等部位，听讲解、找省份。下一处按钮带你按顺序认识。也可以轻触地图或下方的省份名字，单独认识一个省级行政区。' });
  let current = 0, chosen = null, features = [];
  const status = document.getElementById('status');
  function svgElement(name, attributes) { const el = document.createElementNS(NS, name); Object.entries(attributes).forEach(([key,value]) => el.setAttribute(key,value)); return el; }
  function shortName(code) { return NAMES[CODES.indexOf(Number(code))] || ''; }
  function selectPart(index, speak = true) {
    current = index; chosen = null;
    const part = PARTS[index];
    document.getElementById('heading').textContent = part.title;
    document.getElementById('description').textContent = part.text;
    document.getElementById('province-name').textContent = part.codes.map(shortName).join(' · ');
    status.textContent = `第 ${index + 1} / ${PARTS.length} 处：${part.name}。点“下一处”继续。`;
    update(); if (speak) { audio.effect(); audio.say(part.text); }
  }
  function selectProvince(code) {
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
    document.querySelectorAll('[data-part]').forEach(button => button.setAttribute('aria-pressed', String(chosen === null && Number(button.dataset.part) === current)));
    document.querySelectorAll('[data-dot]').forEach(dot => dot.classList.toggle('active', chosen === null && Number(dot.dataset.dot) === current));
    document.querySelectorAll('[data-province]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.province) === chosen)));
    document.querySelectorAll('.province').forEach(path => {
      const code = Number(path.dataset.code);
      path.classList.toggle('active', chosen === null && PARTS[current].codes.includes(code));
      path.classList.toggle('chosen', code === chosen);
    });
  }
  PARTS.forEach((part,index) => {
    const button = document.createElement('button'); button.textContent = part.name; button.dataset.part = index; button.addEventListener('click', () => selectPart(index)); document.getElementById('regions').appendChild(button);
  });
  NAMES.forEach((name,index) => {
    const button = document.createElement('button'); button.textContent = name; button.dataset.province = CODES[index]; button.addEventListener('click', () => selectProvince(CODES[index])); document.getElementById('province-list').appendChild(button);
  });
  document.getElementById('next').addEventListener('click', () => selectPart((current + 1) % PARTS.length));
  document.getElementById('listen').addEventListener('click', () => audio.say(document.getElementById('description').textContent));
  document.getElementById('reset').addEventListener('click', () => { audio.effect('reset'); selectPart(0); });
  const project = ([lon,lat]) => [(lon - 73) * 12.2 + 28, (54 - lat) * 14.3 + 12];
  const seaProject = ([lon,lat]) => [750 + (lon - 105) * 6.4, 465 + (24 - lat) * 8.1];
  function pathData(geometry, projection) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon => polygon.map(ring => ring.map((point,index) => { const [x,y] = projection(point); return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`; }).join(' ') + 'Z').join(' ')).join(' ');
  }
  function drawMap(data) {
    features = data.features;
    if (CODES.some(code => !features.some(feature => Number(feature.properties.adcode) === code))) throw new Error('Incomplete province data');
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
    update(); status.textContent = '地图准备好啦！暖黄色是东北三省。点“再听一遍”开始认识。';
  }
  selectPart(0,false);
  fetch('china-provinces.json').then(response => { if (!response.ok) throw new Error('Map fetch failed'); return response.json(); }).then(drawMap).catch(() => {
    document.getElementById('error').hidden = false; status.textContent = '地图加载失败，可以先用部位和省份按钮听讲解，或刷新重试。';
  });
})();
