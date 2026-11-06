// 教学模型：使用明确的单位与边界，不模拟现实工程设计。
(function(root){
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const models={
    magnet:(flipped,material)=>({attract:!flipped,magnetic:['铁钉','钢回形针'].includes(material)}),
    circuit:(mode,closed,broken)=>({a:closed&&(mode==='parallel'||!broken),b:closed&&!broken,brightness:mode==='series'?.5:1}),
    shadow:(elevation,height)=>height/Math.tan(clamp(elevation,5,85)*Math.PI/180),
    buoyancy:(material,boat)=>{const mass={木块:60,石头:260,铁球:780,橡皮泥:180}[material];const volume=material==='橡皮泥'&&boat?240:100;return {mass,volume,floats:mass<=volume,fraction:Math.min(1,mass/volume)};},
    lever:(left,ld,right,rd)=>({left:left*ld,right:right*rd,balanced:Math.abs(left*ld-right*rd)<.01}),
    water:(energy)=>energy<20?{phase:'冰',temp:-20+energy}:energy<=40?{phase:'冰和水',temp:0}:energy<140?{phase:'水',temp:energy-40}:energy<=180?{phase:'水和水蒸气',temp:100}:{phase:'水蒸气',temp:100+(energy-180)/2},
    eclipse:(angle,inclination)=>{const a=((angle%360)+360)%360;const distance=Math.min(a,360-a);const aligned=Math.abs(inclination)<1;return {phase:(1-Math.cos(a*Math.PI/180))/2,event:aligned&&distance<8?'日食':aligned&&Math.abs(a-180)<8?'月食':null};},
    bridge:(type,load)=>{const capacity={平梁桥:3,拱桥:7,桁架桥:10}[type];return {capacity,safe:load<=capacity};},
    friction:(angle,mu)=>{const r=angle*Math.PI/180;const acceleration=9.8*(Math.sin(r)-mu*Math.cos(r));return {acceleration:Math.max(0,acceleration),moves:acceleration>0};},
    slide:(angle,mu,time)=>{const r=angle*Math.PI/180,a=9.8*(Math.sin(r)-mu*Math.cos(r));if(a<=0)return {ramp:0,flat:0,stopped:true};const length=10/Math.cos(r),end=Math.sqrt(2*length/a);if(time<=end)return {ramp:.5*a*time*time/length,flat:0,stopped:false};const velocity=a*end,dt=Math.min(time-end,velocity/(mu*9.8));return {ramp:1,flat:velocity*dt-.5*mu*9.8*dt*dt,stopped:time-end>=velocity/(mu*9.8)};},
    weather:(temp,humidity,wind)=>({dewPoint:temp-(100-humidity)/5,cloud:humidity>=80,wind:wind<1?'静风':wind<5?'轻风':wind<11?'和风到清风':'较强的风'})
  };
  if(typeof module!=='undefined')module.exports=models;else root.ScienceModels=models;
})(typeof window==='undefined'?globalThis:window);
