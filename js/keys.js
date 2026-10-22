/* The keys the ? panel shows. Press ? (Shift + /) in the game, or tap the round ? button.
   The panel and the freeze live in the shared kit: kit/help.js (Kit.help). */
Kit.help.setup({
  title: TY.NAME, // the name lives in js/title.js
  keys: [
    ['type the letter that glows', 'A – Z ;'],
    ['hear the word again', 'Space or Enter'],
    ['call your brother (2 players: high five)', 'Shift + T'],
    ['sound', 'Shift + M'],
    ['pause', 'Esc or Shift + P'],
    ['menu: play · 1 or 2 players · sound', 'Enter · 1 2 · M'],
    ['map: pick a stage · go · back', '← → · Enter · Esc'],
  ],
  note: 'Fingers on the home row: A S D F and J K L ;, the bumps on F and J under your pointer fingers. The glowing key and the coloured finger show what to press. A wrong key just goes boop: no problem, try again! Every letter is a letter while you type, so your brother, sound and pause take Shift.',
  touch: 'Tap the keys on the screen to type. Tap SPACE to hear the word again, and your brother\'s face (bottom left) to call him.',
});
