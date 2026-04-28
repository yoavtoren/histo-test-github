/* ==========================================================
   Histo Test — sound engine
   Synthetic sounds via Web Audio API — no external files.
   All sounds are very brief and tasteful: Apple-style micro-feedback.
   ========================================================== */

window.HTSounds = (function () {
  "use strict";

  let ctx = null;
  let enabled = true;

  // Lazy-init AudioContext on first user gesture (browser autoplay policy).
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // AudioContext unavailable — sounds silently disabled
    }
  }

  // Core synthesiser: one oscillator with an exponential gain envelope.
  // freq      — frequency in Hz
  // duration  — total duration in seconds
  // type      — OscillatorNode type: 'sine' | 'triangle' | 'square' | 'sawtooth'
  // gain      — peak amplitude (0–1, keep below ~0.15 for subtlety)
  // startTime — AudioContext time offset (default: now)
  function tone(freq, duration, type, gain, startTime) {
    if (!enabled || !ctx) return;
    try {
      const t = startTime !== undefined ? startTime : ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.connect(env);
      env.connect(ctx.destination);
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch (e) {
      // Ignore synthesis errors silently
    }
  }

  // A filtered noise burst — used for a soft "click" pop feeling.
  function noisePop(duration, gain) {
    if (!enabled || !ctx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.8;

      const env = ctx.createGain();
      env.gain.setValueAtTime(gain, ctx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      source.connect(filter);
      filter.connect(env);
      env.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch (e) {
      // Fallback: silent
    }
  }

  // ----------------------------------------------------------------
  // Named sound presets
  // ----------------------------------------------------------------

  // Soft button / UI click
  function playClick() {
    tone(900, 0.055, "sine", 0.07);
  }

  // Answer option selected — short, pleasant ascending pop
  function playSelect() {
    const t = ctx.currentTime;
    tone(520, 0.07, "sine", 0.07, t);
    tone(660, 0.09, "sine", 0.05, t + 0.04);
  }

  // Answer option deselected — brief descending tone
  function playDeselect() {
    tone(520, 0.06, "sine", 0.05);
  }

  // Page navigation — delicate chime
  function playNavigate() {
    const t = ctx.currentTime;
    tone(660, 0.09, "sine", 0.05, t);
    tone(880, 0.14, "sine", 0.03, t + 0.07);
  }

  // Correct answer revealed — ascending three-note arpeggio (C E G)
  function playCorrect() {
    const t = ctx.currentTime;
    tone(523, 0.1,  "sine", 0.08, t);
    tone(659, 0.1,  "sine", 0.07, t + 0.09);
    tone(784, 0.22, "sine", 0.06, t + 0.18);
  }

  // Wrong answer revealed — low descending thud
  function playWrong() {
    const t = ctx.currentTime;
    tone(280, 0.12, "triangle", 0.08, t);
    tone(200, 0.18, "triangle", 0.05, t + 0.08);
  }

  // Submit — satisfying three-note rising pop
  function playSubmit() {
    const t = ctx.currentTime;
    tone(440, 0.07, "sine", 0.08, t);
    tone(587, 0.07, "sine", 0.07, t + 0.08);
    tone(880, 0.22, "sine", 0.06, t + 0.16);
  }

  // Start a mock — gentle rising pair
  function playStart() {
    const t = ctx.currentTime;
    tone(392, 0.09, "sine", 0.06, t);
    tone(523, 0.18, "sine", 0.05, t + 0.1);
  }

  // High score — celebratory ascending run
  function playCelebrate() {
    const notes = [523, 587, 659, 698, 784, 880];
    notes.forEach((freq, i) => {
      tone(freq, i === notes.length - 1 ? 0.35 : 0.1, "sine", 0.06, ctx.currentTime + i * 0.07);
    });
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  const library = {
    click:     playClick,
    select:    playSelect,
    deselect:  playDeselect,
    navigate:  playNavigate,
    correct:   playCorrect,
    wrong:     playWrong,
    submit:    playSubmit,
    start:     playStart,
    celebrate: playCelebrate,
  };

  function play(name) {
    init();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => { if (library[name]) library[name](); });
    } else {
      if (library[name]) library[name]();
    }
  }

  function toggle() {
    enabled = !enabled;
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  // Prime AudioContext on first click anywhere (browser policy requires user gesture).
  document.addEventListener("click", init, { once: true });

  return { play, toggle, isEnabled };

})();
