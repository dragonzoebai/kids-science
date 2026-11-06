// 本地底图先显示；在线图层加载期间由本地栅格遮盖，业务图层始终位于上方。
(() => {
const tiles = new URL('earth/earth-tiles/', document.currentScript.src).href;
window.createKidMap = function (options) {
  const localSource = 'kid-local-earth', localLayer = 'kid-local-earth';
  const onlineStyle = options.style;
  const map = new mapboxgl.Map({ ...options, localFontFamily: 'sans-serif', style: {
    version: 8, projection: { name: options.projection || 'globe' },
    // 样式校验要求声明 glyphs；localFontFamily 让全部文字在本机生成，不请求此地址。
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources: { [localSource]: { type: 'raster', tiles: [tiles + '{z}/{x}/{y}.webp'], tileSize: 256, maxzoom: 3,
      attribution: 'Earth texture: <a href="https://www.solarsystemscope.com/textures/">Solar System Scope</a> · CC BY 4.0' } },
    layers: [{ id: localLayer, type: 'raster', source: localSource }],
  } });
  map.kidBasemapState = 'local';
  const controller = new AbortController();
  let removed = false, failed = false, installed = false, timeout, onlineSources = [], onlineLayers = [];
  function keepLocal() {
    failed = true; clearTimeout(timeout); controller.abort();
    map.kidBasemapState = 'local';
    if (map.getSource(localSource) && !map.getLayer(localLayer)) {
      const firstOverlay = map.getStyle().layers.find(layer => !onlineLayers.includes(layer.id));
      map.addLayer({id: localLayer, type: 'raster', source: localSource}, firstOverlay?.id);
    }
  }
  map.on('error', event => {
    const onlineError = onlineSources.includes(event.sourceId) ||
      (!event.sourceId && /mapbox|sprite|glyph|^sources|^layers/i.test(event.error?.message || ''));
    if (onlineError) keepLocal();
  });
  map.on('render', () => {
    if (!installed || failed || map.kidBasemapState !== 'loading' || !onlineSources.every(id => map.getSource(id) && map.isSourceLoaded(id))) return;
    // 同一张地图内揭去遮盖层，镜头、Marker、事件及业务图层无需迁移。
    if (map.getLayer(localLayer)) map.removeLayer(localLayer);
    map.kidBasemapState = 'online'; clearTimeout(timeout);
    map.fire('kid-basemap-ready');
  });
  map.once('style.load', async () => {
    if (typeof onlineStyle !== 'string') return;
    map.kidBasemapState = 'loading';
    timeout = setTimeout(keepLocal, 30000);
    try {
      const url = onlineStyle.startsWith('mapbox://styles/')
        ? 'https://api.mapbox.com/styles/v1/' + onlineStyle.slice('mapbox://styles/'.length) + '?sdk=js-3.4.0&access_token=' + encodeURIComponent(mapboxgl.accessToken)
        : onlineStyle;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Style HTTP ' + response.status);
      const online = await response.json();
      if (removed || failed) return;
      // 手动载入底图图标，再添加在线图层；整个过程不调用 setStyle，
      // 避免重建样式打断动画、清空业务图标或重复触发页面初始化。
      if (online.sprite) {
        const sprite = online.sprite.startsWith('mapbox://sprites/')
          ? 'https://api.mapbox.com/styles/v1/' + online.sprite.slice('mapbox://sprites/'.length) + '/sprite'
          : new URL(online.sprite, url).href;
        const spriteURL = suffix => {
          const address = new URL(sprite);
          address.pathname += suffix;
          if (online.sprite.startsWith('mapbox://')) address.searchParams.set('access_token', mapboxgl.accessToken);
          return address.href;
        };
        const [indexResponse, imageResponse] = await Promise.all([
          fetch(spriteURL('.json'), {signal: controller.signal}),
          fetch(spriteURL('.png'), {signal: controller.signal}),
        ]);
        if (!indexResponse.ok || !imageResponse.ok) throw new Error('Sprite unavailable');
        const [index, blob] = await Promise.all([indexResponse.json(), imageResponse.blob()]);
        const atlas = await createImageBitmap(blob);
        try {
          for (const [id, item] of Object.entries(index)) {
            if (removed || failed) return;
            if (map.hasImage(id)) continue;
            const image = await createImageBitmap(atlas, item.x, item.y, item.width, item.height);
            try {
              map.addImage(id, image, {pixelRatio: item.pixelRatio || 1, sdf: !!item.sdf,
                stretchX: item.stretchX, stretchY: item.stretchY, content: item.content});
            } finally { image.close(); }
          }
        } finally { atlas.close(); }
      }
      if (removed || failed) return;
      const current = map.getStyle();
      // 业务初始化只执行一次。在线底图的中文标注在这里处理。
      for (const layer of online.layers || []) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) layer.layout['text-field'] = ['coalesce', ['get', 'name_zh-Hans'], ['get', 'name_zh'], ['get', 'name']];
      }
      const collisions = (online.layers || []).some(layer => current.layers.some(item => item.id === layer.id));
      if (collisions || Object.keys(online.sources || {}).some(id => current.sources[id])) throw new Error('Basemap ID collision');
      onlineSources = Object.keys(online.sources || {});
      onlineLayers = online.layers.map(layer => layer.id);
      for (const [id, source] of Object.entries(online.sources || {})) map.addSource(id, source);
      for (const layer of online.layers) map.addLayer(layer, localLayer);
      installed = true;
    } catch { if (!removed) keepLocal(); }
  });
  map.once('remove', () => { removed = true; clearTimeout(timeout); controller.abort(); });
  return map;
};
})();
