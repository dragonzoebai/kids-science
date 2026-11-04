// 拖动或双指缩放后，阻止合成 click 误触选择。
(() => {
  const pointers = new Map();
  let blocked = false;
  let endedAt = -Infinity;
  document.addEventListener("pointerdown", event => {
    if (!(event.target instanceof HTMLCanvasElement)) return;
    if (!pointers.size) blocked = false;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size > 1) blocked = true;
  }, true);
  document.addEventListener("pointermove", event => {
    const start = pointers.get(event.pointerId);
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) blocked = true;
  }, true);
  for (const type of ["pointerup", "pointercancel"]) document.addEventListener(type, event => {
    if (!pointers.has(event.pointerId)) return;
    if (type === "pointercancel") blocked = true;
    pointers.delete(event.pointerId);
    endedAt = performance.now();
  }, true);
  document.addEventListener("click", event => {
    if (event.target instanceof HTMLCanvasElement && blocked && performance.now() - endedAt < 700) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
})();
