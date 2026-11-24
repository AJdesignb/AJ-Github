/* kārigaṛ — game logic, rendering and drag & drop. Data lives in data.js. */
{
const LOTUS=f=>`<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M24 4C30 14 30 26 24 36C18 26 18 14 24 4ZM24 36C14 34 6 26 4 14C14 16 22 24 24 36ZM24 36C34 34 42 26 44 14C34 16 26 24 24 36Z" fill="${f}" stroke="#1F1B18" stroke-width="2"/></svg>`;
const view=document.getElementById('view');
let S={phase:'setup',count:2,names:['','','','']};
let cont=null,pickCb=null;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const cur=()=>S.players[S.cur];
const nextP=()=>S.players[(S.cur+1)%S.players.length];
const log=t=>{S.log.unshift(t);S.log.length=Math.min(S.log.length,40);};
const countBy=a=>a.reduce((o,m)=>(o[m]=(o[m]||0)+1,o),{});
const removeRandom=(a,k)=>{const o=[];for(let i=0;i<k&&a.length;i++)o.push(a.splice(Math.floor(Math.random()*a.length),1)[0]);return o;};
const ini=n=>n.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';

function newGame(){
  const n=S.count,names=S.names.slice(0,n).map((x,i)=>(x||'').trim()||('Player '+(i+1)));
  const cd=[];Object.keys(CRAFTS).forEach(k=>cd.push(k,k));shuffle(cd);
  const deck=[];Object.keys(RES_COUNTS).forEach(m=>{for(let i=0;i<RES_COUNTS[m];i++)deck.push({t:'r',m});});
  Object.keys(SPECIALS).forEach(id=>deck.push({t:'s',id}));shuffle(deck);
  const players=names.map((nm,i)=>({name:nm,color:PCOL[i],hand:[],crafts:[cd.pop()],done:[],coins:0,gi:0,faded:[],seen:0}));
  S={phase:'handoff',count:S.count,names:S.names,players,cur:0,turn:0,craftDeck:cd,deck,disc:{A:[],B:[]},log:[],lastRound:false,modal:null,pool:null};
  log('The game begins. Everyone secretly drew one craft card.');render();
}
function beginTurn(){S.phase='turn';cur().seen=S.log.length;checkComplete(render);}
function afterAction(){
  S.modal=null;
  checkComplete(()=>{
    if(S.deck.length===0&&!S.lastRound){S.lastRound=true;log('The resource deck is empty. Final round!');}
    const nx=(S.cur+1)%S.players.length;S.turn++;
    if(S.lastRound&&nx===0){endGame();return;}
    S._next=nx;S.modal={type:'done'};render();
  });
}
function passOn(){S.cur=S._next;S.modal=null;S.phase='handoff';render();}
function checkComplete(done){
  const p=cur();
  for(let i=0;i<p.crafts.length;i++){
    const k=p.crafts[i],need=CRAFTS[k].need,have=countBy(p.hand);
    if(Object.keys(need).every(m=>(have[m]||0)>=need[m])){
      for(const m in need)for(let c=0;c<need[m];c++)p.hand.splice(p.hand.indexOf(m),1);
      p.crafts.splice(i,1);p.done.push(k);p.coins+=CRAFTS[k].coins;
      log(p.name+' completed '+CRAFTS[k].name+' (+'+CRAFTS[k].coins+' coins).');
      S.modal={type:'reveal',craft:k,tab:0};cont=()=>checkComplete(done);render();return;
    }
  }
  done();
}
/* actions */
function actDraw(){S.pool=[];drawStep();}
function drawStep(){
  while(S.pool.length<2&&S.deck.length){const c=S.deck.pop();if(c.t==='s'){showSpecial(c.id,drawStep);return;}S.pool.push(c.m);}
  if(S.pool.length===2){S.modal={type:'keep',kept:null,sel:null};render();return;}
  if(S.pool.length===1){cur().hand.push(S.pool[0]);log(cur().name+' kept the last resource card.');}
  S.pool=null;afterAction();
}
function keepResolve(keepIdx,pile){
  const p=cur(),kept=S.pool[keepIdx],other=S.pool[1-keepIdx];
  p.hand.push(kept);S.disc[pile].push(other);
  log(p.name+' kept a card and discarded '+MATS[other].n+' to pile '+pile+'.');
  S.pool=null;afterAction();
}
function actTake(pile){const m=S.disc[pile].pop();cur().hand.push(m);log(cur().name+' took '+MATS[m].n+' from pile '+pile+'.');afterAction();}
function actCraft(){cur().crafts.push(S.craftDeck.pop());log(cur().name+' drew another craft card.');afterAction();}
/* specials */
function showSpecial(id,after){S.modal={type:'special',id};cont=()=>resolveSpecial(id,after);render();}
function blocked(pl,id){if(pl.gi>0){pl.gi--;log(pl.name+'’s GI Tag blocked '+SPECIALS[id].name+'.');return true;}return false;}
function pick(o,fn){S.modal={type:'pick',title:o.title,lead:o.lead,items:o.items,count:o.count,sel:[]};pickCb=fn;render();}
function resolveSpecial(id,after){
  const p=cur(),nm=p.name;S.modal=null;
  switch(id){
    case'flood':
      if(p.hand.length>1&&!blocked(p,id)){const k=Math.floor(p.hand.length/2);removeRandom(p.hand,k);log('Monsoon Flood washed away '+k+' of '+nm+'’s cards.');}
      else if(p.hand.length<=1)log('Monsoon Flood hit '+nm+', but there was nothing to wash away.');
      return after();
    case'middleman':{
      if(!p.hand.length){log('The Middleman found nothing to take from '+nm+'.');return after();}
      if(blocked(p,id))return after();
      const need=Math.min(2,p.hand.length),to=nextP();
      return pick({title:'The Middleman takes his cut',lead:'Choose '+need+' card'+(need>1?'s':'')+' to give to '+to.name+'.',count:need,items:p.hand.map(m=>({label:MATS[m].n,c:MATS[m].c}))},sel=>{
        sel.sort((a,b)=>b-a).forEach(ix=>to.hand.push(p.hand.splice(ix,1)[0]));log('The Middleman: '+nm+' gave '+need+' card'+(need>1?'s':'')+' to '+to.name+'.');after();});}
    case'factory':
      S.players.forEach(pl=>{if(pl.hand.length&&!blocked(pl,id))removeRandom(pl.hand,1);});log('Factory Copy: everyone lost a resource card.');return after();
    case'shortage':{
      const keys=Object.keys(MATS);
      return pick({title:'Material Shortage',lead:'Name a material. Everyone discards all cards of that type, you included.',count:1,items:keys.map(m=>({label:MATS[m].n,c:MATS[m].c}))},sel=>{
        const m=keys[sel[0]];S.players.forEach(pl=>{if(pl.hand.includes(m)&&!blocked(pl,id))pl.hand=pl.hand.filter(x=>x!==m);});log('Material Shortage: '+nm+' named '+MATS[m].n+'.');after();});}
    case'apprentice':
      if(!p.crafts.length){log('Apprentice Leaves: '+nm+' had no unfinished crafts.');return after();}
      if(blocked(p,id))return after();
      return pick({title:'Your apprentice leaves',lead:'Choose one unfinished craft. It fades and costs you '+FADE+' coins.',count:1,items:p.crafts.map(k=>({label:CRAFTS[k].name,c:CRAFTS[k].panel}))},sel=>{
        const k=p.crafts.splice(sel[0],1)[0];p.coins-=FADE;p.faded.push(k);log('Apprentice Leaves: '+CRAFTS[k].name+' faded from '+nm+'’s workshop.');after();});
    case'family':{
      const drawn=[],aside=[];
      while(drawn.length<3&&S.deck.length){const c=S.deck.pop();if(c.t==='s')aside.push(c);else drawn.push(c.m);}
      aside.forEach(c=>S.deck.splice(Math.floor(Math.random()*(S.deck.length+1)),0,c));
      if(drawn.length<=2){drawn.forEach(m=>p.hand.push(m));log('Family Hands: '+nm+' gathered '+drawn.length+' extra card'+(drawn.length===1?'':'s')+'.');return after();}
      return pick({title:'Family Hands',lead:'Your family helped gather materials. Keep 2 of these 3.',count:2,items:drawn.map(m=>({label:MATS[m].n,c:MATS[m].c}))},sel=>{
        sel.forEach(ix=>p.hand.push(drawn[ix]));log('Family Hands: '+nm+' kept 2 extra resource cards.');after();});}
    case'master':{
      const items=[],refs=[];
      ['A','B'].forEach(pl=>S.disc[pl].forEach((m,ix)=>{items.push({label:MATS[m].n+' · pile '+pl,c:MATS[m].c});refs.push([pl,ix]);}));
      if(!items.length){log('Master’s Guidance: both discard piles were empty.');return after();}
      return pick({title:'Master’s Guidance',lead:'Take any one card from either discard pile.',count:1,items},sel=>{
        const r=refs[sel[0]],m=S.disc[r[0]].splice(r[1],1)[0];p.hand.push(m);log('Master’s Guidance: '+nm+' took '+MATS[m].n+'.');after();});}
    case'gi':p.gi++;log(nm+' earned a GI Tag.');return after();
  }
  after();
}
function endGame(){
  S.players.forEach(p=>{p.crafts.forEach(k=>{p.faded.push(k);p.coins-=FADE;});p.crafts=[];});
  S.phase='end';S.modal=null;render();
}
/* views */
function craftCard(k,hand){
  const c=CRAFTS[k],have=countBy(hand);
  const pills=Object.keys(c.need).map(m=>{const h=Math.min(have[m]||0,c.need[m]);return `<span class="pill${h>=c.need[m]?' ok':''}" style="--c:${MATS[m].c}"><i></i>${MATS[m].n} ${h}/${c.need[m]}</span>`;}).join('');
  const mot=[0,1,2,3,4].map(i=>LOTUS(i%2?c.panel:'#1F1B18')).join('');
  return `<article class="cc" style="--panel:${c.panel}" aria-label="${c.name} craft card"><div class="in"><div class="mot">${mot}</div><h3>${c.name}</h3><p>${c.region.split(',')[0]} · ${c.coins} coins</p><div class="img">Illustration<div class="pills">${pills}</div></div></div></article>`;
}
const resCard=(m,n,extra='')=>`<div class="rc ${extra}" style="--c:${MATS[m].c}"><i></i><span>${MATS[m].n}</span>${n>1?`<em>×${n}</em>`:''}</div>`;
const avatar=(p,s)=>`<span class="avatar" style="width:${s}px;height:${s}px;background:${p.color};font-size:${Math.round(s*.38)}px">${esc(ini(p.name))}</span>`;

function setupView(){
  const inputs=[...Array(S.count)].map((_,i)=>`<label class="namefield"><span class="dot" style="background:${PCOL[i]}"></span><input data-name="${i}" value="${esc(S.names[i])}" placeholder="Player ${i+1}" maxlength="14" aria-label="Player ${i+1} name" autocomplete="off"></label>`).join('');
  const seg=[2,3,4].map(n=>`<button type="button" data-a="count" data-n="${n}" aria-pressed="${S.count===n}">${n}</button>`).join('');
  return `<div class="toran"><img src="assets/toran-large.svg" alt=""></div><div class="setup">
  <div class="top"><span class="eyebrow">A game about the crafts of India</span><button class="iconbtn" data-a="rules" aria-label="How to play" style="border-radius:50%;font:600 18px var(--card)">?</button></div>
  <div><h1 class="logo">kārigaṛ</h1><p class="muted" style="font-size:17px;margin-top:4px">Collect the materials. Finish the craft. Don’t let it fade.</p></div>
  <section class="panel" aria-label="Players"><div class="top"><span class="eyebrow">Who’s playing?</span><div class="seg" role="group" aria-label="Number of players">${seg}</div></div>${inputs}</section>
  <div style="margin-top:auto;display:flex;flex-direction:column;gap:6px;align-items:center"><button class="btn wide" data-a="start">Start the game</button><span class="muted" style="font-size:13px">One phone · pass it around · 2–4 players</span></div></div>`;
}
function handoffView(){
  const p=cur(),recent=S.log.slice(0,Math.max(1,Math.min(4,S.log.length-p.seen))).map((t,i)=>`<p${i?' class="muted"':''}>${esc(t)}</p>`).join('');
  return `<div class="toran"><img src="assets/toran-small.svg" alt=""></div><div class="handoff">
  <span style="font:400 26px var(--display)">kārigaṛ</span>
  <div style="margin-top:14px;width:150px;height:150px;border-radius:50%;border:2px dashed ${p.color};display:flex;align-items:center;justify-content:center">${avatar(p,118)}</div>
  <p class="muted" style="font-size:17px;margin-top:10px">Pass the phone to</p>
  <h1 style="font:400 54px/1.05 var(--display)">${esc(p.name)}</h1>
  <p class="muted">Everyone else, look away. Your cards are secret.</p>
  <section class="recap" style="margin-top:10px"><span class="eyebrow">Latest</span>${recent}</section>
  <div style="margin-top:auto;width:100%;padding-top:12px"><button class="btn wide" data-a="begin"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>I’m ${esc(p.name)}, show my cards</button></div></div>`;
}
function turnView(){
  const p=cur(),round=Math.floor(S.turn/S.players.length)+1,idle=!S.modal;
  const opps=S.players.filter((_,i)=>i!==S.cur).map(o=>`<div class="opp">${avatar(o,30)}<div><b>${esc(o.name)}</b><br><span>${o.hand.length} cards · ${o.coins} coins${o.done.length?' · '+o.done.length+'✓':''}</span></div></div>`).join('');
  const canCraft=S.craftDeck.length>0&&p.crafts.length<3;
  const pile=k=>{const a=S.disc[k],t=a[a.length-1];return `<div class="slot" data-pile="${k}">${t?`<div data-drag="pile${k}">${resCard(t,1)}</div>`:'<div class="back empty"></div>'}Pile ${k} · ${a.length}</div>`;};
  const table=`<section class="table" aria-label="Table">
   <div class="slot">${canCraft?'<div class="back craft" data-drag="craft"></div>':'<div class="back empty"></div>'}Crafts · ${S.craftDeck.length}</div>
   <div class="slot">${S.deck.length?`<div class="back res${idle?' bob':''}" data-drag="deck"><b>${S.deck.length}</b></div>`:'<div class="back empty"></div>'}Resources</div>
   ${pile('A')}${pile('B')}</section>`;
  const crafts=p.crafts.map(k=>craftCard(k,p.hand)).join('')+(p.crafts.length<3?`<div class="emptycraft">Drag a craft card here to take on another craft</div>`:'');
  const g=countBy(p.hand),hand=Object.keys(MATS).filter(m=>g[m]).map(m=>resCard(m,g[m])).join('')||'<span class="muted" style="font-size:14px;align-self:center">No resources yet. Drag the resource deck here.</span>';
  const nothing=!S.deck.length&&!S.disc.A.length&&!S.disc.B.length&&!canCraft;
  return `<div class="toran"><img src="assets/toran-small.svg" alt=""></div><div class="turn">
   <div class="top">${avatar(p,34)}<div style="flex:1;line-height:1.1"><div style="font:400 21px var(--display)">${esc(p.name)}’s turn</div><div class="muted" style="font-size:13px">Round ${round}${S.lastRound?' · final round':''} · make one move</div></div>
     <button class="iconbtn" data-a="rules" aria-label="How to play"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/></svg></button>
     <button class="iconbtn" data-a="askNew" aria-label="New game"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg></button></div>
   <section class="opps" aria-label="Other players">${opps}</section>
   ${table}
   <p class="hint" id="hint">${nothing?'Nothing left to take.':'Drag a card from the table, or tap it'}</p>
   ${nothing?'<button class="btn ghost" data-a="pass">Pass this turn</button>':''}
   <section class="crafts" data-drop="crafts" aria-label="Your crafts"><div class="top"><span class="eyebrow">Your crafts · ${p.crafts.length} of 3</span>${p.crafts.length>1?'<span class="muted" style="font-size:12px">swipe ›</span>':''}</div><div class="crow">${crafts}</div></section>
   <section class="tray" data-drop="hand" aria-label="Your hand">
     <div class="top"><span class="eyebrow">Your hand · ${p.hand.length}</span><span style="display:flex;gap:10px;align-items:center;font-weight:600;font-size:14px">${p.gi?`<span class="coin gi">${p.gi}</span>GI`:''}<span class="coin">${p.coins}</span>coins</span></div>
     <div class="hand">${hand}</div>
     <p class="log">${esc(S.log[0]||'')}</p>
   </section></div>`;
}
function endView(){
  const r=S.players.slice().sort((a,b)=>b.coins-a.coins||b.done.length-a.done.length),t=r[0];
  const rows=r.map(p=>{const w=p.coins===t.coins&&p.done.length===t.done.length;return `<tr${w?' class="win"':''}><td>${esc(p.name)}${w?' · winner':''}</td><td class="n">${p.coins}</td><td>${p.done.map(k=>CRAFTS[k].name).join(', ')||'None'}</td><td>${p.faded.map(k=>CRAFTS[k].name).join(', ')||'None'}</td></tr>`;}).join('');
  return `<div class="toran"><img src="assets/toran-small.svg" alt=""></div><div class="setup" style="text-align:left">
   <span class="eyebrow">The season is over</span><h1 style="font:400 48px/1 var(--display)">${esc(t.name)} wins</h1>
   <p class="muted">${t.coins} coins · ${t.done.length} craft${t.done.length===1?'':'s'} completed</p>
   <div class="panel" style="overflow-x:auto"><table class="score"><thead><tr><th>Player</th><th>Coins</th><th>Made</th><th>Faded</th></tr></thead><tbody>${rows}</tbody></table></div>
   <p class="muted" style="font-size:14px">Each faded craft cost ${FADE} coins.</p>
   <button class="btn wide" data-a="again" style="margin-top:auto">Play again</button></div>`;
}
function modalView(){
  const m=S.modal;if(!m)return'';let b='';
  if(m.type==='rules')b=`<h2>How to play</h2><ol class="rules"><li>Everyone secretly holds a craft card listing the materials it needs.</li><li>On your turn make one move: drag the resource deck to your hand (draw 2, keep 1, discard 1), drag the top of pile A or B to your hand, or drag the craft deck to your crafts (hold up to 3). Tapping works too.</li><li>Special cards hide in the resource deck and act the moment they’re drawn.</li><li>Gather every material on a craft card to complete it and earn its coins.</li><li>When the resource deck runs out, finish the round. Unfinished crafts fade and cost ${FADE} coins each. Most coins wins.</li></ol><button class="btn wide" data-a="close">Got it</button>`;
  else if(m.type==='confirmNew')b=`<h2>Start a new game?</h2><p class="muted" style="text-align:center">This ends the current game.</p><div style="display:flex;gap:8px;width:100%"><button class="btn ghost" style="flex:1" data-a="close">Keep playing</button><button class="btn" style="flex:1" data-a="again">New game</button></div>`;
  else if(m.type==='keep'){
    const kept=m.kept;
    const cards=S.pool.map((mat,i)=>kept===i?`<div class="rc big" style="--c:${MATS[mat].c};opacity:.35"><i></i><span>Kept</span></div>`:`<div data-drag="k${i}" data-i="${i}">${resCard(mat,1,'big'+(m.sel===i?' sel':''))}</div>`).join('');
    const msg=kept==null?(m.sel==null?'Drag one card into your hand, the other onto a pile. Or tap a card to keep it.':'Now tap a pile for the other card.'):'Drag the other card onto pile A or B.';
    b=`<h2>Keep one, discard one</h2><p class="muted" style="text-align:center;font-size:14px">${msg}</p>
     <div class="zones"><button type="button" class="zone" data-drop="kA" data-a="kpile" data-p="A">Discard to<br>pile A</button><button type="button" class="zone" data-drop="kB" data-a="kpile" data-p="B">Discard to<br>pile B</button></div>
     <div class="pair">${cards}</div>
     <div class="zones"><div class="zone" data-drop="khand" style="min-height:72px">${kept==null?'Your hand · keep one here':'Kept in your hand ✓'}</div></div>`;
  } else if(m.type==='special'){
    const sp=SPECIALS[m.id],d=sp.kind==='d',c=d?'#8E2333':'#5E6B2E',t=d?'#F6D9DE':'#E3E8CF';
    b=`<span class="eyebrow" style="color:${c}">${d?'You drew a disruption':'A helping hand'}</span><article class="spcard" style="--c:${c};--t:${t}"><div class="k"><span>${d?'DISRUPTION':'HELPER'}</span><span>NOW</span></div><div class="art">Illustration: ${sp.art}</div><div class="bd"><h3>${sp.name}</h3><p style="font-weight:600">${sp.eff}</p><p class="fact"><b style="display:block;font-size:10px;letter-spacing:.12em;color:#5A4E44">REAL FACT</b>Coming soon: a verified fact about artisan life.</p></div></article><button class="btn wide" data-a="spOk">${m.id==='gi'?'Keep the GI Tag':'Resolve it'}</button>`;
  } else if(m.type==='pick'){
    const it=m.items.map((x,i)=>`<button type="button" class="pick" data-a="pickItem" data-i="${i}" aria-pressed="${m.sel.includes(i)}"><span class="dot" style="background:${x.c};width:11px;height:11px"></span>${esc(x.label)}</button>`).join('');
    b=`<h2>${esc(m.title)}</h2><p class="muted" style="text-align:center">${esc(m.lead)}</p><div class="picks">${it}</div><button class="btn wide" data-a="pickOk"${m.sel.length===m.count?'':' disabled'}>Confirm</button>`;
  } else if(m.type==='reveal'){
    const c=CRAFTS[m.craft];
    const tabs=INFO.map((x,i)=>`<button type="button" class="tab" role="tab" data-a="tab" data-i="${i}" aria-selected="${m.tab===i}">${x}</button>`).join('');
    b=`<span class="eyebrow">Craft complete</span><div class="medal"><div>Illustration: the artisan or craft emblem</div></div><h2 style="font-size:36px">${c.name}</h2><p class="muted">${esc(cur().name)} is now a kārigar of ${c.region}</p><span style="display:flex;align-items:center;gap:8px;padding:4px 14px 4px 4px;border-radius:999px;background:#fff;font-weight:700"><span class="coin" style="background:var(--mustard);color:var(--dark)">+${c.coins}</span>coins</span>
     <div class="info"><div class="tabs" role="tablist">${tabs}</div><p style="font-size:15px">Research for “${INFO[m.tab].toLowerCase()}” goes here once it’s verified.</p></div><button class="btn wide" data-a="revealOk">Continue</button>`;
  } else if(m.type==='done'){
    const nx=S.players[S._next];
    b=`<h2>Nice move.</h2><p class="muted" style="text-align:center">${esc(S.log[0]||'')}</p><button class="btn wide" data-a="passOn">Hide my cards · pass to ${esc(nx.name)}</button>`;
  }
  return `<div class="scrim"${m.type==='keep'?' style="background:rgba(74,16,28,.3)"':''}><div class="sheet" role="dialog" aria-modal="true"><span class="grab"></span>${b}</div></div>`;
}
function render(){
  const main=S.phase==='setup'?setupView():S.phase==='handoff'?handoffView():S.phase==='end'?endView():turnView();
  view.innerHTML=main+modalView();
}
/* drag and tap */
function allowed(src){
  const m=S.modal,p=S.players&&cur();
  if(S.phase!=='turn')return[];
  if(!m){if(src==='deck'&&S.deck.length)return['hand'];if(src==='pileA'&&S.disc.A.length)return['hand'];if(src==='pileB'&&S.disc.B.length)return['hand'];if(src==='craft'&&S.craftDeck.length&&p.crafts.length<3)return['crafts'];return[];}
  if(m.type==='keep'&&/^k[01]$/.test(src)){const i=+src[1];if(m.kept===i)return[];return m.kept==null?['khand','kA','kB']:['kA','kB'];}
  return[];
}
function onTap(src){
  if(src==='deck')actDraw();else if(src==='pileA')actTake('A');else if(src==='pileB')actTake('B');else if(src==='craft')actCraft();
  else if(/^k[01]$/.test(src)){const m=S.modal,i=+src[1];if(m.kept==null){m.sel=i;render();}}
}
function onDrop(src,tgt){
  if(['deck','pileA','pileB','craft'].includes(src))return onTap(src);
  const m=S.modal,i=+src[1];
  if(tgt==='khand'){m.kept=i;m.sel=null;render();return;}
  const pile=tgt==='kA'?'A':'B';
  keepResolve(m.kept!=null?m.kept:1-i,pile);
}
let D=null;
view.addEventListener('pointerdown',e=>{
  const el=e.target.closest('[data-drag]');if(!el)return;
  const src=el.dataset.drag;if(!allowed(src).length)return;
  e.preventDefault();
  D={src,el,x:e.clientX,y:e.clientY,moved:false,ghost:null,over:null,id:e.pointerId};
});
window.addEventListener('pointermove',e=>{
  if(!D)return;
  if(!D.moved&&Math.hypot(e.clientX-D.x,e.clientY-D.y)>7){
    D.moved=true;const g=D.el.firstElementChild&&D.el.classList.contains('back')?D.el.cloneNode(true):(D.el.firstElementChild||D.el).cloneNode(true);
    g.classList.add('ghost');g.classList.remove('bob','sel');document.body.appendChild(g);D.ghost=g;
    D.el.style.opacity='.3';
    allowed(D.src).forEach(z=>view.querySelectorAll(`[data-drop="${z}"]`).forEach(n=>n.classList.add('ok')));
    const h=document.getElementById('hint');if(h)h.textContent='Drop it where it glows';
  }
  if(!D.moved)return;
  D.ghost.style.left=e.clientX+'px';D.ghost.style.top=e.clientY+'px';
  D.ghost.style.display='none';const under=document.elementFromPoint(e.clientX,e.clientY);D.ghost.style.display='';
  const z=under&&under.closest('[data-drop]'),name=z&&allowed(D.src).includes(z.dataset.drop)?z.dataset.drop:null;
  if(name!==D.over){view.querySelectorAll('.over').forEach(n=>n.classList.remove('over'));if(name)view.querySelectorAll(`[data-drop="${name}"]`).forEach(n=>n.classList.add('over'));D.over=name;}
});
function endDrag(cancel){
  if(!D)return;const d=D;D=null;
  if(d.ghost)d.ghost.remove();
  if(!d.moved){if(!cancel)onTap(d.src);return;}
  if(!cancel&&d.over){onDrop(d.src,d.over);return;}
  render();
}
window.addEventListener('pointerup',()=>endDrag(false));
window.addEventListener('pointercancel',()=>endDrag(true));
/* clicks */
view.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
  switch(a){
    case'count':S.count=+b.dataset.n;render();break;
    case'start':newGame();break;
    case'begin':beginTurn();break;
    case'pass':log(cur().name+' passed.');afterAction();break;
    case'passOn':passOn();break;
    case'rules':S.modal={type:'rules',prev:S.modal};render();break;
    case'askNew':S.modal={type:'confirmNew'};render();break;
    case'close':S.modal=S.modal&&S.modal.prev||null;render();break;
    case'again':S={phase:'setup',count:S.count,names:S.names};render();break;
    case'spOk':case'revealOk':{S.modal=null;const f=cont;cont=null;f?f():render();break;}
    case'tab':S.modal.tab=+b.dataset.i;render();break;
    case'kpile':{const m=S.modal;if(!m||m.type!=='keep')break;if(m.kept!=null)keepResolve(m.kept,b.dataset.p);else if(m.sel!=null)keepResolve(m.sel,b.dataset.p);break;}
    case'pickItem':{const i=+b.dataset.i,m=S.modal,at=m.sel.indexOf(i);if(at>-1)m.sel.splice(at,1);else if(m.count===1)m.sel=[i];else if(m.sel.length<m.count)m.sel.push(i);render();break;}
    case'pickOk':{const s=S.modal.sel.slice();S.modal=null;const g=pickCb;pickCb=null;g&&g(s);break;}
  }
});
view.addEventListener('input',e=>{if(e.target.dataset.name!=null)S.names[+e.target.dataset.name]=e.target.value;});
render();

}
