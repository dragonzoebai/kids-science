(() => {
  const $ = (id) => document.getElementById(id);
  let limit = 5;
  let input = "";
  function makePool() {
  const pool = [];
  for (let a = 0; a <= limit; a++) {
    for (let b = 0; b <= limit; b++) {
      if (a + b <= limit) pool.push({ a, b, op: '+', result: a + b });
      if (a >= b) pool.push({ a, b, op: '−', result: a - b });
    }
  }
  return pool;
  }
  let mode = 'mixed';
  let question;
  let solved = false;
  const say = (text) => window.kidSpeak?.(text);
  const spokenQuestion = () => `${question.a}${question.op === '+' ? '加' : '减'}${question.b}等于几？`;
  function basket(count, removed = 0) {
    const group = document.createElement('div');
    group.className = 'basket';
    if (!count) { group.innerHTML = '<span class="empty">0</span>'; return group; }
    for (let i = 0; i < count; i++) {
      const apple = document.createElement('span');
      apple.className = `apple${i >= count - removed ? ' gone' : ''}`;
      apple.textContent = '🍎';
      group.append(apple);
    }
    return group;
  }
  function next(read = true) {
    const choices = makePool().filter((q) => (mode === 'mixed' || q.op === (mode === 'add' ? '+' : '−')) && (!question || q.a !== question.a || q.b !== question.b || q.op !== question.op));
    question = choices[Math.floor(Math.random() * choices.length)];
    solved = false;
    input = "";
    $("check").disabled = false;
    $("erase").disabled = false;
    $('left').textContent = question.a;
    $('right').textContent = question.b;
    $('operator').textContent = question.op;
    $('answer').textContent = '?';
    document.querySelector('.play').classList.remove('correct', 'retry');
    $('feedback').textContent = '点数字，再点“确定”';
    $('next').textContent = '换一题 ↻';
    document.querySelectorAll('[data-number]').forEach((key) => { key.disabled = false; });
    $('prompt').textContent = question.op === '+' ? '一共有几个苹果？' : '拿走划掉的，还剩几个？';
    $('apples').replaceChildren(basket(question.a, question.op === '−' ? question.b : 0));
    if (question.op === '+') {
      const plus = document.createElement('span'); plus.className = 'symbol'; plus.textContent = '+';
      $('apples').append(plus, basket(question.b));
    }
    $('apples').setAttribute('aria-label', question.op === '+' ? `${question.a}个苹果，再加${question.b}个苹果` : `${question.a}个苹果，拿走${question.b}个，划掉的苹果不再计数`);
    if (read) say(spokenQuestion());
  }
  function answer() {
    if (solved || input === "") return;
    const number = Number(input);
    $('answer').textContent = number;
    solved = number === question.result;
    document.querySelector('.play').classList.toggle('correct', solved);
    document.querySelector('.play').classList.toggle('retry', !solved);
    const message = solved ? '答对啦！真棒！⭐' : '再数一数，试试看 🌱';
    $('feedback').textContent = message;
    say(solved ? `答对啦！${question.a}${question.op === '+' ? '加' : '减'}${question.b}等于${number}。真棒！` : '再数一数，试试看。');
    if (solved) {
      $('next').textContent = '下一题 →';
      $('check').disabled = true;
      $('erase').disabled = true;
      document.querySelectorAll('[data-number]').forEach((key) => { key.disabled = true; });
    }
  }
  function enter(digit) {
    if (solved) return;
    if (input.length >= 2) input = '';
    input = input === '0' ? String(digit) : input + digit;
    $('answer').textContent = input;
    document.querySelector('.play').classList.remove('retry');
    $('feedback').textContent = '点“确定”，看看答对了吗';
  }
  function erase() {
    if (solved) return;
    input = input.slice(0, -1);
    $('answer').textContent = input || '?';
    document.querySelector('.play').classList.remove('retry');
    $('feedback').textContent = '点数字，再点“确定”';
  }
  $('check').addEventListener('click', answer);
  $('erase').addEventListener('click', erase);
  document.querySelectorAll('[data-limit]').forEach((button) => button.addEventListener('click', () => {
    limit = Number(button.dataset.limit);
    document.querySelectorAll('[data-limit]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    $('range-label').textContent = `玩一玩 · ${limit} 以内`;
    next();
  }));
  $('keys').addEventListener('click', (event) => {
    const key = event.target.closest('[data-number]');
    if (key) enter(Number(key.dataset.number));
  });
  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    next();
  }));
  $('next').addEventListener('click', () => next());
  $('read').addEventListener('click', () => say(spokenQuestion()));
  document.addEventListener('keydown', (event) => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (event.target.closest?.('button, a')) return;
    if (event.key === 'Enter') { event.preventDefault(); answer(); }
    if (event.key === 'Backspace') { event.preventDefault(); erase(); }
    if (/^[0-9]$/.test(event.key)) enter(Number(event.key));
  });
  next(false);
})();
