import * as THREE from '../vendor/three-0.160.0/build/three.module.js';

// 高清请求限制并发，让小图和页面资源优先下载。
const queue = [];
let active = 0;
const failedDownloads = new Set();
let retryNotice;
function updateRetryNotice() {
  if (!retryNotice && failedDownloads.size) {
    retryNotice = document.createElement('button');
    retryNotice.type = 'button'; retryNotice.textContent = '图片没加载好，点此重试';
    retryNotice.setAttribute('data-speak-ignore', '');
    retryNotice.style.cssText = 'position:fixed;z-index:10000;top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:calc(100vw - 24px);min-height:44px;padding:10px 16px;border:1px solid #edbd70;border-radius:14px;background:#fff9e9;color:#392d17;font:16px system-ui;cursor:pointer;touch-action:manipulation';
    retryNotice.onclick = () => { for (const retry of [...failedDownloads]) retry(); };
    document.body.append(retryNotice);
  }
  if (retryNotice) retryNotice.hidden = !failedDownloads.size;
}
window.addEventListener('online', () => {
  for (const retry of [...failedDownloads]) retry();
});
function drain() {
  while (active < 2 && queue.length) {
    active++;
    queue.shift()().finally(() => { active--; drain(); });
  }
}

export function previewPath(path) {
  return path.replace(/textures\/(2k_[^/]+)\.(?:webp|jpg)$/, 'textures/preview/$1.webp');
}

export function loadProgressiveTexture(path, fallback = '#2255aa', onLoad) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2;
  const context = canvas.getContext('2d');
  context.fillStyle = fallback; context.fillRect(0, 0, 2, 2);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  function install(image) {
    // 分辨率变化时重新分配 GPU 纹理，材质仍持有同一个 Texture。
    texture.dispose();
    texture.image = image;
    texture.needsUpdate = true;
    onLoad?.(texture);
  }
  function image(url) {
    return new Promise((resolve, reject) => {
      const img = new Image(); img.decoding = 'async';
      const cleanup = () => { clearTimeout(timeout); img.onload = img.onerror = null; };
      const timeout = setTimeout(() => {
        cleanup(); img.removeAttribute?.('src'); reject(new Error('Texture timeout'));
      }, 15000);
      img.onload = () => { cleanup(); resolve(img); };
      img.onerror = () => { cleanup(); reject(new Error('Texture unavailable')); };
      img.src = url;
    });
  }
  let pending = false;
  function requestFullImage() {
    if (pending) return;
    pending = true;
    failedDownloads.delete(requestFullImage);
    updateRetryNotice();
    queue.push(() => image(path).then(loaded => {
      pending = false;
      install(loaded);
    }, () => {
      pending = false;
      failedDownloads.add(requestFullImage);
      updateRetryNotice();
    }));
    drain();
  }
  image(previewPath(path)).then(install, () => {}).finally(() => {
    // 小图失败也继续尝试原图；大图失败则保留已经显示的内容。
    setTimeout(requestFullImage, 0);
  });
  return texture;
}
