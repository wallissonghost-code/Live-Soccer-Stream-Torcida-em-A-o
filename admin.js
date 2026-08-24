(() => {
  const CHANNEL = 'live-soccer-control-v1';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;
  const $ = (id) => document.getElementById(id);
  let selectedTeam = 'blue';
  const previewScore = { blue: 0, red: 0 };

  function send(type, payload = {}) {
    const command = { type, payload, id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, at: Date.now() };
    if (bc) bc.postMessage(command);
    try { localStorage.setItem(CHANNEL, JSON.stringify(command)); } catch (_) {}
    $('lastCommand').textContent = `${type} · ${new Date().toLocaleTimeString('pt-BR')}`;
  }

  function selectTeam(team) {
    selectedTeam = team;
    document.querySelectorAll('.team-option').forEach(btn => btn.classList.toggle('active', btn.dataset.team === team));
  }

  document.querySelectorAll('.team-option').forEach(btn => btn.addEventListener('click', () => selectTeam(btn.dataset.team)));

  document.querySelectorAll('.event').forEach(btn => btn.addEventListener('click', () => {
    const user = $('viewerName').value.trim() || 'AdminTest';
    send('gift', { gift: btn.dataset.gift, team: selectedTeam, user });
    btn.classList.remove('pulse');
    void btn.offsetWidth;
    btn.classList.add('pulse');
  }));

  $('sendComment').addEventListener('click', () => {
    const text = $('viewerComment').value.trim();
    if (!text) return;
    send('comment', { text, team: selectedTeam, user: $('viewerName').value.trim() || 'AdminTest' });
    $('viewerComment').value = '';
  });

  $('viewerComment').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('sendComment').click();
  });

  $('setViewers').addEventListener('click', () => {
    send('viewers', { value: Math.max(0, Number($('viewerCount').value) || 0) });
  });

  $('bluePossession').addEventListener('click', () => send('possession', { team: 'blue', number: 10 }));
  $('redPossession').addEventListener('click', () => send('possession', { team: 'red', number: 10 }));
  $('resetMatch').addEventListener('click', () => {
    if (confirm('Reiniciar a partida na tela do jogo?')) send('reset');
  });

  document.querySelectorAll('[data-score]').forEach(btn => btn.addEventListener('click', () => {
    const team = btn.dataset.score;
    const delta = Number(btn.dataset.delta);
    previewScore[team] = Math.max(0, previewScore[team] + delta);
    $(`${team}ScorePreview`).textContent = previewScore[team];
    // O placar manual será sincronizado remotamente quando o backend em tempo real entrar.
  }));

  const ua = navigator.userAgent;
  $('deviceType').textContent = /iPhone|Android.+Mobile/i.test(ua) ? 'Celular' : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  $('connectionLabel').textContent = bc ? 'Canal local ativo' : 'Fallback localStorage ativo';
})();
