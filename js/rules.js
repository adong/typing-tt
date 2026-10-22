/* TT Typing: the rules, with no Three.js and no page in them (js/check.js runs them in node too).
   A stage is a lesson or an adventure level: a list of items to type, one after another.
   - An item is a few keys (a lesson drill: "f", "fjf") or a word ("cat", 猫 typed as "mao").
   - press(R, key): the right key moves on to the next letter; a wrong one counts as a slip and nothing moves.
     The last letter of an item finishes it, and the next one is up at once.
   - The buddy can type the current item for you (buddyPress): his letters never count for or against you.
   - The clock: each player's own clock runs while one of his items is up, from the start of the stage, except
     while the buddy types and while the game is paused (the game just doesn't tick then).
   - WPM: (right keys ÷ 5) per minute, the usual typing-test measure (5 keys count as one word). Accuracy: right keys
     out of all the keys you pressed. Stars come from accuracy: EASY 90% / 70% for ⭐⭐⭐ / ⭐⭐, NORMAL 95% / 80%. */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});

  const CONFIG = (TY.CONFIG = {
    count: { lesson: { easy: 10, normal: 12 }, adventure: { easy: 8, normal: 10 } },
    twoEach: 6, // 2 players: items each, taking turns
    stars: { easy: [90, 70], normal: [95, 80] },
  });

  // test hook: js/check.js switches one of these on to prove the check catches it
  const sab = (name) => TY.sabotage === name;

  // ---------------------------------------------------------------- a seeded random, so a stage can be replayed

  function rng(seed) {
    let a = seed >>> 0 || 1;
    const r = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (n) => Math.floor(r() * n);
    r.pick = (arr) => arr[r.int(arr.length)];
    r.shuffle = (arr) => {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = r.int(i + 1);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    };
    return r;
  }

  // ---------------------------------------------------------------- what to type

  // every key taught up to and including lesson ix
  function learned(ix) {
    let keys = '';
    for (let i = 0; i <= ix && i < TY.LESSONS.length; i++) keys += TY.LESSONS[i].keys;
    return keys;
  }

  // a word entry as an item: English [word, emoji], 中文 [汉字, pinyin, emoji]
  function wordItem(e, lang) {
    if (lang === 'zh') return { kind: 'word', text: TY.toneless(e[1]), show: e[0], pinyin: e[1], emoji: e[2] || '', say: e[0], sayLang: 'zh' };
    return { kind: 'word', text: e[0], show: e[0], pinyin: null, emoji: e[1] || '', say: e[0], sayLang: 'en' };
  }
  function keysItem(text) {
    // a single letter is said by name (in English: a letter is a letter in both modes)
    return { kind: 'keys', text, show: text, pinyin: null, emoji: '', say: text.length === 1 && text !== ';' ? text.toUpperCase() : '', sayLang: 'en' };
  }

  // n words from a list, no repeats until the list runs out
  function dealWords(list, n, r, lang) {
    const out = [];
    let bag = [];
    while (out.length < n) {
      if (!bag.length) bag = r.shuffle(list);
      out.push(wordItem(bag.pop(), lang));
    }
    return out;
  }

  // a lesson's items for one player
  function lessonItems(ix, level, lang, n, r) {
    const L = TY.LESSONS[ix];
    const fresh = L.keys.split('');
    const all = learned(ix).split('');
    let old = all.filter((k) => !fresh.includes(k));
    if (sab('unlearned-key')) old = old.concat(['q']);
    const words = L.words && L.words[lang] && L.words[lang][level];
    const out = [];
    if (!fresh.length) return dealWords(words, n, r, lang); // the home-row words lesson
    const key = () => (old.length && r() < 0.3 ? r.pick(old) : r.pick(fresh));
    if (level === 'easy') {
      // one key at a time: the new keys in turn first, then mostly new ones with a few old friends
      for (let i = 0; i < n; i++) out.push(keysItem(i < 4 ? fresh[i % fresh.length] : key()));
      return out;
    }
    // NORMAL: doubles of the new keys, then little groups, and (lessons 7-9) real words with the keys so far
    const start = [fresh[0] + fresh[0], fresh[1] + fresh[1], fresh[0] + fresh[1], fresh[1] + fresh[0]];
    const wordsLeft = words ? r.shuffle(words) : [];
    for (let i = 0; i < n; i++) {
      if (i < start.length) out.push(keysItem(start[i]));
      else if (wordsLeft.length && i % 2 === 1) out.push(wordItem(wordsLeft.pop(), lang));
      else {
        let g = '';
        const len = 3 + r.int(2);
        while (g.length < len) g += key();
        out.push(keysItem(g));
      }
    }
    return out;
  }

  // an adventure level's words for one player: NORMAL words get longer level by level
  function adventureItems(ix, level, lang, n, r) {
    const list = TY.WORDS[lang][level];
    if (level === 'easy') return dealWords(list, n, r, lang);
    const sorted = list.slice().sort((a, b) => wordItem(a, lang).text.length - wordItem(b, lang).text.length);
    const per = sorted.length / TY.LEVELS.length;
    // each level's slice of the list (sorted by length), and a little overlap so there's always enough
    const from = Math.max(0, Math.floor(ix * per - per * 0.25)), to = Math.min(sorted.length, Math.ceil((ix + 1) * per + per * 0.25));
    return dealWords(sorted.slice(from, to), n, r, lang);
  }

  // ---------------------------------------------------------------- a stage

  /* makeStage({ kind: 'lesson' | 'adventure', ix, lang: 'en' | 'zh', players: [{ id, level }], seed })
     2 players take turns item by item, each at his own level. */
  function makeStage(o) {
    const r = rng(o.seed || 1);
    const two = o.players.length > 1;
    const lists = o.players.map((p) => {
      const n = two ? CONFIG.twoEach : CONFIG.count[o.kind][p.level];
      return (o.kind === 'lesson' ? lessonItems : adventureItems)(o.ix, p.level, o.lang, n, r);
    });
    const items = [];
    for (let i = 0; i < Math.max(...lists.map((l) => l.length)); i++)
      lists.forEach((l, p) => {
        if (l[i]) items.push(Object.assign({ player: p, by: '' }, l[i]));
      });
    if (sab('pinyin-tone') && o.lang === 'zh') items.forEach((it) => { if (it.pinyin) it.text = it.pinyin; });
    if (sab('empty-item')) items[1].text = '';
    return {
      kind: o.kind, ix: o.ix, lang: o.lang, seed: o.seed || 1,
      players: o.players.map((p) => ({ id: p.id, level: p.level, correct: 0, wrong: 0, time: 0, buddy: 0 })),
      items, i: 0, pos: 0, done: false, buddyBusy: false, slips: 0, keys: 0,
    };
  }

  const item = (R) => (R.done ? null : R.items[R.i]);
  const need = (R) => (R.done ? null : R.items[R.i].text[R.pos]);
  const playerNow = (R) => (R.done ? null : R.players[R.items[R.i].player]);

  // the player's key. Returns { ok, key, finished: the item it finished (if any), done }
  function press(R, key) {
    if (R.done || R.buddyBusy) return { ok: false, ignored: true };
    const p = playerNow(R);
    R.keys++;
    if (key !== need(R)) {
      p.wrong++;
      R.slips++;
      return { ok: false, key, want: need(R) };
    }
    R.slips = 0;
    p.correct++;
    return advance(R, key, 'kid');
  }

  // the buddy's key: always the right one, and it never counts for or against the player
  function buddyPress(R) {
    if (R.done) return { ok: false, ignored: true };
    const p = playerNow(R);
    const key = need(R);
    if (sab('buddy-counts')) p.correct++;
    else p.buddy++;
    R.slips = 0;
    return advance(R, key, 'buddy');
  }

  function advance(R, key, who) {
    const it = R.items[R.i];
    it.by = !it.by || it.by === who ? who : 'both';
    R.pos++;
    const out = { ok: true, key, finished: null, done: false };
    if (R.pos >= it.text.length) {
      if (sab('last-item-stuck') && R.i === R.items.length - 1) {
        R.pos = it.text.length - 1;
        return out;
      }
      out.finished = it;
      R.i++;
      R.pos = 0;
      if (R.i >= R.items.length) R.done = out.done = true;
    }
    return out;
  }

  // the clock: whoever's item is up, unless the buddy is typing it
  function tick(R, dt) {
    if (R.done) return;
    if (R.buddyBusy && !sab('clock-in-buddy')) return;
    playerNow(R).time += dt;
  }

  // ---------------------------------------------------------------- the numbers

  // words per minute: 5 keys count as one word
  function wpm(correct, secs) {
    if (!(secs > 0) || !correct) return 0;
    return Math.round(correct / (sab('wpm-6') ? 6 : 5) / (secs / 60));
  }
  // right keys out of all keys pressed (100 before you've pressed any)
  function accuracy(correct, wrong) {
    if (sab('acc-ignores-wrong')) return 100;
    const all = correct + wrong;
    return all ? Math.round((100 * correct) / all) : 100;
  }
  function stars(acc, level) {
    const [three, two] = CONFIG.stars[level] || CONFIG.stars.normal;
    return acc >= three ? 3 : acc >= two ? 2 : 1;
  }
  function results(R) {
    return R.players.map((p) => {
      const acc = accuracy(p.correct, p.wrong);
      return { id: p.id, level: p.level, wpm: wpm(p.correct, p.time), acc, stars: stars(acc, p.level), correct: p.correct, wrong: p.wrong, time: +p.time.toFixed(2), buddy: p.buddy };
    });
  }

  // ---------------------------------------------------------------- the autopilot (tests): types at `every` s a key,
  // slipping onto a wrong key now and then
  function makeBot(R, o = {}) {
    const r = rng(o.seed || 7);
    const every = o.every || 0.35, slip = o.slip == null ? 0.1 : o.slip;
    let wait = every;
    return (dt) => {
      wait -= dt;
      if (wait > 0 || R.done || R.buddyBusy) return null;
      wait += every;
      const want = need(R);
      if (r() < slip) {
        const wrong = TY.KEYS.ALL.replace(want, '');
        return { key: wrong[r.int(wrong.length)] };
      }
      return { key: want };
    };
  }

  TY.rules = { rng, learned, lessonItems, adventureItems, makeStage, item, need, playerNow, press, buddyPress, tick, wpm, accuracy, stars, results, makeBot };
})();
