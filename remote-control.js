(() => {
  const realtime = window.LiveSoccerRealtime?.create();
  if (!realtime || !window.LiveSoccer) return;
  let lastStateAt = 0;
  let scoreOffset = { blue: 0, red: 0 };

  function mergedState() {
    const state = window.LiveSoccer.getState?.();
    if (!state) return null;
    return {
      ...state,
      blueScore: Math.max(0, (Number(state.blueScore) || 0) + scoreOffset.blue),
      redScore: Math.max(0, (Number(state.redScore) || 0) + scoreOffset.red),
      match: window.LiveSoccerMatch?.getState?.() || null
    };
  }

  function paintScore() {
    const state = mergedState();
    if (!state) return;
    const blue = document.getElementById('blueScore');
    const red = document.getElementById('redScore');
    if (blue) blue.textContent = state.blueScore;
    if (red) red.textContent = state.redScore;
  }

  function apply(message) {
    if (message.event !== 'command') return;
    const { type, payload = {} } = message.payload || {};
    const api = window.LiveSoccer;
    const match = window.LiveSoccerMatch;
    if (type === 'gift') api.triggerGift?.(payload.gift, payload.user || 'Viewer', payload.team || 'blue');
    else if (type === 'comment') {
      const fn = api.triggerComment || api.handleComment;
      fn?.call(api, payload.text || '', payload.user || 'Viewer', payload.team || 'blue');
    }
    else if (type === 'viewers') api.setViewers?.(payload.value);
    else if (type === 'possession') api.setPossession?.(payload.team, payload.number || 10);
    else if (type === 'score') {
      const raw = api.getState?.() || {};
      scoreOffset.blue = Math.max(0, Number(payload.blue) || 0) - (Number(raw.blueScore) || 0);
      scoreOffset.red = Math.max(0, Number(payload.red) || 0) - (Number(raw.redScore) || 0);
      paintScore();
    }
    else if (type === 'customize') match?.customize?.(payload);
    else if (type === 'matchConfig') match?.configure?.(payload);
    else if (type === 'pause') match?.pause?.();
    else if (type === 'resume') match?.resume?.();
    else if (type === 'secondHalf') match?.secondHalf?.();
    else if (type === 'finish') match?.finish?.();
    else if (type === 'reset') api.reset?.();
  }

  async function publishState(force = false) {
    const now = Date.now();
    if (!force && now - lastStateAt < 1500) return;
    lastStateAt = now;
    const state = mergedState();
    if (state) await realtime.send('state', state);
  }

  realtime.onMessage((message) => {
    apply(message);
    if (message.event === 'command') setTimeout(() => publishState(true), 180);
  });

  realtime.onStatus((status) => { document.documentElement.dataset.realtime = status; });
  realtime.connect();
  setInterval(() => { paintScore(); publishState(false); }, 1000);
  window.addEventListener('beforeunload', () => realtime.destroy());
})();