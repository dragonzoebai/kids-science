(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PlantModel=api;})(typeof window==='undefined'?globalThis:window,()=>{
  function create(options={}) {return {stage:-1,moisture:0,light:true,dampAge:0,pale:false,...options};}
  function sow(plant) {return plant.stage<0?{...plant,stage:0}:plant;}
  function water(plant) {return {...plant,moisture:Math.min(2,plant.moisture+1),dampAge:0};}
  function drain(plant) {return {...plant,moisture:1,dampAge:0};}
  function advance(plant) {
    if(plant.stage<0)return {plant,reason:'sow'};
    if(plant.moisture===0)return {plant,reason:'dry'};
    if(plant.moisture===2)return {plant,reason:'flood'};
    if(plant.stage>=2&&!plant.light)return {plant:{...plant,pale:true},reason:'dark'};
    if(plant.stage===4)return {plant,reason:'grown'};
    const age=plant.dampAge+1;
    return {plant:{...plant,stage:plant.stage+1,pale:false,dampAge:age%2,moisture:age>=2?0:1},reason:'grow'};
  }
  function trial(factor,healthy=0) {
    return {factor,healthy,round:0,plants:[0,1].map(i=>create({stage:factor==='light'?2:0,moisture:factor==='water'&&i!==healthy?0:1,light:factor!=='light'||i===healthy}))};
  }
  function stepTrial(test) {
    if(test.round>=3)return test;
    return {...test,round:test.round+1,plants:test.plants.map((plant,i)=>{
      // Maintain the selected conditions in each interval; only one factor differs.
      const prepared={...plant,dampAge:0,moisture:test.factor==='water'&&i!==test.healthy?0:1};
      return advance(prepared).plant;
    })};
  }
  return {create,sow,water,drain,advance,trial,stepTrial};
});
