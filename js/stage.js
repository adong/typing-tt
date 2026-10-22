/* TT Typing: the trail, seen from the side. Three.js, everything from boxes, spheres and canvas paint.
   - build(theme, n): a trail with n obstacles, 7 m apart, and a treasure chest at the end. Themes: camp (the
     lessons), meadow, forest, snow, beach, candy. Each has its own sky, ground, trees and obstacle colours.
   - Obstacles: log, cone and slime you jump over (the slime squishes and bounces away), rock and crate you smash,
     a stream you leap. Over each one a sign shows its word; it turns green with a ✓ once typed.
   - The camera follows the hero, framed into the band between the word card and the keyboard (frame()). */
(function () {
  'use strict';
  const T = THREE;
  const TY = (window.TY = window.TY || {});
  const G = Kit.gfx;
  const { rand, pick } = G;

  const START = 6, GAP = 7;
  const THEMES = {
    camp: { sky: '#8fd3ff', fog: '#cfeeff', ground: '#6cc24a', path: '#d8b077', hill: '#4fae3c', tree: 'round', leaf: '#3f9d35', flowers: ['#ffffff', '#ffd400'], obs: ['crate', 'cone', 'crate', 'cone', 'log'], obsColor: '#c98a45', slime: '#5fe36a' },
    meadow: { sky: '#7cc9ff', fog: '#d9f2ff', ground: '#7bd256', path: '#e0bd84', hill: '#58b843', tree: 'round', leaf: '#3faa3a', flowers: ['#ff5ea8', '#ffd400', '#ffffff', '#b07cff'], obs: ['log', 'rock', 'slime', 'stream', 'crate'], obsColor: '#9aa3ad', slime: '#5fe36a' },
    forest: { sky: '#6fb6e8', fog: '#bfe3d0', ground: '#3f9a45', path: '#9b7448', hill: '#2f7d3d', tree: 'pine', leaf: '#1f6e3a', flowers: ['#ff4b3e', '#ffffff'], obs: ['log', 'slime', 'rock', 'log', 'stream'], obsColor: '#7d858f', slime: '#b07cff' },
    snow: { sky: '#a9d8ff', fog: '#eef7ff', ground: '#f4f8ff', path: '#d4e3f2', hill: '#e3eefa', tree: 'snowpine', leaf: '#2c7d55', flowers: ['#bfe6ff'], obs: ['rock', 'log', 'slime', 'stream', 'crate'], obsColor: '#cfe6ff', slime: '#5fd0ff' },
    beach: { sky: '#5fc4ff', fog: '#d6f3ff', ground: '#f3d98f', path: '#ead08a', hill: '#33b6d9', tree: 'palm', leaf: '#2fae4a', flowers: ['#ff8a1f', '#ffffff'], obs: ['crate', 'stream', 'rock', 'slime', 'log'], obsColor: '#c7b08a', slime: '#ff9a3d' },
    candy: { sky: '#ffc4ec', fog: '#ffe6f7', ground: '#ff9fd0', path: '#fff1c2', hill: '#c99bff', tree: 'lolly', leaf: '#ff5ea8', flowers: ['#ffffff', '#5fe3ff', '#ffd400'], obs: ['crate', 'slime', 'cone', 'rock', 'log'], obsColor: '#ff7ac8', slime: '#ff5ea8' },
  };
  // jump or smash, and where the hero stops in front of it
  const KIND = { log: 'jump', cone: 'jump', slime: 'jump', stream: 'jump', rock: 'smash', crate: 'smash' };

  let renderer, scene, camera, world = null, hemi, sun;
  const st = { W: 1, H: 1, band: { top: 0, bottom: 1, feet: 1, x: 0.35 }, camX: 0, ppm: 60, theme: 'camp' };
  const obstacles = [];
  let chest = null;
  const debris = [];

  function init(canvas) {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(30, 1, 0.5, 400);
    hemi = new T.HemisphereLight(0xffffff, 0x6b8f4e, 0.95);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xffffff, 0.85);
    sun.position.set(6, 12, 9);
    scene.add(sun);
    scene.add(sun.target);
    // debris pieces for smashed rocks and crates
    for (let i = 0; i < 24; i++) {
      const m = new T.Mesh(new T.BoxGeometry(0.28, 0.28, 0.28), G.std('#999999'));
      m.visible = false;
      scene.add(m);
      debris.push({ m, v: new T.Vector3(), spin: new T.Vector3(), life: 0 });
    }
  }

  // ---------------------------------------------------------------- the world

  function clearWorld() {
    if (!world) return;
    scene.remove(world);
    world.traverse((o) => {
      if (o.isMesh || o.isSprite) {
        if (o.geometry) o.geometry.dispose();
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (m.map && m.map.userData && m.map.userData.own) m.map.dispose();
          m.dispose();
        }
      }
    });
    world = null;
    obstacles.length = 0;
    chest = null;
  }

  // items: the stage's items (signs), players: ['teddy'] or ['tommy', 'teddy'] (whose sign colour)
  function build(themeName, items = [], players = []) {
    clearWorld();
    const th = THEMES[themeName] || THEMES.camp;
    st.theme = themeName;
    world = new T.Group();
    scene.add(world);
    scene.background = new T.Color(th.sky);
    scene.fog = new T.Fog(th.fog, 40, 140);
    hemi.groundColor.set(G.shade(th.ground, -0.3));
    const n = items.length;
    const len = START + Math.max(0, n - 1) * GAP + 12;
    const r = Kit.gfx.rand;
    // ground, path and a strip of front grass
    const ground = G.mesh(new T.PlaneGeometry(len + 160, 120), G.std(th.ground, { roughness: 1 }), len / 2, 0, -40, world, false);
    ground.rotation.x = -Math.PI / 2;
    const path = G.mesh(new T.PlaneGeometry(len + 160, 3.2), G.std(th.path, { roughness: 1 }), len / 2, 0.01, 0, world, false);
    path.rotation.x = -Math.PI / 2;
    for (const z of [-1.6, 1.6]) {
      const edge = G.mesh(new T.BoxGeometry(len + 160, 0.08, 0.18), G.std(G.shade(th.path, -0.18)), len / 2, 0.04, z, world, false);
      edge.receiveShadow = false;
    }
    // hills far back
    const hillMat = G.std(th.hill, { roughness: 1 });
    for (let x = -60; x < len + 80; x += rand(14, 24)) {
      const h = G.mesh(new T.SphereGeometry(1, 20, 12), hillMat, x, -2, rand(-60, -40), world, false);
      h.scale.set(rand(14, 24), rand(8, 14), 8);
    }
    // the sun and clouds
    const sunS = new T.Sprite(new T.SpriteMaterial({ map: G.radialTexture(128, [[0, '#fffbe0'], [0.35, '#ffe270'], [0.5, 'rgba(255,226,112,0.35)'], [1, 'rgba(255,226,112,0)']]), fog: false, depthWrite: false }));
    sunS.scale.setScalar(16);
    sunS.position.set(len * 0.4, 26, -90);
    world.add(sunS);
    const cloudMat = G.std(themeName === 'candy' ? '#fff6fd' : '#ffffff', { roughness: 1 });
    for (let x = -40; x < len + 60; x += rand(12, 22)) {
      const c = new T.Group();
      for (let i = 0; i < 4; i++) G.mesh(new T.SphereGeometry(rand(1, 1.7), 12, 8), cloudMat, i * 1.4 - 2, rand(-0.3, 0.3), 0, c, false);
      c.position.set(x, rand(9, 14), rand(-45, -30));
      world.add(c);
    }
    // trees behind the trail, a few flowers and tufts in front
    for (let x = -24; x < len + 30; x += rand(3, 6)) tree(th, x + rand(-1, 1), rand(-14, -4.5), rand(0.8, 1.3));
    const fl = th.flowers.map((c) => G.std(c));
    for (let x = -24; x < len + 30; x += rand(0.8, 2)) {
      const z = rand(1.9, 4.2);
      G.mesh(new T.SphereGeometry(0.11, 8, 6), pick(fl), x, 0.12, z, world, false);
      if (r() < 0.5) G.mesh(new T.ConeGeometry(0.12, 0.35, 5), G.std(G.shade(th.ground, -0.15)), x + 0.3, 0.17, z + rand(-0.3, 0.3), world, false);
    }
    // the obstacles and their signs
    items.forEach((it, i) => obstacles.push(obstacle(th, th.obs[i % th.obs.length], START + i * GAP, it, players[it.player] || players[0])));
    chest = makeChest(START + Math.max(0, n - 1) * GAP + 9);
    return { len, n };
  }

  function tree(th, x, z, s) {
    const g = new T.Group();
    const trunk = G.std(th.tree === 'lolly' ? '#ffffff' : '#8a5a33');
    if (th.tree === 'round') {
      G.mesh(new T.CylinderGeometry(0.16, 0.22, 1.4, 8), trunk, 0, 0.7, 0, g);
      G.mesh(new T.SphereGeometry(1, 12, 10), G.std(G.shade(th.leaf, rand(-0.1, 0.1))), 0, 2, 0, g);
    } else if (th.tree === 'pine' || th.tree === 'snowpine') {
      G.mesh(new T.CylinderGeometry(0.14, 0.2, 1, 8), trunk, 0, 0.5, 0, g);
      for (let i = 0; i < 3; i++) {
        G.mesh(new T.ConeGeometry(1.2 - i * 0.3, 1.3, 9), G.std(G.shade(th.leaf, rand(-0.1, 0.05))), 0, 1.3 + i * 0.75, 0, g);
        if (th.tree === 'snowpine') G.mesh(new T.ConeGeometry(0.55 - i * 0.12, 0.45, 9), G.std('#ffffff'), 0, 1.75 + i * 0.75, 0, g);
      }
    } else if (th.tree === 'palm') {
      const tr = G.mesh(new T.CylinderGeometry(0.12, 0.2, 3, 8), trunk, 0, 1.5, 0, g);
      tr.rotation.z = 0.12;
      for (let i = 0; i < 6; i++) {
        const leaf = G.mesh(new T.BoxGeometry(1.6, 0.08, 0.4), G.std(th.leaf), 0.2, 3, 0, g);
        leaf.rotation.y = (i / 6) * Math.PI * 2;
        leaf.rotation.z = -0.4;
        leaf.position.x = 0.2 + Math.cos(leaf.rotation.y) * 0.6;
        leaf.position.z = -Math.sin(leaf.rotation.y) * 0.6;
      }
    } else if (th.tree === 'lolly') {
      G.mesh(new T.CylinderGeometry(0.07, 0.07, 2, 6), trunk, 0, 1, 0, g);
      const top = G.mesh(new T.CylinderGeometry(0.7, 0.7, 0.18, 20), G.std(pick(['#ff5ea8', '#5fe3ff', '#ffd400', '#b07cff'])), 0, 2.4, 0, g);
      top.rotation.x = Math.PI / 2;
      const swirl = G.mesh(new T.TorusGeometry(0.4, 0.07, 6, 18), G.std('#ffffff'), 0, 2.4, 0.1, g);
      swirl.rotation.z = 1;
    }
    g.position.set(x, 0, z);
    g.scale.setScalar(s);
    world.add(g);
  }

  // ---------------------------------------------------------------- obstacles

  function obstacle(th, type, x, item, who) {
    const g = new T.Group();
    g.position.set(x, 0, 0);
    world.add(g);
    const o = { type, kind: KIND[type], x, g, item, typed: false, cleared: false, wob: 9, t: 0, gone: false, sign: null, signFor: who, parts: [] };
    if (type === 'log') {
      const log = G.mesh(new T.CylinderGeometry(0.38, 0.38, 2.6, 14), G.std('#8a5a33'), 0, 0.38, 0, g);
      log.rotation.x = Math.PI / 2;
      for (const z of [-1.3, 1.3]) {
        const end = G.mesh(new T.CylinderGeometry(0.3, 0.3, 0.03, 14), G.std('#e8c28e'), 0, 0.38, z, g, false);
        end.rotation.x = Math.PI / 2;
      }
    } else if (type === 'cone') {
      for (const z of [-0.8, 0.8]) {
        G.mesh(new T.ConeGeometry(0.32, 0.8, 12), G.std(th.obsColor === '#ff7ac8' ? '#ff7ac8' : '#ff7a1a'), 0, 0.4, z, g);
        G.mesh(new T.CylinderGeometry(0.19, 0.24, 0.12, 12), G.std('#ffffff'), 0, 0.45, z, g, false);
      }
      const bar = G.mesh(new T.BoxGeometry(0.12, 0.12, 1.8), G.std('#ffd400'), 0, 0.62, 0, g);
      o.parts.push(bar);
    } else if (type === 'slime') {
      const body = G.mesh(new T.SphereGeometry(0.62, 18, 12), G.std(th.slime, { roughness: 0.35 }), 0, 0.5, 0, g);
      body.scale.set(1, 0.8, 1);
      for (const s of [-1, 1]) {
        G.mesh(new T.SphereGeometry(0.13, 10, 8), G.std('#ffffff'), s * 0.2, 0.68, 0.5, g, false);
        G.mesh(new T.SphereGeometry(0.06, 8, 6), G.std('#14121f'), s * 0.2, 0.68, 0.61, g, false);
      }
      o.body = body;
    } else if (type === 'stream') {
      const w = G.mesh(new T.PlaneGeometry(2.2, 3.4), new T.MeshStandardMaterial({ color: '#3fb6ff', roughness: 0.2, metalness: 0.1 }), 0, 0.02, 0, g, false);
      w.rotation.x = -Math.PI / 2;
      for (const s of [-1, 1]) G.mesh(new T.BoxGeometry(0.2, 0.14, 3.4), G.std(G.shade(th.path, -0.25)), s * 1.15, 0.07, 0, g, false);
      o.water = w;
    } else if (type === 'rock') {
      const rock = G.mesh(new T.IcosahedronGeometry(0.75, 0), G.std(th.obsColor, { flatShading: true }), 0, 0.6, 0, g);
      rock.scale.set(1, 0.85, 1.3);
      o.color = th.obsColor;
    } else if (type === 'crate') {
      const [c, gx] = G.makeCanvas(128, 128);
      gx.fillStyle = '#d29a55';
      gx.fillRect(0, 0, 128, 128);
      gx.strokeStyle = '#8a5a2b';
      gx.lineWidth = 12;
      gx.strokeRect(6, 6, 116, 116);
      gx.beginPath();
      gx.moveTo(10, 10);
      gx.lineTo(118, 118);
      gx.stroke();
      const tex = G.toTexture(c);
      tex.userData.own = true;
      G.mesh(new T.BoxGeometry(1.2, 1.2, 1.2), new T.MeshStandardMaterial({ map: tex, roughness: 0.9 }), 0, 0.6, 0, g);
      o.color = '#d29a55';
    }
    o.sign = makeSign(item, who, false);
    o.sign.position.set(0, type === 'stream' ? 1.6 : 2.3, 0);
    g.add(o.sign);
    return o;
  }

  // a word sign, drawn on a canvas (the word being taught, so it's never translated)
  const SIGN_COL = { teddy: '#2f7cf0', tommy: '#ff8a1f' };
  function makeSign(item, who, done) {
    const s = new T.Sprite(new T.SpriteMaterial({ depthWrite: false, transparent: true, fog: false }));
    s.renderOrder = 15;
    drawSign(s, item, who, done);
    return s;
  }
  function drawSign(s, item, who, done) {
    const [c, g] = G.makeCanvas(512, 192);
    const ink = '#14121f';
    const text = item.show;
    const zh = /[一-鿿]/.test(text);
    G.roundRect(g, 10, 10, 492, 150, 34);
    g.fillStyle = done ? '#b8f59e' : '#ffffff';
    g.fill();
    g.lineWidth = 10;
    g.strokeStyle = who ? SIGN_COL[who] || ink : ink;
    g.stroke();
    // the little tail under the sign
    g.beginPath();
    g.moveTo(236, 156);
    g.lineTo(256, 186);
    g.lineTo(276, 156);
    g.fillStyle = who ? SIGN_COL[who] || ink : ink;
    g.fill();
    const emo = item.emoji || '';
    let x0 = 256;
    let size = zh ? 96 : 92;
    g.font = `800 ${size}px ${zh ? '"Kaiti SC", "STKaiti", KaiTi, "PingFang SC", sans-serif' : 'Rubik, "Arial Rounded MT Bold", system-ui, sans-serif'}`;
    let w = g.measureText(text).width + (emo ? 100 : 0) + (done ? 70 : 0);
    if (w > 450) {
      size = Math.floor((size * 450) / w);
      g.font = g.font.replace(/\d+px/, size + 'px');
      w = 450;
    }
    let x = x0 - w / 2;
    g.textBaseline = 'middle';
    if (emo) {
      g.font = `${Math.round(size * 0.85)}px ${G.EMOJI_FONT}`;
      g.fillText(emo, x, 88);
      x += 100 * (size / 92);
      g.font = `800 ${size}px ${zh ? '"Kaiti SC", "STKaiti", KaiTi, "PingFang SC", sans-serif' : 'Rubik, "Arial Rounded MT Bold", system-ui, sans-serif'}`;
    }
    g.fillStyle = ink;
    g.fillText(text, x, 90);
    if (done) {
      x += g.measureText(text).width + 14;
      g.fillStyle = '#2e9e2a';
      g.fillText('✓', x, 90);
    }
    if (s.material.map) s.material.map.dispose();
    s.material.map = G.toTexture(c);
    s.material.needsUpdate = true;
    s.scale.set(2.4, 0.9, 1);
  }

  function markTyped(i) {
    const o = obstacles[i];
    if (!o || o.typed) return;
    o.typed = true;
    o.wob = 0;
    drawSign(o.sign, o.item, o.signFor, true);
  }
  // a typed letter: the obstacle shivers
  function nudge(i) {
    const o = obstacles[i];
    if (o) o.wob = 0;
  }

  // the hero clears obstacle i: smash it, squish it, or (log, cone, stream) leave it be
  function clear(i) {
    const o = obstacles[i];
    if (!o || o.cleared) return;
    o.cleared = true;
    o.t = 0;
    if (o.type === 'rock' || o.type === 'crate') {
      o.g.children.forEach((c) => { if (c !== o.sign) c.visible = false; });
      for (let k = 0; k < 10; k++) {
        const d = debris.find((x) => x.life <= 0) || debris[k];
        d.m.material.color.set(o.color);
        d.m.position.set(o.x + rand(-0.4, 0.4), rand(0.3, 1.1), rand(-0.5, 0.5));
        d.m.scale.setScalar(rand(0.6, 1.4));
        d.v.set(rand(1, 5), rand(3, 7), rand(-2, 3));
        d.spin.set(rand(-8, 8), rand(-8, 8), rand(-8, 8));
        d.life = 1.1;
        d.m.visible = true;
      }
    }
    if (o.type === 'slime') o.hopT = 0;
  }

  function makeChest(x) {
    const g = new T.Group();
    g.position.set(x, 0, 0);
    world.add(g);
    const gold = G.std('#ffcc33', { metalness: 0.4, roughness: 0.4 });
    const wood = G.std('#b4642d');
    G.mesh(new T.BoxGeometry(1.4, 0.8, 1), wood, 0, 0.4, 0, g);
    G.mesh(new T.BoxGeometry(1.46, 0.12, 1.06), gold, 0, 0.75, 0, g);
    // the treasure inside: a heap of gold and gems, seen once the lid opens
    const heap = G.mesh(new T.SphereGeometry(0.6, 16, 10), gold, 0, 0.72, 0, g, false);
    heap.scale.set(1.05, 0.35, 0.75);
    for (const [x, c] of [[-0.3, '#ff3d7f'], [0.1, '#18d4ff'], [0.35, '#7ed957']]) G.mesh(new T.OctahedronGeometry(0.13), G.std(c, { metalness: 0.3, roughness: 0.2 }), x, 0.92, 0.1, g, false);
    const lid = new T.Group();
    lid.position.set(0, 0.8, -0.5);
    g.add(lid);
    G.mesh(new T.BoxGeometry(1.46, 0.34, 1.06), wood, 0, 0.17, 0.5, lid);
    G.mesh(new T.BoxGeometry(1.5, 0.08, 1.1), gold, 0, 0.34, 0.5, lid);
    G.mesh(new T.BoxGeometry(0.22, 0.3, 0.08), gold, 0, 0.05, 1.05, lid);
    // a flag behind it
    G.mesh(new T.CylinderGeometry(0.05, 0.05, 3, 8), G.std('#ffffff'), 1.2, 1.5, -0.6, g);
    const flag = G.mesh(new T.BoxGeometry(0.9, 0.55, 0.04), G.std('#ff3d7f'), 1.65, 2.7, -0.6, g);
    return { g, lid, flag, x, open: 0, opening: false };
  }

  // ---------------------------------------------------------------- per frame

  function update(dt, time) {
    for (const o of obstacles) {
      o.wob += dt;
      const w = Math.exp(-o.wob * 6) * Math.sin(o.wob * 40) * 0.06;
      o.g.rotation.z = o.cleared ? 0 : w;
      o.sign.position.y = (o.type === 'stream' ? 1.6 : 2.3) + Math.sin(time * 2 + o.x) * 0.05;
      if (o.cleared) {
        o.t += dt;
        o.sign.material.opacity = Math.max(0, 1 - o.t * 1.5);
        if (o.type === 'slime' && o.body) {
          // squish, then bounce off into the trees
          const u = o.t;
          if (u < 0.25) o.body.scale.set(1.25, 0.45, 1.25);
          else {
            o.body.scale.set(1, 0.8, 1);
            o.g.position.z = -Math.min(9, (u - 0.25) * 7);
            o.g.position.y = Math.abs(Math.sin((u - 0.25) * 9)) * 0.9 * Math.max(0, 1 - (u - 0.25) / 1.6);
          }
        }
        if (o.type === 'cone' && o.parts[0]) o.parts[0].rotation.x = Math.min(1.2, o.t * 6);
      } else if (o.type === 'slime' && o.body) {
        const b = 1 + Math.sin(time * 4 + o.x) * 0.05;
        o.body.scale.set(b, 0.8 / b, b);
      }
      if (o.water) o.water.material.color.setHSL(0.56, 0.9, 0.6 + Math.sin(time * 3 + o.x) * 0.04);
    }
    for (const d of debris) {
      if (d.life <= 0) continue;
      d.life -= dt;
      d.v.y -= 16 * dt;
      d.m.position.addScaledVector(d.v, dt);
      if (d.m.position.y < 0.14) {
        d.m.position.y = 0.14;
        d.v.y *= -0.35;
        d.v.x *= 0.6;
      }
      d.m.rotation.x += d.spin.x * dt;
      d.m.rotation.y += d.spin.y * dt;
      d.m.scale.multiplyScalar(d.life < 0.3 ? 0.9 : 1);
      if (d.life <= 0) d.m.visible = false;
    }
    if (chest) {
      if (chest.opening) chest.open = Math.min(1, chest.open + dt * 2.5);
      chest.lid.rotation.x = -chest.open * 1.9;
      chest.flag.rotation.y = Math.sin(time * 3) * 0.2;
    }
  }

  // ---------------------------------------------------------------- the camera

  // band: the screen strip (px) the trail shows in: { top, bottom, feet (px), x (0..1 where the hero stands) }
  function setBand(b) {
    Object.assign(st.band, b);
    applyCamera();
  }

  function resize(W, H) {
    st.W = W;
    st.H = H;
    renderer.setSize(W, H, false);
    applyCamera();
  }

  function applyCamera() {
    const { W, H, band } = st;
    const bandH = Math.max(60, band.bottom - band.top);
    // pixels per metre at the trail: the band holds about 3.8 m, and the screen at least 9 m across
    st.ppm = Math.max(14, Math.min(bandH / 3.8, W / 9));
    camera.aspect = W / H;
    const fov = 30;
    camera.fov = fov;
    const dist = H / st.ppm / (2 * Math.tan(((fov / 2) * Math.PI) / 180));
    st.dist = dist;
    // the projection centre sits in the band's middle (setViewOffset), the ground line at band.feet
    const mid = (band.top + band.bottom) / 2;
    camera.setViewOffset(W, H, (W / 2 - band.x * W) * 0, H / 2 - mid, W, H);
    st.camY = (band.feet - mid) / st.ppm;
    camera.updateProjectionMatrix();
  }

  // follow x (the hero) so he stands at band.x across the screen
  function frame(x, dt, snap = false) {
    const want = x + (0.5 - st.band.x) * (st.W / st.ppm);
    st.camX = snap ? want : st.camX + (want - st.camX) * (1 - Math.exp(-4 * dt));
    camera.position.set(st.camX, st.camY + 0.4, st.dist);
    camera.lookAt(st.camX, st.camY, 0);
  }

  function render() {
    renderer.render(scene, camera);
  }

  // where a world point lands on the screen (px)
  const v3 = new T.Vector3();
  function toScreen(x, y, z) {
    v3.set(x, y, z).project(camera);
    // project() knows the view offset: it maps into the offset window, which is the whole canvas
    return { x: ((v3.x + 1) / 2) * st.W, y: ((1 - v3.y) / 2) * st.H };
  }

  TY.stage = {
    init, build, resize, setBand, frame, render, update, toScreen, markTyped, nudge, clear,
    get scene() { return scene; },
    get obstacles() { return obstacles; },
    get chest() { return chest; },
    get ppm() { return st.ppm; },
    get theme() { return st.theme; },
    START, GAP, KIND, THEMES,
  };
})();
