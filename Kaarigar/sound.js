/* kārigaṛ — sound effects.
   Synthesised with the Web Audio API: no audio files, nothing copyrighted.
   No background music for now. */
const Sound = (() => {
  let ctx = null, master, sfx, verb, noiseBuf;
  const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  let enabled = store('kg-sound') !== 'off';
  const SA = 146.83; // D3
  const hz = semis => SA * Math.pow(2, semis / 12);

  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    // small hall reverb for warmth
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.35; verb.connect(wet); wet.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 0.7; sfx.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    return true;
  }

  function noise(t, dur, type, f0, f1, q, gain, dest) {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + dur + 0.05);
  }
  // plucked string: bright attack, fast decay, a touch of metallic overtone
  function pluck(freq, t, dur, gain, dest, bright = 2600) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(700, t + dur);
    [[1, 'triangle', 1], [2.01, 'sine', 0.35], [3.98, 'sine', 0.12]].forEach(([m, type, a]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq * m;
      const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(f);
      o.start(t); o.stop(t + dur + 0.05);
    });
    f.connect(g); g.connect(dest); if (dest !== verb) g.connect(verb);
  }
  const effects = {
    draw() { const t = ctx.currentTime; noise(t, 0.16, 'bandpass', 1800, 4200, 1.2, 0.35, sfx); noise(t + 0.03, 0.08, 'highpass', 5000, 7000, 0.7, 0.08, sfx); },
    discard() { const t = ctx.currentTime; noise(t, 0.1, 'bandpass', 3000, 1400, 1.4, 0.28, sfx);
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(190, t + 0.07); o.frequency.exponentialRampToValueAtTime(90, t + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 0.07); g.gain.exponentialRampToValueAtTime(0.3, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(sfx); o.start(t + 0.07); o.stop(t + 0.25); },
    helper() { const t = ctx.currentTime; [12, 14, 16, 19, 21, 24].forEach((s, i) => pluck(hz(s) * 2, t + i * 0.085, 1.4, 0.16, sfx, 4200));
      pluck(hz(24) * 2, t + 0.6, 2.2, 0.12, sfx, 5000); pluck(hz(31) * 2, t + 0.6, 2.2, 0.06, sfx, 5000); }
  };

  return {
    play(name) { if (!enabled || !init()) return; if (ctx.state === 'suspended') ctx.resume(); try { effects[name] && effects[name](); } catch (e) {} },
    get on() { return enabled; },
    toggle() { enabled = !enabled; store('kg-sound', enabled ? 'on' : 'off'); return enabled; }
  };
})();
