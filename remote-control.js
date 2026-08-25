(() => {
  const realtime = window.LiveSoccerRealtime?.create();
  if (!realtime || !window.LiveSoccer) return;
  let lastStateAt = 0;

  function mergedState() {
    const state = window.LiveSoccer.getState?.();
    if (!state) return null;
    return {
      ...state,
      match: window.LiveSoccerMatch?.getState?.() || null
    };
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
    else if (type === 'score') api.setScore?.(payload.blue, payload.red);
    else if (type === 'effect') api.triggerEffect?.(payload.effect, payload.team, payload.user || 'Admin');
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
  setInterval(() => publishState(false), 1000);
  window.addEventListener('beforeunload', () => realtime.destroy());
})();