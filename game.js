const $ = (id) => document.getElementById(id);

const state = {
  blueScore: 0,
  redScore: 0,
  seconds: 0,
  energy: 60,
  combo: 0,
  applause: 0,
  viewers: 128,
  supportBlue: 50,
  possession: 'blue',
  activeBlue: 10,
  activeRed: 8,
  gifts: { ball: 0, box: 0, rose: 0, star: 0 },
  fans: {
    FutFan_BR: 12450,
    Lucas7: 9850,
    Maeve10: 8220,
    DaniCR7: 5530,
    Lariii: 4200
  }
};

const players = [
  { team:'blue', n:1, x:50, y:92, g:true },
  { team:'blue', n:2, x:25, y:76 }, { team:'blue', n:3, x:42, y:79 },
  { team:'blue', n:4, x:58, y:79 }, { team:'blue', n:5, x:75, y:76 },
  { team:'blue', n:6, x:28, y:58 }, { team:'blue', n:8, x:70, y:57 },
  { team:'blue', n:10, x:50, y:53 }, { team:'blue', n:7, x:34, y:40 },
  { team:'blue', n:11, x:65, y:39 }, { team:'blue', n:9, x:50, y:31 },

  { team:'red', n:1, x:50, y:8, g:true },
  { team:'red', n:2, x:24, y:24 }, { team:'red', n:3, x:42, y:21 },
  { team:'red', n:4, x:58, y:21 }, { team:'red', n:5, x:76, y:24 },
  { team:'red', n:6, x:31, y:42 }, { team:'red', n:8, x:50, y:46 },
  { team:'red', n:10, x:69, y:42 }, { team:'red', n:7, x:35, y:61 },
  { team:'red', n:11, x:65, y:61 }, { team:'red', n:9, x:50, y:68 }
];

const chatSamples = [
  ['Lucas7','chuta!','blue'],['Maeve10','passa!','red'],['FutFan_BR','GOOOOL!','blue'],
  ['Raulzito','usa turbo!','red'],['Lariii','defende!','blue'],['DaniCR7','que jogada 🔥','red'],
  ['ViniShow','poder especial!','blue'],['GabGol','vamos time!','red']
];

function renderPlayers(){
  const layer = $('playersLayer');
  layer.innerHTML = '';
  players.forEach(p => {
    const el = document.createElement('div');
    el.className = `player ${p.team}${p.g ? ' goalkeeper' : ''}`;
    if ((p.team === 'blue' && p.n === state.activeBlue) || (p.team === 'red' && p.n === state.activeRed)) el.classList.add('active');
    el.dataset.team = p.team;
    el.dataset.number = p.n;
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
    el.textContent = p.n;
    layer.appendChild(el);
  });
}

function renderChat(){
  $('chatList').innerHTML = chatSamples.map(([name,msg,team]) =>
    `<div class="chat-item ${team === 'red' ? 'red' : ''}"><b>${name}</b><span>${msg}</span></div>`
  ).join('');
}

function formatClock(){
  const m = String(Math.floor(state.seconds / 60)).padStart(2,'0');
  const s = String(state.seconds % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function updateUI(){
  $('blueScore').textContent = state.blueScore;
  $('redScore').textContent = state.redScore;
  $('clock').textContent = formatClock();
  $('energyLabel').textContent = `${state.energy}%`;
  $('energyFooter').textContent = `${state.energy} / 100`;
  $('energyBar').style.width = `${state.energy}%`;
  $('combo').textContent = `x${state.combo}`;
  $('comboBar').style.width = `${Math.min(100,state.combo * 7)}%`;
  $('applause').textContent = state.applause.toLocaleString('pt-BR');
  $('viewers').textContent = state.viewers.toLocaleString('pt-BR');
  $('blueSupport').textContent = `${state.supportBlue}%`;
  $('redSupport').textContent = `${100 - state.supportBlue}%`;
  $('supportLabel').textContent = `${state.supportBlue}%`;
  $('supportBar').style.width = `${state.supportBlue}%`;
  $('giftBall').textContent = state.gifts.ball;
  $('giftBox').textContent = state.gifts.box;
  $('giftRose').textContent = state.gifts.rose;
  $('giftStar').textContent = state.gifts.star;
  renderRanking();
}

function renderRanking(){
  const sorted = Object.entries(state.fans).sort((a,b)=>b[1]-a[1]).slice(0,3);
  $('ranking').innerHTML = `<div class="rank-list">${sorted.map(([n,p],i)=>`<div class="rank-chip">${i+1}º <b>${n}</b> · ${p.toLocaleString('pt-BR')} ⭐</div>`).join('')}</div>`;
}

function flash(text){
  const el = $('eventFlash');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function reaction(icon){
  const el = document.createElement('div');
  el.className = 'reaction';
  el.textContent = icon;
  el.style.right = `${8 + Math.random()*45}px`;
  $('reactions').appendChild(el);
  setTimeout(()=>el.remove(),3900);
}

function addChat(name,msg,team='blue'){
  const item = document.createElement('div');
  item.className = `chat-item ${team === 'red' ? 'red' : ''}`;
  item.innerHTML = `<b>${name}</b><span>${msg}</span>`;
  $('chatList').prepend(item);
  while ($('chatList').children.length > 8) $('chatList').lastChild.remove();
}

function moveBall(x,y){
  $('ball').style.left = `${x}%`;
  $('ball').style.top = `${y}%`;
}

function findPlayer(team,n){ return players.find(p=>p.team===team && p.n===n); }

function chooseTeammate(team){
  const pool = players.filter(p=>p.team===team && !p.g);
  return pool[Math.floor(Math.random()*pool.length)];
}

function spend(cost){
  if(state.energy < cost){ flash('⚡ SEM ENERGIA'); return false; }
  state.energy -= cost;
  return true;
}

function rewardFan(name,pts){ state.fans[name] = (state.fans[name] || 0) + pts; }

function pass(){
  const team = state.possession;
  const p = chooseTeammate(team);
  if(team==='blue') state.activeBlue = p.n; else state.activeRed = p.n;
  moveBall(p.x,p.y);
  state.combo += 1;
  state.applause += 450;
  state.gifts.rose += 1;
  rewardFan('Lucas7',120);
  reaction('🌹');
  addChat('Lucas7','🌹 passe!','blue');
  flash('PASSE!');
  renderPlayers();
}

function shoot(){
  if(!spend(15)) return;
  const blue = state.possession === 'blue';
  moveBall(50, blue ? 8 : 92);
  state.gifts.ball += 1;
  state.combo += 2;
  state.applause += 1800;
  rewardFan('FutFan_BR',300);
  reaction('⚽');
  addChat('FutFan_BR','⚽ CHUTA!','blue');
  setTimeout(()=>{
    const goal = Math.random() < .62;
    if(goal){
      if(blue) state.blueScore++; else state.redScore++;
      flash('⚽ GOOOOOL!');
      state.applause += 10000;
      state.combo += 5;
      for(let i=0;i<8;i++) setTimeout(()=>reaction(['⚽','❤️','⭐'][Math.floor(Math.random()*3)]),i*90);
    } else {
      flash('🧤 DEFENDEU!');
      state.combo = Math.max(0,state.combo-1);
    }
    moveBall(50,50);
    state.possession = blue ? 'red' : 'blue';
    updateUI();
  },520);
}

function turbo(){
  if(!spend(20)) return;
  state.combo += 3;
  state.applause += 2500;
  state.gifts.star += 1;
  state.supportBlue = Math.min(90,state.supportBlue+3);
  rewardFan('DaniCR7',240);
  reaction('🔥'); reaction('⭐');
  addChat('DaniCR7','🔥 TURBO ATIVADO!','red');
  flash('🔥 TURBO!');
  document.querySelectorAll(`.player.${state.possession}`).forEach(el=>{el.style.transform='translate(-50%,-50%) scale(1.25)';setTimeout(()=>el.style.transform='translate(-50%,-50%)',500)});
}

function defend(){
  if(!spend(15)) return;
  state.combo += 1;
  state.gifts.ball += 1;
  state.applause += 1200;
  rewardFan('Lariii',180);
  reaction('🧤');
  addChat('Lariii','🧤 fecha o gol!','blue');
  flash('🧤 SUPER DEFESA');
}

function special(){
  if(!spend(30)) return;
  state.combo += 5;
  state.gifts.box += 1;
  state.applause += 6000;
  state.viewers += Math.floor(20+Math.random()*80);
  rewardFan('Maeve10',500);
  addChat('Maeve10','🎁 PODER ESPECIAL!','red');
  for(let i=0;i<10;i++) setTimeout(()=>reaction(['🎁','⭐','❤️','⚽'][Math.floor(Math.random()*4)]),i*80);
  flash('🎁 PODER ESPECIAL');
}

function handleAction(action){
  ({pass,shoot,turbo,defend,special}[action] || (()=>{}))();
  updateUI();
}

document.querySelectorAll('.cmd').forEach(btn=>btn.addEventListener('click',()=>handleAction(btn.dataset.action)));

setInterval(()=>{
  state.seconds++;
  if(state.seconds % 3 === 0) state.energy = Math.min(100,state.energy+1);
  if(state.seconds % 5 === 0) state.viewers += Math.floor(Math.random()*7)-2;
  if(Math.random()<.34) reaction(['❤️','⚽','⭐','🌹'][Math.floor(Math.random()*4)]);
  updateUI();
},1000);

window.LiveSoccer = {
  triggerGift(type,user='Viewer',team='blue'){
    const map = {
      rose:()=>{state.gifts.rose++; rewardFan(user,100); addChat(user,'🌹 enviou rosa',team); pass();},
      ball:()=>{state.gifts.ball++; rewardFan(user,250); addChat(user,'⚽ pediu chute',team); shoot();},
      star:()=>{state.gifts.star++; rewardFan(user,350); addChat(user,'⭐ ativou turbo',team); turbo();},
      box:()=>{state.gifts.box++; rewardFan(user,700); addChat(user,'🎁 poder especial',team); special();}
    };
    (map[type] || map.rose)();
    updateUI();
  },
  setViewers(n){ state.viewers = Math.max(0,Number(n)||0); updateUI(); },
  reset(){ location.reload(); }
};

renderPlayers();
renderChat();
moveBall(50,53);
updateUI();