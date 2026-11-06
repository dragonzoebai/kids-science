import * as THREE from '../vendor/three-0.160.0/build/three.module.js';

// 高清请求限制并发，让小图和页面资源优先下载。
const queue = [];
let active = 0;
const failedDownloads = new Set();
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
      img.onload = () => resolve(img); img.onerror = reject; img.src = url;
    });
  }
  let pending = false;
  function requestFullImage() {
    if (pending) return;
    pending = true;
    failedDownloads.delete(requestFullImage);
    queue.push(() => image(path).then(loaded => {
      pending = false;
      install(loaded);
    }, () => {
      pending = false;
      failedDownloads.add(requestFullImage);
    }));
    drain();
  }
  image(previewPath(path)).then(install, () => {}).finally(() => {
    // 小图失败也继续尝试原图；大图失败则保留已经显示的内容。
    setTimeout(requestFullImage, 0);
  });
  return texture;
}
