const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = { window: {} };
for (const name of ["highway-data.js"]) {
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", "earth", name), "utf8"),
    context,
  );
}

test("every listed highway has detailed road geometry, not city-to-city links", () => {
  const { HIGHWAY_DATA: routes, HIGHWAY_GEOMETRY: roads } = context.window;
  assert.equal(Object.keys(roads).length, routes.length);
  for (const [code] of routes) {
    const parts = roads[code];
    assert.ok(parts.length > 0, code);
    assert.ok(
      parts.reduce((n, p) => n + p.length, 0) > 200,
      `${code}: road detail`,
    );
    for (const part of parts) {
      assert.ok(part.length >= 2);
      for (let i = 0; i < part.length; i++) {
        const [x, y] = part[i];
        assert.ok(Number.isFinite(x) && Number.isFinite(y));
        assert.ok(x >= 73 && x <= 135 && y >= 18 && y <= 54);
        if (!i) continue;
        const [a, b] = part[i - 1];
        const km =
          111.32 *
          Math.hypot((x - a) * Math.cos(((y + b) * Math.PI) / 360), y - b);
        assert.ok(
          km < 25,
          `${code}: suspicious ${km.toFixed(1)} km straight connection`,
        );
      }
    }
  }
});

test("the highway map draws roads independently of reference city coordinates", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "earth", "highway.html"),
    "utf8",
  );
  assert.match(html, /HIGHWAY_GEOMETRY\[r\.code\]/);
  assert.doesNotMatch(html, /coordinates:\s*\[r\.coords\[i\],\s*p\]/);
  assert.match(html, /createHighwayGeoJSON/);
});

test("downloadable mainlines match the map, fit the size budget, and contain no branch junctions", () => {
  const data = context.window.createHighwayGeoJSON();
  assert.ok(
    Buffer.byteLength(JSON.stringify(data)) < 1500000,
    "lightweight download for iPad",
  );
  assert.equal(data.features.length, context.window.HIGHWAY_DATA.length);
  for (const feature of data.features) {
    const parts = feature.geometry.coordinates;
    assert.equal(
      JSON.stringify(parts),
      JSON.stringify(context.window.HIGHWAY_GEOMETRY[feature.properties.code]),
    );
    const degrees = new Map();
    for (const part of parts)
      for (let i = 1; i < part.length; i++) {
        for (const p of [part[i - 1], part[i]]) {
          const key = p.join(",");
          degrees.set(key, (degrees.get(key) || 0) + 1);
        }
      }
    assert.ok(
      [...degrees.values()].every((n) => n <= 2),
      `${feature.properties.code}: branch junction`,
    );
  }
});

test("G6 simplified mainline stays near the Xiahuayuan road corridor", () => {
  // 同一车道的真实道路节点，跨越用户截图中的大断口及桥梁断口。
  const checkpoints = [
    [115.2475282, 40.5437307],
    [115.2818673, 40.5156024],
    [115.3059241, 40.4992512],
  ];
  function near(part, point) {
    const scale = Math.cos((point[1] * Math.PI) / 180);
    for (let i = 1; i < part.length; i++) {
      const a = part[i - 1],
        b = part[i];
      const dx = (b[0] - a[0]) * scale,
        dy = b[1] - a[1];
      const x = (point[0] - a[0]) * scale,
        y = point[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy || 1)),
      );
      if (Math.hypot(x - t * dx, y - t * dy) * 111320 < 250) return true;
    }
    return false;
  }
  assert.ok(
    context.window.HIGHWAY_GEOMETRY.G6.some((part) =>
      checkpoints.every((point) => near(part, point)),
    ),
    "G6 should follow the Xiahuayuan road corridor after carriageway merging and simplification",
  );
});

test("fused mainline retains western G7 and OSM attribution", () => {
  assert.ok(
    context.window.HIGHWAY_GEOMETRY.G7.flat().some((p) => p[0] < 90),
    "G7 should include the OSM Xinjiang extension",
  );
  const html = fs.readFileSync(
    path.join(__dirname, "..", "earth", "highway.html"),
    "utf8",
  );
  assert.match(html, /openstreetmap\.org\/copyright/);
});

test("catalogue follows corrected route control points", () => {
  const routes = new Map(context.window.HIGHWAY_DATA.map((r) => [r[0], r[3]]));
  assert.match(routes.get("G1"), /宝坻/);
  assert.doesNotMatch(routes.get("G1"), /天津/);
  assert.match(routes.get("G2"), /莱芜/);
  assert.match(routes.get("G6"), /中宁/);
  assert.match(routes.get("G7"), /伊吾 巴里坤 奇台 阜康/);
  assert.doesNotMatch(routes.get("G7"), /吐鲁番/);
  assert.match(routes.get("G35"), /瑞金/);
  assert.doesNotMatch(routes.get("G35"), /赣州/);
  for (const r of context.window.HIGHWAY_DATA)
    for (const name of r[3].split(" "))
      assert.ok(context.window.HIGHWAY_CITIES[name], name);
});

test("G15 and G75 retain sea gaps and the short Hainan road section", () => {
  for (const code of ["G15", "G75"]) {
    const parts = context.window.HIGHWAY_GEOMETRY[code];
    assert.ok(
      parts.some((p) => p.some(([x, y]) => x > 109 && x < 112 && y < 20.1)),
      `${code}: Hainan section dropped`,
    );
    for (const [x, y] of parts.flat())
      assert.ok(
        !(x > 109.9 && x < 110.7 && y > 20.13 && y < 20.25),
        `${code}: Qiongzhou sea crossing drawn as highway`,
      );
  }
  for (const [x, y] of context.window.HIGHWAY_GEOMETRY.G15.flat())
    assert.ok(
      !(x > 120 && x < 122.5 && y > 37.75 && y < 38.5),
      "Bohai sea crossing drawn as highway",
    );
});

test("G7 retains its short Beijing section from Jianting Bridge instead of dropping it as a branch", () => {
  const parts = context.window.HIGHWAY_GEOMETRY.G7;
  const near = (p, x, y) => Math.hypot((p[0] - x) * 0.77, p[1] - y) < 0.002;
  const beijing = parts.find((part) =>
    part.some((p) => near(p, 116.32961, 40.00962)),
  );
  assert.ok(beijing, "G7 must start at the north fifth ring Jianting Bridge");
  assert.ok(
    beijing.some((p) => near(p, 116.19995, 40.21896)),
    "Beijing mainline must extend through the Shahe corridor",
  );
  assert.ok(
    beijing.some((p) => near(p, 116.17988, 40.30004)),
    "preserve the Deshengkou end of the short mainline",
  );
  assert.ok(
    beijing.every((p) => !(p[1] < 40.15 && p[0] > 116.345)),
    "do not replace G7 with the parallel G6 approach",
  );
});
