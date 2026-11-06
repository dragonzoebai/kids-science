(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const branches = {
    meadow:{plant:'grass',eater:'rabbit',hunter:'fox',names:['青草','兔子','狐狸']},
    tree:{plant:'leaf',eater:'bug',hunter:'bird',names:['树叶','毛毛虫','小鸟']},
  };
  const names = {sun:'太阳',grass:'青草',leaf:'树叶',rabbit:'兔子',fox:'狐狸',bug:'毛毛虫',bird:'小鸟'};
  const state = {mode:'feed',branch:'meadow',step:0,solved:false,busy:false};
  const creatures = $('creatures'), connections = $('connections'), habitat = $('habitat');
  const parcel = $('parcel');
  let flight = null;
  const art = key => `<svg viewBox="0 0 200 180" aria-hidden="true"><use href="#art-${key}"/></svg>`;
  function say(text) { window.kidSpeak?.(text); }
  function message(title,text,speak=false) {
    $('instruction').textContent=title; $('explanation').textContent=text;
    if(speak) say(`${title}。${text}`);
  }
  function chain() { const b=branches[state.branch]; return ['sun',b.plant,b.eater,b.hunter]; }
  function button(key) { return creatures.querySelector(`[data-key="${key}"]`); }
  function setMood(key,text) { button(key).querySelector('.mood').textContent=text; }
  function cancelFlight() {
    if(flight) { flight.cancel(); flight=null; }
    parcel.style.display='none';state.busy=false;
  }
  function positions() {
    const portrait=habitat.clientHeight>habitat.clientWidth*.8;
    return portrait? [{x:24,y:16},{x:25,y:68},{x:70,y:68},{x:74,y:17}] : [{x:14,y:21},{x:25,y:72},{x:61,y:72},{x:86,y:27}];
  }
  function drawPaths() {
    const keys=chain(), pos=positions(), w=habitat.clientWidth,h=habitat.clientHeight;
    keys.forEach((key,i)=>Object.assign(button(key).style,{left:`${pos[i].x}%`,top:`${pos[i].y}%`}));
    connections.replaceChildren();
    keys.slice(0,-1).forEach((key,i)=> {
      const a=pos[i],b=pos[i+1];
      const dx=(b.x-a.x)*w/100,dy=(b.y-a.y)*h/100,len=Math.hypot(dx,dy)||1;
      const inset=Math.min(75,len*.28);
      const line=document.createElementNS('http://www.w3.org/2000/svg','path');
      const lit=state.mode==='energy'&&state.step>i;
      line.setAttribute('d',`M ${a.x*w/100+dx/len*inset} ${a.y*h/100+dy/len*inset} L ${b.x*w/100-dx/len*inset} ${b.y*h/100-dy/len*inset}`);
      line.setAttribute('class',`connection${lit?' lit':''}`);
      connections.appendChild(line);
    });
  }
  function renderScene() {
    creatures.replaceChildren();
    chain().forEach(key=>{
      const el=document.createElement('button');el.className='creature';el.dataset.key=key;
      el.setAttribute('aria-label',names[key]);el.setAttribute('data-speak-ignore','');
      el.innerHTML=art(key)+`<span class="label">${names[key]}</span><span class="mood"></span>`;
      el.addEventListener('click',()=>tap(key));creatures.appendChild(el);
    });
    drawPaths();
  }
  function showTask(source,target) { $('task').innerHTML=(source?art(source):'<span>？</span>')+'<span>→</span>'+art(target); }
  function render(speak=false) {
    const b=branches[state.branch],keys=chain();
    document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===state.mode)));
    document.querySelectorAll('[data-branch]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.branch===state.branch)));
    renderScene();$('next').disabled=false;
    if(state.mode==='feed') {
      const target=state.step===0?b.eater:b.hunter;
      button(target).classList.add('target');setMood(target,state.solved?'吃饱啦':'肚子饿了');
      const food=state.step===0?b.plant:b.eater;
      showTask(state.solved?food:null,target);
      message(state.solved?'找对了，开饭啦！':`${names[target]}饿了，吃什么呢？`,state.solved?`${names[target]}吃${names[food]}，从食物中得到能量。`:'点森林里的食物，送给它吃。',speak);
      $('feedback').textContent=state.solved?'箭头从食物，指向吃它的动物。':'试着点一点，选错了也没关系。';
      $('next').textContent=state.solved?(state.step===0?'再帮一位朋友':'换条食物链'):'听听任务';
    } else if(state.mode==='energy') {
      keys.slice(0,state.step+1).forEach(key=>button(key).classList.add('glowing'));
      const texts=[['能量从哪里来？','先点一束阳光，帮助植物生长。'],['植物长大了！','植物利用阳光、水和空气，制造自己的食物。'],[`${names[b.eater]}有力气了！`,`${names[b.eater]}吃${names[b.plant]}，得到食物里的能量。`],[`${names[b.hunter]}也得到了能量！`,`${names[b.hunter]}吃${names[b.eater]}，能量继续向前传。`]];
      message(...texts[state.step],speak);
      showTask(state.step?keys[state.step-1]:'sun',keys[Math.max(1,state.step)]);
      $('feedback').textContent=state.step===3?'阳光帮助植物；植物和动物连成食物链。':'点发光的朋友，送出下一棒。';
      $('next').textContent=state.step===3?'再走一遍':'送出下一棒';
    } else {
      const texts=[['如果这片植物不见了？','点植物，看看这条食物链会怎样。'],['植物不见了……',`${names[b.eater]}少了一种食物。`],[`${names[b.eater]}在找食物……`,`${names[b.hunter]}能找到的${names[b.eater]}也可能变少。`],['把植物种回来！','保护植物，也在帮助依靠它们的动物。']];
      message(...texts[state.step],speak);
      if(state.step>0){
        const plant=button(b.plant);
        plant.classList.add('gone');
        plant.querySelector('svg').innerHTML='<ellipse cx="100" cy="149" rx="73" ry="16" fill="#ae9272"/><path d="M55 145l13-9 M96 150l11-12 M131 148l12-7" stroke="#826d52" stroke-width="4" stroke-linecap="round"/>';
        plant.querySelector('.label').textContent='空空的地面';
        button(b.eater).classList.add('hungry');setMood(b.eater,'找食物');
      }
      if(state.step>1){button(b.hunter).classList.add('hungry');setMood(b.hunter,'也在找食物');}
      showTask(b.plant,b.eater);
      $('feedback').textContent=state.step===0?'这是一个“如果……”的小实验。':'这是逐步发生的示意，不会马上发生。';
      $('next').textContent=['移走这片植物','再过一段时间','我们能做什么？','把植物种回来'][state.step];
    }
    drawPaths();
  }
  function move(source,target,energy,onDone) {
    if(state.busy)return;
    state.busy=true;
    const a=button(source).getBoundingClientRect(),b=button(target).getBoundingClientRect(),r=habitat.getBoundingClientRect();
    parcel.className=energy?'energy':'';parcel.innerHTML=energy?'':art(source);
    parcel.style.display='block';
    const size=energy?24:70;
    const start={x:a.x+a.width/2-r.x-size/2,y:a.y+a.height*.4-r.y-size/2};
    const end={x:b.x+b.width/2-r.x-size/2,y:b.y+b.height*.4-r.y-size/2};
    Object.assign(parcel.style,{left:`${start.x}px`,top:`${start.y}px`});
    $('next').disabled=true;
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1100;
    flight=parcel.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${end.x-start.x}px,${end.y-start.y}px) scale(.65)`}],{duration,easing:'ease-in-out',fill:'forwards'});
    flight.onfinish=()=>{cancelFlight();onDone();button(target).classList.add('happy');};
  }
  function advance() {
    if(state.busy)return;
    if(state.mode==='feed') {
      if(!state.solved){say($('instruction').textContent+'。'+$('explanation').textContent);return;}
      if(state.step===0){state.step=1;state.solved=false;}else{state.branch=state.branch==='meadow'?'tree':'meadow';state.step=0;state.solved=false;}
      render(true);
    } else if(state.mode==='energy') {
      if(state.step===3){state.step=0;render(true);return;}
      const keys=chain();move(keys[state.step],keys[state.step+1],true,()=>{state.step++;render(true);});
    } else {
      if(state.step===3){state.step=0;render();const b=branches[state.branch];chain().forEach(key=>button(key).classList.add('happy'));message('植物回来了！','植物长大需要时间，食物也会慢慢多起来。',true);$('feedback').textContent='一起保护植物，给动物留住家。';}
      else{state.step++;render(true);}
    }
  }
  function tap(key) {
    if(state.busy)return;
    const b=branches[state.branch];
    if(state.mode==='feed'){
      if(state.solved){say('找对啦！再帮一位朋友吧。');return;}
      const food=state.step===0?b.plant:b.eater,target=state.step===0?b.eater:b.hunter;
      if(key===target){say(`${names[target]}饿了，请帮它找食物。`);return;}
      if(key!==food){button(key).classList.remove('wrong');void button(key).offsetWidth;button(key).classList.add('wrong');$('feedback').textContent=key==='sun'?'阳光帮助植物生长，动物要吃食物。':`再试试，${names[target]}这次想吃别的。`;say($('feedback').textContent);return;}
      move(food,target,false,()=>{state.solved=true;render(true);});
    }else if(state.mode==='energy'){
      if(key===chain()[state.step])advance();else say('点发光的朋友，或者按送出下一棒。');
    }else if(key===b.plant){advance();}else{say(state.step?`${names[key]}在找食物。植物少了，也会影响依靠它们的动物。`:`这是${names[key]}。点植物，开始小实验。`);}
  }
  function restart(speak) {cancelFlight();window.speechSynthesis?.cancel();state.step=0;state.solved=false;render(speak);}
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{state.mode=el.dataset.mode;restart(true);}));
  document.querySelectorAll('[data-branch]').forEach(el=>el.addEventListener('click',()=>{state.branch=el.dataset.branch;restart(true);}));
  $('next').addEventListener('click',advance);$('reset').addEventListener('click',()=>restart(true));
  new ResizeObserver(()=>{if(state.busy){cancelFlight();render();}else drawPaths();}).observe(habitat);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelFlight();window.speechSynthesis?.cancel();render();}});
  render();
})();
