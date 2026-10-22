/* TT Typing: the game. Screens (title, map, play, pause, results), the keys and taps, the hero on the trail, saving.
   The rules are in js/rules.js, the trail in js/stage.js, the keyboard on the screen in js/keyboard.js and your
   brother in js/buddy.js.
   window.game is a test hook: start(), step(seconds), check(), auto(), type(), info() and friends (see the README). */
(function () {
  'use strict';
  const TY = window.TY;
  const S = Kit.sound;
  const R_ = TY.rules;
  const ST = TY.stage;
  const $ = (id) => document.getElementById(id);
  const { rand, pick } = Kit.gfx;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NAME = { teddy: 'TEDDY', tommy: 'TOMMY' };
  const RUN = 6, FAST = 9, AIR = 0.93, JUMP_V = 6.5;

  // ---------------------------------------------------------------- saved: who plays, levels, stars, best speeds

  const SAVE = 'typingTT.v1';
  const store = load();
  function load() {
    const d = { who: 'tommy', players: 1, levels: { teddy: 'normal', tommy: 'easy' }, stars: {}, best: { teddy: 0, tommy: 0 }, total: { teddy: 0, tommy: 0 } };
    try {
      const s = JSON.parse(localStorage.getItem(SAVE) || 'null');
      if (s && typeof s === 'object') {
        for (const k of ['who', 'players']) if (s[k] != null) d[k] = s[k];
        for (const k of ['levels', 'stars', 'best', 'total']) if (s[k] && typeof s[k] === 'object') Object.assign(d[k], s[k]);
      }
    } catch (e) { /* storage blocked: it lasts until the page closes */ }
    if (!NAME[d.who]) d.who = 'tommy';
    if (d.players !== 2) d.players = 1;
    return d;
  }
  function save() {
    try {
      localStorage.setItem(SAVE, JSON.stringify(store));
    } catch (e) { /* storage blocked */ }
  }

  const G = {
    state: 'boot', R: null, stage: { kind: 'lesson', ix: 0 }, results: null, toasts: [], held: false,
    auto: false, bot: null, autoSlip: 0.1, sel: 0, seed: 1, time: 0, statT: 0, autoPause: true, sayAt: -1, langQuiet: false,
    v: { k: 0, act: null, end: -1, celebrated: false },
  };
  const ui = {};
  const actors = {};
  let flyers3d = null, bursts = null, art = {};
  const lang = () => (Kit.lang && Kit.lang.get() === 'zh' ? 'zh' : 'en');

  function music(mode) {
    G.musicMode = mode;
    S.music(mode);
  }

  // ---------------------------------------------------------------- the stages: 9 lessons, then 5 adventure levels

  const STAGES = TY.LESSONS.map((l, ix) => ({ kind: 'lesson', ix })).concat(TY.LEVELS.map((l, ix) => ({ kind: 'adventure', ix })));
  const stageNo = (kind, ix) => STAGES.findIndex((s) => s.kind === kind && s.ix === ix);
  const starKey = (id, level, kind, ix) => `${id}|${level}|${lang()}|${kind}${ix}`;
  const starsFor = (id, kind, ix) => store.stars[starKey(id, store.levels[id], kind, ix)] || 0;

  function playersNow() {
    if (store.players === 2) return ['tommy', 'teddy'].map((id) => ({ id, level: store.levels[id] }));
    return [{ id: store.who, level: store.levels[store.who] }];
  }

  // ---------------------------------------------------------------- the title

  function buildTitle() {
    ui.logoBig.innerHTML = TY.TITLE.split('').map((ch) => (ch === ' ' ? '<i></i>' : `<span>${ch}</span>`)).join('');
    for (const img of document.querySelectorAll('img[data-face]')) img.src = art[img.dataset.face] || '';
    ui.callFace.src = art.tommy || '';
    for (const b of ui.segPlayers.querySelectorAll('button')) b.onclick = () => setPlayers(+b.dataset.v);
    for (const b of ui.segWho.querySelectorAll('button')) b.onclick = () => setWho(b.dataset.v);
    refreshTitle();
  }
  function setPlayers(n) {
    store.players = n === 2 ? 2 : 1;
    save();
    refreshTitle();
    TY.sfx.tick();
  }
  function setWho(id) {
    store.who = id;
    save();
    refreshTitle();
    TY.sfx.tick();
  }
  function setLevel(id, level) {
    store.levels[id] = level;
    save();
    refreshTitle();
    TY.sfx.tick();
  }
  function refreshTitle() {
    for (const b of ui.segPlayers.querySelectorAll('button')) b.setAttribute('aria-checked', String(+b.dataset.v === store.players));
    for (const b of ui.segWho.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.v === store.who));
    ui.segWho.classList.toggle('hidden', store.players === 2);
    const ids = store.players === 2 ? ['tommy', 'teddy'] : [store.who];
    ui.levels.innerHTML = '';
    for (const id of ids) {
      const row = document.createElement('div');
      row.className = 'lvrow';
      row.innerHTML = `<img alt="" class="${id}" src="${art[id] || ''}"><div class="seg" role="radiogroup" aria-label="Level">
        <button data-v="easy" role="radio"><span class="emo">🐣</span>EASY<small>for Tommy</small></button>
        <button data-v="normal" role="radio"><span class="emo">🔥</span>NORMAL<small>for Teddy</small></button></div>`;
      for (const b of row.querySelectorAll('button')) {
        b.setAttribute('aria-checked', String(store.levels[id] === b.dataset.v));
        b.onclick = () => setLevel(id, b.dataset.v);
      }
      ui.levels.appendChild(row);
    }
    ui.learn.innerHTML = lang() === 'zh' ? '<b>中文：</b>看汉字，打拼音' : '<b>English:</b> type the words · the language button switches to pinyin';
    const best = ids.map((id) => `${NAME[id]} ⚡ ${store.best[id] || 0}`).join(' · ');
    ui.titleBest.textContent = `BEST SPEED (WPM): ${best}`;
  }

  function goTitle() {
    leaveStage();
    G.state = 'title';
    show(ui.title, true);
    show(ui.map, false);
    show(ui.over, false);
    show(ui.pause, false);
    showPlay(false);
    refreshTitle();
    ST.build('camp', []);
    placeIdle();
    music('title');
    layout();
  }

  // the boys standing on the grass, for the menus
  function placeIdle() {
    const two = [['tommy', -1.3], ['teddy', 1.3]];
    for (const [id, x] of two) {
      const a = actors[id];
      a.setScale(1);
      a.place(x, 0, 0.6);
      a.face = null;
      a.faceDefault = Math.PI + (x < 0 ? -0.35 : 0.35);
      a.visible = true;
      a.react('idle');
    }
    ST.frame(0, 0, true);
  }

  // ---------------------------------------------------------------- the map: lessons and levels

  function openMap() {
    leaveStage();
    G.state = 'map';
    show(ui.title, false);
    show(ui.over, false);
    show(ui.pause, false);
    showPlay(false);
    // the first stage without stars is the one to try next
    const ids = playersNow().map((p) => p.id);
    const nextIx = STAGES.findIndex((s) => ids.some((id) => !starsFor(id, s.kind, s.ix)));
    G.sel = nextIx < 0 ? 0 : nextIx;
    renderMap();
    show(ui.map, true);
    music('title');
    layout();
  }

  function renderMap() {
    const ids = playersNow().map((p) => p.id);
    const tile = (s, n) => {
      const L = s.kind === 'lesson' ? TY.LESSONS[s.ix] : TY.LEVELS[s.ix];
      const face = s.kind === 'lesson' ? (L.keys ? L.keys.toUpperCase().split('').join(' ') : 'ASDF') : L.emoji;
      const stars = ids.map((id) => {
        const k = starsFor(id, s.kind, s.ix);
        return `<span class="ts${ids.length > 1 ? ' ' + id : ''}">${'⭐'.repeat(k)}${'<i>☆</i>'.repeat(3 - k)}</span>`;
      }).join('');
      return `<button class="tile ${s.kind}${n === G.sel ? ' sel' : ''}" data-n="${n}"><b data-no-lang>${face}</b><small>${s.kind === 'lesson' ? `${s.ix + 1}. ` : ''}${L.name}</small><span class="tstars" data-no-lang>${stars}</span></button>`;
    };
    ui.mapLessons.innerHTML = STAGES.map((s, n) => (s.kind === 'lesson' ? tile(s, n) : '')).join('');
    ui.mapLevels.innerHTML = STAGES.map((s, n) => (s.kind === 'adventure' ? tile(s, n) : '')).join('');
    for (const b of ui.map.querySelectorAll('.tile')) b.onclick = () => startStage(STAGES[+b.dataset.n]);
    const ps = playersNow().map((p) => `${NAME[p.id]} ${p.level === 'easy' ? '🐣' : '🔥'}`).join(' + ');
    ui.mapWho.textContent = ps;
  }
  function moveSel(d) {
    G.sel = (G.sel + d + STAGES.length) % STAGES.length;
    renderMap();
    TY.sfx.tick();
  }

  // ---------------------------------------------------------------- a stage

  function startStage(s = G.stage, o = {}) {
    first();
    leaveStage();
    if (o.players) {
      store.players = o.players === 2 ? 2 : 1;
      if (o.who) store.who = o.who;
      if (o.level) store.levels[store.who] = o.level;
      if (o.levels) Object.assign(store.levels, o.levels);
    }
    if (o.lang && Kit.lang && o.lang !== lang()) {
      G.langQuiet = true;
      Kit.lang.set(o.lang);
      G.langQuiet = false;
    }
    G.stage = { kind: s.kind, ix: s.ix };
    G.seed = o.seed || ((G.seed * 7 + 13) % 9973) + 1;
    const players = playersNow();
    const R = R_.makeStage({ kind: s.kind, ix: s.ix, lang: lang(), players, seed: G.seed });
    G.R = R;
    G.results = null;
    G.v = { k: 0, act: null, end: -1, celebrated: false, chestT: -1 };
    const theme = s.kind === 'lesson' ? 'camp' : TY.LEVELS[s.ix].theme;
    ST.build(theme, R.items, players.map((p) => p.id));
    // the hero (2 players: both, side by side)
    for (const id in actors) actors[id].visible = false;
    heroes().forEach((a, i) => {
      a.visible = true;
      a.setScale(1);
      a.place(-1.5, 0, laneZ(i));
      a.face = null;
      a.faceDefault = -Math.PI / 2 - 0.45;
      a.react('idle');
    });
    G.state = 'play';
    show(ui.title, false);
    show(ui.map, false);
    show(ui.over, false);
    show(ui.pause, false);
    showPlay(true);
    buildWho();
    renderCard(true);
    layout();
    ST.frame(-1.5, 0, true);
    G.statT = 0;
    if (G.auto) G.bot = R_.makeBot(R, { slip: G.autoSlip, seed: 99, every: G.autoEvery || 0.3 });
    music('play');
    const L = s.kind === 'lesson' ? TY.LESSONS[s.ix] : TY.LEVELS[s.ix];
    toast(s.kind === 'lesson' ? L.tip : `${L.emoji} ${L.name.toUpperCase()}!`, 'turn', 2.6);
    G.sayAt = 0.5;
  }

  function leaveStage() {
    TY.buddy.dismiss();
    TY.speech.cancel();
    clearToasts();
    TY.fx.overlay.clear();
    if (flyers3d) flyers3d.clear();
    if (bursts) bursts.clear();
    G.held = false;
  }

  const laneZ = (i) => (store.players === 2 || (G.R && G.R.players.length === 2) ? (i === 0 ? 0.6 : -0.5) : 0.3);
  // the boys on the trail: [hero] or (2 players) [first, second]
  function heroes() {
    const R = G.R;
    if (!R) return [];
    return R.players.map((p) => actors[p.id]);
  }
  // whose item is up (2 players take turns)
  function heroActor() {
    const R = G.R;
    if (!R) return actors[store.who];
    const it = R_.item(R) || R.items[R.items.length - 1];
    return actors[R.players[it.player].id];
  }

  // ---------------------------------------------------------------- typing

  // a key from the keyboard or a tap on the screen's keyboard
  function typeKey(k, tapped = false) {
    const R = G.R;
    if (G.state !== 'play' || !R || R.done) return;
    if (k === ' ') return sayItem();
    if (TY.buddy.typing) return; // he's typing for you: watch!
    const res = R_.press(R, k);
    if (res.ignored) return;
    const hero = heroActor();
    if (res.ok) {
      TY.kb.flash(k, 'ok');
      TY.sfx.key(R.pos ? R.pos - 1 : (res.finished ? res.finished.text.length - 1 : 0));
      sparkle(hero, '✨');
      ST.nudge(res.finished ? R.i - 1 : R.i);
      if (res.finished) wordDone(res.finished, false);
      else renderCard();
    } else {
      TY.kb.flash(k, 'bad');
      TY.sfx.wrong();
      ui.card.classList.remove('shake');
      void ui.card.offsetWidth;
      ui.card.classList.add('shake');
      // a few slips on one letter: the right key and finger say it again
      if (R.slips === 3) {
        toast(`${TY.kb.fingerName(R_.need(R)).toUpperCase()}: ${R_.need(R) === ';' ? ';' : R_.need(R).toUpperCase()}`, 'hint', 2);
        if (R_.need(R) !== ';') TY.speech.say(R_.need(R).toUpperCase(), 'en');
      }
      renderCard();
    }
  }

  function wordDone(it, byBuddy) {
    const R = G.R;
    const idx = R.items.indexOf(it);
    ST.markTyped(idx);
    TY.sfx.word();
    const o = ST.obstacles[idx];
    if (bursts && o) bursts.add(pick(['NICE!', 'GREAT!', 'SUPER!', 'WOW!']), o.x, 3.3, 0.2, 1.3);
    if (R.done) {
      TY.kb.next(null);
      renderCard();
      return;
    }
    renderCard(true);
    G.sayAt = 0.35;
  }

  function sayItem() {
    const it = G.R && R_.item(G.R);
    if (it && it.say) TY.speech.say(it.say, it.sayLang);
  }

  function sparkle(a, emoji) {
    if (!a || !a.person || !flyers3d) return;
    const p = new THREE.Vector3();
    Kit.people.handWorld(a.person, Math.random() < 0.5 ? -1 : 1, p);
    flyers3d.add(emoji, p.x, p.y, p.z + 0.3, rand(1, 3), rand(0.5, 2), 0.35, 0.5, rand(-4, 4), 2);
  }

  // ---------------------------------------------------------------- the word card and the players

  function buildWho() {
    ui.who.innerHTML = '';
    ui.who.classList.toggle('two', G.R.players.length > 1);
    G.R.players.forEach((p, i) => {
      const el = document.createElement('div');
      el.className = 'pl ' + p.id;
      el.innerHTML = `<img alt="" src="${art[p.id] || ''}"><div><b>${NAME[p.id]}</b><small data-no-lang id="st${i}">⚡0 · 🎯100%</small></div>`;
      ui.who.appendChild(el);
    });
    const buddy = Kit.roster.buddyFor(G.R.players[0].id);
    ui.callFace.src = art[G.R.players.length > 1 ? 'teddy' : buddy] || '';
    ui.callBtn.classList.toggle('teddy', G.R.players.length === 1 && buddy === 'teddy');
    ui.callLbl.textContent = G.R.players.length > 1 ? 'HIGH FIVE' : `CALL ${NAME[buddy]}`;
  }
  function markWho() {
    const R = G.R;
    if (!R) return;
    const it = R_.item(R);
    [...ui.who.children].forEach((el, i) => {
      el.classList.toggle('on', R.players.length > 1 && it && it.player === i);
      el.classList.toggle('off', R.players.length > 1 && it && it.player !== i);
    });
    R_.results(R).forEach((r, i) => {
      const el = $('st' + i);
      if (el) el.textContent = `⚡${r.wpm} · 🎯${r.acc}%`;
    });
  }

  function renderCard(fresh = false) {
    const R = G.R;
    const it = R_.item(R) || R.items[R.items.length - 1];
    const pos = R.done ? it.text.length : R.pos;
    if (fresh) {
      ui.pic.textContent = it.emoji || (it.kind === 'keys' ? '⌨️' : '');
      ui.pic.classList.toggle('hidden', !ui.pic.textContent);
      ui.zh.classList.toggle('hidden', !it.pinyin);
      ui.han.textContent = it.pinyin ? it.show : '';
      ui.py.textContent = it.pinyin || '';
      ui.boxes.innerHTML = it.text.split('').map((ch) => `<span class="bx">${ch === ';' ? ';' : ch.toUpperCase()}</span>`).join('');
      // fit the boxes: as big as fits beside the picture
      ui.card.style.setProperty('--cs', boxSize(it.text.length, !!ui.pic.textContent, ui.card.classList.contains('drop')) + 'px');
      ui.pic.classList.remove('boing');
      void ui.pic.offsetWidth;
      ui.pic.classList.add('boing');
      const two = R.players.length > 1;
      ui.turn.textContent = two ? `${NAME[R.players[it.player].id]}'S TURN` : '';
      ui.turn.classList.toggle('hidden', !two);
      ui.dots.innerHTML = R.items.map((x, i) => `<i class="dot${two ? ' p' + x.player : ''}"></i>`).join('');
    }
    [...ui.boxes.children].forEach((b, i) => {
      b.classList.toggle('done', i < pos);
      b.classList.toggle('now', i === pos && !R.done);
      b.classList.toggle('buddy', i < pos && it.by !== 'kid' && !!it.by && i >= (it.kidUpTo || 0));
    });
    [...ui.dots.children].forEach((d, i) => {
      d.classList.toggle('done', i < R.i || R.done);
      d.classList.toggle('now', i === R.i && !R.done);
    });
    TY.kb.next(R.done ? null : R_.need(R));
    markWho();
  }

  // ---------------------------------------------------------------- your brother

  function call() {
    if (G.state !== 'play') return false;
    return TY.buddy.call();
  }

  // ---------------------------------------------------------------- the hero on the trail

  function stepView(dt) {
    const R = G.R, v = G.v;
    const hs = heroes();
    if (!hs.length) return;
    const obs = ST.obstacles;
    // 2 players: whoever's turn it is runs in front, his brother a step behind
    const owner = obs[v.k] ? obs[v.k].item.player : 0;
    const x = obs[v.k] && hs[owner] ? hs[owner].root.position.x : Math.max(...hs.map((a) => a.root.position.x));
    const xOff = (i) => (hs.length > 1 && i !== owner ? 1.4 : 0);
    const moveAll = (tx, speed) => hs.forEach((a, i) => a.moveTo(tx - xOff(i), laneZ(i), speed));
    const queued = obs.filter((o) => o.typed && !o.cleared).length;
    const speed = queued > 1 ? FAST : RUN;
    if (v.act) {
      v.act.t += dt;
      const o = obs[v.k];
      if (!v.act.hit && v.act.t >= v.act.hitAt) {
        v.act.hit = true;
        ST.clear(v.k);
        if (o.type === 'rock' || o.type === 'crate') {
          TY.sfx.smash();
          for (let i = 0; i < 6; i++) flyers3d.add(pick(['💥', '⭐']), o.x + rand(-0.5, 0.5), rand(0.6, 1.4), 0.6, rand(-1, 3), rand(1, 3), 0.5, 0.6, rand(-3, 3), 4);
        } else if (o.type === 'slime') TY.sfx.squish();
        else if (o.type === 'stream') TY.sfx.splash();
      }
      if (v.act.t >= v.act.dur) {
        v.act = null;
        v.k++;
      }
    } else if (obs[v.k]) {
      const o = obs[v.k];
      const doer = actors[R.players[o.item.player].id];
      if (o.kind === 'jump') {
        const take = o.x - 2.7, wait = o.x - 1.7;
        if (o.typed && x >= Math.min(take, wait) - 0.05) {
          const land = o.x + 2.3;
          hs.forEach((a, i) => {
            a.jump(JUMP_V);
            a.moveTo(land - xOff(i), laneZ(i), Math.max(2, (land - xOff(i) - a.root.position.x) / AIR));
          });
          TY.sfx.jump();
          v.act = { t: 0, dur: AIR * 0.95, hitAt: AIR * 0.5, hit: false };
        } else moveAll(o.typed ? take : wait, speed);
      } else {
        const stop = o.x - 1.3;
        if (x < stop - 0.05) moveAll(stop, speed);
        else if (o.typed) {
          doer.act(doer.entry.id === 'teddy' ? 'straight' : 'jab', 0.4, 0, true);
          v.act = { t: 0, dur: 0.42, hitAt: 0.16, hit: false };
        }
      }
    } else if (ST.chest) {
      // past the last one: on to the treasure
      const stop = ST.chest.x - 1.7;
      if (x < stop - 0.05) moveAll(stop, speed);
      else if (R.done && v.chestT < 0) {
        v.chestT = 0;
        ST.chest.opening = true;
        TY.sfx.chest();
        for (let i = 0; i < 16; i++) flyers3d.add(pick(['💎', '⭐', '🪙', '✨']), ST.chest.x + rand(-0.4, 0.4), 1.2, 0.3, rand(-2.5, 2.5), rand(3, 6), 0.55, 1.4, rand(-3, 3), 7);
      }
    }
    if (v.chestT >= 0) {
      v.chestT += dt;
      if (v.chestT > 0.6 && !v.celebrated) celebrate();
      if (v.chestT > 2.8 && G.state === 'play') finishStage();
    }
    ST.frame(x, dt);
  }

  // the end of the trail: the winner's signature move and confetti
  function celebrate() {
    const R = G.R;
    G.v.celebrated = true;
    const res = R_.results(R);
    const top = Math.max(...res.map((r) => r.stars));
    heroes().forEach((a, i) => {
      a.face = Math.PI + (i ? 0.3 : -0.3);
      if (res[i].stars === top) a.react('over');
      else a.react('cheer');
    });
    TY.fx.overlay.rain(110);
    const c = ST.toScreen(ST.chest.x, 1, 0);
    TY.fx.overlay.burst(c.x, c.y, 40, ['⭐', '🎉', '💎'], 1);
  }

  function finishStage() {
    const R = G.R;
    const res = R_.results(R);
    G.results = res;
    G.state = 'over';
    const s = G.stage;
    res.forEach((r) => {
      const k = starKey(r.id, r.level, s.kind, s.ix);
      r.newStars = r.stars > (store.stars[k] || 0);
      store.stars[k] = Math.max(store.stars[k] || 0, r.stars);
      r.newBest = r.wpm > (store.best[r.id] || 0);
      if (r.newBest) store.best[r.id] = r.wpm;
      store.total[r.id] = (store.total[r.id] || 0) + r.stars;
      r.total = store.total[r.id];
      r.best = store.best[r.id];
    });
    save();
    showPlay(false);
    renderOver(res);
    show(ui.over, true);
    music('over');
    TY.sfx.star();
    layout();
  }

  function renderOver(res) {
    const s = G.stage;
    const L = s.kind === 'lesson' ? TY.LESSONS[s.ix] : TY.LEVELS[s.ix];
    ui.oTitle.textContent = s.kind === 'lesson' ? 'LESSON DONE!' : 'TREASURE!';
    ui.oWhat.textContent = s.kind === 'lesson' ? `${s.ix + 1}. ${L.name}` : `${L.emoji} ${L.name}`;
    const top = Math.max(...res.map((r) => r.stars));
    ui.oRows.innerHTML = res.map((r) => `<div class="srow"><img alt="" class="${r.id}" src="${art[r.id] || ''}"><span class="nm" data-no-lang>${NAME[r.id]}${res.length > 1 && r.stars === top ? ' 🏆' : ''}</span>
      <span class="st" data-no-lang>${[0, 1, 2].map((i) => `<i class="${i < r.stars ? '' : 'off'}" style="animation-delay:${0.2 + i * 0.25}s">⭐</i>`).join('')}</span>
      <span class="num"><b data-no-lang>⚡ ${r.wpm}</b><small>WPM</small></span><span class="num"><b data-no-lang>🎯 ${r.acc}%</b><small>ACCURACY</small></span>
      ${r.newBest ? '<span class="badge">NEW BEST!</span>' : ''}</div>`).join('');
    ui.oNote.textContent = res.map((r) => `${NAME[r.id]}: BEST ⚡ ${r.best} · TOTAL ⭐ ${r.total}`).join('   ');
    const n = stageNo(s.kind, s.ix);
    ui.oNext.classList.toggle('hidden', n >= STAGES.length - 1);
  }

  function next() {
    const n = stageNo(G.stage.kind, G.stage.ix);
    if (n < STAGES.length - 1) startStage(STAGES[n + 1]);
    else openMap();
  }

  // ---------------------------------------------------------------- toasts

  function toast(text, cls = '', secs = 2.4) {
    const el = document.createElement('div');
    el.className = 'toast ' + cls;
    el.textContent = text;
    ui.toasts.appendChild(el);
    G.toasts.push({ el, t: secs });
    while (G.toasts.length > 3) G.toasts.shift().el.remove();
  }
  function stepToasts(dt) {
    for (let i = G.toasts.length - 1; i >= 0; i--) {
      const x = G.toasts[i];
      x.t -= dt;
      if (x.t < 0.3) x.el.classList.add('out');
      if (x.t <= 0) {
        x.el.remove();
        G.toasts.splice(i, 1);
      }
    }
  }
  function clearToasts() {
    for (const x of G.toasts) x.el.remove();
    G.toasts.length = 0;
  }

  // ---------------------------------------------------------------- layout

  // the word card sits between the players (top left) and the sound button (top right), or (drop) under them
  function cardRoom(drop) {
    const W = innerWidth;
    if (drop) return Math.min(W - 24, 760);
    const tl = ui.tl.getBoundingClientRect(), tr = ui.tr.getBoundingClientRect();
    const side = Math.max(tl.right || 0, W - (tr.left || W));
    return Math.min(W - 2 * side - 20, 760);
  }
  function boxSize(n, pic, drop) {
    const room = cardRoom(drop) - (pic ? 80 : 0) - 40;
    return clamp(Math.floor(room / n - 6), 18, innerHeight < 520 ? 38 : 54);
  }

  function layout() {
    const W = innerWidth, H = innerHeight;
    const short = H < 520;
    document.body.classList.toggle('short', short);
    const playing = G.state === 'play' || G.state === 'paused';
    // the keyboard: as wide as fits, and not more than half the height on a phone on its side
    let u = Math.min((W - 24) / 10.9, 64, (H * (short ? 0.42 : 0.36)) / 3.9);
    u = Math.max(22, u);
    TY.kb.layout(u);
    const hands = H >= 620;
    document.body.classList.toggle('nohands', !hands);
    // drop the card under the top row if the stage's longest word wouldn't fit beside it (never on a short screen)
    if (G.R) {
      const longest = Math.max(...G.R.items.map((it) => it.text.length));
      ui.card.classList.remove('drop');
      ui.card.classList.toggle('drop', !short && boxSize(longest, true, false) < 34);
      renderCard(true);
    }
    ST.resize(W, H);
    if (playing) {
      const kbTop = ui.kbWrap.getBoundingClientRect().top;
      const card = ui.card.getBoundingClientRect();
      const top = card.bottom + 6, bottom = kbTop - 4;
      ST.setBand({ top, bottom, feet: bottom - Math.max(8, (bottom - top) * 0.1), x: W > H ? 0.3 : 0.34 });
      // your brother's button: beside the keyboard if there's room, else just above it
      const kb = ui.kb.getBoundingClientRect();
      const side = kb.left >= 92;
      ui.callBtn.style.bottom = side ? '' : `${Math.round(H - kbTop + 10)}px`;
    } else ST.setBand({ top: H * 0.5, bottom: H, feet: H - (short ? 8 : 18), x: 0.5 });
    if (TY.fx.overlay) TY.fx.overlay.resize();
  }

  const show = (el, on) => el.classList.toggle('hidden', !on);
  function showPlay(on) {
    show(ui.hud, on);
    show(ui.kbWrap, on);
    show(ui.callBtn, on);
  }

  // ---------------------------------------------------------------- input

  function bindInput() {
    TY.kb.init(ui.kb, ui.hands, (k) => {
      first();
      typeKey(k, true);
    });
    const press = (el, fn) => {
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        first();
        el.classList.add('down');
      });
      el.addEventListener('pointerup', () => el.classList.remove('down'));
      el.addEventListener('pointerleave', () => el.classList.remove('down'));
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        fn();
      });
    };
    press(ui.callBtn, call);
    ui.pauseBtn.onclick = () => pause(true);
    ui.muteBtn.onclick = toggleMute;
    ui.playBtn.onclick = () => {
      first();
      openMap();
    };
    ui.mapBack.onclick = () => goTitle();
    ui.oNext.onclick = () => next();
    ui.oAgain.onclick = () => startStage(G.stage);
    ui.oMap.onclick = () => openMap();
    ui.resumeBtn.onclick = () => pause(false);
    ui.restartBtn.onclick = () => startStage(G.stage);
    ui.quitBtn.onclick = () => openMap();
    addEventListener('pointerdown', first, { capture: true });

    addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      first();
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
      if (k === ' ' || k.startsWith('arrow') || k === "'" || k === '/') e.preventDefault();
      const st = G.state;
      if (st === 'title') {
        if (k === 'enter' || k === ' ') return openMap();
        if (k === '1' || k === '2') return setPlayers(+k);
        if (k === 'm') return toggleMute();
        return;
      }
      if (st === 'map') {
        if (k === 'enter' || k === ' ') return startStage(STAGES[G.sel]);
        if (k === 'arrowright' || k === 'arrowdown') return moveSel(1);
        if (k === 'arrowleft' || k === 'arrowup') return moveSel(-1);
        if (k === 'escape' || k === 'backspace') return goTitle();
        if (k === 'm') return toggleMute();
        return;
      }
      if (st === 'over') {
        if (k === 'enter' || k === ' ') next();
        else if (k === 'r') startStage(G.stage);
        else if (k === 'escape' || k === 'q') openMap();
        else if (k === 'm') toggleMute();
        return;
      }
      if (st === 'paused') {
        if (k === 'escape' || k === 'p' || k === ' ' || k === 'enter') pause(false);
        else if (k === 'r') startStage(G.stage);
        else if (k === 'q') openMap();
        else if (k === 'm') toggleMute();
        return;
      }
      if (st !== 'play') return;
      if (k === 'escape') return pause(true);
      // every letter is a letter while you type (T, M and P too): hold Shift for your brother, sound and pause
      if (e.shiftKey && k === 't') return call();
      if (e.shiftKey && k === 'm') return toggleMute();
      if (e.shiftKey && k === 'p') return pause(true);
      if (k === ' ' || k === 'enter') return sayItem();
      if (/^[a-z;]$/.test(k) && !e.repeat) typeKey(k);
    });
    addEventListener('resize', layout);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        S.suspend();
        if (G.autoPause && G.state === 'play') pause(true);
      } else S.resume();
    });
  }

  // the first tap or key: sound can start, and iPad Safari lets the voice speak
  function first() {
    if (first.done) return;
    first.done = true;
    S.init();
    TY.speech.unlock();
    music(G.musicMode || 'title');
  }

  function pause(on) {
    if (on && G.state === 'play') {
      G.state = 'paused';
      TY.speech.cancel();
      show(ui.pause, true);
      showPlay(false); // the kit's speaker button takes over the mute while our 🔊 is hidden
      music('pause');
    } else if (!on && G.state === 'paused') {
      G.state = 'play';
      show(ui.pause, false);
      showPlay(true);
      music('play');
      layout();
    }
  }

  function toggleMute() {
    S.toggleMute(); // the rest happens in muted() below, whoever flips it
  }
  // Sound off or on, from M, our 🔊, the kit's speaker button or the ? panel: the voice follows.
  function muted(m) {
    ui.muteBtn.textContent = m ? '🔇' : '🔊';
    if (m) TY.speech.cancel();
    else TY.speech.unlock();
  }

  // ---------------------------------------------------------------- the loop

  function step(dt, draw = true) {
    G.time += dt;
    const R = G.R;
    if (G.state === 'play' && R) {
      R.buddyBusy = TY.buddy.typing;
      R_.tick(R, dt);
      if (G.auto && G.bot && !TY.buddy.typing) {
        const k = G.bot(dt);
        if (k) typeKey(k.key);
      }
      stepView(dt);
      if (G.sayAt > 0 && (G.sayAt -= dt) <= 0) sayItem();
      if ((G.statT -= dt) <= 0) {
        G.statT = 0.5;
        markWho();
      }
      ui.callBtn.classList.toggle('here', TY.buddy.here);
    } else if (G.state === 'title' || G.state === 'map') {
      // the boys on the menu: a wave now and then
      if (Math.random() < dt * 0.25) pick(Object.values(actors)).react(Math.random() < 0.5 ? 'hop' : 'hello');
    }
    const gdt = G.state === 'paused' ? 0 : dt;
    stepToasts(gdt);
    for (const id in actors) actors[id].update(gdt);
    TY.buddy.update(gdt);
    flyers3d.update(gdt);
    bursts.update(gdt);
    TY.fx.overlay.update(gdt);
    ST.update(gdt, G.time);
    if (G.state === 'title' || G.state === 'map') ST.frame(0, gdt);
    if (draw) ST.render();
  }

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    if (!G.held) step(dt);
  }

  // ---------------------------------------------------------------- the buddy's side of typing

  const buddyApi = {
    startBuddyWord() {
      const R = G.R;
      if (G.state !== 'play' || !R || R.done) return false;
      const it = R_.item(R);
      it.kidUpTo = R.pos;
      R.buddyBusy = true;
      return true;
    },
    buddyKey() {
      const R = G.R;
      if (!R || R.done || G.state !== 'play') return null;
      const res = R_.buddyPress(R);
      if (!res.ok) return null;
      TY.kb.flash(res.key, 'buddy');
      TY.sfx.key(R.pos ? R.pos - 1 : 0, true);
      ST.nudge(res.finished ? R.i - 1 : R.i);
      if (res.finished) wordDone(res.finished, true);
      else renderCard();
      return res;
    },
    endBuddyWord() {
      if (G.R) G.R.buddyBusy = false;
    },
  };

  // ---------------------------------------------------------------- boot

  function boot() {
    for (const id of ['canvas', 'hud', 'tl', 'tr', 'who', 'card', 'pic', 'zh', 'han', 'py', 'boxes', 'dots', 'turn', 'pauseBtn', 'muteBtn', 'callBtn', 'callFace', 'callLbl', 'toasts',
      'kbWrap', 'kb', 'hands', 'title', 'logoBig', 'learn', 'segPlayers', 'segWho', 'levels', 'playBtn', 'titleBest', 'map', 'mapLessons', 'mapLevels', 'mapBack', 'mapWho',
      'over', 'oTitle', 'oWhat', 'oRows', 'oNote', 'oNext', 'oAgain', 'oMap', 'pause', 'resumeBtn', 'restartBtn', 'quitBtn']) ui[id] = $(id === 'canvas' ? 'game' : id);
    if (/[?&]touch=1/.test(location.search) || (matchMedia && matchMedia('(hover: none)').matches)) document.body.classList.add('touch');
    ST.init(ui.canvas);
    TY.fx.overlay.init($('fx'));
    flyers3d = TY.fx.flyers(ST.scene, 70);
    bursts = TY.fx.bursts(ST.scene, 6);
    art = Kit.portraits(['teddy', 'tommy'].map((id) => Kit.roster.get(id)), { size: 160 });
    for (const id of ['teddy', 'tommy']) {
      const a = TY.makeActor();
      a.attach(ST.scene, flyers3d);
      a.set(id, 1);
      actors[id] = a;
    }
    TY.speech.hooks({ muted: () => S.isMuted(), duck: (on) => S.music(on ? 'pause' : G.musicMode) });
    TY.buddy.init(Object.assign({
      scene: ST.scene, flyers: flyers3d, toast,
      playing: () => G.state === 'play',
      hero: () => heroActor(),
      both: () => heroes(),
      players: () => (G.R ? G.R.players.length : 1),
      actorFor: (id) => actors[id],
    }, buddyApi));
    ui.muteBtn.textContent = S.isMuted() ? '🔇' : '🔊';
    if (S.onMute) S.onMute(muted);
    buildTitle();
    bindInput();
    Kit.lang.onChange(() => {
      if (G.langQuiet) return;
      if (G.state === 'play' || G.state === 'paused') startStage(G.stage); // English words or pinyin: a fresh stage
      else if (G.state === 'over') openMap();
      else if (G.state === 'map') renderMap();
      refreshTitle();
    });
    goTitle();
    $('loading').classList.add('hidden');
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- test hook

  window.game = {
    // advance `secs` of game time in 1/60 s steps, drawing once at the end (works while the pane is hidden)
    step(secs = 0.1) {
      const n = Math.max(1, Math.round(secs * 60));
      for (let i = 0; i < n; i++) step(1 / 60, i === n - 1);
      return game.info();
    },
    hold(on = true) { G.held = on; },
    // start({ kind: 'lesson' | 'adventure', ix, players: 1 | 2, who, level, levels: { teddy, tommy }, lang: 'en' | 'zh', seed })
    start(o = {}) {
      startStage({ kind: o.kind || 'lesson', ix: o.ix || 0 }, Object.assign({ players: o.players || 1 }, o));
      return game.info();
    },
    home: () => goTitle(),
    map: () => openMap(),
    next: () => next(),
    pause: (on = true) => pause(on),
    call: () => call(),
    say: () => sayItem(),
    // type a key (or a whole string) as the player
    type(s) {
      for (const ch of String(s)) typeKey(ch);
      return game.info();
    },
    // type what's needed now, n keys (the right ones)
    typeRight(n = 1) {
      for (let i = 0; i < n && G.R && !G.R.done; i++) typeKey(R_.need(G.R));
      return game.info();
    },
    // the autopilot types for the player (slip: how often it hits a wrong key first; every: seconds a key)
    auto(on = true, slip = 0.1, every = 0.3) {
      G.auto = on;
      G.autoSlip = slip;
      G.autoEvery = every;
      G.bot = on && G.R ? R_.makeBot(G.R, { slip, seed: 99, every }) : null;
    },
    // run the stage to the results screen (autopilot), at most `secs` of game time
    finish(secs = 240) {
      const was = G.auto;
      if (!was) game.auto(true, 0.08, 0.25);
      for (let t = 0; t < secs && G.state === 'play'; t += 0.5) for (let i = 0; i < 30; i++) step(1 / 60, false);
      if (!was) game.auto(false);
      ST.render();
      return game.info();
    },
    key: (k, o = {}) => dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k }, o))),
    tapKey: (k) => {
      const el = TY.kb.keyEl(k);
      if (el) el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    },
    check: (o) => TY.check(o),
    resetSave() {
      for (const k of Object.keys(store.stars)) delete store.stars[k];
      store.best = { teddy: 0, tommy: 0 };
      store.total = { teddy: 0, tommy: 0 };
      save();
    },
    info() {
      const R = G.R;
      const it = R && R_.item(R);
      return {
        state: G.state, lang: lang(), stage: Object.assign({}, G.stage), players: R ? R.players.map((p) => p.id + '/' + p.level) : playersNow().map((p) => p.id + '/' + p.level),
        item: it ? it.show : null, text: it ? it.text : null, need: R ? R_.need(R) : null, i: R ? R.i : -1, n: R ? R.items.length : 0, pos: R ? R.pos : 0, done: R ? R.done : false,
        results: R ? R_.results(R) : null, final: G.results, hero: heroes().map((a) => +a.root.position.x.toFixed(2)), k: G.v.k, chest: G.v.chestT,
        obstacles: ST.obstacles.map((o) => (o.cleared ? 'x' : o.typed ? 't' : '.')).join(''), buddy: TY.buddy.info(), speech: TY.speech.last,
        sel: G.sel, theme: ST.theme, kbNext: TY.kb.next_, store: JSON.parse(JSON.stringify(store)),
        actors: Object.fromEntries(Object.entries(actors).map(([id, a]) => [id, { visible: a.visible, pose: a.pose, scale: +a.scale.toFixed(3), x: +a.root.position.x.toFixed(2) }])),
      };
    },
    get G() { return G; },
    get rules() { return R_; },
  };

  let booted = false;
  const go = () => {
    if (booted) return;
    booted = true;
    boot();
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go);
  setTimeout(go, 1500);
})();
