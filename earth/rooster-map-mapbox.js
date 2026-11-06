window.createRoosterMapbox = function (onSelect) {
  const error = document.getElementById('error');
  let map, data, ready = false, codes = [], selected = null;
  function viewPadding() {
    if (window.innerWidth <= 640) return { top: 64, right: 20, bottom: Math.max(210, Math.min(window.innerHeight * .36, 300)) + 24, left: 20 };
    return { top: 64, right: window.innerWidth <= 900 ? 320 : 340, bottom: 50, left: 40 };
  }
  function fail() { error.hidden = false; error.textContent = 'Mapbox 底图暂不可用，请检查网络或使用 SVG 版；儿歌与省份按钮仍可使用。'; }
  function highlight(nextCodes, nextSelected) {
    codes = nextCodes; selected = nextSelected;
    if (!ready || !map.getLayer('province-fill')) return;
    const active = ['in', ['get', 'adcode'], ['literal', codes]];
    map.setPaintProperty('province-fill', 'fill-color', ['case', ['==', ['get', 'adcode'], selected || -1], '#ee8652', active, '#ffd15c', '#428f9c']);
    map.setPaintProperty('province-fill', 'fill-opacity', ['case', ['==', ['get', 'adcode'], selected || -1], .86, active, .78, .21]);
    map.setPaintProperty('province-lines', 'line-color', ['case', active, '#ffe49a', '#a6cdd5']);
    map.setPaintProperty('province-lines', 'line-width', ['case', active, 2.2, .8]);
  }
  function render() {
    if (!ready || !data) return;
    if (map.getSource('provinces')) { map.getSource('provinces').setData(data); return; }
    map.addSource('provinces', { type: 'geojson', data });
    map.addLayer({ id: 'province-fill', type: 'fill', source: 'provinces', filter: ['has', 'name'], paint: { 'fill-color': '#428f9c', 'fill-opacity': .21 } });
    map.addLayer({ id: 'province-lines', type: 'line', source: 'provinces', paint: { 'line-color': '#a6cdd5', 'line-width': .8 } });
    const points = data.features.filter(feature => feature.properties.name).map(feature => ({ type: 'Feature', properties: { name: feature.properties.name.replace(/壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市/g, '') }, geometry: { type: 'Point', coordinates: feature.properties.centroid || feature.properties.center } }));
    map.addSource('province-labels', { type: 'geojson', data: { type: 'FeatureCollection', features: points } });
    map.addLayer({ id: 'province-labels', type: 'symbol', source: 'province-labels', layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 11, 5, 16], 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'] }, paint: { 'text-color': '#fff4d5', 'text-halo-color': '#182b3e', 'text-halo-width': 1.5 } });
    map.on('click', 'province-fill', event => { const code = Number(event.features?.[0]?.properties.adcode); if (Number.isFinite(code)) onSelect(code); });
    map.on('mouseenter', 'province-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'province-fill', () => { map.getCanvas().style.cursor = ''; });
    highlight(codes, selected);
  }
  try {
    if (!window.mapboxgl || !mapboxgl.supported()) throw new Error('Mapbox unavailable');
    map = new mapboxgl.Map({ container: 'mapbox-map', style: 'mapbox://styles/mapbox/dark-v11', center: [105, 32], zoom: 2.5, projection: 'globe', antialias: true, attributionControl: false });
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
    // 与地铁页一致：底图所有文字图层优先显示简体中文。
    map.on('style.load', () => {
      for (const layer of map.getStyle().layers || []) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) {
          map.setLayoutProperty(layer.id, 'text-field', [
            'coalesce', ['get', 'name_zh-Hans'], ['get', 'name_zh'], ['get', 'name'],
          ]);
        }
      }
    });
    map.on('load', () => {
      ready = true;
      map.setPadding(viewPadding());
      map.setFog({ color: '#182c4e', 'high-color': '#2278be', 'horizon-blend': .03, 'space-color': '#020617', 'star-intensity': .65 });
      render();
    });
    map.on('error', fail);
    const resize = new ResizeObserver(() => { map.resize(); map.setPadding(viewPadding()); }); resize.observe(document.getElementById('mapbox-map'));
    document.getElementById('map-home').addEventListener('click', () => map.flyTo({ center: [105, 32], zoom: 2.5, bearing: 0, pitch: 0, padding: viewPadding(), duration: 900, essential: false }));
  } catch { fail(); }
  return { highlight, setData(value) { data = value; render(); } };
};
