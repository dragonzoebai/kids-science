(() => {
  const size = 44;
  const gap = 6;
  const rects = [];
  const panels = [...document.querySelectorAll('[data-fold-panel]')];
  let frame = 0;

  function schedule() {
    if (!frame) frame = requestAnimationFrame(layout);
  }

  function layout() {
    frame = 0;
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    rects.length = 0;
    for (const el of document.querySelectorAll('#ks-toggle, .kid-map-options')) {
      const rect = el.getBoundingClientRect();
      if (rect.width) rects.push(rect);
    }

    for (const { panel, button, label, left } of entries) {
      const style = getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      const rendered = style.display !== 'none' && style.visibility !== 'hidden' && rect.width && rect.height;
      const responsive = !rendered && panel.hasAttribute('data-fold-display') && !panel.hidden;
      button.hidden = !rendered && !responsive;
      if (button.hidden) continue;

      const closed = panel.classList.contains('fold-closed') || responsive;
      button.setAttribute('aria-expanded', String(!closed));
      button.setAttribute('aria-label', (closed ? '展开' : '收起') + label);
      const arrow = (left !== closed) ? '‹' : '›';
      if (button.textContent !== arrow) button.textContent = arrow;

      const offset = parseFloat(style.translate) || 0;
      const x = closed ? (left ? 8 : width - size - 8)
        : (left ? rect.right - offset + gap : rect.left - offset - size - gap);
      const y = rendered ? rect.top : 64;
      const clamp = (value, max) => Math.max(0, Math.min(max, value));
      const hasSideRoom = x >= 0 && x <= width - size;
      const aligned = left ? rect.left - offset : rect.right - offset - size;
      const edge = clamp(closed || hasSideRoom ? x : aligned, width - size);
      const top = clamp(y, height - size);
      const points = [];
      if (closed || hasSideRoom) points.push([edge, top]);
      if (!closed && !hasSideRoom) {
        if (rect.top >= size + gap) points.push([edge, rect.top - size - gap]);
        if (rect.bottom + gap + size <= height) points.push([edge, rect.bottom + gap]);
        points.push([edge, top]);
      }
      for (let step = 1; step <= Math.ceil(height / (size + gap)); step++) {
        points.push([edge, clamp(top + step * (size + gap), height - size)]);
        points.push([edge, clamp(top - step * (size + gap), height - size)]);
      }
      const [px, py] = points.find(([px, py]) => rects.every(r =>
        px + size + gap <= r.left || px >= r.right + gap ||
        py + size + gap <= r.top || py >= r.bottom + gap)) || points[0];
      rects.push({ left: px, top: py, right: px + size, bottom: py + size });
      button.style.setProperty('--fold-x', px + 'px');
      button.style.setProperty('--fold-y', py + 'px');
    }
  }

  function setClosed(panel, closed) {
    panel.classList.toggle('fold-closed', closed);
    panel.inert = closed;
    schedule();
  }

  const entries = panels.map((panel, index) => {
    const left = panel.dataset.foldPanel === 'left';
    const label = panel.dataset.foldLabel;
    if (!panel.id) panel.id = 'fold-panel-' + (index + 1);
    panel.style.setProperty('--fold-offset', left ? '-110vw' : '110vw');
    if (panel.dataset.foldDisplay) panel.style.setProperty('--fold-display', panel.dataset.foldDisplay);
    panel.classList.add('fold-slide');
    panel.addEventListener('transitionend', schedule);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fold-toggle';
    button.hidden = true;
    button.dataset.speakIgnore = '';
    button.setAttribute('aria-controls', panel.id);
    button.addEventListener('click', () => {
      const hiddenByLayout = getComputedStyle(panel).display === 'none';
      if (hiddenByLayout) panel.classList.add('fold-responsive');
      setClosed(panel, !hiddenByLayout && !panel.inert);
    });
    document.body.append(button);
    return { panel, button, label, left };
  });

  const resize = new ResizeObserver(schedule);
  const changes = new MutationObserver(schedule);
  for (const panel of panels) {
    resize.observe(panel);
    changes.observe(panel, { attributes: true, attributeFilter: ['hidden', 'style', 'class'] });
  }
  window.addEventListener('resize', () => {
    for (const panel of panels) {
      if (!panel.classList.contains('fold-responsive')) continue;
      panel.classList.remove('fold-responsive');
      if (!panel.inert && getComputedStyle(panel).display === 'none') panel.classList.add('fold-responsive');
    }
    schedule();
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('load', schedule);
  schedule();
})();
