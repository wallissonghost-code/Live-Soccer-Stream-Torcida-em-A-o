(() => {
  const $ = (id) => document.getElementById(id);
  const config = window.LiveSoccerRealtime.resolveConfig();
  let selectedTeam = 'blue';
  let previewScore = { blue: 0, red: 0 };
  let transport = window.LiveSoccerRealtime.create(config);

  $('roomCode').value = config.room;
  $('supabaseUrl').value = config.url || '';
  $('supabaseKey').value = config.key || '';

  function statusText(status) {
    return ({ online: 'Realtime online', connecting: 'Conectando...', degraded: 'Realtime degradado', local: 'Somente local' })[status] || status;
  }

  function refreshShareLink() {
    const share = transport.shareUrl('./');
    $('gameShareUrl').value = share;
    $('openGameLink').href = share;
    $('roomStatus').textContent = transport.config.room;
  }

  function bindTransport() {
    transport.onStatus((status) => {
      $('connectionLabel').textContent = statusText(status);
      $('transportLabel').textContent = status === 'online' ? 'Supabase Realtime + local fallback' : 'BroadcastChannel/localStorage';
      $('connectionDot').dataset.status = status;
    });

    transport.onMessage((message, source) => {
      if (message.event !== 'state') return;
      const state = message.payload || {};
      previewScore = { blue: Number(state.blueScore) || 0, red: Number(state.redScore) || 0 };
      $('blueScorePreview').textContent = previewScore.blue;
      $('redScorePreview').textContent = previewScore.red;
      if (typeof state.viewers !== 'undefined') $('viewerCount').value = Math.max(0, Number(state.viewers) || 0);
      $('lastState').textContent = `${source} · ${new Date(message.at || Date.now()).toLocaleTimeString('pt-BR')}`;
    });
  }

  async function connect() {
    const next = {
      room: window.LiveSoccerRealtime.cleanRoom($('roomCode').value),
      url: $('supabaseUrl').value.trim(),
      key: $('supabaseKey').value.trim()
    };
    transport.destroy();
    transport = window.LiveSoccerRealtime.create(next);
    bindTransport();
    refreshShareLink();
    await transport.connect(next);
  }

  async function send(type, payload = {}) {
    const command = await transport.send('command', { type, payload });
    $('lastCommand').textContent = `${type} · ${new Date(command.at).toLocaleTimeString('pt-BR')}`;
  }

  function selectTeam(team) {
    selectedTeam = team;
    document.querySelectorAll('.team-option').forEach(btn => btn.classList.toggle('active', btn.dataset.team === team));
  }

  document.querySelectorAll('.team-option').forEach(btn => btn.addEventListener('click', () => selectTeam(btn.dataset.team)));
  document.querySelectorAll('.event').forEach(btn => btn.addEventListener('click', () => {
    const user = $('viewerName').value.trim() || 'AdminTest';
    send('gift', { gift: btn.dataset.gift, team: selectedTeam, user });
    btn.classList.remove('pulse'); void btn.offsetWidth; btn.classList.add('pulse');
  }));

  $('sendComment').addEventListener('click', () => {
    const text = $('viewerComment').value.trim();
    if (!text) return;
    send('comment', { text, team: selectedTeam, user: $('viewerName').value.trim() || 'AdminTest' });
    $('viewerComment').value = '';
  });
  $('viewerComment').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('sendComment').click(); });
  $('setViewers').addEventListener('click', () => send('viewers', { value: Math.max(0, Number($('viewerCount').value) || 0) }));
  $('bluePossession').addEventListener('click', () => send('possession', { team: 'blue', number: 10 }));
  $('redPossession').addEventListener('click', () => send('possession', { team: 'red', number: 10 }));
  $('resetMatch').addEventListener('click', () => { if (confirm('Reiniciar a partida na tela do jogo?')) send('reset'); });

  document.querySelectorAll('[data-score]').forEach(btn => btn.addEventListener('click', () => {
    const team = btn.dataset.score;
    previewScore[team] = Math.max(0, previewScore[team] + Number(btn.dataset.delta));
    $(`${team}ScorePreview`).textContent = previewScore[team];
    send('score', { blue: previewScore.blue, red: previewScore.red });
  }));

  $('connectRealtime').addEventListener('click', connect);
  $('copyGameLink').addEventListener('click', async () => {
    refreshShareLink();
    try {
      await navigator.clipboard.writeText($('gameShareUrl').value);
      $('copyGameLink').textContent = 'Copiado ✓';
      setTimeout(() => $('copyGameLink').textContent = 'Copiar link', 1300);
    } catch (_) {
      $('gameShareUrl').select();
      document.execCommand?.('copy');
    }
  });

  const ua = navigator.userAgent;
  $('deviceType').textContent = /iPhone|Android.+Mobile/i.test(ua) ? 'Celular' : /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Desktop';
  bindTransport();
  refreshShareLink();
  transport.connect();
  window.addEventListener('beforeunload', () => transport.destroy());
})();
