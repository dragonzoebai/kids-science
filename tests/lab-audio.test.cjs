const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('lab narration starts on demand, can be muted, resumes and cancels on leaving', () => {
  const elements = new Map(), spoken = [], documentHandlers = {}, windowHandlers = {};
  let cancelled = 0;
  function element(id) {
    if (!elements.has(id)) elements.set(id, { handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, setAttribute(key, value) { this[key] = value; } });
    return elements.get(id);
  }
  const window = { speechSynthesis: { cancel() { cancelled++; }, speak(u) { spoken.push(u); }, getVoices: () => [{ lang: 'zh-CN' }] }, addEventListener(type, fn) { windowHandlers[type] = fn; } };
  const document = { hidden: false, getElementById: element, createElement: () => ({}), head: { appendChild() {} }, addEventListener(type, fn) { documentHandlers[type] = fn; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../physics/lab-audio.js'), 'utf8'), { window, document, SpeechSynthesisUtterance: function(text) { this.text = text; } });
  const audio = window.createLabAudio({ intro: '三原色实验' });
  assert.equal(spoken.length, 0, 'no autoplay');
  element('audio-intro').handlers.click();
  assert.equal(spoken.at(-1).text, '三原色实验');
  assert.equal(spoken.at(-1).lang, 'zh-CN');
  element('audio-speech').handlers.click();
  const count = spoken.length;
  audio.say('静音时不朗读');
  assert.equal(spoken.length, count);
  assert.equal(element('audio-speech')['aria-pressed'], 'false');
  element('audio-intro').handlers.click();
  assert.equal(spoken.length, count + 1);
  assert.equal(element('audio-speech')['aria-pressed'], 'true');
  spoken.at(-1).onerror({ error: 'not-allowed' });
  assert.match(element('audio-note').textContent, /语音暂不可用/);
  const before = cancelled;
  document.hidden = true; documentHandlers.visibilitychange(); windowHandlers.pagehide();
  assert.equal(cancelled, before + 2);
});
