(() => {
  const sourceFor = (el) => {
    const isKeeper = el.classList.contains('goalkeeper');
    const isBlue = el.classList.contains('blue');
    if (isKeeper) return isBlue ? './assets/keeper-green.svg' : './assets/keeper-yellow.svg';
    return isBlue ? './assets/player-blue.svg' : './assets/player-red.svg';
  };

  function enhancePlayer(el) {
    if (!el || el.dataset.spriteReady === '1') return;
    const number = el.dataset.number || el.textContent.trim();
    const img = document.createElement('img');
    img.className = 'player-sprite-img';
    img.src = sourceFor(el);
    img.alt = '';
    img.draggable = false;

    const badge = document.createElement('span');
    badge.className = 'player-number-badge';
    badge.textContent = number;

    el.textContent = '';
    el.append(img, badge);
    el.dataset.spriteReady = '1';
  }

  function enhanceAll() {
    document.querySelectorAll('#playersLayer .player').forEach(enhancePlayer);
  }

  const layer = document.getElementById('playersLayer');
  if (layer) {
    enhanceAll();
    new MutationObserver(enhanceAll).observe(layer, { childList: true, subtree: false });
  }
})();