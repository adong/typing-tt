# TT Typing

[![TT Typing title screen](docs/screenshot.jpg)](https://adong.github.io/typing-tt/)

Press **?** any time (or tap the round **?** button on the left edge) to see the keys. The game waits while you look.
Tap the language button under it (the A文 icon) to switch between English and 中文; the dashboard and every game remember the choice.

A typing adventure. First come the home-row lessons: fingers on A S D F and J K L ;, then one new pair of keys at a time. Then the adventure: every word you type powers your hero along a trail, over logs and streams, through rocks and crates, to a treasure chest at the end. A keyboard on the screen shows the next key glowing, and two hands above it light up the finger that presses it. In 中文 mode you type pinyin: 猫 māo is m a o.

**中文：** 打字冒险：先学键盘基本功（A S D F 和 J K L ;），再打单词让小英雄一路冲到宝箱。中文模式看汉字、打拼音。Tommy 玩简单，Teddy 玩普通，随时可以叫兄弟来帮你打一个单词。

The game stars Teddy and Tommy. It's built with Claude Code from plain JavaScript and Three.js, on the shared Claude Games kit (the blocky boys, their poses, synth sound, the ? keys panel and English / 中文). There are no image, model or sound files. The trails, the obstacles, the chest and the boys are built from boxes and spheres. Every texture is painted on a canvas, and every sound is synthesised. Words are spoken by the browser's own voice.

"TT Typing" is a working title (Alan names the games). It lives in one place, `TY.TITLE` / `TY.NAME` in `js/title.js`, and it stays "TT Typing" in 中文 too (the 中文 tagline calls it 打字冒险).

## Play

- **Double-click `index.html`.** It works offline, because Three.js and the kit are copied into `kit/`. Without internet, the title font falls back to Arial Black and the voice still works if the device has its own voices (Macs and iPads do).
- **Send one file:** `dist/typing-tt.html` is the whole game in one page, about 830 KB. AirDrop or email it, then open it in a browser.
- **Rebuild that file after any edit:** `python3 kit/tools/bundle.py . --name typing-tt`

On the title screen, pick **1 PLAYER** (Tommy or Teddy) or **2 PLAYERS**, then a level for each boy, and press **▶ PLAY**. The map shows the 9 lessons and the 5 adventure levels, with the stars you've earned on each. The first one without stars is picked for you.

1. A word (or a few keys) goes up on the card at the top, with its picture, and is said out loud. In 中文 the card shows the 汉字 and its pinyin with tone marks, and the letters to type without them.
2. Type it. Each right key turns its box green and the hero sparkles. A wrong key goes boop, the card shakes, and nothing moves: just press the right one. After 3 slips on one letter, a toast names the finger and the key ("LEFT POINTER FINGER: F").
3. The finished word's sign turns green with a ✓, and the next word is up straight away. The hero clears the obstacle when he gets there: he jumps logs, cones and streams, squishes slimes (they bounce off into the trees), and smashes rocks and crates (Teddy with a straight, Tommy with a jab). Type ahead and he runs faster to catch up.
4. At the end of the trail the chest opens, the winner does his signature move (Teddy's boxing or jump shot, Tommy's Y with ✌️), and confetti rains. The results show stars, speed (WPM), accuracy and **NEW BEST!**, then **NEXT ▶**, **↻ PLAY AGAIN** or **🗺️ MAP**.

- **2 players** take turns word by word, each at his own level (Tommy 🐣 EASY and Teddy 🔥 NORMAL by default), 6 items each. Whoever's turn it is runs in front and lights up in the top-left corner; his words' signs have his colour (Tommy orange, Teddy blue). The one with more stars gets a 🏆 and his signature move; a tie, and both do.
- **Saved** in the browser (`localStorage`, key `typingTT.v1`): who's playing, levels, the stars for each stage (per boy, level and language), each boy's best speed and his running total of stars. If storage is blocked it lasts until the page closes.
- **The language button** switches what you type (English words or pinyin), and a stage that's going starts again in the new language. In English mode there's no Chinese anywhere (the kit's own language button aside). In 中文 mode the only English left is the boys' names, the game's name, and the letters on the keys.

## Lessons and levels

| | 🐣 EASY (for Tommy, 5) | 🔥 NORMAL (for Teddy, 8) |
|---|---|---|
| **Lessons 1–5, 7–9** (F J, D K, S L, A ;, G H, then E I, R U, T Y) | 10 single keys: the new pair in turn first, then mostly new keys with a few old friends. | 12 items: doubles of the new keys (ff jj fj jf), then little groups of 3–4 keys (fjjf), and in lessons 7–9 real words made only of keys learned so far (hide, sugar, turtle). |
| **Lesson 6: home row words** | 10 words from the home row only: dad, sad, ask, gas… (中文: 大 dà, 沙 shā, 拉 lā…) | 12 words: flag, salad, glass, flash… (中文: 沙发 shāfā, 哈哈 hāha…) |
| **Adventure** (🌼 Sunny Meadow, 🌲 Deep Forest, 🏔️ Snowy Mountain, 🏖️ Sandy Beach, 🏰 Candy Castle) | 8 three-letter picture words (cat, dog, bus, fox…). 中文: one-syllable words (猫 māo, 鱼 yú, 熊 xióng…). | 10 words, longer each level: frog and duck at first, penguin, dinosaur and keyboard by the castle. 中文: two- and three-syllable words, sorted by how many letters you type (兔子 tùzi up to 自行车 zìxíngchē). |

- **A lesson only asks for keys it has taught.** The check proves it for every item of every lesson.
- **Pinyin is typed the way a pinyin keyboard types it:** no tone marks, only a to z. No word has a ü in it, so there's never a v to type.
- **Every word is shown on the card and on its sign**, and said by the voice (single keys are said by their letter name).
- The word lists are in `js/words.js`: 34 + 74 English words, 40 + 50 中文 words, plus each lesson's own.

## Speed, accuracy and stars

- **Speed (WPM)** is right keys ÷ 5 per minute, the usual typing-test measure (5 keys count as one word). 25 right keys in 30 seconds is 10 WPM.
- **The clock** is your own: it runs while one of your items is up, from the start of the stage. It stops while the game is paused or the ? panel is open, and while your brother types for you. With 2 players each boy has his own clock that runs only on his turns.
- **Accuracy** is right keys out of all the keys you pressed: 45 right and 5 wrong is 90%.
- **Stars** come from accuracy. EASY: 90% or better is ⭐⭐⭐, 70% is ⭐⭐. NORMAL: 95% is ⭐⭐⭐, 80% is ⭐⭐. Anything less is still ⭐. Calling your brother never costs a star: his keys count neither for you nor against you.
- Each boy's **best speed** shows on the title screen and the results (with **NEW BEST!**), next to his **total stars**.

## Controls

| | Keys | Touch / mouse |
|---|---|---|
| type | the letter that glows (A–Z and ;) | tap the keys on the screen |
| hear the word again | Space or Enter | SPACE on the screen's keyboard |
| call your brother (2 players: high five) | Shift + T | his face, bottom left |
| sound | Shift + M | 🔊 (top right) |
| pause | Esc or Shift + P | ⏸️ (top left) |
| title: play · 1 or 2 players · sound | Enter · 1 2 · M | the buttons |
| map: pick a stage · go · back | ← → · Enter · Esc | tap a stage |
| results: next · play again · map | Enter · R · Esc | the buttons |
| paused: resume · start over · map | P, Esc or Space · R · Q | the buttons |

- **Every letter is a letter while you type**, so T, M and P type T, M and P. Your brother, sound and pause take Shift instead (Esc always pauses). On the menus plain M works as in every other game. *A change from the usual series keys, made so a typing game can use all 26 letters, as TT Word Pop does in English mode.*
- **Caps Lock is fine:** capital letters count as the letter.
- **The screen's keyboard** is coloured by finger: pinkies pink, ring fingers orange, middle fingers yellow, pointer fingers green (left) and blue (right). F and J have their bumps. The hands above it (on screens tall enough) light up the finger to use, and a pill names it ("LEFT POINTER FINGER"). Keys are 30 px wide on a phone held upright (it's a whole keyboard across 390 px), 35 px on a phone on its side, and 58 px on an iPad.
- **The voice** is the browser's own `speechSynthesis`: en-US for English words and letter names, zh-CN for 汉字, on-device voices first, so it works offline. No voice for a language, and the game stays quiet and carries on. Sound off mutes the voice too, whichever switch turns it off (Shift + M, the 🔊, the kit's speaker button on the menus and in the ? panel): nothing reaches `speechSynthesis` while it's off.

## Companion: call your brother

Call him any time, as often as you like, with **Shift + T** or **his face** (bottom left). He's `Kit.roster.buddyFor(you)`: Tommy when Teddy plays, Teddy when Tommy plays.

1. **He pops in** behind you at his roster size (`buddyScale`), in a puff of stars, and does his signature move.
2. **He tosses you a treat:** 🍦 💧 🧃 🍪 🍉 or 🍌. It lands in your hand ("🍪 COOKIE FROM TOMMY!").
3. **He types one word for you:** "TOMMY SAYS: I'LL TYPE IT!" (中文: "TOMMY 说：我来帮你打！"). He types the word that's up, letter by letter: his keys flash gold on the keyboard, his letters fly up from his hands, and his boxes on the card turn gold. If you'd typed part of it, he finishes it. Your clock stops while he types, and his letters count neither for nor against you.
4. **He runs along behind you** a while, then waves goodbye (his goodbye move) and pops out.

Calling again while he's there brings another treat and another word. With 2 players both brothers are already on the trail, so **Shift + T is a high five**: they turn to each other, slap hands, and ✋ ⭐ fly.

## How it works, and how it's tested

- `js/rules.js` is the typing: stages, items, keys, the buddy's keys, the clock, WPM, accuracy and stars. It has no Three.js and no page in it. `js/stage.js` is the trail, `js/keyboard.js` the screen's keyboard and hands, `js/buddy.js` your brother, and `js/game.js` the screens and the hero.
- **`node tools/check.js`** runs the whole check headlessly in a fraction of a second (`game.check()` runs the same in the page). It covers:
  - **content:** every item of every lesson and level, in both languages, both levels, 1 player and 2 players (both kinds of pairs), 6 seeds each (672 stages). No item is empty, every key is on the screen's keyboard with a finger, a lesson only asks for keys taught so far, 2 players take strict turns, pinyin types its toneless form in plain a–z and shows 汉字, English shows no Chinese, and EASY adventure words are 3 letters.
  - **every lesson finishable:** the autopilot plays every one of those stages to the end in a bounded number of keys, slipping onto a wrong key 15% of the time, with the buddy typing every 4th item. The right keys plus the buddy's keys add up to the letters, the wrong keys to the slips, and every player's clock ran.
  - **WPM and accuracy math:** sums worked out by hand (50 keys in 60 s is 10 WPM, 12 keys in 36 s is 4, 0 keys or 0 seconds is 0; 45 / 5 is 90%, 2 / 1 is 67%, nothing pressed is 100%), the star thresholds at their edges, a stage typed at a steady 0.4 s a key (30 WPM, 100%), the same with a slip before every 10th key (the exact formula, about 90%), and a stage the buddy types all by himself (0 keys, 0 seconds, 0 WPM).
- **It proves it can fail:** `node tools/check.js` also runs 8 planted bugs, and each must be caught: WPM dividing by 6, accuracy ignoring wrong keys, the last item never finishing, a lesson asking for an untaught key, the buddy's keys counting, pinyin keeping its tone marks, the clock running while the buddy types, an empty item. `node tools/check.js --sabotage wpm-6` shows one in detail.
- **In the page:** `window.game` has `start({ kind, ix, players, who, level, levels, lang, seed })`, `step(seconds)` (ticks and renders even when the tab is hidden), `type('cat')`, `typeRight(n)`, `tapKey(k)`, `key(k, { shiftKey })`, `call()`, `say()`, `pause()`, `auto(on, slip, every)` (the autopilot), `finish()` (plays the stage to the results), `check(opts)` and `info()`.
- **Tested** in the Browser pane and headless Chrome (`tools/shoot.js`), always muted: full stages by autopilot in both languages, 1 and 2 players, every key binding and a tap on the screen's keyboard, the buddy (pop-in, treat, his word typed, the clock and stats unchanged), the 2-player high five, pause, results; the 中文 tour of every screen with `Kit.lang.untranslated()` at `[]`, and an English scan with no Chinese but the kit's own language button; 0 `speechSynthesis.speak` calls while muted through stages with words said, slips and the buddy. Layouts at 390x844, 740x360, 1024x768 and 768x1024 (touch). `index.html` and `dist/typing-tt.html` both boot from `file://` with DNS blocked, pass the check and finish a stage. No console errors.

## Not verified

- Hearing the sounds and the voice (everything was tested muted), and how the zh-CN voice reads single 汉字.
- Real touch devices, iPad Safari's speech unlock, and a hardware keyboard on an iPad.
- Real kids: whether Tommy (5) can follow the glowing key and the finger hands, whether the star thresholds and word lengths feel right, how fast the hero should run.
- The pinyin by a native teacher, and newer emoji (🪁 🪨 🫙 🪰) on old iPads.
