(() => {
  'use strict';
  const M=window.PlantModel,$=id=>document.getElementById(id);
  let mode='grow',plant=M.create(),factor='water',test=M.trial('water'),guess=null,hydrating=false;
  const stageNames=['种子','长根','出土','长叶','开花'];
  function say(text){window.kidSpeak?.(text);}
  function message(title,text,speak=false){$('title').textContent=title;$('description').textContent=text;if(speak)say(title+'。'+text);}
  function leaf(x,y,left,size=1){return `<g transform="translate(${x} ${y}) scale(${left?-size:size} ${size})"><path class="leaf" d="M0 0Q20-48 66-34Q62 9 0 0"/><path d="M5-3L52-28" stroke="#b6d593" stroke-width="3"/></g>`;}
  function picture(p){
    const g=p.stage,top=g===2?278:g===3?200:130;
    let art='';
    if(g>=0&&g<=2)art+='<g><ellipse cx="180" cy="391" rx="21" ry="12" transform="rotate(-30 180 391)" fill="#69523b" stroke="#493d30" stroke-width="2"/><path d="M170 395l19-12 M176 400l19-12" stroke="#b5a688" stroke-width="3"/></g>';
    if(g>=1){
      const length=g===1?50:g===2?95:125;
      art+=`<g class="part roots" role="button" tabindex="0" aria-label="看看地下的根" data-part="roots"><rect x="90" y="398" width="180" height="${length+8}" fill="transparent"/><path class="root-line" d="M180 398Q165 422 180 ${398+length} M178 419l-32 22 M177 435l34 25 ${g>=2?'M177 454l-39 28 M179 472l28 27':''}"/><path class="waterflow" d="M180 ${398+length}Q165 430 180 398L180 ${Math.max(280,top)}"/><text x="230" y="467" class="tap-label">根</text></g>`;
    }
    if(g>=2){
      art+=`<g class="new-growth ${p.pale?'pale':''} ${p.moisture===0?'dry':''}"><path class="stalk" d="M180 398Q176 330 180 ${top}"/>`;
      art+=leaf(180,g===2?310:298,true,g===2?.65:1)+leaf(180,g===2?304:285,false,g===2?.65:1);
      if(g>=3)art+=leaf(180,245,true,.82)+leaf(180,226,false,.9);
      if(g>=4){art+=leaf(180,185,true,.65);art+='<g transform="translate(180 126)">';for(let i=0;i<12;i++)art+=`<ellipse transform="rotate(${i*30})" cx="0" cy="-30" rx="12" ry="27" fill="#f4ce69" stroke="#e2b550" stroke-width="2"/>`;art+='<circle r="29" fill="#9b714c" stroke="#785e41" stroke-width="3"/><circle cx="-9" cy="-4" r="3" fill="#fff2bd"/><circle cx="9" cy="-4" r="3" fill="#fff2bd"/><path d="M-9 8Q0 17 9 8" stroke="#fff2bd" stroke-width="3" fill="none"/></g>';}
      art+=`<g class="part leaves" role="button" tabindex="0" aria-label="看看叶子" data-part="leaves"><rect x="83" y="${top-10}" width="194" height="${360-top}" fill="transparent"/><text x="252" y="269" font-size="18" fill="#447554">叶</text></g></g>`;
    }
    return `<svg viewBox="0 0 360 560" xmlns="http://www.w3.org/2000/svg" aria-label="${g<0?'还没播种':stageNames[g]}，${['土壤干燥','土壤湿润','土壤积水'][p.moisture]}">
      ${p.light?'<g stroke="#edc468" stroke-width="5" stroke-linecap="round"><path d="M65 30v12 M65 98v12 M25 70h12 M94 70h12 M36 40l9 9 M89 94l9 9 M35 100l10-10 M89 47l9-9"/><circle cx="65" cy="70" r="23" fill="#ffe59b"/></g>':'<g><path class="shade" d="M18 50Q10 25 40 23Q62-6 87 22Q125 15 122 48Z"/><text x="20" y="78" fill="#6b7e83" font-size="15">遮光中</text></g>'}
      <path d="M48 364L75 526Q180 554 285 526L312 364Z" fill="${['#b5906b','#91704e','#71654e'][p.moisture]}" stroke="#ad7953" stroke-width="7"/>
      <ellipse cx="180" cy="363" rx="132" ry="23" fill="${['#c3a07a','#a28259','#82734f'][p.moisture]}" stroke="#c29168" stroke-width="7"/>
      <g fill="#e8d2a766"><ellipse cx="95" cy="404" rx="4" ry="3"/><ellipse cx="255" cy="420" rx="5" ry="3"/><ellipse cx="116" cy="494" rx="5" ry="3"/><ellipse cx="250" cy="505" rx="4" ry="3"/></g>
      ${p.moisture===2?'<ellipse cx="180" cy="358" rx="118" ry="15" fill="#8ac7d6" opacity=".85"/><path d="M89 358q20-8 40 0t40 0t40 0t40 0" fill="none" stroke="#d8f3ef" stroke-width="3"/>':''}
      <g class="part soil" role="button" tabindex="0" aria-label="点土壤播种或查看干湿" data-part="soil"><rect x="55" y="347" width="250" height="48" fill="transparent"/></g>
      ${art}
      <text x="180" y="550" text-anchor="middle" class="ground-name">土壤切面 · 看见地下</text>
      <g class="rain" fill="#73bddb"><ellipse cx="128" cy="305" rx="4" ry="10"/><ellipse cx="173" cy="313" rx="4" ry="10"/><ellipse cx="211" cy="302" rx="4" ry="10"/><ellipse cx="242" cy="316" rx="4" ry="10"/></g>
    </svg>`;
  }
  function renderGarden(){
    $('garden').replaceChildren();
    const plants=mode==='grow'?[plant]:test.plants;
    plants.forEach((p,index)=>{
      const div=document.createElement('div');div.className='pot'+(hydrating&&mode==='grow'?' hydrating':'');div.dataset.stage=p.stage;div.dataset.moisture=p.moisture;div.dataset.light=p.light;
      const label=mode==='grow'?(p.stage<0?'点土壤，种一颗向日葵':stageNames[p.stage]):(index===0?'左边的小苗':'右边的小苗');
      div.innerHTML=`<p class="pot-name">${label}</p>${picture(p)}<div class="conditions"><span>${['干干的','湿润','有积水'][p.moisture]}</span><span>${p.light?'有阳光':'遮住光'}</span></div>`;
      if(mode==='compare'){
        div.querySelectorAll('[role="button"]').forEach(el=>{el.removeAttribute('role');el.removeAttribute('tabindex');el.removeAttribute('aria-label');});
        const choose=document.createElement('button');choose.className='choose-plant'+(guess===index?' selected':'');choose.setAttribute('aria-label',`我猜${index===0?'左':'右'}边长得好`);choose.setAttribute('data-speak-ignore','');choose.setAttribute('aria-pressed',String(guess===index));choose.addEventListener('click',()=>{if(test.round>0){say('实验已经开始，先看结果，再重新猜一次。');return;}guess=index;render();say('猜好了，我们过一段时间看看。');});div.appendChild(choose);
        if(guess===index){const badge=document.createElement('span');badge.className='prediction';badge.textContent='我猜这盆';div.appendChild(badge);}
      }else{
        div.querySelectorAll('[data-part]').forEach(el=>{
          function inspect(){const part=el.dataset.part;if(part==='soil'&&plant.stage<0){sow();return;}const texts={soil:['摸摸土壤',['土壤干干的，可以浇一点水。','土壤湿润，先不用再浇水。','有积水了，先排水，让根周围留出空气。'][plant.moisture]],roots:['根藏在土里','根吸收水和矿物质，帮助植物站稳。'],leaves:['叶子像小工厂','有了光、水和空气里的二氧化碳，叶子能制造食物。']};message(...texts[part],true);}
          el.addEventListener('click',inspect);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect();}});
        });
      }
      $('garden').appendChild(div);
    });
  }
  function render(){
    document.querySelectorAll('[data-mode]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.mode===mode)));
    document.querySelectorAll('[data-factor]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.factor===factor)));
    $('tools').hidden=mode!=='grow';$('experiments').hidden=mode!=='compare';
    $('sow').disabled=plant.stage>=0;$('drain').disabled=plant.moisture!==2;$('water').disabled=plant.stage<0;
    $('light-label').textContent=plant.light?'遮住阳光':'移到阳光下';$('light').setAttribute('aria-pressed',String(!plant.light));
    $('next').disabled=mode==='compare'&&guess===null;
    $('next').textContent=mode==='compare'?(test.round===3?'再猜一次':'过一段时间'):'过一段时间';
    $('reset').textContent=mode==='grow'?'重新播种':'重新比较';
    $('stages').innerHTML=Array.from({length:mode==='grow'?5:3},(_,i)=>`<span class="${i<=(mode==='grow'?plant.stage:test.round-1)?'done':''}"></span>`).join('');
    $('stages').setAttribute('aria-label',mode==='grow'?`生长阶段：${plant.stage<0?'未播种':stageNames[plant.stage]}`:`观察进度 ${test.round} / 3`);
    if(mode==='grow'){
      $('feedback').textContent=plant.stage<0?'先种一颗种子，再照顾它。':plant.moisture===2?'水太多，根周围的空气变少了。':plant.moisture===0?'摸摸土壤，干了再浇水。':plant.stage>=2&&!plant.light?'小苗需要光，帮它移到亮处。':'土壤湿润，耐心等一等。';
    }else{
      $('feedback').textContent=test.round===0?(guess===null?'先点一盆，猜猜谁会长得好。':'猜好了！开始观察吧。'):test.round<3?`这是第 ${test.round} 次观察，再等一段时间。`:(guess===test.healthy?'猜对啦！':'和刚才猜的不一样，再看一看。')+(factor==='water'?'湿润的这盆长得好。':'有光的这盆长得好。');
    }
    renderGarden();
  }
  function describeStart(speak=false){
    if(mode==='grow')message('种下一颗小太阳','点土壤播种，看看根和芽怎样长出来。',speak);
    else message('猜一猜，哪盆长得好？',factor==='water'?'两盆种子一样，阳光一样，只让土壤干湿不同。':'两盆小苗一样，水分一样，只让光照不同。',speak);
  }
  function sow(){plant=M.sow(plant);hydrating=false;render();message('种子住进土里啦','种子里藏着小生命，也存着发芽用的食物。',true);}
  function reset(){plant=M.create();test=M.trial(factor,Math.random()<.5?0:1);guess=null;hydrating=false;window.speechSynthesis?.cancel();render();describeStart(true);}
  $('sow').addEventListener('click',sow);
  $('water').addEventListener('click',()=>{plant=M.water(plant);hydrating=true;render();message(plant.moisture===2?'水太多了，先停一停':'小水滴进土里了',plant.moisture===2?'土壤积水会挤走空气。点排掉积水，帮助根呼吸。':'湿润就够了，不用一直浇。再过一段时间看看。',true);});
  $('drain').addEventListener('click',()=>{plant=M.drain(plant);hydrating=false;render();message('积水排掉了','土壤湿润，又有空气了。这里模拟的是花盆排水。',true);});
  $('light').addEventListener('click',()=>{plant={...plant,light:!plant.light,pale:plant.light?plant.pale:false};hydrating=false;render();message(plant.light?'搬到亮处啦':'遮住阳光了',plant.stage<2?'这颗种子先用储存的食物发芽，出土后的小苗需要光。':plant.light?'叶子有光了，能继续制造食物。':'看看过一段时间，小苗会有什么变化。',true);});
  $('next').addEventListener('click',()=>{
    hydrating=false;
    if(mode==='grow'){
      const result=M.advance(plant);plant=result.plant;render();
      const messages={sow:['土里还没有种子','先点土壤，或者点种下种子。'],dry:['土壤太干，先等等','种子吸水才能开始发芽，长大的植物也需要水。'],flood:['积水了，先别急着长','根需要空气。先排掉积水，再观察。'],dark:['小苗缺光，长得不好','幼苗会用掉种子里储存的食物，长大还需要光。'],grown:['小太阳开花啦！','你照顾了一颗向日葵。去两盆比一比，做个小实验吧。'],grow:[['','种子先长根啦！','嫩芽钻出土了！','叶子展开啦！','向日葵开花啦！'][plant.stage],['','根向下长，吸收水分。点土里的根看看。','嫩芽向上长，接下来需要光来长大。','叶子利用光、水和空气制造食物。','一朵花需要慢慢长大，现实中要等更久。'][plant.stage]]};
      message(...messages[result.reason],true);
    }else{
      if(test.round===3){reset();return;}
      test=M.stepTrial(test);render();
      message(test.round===3?'结果出来了！':'过了一段时间……',test.round===3?(factor==='water'?'没有水的种子没有发芽；湿润的这盆长出了小苗。':'光太少的小苗变淡了；有光的这盆长得更健壮。'):'看看两盆有什么不一样，再继续观察。',true);
    }
  });
  $('reset').addEventListener('click',reset);
  document.querySelectorAll('[data-mode]').forEach(el=>el.addEventListener('click',()=>{mode=el.dataset.mode;reset();}));
  document.querySelectorAll('[data-factor]').forEach(el=>el.addEventListener('click',()=>{factor=el.dataset.factor;reset();}));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)window.speechSynthesis?.cancel();});
  render();describeStart();
})();
