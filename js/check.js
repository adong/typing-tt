/* TT Typing: the headless check. TY.check() runs in node (tools/check.js) and in the page (game.check()).
   1. content: every item of every lesson and level, both languages, both levels, 1 and 2 players, many seeds:
      not empty, only keys on the on-screen keyboard (each with a finger), a lesson only asks for keys taught so far,
      pinyin is typed without tone marks (猫 māo → mao) and only with a to z, the English lists have no Chinese.
   2. every stage is finishable: the autopilot (with slips onto wrong keys, and the buddy typing some items) plays
      each one to the end, in a bounded number of keys, and the item count and the stats add up.
   3. the WPM and accuracy math, on numbers worked out by hand, and on a stage typed at a steady pace.
   TY.check({ sabotage: name }) switches on one planted bug (see SABOTAGE) to prove the check catches it. */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});

  const SABOTAGE = ['wpm-6', 'acc-ignores-wrong', 'last-item-stuck', 'unlearned-key', 'buddy-counts', 'pinyin-tone', 'clock-in-buddy', 'empty-item'];

  function check(o = {}) {
    const R_ = TY.rules;
    const fails = [];
    const fail = (group, msg) => { if (fails.length < 400) fails.push(`${group}: ${msg}`); };
    const stats = { stages: 0, items: 0, keys: 0, slips: 0, buddyKeys: 0 };
    const seeds = o.seeds || 6;
    const prev = TY.sabotage;
    TY.sabotage = o.sabotage || null;
    try {
      // ---- 1 + 2: content, and every stage played to the end
      const cast = [[{ id: 'tommy', level: 'easy' }], [{ id: 'teddy', level: 'normal' }], [{ id: 'tommy', level: 'easy' }, { id: 'teddy', level: 'normal' }], [{ id: 'teddy', level: 'easy' }, { id: 'tommy', level: 'easy' }]];
      const stagesOf = [['lesson', TY.LESSONS.length], ['adventure', TY.LEVELS.length]];
      for (const lang of ['en', 'zh'])
        for (const [kind, count] of stagesOf)
          for (let ix = 0; ix < count; ix++)
            for (const players of cast)
              for (let seed = 1; seed <= seeds; seed++) {
                const name = `${lang} ${kind} ${ix + 1} ${players.map((p) => p.id + '/' + p.level).join('+')} seed ${seed}`;
                const R = R_.makeStage({ kind, ix, lang, players, seed });
                stats.stages++;
                content(R, name, kind, ix, players, fail);
                play(R, name, seed, players, fail, stats);
              }
      // ---- 3: the math
      math(fail);
    } catch (e) {
      fail('crash', String(e && e.stack || e).split('\n').slice(0, 3).join(' | '));
    } finally {
      TY.sabotage = prev;
    }
    return { ok: fails.length === 0, fails, stats, sabotage: o.sabotage || null };
  }

  function content(R, name, kind, ix, players, fail) {
    const want = players.length > 1 ? TY.CONFIG.twoEach * players.length : TY.CONFIG.count[kind][players[0].level];
    if (R.items.length !== want) fail('content', `${name}: ${R.items.length} items, want ${want}`);
    const allowed = kind === 'lesson' ? TY.rules.learned(ix) : TY.KEYS.ALL;
    R.items.forEach((it, n) => {
      const at = `${name} item ${n + 1} "${it.show}"`;
      if (!it.text) return fail('content', `${at} is empty`);
      for (const ch of it.text) {
        if (!TY.KEYS.ALL.includes(ch) || !TY.KEYS.FINGER[ch]) fail('keys', `${at}: "${ch}" isn't on the keyboard`);
        else if (!allowed.includes(ch)) fail('keys', `${at}: "${ch}" isn't taught yet (lesson ${ix + 1} has ${allowed})`);
      }
      if (it.player !== n % players.length) fail('turns', `${at} belongs to player ${it.player + 1}`);
      if (R.lang === 'zh' && it.kind === 'word') {
        if (!/^[a-z]+$/.test(it.text)) fail('pinyin', `${at}: types "${it.text}", not plain a-z`);
        if (TY.toneless(it.pinyin) !== it.text) fail('pinyin', `${at}: ${it.pinyin} should type ${TY.toneless(it.pinyin)}`);
        if (!/^[一-鿿]+$/.test(it.show)) fail('pinyin', `${at}: shows "${it.show}", not 汉字`);
      }
      if (R.lang === 'en' && /[　-鿿]/.test(it.show + it.emoji)) fail('content', `${at}: Chinese in English mode`);
      if (R.lang === 'en' && it.kind === 'word' && players[it.player].level === 'easy' && kind === 'adventure' && it.text.length > 3) fail('content', `${at}: too long for EASY`);
    });
  }

  function play(R, name, seed, players, fail, stats) {
    const R_ = TY.rules;
    const total = R.items.reduce((s, it) => s + it.text.length, 0);
    const bot = R_.makeBot(R, { seed, slip: 0.15, every: 0.3 });
    let guard = total * 20 + 50, slips = 0, buddyKeys = 0, buddyItem = -1;
    while (!R.done && guard-- > 0) {
      // the buddy types every 4th item (2 players: never, T is a high five there)
      if (players.length === 1 && R.i % 4 === 3 && R.pos === 0) buddyItem = R.i;
      if (buddyItem === R.i) {
        R.buddyBusy = true;
        R_.tick(R, 0.2);
        R_.buddyPress(R);
        buddyKeys++;
        if (R.done || R.i !== buddyItem) {
          R.buddyBusy = false;
          buddyItem = -1;
        }
        continue;
      }
      R_.tick(R, 0.05);
      const k = bot(0.05);
      if (!k) continue;
      const res = R_.press(R, k.key);
      if (!res.ok && !res.ignored) slips++;
    }
    if (!R.done) return fail('finish', `${name}: never finished (stuck at item ${R.i + 1} of ${R.items.length}, letter ${R.pos + 1})`);
    stats.items += R.items.length;
    stats.keys += total;
    stats.slips += slips;
    stats.buddyKeys += buddyKeys;
    const c = R.players.reduce((s, p) => s + p.correct, 0), b = R.players.reduce((s, p) => s + p.buddy, 0), w = R.players.reduce((s, p) => s + p.wrong, 0);
    if (c + b !== total) fail('stats', `${name}: right keys ${c} + buddy keys ${b} != ${total} letters`);
    if (b !== buddyKeys) fail('stats', `${name}: buddy typed ${buddyKeys}, counted ${b}`);
    if (w !== slips) fail('stats', `${name}: ${slips} slips, counted ${w} wrong`);
    const res = R_.results(R);
    res.forEach((r, i) => {
      if (r.acc < 0 || r.acc > 100 || r.wpm < 0 || ![1, 2, 3].includes(r.stars)) fail('stats', `${name}: odd results ${JSON.stringify(r)}`);
      if (R.players[i].correct && !(R.players[i].time > 0)) fail('stats', `${name}: no time on the clock for player ${i + 1}`);
    });
  }

  function math(fail) {
    const R_ = TY.rules;
    const eq = (what, got, want) => { if (got !== want) fail('math', `${what} = ${got}, want ${want}`); };
    // WPM: 5 keys are a word, per minute
    eq('wpm(50 keys, 60 s)', R_.wpm(50, 60), 10);
    eq('wpm(25 keys, 30 s)', R_.wpm(25, 30), 10);
    eq('wpm(100 keys, 120 s)', R_.wpm(100, 120), 10);
    eq('wpm(12 keys, 36 s)', R_.wpm(12, 36), 4);
    eq('wpm(0 keys, 10 s)', R_.wpm(0, 10), 0);
    eq('wpm(10 keys, 0 s)', R_.wpm(10, 0), 0);
    // accuracy: right keys out of all keys
    eq('accuracy(45 right, 5 wrong)', R_.accuracy(45, 5), 90);
    eq('accuracy(3 right, 1 wrong)', R_.accuracy(3, 1), 75);
    eq('accuracy(2 right, 1 wrong)', R_.accuracy(2, 1), 67);
    eq('accuracy(0 right, 0 wrong)', R_.accuracy(0, 0), 100);
    eq('accuracy(0 right, 4 wrong)', R_.accuracy(0, 4), 0);
    // stars from accuracy
    eq('stars(95, normal)', R_.stars(95, 'normal'), 3);
    eq('stars(94, normal)', R_.stars(94, 'normal'), 2);
    eq('stars(79, normal)', R_.stars(79, 'normal'), 1);
    eq('stars(90, easy)', R_.stars(90, 'easy'), 3);
    eq('stars(70, easy)', R_.stars(70, 'easy'), 2);
    eq('stars(69, easy)', R_.stars(69, 'easy'), 1);
    // a stage typed at a steady 0.4 s a key, no slips: 150 keys a minute = 30 WPM, 100%
    const typeAt = (every, slipEvery) => {
      const R = R_.makeStage({ kind: 'adventure', ix: 2, lang: 'en', players: [{ id: 'teddy', level: 'normal' }], seed: 3 });
      let n = 0, wrong = 0;
      while (!R.done && n < 5000) {
        n++;
        if (slipEvery && n % slipEvery === 0) {
          R_.tick(R, every);
          R_.press(R, R_.need(R) === 'q' ? 'z' : 'q');
          wrong++;
        }
        R_.tick(R, every);
        R_.press(R, R_.need(R));
      }
      return { res: R_.results(R)[0], keys: R.items.reduce((s, it) => s + it.text.length, 0), wrong };
    };
    const a = typeAt(0.4, 0);
    eq('steady stage: right keys', a.res.correct, a.keys);
    eq('steady stage: WPM at 0.4 s a key', a.res.wpm, 30);
    eq('steady stage: accuracy', a.res.acc, 100);
    // the same, with a wrong key before every 10th: each costs its 0.4 s too
    const b = typeAt(0.4, 10);
    eq('stage with slips: wrong keys', b.res.wrong, b.wrong);
    eq('stage with slips: WPM', b.res.wpm, Math.round(b.keys / 5 / (((b.keys + b.wrong) * 0.4) / 60)));
    eq('stage with slips: accuracy', b.res.acc, Math.round((100 * b.keys) / (b.keys + b.wrong)));
    if (b.res.acc > 92 || b.res.acc < 88) fail('math', `a slip before every 10th key: ${b.res.acc}%, want about 90%`);
    // the buddy's time and keys don't count: the same stage with him typing every item takes no time at all
    const B = R_.makeStage({ kind: 'lesson', ix: 0, lang: 'en', players: [{ id: 'tommy', level: 'easy' }], seed: 1 });
    for (let n = 0; !B.done && n < 500; n++) {
      B.buddyBusy = true;
      R_.tick(B, 1);
      R_.buddyPress(B);
    }
    const rb = R_.results(B)[0];
    eq('all-buddy stage: right keys', rb.correct, 0);
    eq('all-buddy stage: time', rb.time, 0);
    eq('all-buddy stage: WPM', rb.wpm, 0);
  }

  check.SABOTAGE = SABOTAGE;
  TY.check = check;
})();
