const $ = (id) => document.getElementById(id);

const FIELD = { minX: 8, maxX: 92, minY: 5, maxY: 95 };
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const rand = (min, max) => min + Math.random() * (max - min);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const state = {
  blueScore: 0,
  redScore: 0,
  seconds: 0,
  energy: 70,
  combo: 0,
  applause: 0,
  viewers: 128,
  supportBlue: 50,
  possession: 'blue',
  activeBlue: 10,
  activeRed: 8,
  ball: { x: 50, y: 53, ownerTeam: 'blue', ownerNumber: 10, moving: false },
  nextAutoActionAt: 3,
  turboUntil: 0,
  shieldUntil: 0,
  specialUntil: 0,
  gifts: { ball: 0, box: 0, rose: 0, star: 0 },
  fans: {
    FutFan_BR: 12450,
    Lucas7: 9850,
    Maeve10: 8220,
    DaniCR7: 5530,
    Lariii: 4200
  }
};

const formations = {
  blue: [
    [1,50,92,true],[2,22,77],[3,40,80],[4,60,80],[5,78,77],
    [6,27,59],[8,72,58],[10,50,55],[7,32,40],[11,68,40],[9,50,31]
  ],
  red: [
    [1,50,8,true],[2,22,23],[3,40,20],[4,60,20],[5,78,23],
    [6,28,42],[8,50,45],[10,72,42],[7,34,60],[11,66,60],[9,50,69]
  ]
};

const players = [...formations.blue.map(([n,x,y,g]) => ({team:'blue',n,x,y,homeX:x,homeY:y,g:!!g})),
  ...formations.red.map(([n,x,y,g]) => ({team:'red',n,x,y,homeX:x,homeY:y,g:!!g}))];

const chatSamples = [
  ['Lucas7','chuta!','blue'],['Maeve10','passa!','red'],['FutFan_BR','GOOOOL!','blue'],
  ['Raulzito','usa turbo!','red'],['Lariii','defende!','blue'],['DaniCR7','que jogada 🔥','red'],
  ['ViniShow','poder especial!','blue'],['GabGol','vamos time!','red']
];

function getPlayer(team, n){ return players.find(p => p.team === team && p.n === n); }
function teamPlayers(team){ return players.filter(p => p.team === team); }
function activePlayer(team = state.possession){ return getPlayer(team, team === 'blue' ? state.activeBlue : state.activeRed); }
function attackDirection(team){ return team === 'blue' ? -1 : 1; }

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

function syncPlayerPositions(){
  players.forEach(p => {
    const el = document.querySelector(`.player.${p.team}[data-number="${p.n}"]`);
    if (!el) return;
    el.style.left = `${p.x}%`;
    el.style.top = `${p.y}%`;
    el.classList.toggle('active', (p.team === 'blue' && p.n === state.activeBlue) || (p.team === 'red' && p.n === state.activeRed));
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
  $('energyLabel').textContent = `${Math.round(state.energy)}%`;
  $('energyFooter').textContent = `${Math.round(state.energy)} / 100`;
  $('energyBar').style.width = `${state.energy}%`;
  $('combo').textContent = `x${state.combo}`;
  $('comboBar').style.width = `${Math.min(100,state.combo * 7)}%`;
  $('applause').textContent = state.applause.toLocaleString('pt-BR');
  $('viewers').textContent = Math.max(0,state.viewers).toLocaleString('pt-BR');
  $('blueSupport').textContent = `${Math.round(state.supportBlue)}%`;
  $('redSupport').textContent = `${Math.round(100 - state.supportBlue)}%`;
  $('supportLabel').textContent = `${Math.round(state.supportBlue)}%`;
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

function moveBall(x,y,duration=420){
  state.ball.x = x;
  state.ball.y = y;
  state.ball.moving = true;
  const ball = $('ball');
  ball.style.transitionDuration = `${duration}ms`;
  ball.style.left = `${x}%`;
  ball.style.top = `${y}%`;
  setTimeout(()=>state.ball.moving=false,duration);
}

function attachBallToOwner(){
  if (state.ball.moving || !state.ball.ownerTeam) return;
  const p = getPlayer(state.ball.ownerTeam, state.ball.ownerNumber);
  if (!p) return;
  const yOffset = state.ball.ownerTeam === 'blue' ? -2.3 : 2.3;
  state.ball.x = p.x;
  state.ball.y = p.y + yOffset;
  const ball = $('ball');
  ball.style.left = `${state.ball.x}%`;
  ball.style.top = `${state.ball.y}%`;
}

function rewardFan(name,pts){ state.fans[name] = (state.fans[name] || 0) + pts; }
function spend(cost){
  if(state.energy < cost){ flash('⚡ SEM ENERGIA'); return false; }
  state.energy -= cost;
  return true;
}

function setPossession(team, playerNumber){
  state.possession = team;
  if (team === 'blue') state.activeBlue = playerNumber;
  else state.activeRed = playerNumber;
  state.ball.ownerTeam = team;
  state.ball.ownerNumber = playerNumber;
  state.ball.moving = false;
  syncPlayerPositions();
  attachBallToOwner();
}

function tacticalMovement(){
  const poss = state.possession;
  const dir = attackDirection(poss);
  const carrier = activePlayer(poss);

  players.forEach(p => {
    if (p.g) {
      const ballX = state.ball.x;
      p.x += clamp(ballX - p.x, -1.3, 1.3) * 0.18;
      p.x = clamp(p.x, 39, 61);
      return;
    }

    const hasBall = p.team === poss && p.n === (p.team === 'blue' ? state.activeBlue : state.activeRed);
    const teamAttacking = p.team === poss;
    const boost = state.seconds < state.turboUntil && teamAttacking ? 1.8 : 1;

    let targetX = p.homeX;
    let targetY = p.homeY;

    if (teamAttacking) {
      targetY = p.homeY + dir * 8;
      targetX += (state.ball.x - 50) * 0.16;
      if (hasBall) {
        targetY += dir * 5;
        targetX += rand(-1.2,1.2);
      }
    } else {
      targetY = p.homeY - dir * 4;
      if (carrier) {
        targetX += clamp(carrier.x - p.homeX, -8, 8) * 0.45;
        targetY += clamp(carrier.y - p.homeY, -8, 8) * 0.3;
      }
    }

    const speed = hasBall ? 0.8 * boost : 0.48 * boost;
    p.x += clamp(targetX - p.x, -speed, speed) + rand(-0.08,0.08);
    p.y += clamp(targetY - p.y, -speed, speed) + rand(-0.08,0.08);
    p.x = clamp(p.x, FIELD.minX, FIELD.maxX);
    p.y = clamp(p.y, FIELD.minY + 6, FIELD.maxY - 6);
  });

  syncPlayerPositions();
  attachBallToOwner();
}

function candidatesForPass(team){
  const carrier = activePlayer(team);
  if (!carrier) return [];
  const dir = attackDirection(team);
  return teamPlayers(team)
    .filter(p => !p.g && p.n !== carrier.n)
    .map(p => ({p, score:(p.y - carrier.y) * -dir + rand(0,15) - Math.abs(p.x-carrier.x)*0.08}))
    .sort((a,b)=>b.score-a.score);
}

function pass({forced=false, user='Torcida'}={}){
  const team = state.possession;
  const carrier = activePlayer(team);
  const options = candidatesForPass(team);
  if (!carrier || !options.length) return;
  const receiver = options[Math.floor(Math.random()*Math.min(3,options.length))].p;
  const interceptChance = forced ? 0.06 : 0.14;

  state.ball.ownerTeam = null;
  moveBall(receiver.x, receiver.y, 430);
  setTimeout(()=>{
    if (Math.random() < interceptChance) {
      const opponents = teamPlayers(team === 'blue' ? 'red' : 'blue').filter(p=>!p.g).sort((a,b)=>dist(a,receiver)-dist(b,receiver));
      const thief = opponents[0];
      setPossession(thief.team, thief.n);
      state.combo = Math.max(0,state.combo-1);
      flash('CORTE!');
      return;
    }
    setPossession(team, receiver.n);
    state.combo += 1;
    state.applause += forced ? 600 : 160;
    if (forced) addChat(user,'🌹 pediu PASSE!',team);
    updateUI();
  },460);
}

function shotProbability(team, shooter){
  const goalY = team === 'blue' ? 5 : 95;
  const distance = Math.abs(shooter.y - goalY);
  let chance = 0.3 + clamp((55-distance)/100,0,0.28);
  if (state.seconds < state.turboUntil) chance += 0.08;
  if (state.seconds < state.specialUntil) chance += 0.18;
  const defendingTeam = team === 'blue' ? 'red' : 'blue';
  if (state.seconds < state.shieldUntil && defendingTeam === 'red') chance -= 0.2;
  return clamp(chance,0.12,0.82);
}

function shoot({forced=false,user='Torcida'}={}){
  if (forced && !spend(15)) return;
  const team = state.possession;
  const shooter = activePlayer(team);
  if (!shooter) return;
  const targetX = rand(43,57);
  const targetY = team === 'blue' ? 5.5 : 94.5;
  const chance = shotProbability(team, shooter) + (forced ? 0.1 : 0);
  state.ball.ownerTeam = null;
  state.combo += forced ? 2 : 1;
  state.applause += forced ? 1800 : 700;
  if (forced) addChat(user,'⚽ pediu CHUTE!',team);
  flash('⚽ CHUTE!');
  moveBall(targetX,targetY,520);

  setTimeout(()=>{
    const goal = Math.random() < chance;
    if(goal){
      if(team==='blue') state.blueScore++; else state.redScore++;
      flash('⚽ GOOOOOL!');
      state.applause += 10000;
      state.combo += 5;
      state.supportBlue = clamp(state.supportBlue + (team==='blue'?3:-3),10,90);
      for(let i=0;i<10;i++) setTimeout(()=>reaction(['⚽','❤️','⭐'][Math.floor(Math.random()*3)]),i*85);
      resetAfterGoal(team);
    } else {
      flash('🧤 DEFENDEU!');
      state.combo = Math.max(0,state.combo-1);
      const defender = team === 'blue' ? 'red' : 'blue';
      const keeper = getPlayer(defender,1);
      setPossession(defender,keeper.n);
      setTimeout(()=>goalkeeperRelease(defender),700);
    }
    updateUI();
  },560);
}

function goalkeeperRelease(team){
  const choices = teamPlayers(team).filter(p=>!p.g).sort((a,b)=>Math.abs(a.homeY-(team==='blue'?75:25))-Math.abs(b.homeY-(team==='blue'?75:25)));
  const target = choices[Math.floor(Math.random()*Math.min(4,choices.length))];
  if (!target) return;
  state.ball.ownerTeam = null;
  moveBall(target.x,target.y,500);
  setTimeout(()=>setPossession(team,target.n),520);
}

function resetPositions(){
  players.forEach(p=>{ p.x=p.homeX; p.y=p.homeY; });
  syncPlayerPositions();
}

function resetAfterGoal(scoringTeam){
  resetPositions();
  const kickoffTeam = scoringTeam === 'blue' ? 'red' : 'blue';
  const kickoff = getPlayer(kickoffTeam,8) || getPlayer(kickoffTeam,10);
  state.ball.x=50; state.ball.y=50; state.ball.moving=false;
  moveBall(50,50,250);
  setTimeout(()=>setPossession(kickoffTeam,kickoff.n),700);
}

function attemptTackle(){
  const carrier = activePlayer();
  if (!carrier || carrier.g) return;
  const other = state.possession === 'blue' ? 'red' : 'blue';
  const nearest = teamPlayers(other).filter(p=>!p.g).sort((a,b)=>dist(a,carrier)-dist(b,carrier))[0];
  if (!nearest || dist(nearest,carrier) > 8) return;
  const shielded = state.seconds < state.shieldUntil && state.possession === 'blue';
  const stealChance = shielded ? 0.04 : 0.12;
  if (Math.random() < stealChance) {
    setPossession(other,nearest.n);
    state.combo = 0;
    flash('DESARME!');
  }
}

function autoDecision(){
  if (state.ball.moving) return;
  const carrier = activePlayer();
  if (!carrier) return;
  const goalY = state.possession === 'blue' ? 5 : 95;
  const distanceToGoal = Math.abs(carrier.y-goalY);
  if (distanceToGoal < 35 && Math.random() < 0.58) shoot();
  else pass();
  state.nextAutoActionAt = state.seconds + Math.floor(rand(2,5));
}

function turbo(user='Torcida'){
  if(!spend(20)) return;
  state.turboUntil = state.seconds + 8;
  state.combo += 3;
  state.applause += 2500;
  state.supportBlue = clamp(state.supportBlue + (state.possession==='blue'?2:-2),10,90);
  addChat(user,'🔥 TURBO por 8s!',state.possession);
  reaction('🔥'); reaction('⭐');
  flash('🔥 TURBO!');
}

function defend(user='Torcida'){
  if(!spend(15)) return;
  state.shieldUntil = state.seconds + 10;
  state.combo += 1;
  state.applause += 1200;
  addChat(user,'🧤 defesa reforçada!',state.possession);
  reaction('🧤');
  flash('🧤 SUPER DEFESA');
}

function special(user='Torcida'){
  if(!spend(30)) return;
  state.specialUntil = state.seconds + 10;
  state.turboUntil = Math.max(state.turboUntil,state.seconds+6);
  state.combo += 5;
  state.applause += 6000;
  state.viewers += Math.floor(20+Math.random()*80);
  addChat(user,'🎁 PODER ESPECIAL!',state.possession);
  for(let i=0;i<10;i++) setTimeout(()=>reaction(['🎁','⭐','❤️','⚽'][Math.floor(Math.random()*4)]),i*80);
  flash('🎁 PODER ESPECIAL');
}

function handleAction(action){
  if(action==='pass') pass({forced:true,user:'Lucas7'});
  if(action==='shoot') shoot({forced:true,user:'FutFan_BR'});
  if(action==='turbo') turbo('DaniCR7');
  if(action==='defend') defend('Lariii');
  if(action==='special') special('Maeve10');
  updateUI();
}

document.querySelectorAll('.cmd').forEach(btn=>btn.addEventListener('click',()=>handleAction(btn.dataset.action)));

setInterval(()=>{
  tacticalMovement();
  attemptTackle();
},180);

setInterval(()=>{
  state.seconds++;
  if(state.seconds % 2 === 0) state.energy = Math.min(100,state.energy+1);
  if(state.seconds % 5 === 0) state.viewers += Math.floor(Math.random()*7)-2;
  if(state.seconds >= state.nextAutoActionAt) autoDecision();
  if(Math.random()<.32) reaction(['❤️','⚽','⭐','🌹'][Math.floor(Math.random()*4)]);
  updateUI();
},1000);

window.LiveSoccer = {
  triggerGift(type,user='Viewer',team='blue'){
    if(team === 'blue' || team === 'red') {
      if(state.possession !== team) {
        const p = getPlayer(team,10) || getPlayer(team,8);
        setPossession(team,p.n);
      }
    }
    const actions = {
      rose:()=>{ state.gifts.rose++; rewardFan(user,100); reaction('🌹'); pass({forced:true,user}); },
      ball:()=>{ state.gifts.ball++; rewardFan(user,250); reaction('⚽'); shoot({forced:true,user}); },
      star:()=>{ state.gifts.star++; rewardFan(user,350); reaction('⭐'); turbo(user); },
      box:()=>{ state.gifts.box++; rewardFan(user,700); reaction('🎁'); special(user); }
    };
    (actions[type] || actions.rose)();
    updateUI();
  },
  triggerComment(command,user='Viewer',team='blue'){
    const text = String(command).trim().toLowerCase();
    if(team !== state.possession && (team==='blue'||team==='red')) {
      const p = getPlayer(team,10) || getPlayer(team,8);
      setPossession(team,p.n);
    }
    if(text.includes('passe')) pass({forced:true,user});
    else if(text.includes('chute') || text.includes('gol')) shoot({forced:true,user});
    else if(text.includes('turbo')) turbo(user);
    else if(text.includes('defesa') || text.includes('defende')) defend(user);
    else if(text.includes('poder') || text.includes('especial')) special(user);
    addChat(user,text,team);
    updateUI();
  },
  setViewers(n){ state.viewers = Math.max(0,Number(n)||0); updateUI(); },
  setPossession(team,number=10){ if(team==='blue'||team==='red') setPossession(team,number); },
  getState(){ return JSON.parse(JSON.stringify(state)); },
  reset(){ location.reload(); }
};

renderPlayers();
renderChat();
setPossession('blue',10);
updateUI();