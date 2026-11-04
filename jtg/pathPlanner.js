/**
 * PathPlanner — 纯路网图算法模块
 * 无任何 DOM / Leaflet 依赖，可独立测试。
 *
 * 暴露全局对象 PathPlanner，包含：
 *   buildGraph(features)                     → nodes
 *   dijkstra(nodes, startKey, endKey)        → { coords, dist } | null
 *   nearestNode(nodes, coord)                → { key, dist }
 *   heapNodeKey(nodes, features, name)       → key | null
 */
const PathPlanner = (function () {

  const SNAP = 1e-5; // 节点合并容差（经纬度，约 1 m）

  /** 将坐标吸附到 SNAP 网格，返回字符串 key */
  function snapKey([lng, lat]) {
    const r = (v) => (Math.round(v / SNAP) * SNAP).toFixed(7);
    return `${r(lng)},${r(lat)}`;
  }

  /** Haversine 球面距离（米） */
  function haverDist([lng1, lat1], [lng2, lat2]) {
    const R = 6371000, rad = Math.PI / 180;
    const φ1 = lat1 * rad, φ2 = lat2 * rad;
    const dφ = (lat2 - lat1) * rad, dλ = (lng2 - lng1) * rad;
    const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  /**
   * 从路网 GeoJSON features 构建邻接图。
   * 严格沿线段坐标建边，不做额外桥接。
   *
   * 节点结构：{ key: string, coord: [lng, lat], adj: { key: weight } }
   *
   * @param  {Array} features  GeoJSON FeatureCollection.features
   * @returns {Object}         节点字典 { [key]: node }
   */
  function buildGraph(features) {
    const nodes = {};

    function getNode(coord) {
      const k = snapKey(coord);
      if (!nodes[k]) nodes[k] = { key: k, coord: [coord[0], coord[1]], adj: {} };
      return nodes[k];
    }

    function addEdge(a, b) {
      if (a.key === b.key) return;
      const w = haverDist(a.coord, b.coord);
      if (!(b.key in a.adj) || a.adj[b.key] > w) a.adj[b.key] = w;
      if (!(a.key in b.adj) || b.adj[a.key] > w) b.adj[a.key] = w;
    }

    for (const f of features) {
      if (!f.geometry) continue;
      const lines = f.geometry.type === "MultiLineString"
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
      for (const line of lines) {
        for (let i = 0; i < line.length - 1; i++) {
          addEdge(getNode(line[i]), getNode(line[i + 1]));
        }
      }
    }
    return nodes;
  }

  /**
   * Dijkstra 最短路径。
   *
   * @param  {Object} nodes     buildGraph 返回的节点字典
   * @param  {string} startKey  起点 key
   * @param  {string} endKey    终点 key
   * @returns {{ coords: [lng,lat][], dist: number } | null}
   *          成功返回路径坐标序列和总距离（米），不可达返回 null
   */
  function dijkstra(nodes, startKey, endKey) {
    const dist = {}, prev = {};
    for (const k in nodes) dist[k] = Infinity;
    dist[startKey] = 0;

    const heap    = [[0, startKey]];
    const visited = new Set();

    while (heap.length > 0) {
      heap.sort((a, b) => a[0] - b[0]);
      const [d, u] = heap.shift();
      if (visited.has(u)) continue;
      if (u === endKey) break;
      visited.add(u);
      for (const [v, w] of Object.entries(nodes[u].adj)) {
        const alt = d + w;
        if (alt < dist[v]) {
          dist[v] = alt;
          prev[v]  = u;
          heap.push([alt, v]);
        }
      }
    }

    if (dist[endKey] === Infinity) return null;
    const path = [];
    for (let cur = endKey; cur; cur = prev[cur]) path.unshift(nodes[cur].coord);
    return { coords: path, dist: dist[endKey] };
  }

  /**
   * 在图中找距离 coord 最近的节点。
   *
   * @param  {Object}   nodes  节点字典
   * @param  {[number, number]} coord  [lng, lat]
   * @returns {{ key: string, dist: number }}
   */
  function nearestNode(nodes, coord) {
    let bestKey = null, bestD = Infinity;
    for (const k in nodes) {
      const d = haverDist(coord, nodes[k].coord);
      if (d < bestD) { bestD = d; bestKey = k; }
    }
    return { key: bestKey, dist: bestD };
  }

  /**
   * 按名称在路网 features 中搜索要素，返回图中最近节点的 key。
   * 大小写不敏感（适用于堆位编号和"出口"等特殊名称）。
   *
   * @param  {Object} nodes    节点字典
   * @param  {Array}  features GeoJSON features
   * @param  {string} name     要查找的名称
   * @returns {string | null}  节点 key，未找到返回 null
   */
  function heapNodeKey(nodes, features, name) {
    const upper = name.toUpperCase();
    let bestKey = null, bestD = Infinity;
    for (const f of features) {
      if ((f.properties?.name ?? "").toUpperCase() !== upper) continue;
      if (!f.geometry) continue;
      const lines = f.geometry.type === "MultiLineString"
        ? f.geometry.coordinates
        : [f.geometry.coordinates];
      for (const line of lines) {
        for (const pt of line) {
          const { key, dist } = nearestNode(nodes, pt);
          if (dist < bestD) { bestD = dist; bestKey = key; }
        }
      }
    }
    return bestKey;
  }

  return { buildGraph, dijkstra, nearestNode, heapNodeKey };
})();
