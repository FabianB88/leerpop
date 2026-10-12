const {test}=require('node:test');
const assert=require('node:assert/strict');
const rules=require('../game-rules.js');
const bank=require('../questions.json');
test('planetary questions advance to circular economy and do not repeat',()=>{
  const queue=rules.questionQueue(bank.sustainability,{fromModule:2,random:()=>0});
  assert.equal(queue[0].module,2);
  const firstCircular=queue.findIndex(q=>q.module===3);
  assert.ok(firstCircular>0);
  assert.ok(queue.slice(0,firstCircular).every(q=>q.module===2));
  assert.ok(queue.slice(firstCircular).every(q=>q.module>=3));
  assert.equal(new Set(queue.map(q=>q.id)).size,queue.length);
  assert.equal(queue.at(-1).module,9);
});
test('each subject presents basic questions before harder ones',()=>{
  for(const questions of Object.values(bank)){
    const queue=rules.questionQueue(questions);
    let module=0,hard=false;
    for(const q of queue){if(q.module!==module){assert.ok(q.module>module);module=q.module;hard=false}if(q.difficulty==='hard')hard=true;else assert.equal(hard,false)}
  }
});
test('filters omit disabled challenges and already presented questions',()=>{
  const first=rules.questionQueue(bank.sustainability)[0];
  const queue=rules.questionQueue(bank.sustainability,{challenges:false,seenIds:[first.id]});
  assert.ok(queue.every(q=>q.difficulty!=='hard'&&q.id!==first.id));
  const review=rules.questionQueue(bank.sustainability,{reviewIds:[first.id]});
  assert.equal(review.length,1);assert.equal(review[0].id,first.id);
  assert.equal(rules.questionQueue(bank.sustainability,{reviewIds:[]}).length,0);
});
test('three consecutive correct answers earn a color special and errors reset the streak',()=>{
  let streak=0,color=0;
  for(let i=0;i<6;i++){const earned=rules.reward(streak,true);streak=earned.streak;color+=earned.color;assert.equal(earned.points,100)}
  assert.equal(color,2);assert.equal(streak,6);
  const missed=rules.reward(streak,false,true);assert.equal(missed.streak,0);assert.equal(missed.row,0);
  assert.equal(rules.reward(missed.streak,true).color,0);
});
test('harder correct answers add a row special and can also complete a streak',()=>{
  assert.deepEqual(rules.reward(2,true,true),{streak:3,color:1,row:1,points:200});
});
test('color and row specials select the correct filled bubbles',()=>{
  const grid=[[0,1,null],[1,2,1],[null,3,null],[null,null,null]];
  assert.deepEqual(rules.powerTargets(grid,'color',1),[[0,1],[1,0],[1,2]]);
  assert.deepEqual(rules.powerTargets(grid,'row',0),[[2,1]]);
  assert.deepEqual(rules.powerTargets([[null]],'row',0),[]);
  assert.deepEqual(grid,[[0,1,null],[1,2,1],[null,3,null],[null,null,null]]);
});
test('question bank has valid answers, unique IDs, and two challenges per curriculum subject',()=>{
  const allIds=new Set();
  for(const [course,qs]of Object.entries(bank)){
    for(const q of qs){assert.ok(!allIds.has(q.id));allIds.add(q.id);assert.ok(q.q&&q.explanation&&q.source);assert.ok(q.options.length>=3);assert.equal(new Set(q.options).size,q.options.length);assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length)}
    const max=course==='sustainability'?9:5;
    for(let module=1;module<=max;module++)assert.ok(qs.filter(q=>q.module===module&&q.difficulty==='hard').length>=2);
  }
  assert.ok(bank.sustainability.every(q=>!/(biosfeer|hydrosfeer|lithosfeer|welke sfeer|wat omvat de atmosfeer)/i.test(q.q+' '+q.options.join(' '))));
});
