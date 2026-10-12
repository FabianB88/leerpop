'use strict';
const $=id=>document.getElementById(id),names={sustainability:'Duurzaamheid',ethics:'Business Ethics'},modules={sustainability:['Systeemdenken & duurzaamheid','Aarde & planetaire grenzen','Circulaire economie & R-ladder','Klimaat & infrastructuur','Waardecreatie & materialiteit','Biomimicry','Wicked problems & CLD','Strategische besluitvorming','Synthese & LCA'],ethics:['Economie & systemen','Psychologie & systemen','Organisaties & macht','Technologie & morele interventie','Greenwashing']};
let bank,course,current,options,queue=[],locked=false,ready=false,flying=null,score=0,level=1,shots=0,shotsRemaining=0,answered=0,angle=-Math.PI/2,grid=[],particles=[],lastTime=0,storageWorks=true,phase="question";
let nextQuestionTimer=null,scoreSnapshot=null,scoreSaving=false,gameSessionId='';
let stopScoreListener=()=>{};
let roundSeen=new Set(),correctStreak=0,powers={color:0,row:0};
const customStorageKey='leerpop-own-modules-v2';
let ownModules=[];
try{ownModules=JSON.parse(localStorage.getItem(customStorageKey)||'[]')}catch{ownModules=[]}
const colors=['#ecb5ce','#eddb96','#f0ba91','#c8b5e3'],strokes=['#a33b70','#886923','#ac562b','#70539a'],symbols=['♡','✦','●','◇'];
function read(){try{return JSON.parse(localStorage.getItem('leerpop-v1'))||{}}catch{storageWorks=false;return {}}}
let progress=read();
function stats(){if(!progress[course])progress[course]={correct:[],hard:[],attempts:0,best:0};return progress[course]}
function save(){try{localStorage.setItem('leerpop-v1',JSON.stringify(progress))}catch{storageWorks=false}}
function shuffle(a){return LeerpopRules.shuffle(a)}
function home(){clearTimeout(nextQuestionTimer);scoreSnapshot=null;document.body.classList.remove('playing');ready=false;flying=null;$('play').hidden=true;$('home').hidden=false;for(const c of ['sustainability','ethics']){const p=progress[c]||{correct:[],hard:[]};$(c+'Progress').textContent=p.correct.length+' / '+bank[c].length+' goed beantwoord · '+p.hard.length+' om te herhalen'}renderCustomModules()}
function persistModules(){try{localStorage.setItem(customStorageKey,JSON.stringify(ownModules));storageWorks=true;return true}catch{storageWorks=false;return false}}
function prepareCustom(m){const key='own_'+m.id;names[key]=m.title;modules[key]=[m.title];bank[key]=m.concepts.map((item,i)=>{const wrong=shuffle(m.concepts.filter((_,j)=>j!==i)).slice(0,2).map(x=>x.explanation);const choices=shuffle([{text:item.explanation,correct:true},...wrong.map(text=>({text,correct:false}))]);return{id:key+'-'+i,module:1,q:'Wat betekent “'+item.term+'”?',options:choices.map(x=>x.text),answer:choices.findIndex(x=>x.correct),explanation:item.explanation,source:''}})}
function renderCustomModules(){const host=$('customModules');host.replaceChildren();for(const m of ownModules){const key='own_'+m.id;prepareCustom(m);const p=progress[key]||{correct:[],hard:[]};const card=document.createElement('article');card.className='course custom-course';const badge=document.createElement('span');badge.className='pill';badge.textContent=m.concepts.length+' BEGRIPPEN';const title=document.createElement('h2');title.textContent=m.title;const description=document.createElement('p');description.textContent=m.concepts.slice(0,3).map(x=>x.term).join(' · ')+(m.concepts.length>3?' · …':'');const stat=document.createElement('div');stat.className='progress';stat.textContent=p.correct.length+' / '+m.concepts.length+' goed beantwoord';const button=document.createElement('button');button.className='start';button.textContent='Speel '+m.title+'  ↗';button.addEventListener('click',()=>start(key));card.append(badge,title,description,stat,button);host.append(card)}}
function addConceptRow(term='',explanation=''){const row=document.createElement('div');row.className='concept-row';for(const [labelText,value] of [['Begrip',term],['Uitleg',explanation]]){const label=document.createElement('label');label.className='concept-field';const caption=document.createElement('span');caption.textContent=labelText;const input=document.createElement(labelText==='Uitleg'?'textarea':'input');if(labelText==='Uitleg'){input.rows=2;input.maxLength=500}else input.maxLength=90;input.placeholder=labelText==='Begrip'?'Bijvoorbeeld: R-ladder':'Leg het begrip kort uit';input.value=value;input.required=true;input.setAttribute('aria-label',labelText);label.append(caption,input);row.append(label)}const remove=document.createElement('button');remove.type='button';remove.className='remove-concept';remove.textContent='Verwijder';remove.setAttribute('aria-label','Verwijder dit begrip');remove.addEventListener('click',()=>{if($('conceptRows').children.length>3)row.remove();else $('builderMessage').textContent='Een module heeft minimaal drie begrippen nodig.'});row.append(remove);$('conceptRows').append(row)}
function saveCustomModule(){const title=$('customTitle').value.trim();const concepts=[...$('conceptRows').querySelectorAll('.concept-row')].map(row=>({term:row.querySelector('input').value.trim(),explanation:row.querySelector('textarea').value.trim()})).filter(x=>x.term&&x.explanation);if(!title){$('builderMessage').textContent='Geef je module eerst een naam.';$('customTitle').focus();return}if(concepts.length<3){$('builderMessage').textContent='Vul minimaal 3 volledige begrippen in. Je hebt er nu '+concepts.length+'.';return}const module={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,concepts};ownModules.unshift(module);if(!persistModules()){ownModules.shift();$('builderMessage').textContent='Opslaan op dit apparaat is niet beschikbaar; probeer de pagina via een gewone browser te openen.';return}prepareCustom(module);$('builderMessage').textContent='Je module is klaar en staat nu op je startscherm.';$('customTitle').value='';$('conceptRows').replaceChildren();for(let i=0;i<3;i++)addConceptRow();renderCustomModules();setTimeout(()=>{$('builder').hidden=true;$('builderMessage').textContent=''},1100)}
function pool(){return LeerpopRules.questionQueue(bank[course],{fromModule:Number($('module').value)||1,challenges:$('challenge').checked,reviewIds:$('review').checked?stats().hard:null,seenIds:[...roundSeen]})}
function refill(reset=false){if(reset)roundSeen=new Set();queue=pool()}
function start(c){clearTimeout(nextQuestionTimer);gameSessionId=LeerpopScores.sessionId();LeerpopScores.rememberName($('playerName').value);document.body.classList.add('playing');course=c;score=0;level=1;answered=0;correctStreak=0;powers={color:0,row:0};roundSeen=new Set();$('module').replaceChildren(new Option('Alle onderwerpen · op volgorde',''),...modules[c].map((m,i)=>new Option((i+1)+'. '+m,String(i+1))));$('finishGame').textContent=c.startsWith('own_')?'Ronde afsluiten':'Score bewaren';$('review').checked=false;$('challenge').checked=!c.startsWith('own_');$('challengeChoice').hidden=c.startsWith('own_');$('home').hidden=true;$('play').hidden=false;$('courseTitle').textContent=names[c];$('modeLabel').textContent=c==='ethics'?'TOEPASSINGSVRAGEN':c.startsWith('own_')?'JOUW BEGRIPPEN':'BEGRIPPEN & MODELLEN';refill();newBoard();next();window.scrollTo(0,0)}
function next(){
  clearTimeout(nextQuestionTimer);ready=false;locked=false;phase='question';shotsRemaining=0;
  $('questionpanel').hidden=false;flying=null;$('shotsBadge').textContent='Beantwoord de vraag';
  $('next').hidden=true;$('feedback').textContent='';$('feedback').className='';$('answers').replaceChildren();
  const previousModule=current?.module;current=queue.shift();
  if(!current){
    phase='complete';locked=true;
    $('question').textContent=$('review').checked?'Je herhaalronde is afgerond!':'Je hebt alle vragen van deze ronde gehad!';
    $('qmodule').textContent='RONDE AFGEROND';$('difficultyBadge').textContent='Goed geoefend';
    $('counter').textContent=answered+' vragen beantwoord';$('source').hidden=true;
    $('boardStatus').textContent='Ronde afgerond · bewaar je score of begin een nieuwe ronde';
    $('learningStats').textContent=stats().hard.length?'Er staan '+stats().hard.length+' lastige vragen klaar. Kies Alleen lastige vragen om die te oefenen.':'Geen lastige vragen meer. Je kunt je score bewaren of nog een ronde spelen.';
    $('next').textContent=$('review').checked?'Nog een herhaalronde →':'Nieuwe ronde · vanaf onderwerp 1 →';
    $('next').hidden=$('review').checked&&!stats().hard.length;
    renderPowers();return;
  }
  roundSeen.add(current.id);$('module').value=String(current.module);
  $('source').hidden=!current.source;if(current.source)$('source').href=current.source;
  $('question').textContent=current.q;$('qmodule').textContent=modules[course][current.module-1];
  const difficult=current.difficulty==='hard';
  $('difficultyBadge').textContent=difficult?'VERDIEPING · + RIJVEGER':'BASIS';
  $('difficultyBadge').classList.toggle('is-hard',difficult);
  $('counter').textContent='Vraag '+(answered+1);
  $('learningStats').textContent=stats().correct.length+' van '+bank[course].length+' vragen goed beantwoord · '+stats().hard.length+' lastig'+(storageWorks?'':' · opslaan is niet beschikbaar in deze browser');
  options=shuffle(current.options.map((text,i)=>({text,i})));
  options.forEach((o,n)=>{const b=document.createElement('button'),letter=document.createElement('span'),text=document.createElement('div');letter.textContent=String.fromCharCode(65+n);text.textContent=o.text;b.append(letter,text);b.addEventListener('click',()=>answer(o.i,b));$('answers').append(b)});
  $('boardStatus').textContent=previousModule&&previousModule!==current.module?'Volgend onderwerp: '+modules[course][current.module-1]:'Beantwoord eerst de vraag';
  $('score').textContent=score+' punten';renderPowers();
}
function answer(index,button){
  if(locked||!current)return;locked=true;answered++;
  const p=stats();p.attempts++;const ok=index===current.answer;
  const reward=LeerpopRules.reward(correctStreak,ok,current.difficulty==='hard');
  correctStreak=reward.streak;powers.color+=reward.color;powers.row+=reward.row;
  [...$('answers').children].forEach((b,n)=>{b.disabled=true;if(options[n].i===current.answer)b.classList.add('correct')});
  if(ok){
    if(!p.correct.includes(current.id))p.correct.push(current.id);p.hard=p.hard.filter(x=>x!==current.id);
    score+=reward.points;shotsRemaining=3;ready=false;phase='start';pickGun();
    $('shotsBadge').textContent='3 schoten verdiend';$('boardStatus').textContent='Goed antwoord · +'+reward.points+' punten';
    const bonus=[reward.color?'Drie op rij: je verdient een kleurknaller!':'',reward.row?'Verdiepingsbonus: je verdient een rijveger!':''].filter(Boolean).join(' ');
    $('feedback').textContent='Goed! '+current.explanation+' '+bonus+' Je mag nu drie keer schieten.';
    $('next').textContent='Start met schieten · 3 bubbels';$('next').hidden=false;
  }else{
    phase='review';button.classList.add('wrong');if(!p.hard.includes(current.id))p.hard.push(current.id);
    const pressure=addPenaltyRow();$('feedback').className='error';
    $('feedback').textContent='Nog niet. '+current.explanation+' '+pressure+' Deze vraag staat bij Alleen lastige vragen om later te herhalen.';
    $('next').textContent='Verder oefenen →';$('next').hidden=false;$('boardStatus').textContent=pressure;
  }
  p.best=Math.max(p.best,score);save();$('score').textContent=score+' punten';
  $('learningStats').textContent=p.correct.length+' van '+bank[course].length+' vragen goed beantwoord · '+p.hard.length+' lastig';renderPowers();
}
function showHighScores(){
  stopScoreListener();
  const selected=$('scoreCourse').value;
  $('scoreboardStatus').textContent='Gedeeld scorebord laden…';
  $('highScores').replaceChildren();
  stopScoreListener=LeerpopScores.listen(selected,(records,connected)=>{
    const host=$('highScores');host.replaceChildren();
    for(const [index,record] of records.entries()){
      const row=document.createElement('li');
      const rank=document.createElement('span');rank.className='score-rank';rank.textContent=String(index+1).padStart(2,'0');
      const player=document.createElement('div');const name=document.createElement('strong');name.textContent=record.name;
      const detail=document.createElement('span');detail.className='score-detail';detail.textContent='Level '+record.level+' · '+record.answered+' vragen';player.append(name,detail);
      const points=document.createElement('strong');points.className='score-points';points.textContent=Number(record.score).toLocaleString('nl-NL')+' punten';row.append(rank,player,points);host.append(row);
    }
    $('scoreboardStatus').textContent=connected?(records.length?'Live scorebord · zichtbaar voor alle spelers':'Nog geen scores. Zet jij de eerste ronde op het bord?'):'Verbinding maken… de getoonde scores kunnen verouderd zijn.';
  },()=>{$('scoreboardStatus').textContent='Het gedeelde scorebord is even niet bereikbaar. Je kunt gewoon spelen. Vernieuw de pagina om opnieuw te verbinden.'});
}
function finishGame(){
  if($('play').hidden)return;
  if(score<1||course.startsWith('own_')){home();return}
  clearTimeout(nextQuestionTimer);
  scoreSnapshot={id:gameSessionId,course,score,level,answered};
  $('scoreSummary').textContent=names[course]+' · '+score.toLocaleString('nl-NL')+' punten · level '+level;
  $('scoreName').value=LeerpopScores.cleanName($('playerName').value);
  $('scoreMessage').textContent='';
  $('scoreDialog').showModal();
  $('scoreName').focus();
}
function setScoreBusy(busy){
  scoreSaving=busy;
  for(const id of ['scoreName','submitScore','continueGame','leaveGame'])$(id).disabled=busy;
  $('submitScore').textContent=busy?'Score bewaren…':'Bewaar & naar cursussen ↗';
}
async function submitHighScore(event){
  event.preventDefault();
  if(scoreSaving||!scoreSnapshot)return;
  const name=LeerpopScores.cleanName($('scoreName').value);
  if(!name){$('scoreMessage').textContent='Vul een naam of bijnaam in.';$('scoreName').focus();return}
  const entry={...scoreSnapshot,name};
  setScoreBusy(true);$('scoreMessage').textContent='Je score wordt op het gedeelde bord bewaard…';
  let timeout;
  try{
    await Promise.race([LeerpopScores.save(entry),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('timeout')),15000)})]);
    $('playerName').value=LeerpopScores.rememberName(name);
    $('scoreCourse').value=entry.course;
    home();$('scoreDialog').close();showHighScores();
    $('scoreboardStatus').textContent='Bewaard! '+name+' · '+entry.score.toLocaleString('nl-NL')+' punten. Het live scorebord wordt bijgewerkt.';
    $('leaderboardHeading').scrollIntoView({behavior:'smooth',block:'center'});
  }catch(error){
    $('scoreMessage').textContent=error.message==='timeout'?'Nog geen bevestiging van het scorebord. Controleer je verbinding en probeer opnieuw; dezelfde ronde wordt maar één keer bewaard.':'Bewaren is niet gelukt. Controleer je verbinding en probeer opnieuw. Je score blijft hier klaarstaan.';
  }finally{clearTimeout(timeout);setScoreBusy(false)}
}
function initializeScores(){
  $('playerName').value=LeerpopScores.rememberedName();
  $('playerName').addEventListener('change',()=>{$('playerName').value=LeerpopScores.rememberName($('playerName').value)});
  $('scoreCourse').addEventListener('change',showHighScores);
  $('finishGame').addEventListener('click',finishGame);
  $('scoreForm').addEventListener('submit',submitHighScore);
  $('continueGame').onclick=()=>{$('scoreDialog').close()};
  $('leaveGame').onclick=()=>{home();$('scoreDialog').close()};
  $('scoreDialog').addEventListener('cancel',event=>{if(scoreSaving)event.preventDefault()});
  $('scoreDialog').addEventListener('close',()=>{if(!$('play').hidden&&phase==='shooting'&&shotsRemaining===0&&!flying)next()});
  showHighScores();
}

const canvas=$('board'),ctx=canvas.getContext('2d'),R=20,DX=42,DY=36.4,ROWS=12,COLS=10,launcher={x:240,y:528};let gun=0;
function pos(row,col){return{x:30+col*DX+(row%2)*21,y:30+row*DY}}
function neighbours(row,col){let a=[];for(let rr=Math.max(0,row-1);rr<=Math.min(ROWS-1,row+1);rr++)for(let cc=Math.max(0,col-1);cc<=Math.min(COLS-1,col+1);cc++){if(rr===row&&cc===col)continue;let p=pos(row,col),q=pos(rr,cc);if(Math.hypot(p.x-q.x,p.y-q.y)<DX+1)a.push([rr,cc])}return a}
function newBoard(){grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));for(let r=0;r<5;r++)for(let c=0;c<COLS;c++)grid[r][c]=(Math.floor(c/2)+Math.floor(r/2))%4;shots=0;particles=[];flying=null;pickGun();$('level').textContent='Level '+level}
function pickGun(){const available=[...new Set(grid.flat().filter(x=>x!==null))];gun=available[Math.floor(Math.random()*available.length)]??0}
function addPenaltyRow(){const row=Array.from({length:COLS},(_,c)=>(c+Math.floor(Math.random()*4))%4);const overflow=grid[ROWS-1].some(x=>x!==null);grid.pop();grid.unshift(row);if(overflow){newBoard();return'Extra rij toegevoegd — het veld bereikte de ondergrens, dus je krijgt een nieuw speelveld.'}return'Extra rij bubbels toegevoegd; je bestaande bubbels zakken een rij.'}
function aim(x,y){angle=Math.max(-Math.PI+.18,Math.min(-.18,Math.atan2(y-launcher.y,x-launcher.x)))}
function shoot(){if(!ready||flying||shotsRemaining<1)return;ready=false;shotsRemaining--;renderPowers();$('shotsBadge').textContent=shotsRemaining+' '+(shotsRemaining===1?'schot':'schoten')+' over';flying={x:launcher.x,y:launcher.y,vx:Math.cos(angle)*510,vy:Math.sin(angle)*510,color:gun};$('boardStatus').textContent='Daar gaat je bubbel!'}
function settle(){const f=flying;flying=null;let cells=[];for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]===null&&(r===0||neighbours(r,c).some(([rr,cc])=>grid[rr][cc]!==null))){let p=pos(r,c);cells.push({r,c,d:Math.hypot(p.x-f.x,p.y-f.y)})}cells.sort((a,b)=>a.d-b.d);const cell=cells[0];if(!cell){finishShot('Nieuw veld · je blijft oefenen');newBoard();return}grid[cell.r][cell.c]=f.color;const group=[],seen=new Set(),todo=[[cell.r,cell.c]];while(todo.length){let [r,c]=todo.pop(),key=r+','+c;if(seen.has(key)||grid[r][c]!==f.color)continue;seen.add(key);group.push([r,c]);todo.push(...neighbours(r,c))}let popped=0;if(group.length>=3){popped=popBubbles(group);score+=popped*10}shots++;let message=popped?`${popped} bubbels gepopt · +${popped*10} punten`:'Je bubbel zit vast · maak een groep van drie';if(grid.flat().every(x=>x===null)){level++;newBoard();message='Veld leeg! Op naar level '+level}else if(shots%5===0){if(grid[ROWS-1].some(x=>x!==null)){newBoard();message='Het veld was vol · een frisse start'}else{grid.pop();grid.unshift(Array.from({length:COLS},()=>Math.floor(Math.random()*4)));message+=' · nieuwe rij'}}if(grid[ROWS-1].some(x=>x!==null)){newBoard();message='Bubbels bereiken de lijn · nieuw veld, je kennis blijft bewaard'}finishShot(message)}
function popBubbles(cells){
  let popped=0;
  for(const [r,c] of cells){if(grid[r][c]===null)continue;burst(r,c);grid[r][c]=null;popped++}
  const attached=new Set(),reach=[];
  for(let c=0;c<COLS;c++)if(grid[0][c]!==null)reach.push([0,c]);
  while(reach.length){const [r,c]=reach.pop(),key=r+','+c;if(attached.has(key)||grid[r][c]===null)continue;attached.add(key);reach.push(...neighbours(r,c))}
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r][c]!==null&&!attached.has(r+','+c)){burst(r,c);grid[r][c]=null;popped++}
  return popped;
}
function renderPowers(){
  $('streakMeter').textContent=correctStreak?'Reeks: '+correctStreak+' goed · nog '+(3-correctStreak%3)+' voor de volgende kleurknaller':'3 goede antwoorden op rij = een kleurknaller';
  const usable=phase==='shooting'&&ready&&!flying&&!$('scoreDialog').open&&!$('play').hidden;
  $('colorPower').textContent='✦ Kleurknaller · '+powers.color;$('colorPower').disabled=!usable||!powers.color;
  $('rowPower').textContent='↔ Rijveger · '+powers.row;$('rowPower').disabled=!usable||!powers.row;
}
function usePower(type){
  if(phase!=='shooting'||!ready||flying||!$('questionpanel').hidden||$('scoreDialog').open||!powers[type])return;
  const cells=LeerpopRules.powerTargets(grid,type,gun);if(!cells.length)return;
  powers[type]--;const popped=popBubbles(cells);score+=popped*10;
  let message=(type==='color'?'Kleurknaller':'Rijveger')+': '+popped+' bubbels weg · +'+popped*10+' punten';
  if(grid.flat().every(x=>x===null)){level++;newBoard();message+=' · op naar level '+level}
  pickGun();stats().best=Math.max(stats().best,score);save();$('score').textContent=score+' punten';
  $('boardStatus').textContent=message;$('powerNotice').textContent=message;renderPowers();
}
function finishShot(message){$('boardStatus').textContent=message;$('score').textContent=score+' punten';stats().best=Math.max(stats().best,score);save();if(shotsRemaining>0){pickGun();ready=true;$('boardStatus').textContent=message+' · nog '+shotsRemaining+' schoten';renderPowers();return}ready=false;renderPowers();nextQuestionTimer=setTimeout(()=>{if(!$('play').hidden&&!$('scoreDialog').open)next()},650)}
function burst(r,c){let p=pos(r,c);for(let i=0;i<7;i++)particles.push({x:p.x,y:p.y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,life:.6,color:colors[grid[r][c]]})}
function bubble(x,y,c,r=R){ctx.fillStyle=colors[c];ctx.strokeStyle=strokes[c];ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff80';ctx.beginPath();ctx.ellipse(x-r*.27,y-r*.35,r*.3,r*.17,-.5,0,Math.PI*2);ctx.fill();ctx.fillStyle=strokes[c];ctx.font=`${r}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(symbols[c],x,y+2)}
function draw(time){let dt=Math.min((time-lastTime)/1000,.025)||.016;lastTime=time;ctx.clearRect(0,0,480,570);if(course){if(flying&&!$('scoreDialog').open&&!$('play').hidden){flying.x+=flying.vx*dt;flying.y+=flying.vy*dt;if(flying.x<R){flying.x=R;flying.vx=Math.abs(flying.vx)}if(flying.x>480-R){flying.x=480-R;flying.vx=-Math.abs(flying.vx)}let collision=flying.y<=R+10;for(let r=0;r<ROWS&&!collision;r++)for(let c=0;c<COLS;c++)if(grid[r][c]!==null){let p=pos(r,c);if(Math.hypot(p.x-flying.x,p.y-flying.y)<=R*2){collision=true;break}}if(collision)settle()}for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(grid[r]?.[c]!==null&&grid[r]?.[c]!==undefined){let p=pos(r,c);bubble(p.x,p.y,grid[r][c])}ctx.strokeStyle='#b991a0';ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(10,450);ctx.lineTo(470,450);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#765363';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText('HOUD DE BUBBELS BOVEN DEZE LIJN',14,463);if(ready){angle=-Math.PI/2+Math.sin(time/650)*.82;ctx.strokeStyle=strokes[gun];ctx.lineWidth=2;ctx.setLineDash([3,8]);ctx.beginPath();ctx.moveTo(launcher.x,launcher.y);ctx.lineTo(launcher.x+Math.cos(angle)*180,launcher.y+Math.sin(angle)*180);ctx.stroke();ctx.setLineDash([])}ctx.fillStyle='#e8dde8';ctx.beginPath();ctx.arc(launcher.x,launcher.y,33,0,Math.PI*2);ctx.fill();bubble(launcher.x,launcher.y,gun);if(flying)bubble(flying.x,flying.y,flying.color);particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;ctx.globalAlpha=Math.max(0,p.life/.6);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1}requestAnimationFrame(draw)}
function point(e){let r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*480/r.width,y:(e.clientY-r.top)*570/r.height}}
canvas.addEventListener('pointerdown',()=>shoot());canvas.addEventListener('keydown',e=>{if(e.key===' ') {e.preventDefault();shoot()}});$('next').onclick=()=>{
  if(phase==='start'){phase='shooting';$('questionpanel').hidden=true;ready=true;$('shotsBadge').textContent='3 schoten over';$('boardStatus').textContent='Klik wanneer de richtlijn goed staat · specials kun je nu gebruiken';canvas.focus();renderPowers()}
  else if(phase==='complete'){$('module').value='';refill(true);next()}
  else next();
};
$('back').onclick=finishGame;$('brand').onclick=e=>{e.preventDefault();if(bank){if(!$('play').hidden)finishGame();else home()}};
$('module').onchange=()=>{refill(true);next()};
$('review').onchange=()=>{$('module').value='';refill(true);next()};
$('challenge').onchange=()=>{if(current&&!locked)roundSeen.delete(current.id);refill();next()};
$('colorPower').onclick=()=>usePower('color');$('rowPower').onclick=()=>usePower('row');

fetch('questions.json').then(r=>{if(!r.ok)throw Error('vragen');return r.json()}).then(data=>{bank=data;for(const c of ['sustainability','ethics']){const known=new Set(bank[c].map(q=>q.id));if(progress[c]){progress[c].correct=(progress[c].correct||[]).filter(id=>known.has(id));progress[c].hard=(progress[c].hard||[]).filter(id=>known.has(id))}}save();initializeScores();for(const m of ownModules)prepareCustom(m);home();document.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>start(b.dataset.course));$('showBuilder').onclick=()=>{$('builder').hidden=false;$('builderMessage').textContent='';$('customTitle').focus()};$('closeBuilder').onclick=()=>{$('builder').hidden=true;$('builderMessage').textContent=''};$('addConcept').onclick=()=>addConceptRow();$('saveModule').onclick=saveCustomModule;for(let i=0;i<3;i++)addConceptRow();requestAnimationFrame(draw)}).catch(()=>{document.querySelector('.hero p').textContent='De vragen konden niet worden geladen. Vernieuw de pagina om het opnieuw te proberen.'});
