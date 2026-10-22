/* TT Typing: saying the word out loud, with the browser's own speechSynthesis (no recordings, no voice cloning).
   TY.speech.say('cat', 'en') uses an en-US voice, say('苹果', 'zh') a zh-CN one. If the device has no voice for that
   language (or no speech at all, as offline can be), it says nothing and the game carries on: the picture and the
   word on screen are always there.
   - Novelty voices (Bubbles, Zarvox, Whisper...) are skipped. On-device voices come first, so it works offline.
   - iPad Safari only speaks after a tap has spoken once: unlock() says a silent " " from the first tap.
   - Sound off (M, remembered by the kit) mutes the voice too: while it's off, nothing reaches speechSynthesis at all.
     The music dips while a word is said. */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});
  const synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  const NOVELTY = /bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|eddy|flo|reed|sandy/i;
  let voices = [];
  const pickCache = {};

  function load() {
    try {
      voices = synth ? synth.getVoices() || [] : [];
    } catch (e) {
      voices = [];
    }
    for (const k in pickCache) delete pickCache[k];
  }
  if (synth) {
    load();
    try {
      if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
      else synth.onvoiceschanged = load;
    } catch (e) { /* old browsers */ }
  }

  function voiceFor(lang) {
    if (lang in pickCache) return pickCache[lang];
    const norm = (v) => String(v.lang || '').replace('_', '-').toLowerCase();
    const want = lang === 'zh' ? ['zh-cn', 'cmn-hans-cn', 'zh-hans-cn', 'zh-hans', 'cmn-cn'] : ['en-us'];
    const also = lang === 'zh' ? ['zh-tw', 'cmn-hant-tw', 'zh-sg'] : ['en-gb', 'en-au', 'en-ca', 'en-ie', 'en-nz', 'en-in', 'en-za', 'en'];
    const ok = voices.filter((v) => !NOVELTY.test(v.name || ''));
    const rank = (v) => {
      const l = norm(v);
      let s = want.includes(l) ? 0 : also.includes(l) ? 10 : lang === 'en' && l.startsWith('en') ? 20 : 99;
      if (!v.localService) s += 3; // on-device first: it works offline
      if (/samantha|tingting|ting-ting|lili|yu-shu|google us english|google 普通话|microsoft (aria|jenny|xiaoxiao|yunxi)/i.test(v.name || '')) s -= 1;
      return s;
    };
    const best = ok.map((v) => [rank(v), v]).filter((x) => x[0] < 99).sort((a, b) => a[0] - b[0])[0];
    // no voice for this language (yet: Chrome loads them late), so remember only a found one
    const v = best ? best[1] : null;
    if (v) pickCache[lang] = v;
    return v;
  }

  let muted = () => false;
  let duck = () => {};
  let sayTimer = 0, last = null;

  // Say `text` in 'en' or 'zh'. Returns true if a voice was there to say it.
  function say(text, lang, o = {}) {
    if (!synth || !text || muted()) return false;
    const v = voiceFor(lang);
    if (!v) return false;
    try {
      clearTimeout(sayTimer);
      synth.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.voice = v;
      u.lang = v.lang;
      u.rate = o.rate || (lang === 'zh' ? 0.75 : 0.8);
      u.pitch = o.pitch || 1.05;
      u.volume = 1;
      u.onstart = () => duck(true);
      u.onend = u.onerror = () => duck(false);
      last = { text: String(text), lang, voice: v.name };
      // Chrome can drop a word spoken straight after cancel(): give it a moment
      sayTimer = setTimeout(() => {
        try {
          synth.speak(u);
        } catch (e) { /* no speech */ }
      }, 60);
      return true;
    } catch (e) {
      return false;
    }
  }

  // (skipped while the sound is off: then turning it back on, itself a tap or key, unlocks it)
  function unlock() {
    if (!synth || unlock.done || muted()) return;
    unlock.done = true;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    } catch (e) { /* no speech */ }
  }

  function cancel() {
    clearTimeout(sayTimer);
    try {
      if (synth) synth.cancel();
    } catch (e) { /* no speech */ }
    duck(false);
  }

  TY.speech = {
    say, unlock, cancel, voiceFor,
    has: (lang) => !!voiceFor(lang),
    get supported() { return !!synth; },
    get last() { return last; },
    hooks(o) {
      if (o.muted) muted = o.muted;
      if (o.duck) duck = o.duck;
    },
  };
})();
