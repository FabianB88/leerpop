const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const bank=require('../questions.json');
const rules=require('../game-rules.js');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
function setup(){
  const elements=new Map(),timers=new Map();let timerId=0;
  function element(){return{children:[],value:'',checked:false,hidden:false,disabled:false,textContent:'',className:'',classList:{add(){},remove(){},toggle(){}},append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=[...nodes]},addEventListener(){},focus(){},getContext(){return{}},scrollIntoView(){},open:false,showModal(){this.open=true},close(){this.open=false}}}
  const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,body:{classList:{add(){},remove(){}}}};
  const sandbox={document,Option:function(text,value){return{textContent:text,value}},window:{scrollTo(){}},localStorage:{getItem(){return null},setItem(){}},LeerpopRules:rules,LeerpopScores:{sessionId:()=> 'test-session-id',rememberName:value=>value},fetch:()=>new Promise(()=>{}),requestAnimationFrame(){},setTimeout(callback){timers.set(++timerId,callback);return timerId},clearTimeout(id){timers.delete(id)},testBank:bank};
  const context=vm.createContext(sandbox);vm.runInContext(source,context);vm.runInContext("bank=testBank;start('sustainability')",context);
  return{run(code){return vm.runInContext(code,context)},elements,timers};
}
const correct="answer(current.answer,$('answers').children[options.findIndex(o=>o.i===current.answer)])";
test('selecting planetary boundaries proceeds to circular economy after its questions',()=>{
  const game=setup();game.run("$('challenge').checked=false;$('module').value='2';$('module').onchange()");
  const count=bank.sustainability.filter(q=>q.module===2&&q.difficulty!=='hard').length;
  const presented=[];
  for(let i=0;i<count;i++){assert.equal(game.run('current.module'),2);presented.push(game.run('current.id'));game.run(correct+';next()')}
  assert.equal(new Set(presented).size,count);assert.equal(game.run('current.module'),3);assert.equal(game.elements.get('module').value,'3');
});
test('getting the last question of a topic wrong does not trap the player in it',()=>{
  const game=setup();game.run("$('challenge').checked=false;$('module').value='2';$('module').onchange();queue=queue.filter(q=>q.module!==2)");
  const previous=game.run('current.id');game.run("answer((current.answer+1)%current.options.length,$('answers').children[0]);next()");
  assert.equal(game.run('current.module'),3);assert.notEqual(game.run('current.id'),previous);assert.ok(game.run('stats().hard').includes(previous));
});
test('the final question finishes the round and one-question review also ends',()=>{
  const game=setup();game.run('queue=[];'+correct+';next()');
  assert.equal(game.run('phase'),'complete');assert.equal(game.run('current'),undefined);assert.equal(game.elements.get('next').hidden,false);
  game.run("$('next').onclick()");assert.equal(game.run('current.module'),1);
  const id=game.run('current.id');game.run("stats().hard=[current.id];$('review').checked=true;$('review').onchange()");
  assert.equal(game.run('current.id'),id);game.run("answer((current.answer+1)%current.options.length,$('answers').children[0]);next()");
  assert.equal(game.run('phase'),'complete');assert.equal(game.run('queue.length'),0);
});
test('earned color special clears bubbles, scores points, and preserves normal shots',()=>{
  const game=setup();game.run(correct+';next();'+correct+';next();'+correct+";$('next').onclick()");
  assert.equal(game.run('powers.color'),1);assert.equal(game.run('shotsRemaining'),3);
  const before=game.run('grid.flat().filter(x=>x!==null).length');game.run("usePower('color')");
  assert.ok(game.run('grid.flat().filter(x=>x!==null).length')<before);assert.ok(game.run('score')>300);
  assert.equal(game.run('powers.color'),0);assert.equal(game.run('shotsRemaining'),3);
  const score=game.run('score');game.run("usePower('color')");assert.equal(game.run('score'),score);
});
test('harder question earns a row special that clears the bottom row',()=>{
  const game=setup();game.run("queue=[bank[course].find(q=>q.difficulty==='hard')];next();"+correct+";$('next').onclick()");
  assert.equal(game.run('score'),200);assert.equal(game.run('powers.row'),1);
  game.run("usePower('row')");assert.equal(game.run('grid[4].filter(x=>x!==null).length'),0);
  assert.equal(game.run('powers.row'),0);assert.equal(game.run('shotsRemaining'),3);assert.equal(game.run('score'),300);
});
test('a special that empties the board advances the level without losing earned shots',()=>{
  const game=setup();game.run(correct+";$('next').onclick();grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));grid[0][0]=0;gun=0;powers.color=1;usePower('color')");
  assert.equal(game.run('level'),2);assert.equal(game.run('shotsRemaining'),3);assert.equal(game.run('powers.color'),0);assert.equal(game.run('score'),110);
});
