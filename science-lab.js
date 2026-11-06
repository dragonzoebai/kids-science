(() => {
 const activity=ScienceActivities[document.body.dataset.activity];
 const canvas=document.getElementById('scene'),g=canvas.getContext('2d');
 const controls=document.getElementById('controls'),result=document.getElementById('result');
 document.title=activity.title;document.getElementById('title').textContent=activity.title;
 document.getElementById('question').textContent=activity.question;
 document.getElementById('fact').textContent=activity.fact;
 document.getElementById('note').textContent=activity.note;
 canvas.setAttribute('aria-label',activity.title+'示意图；使用下方或右侧控件操作，结果显示在图下方。');
 if(activity.source){const link=document.createElement('a');link.href=activity.source;link.textContent='知识来源';link.target='_blank';link.rel='noopener';document.getElementById('source').append(link);}
 const audio=window.createLabAudio({intro:activity.question+' '+activity.fact});
 let state={},elapsed=0,running=false,previous=0,frame=0,startStage=0;
 const fields=new Map();
 for(const c of activity.controls){
   const label=document.createElement('label'),title=document.createElement('span');title.textContent=c.label;label.append(title);
   const input=document.createElement(c.options?'select':'input');input.id=c.key;
   if(c.options){for(const value of c.options){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}}
   else{input.type='range';input.min=c.min;input.max=c.max;input.step=c.step;}
   const output=document.createElement('output');output.htmlFor=c.key;label.append(input,output);controls.append(label);
   state[c.key]=c.value;input.value=c.value;fields.set(c.key,{input,output,c});
   const update=()=>{state[c.key]=c.options?input.value:Number(input.value);elapsed=0;stop();sync();};
   input.addEventListener('input',update);
   input.addEventListener('change',()=>{update();audio.say(activity.evaluate(state).message);});
 }
 function sync(){for(const [key,{input,output,c}] of fields){input.value=state[key];output.textContent=c.options?'':Number(state[key].toFixed(c.step<1?1:0))+c.unit;}render();}
 function render(){g.clearRect(0,0,800,500);g.fillStyle='#f8fcfd';g.fillRect(0,0,800,500);const value=activity.evaluate(state);activity.draw(g,state,value,elapsed);if(result.textContent!==value.message)result.textContent=value.message;}
 function stop(){running=false;document.getElementById('run').textContent=activity===ScienceActivities.friction?'释放':'播放';}
 document.getElementById('reset').onclick=()=>{state=Object.fromEntries(activity.controls.map(c=>[c.key,c.value]));elapsed=0;stop();sync();audio.stop();};
 document.getElementById('explain').onclick=()=>audio.say(activity.evaluate(state).message+' '+activity.fact);
 const run=document.getElementById('run');
 const key=document.body.dataset.activity;
 if(['butterfly','digestion','eclipses','friction','weather-lab','water-states'].includes(key)){
  run.hidden=false;run.textContent=key==='friction'?'释放':'播放';
  run.onclick=()=>{if(running){stop();return;}elapsed=0;startStage=state.stage||0;running=true;run.textContent='暂停';};
 }
 function tick(now){const dt=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
  if(running){elapsed+=dt;
   if(['butterfly','digestion'].includes(key)){state.stage=Math.min(activity.controls[0].max,startStage+Math.floor(elapsed/2.5));if(elapsed>(activity.controls[0].max-startStage+1)*2.5)stop();}
   if(key==='eclipses')state.angle=(state.angle+dt*14)%360;
   if(key==='water-states'){state.energy=Math.min(220,state.energy+dt*8);if(state.energy===220)stop();}
   if(key==='friction'&&elapsed>25)stop();sync();
  }frame=requestAnimationFrame(tick);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();cancelAnimationFrame(frame);previous=0;}else{cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}});
 sync();frame=requestAnimationFrame(tick);
})();
