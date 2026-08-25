(() => {
  const nativeSetInterval = window.setInterval.bind(window);
  let gated180 = false;
  let gated1000 = false;
  const gate = { paused: false };

  window.setInterval = function(fn, delay, ...args) {
    const ms = Number(delay) || 0;
    if (ms === 180 && !gated180) {
      gated180 = true;
      return nativeSetInterval(() => { if (!gate.paused) fn(...args); }, ms);
    }
    if (ms === 1000 && !gated1000) {
      gated1000 = true;
      return nativeSetInterval(() => { if (!gate.paused) fn(...args); }, ms);
    }
    return nativeSetInterval(fn, ms, ...args);
  };

  const match = {
    status: 'playing',
    durationSeconds: 300,
    halftimeSeconds: 150,
    halftimeDone: false,
    blue: { name: 'TIME AZUL', color: '#1682e9', crest: '⚽' },
    red: { name: 'TIME VERMELHO', color: '#e33a47', crest: '⚽' }
  };

  const $ = (id) => document.getElementById(id);
  const cleanName = (v, fallback) => String(v || fallback).trim().slice(0, 24) || fallback;
  const cleanColor = (v, fallback) => /^#[0-9a-f]{6}$/i.test(String(v || '')) ? v : fallback;

  function flash(text) {
    const el = $('eventFlash');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }

  function paintCrest(el, value) {
    if (!el) return;
    const v = String(value || '⚽').trim();
    if (/^(https?:\/\/|data:image\/)/i.test(v)) {
      el.textContent = '';
      el.style.backgroundImage = `url("${v.replace(/"/g, '%22')}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    } else {
      el.style.backgroundImage = '';
      el.textContent = v.slice(0, 4) || '⚽';
    }
  }

  function phaseText() {
    if (match.status === 'paused') return '⏸ PAUSADO';
    if (match.status === 'halftime') return 'INTERVALO';
    if (match.status === 'fulltime') return 'FIM DE JOGO';
    const seconds = window.LiveSoccer?.getState?.().seconds || 0;
    return seconds >= match.halftimeSeconds ? '2º TEMPO' : '1º TEMPO';
  }

  function paint() {
    const blueName = $('blueTeamName');
    const redName = $('redTeamName');
    if (blueName) blueName.textContent = match.blue.name;
    if (redName) redName.textContent = match.red.name;
    paintCrest($('blueCrest'), match.blue.crest);
    paintCrest($('redCrest'), match.red.crest);
    document.documentElement.style.setProperty('--team-blue', match.blue.color);
    document.documentElement.style.setProperty('--team-red', match.red.color);
    const phase = $('matchPhase');
    if (phase) phase.textContent = phaseText();
    document.documentElement.dataset.matchStatus = match.status;
  }

  function setPaused(paused, status) {
    gate.paused = !!paused;
    match.status = status || (paused ? 'paused' : 'playing');
    paint();
  }

  function configure(payload = {}) {
    const minutes = Math.max(1, Math.min(90, Number(payload.durationMinutes) || Math.round(match.durationSeconds / 60)));
    match.durationSeconds = Math.round(minutes * 60);
    match.halftimeSeconds = Math.floor(match.durationSeconds / 2);
    match.halftimeDone = false;
    paint();
  }

  function customize(payload = {}) {
    if (payload.blue) {
      match.blue.name = cleanName(payload.blue.name, match.blue.name);
      match.blue.color = cleanColor(payload.blue.color, match.blue.color);
      match.blue.crest = String(payload.blue.crest || match.blue.crest).trim().slice(0, 500);
    }
    if (payload.red) {
      match.red.name = cleanName(payload.red.name, match.red.name);
      match.red.color = cleanColor(payload.red.color, match.red.color);
      match.red.crest = String(payload.red.crest || match.red.crest).trim().slice(0, 500);
    }
    paint();
  }

  function pause() { if (match.status !== 'fulltime') { setPaused(true, 'paused'); flash('⏸ PARTIDA PAUSADA'); } }
  function resume() { if (match.status !== 'fulltime') { setPaused(false, 'playing'); flash('▶ PARTIDA RETOMADA'); } }
  function secondHalf() { match.halftimeDone = true; setPaused(false, 'playing'); flash('▶ 2º TEMPO'); }
  function finish() { setPaused(true, 'fulltime'); flash('🏁 FIM DE JOGO'); }

  function monitor() {
    if (!window.LiveSoccer) return;
    const s = window.LiveSoccer.getState?.();
    if (!s) return;
    if (!match.halftimeDone && match.status === 'playing' && s.seconds >= match.halftimeSeconds) {
      match.halftimeDone = true;
      setPaused(true, 'halftime');
      flash('⏱ INTERVALO');
    }
    if (match.status === 'playing' && s.seconds >= match.durationSeconds) finish();
    paint();
  }

  window.LiveSoccerMatch = {
    configure,
    customize,
    pause,
    resume,
    secondHalf,
    finish,
    getState() { return JSON.parse(JSON.stringify({ ...match, phase: phaseText(), paused: gate.paused })); }
  };

  nativeSetInterval(monitor, 500);
  window.addEventListener('load', paint);
})();