/* TT Typing: the game's own sounds, built on Kit.sound.tone / hiss (all synthesised, no files).
   TY.sfx.kit(name, ...args) plays a kit effect; the rest are ours. Every call is a silent no-op until Kit.sound.init()
   has run from the first tap or key. A wrong key is a soft boop, never a buzzer. */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});
  const S = Kit.sound;
  const tone = (o) => S.tone(o);
  const hiss = (o) => S.hiss(o);
  const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047, 1175, 1319];

  const sfx = {
    kit(name, ...args) {
      if (S[name]) S[name](...args);
    },
    // a right key: a clicky key and a note that climbs along the word
    key(n = 0, buddy = false) {
      hiss({ filter: 'highpass', f: 4000, dur: 0.025, vol: 0.06 });
      const f = NOTES[Math.min(n, NOTES.length - 1)] * (buddy ? 1.5 : 1);
      tone({ type: buddy ? 'sine' : 'triangle', f, dur: 0.09, vol: 0.07 });
    },
    // not that key: a soft, silly boop
    wrong() {
      tone({ type: 'sine', f: 300, to: 220, dur: 0.12, vol: 0.09 });
    },
    // a whole word: a happy run up
    word() {
      [659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f, at: i * 0.07, dur: 0.14, vol: 0.08 }));
    },
    // the hero clears an obstacle
    jump() { tone({ type: 'square', f: 300, to: 760, dur: 0.16, vol: 0.05, lp: 2400 }); },
    smash() {
      S.punch && S.punch();
      hiss({ filter: 'lowpass', f: 1400, to: 300, dur: 0.25, vol: 0.18 });
      tone({ type: 'triangle', f: 140, to: 60, dur: 0.18, vol: 0.12 });
    },
    splash() { hiss({ filter: 'bandpass', f: 1800, to: 700, q: 0.7, dur: 0.35, vol: 0.12 }); },
    squish() {
      tone({ type: 'sine', f: 180, to: 520, dur: 0.18, vol: 0.12 });
      tone({ type: 'sine', f: 520, to: 260, dur: 0.16, vol: 0.08, at: 0.16 });
    },
    // the treasure chest at the end
    chest() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'square', f, at: i * 0.11, dur: 0.16, vol: 0.05, lp: 3000 }));
      [523, 659, 784].forEach((f) => tone({ type: 'triangle', f: f * 2, at: 0.46, dur: 0.6, vol: 0.08 }));
      [784, 988, 1175, 1568].forEach((f, i) => tone({ type: 'triangle', f, at: 0.9 + i * 0.09, dur: 0.3, vol: 0.09 }));
      hiss({ filter: 'highpass', f: 6000, at: 0.46, dur: 0.5, vol: 0.06 });
    },
    star() { [1319, 1760].forEach((f, i) => tone({ type: 'sine', f, at: i * 0.06, dur: 0.14, vol: 0.07 })); },
    tick() { tone({ type: 'square', f: 1200, dur: 0.025, vol: 0.025, lp: 3000 }); },
    // your brother pops in (and out)
    poof() {
      tone({ f: 300, to: 900, dur: 0.12, vol: 0.1 });
      hiss({ f: 2000, to: 6000, dur: 0.15, vol: 0.05 });
    },
    whoosh() { hiss({ f: 900, to: 2600, dur: 0.3, vol: 0.06, q: 1.2 }); },
    clap() {
      hiss({ filter: 'bandpass', f: 1500, q: 1.2, dur: 0.08, vol: 0.25 });
      hiss({ filter: 'highpass', f: 3000, dur: 0.05, vol: 0.1, at: 0.02 });
    },
  };

  TY.sfx = sfx;
})();
