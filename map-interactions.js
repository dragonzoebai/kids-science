// 地图气泡支持悬停和点击，每次只选择最上层要素。
(() => {
  const states = new WeakMap();
  window.bindMapPopup = (map, popup, { layers, hover = "mouseenter", show, onSelect }) => {
    let state = states.get(map);
    if (!state) {
      state = { entries: [], pinned: false };
      states.set(map, state);
      map.on("click", (event) => {
        const available = [...new Set(state.entries.flatMap(entry => entry.layers))].filter(id => map.getLayer(id));
        const feature = available.length ? map.queryRenderedFeatures(event.point, { layers: available })[0] : null;
        state.pinned = Boolean(feature);
        state.entries.forEach(entry => entry.popup.remove());
        if (!feature) return;
        const entry = state.entries.find(item => item.layers.includes(feature.layer.id));
        const hit = { ...event, features: [feature] };
        entry.onSelect?.(hit);
        entry.show(hit);
        // 在用户点击调用栈内发声，兼容 iPad Safari 的语音手势限制。
        const element = entry.popup.getElement();
        if (!element || !entry.popup.isOpen()) return;
        element.setAttribute("data-speak-ignore", "");
        window.kidSpeak?.(element.textContent);
      });
      map.on("movestart", () => {
        if (!state.pinned) state.entries.forEach(entry => entry.popup.remove());
      });
    }
    const entry = { layers, popup, show, onSelect };
    state.entries.push(entry);
    layers.forEach(layer => {
      map.on(hover, layer, event => {
        map.getCanvas().style.cursor = "pointer";
        if (!state.pinned) {
          popup.getElement()?.removeAttribute("data-speak-ignore");
          show(event);
        }
      });
      map.on("mouseleave", layer, () => {
        map.getCanvas().style.cursor = "";
        if (!state.pinned) popup.remove();
      });
    });
  };
})();
