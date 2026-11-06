(() => {
  const face = '<circle cx="83" cy="102" r="4" fill="#62485d"/><circle cx="117" cy="102" r="4" fill="#62485d"/><path d="M88 117 Q100 128 112 117" fill="none" stroke="#62485d" stroke-width="4" stroke-linecap="round"/>';
  const organs = [
    { name:'心脏', title:'扑通扑通，心脏！', secret:'我把血液送到全身。', hint:'把小手放在胸口，感受一下。', action:'让心脏跳一跳', speech:'心脏扑通扑通跳，把血液送到全身。把小手放在胸口，感受一下。', art:`<g class="heart"><path d="M100 160 C-5 95 40 15 100 65 C160 15 205 95 100 160" fill="#f397a4" stroke="#df7a8f" stroke-width="5"/>${face}</g>` },
    { name:'肺', title:'呼——吸——，小肺！', secret:'吸进空气，帮身体得到氧气。', hint:'跟着慢慢吸气，再轻轻呼气。', action:'一起慢慢呼吸', speech:'这是肺。吸气时肺变大，呼气时肺变小。跟着慢慢吸气，再轻轻呼气，不要憋气。', art:'<g class="lungs"><path d="M93 45 V105 M107 45 V105" stroke="#99c8c7" stroke-width="10"/><path d="M82 68 C55 40 20 100 27 145 Q60 170 87 137Z" fill="#aedbd7"/><path d="M118 68 C145 40 180 100 173 145 Q140 170 113 137Z" fill="#aedbd7"/><circle cx="61" cy="113" r="4" fill="#62485d"/><circle cx="139" cy="113" r="4" fill="#62485d"/><path d="M53 128 Q61 136 69 128 M131 128 Q139 136 147 128" fill="none" stroke="#62485d" stroke-width="3"/></g>' },
    { name:'大脑', title:'叮！大脑来帮忙', secret:'想事情、动小手，都有我帮忙。', hint:'试着挥挥手，再摸摸鼻子。', action:'点亮小主意', speech:'大脑在头里面。想事情、动小手，都有大脑帮忙。试着挥挥手，再摸摸鼻子。', art:`<path d="M100 58 C65 25 37 50 42 75 C13 90 28 126 45 128 C45 157 82 167 100 148 C125 170 156 152 156 131 C187 118 180 84 160 76 C162 47 124 30 100 58Z" fill="#c7b1df" stroke="#a88dc5" stroke-width="4"/><path d="M100 60 V92 M61 67 Q91 78 64 91 M145 71 Q119 80 142 91" fill="none" stroke="#a88dc5" stroke-width="4"/>${face}<g class="idea" fill="#f5cb69"><path d="m35 20 4 9 10 2-8 7 2 10-8-5-9 5 2-10-8-7 11-2Z"/><circle cx="166" cy="35" r="13"/><path d="M162 52h8" stroke="#d8ab53" stroke-width="5"/></g>` },
    { name:'胃', title:'咕噜咕噜，小胃！', secret:'我把食物揉一揉，变成食糜。', hint:'营养还要靠小肠来吸收哦。', action:'帮小胃揉一揉', speech:'小胃把吃下去的食物揉一揉，和消化液混合，变成食糜。之后，小肠会吸收营养，帮身体获得能量。', art:`<path d="M104 25 V71 C145 43 174 70 166 111 C157 169 83 177 49 141 C29 118 53 96 76 119 C93 134 111 120 105 105 C89 87 86 69 86 25" fill="#f7c6a0" stroke="#e7a87e" stroke-width="5"/>${face}<g class="food"><circle cx="114" cy="63" r="9" fill="#f1848d"/><rect x="131" y="70" width="13" height="13" rx="4" fill="#99caa5"/><circle cx="91" cy="66" r="6" fill="#f3d978"/></g>` },
    { name:'血细胞', title:'出发！氧气快递员', secret:'红细胞跟着血液，运送氧气。', hint:'这条小环路是旅行示意图。', action:'运送氧气出发', speech:'红细胞是小小的氧气快递员，跟着血液，把氧气送到身体各处。这条小环路是旅行示意图。', art:'<path d="M35 100 C35 20 165 20 165 100 C165 180 35 180 35 100" fill="none" stroke="#f9d7db" stroke-width="24"/><g class="cell"><ellipse rx="17" ry="12" fill="#e997a6"/><ellipse rx="9" ry="5" fill="#d77990"/></g><g class="cell"><ellipse rx="17" ry="12" fill="#e997a6"/><ellipse rx="9" ry="5" fill="#d77990"/></g><g class="cell"><ellipse rx="17" ry="12" fill="#e997a6"/><ellipse rx="9" ry="5" fill="#d77990"/></g>' }
  ];
  const svg = art => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${art.replaceAll('rx="17"','cx="35" cy="100" rx="17"').replaceAll('rx="9"','cx="35" cy="100" rx="9"')}</svg>`;
  const choices = document.getElementById('choices'), demo = document.getElementById('demo'), action = document.getElementById('action');
  let selected = 0;
  const found = new Set();
  function choose(index, speak) {
    selected = index;
    const organ = organs[index];
    if (speak) found.add(index);
    demo.classList.remove('working');
    demo.innerHTML = svg(organ.art);
    document.getElementById('name').textContent = organ.title;
    document.getElementById('secret').textContent = organ.secret;
    document.getElementById('hint').textContent = organ.hint;
    action.textContent = organ.action;
    action.setAttribute('aria-pressed','false');
    [...choices.children].forEach((button,i) => button.setAttribute('aria-pressed',String(i === index)));
    document.getElementById('progress').textContent = `已认识 ${found.size} / 5`;
    if (speak) window.kidSpeak?.(organ.speech);
  }
  organs.forEach((organ,index) => {
    const button = document.createElement('button');
    button.innerHTML = svg(organ.art) + `<span>${organ.name}</span>`;
    button.querySelector('svg').setAttribute('aria-hidden','true');
    button.setAttribute('data-speak-ignore','');
    button.addEventListener('click',() => choose(index,true));
    choices.appendChild(button);
  });
  action.addEventListener('click',() => {
    const active = demo.classList.toggle('working');
    action.setAttribute('aria-pressed',String(active));
    action.textContent = active ? '停一停' : organs[selected].action;
    if (active) window.kidSpeak?.(organs[selected].speech);
    else window.speechSynthesis?.cancel();
  });
  choose(0,false);
})();
