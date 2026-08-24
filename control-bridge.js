(() => {
  const CHANNEL = 'live-soccer-control-v1';
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel(CHANNEL) : null;

  function applyCommand(command) {
    if (!command || !window.LiveSoccer) return;
    const { type, payload = {} } = command;

    if (type === 'gift') {
      window.LiveSoccer.triggerGift(payload.gift || 'rose', payload.user || 'Admin', payload.team || 'blue');
    } else if (type === 'comment') {
      window.LiveSoccer.triggerComment(payload.text || '', payload.user || 'Admin', payload.team || 'blue');
    } else if (type === 'viewers') {
      window.LiveSoccer.setViewers(payload.value || 0);
    } else if (type === 'possession') {
      window.LiveSoccer.setPossession(payload.team || 'blue', payload.number || 10);
    } else if (type === 'reset') {
      window.LiveSoccer.reset();
    }
  }

  if (bc) bc.addEventListener('message', (event) => applyCommand(event.data));

  window.addEventListener('storage', (event) => {
    if (event.key !== CHANNEL || !event.newValue) return;
    try { applyCommand(JSON.parse(event.newValue)); } catch (_) {}
  });

  window.LiveSoccerControl = { applyCommand };
})();
