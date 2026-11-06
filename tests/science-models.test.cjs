const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('../science-models.js');
test('magnets and circuit branches obey polarity and open-circuit rules',()=>{
 assert.equal(M.magnet(true,'木块').attract,false);assert.equal(M.magnet(false,'铁钉').magnetic,true);
 assert.equal(M.magnet(false,'铜片').magnetic,false);
 assert.equal(M.circuit('series',true,true).a,false);
 assert.equal(M.circuit('parallel',true,true).a,true);
 assert.equal(M.circuit('parallel',false,false).a,false);
});
test('shadow, buoyancy and lever boundary cases',()=>{
 assert.ok(M.shadow(10,2)>M.shadow(70,2));
 assert.equal(M.buoyancy('橡皮泥',false).floats,false);assert.equal(M.buoyancy('橡皮泥',true).floats,true);
 assert.equal(M.buoyancy('铁球',true).floats,false);assert.equal(M.buoyancy('木块',false).floats,true);
 assert.equal(M.lever(4,2,2,4).balanced,true);assert.equal(M.lever(4,3,2,4).balanced,false);
});
test('water absorbs heat on melting and boiling plateaus',()=>{
 assert.equal(M.water(0).temp,-20);assert.equal(M.water(20).temp,0);assert.equal(M.water(40).temp,0);
 assert.equal(M.water(140).temp,100);assert.equal(M.water(180).temp,100);assert.equal(M.water(220).phase,'水蒸气');
});
test('new and full moon only eclipse when aligned',()=>{
 assert.equal(M.eclipse(0,0).event,'日食');assert.equal(M.eclipse(180,0).event,'月食');
 assert.equal(M.eclipse(0,5).event,null);assert.equal(M.eclipse(90,0).event,null);
 assert.equal(M.eclipse(0,0).phase,0);assert.equal(M.eclipse(180,0).phase,1);
});
test('bridge load, friction threshold and condensation conditions',()=>{
 assert.equal(M.bridge('平梁桥',4).safe,false);assert.equal(M.bridge('桁架桥',10).safe,true);
 assert.equal(M.friction(5,.6).moves,false);assert.ok(M.friction(30,.05).acceleration>M.friction(30,.25).acceleration);
 assert.equal(M.slide(5,.6,10).ramp,0);
 assert.ok(M.slide(30,.05,25).flat>M.slide(30,.25,25).flat);
 assert.equal(M.slide(30,.25,25).stopped,true);
 assert.equal(M.weather(20,100,0).dewPoint,20);
});
test('all 12 activity defaults and extrema render without errors and have real local pages',()=>{
 const ctx={window:{},ScienceModels:M};
 vm.runInNewContext(fs.readFileSync(require.resolve('../biology/digestion-drawing.js'),'utf8'),ctx);
 vm.runInNewContext(fs.readFileSync(require.resolve('../science-activities.js'),'utf8'),ctx);
 const draw=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const activities=ctx.window.ScienceActivities;assert.equal(Object.keys(activities).length,12);
 for(const [key,a] of Object.entries(activities)){
  const state=Object.fromEntries(a.controls.map(c=>[c.key,c.value]));
  for(const c of a.controls){for(const value of c.options||[c.min,c.max]){const s={...state,[c.key]:value},r=a.evaluate(s);assert.ok(r.message.length>5,key);a.draw(draw,s,r,3);}}
  const folder=['digestion','butterfly'].includes(key)?'biology':key==='eclipses'?'threejs':key==='weather-lab'?'earth':'physics';
  assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',folder,key+'.html')));
 }
});
