window.ScienceActivities = (() => {
 const range=(key,label,min,max,value,unit='',step=1)=>({key,label,min,max,value,unit,step});
 const organNames=['口腔','食道','胃','小肠','大肠'];
 const organFacts=['牙齿把食物嚼碎，唾液帮助初步消化淀粉。','食道通过蠕动，把食团送进胃里。','胃搅拌食物，胃液参与消化，尤其是蛋白质。','大部分消化和营养吸收在小肠完成，营养进入血液或淋巴。','大肠吸收一部分水和电解质，剩余残渣形成粪便。'];
 return {
 digestion:{title:'食物去哪儿了',question:'一口食物，会经过哪些地方？',controls:[range('stage','跟着食物走',0,4,0,'站')],fact:'消化把食物分解成能被吸收的小分子。食物沿消化道前进，营养被吸收后运往身体各处。肝脏、胆囊和胰腺也参与消化。',note:'位置和路径为简化示意，不按人体比例。肝脏、胆囊和胰腺不是食物直接通过的通道。',evaluate:s=>({message:organNames[s.stage]+'：'+organFacts[s.stage]}),draw(g,s,r,t){window.drawDigestiveSystem(g,s,t);}},
 };
})();
