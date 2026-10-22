/* TT Typing: the keyboard on the screen, and the two hands above it.
   - Every key is coloured by the finger that presses it (touch typing: pinkies pink, ring fingers orange, middle
     fingers yellow, pointer fingers green and blue). F and J have their bumps.
   - The next key to press glows and bobs, and that finger lights up on the hands: kids look at the screen, not at
     their fingers. A right key flashes green, a wrong one red, and the buddy's keys flash gold.
   - Tap a key to type it (phones and iPads have no keyboard): taps count just like keys. The space bar says the
     word again.
   TY.kb.init(el, handsEl, onKey) builds it; layout(u) sizes it with a key `u` px wide; next(key) marks the next one. */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});
  const K = TY.KEYS;
  let el = null, hands = null, tipEl = null, onKey = null;
  const keyEl = {};
  let nextKey = null;

  function init(kbEl, handsEl, cb) {
    el = kbEl;
    hands = handsEl;
    onKey = cb;
    el.innerHTML = '';
    K.ROWS.forEach((row, r) => {
      const div = document.createElement('div');
      div.className = 'krow r' + r;
      for (const k of row) {
        const b = document.createElement('button');
        b.className = 'key f-' + K.FINGER[k] + (k === 'f' || k === 'j' ? ' bump' : '') + (K.HOME.includes(k) ? ' home' : '');
        b.dataset.k = k;
        b.textContent = k === ';' ? ';' : k.toUpperCase();
        b.setAttribute('aria-label', k === ';' ? ';' : k.toUpperCase());
        b.style.setProperty('--fc', K.FINGERS[K.FINGER[k]].color);
        keyEl[k] = b;
        div.appendChild(b);
      }
      el.appendChild(div);
    });
    const sp = document.createElement('div');
    sp.className = 'krow r3';
    const space = document.createElement('button');
    space.className = 'key space';
    space.dataset.k = ' ';
    space.innerHTML = '🔊 <span>SPACE: hear it again</span>';
    keyEl[' '] = space;
    sp.appendChild(space);
    el.appendChild(sp);
    el.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.key');
      e.stopPropagation();
      e.preventDefault();
      if (b && onKey) onKey(b.dataset.k, true);
    });
    hands.innerHTML = handSVG('left') + '<div class="tip" id="fingerTip"></div>' + handSVG('right');
    tipEl = hands.querySelector('.tip');
  }

  // a hand from rounded bars: palm, four fingers and a thumb, each finger in its colour
  function handSVG(side) {
    const ids = side === 'left' ? ['lp', 'lr', 'lm', 'li'] : ['rp', 'rr', 'rm', 'ri'];
    const tops = [34, 18, 10, 20];
    let s = `<svg class="hand ${side}" viewBox="0 0 100 100" aria-hidden="true"><g${side === 'right' ? ' transform="translate(100 0) scale(-1 1)"' : ''}>`;
    s += '<rect class="palm" x="14" y="50" width="66" height="46" rx="16"/>';
    ids.forEach((f, i) => {
      s += `<rect class="fing f-${f}" x="${16 + i * 16}" y="${tops[i]}" width="13" height="${62 - tops[i]}" rx="6.5" style="--fc:${K.FINGERS[f].color}"/>`;
    });
    s += '<rect class="fing thumb" x="76" y="46" width="12" height="34" rx="6" transform="rotate(38 82 63)"/>';
    return s + '</g></svg>';
  }

  // size the keys: u = one key's width in px
  function layout(u) {
    el.style.setProperty('--u', u.toFixed(1) + 'px');
    hands.style.setProperty('--u', u.toFixed(1) + 'px');
  }

  // the key to press next (null: none), and its finger on the hands
  function next(k) {
    if (nextKey && keyEl[nextKey]) keyEl[nextKey].classList.remove('next');
    nextKey = k;
    for (const f of hands.querySelectorAll('.fing.on')) f.classList.remove('on');
    if (k && keyEl[k]) {
      keyEl[k].classList.add('next');
      const f = K.FINGER[k];
      const fe = hands.querySelector('.f-' + f);
      if (fe) fe.classList.add('on');
      tipEl.textContent = fingerName(k);
    } else tipEl.textContent = '';
  }

  // "left pointer finger"
  function fingerName(k) {
    const f = K.FINGERS[K.FINGER[k]];
    return f ? `${f.hand} ${f.name}` : '';
  }

  // flash a key: 'ok' | 'bad' | 'buddy'
  function flash(k, kind) {
    const b = keyEl[k];
    if (!b) return;
    b.classList.remove('ok', 'bad', 'buddy');
    void b.offsetWidth;
    b.classList.add(kind);
    clearTimeout(b._t);
    b._t = setTimeout(() => b.classList.remove(kind), 260);
  }

  TY.kb = { init, layout, next, flash, fingerName, get next_() { return nextKey; }, keyEl: (k) => keyEl[k] };
})();
