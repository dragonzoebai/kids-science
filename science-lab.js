(() => {
 const activity=ScienceActivities[document.body.dataset.activity];
 const canvas=document.getElementById('scene'),g=canvas.getContext('2d');
 const controls=document.getElementById('controls'),result=document.getElementById('result');
 document.title=activity.title;
 canvas.setAttribute('aria-label',activity.title+'示意图；使用下方或右侧控件操作，结果显示在图下方。');
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
 function render(){
  const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(window.devicePixelRatio||1,3);
  if(!width||!height)return;
  const pixelWidth=Math.round(width*dpr),pixelHeight=Math.round(height*dpr);
  if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}
  g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);
  g.fillStyle='#f8fcfd';g.fillRect(0,0,canvas.width,canvas.height);
  // 人体图两侧无需保留原画布的空白，竖屏时让人物充分放大。
  const contentWidth=580;
  const scale=Math.min(width/contentWidth,height/500);
  g.setTransform(scale*dpr,0,0,scale*dpr,(width/2-400*scale)*dpr,(height/2-250*scale)*dpr);
  const value=activity.evaluate(state);activity.draw(g,state,value,elapsed);
  if(result.textContent!==value.message)result.textContent=value.message;
 }
 function stop(){running=false;document.getElementById('run').textContent='播放';}
 document.getElementById('reset').onclick=()=>{state=Object.fromEntries(activity.controls.map(c=>[c.key,c.value]));elapsed=0;stop();sync();audio.stop();};
 document.getElementById('explain').onclick=()=>audio.say(activity.evaluate(state).message+' '+activity.fact);
 const run=document.getElementById('run');
 {
  run.hidden=false;run.textContent='播放';
  run.onclick=()=>{if(running){stop();return;}elapsed=0;startStage=state.stage||0;running=true;run.textContent='暂停';};
 }
 function tick(now){const dt=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
  if(running){elapsed+=dt;
   {state.stage=Math.min(activity.controls[0].max,startStage+Math.floor(elapsed/2.5));if(elapsed>(activity.controls[0].max-startStage+1)*2.5)stop();}
   sync();
  }frame=requestAnimationFrame(tick);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();cancelAnimationFrame(frame);previous=0;}else{cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);}});
 sync();new ResizeObserver(render).observe(canvas);frame=requestAnimationFrame(tick);
})();
