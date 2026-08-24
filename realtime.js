(() => {
  const LOCAL_CHANNEL = 'live-soccer-control-v2';
  const STORAGE_CONFIG = 'live-soccer-realtime-config-v1';
  const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.91.0/+esm';

  // Backend reaproveitado do antigo projeto Play Life.
  // A publishable key e segura para uso no frontend; nunca use service_role aqui.
  const DEFAULT_URL = 'https://tkrgihgzhpbnbcpvwxbp.supabase.co';
  const DEFAULT_KEY = 'sb_publishable_SrWXb2m7dXqSc0-1lMjpCg_VHLrkpwE';

  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const cleanRoom = (value) => (value || 'ARENA01').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24) || 'ARENA01';

  function queryConfig() {
    const q = new URLSearchParams(location.search);
    return {
      room: cleanRoom(q.get('room')),
      url: q.get('sburl') || '',
      key: q.get('sbkey') || ''
    };
  }

  function storedConfig() {
    try { return JSON.parse(localStorage.getItem(STORAGE_CONFIG) || '{}'); } catch (_) { return {}; }
  }

  function resolveConfig(override = {}) {
    const query = queryConfig();
    const stored = storedConfig();
    return {
      room: cleanRoom(override.room || query.room || stored.room || 'ARENA01'),
      url: override.url || query.url || stored.url || DEFAULT_URL,
      key: override.key || query.key || stored.key || DEFAULT_KEY
    };
  }

  function saveConfig(config) {
    const safe = {
      room: cleanRoom(config.room),
      url: config.url || DEFAULT_URL,
      key: config.key || DEFAULT_KEY
    };
    localStorage.setItem(STORAGE_CONFIG, JSON.stringify(safe));
    return safe;
  }

  class Transport {
    constructor(config = {}) {
      this.config = resolveConfig(config);
      this.listeners = new Set();
      this.statusListeners = new Set();
      this.seen = new Map();
      this.bc = 'BroadcastChannel' in window ? new BroadcastChannel(LOCAL_CHANNEL) : null;
      this.supabase = null;
      this.channel = null;
      this.status = 'local';
      this.handleLocal = (event) => this.receive(event.data, 'local');
      this.handleStorage = (event) => {
        if (event.key !== LOCAL_CHANNEL || !event.newValue) return;
        try { this.receive(JSON.parse(event.newValue), 'storage'); } catch (_) {}
      };
      this.bc?.addEventListener('message', this.handleLocal);
      window.addEventListener('storage', this.handleStorage);
    }

    onMessage(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    onStatus(fn) { this.statusListeners.add(fn); fn(this.status); return () => this.statusListeners.delete(fn); }
    setStatus(status) { this.status = status; this.statusListeners.forEach(fn => fn(status)); }

    receive(message, source) {
      if (!message || !message.id || message.room !== this.config.room) return;
      const now = Date.now();
      if (this.seen.has(message.id)) return;
      this.seen.set(message.id, now);
      if (this.seen.size > 250) {
        for (const [id, at] of this.seen) if (now - at > 60000) this.seen.delete(id);
      }
      this.listeners.forEach(fn => fn(message, source));
    }

    envelope(event, payload = {}) {
      return { id: uid(), room: this.config.room, event, payload, at: Date.now() };
    }

    async send(event, payload = {}) {
      const message = this.envelope(event, payload);
      this.receive(message, 'self');
      this.bc?.postMessage(message);
      try { localStorage.setItem(LOCAL_CHANNEL, JSON.stringify(message)); } catch (_) {}
      if (this.channel && this.status === 'online') {
        try {
          await this.channel.send({ type: 'broadcast', event: 'message', payload: message });
        } catch (_) {
          this.setStatus('degraded');
        }
      }
      return message;
    }

    async connect(config = this.config) {
      this.config = saveConfig(resolveConfig(config));
      if (!this.config.url || !this.config.key) {
        this.setStatus('local');
        return false;
      }
      this.setStatus('connecting');
      try {
        const { createClient } = await import(CDN);
        this.supabase = createClient(this.config.url, this.config.key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          realtime: { params: { eventsPerSecond: 20 } }
        });
        if (this.channel) await this.supabase.removeChannel(this.channel);
        this.channel = this.supabase.channel(`live-soccer:${this.config.room}`, {
          config: { broadcast: { ack: true, self: false } }
        });
        this.channel.on('broadcast', { event: 'message' }, ({ payload }) => this.receive(payload, 'realtime'));
        this.channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') this.setStatus('online');
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') this.setStatus('degraded');
          else if (status === 'CLOSED') this.setStatus('local');
        });
        return true;
      } catch (error) {
        console.error('[LiveSoccerRealtime]', error);
        this.setStatus('degraded');
        return false;
      }
    }

    shareUrl(path = './') {
      const target = new URL(path, location.href);
      target.search = '';
      target.searchParams.set('room', this.config.room);
      return target.href;
    }

    destroy() {
      this.bc?.close();
      window.removeEventListener('storage', this.handleStorage);
      if (this.supabase && this.channel) this.supabase.removeChannel(this.channel);
    }
  }

  window.LiveSoccerRealtime = {
    create(config) { return new Transport(config); },
    resolveConfig,
    saveConfig,
    cleanRoom,
    defaults: { url: DEFAULT_URL, key: DEFAULT_KEY },
    storageKey: STORAGE_CONFIG
  };
})();
