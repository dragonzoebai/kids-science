// 瓦片跨域代理（零依赖，Node 原生）
// 用法：  node tile-proxy.js
//   或：  set TILE_TARGET=https://tdtc.shipxy.com && node tile-proxy.js
//
// 页面里把 TILE_URL 指向本代理，例如：
//   http://localhost:8809/wxt/img_w/tile.t?z={z}&x={x}&y={y}
// 代理会把 /wxt/img_w/tile.t?... 原样转发到  TILE_TARGET + 同路径
// 并加上 Access-Control-Allow-Origin: *，同时把瓦片缓存到 ./.tilecache

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const zlib  = require('zlib');

const TARGET = process.env.TILE_TARGET || 'https://tdtc.shipxy.com';
const PORT   = Number(process.env.TILE_PORT || 8809);
const CACHE_DIR = path.join(__dirname, '.tilecache');
fs.mkdirSync(CACHE_DIR, { recursive: true });

const up = new URL(TARGET);
const agent = up.protocol === 'https:' ? https : http;

function cacheFile(reqUrl) {
  const safe = reqUrl.replace(/^\//, '').replace(/[^\w.=&?-]/g, '_').slice(0, 180);
  return path.join(CACHE_DIR, safe || 'root');
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
  if (req.url === '/favicon.ico') { res.writeHead(404).end(); return; }

  const cf = cacheFile(req.url);
  if (fs.existsSync(cf)) {
    let ct = 'image/png';
    try { ct = fs.readFileSync(cf + '.type', 'utf8') || ct; } catch {}
    res.setHeader('Content-Type', ct);
    res.setHeader('X-Tile-Cache', 'HIT');
    fs.createReadStream(cf).pipe(res);
    return;
  }

  const opts = {
    protocol: up.protocol,
    hostname: up.hostname,
    port: up.port || (up.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
      'Referer': TARGET + '/',
      'Accept': 'image/avif,image/webp,image/png,*/*',
    },
  };

  const upstream = agent.request(opts, r => {
    if (r.statusCode !== 200) {
      res.writeHead(r.statusCode || 502);
      r.pipe(res);
      return;
    }
    const ct = r.headers['content-type'] || 'image/png';
    res.setHeader('Content-Type', ct);
    res.setHeader('X-Tile-Cache', 'MISS');

    const chunks = [];
    let raw = r;
    const enc = (r.headers['content-encoding'] || '').toLowerCase();
    if (enc === 'gzip') raw = r.pipe(zlib.createGunzip());
    else if (enc === 'br') raw = r.pipe(zlib.createBrotliDecompress());
    else if (enc === 'deflate') raw = r.pipe(zlib.createInflate());

    raw.on('data', c => chunks.push(c));
    raw.on('end', () => {
      const buf = Buffer.concat(chunks);
      fs.writeFile(cf, buf, () => {});
      fs.writeFile(cf + '.type', ct, () => {});
      res.end(buf);
    });
    raw.on('error', e => { res.writeHead(502).end(String(e)); });
  });

  upstream.on('error', e => { res.writeHead(502).end(String(e)); });
  upstream.setTimeout(15000, () => upstream.destroy(new Error('upstream timeout')));
  upstream.end();
});

server.listen(PORT, () => {
  console.log(`瓦片代理已启动: http://localhost:${PORT}  ->  ${TARGET}`);
  console.log(`磁盘缓存目录: ${CACHE_DIR}`);
});
