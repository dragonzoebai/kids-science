// 全站朗读：鼠标悬停 / 点击有文字的地方，用浏览器语音读出来（给小朋友看的科普页面用）
// - 悬停 0.4 秒或点击：朗读该元素文字（卡片、按钮、标题等整块读）
// - 地图弹窗 .mapboxgl-popup 和带 data-speak-auto 的元素：内容出现或变化时自动朗读
// - data-speak="..." 指定朗读内容；data-speak-ignore 不朗读
// - 页面左下角 🔊 按钮开关，状态记在 localStorage
// - 其他脚本可调 window.kidSpeak(text) 朗读（关闭时不出声）
(() => {
  if (!("speechSynthesis" in window)) return;

  const STORE_KEY = "kid-speak-enabled";
  const BLOCK_SELECTOR = "button, a, label, li, h1, h2, h3, h4, h5, h6, p, td, th, summary, [class*='card'], [class*='item'], [class*='btn']";
  const HOVER_DELAY = 400;
  const MAX_LEN = 300;

  let enabled = true;
  try {
    enabled = localStorage.getItem(STORE_KEY) !== "0";
  } catch {}

  let voice = null;
  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => /zh[-_]CN/i.test(v.lang)) || voices.find((v) => /^zh/i.test(v.lang)) || null;
  }
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);

  let lastSpeakAt = 0;
  function speak(text) {
    text = clean(text);
    if (!enabled || !text) return;
    lastSpeakAt = performance.now();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.pitch = 1.1;
    speechSynthesis.speak(u);
  }
  window.kidSpeak = speak;

  // 统一覆盖点击、悬停、自动朗读和 kidSpeak；保留数字、单位及数学符号。
  const clean = (s) => (s || "")
    .replace(/[0-9#*]\uFE0F?\u20E3/gu, " ")
    .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0E\uFE0F\u200D\u{E0020}-\u{E007F}]/gu, " ")
    .replace(/\s+/g, " ").trim();
  const ICON_SELECTOR = "svg, img, [aria-hidden='true'], [role='img'], [data-speak-ignore], .icon, .emoji";
  function readableText(el) {
    if (el.matches(ICON_SELECTOR)) return "";
    if (!el.querySelector(ICON_SELECTOR)) return clean(el.innerText);
    return clean([...el.childNodes].map((node) => node.nodeType === 3 ? node.textContent
      : node.nodeType === 1 ? readableText(node) : "").join(" "));
  }

  function ownText(el) {
    return clean([...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join(" "));
  }

  function controlText(el) {
    const label = el.labels?.[0] ? clean(el.labels[0].innerText) : clean(el.getAttribute("aria-label") || el.title);
    if (el.tagName === "SELECT") return `${label} ${clean(el.selectedOptions[0]?.text)}`;
    if (el.type === "range" || el.type === "number") return `${label} ${el.value}`;
    if (el.type === "checkbox" || el.type === "radio") return `${label} ${el.checked ? "已打开" : "已关闭"}`;
    if (el.type === "button" || el.type === "submit") return clean(el.value) || label;
    return label;
  }

  // 找到要朗读的元素和文字
  function findReadable(target) {
    if (!(target instanceof Element)) return null;
    if (target.closest("[data-speak-ignore], canvas, video, .mapboxgl-canvas-container")) return null;

    const custom = target.closest("[data-speak]");
    if (custom) return { el: custom, text: custom.getAttribute("data-speak") };

    if (/^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName)) return { el: target, text: controlText(target) };
    // Icons must not inherit speech from a parent card, button or title.
    // Explicit data-speak above still allows opting an image into speech.
    if (target.closest(ICON_SELECTOR)) return null;
    if (!/[\p{L}\p{N}]/u.test(readableText(target))) return null;

    // 优先整块读：最近的按钮/卡片/标题等
    const block = target.closest(BLOCK_SELECTOR);
    if (block && block !== document.body) {
      const text = readableText(block) || clean(block.getAttribute("aria-label") || block.title);
      if (text && text.length <= MAX_LEN) return { el: block, text };
    }

    // 否则往上找最近有文字的元素（最多 3 层）
    let el = target;
    for (let i = 0; i < 3 && el && el !== document.body; i++, el = el.parentElement) {
      const text = readableText(el);
      if (text) return { el, text: text.length <= MAX_LEN ? text : ownText(el) };
      const attr = clean(el.getAttribute("aria-label") || el.title);
      if (attr) return { el, text: attr };
    }
    return null;
  }

  // 朗读时给元素一个短暂的高亮框，让小朋友知道读的是哪里
  const style = document.createElement("style");
  style.textContent = `
    .ks-reading { outline: 3px solid #ffb300 !important; outline-offset: 2px; border-radius: 6px; }
    #ks-toggle {
      position: fixed; left: 12px; bottom: 40px; z-index: 2147483647;
      width: 44px; height: 44px; border-radius: 50%; border: 2px solid #fff;
      background: #ffb300; color: #fff; font-size: 22px; line-height: 1; cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center;
    }
    #ks-toggle.off { background: #9ca3af; }
  `;
  document.head.appendChild(style);

  let flashEl = null;
  let flashTimer = 0;
  function flash(el) {
    flashEl?.classList.remove("ks-reading");
    clearTimeout(flashTimer);
    flashEl = el;
    el.classList.add("ks-reading");
    flashTimer = setTimeout(() => el.classList.remove("ks-reading"), 1200);
  }

  function read(target) {
    const hit = findReadable(target);
    if (!hit || !clean(hit.text)) return null;
    speak(hit.text);
    if (enabled) flash(hit.el);
    return hit.el;
  }

  // 悬停朗读
  let hoverTimer = 0;
  let lastHoverEl = null;
  document.addEventListener("mouseover", (e) => {
    if (!enabled) return;
    const hit = findReadable(e.target);
    clearTimeout(hoverTimer);
    if (!hit) {
      lastHoverEl = null;
      return;
    }
    if (hit.el === lastHoverEl) return;
    hoverTimer = setTimeout(() => {
      lastHoverEl = hit.el;
      read(e.target);
    }, HOVER_DELAY);
  });
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      clearTimeout(hoverTimer);
      lastHoverEl = null;
    }
  });

  // 在点击事件中同步朗读，兼容 iPad；冒泡时读取控件更新后的文字。
  const clickTimes = new WeakMap();
  document.addEventListener("click", (e) => clickTimes.set(e, performance.now()), true);
  document.addEventListener(
    "click",
    (e) => {
      if (!enabled || e.target.closest("#ks-toggle")) return;
      clearTimeout(hoverTimer);
      const target = e.target;
      const clickAt = clickTimes.get(e) ?? performance.now();
      if (lastSpeakAt >= clickAt) return;
      const el = read(target);
      if (el) lastHoverEl = el;
    },
    false
  );
  document.addEventListener("change", (e) => {
    if (enabled && /^(INPUT|SELECT)$/.test(e.target.tagName)) read(e.target);
  });

  // 弹窗 / 信息卡片内容变化时自动朗读
  const AUTO_SELECTOR = ".mapboxgl-popup-content, [data-speak-auto]";
  const lastAuto = new WeakMap();
  let autoTimer = 0;
  function isShown(el) {
    return el.isConnected && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  }
  function checkAuto() {
    document.querySelectorAll(AUTO_SELECTOR).forEach((el) => {
      const text = isShown(el) && !el.closest("[data-speak-ignore]") ? readableText(el) : "";
      if (text === (lastAuto.get(el) || "")) return;
      lastAuto.set(el, text);
      if (text) speak(text);
    });
  }
  // 节流而不是防抖：有逐帧动画不停改样式时也能按时检查
  new MutationObserver(() => {
    if (autoTimer) return;
    autoTimer = setTimeout(() => {
      autoTimer = 0;
      checkAuto();
    }, 250);
  }).observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "style", "hidden"],
  });

  // 开关按钮
  function mountToggle() {
    const btn = document.createElement("button");
    btn.id = "ks-toggle";
    btn.setAttribute("data-speak-ignore", "");
    const render = () => {
      btn.textContent = enabled ? "🔊" : "🔇";
      btn.title = enabled ? "朗读已打开，点击关闭" : "朗读已关闭，点击打开";
      btn.classList.toggle("off", !enabled);
    };
    btn.addEventListener("click", () => {
      enabled = !enabled;
      try {
        localStorage.setItem(STORE_KEY, enabled ? "1" : "0");
      } catch {}
      if (enabled) speak("朗读已打开");
      else speechSynthesis.cancel();
      render();
    });
    render();
    document.body.appendChild(btn);
  }
  if (document.body) mountToggle();
  else document.addEventListener("DOMContentLoaded", mountToggle);
})();
