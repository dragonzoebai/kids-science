// ---------- 配色（对齐原站 wave 图层的 7 档配色）----------
const COLOR_STOPS = [
  { v: 0, c: "#0d52fb" },
  { v: 2, c: "#0beefb" },
  { v: 4, c: "#f9fd36" },
  { v: 6, c: "#fea800" },
  { v: 9, c: "#fd032f" },
  { v: 12, c: "#780f15" },
  { v: 15, c: "#a401d4" },
];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const COLOR_STOPS_RGB = COLOR_STOPS.map((s) => ({ v: s.v, rgb: hexToRgb(s.c) }));

function colorForMagnitude(m, alpha) {
  let lo = COLOR_STOPS_RGB[0],
    hi = COLOR_STOPS_RGB[COLOR_STOPS_RGB.length - 1];
  for (let i = 0; i < COLOR_STOPS_RGB.length - 1; i++) {
    if (m >= COLOR_STOPS_RGB[i].v && m <= COLOR_STOPS_RGB[i + 1].v) {
      lo = COLOR_STOPS_RGB[i];
      hi = COLOR_STOPS_RGB[i + 1];
      break;
    }
  }
  const span = hi.v - lo.v || 1;
  const t = Math.min(1, Math.max(0, (m - lo.v) / span));
  const r = Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * t);
  const g = Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * t);
  const b = Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * t);
  return `rgba(${r},${g},${b},${alpha})`;
}

(function renderLegend() {
  const bar = document.getElementById("legendBar");
  const ticks = document.getElementById("legendTicks");
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const m = (i / steps) * 15;
    const div = document.createElement("div");
    div.style.background = colorForMagnitude(m, 1);
    bar.appendChild(div);
  }
  [0, 2, 4, 6, 9, 12, 15].forEach((v) => {
    const span = document.createElement("span");
    span.textContent = v;
    ticks.appendChild(span);
  });
})();

// ---------- 地图初始化 ----------
const map = L.map("map", {
  zoomControl: true,
  attributionControl: true,
  minZoom: 3,
  maxZoom: 9,
}).setView([28, 122], 5);

// 天地图矢量底图 + 中文注记（CARTO 现需 API key，已弃用）
const TDT_TK = "40b190683706230fade806c1ac8c14e8";
const tdtUrl = (layer) =>
  `https://{s}.tianditu.gov.cn/${layer}_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=${layer}&style=default&tilematrixset=w&format=tiles&tilematrix={z}&tilerow={y}&tilecol={x}&tk=${TDT_TK}`;
["vec", "cva"].forEach((layer, i) =>
  L.tileLayer(tdtUrl(layer), {
    subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
    attribution: i === 0 ? '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>' : "",
    maxZoom: 18,
  }).addTo(map)
);

// ---------- 中国海洋预报网：实时海浪矢量场数据 ----------
const VERSION_API = "https://www.oceanguide.org.cn/hyyj2/index/getVersion";
const OBS_BASE = "https://obs.oceanguide.org.cn/smartGrid";
const FALLBACK_JSON = "./data/sample-wave-field.json";

// 解析 ESRI ASCII Grid (.asc)：文件按行从北到南存储，转换为 j=0 对应最南端的数组
function parseAsc(text) {
  const lines = text.split(/\r?\n/);
  const header = {};
  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    if (parts.length === 2 && /^[a-zA-Z_]+$/.test(parts[0])) {
      header[parts[0].toLowerCase()] = parseFloat(parts[1]);
    } else {
      break;
    }
  }
  const ncols = header.ncols,
    nrows = header.nrows;
  const flat = new Float64Array(ncols * nrows);
  let idx = 0;
  for (; i < lines.length && idx < flat.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const nums = line.split(/\s+/);
    for (let k = 0; k < nums.length && idx < flat.length; k++) {
      flat[idx++] = parseFloat(nums[k]);
    }
  }
  const nodata = header.nodata_value;
  const arr = new Float64Array(ncols * nrows);
  for (let r = 0; r < nrows; r++) {
    const j = nrows - 1 - r; // 翻转为南->北
    for (let c = 0; c < ncols; c++) {
      const val = flat[r * ncols + c];
      arr[j * ncols + c] = val === nodata ? NaN : val;
    }
  }
  return {
    ncols,
    nrows,
    xllcorner: header.xllcorner,
    yllcorner: header.yllcorner,
    cellsize: header.cellsize,
    values: arr,
  };
}

function timeToFilename(dateStr) {
  // "2026-07-06 08:00" -> "2026-07-06_0800"
  const [datePart, timePart] = dateStr.split(" ");
  const hh = timePart.split(":")[0];
  return `${datePart}_${hh}00`;
}

async function fetchRealWaveField() {
  const versionRes = await fetch(VERSION_API, { method: "POST" });
  if (!versionRes.ok) throw new Error("getVersion 请求失败: " + versionRes.status);
  const versionJson = await versionRes.json();
  const wave = versionJson.obj && versionJson.obj.wave;
  if (!wave) throw new Error("返回数据中没有 wave 字段");

  const time = timeToFilename(wave.startDate);
  const uUrl = `${OBS_BASE}/Wave/unzip/${wave.version}/${wave.version}/${time}_u_2.asc`;
  const vUrl = `${OBS_BASE}/Wave/unzip/${wave.version}/${wave.version}/${time}_v_2.asc`;

  const [uRes, vRes] = await Promise.all([fetch(uUrl), fetch(vUrl)]);
  if (!uRes.ok || !vRes.ok)
    throw new Error(`asc 文件请求失败: u=${uRes.status} v=${vRes.status}`);
  const [uText, vText] = await Promise.all([uRes.text(), vRes.text()]);
  const uGrid = parseAsc(uText);
  const vGrid = parseAsc(vText);

  const nx = uGrid.ncols,
    ny = uGrid.nrows;
  const magnitude = new Float64Array(nx * ny);
  for (let k = 0; k < magnitude.length; k++) {
    magnitude[k] = Math.sqrt(uGrid.values[k] ** 2 + vGrid.values[k] ** 2);
  }

  return {
    source: "live",
    startDate: wave.startDate,
    bbox: {
      lngMin: uGrid.xllcorner,
      lngMax: uGrid.xllcorner + (nx - 1) * uGrid.cellsize,
      latMin: uGrid.yllcorner,
      latMax: uGrid.yllcorner + (ny - 1) * uGrid.cellsize,
    },
    nx,
    ny,
    dx: uGrid.cellsize,
    dy: uGrid.cellsize,
    u: uGrid.values,
    v: vGrid.values,
    magnitude,
  };
}

async function fetchFallbackField() {
  const res = await fetch(FALLBACK_JSON);
  const data = await res.json();
  data.source = "fallback";
  return data;
}

// ---------- 双线性插值 ----------
let field = null; // { bbox, nx, ny, dx, dy, u, v, magnitude }

function bilinear(arr, nx, ny, bbox, lng, lat) {
  const fx = ((lng - bbox.lngMin) / (bbox.lngMax - bbox.lngMin)) * (nx - 1);
  const fy = ((lat - bbox.latMin) / (bbox.latMax - bbox.latMin)) * (ny - 1);
  if (fx < 0 || fy < 0 || fx > nx - 1 || fy > ny - 1) return null;
  const x0 = Math.floor(fx),
    x1 = Math.min(nx - 1, x0 + 1);
  const y0 = Math.floor(fy),
    y1 = Math.min(ny - 1, y0 + 1);
  const tx = fx - x0,
    ty = fy - y0;
  const v00 = arr[y0 * nx + x0];
  const v10 = arr[y0 * nx + x1];
  const v01 = arr[y1 * nx + x0];
  const v11 = arr[y1 * nx + x1];
  if (Number.isNaN(v00) || Number.isNaN(v10) || Number.isNaN(v01) || Number.isNaN(v11))
    return null;
  const a = v00 + (v10 - v00) * tx;
  const b = v01 + (v11 - v01) * tx;
  return a + (b - a) * ty;
}

function sampleField(lng, lat) {
  if (!field) return null;
  const u = bilinear(field.u, field.nx, field.ny, field.bbox, lng, lat);
  const v = bilinear(field.v, field.nx, field.ny, field.bbox, lng, lat);
  if (u === null || v === null) return null;
  return { u, v, m: Math.sqrt(u * u + v * v) };
}

// ---------- Canvas 粒子层 ----------
const canvas = document.getElementById("particleCanvas");
const ctx = canvas.getContext("2d");
let particles = [];
let animationOn = true;
let magnitudeOn = true;
let directionOn = false;
let particleCount = 800; // 对齐原站 wave 图层 paths:800
let speedFactor = 1; // 倍率，1 对应原站 velocityScale:0.005

function resizeCanvas() {
  const size = map.getSize();
  canvas.width = size.x;
  canvas.height = size.y;
}
resizeCanvas();
map.on("resize", resizeCanvas);
window.addEventListener("resize", () => {
  map.invalidateSize();
  resizeCanvas();
});

function randomParticle() {
  const b = field.bbox;
  const lng = b.lngMin + Math.random() * (b.lngMax - b.lngMin);
  const lat = b.latMin + Math.random() * (b.latMax - b.latMin);
  return { lng, lat, age: Math.random() * 60 };
}

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) particles.push(randomParticle());
}

// 背景着色层（“大小”）：独立 canvas，随地图移动/缩放重绘，不参与粒子拖尾淡出
const bgCanvas = document.createElement("canvas");
const bgCtx = bgCanvas.getContext("2d");
const bgWrap = document.createElement("div");
bgWrap.style.position = "absolute";
bgWrap.style.top = "0";
bgWrap.style.left = "0";
bgWrap.style.zIndex = 440;
bgWrap.style.pointerEvents = "none";
bgWrap.appendChild(bgCanvas);
document.body.appendChild(bgWrap);
// 整体透明度只在这里应用一次（合成时），格子本身按完全不透明绘制。
// 若改成每个格子单独用半透明 fillStyle/globalAlpha，相邻格子的次像素边界
// 重叠部分会被反复叠加透明度，显示为明显的小网格线。
bgCanvas.style.opacity = "0.85";

function drawMagnitudeLayer() {
  if (!magnitudeOn || !field) return;
  const size = map.getSize();
  bgCanvas.width = size.x;
  bgCanvas.height = size.y;
  const b = field.bbox;
  for (let lat = b.latMin; lat < b.latMax; lat += field.dy) {
    for (let lng = b.lngMin; lng < b.lngMax; lng += field.dx) {
      const s = sampleField(lng + field.dx / 2, lat + field.dy / 2);
      if (!s) continue;
      const p1 = map.latLngToContainerPoint([lat, lng]);
      const p2 = map.latLngToContainerPoint([lat + field.dy, lng + field.dx]);
      bgCtx.fillStyle = colorForMagnitude(s.m, 1);
      // 像素边界取整对齐，让相邻格子严丝合缝，不留次像素缝隙/重叠。
      const x0 = Math.round(Math.min(p1.x, p2.x));
      const y0 = Math.round(Math.min(p1.y, p2.y));
      const x1 = Math.round(Math.max(p1.x, p2.x));
      const y1 = Math.round(Math.max(p1.y, p2.y));
      bgCtx.fillRect(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0));
    }
  }
}

function refreshBackground() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  drawMagnitudeLayer();
}
map.on("move zoom resize", refreshBackground);

// 粒子拖尾是在屏幕像素坐标上累积的（destination-in 淡出），地图平移/缩放后
// 旧的拖尾像素不会跟着地图一起移动，会在新视图下变成错位的“残影”。
// 在开始平移/缩放时清空拖尾缓冲，避免旧像素残留。
function clearParticleTrails() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
map.on("movestart zoomstart", clearParticleTrails);

function drawDirectionArrows() {
  if (!directionOn || !field) return;
  const b = field.bbox;
  const stepLng = field.dx * 2,
    stepLat = field.dy * 2;
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 1.2;
  for (let lat = b.latMin; lat <= b.latMax; lat += stepLat) {
    for (let lng = b.lngMin; lng <= b.lngMax; lng += stepLng) {
      const s = sampleField(lng, lat);
      if (!s || s.m < 0.05) continue;
      const p = map.latLngToContainerPoint([lat, lng]);
      if (p.x < -20 || p.y < -20 || p.x > canvas.width + 20 || p.y > canvas.height + 20)
        continue;
      const ang = Math.atan2(-s.v, s.u); // screen y 与纬度方向相反
      const len = 8 + Math.min(10, s.m);
      const ex = p.x + Math.cos(ang) * len;
      const ey = p.y + Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      const hx1 = ex - Math.cos(ang - 0.4) * 4;
      const hy1 = ey - Math.sin(ang - 0.4) * 4;
      const hx2 = ex - Math.cos(ang + 0.4) * 4;
      const hy2 = ey - Math.sin(ang + 0.4) * 4;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(hx1, hy1);
      ctx.lineTo(hx2, hy2);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

// 以下常量对齐原站 index.js 里 wave 图层的实际配置
const FADE = 0.96;
const MAX_AGE = 200;
const LINE_WIDTH = 5;
const STROKE_ALPHA = 0.75;
const VELOCITY_SCALE = 0.005; // 原站 wave.velocityScale，单位：度/帧

function stepParticles() {
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = `rgba(0,0,0,${FADE})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "source-over";

  ctx.lineWidth = LINE_WIDTH;
  particles.forEach((p) => {
    const s = sampleField(p.lng, p.lat);
    if (!s) {
      Object.assign(p, randomParticle());
      return;
    }
    const p1 = map.latLngToContainerPoint([p.lat, p.lng]);
    const scale = VELOCITY_SCALE * speedFactor;
    const nlat = p.lat + s.v * scale;
    const nlng = p.lng + s.u * scale;
    const p2 = map.latLngToContainerPoint([nlat, nlng]);

    ctx.strokeStyle = `rgba(255,255,255,${STROKE_ALPHA})`;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    p.lat = nlat;
    p.lng = nlng;
    p.age += 1;
    if (p.age > MAX_AGE) Object.assign(p, randomParticle());
  });

  drawDirectionArrows();
}

function frame() {
  if (animationOn) {
    stepParticles();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawDirectionArrows();
  }
  requestAnimationFrame(frame);
}

// ---------- 控件绑定 ----------
document.getElementById("chkMagnitude").addEventListener("change", (e) => {
  magnitudeOn = e.target.checked;
  refreshBackground();
});
document.getElementById("chkDirection").addEventListener("change", (e) => {
  directionOn = e.target.checked;
});
document.getElementById("chkAnimation").addEventListener("change", (e) => {
  animationOn = e.target.checked;
  if (!animationOn) ctx.clearRect(0, 0, canvas.width, canvas.height);
});
document.getElementById("rngParticles").addEventListener("input", (e) => {
  particleCount = parseInt(e.target.value, 10);
  initParticles();
});
document.getElementById("rngSpeed").addEventListener("input", (e) => {
  speedFactor = parseFloat(e.target.value);
});

// ---------- 启动：优先实时数据，失败则回退示例数据 ----------
const statusEl = document.getElementById("dataStatus");

fetchRealWaveField()
  .then((data) => {
    field = data;
    statusEl.textContent = `实时数据 · 中国海洋预报网 · 发布时间 ${data.startDate}`;
    initParticles();
    refreshBackground();
    frame();
  })
  .catch((err) => {
    console.error("实时数据获取失败，回退到本地示例数据:", err);
    statusEl.textContent = "实时数据获取失败，已切换为本地合成示例数据（非真实）";
    statusEl.classList.add("error");
    return fetchFallbackField().then((data) => {
      field = data;
      initParticles();
      refreshBackground();
      frame();
    });
  })
  .catch((err) => {
    console.error("示例数据也加载失败:", err);
    statusEl.textContent = "数据加载失败，请通过本地服务器（而非 file://）打开本页面";
  });
