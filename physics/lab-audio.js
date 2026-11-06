// 实验页共用：显式讲解入口、中文操作反馈、轻柔合成音效。
window.createLabAudio = function ({ intro }) {
  let speechEnabled = true, effectsEnabled = true, context;
  const synth = window.speechSynthesis;
  const container = document.getElementById('audio-controls');
  container.innerHTML = '<button type="button" id="audio-intro">▶ 听玩法</button><button type="button" id="audio-speech" aria-pressed="true">讲解：开</button><button type="button" id="audio-effects" aria-pressed="true">音效：开</button><span id="audio-note"></span>';
  const style = document.createElement('style');
  style.textContent = '#audio-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:18px}#audio-controls button{font:inherit;font-size:13px;min-height:44px;padding:10px 14px;border:1px solid #8194a366;border-radius:14px;background:#8194a318;color:inherit;cursor:pointer;touch-action:manipulation}#audio-controls button[aria-pressed="false"]{opacity:.65}#audio-note{font-size:12px;opacity:.7}';
  document.head.appendChild(style);
  function say(text, onend) {
    text = (text || "")
      .replace(/[0-9#*]\uFE0F?\u20E3/gu, " ")
      .replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\uFE0E\uFE0F\u200D\u{E0020}-\u{E007F}]/gu, " ")
      .replace(/\s+/g, " ").trim();
    if (!speechEnabled || !synth || !text) return;
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN'; utterance.rate = .9; utterance.pitch = 1.05;
      if (onend) utterance.onend = onend;
      const voices = synth.getVoices();
      const voice = voices.find(v => /^zh[-_]CN/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang));
      if (voice) utterance.voice = voice;
      utterance.onerror = event => {
        if (!['canceled', 'interrupted'].includes(event.error)) document.getElementById('audio-note').textContent = '语音暂不可用，请阅读页面提示。';
      };
      synth.speak(utterance);
      return utterance;
    } catch { document.getElementById('audio-note').textContent = '语音暂不可用，请阅读页面提示。'; }
  }
  function effect(kind = 'add') {
    if (!effectsEnabled) return;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context ||= new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const tones = kind === 'done' ? [523, 659, 784] : kind === 'reset' ? [440, 330] : kind === 'stir' ? [262, 330, 392] : [660, 880];
      tones.forEach((frequency, index) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        const start = context.currentTime + index * .085;
        oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.045, start + .012);
        gain.gain.exponentialRampToValueAtTime(.001, start + .16);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start); oscillator.stop(start + .18);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { /* 音频不可用不影响实验。 */ }
  }
  document.getElementById('audio-intro').addEventListener('click', () => {
    if (!speechEnabled) { speechEnabled = true; render(); }
    effect(); say(intro);
  });
  function render() {
    const speech = document.getElementById('audio-speech'), effects = document.getElementById('audio-effects');
    speech.textContent = '讲解：' + (speechEnabled ? '开' : '关'); speech.setAttribute('aria-pressed', String(speechEnabled));
    effects.textContent = '音效：' + (effectsEnabled ? '开' : '关'); effects.setAttribute('aria-pressed', String(effectsEnabled));
  }
  document.getElementById('audio-speech').addEventListener('click', () => {
    speechEnabled = !speechEnabled; if (!speechEnabled) synth?.cancel(); render();
    if (speechEnabled) say('语音讲解已打开。');
  });
  document.getElementById('audio-effects').addEventListener('click', () => { effectsEnabled = !effectsEnabled; render(); if (effectsEnabled) effect(); });
  if (!synth) {
    document.getElementById('audio-intro').disabled = true;
    document.getElementById('audio-speech').disabled = true;
    document.getElementById('audio-note').textContent = '此浏览器不支持语音讲解，仍可使用音效。';
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) { synth?.cancel(); context?.suspend().catch(() => {}); } });
  window.addEventListener('pagehide', () => { synth?.cancel(); context?.suspend().catch(() => {}); });
  return { say, effect, stop() { synth?.cancel(); } };
};
