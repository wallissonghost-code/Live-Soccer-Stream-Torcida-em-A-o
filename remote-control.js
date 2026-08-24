(() => {
  const realtime = window.LiveSoccerRealtime?.create();
  if (!realtime || !window.LiveSoccer) return;
  let lastState = 0;

  function apply(message) {
    if (message.event !== 'command') return;
    const { type, payload = {} } = message.payload || {};
    const api = window.LiveSoccer;
    if (type === 'gift') api.triggerGift?.(payload.gift, payload.user || 'Viewer', payload.team || 'blue');
    else if (type === 'comment') api.handleComment?.(payload.text || '', payload.user || 'Viewer', payload.team || 'blue');
    else if (type === 'viewers') api.setViewers?.(payload.value);
    else if (type === 'possession') api.setPossession?.(payload.team, payload.number || 10);
    else if (type === 'reset') api.reset?.();
  }

  async function publishState(force = false) {
    const now = Date.now();
    if (!force && now - lastState < 1500) return;
    lastState = now;
    const state = window.LiveSoccer.getState?.();
    if (state) await realtime.send('state', state);
  }

  realtime.onMessage((message) => {
    apply(message);
    if (message.event === 'command') setTimeout(() => publishState(true), 150);
  });

  realtime.onStatus((status) => {
    document.documentElement.dataset.realtime = status;
  });

  realtime.connect();
  setInterval(() => publishState(false), 2000);
  window.addEventListener('beforeunload', () => realtime.destroy());
})();
