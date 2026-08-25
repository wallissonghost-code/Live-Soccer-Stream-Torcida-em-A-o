(() => {
  const $ = (id) => document.getElementById(id);
  const pitch = $('pitch');
  const flash = $('eventFlash');
  if (!pitch || !flash) return;

  const transient = (el, cls, ms) => {
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  };

  const currentActive = () => document.querySelector('.player.active:not(.goalkeeper)');
  const currentKeeper = () => {
    const active = document.querySelector('.player.goalkeeper.active');
    if (active) return active;
    const state = window.LiveSoccer?.getState?.();
    if (!state) return document.querySelector('.player.goalkeeper');
    const defending = state.possession === 'blue' ? 'red' : 'blue';
    return document.querySelector(`.player.goalkeeper.${defending}`) || document.querySelector('.player.goalkeeper');
  };

  function shotEffect(){
    const shooter = currentActive();
    transient(shooter,'action-kick',420);
    transient(pitch,'fx-shot',500);
    if (shooter) {
      const ring = document.createElement('i');
      ring.className = 'shot-ring';
      ring.style.left = shooter.style.left;
      ring.style.top = shooter.style.top;
      pitch.appendChild(ring);
      setTimeout(()=>ring.remove(),600);
    }
  }

  function saveEffect(){
    const keeper = currentKeeper();
    if (keeper) keeper.style.setProperty('--dive-x', Math.random() > .5 ? '10px' : '-10px');
    transient(keeper,'action-save',760);
    transient(pitch,'fx-save',680);
  }

  function goalEffect(){
    transient(pitch,'fx-goal',1200);
    const state = window.LiveSoccer?.getState?.();
    const scoring = state?.possession || 'blue';
    document.querySelectorAll(`.player.${scoring}:not(.goalkeeper)`).forEach((p, i) => {
      setTimeout(()=>transient(p,'action-celebrate',1900),Math.min(i,5)*75);
    });
    const burst = document.createElement('div');
    burst.className = 'goal-burst';
    for(let i=0;i<26;i++){
      const dot = document.createElement('i');
      const a = (Math.PI*2*i)/26 + Math.random()*.28;
      const r = 70 + Math.random()*150;
      dot.style.setProperty('--dx', `${Math.cos(a)*r}px`);
      dot.style.setProperty('--dy', `${Math.sin(a)*r}px`);
      burst.appendChild(dot);
    }
    pitch.appendChild(burst);
    setTimeout(()=>burst.remove(),1100);
  }

  let lastText = '';
  const observer = new MutationObserver(() => {
    const text = flash.textContent.trim();
    if (!text || text === lastText) return;
    lastText = text;
    if (text.includes('CHUTE')) shotEffect();
    else if (text.includes('DEFENDEU')) saveEffect();
    else if (text.includes('GOOOOOL')) goalEffect();
    setTimeout(()=>{ if (flash.textContent.trim() === text) lastText = ''; },1200);
  });
  observer.observe(flash,{childList:true,characterData:true,subtree:true});
})();
