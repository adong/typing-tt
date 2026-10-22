/* TT Typing: your brother. Call him any time, as often as you like, with T (Shift + T while typing) or his face
   button (Kit.roster.buddyFor: Tommy when Teddy plays, Teddy when Tommy plays). A visit:
     pop in at his roster buddyScale behind you, in a puff of stars → hello with his signature move (Teddy's boxing or
     jump shot, Tommy's Y with ✌️) → toss you a treat (🍦 💧 🧃 🍪 🍉 🍌) → the HELPER: he types one word for you,
     letter by letter, his keys flashing gold ("TOMMY SAYS: I'LL TYPE IT!"). His letters never count for or against
     you, and your clock stops while he types → he runs along behind you a while, then waves goodbye and pops out.
   Calling again while he's there brings another treat and another word. With 2 players both brothers are already on
   the trail, so T is a high five instead. */
(function () {
  'use strict';
  const T = THREE;
  const TY = (window.TY = window.TY || {});
  const { pick, emojiTexture, rand } = Kit.gfx;

  const V = { pop: 0.35, treatAt: 0.8, flight: 0.6, typeAt: 1.5, keyEvery: 0.24, stay: 6, bye: 1.5 };
  const TREATS = [['🍦', 'ICE CREAM'], ['💧', 'WATER'], ['🧃', 'JUICE BOX'], ['🍪', 'COOKIE'], ['🍉', 'WATERMELON'], ['🍌', 'BANANA']];

  let api = null, treat = null;
  const b = { phase: 'off', t: 0, actor: null, entry: null, scale: 1, treatAt: -1, typeAt: -1, leaveAt: -1, words: 0, typing: false, keyT: 0, calls: 0, treats: 0, typed: 0, highFives: 0, lastTreat: null, popT: -1, popDir: 1 };
  const fly = { t: -1, emoji: '', name: '', from: new T.Vector3(), to: new T.Vector3() };
  const tmp = new T.Vector3();

  function init(a) {
    api = a;
    treat = new T.Sprite(new T.SpriteMaterial({ depthWrite: false, depthTest: false, transparent: true }));
    treat.visible = false;
    treat.renderOrder = 22;
    api.scene.add(treat);
  }

  // T or his face: returns what happened ('call', 'again', 'high5'), or false (nothing to help with right now)
  function call() {
    if (!api || !api.playing()) return false;
    const hero = api.hero();
    if (!hero || !hero.entry) return false;
    b.calls++;
    if (api.players() === 2) return highFive();
    const id = Kit.roster.buddyFor(hero.entry.id);
    let what = 'again';
    if (b.phase === 'off' || b.phase === 'bye' || !b.actor || b.actor.entry.id !== id) {
      if (b.actor && b.actor.entry.id !== id) hide();
      b.actor = api.actorFor(id);
      b.entry = b.actor.entry;
      b.scale = b.entry.buddyScale || 0.8;
      const p = hero.root.position;
      b.actor.place(p.x - 1.8, 0, -0.9);
      b.actor.faceDefault = -Math.PI / 2 - 0.5;
      b.actor.face = null;
      b.actor.setScale(0.01);
      b.actor.visible = true;
      b.popT = 0;
      b.popDir = 1;
      puff(b.actor.root.position, b.scale);
      TY.sfx.poof();
      b.actor.react('hello');
      b.t = 0;
      b.words = 0;
      what = 'call';
    } else {
      b.actor.react('signature');
      b.t = Math.min(b.t, 0.2);
    }
    b.phase = 'here';
    b.treatAt = b.t + V.treatAt;
    if (b.typeAt < 0 && !b.typing) b.typeAt = b.t + V.typeAt;
    b.words++;
    b.leaveAt = Math.max(b.leaveAt, b.t + V.typeAt + V.stay);
    return what;
  }

  // 2 players: the brothers turn to each other and slap hands
  function highFive() {
    const [a, c] = api.both();
    if (!a || !c) return false;
    b.highFives++;
    for (const [x, y] of [[a, c], [c, a]]) {
      x.face = Math.atan2(-(y.root.position.x - x.root.position.x), -(y.root.position.z - x.root.position.z));
      x.act('high5', 0.9, 2.4, true);
    }
    setTimeout(() => { a.face = null; c.face = null; }, 950);
    const m = a.root.position.clone().add(c.root.position).multiplyScalar(0.5);
    for (let i = 0; i < 8; i++) api.flyers.add(pick(['✋', '⭐', '✨']), m.x + rand(-0.4, 0.4), 2.4 + rand(0, 0.6), m.z, rand(-2, 2), rand(1, 3), 0.5, 0.9, rand(-3, 3), 3);
    TY.sfx.clap();
    api.toast('HIGH FIVE!', 'treat');
    return 'high5';
  }

  function puff(pos, s) {
    for (let i = 0; i < 10; i++) api.flyers.add(pick(['⭐', '✨', '💫']), pos.x + rand(-0.6, 0.6) * s, pos.y + rand(0.4, 2) * s, pos.z, rand(-2, 2), rand(0.5, 2.5), 0.45 * s, 0.7, rand(-3, 3), 2);
  }

  function throwTreat() {
    const hero = api.hero();
    if (!hero || !hero.person) return;
    const [emoji, name] = pick(TREATS);
    fly.emoji = emoji;
    fly.name = name;
    treat.material.map = emojiTexture(emoji);
    treat.material.needsUpdate = true;
    Kit.people.handWorld(b.actor.person, 1, fly.from);
    Kit.people.handWorld(hero.person, -1, fly.to);
    fly.t = 0;
    treat.visible = true;
    b.actor.act('give', 0.6, 0, true);
    TY.sfx.whoosh();
  }

  function landTreat() {
    const hero = api.hero();
    treat.visible = false;
    fly.t = -1;
    b.treats++;
    b.lastTreat = fly.emoji;
    if (hero) {
      hero.hold(fly.emoji, 6);
      hero.react('hop');
    }
    api.toast(`${fly.emoji} ${fly.name} FROM ${b.entry.name.toUpperCase()}!`, 'treat');
  }

  // the helper: he types the word that's up, a letter at a time
  function startTyping() {
    if (!api.startBuddyWord()) {
      b.words = 0;
      return;
    }
    b.typing = true;
    b.keyT = 0.15;
    b.actor.act('grab', 30, 0, true);
    api.toast(`${b.entry.name.toUpperCase()} SAYS: I'LL TYPE IT!`, 'hint');
  }

  function stepTyping(dt) {
    b.keyT -= dt;
    if (b.keyT > 0) return;
    b.keyT = V.keyEvery;
    const r = api.buddyKey(); // { key, finished, done }
    if (!r) return endTyping();
    b.typed++;
    Kit.people.handWorld(b.actor.person, Math.random() < 0.5 ? -1 : 1, tmp);
    if (r.key && r.key !== ' ') api.flyers.add(r.key === ';' ? '✨' : r.key.toUpperCase(), tmp.x, tmp.y + 0.2, tmp.z + 0.3, rand(0.5, 1.5), rand(2, 3), 0.42, 0.8, 0, 2);
    if (r.finished || r.done) endTyping();
  }

  function endTyping() {
    b.typing = false;
    api.endBuddyWord();
    b.actor.react('idle');
    b.actor.react('hop');
    b.words = Math.max(0, b.words - 1);
    if (b.words > 0 && api.playing()) b.typeAt = b.t + 0.5;
    else b.typeAt = -1;
    b.leaveAt = Math.max(b.leaveAt, b.t + V.stay * 0.6);
  }

  function hide() {
    if (!b.actor) return;
    if (b.typing) {
      b.typing = false;
      api.endBuddyWord();
    }
    b.actor.visible = false;
    b.actor.react('idle');
    b.phase = 'off';
    b.popT = -1;
    b.typeAt = -1;
    b.words = 0;
  }

  // the stage is over, or we're off to the menu
  function dismiss() {
    if (treat) treat.visible = false;
    fly.t = -1;
    if (b.phase !== 'off') hide();
    b.actor = null;
    b.phase = 'off';
    b.leaveAt = -1;
  }

  function update(dt) {
    if (!api) return;
    if (fly.t >= 0) {
      fly.t += dt / V.flight;
      const u = Math.min(1, fly.t);
      const hero = api.hero();
      if (hero && hero.person) Kit.people.handWorld(hero.person, -1, fly.to);
      tmp.lerpVectors(fly.from, fly.to, u);
      tmp.y += Math.sin(u * Math.PI) * 1.6;
      treat.position.copy(tmp);
      treat.scale.setScalar(0.7 + Math.sin(u * Math.PI) * 0.3);
      treat.material.rotation += dt * 6;
      if (u >= 1) landTreat();
    }
    if (b.phase === 'off' || !b.actor) return;
    b.t += dt;
    // he runs along behind you
    const hero = api.hero();
    if (hero) b.actor.moveTo(hero.root.position.x - 1.8, -0.9, 9);
    if (b.popT >= 0) {
      b.popT += dt / V.pop;
      const u = Math.min(1, b.popT);
      const k = b.popDir > 0 ? 1 - Math.pow(1 - u, 3) * Math.cos(u * 5) : 1 - u;
      b.actor.setScale(Math.max(0.01, b.scale * k));
      if (u >= 1) {
        b.popT = -1;
        if (b.popDir < 0) hide();
      }
    }
    if (b.phase === 'here') {
      if (b.treatAt >= 0 && b.t >= b.treatAt) {
        b.treatAt = -1;
        throwTreat();
      }
      if (!b.typing && b.typeAt >= 0 && b.t >= b.typeAt) {
        b.typeAt = -1;
        startTyping();
      }
      if (b.typing) stepTyping(dt);
      if (!b.typing && b.typeAt < 0 && b.treatAt < 0 && b.t >= b.leaveAt) {
        b.phase = 'bye';
        b.byeT = 0;
        b.actor.react('goodbye');
      }
    } else if (b.phase === 'bye') {
      b.byeT += dt;
      if (b.byeT >= V.bye && b.popT < 0) {
        b.popT = 0;
        b.popDir = -1;
        puff(b.actor.root.position, b.scale);
        TY.sfx.poof();
      }
    }
  }

  TY.buddy = {
    init, call, update, dismiss,
    get here() { return b.phase !== 'off'; },
    get typing() { return b.typing; },
    get actor() { return b.actor; },
    info: () => ({ phase: b.phase, who: b.entry && b.entry.id, calls: b.calls, treats: b.treats, typed: b.typed, typing: b.typing, words: b.words, highFives: b.highFives, lastTreat: b.lastTreat, flying: fly.t >= 0, scale: b.actor ? +b.actor.scale.toFixed(3) : 0 }),
    TREATS, V,
  };
})();
