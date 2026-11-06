const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../biology/plant-model.js');

test('unplanted, dry and waterlogged plants cannot advance just by waiting',()=>{
  assert.equal(M.advance(M.create()).reason,'sow');
  const seed=M.sow(M.create());
  assert.equal(M.advance(seed).reason,'dry');
  const flooded=M.water(M.water(seed));
  assert.equal(M.advance(flooded).reason,'flood');
  assert.equal(M.advance(flooded).plant.stage,0);
  assert.equal(M.advance(M.drain(flooded)).plant.stage,1);
  assert.equal(seed.moisture,0);
});

test('seed reserves support initial germination without light; seedlings need light for healthy growth',()=>{
  let p=M.water(M.sow(M.create({light:false})));
  p=M.advance(p).plant;
  assert.equal(p.stage,1);
  p=M.advance(p).plant;
  assert.equal(p.stage,2);
  assert.equal(p.moisture,0);
  p=M.water(p);
  const dark=M.advance(p);
  assert.equal(dark.reason,'dark');
  assert.equal(dark.plant.stage,2);
  assert.equal(dark.plant.pale,true);
  const restored=M.advance({...dark.plant,light:true});
  assert.equal(restored.plant.stage,3);
  assert.equal(restored.plant.pale,false);
});

test('water and light comparisons hold the other conditions equal on either side',()=>{
  for(const factor of ['water','light']) for(const healthy of [0,1]){
    let experiment=M.trial(factor,healthy);
    assert.equal(experiment.plants[0].stage,experiment.plants[1].stage);
    if(factor==='water')assert.equal(experiment.plants[0].light,experiment.plants[1].light);
    else assert.equal(experiment.plants[0].moisture,experiment.plants[1].moisture);
    const original=JSON.stringify(experiment);
    for(let i=0;i<3;i++)experiment=M.stepTrial(experiment);
    assert.equal(experiment.round,3);
    assert.ok(experiment.plants[healthy].stage>experiment.plants[1-healthy].stage);
    assert.equal(experiment.plants[1-healthy].stage,factor==='water'?0:2);
    if(factor==='light')assert.equal(experiment.plants[1-healthy].pale,true);
    assert.equal(M.stepTrial(experiment),experiment);
    assert.equal(JSON.stringify(M.trial(factor,healthy)),original);
  }
});
