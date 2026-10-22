/* TT Typing in 中文: the words for the screens, buttons, toasts and the ? panel (kit/lang.js does the swapping).
   The kids' names and the game's name stay English; the tagline calls it 打字冒险. What you type in 中文 is pinyin:
   the 汉字, the pinyin and the letters on the card and the signs come from js/words.js and are marked data-no-lang. */
Kit.lang.keep(['TEDDY', 'TOMMY', 'TEDDY & TOMMY', 'TT TYPING', 'TT Typing', 'Claude Code', 'Esc', 'Shift']);

Kit.lang.add({
  // title
  'Type the words, power up your hero!': '打字冒险：打对单词，给小英雄加油！',
  'take turns': '轮流打',
  'for Tommy': '适合 Tommy',
  'for Teddy': '适合 Teddy',
  '▶ PLAY': '▶ 开始',
  'Enter play · 1 / 2 players · M sound': '回车 开始 · 1 / 2 单人或双人 · M 声音',
  "Who's playing?": '谁来玩？',
  'Players': '玩家',
  'Level': '难度',
  'LOADING…': '加载中…',
  // (the English title's line: redrawn as the 中文 one the moment the language changes)
  'English:': '英文：',
  'type the words · the language button switches to pinyin': '打英文单词 · 语言按钮可以换成拼音',
  // the map
  'PICK A STAGE': '选一关',
  '◀ BACK': '◀ 返回',
  '⌨️ HOME ROW LESSONS': '⌨️ 键盘基本功',
  '🗺️ ADVENTURE': '🗺️ 冒险',
  '← → pick · Enter go · Esc back': '← → 选择 · 回车 出发 · Esc 返回',
  'F and J': 'F 和 J',
  'D and K': 'D 和 K',
  'S and L': 'S 和 L',
  'A and ;': 'A 和 ;',
  'G and H': 'G 和 H',
  'Home row words': '基本键打单词',
  'E and I': 'E 和 I',
  'R and U': 'R 和 U',
  'T and Y': 'T 和 Y',
  'Sunny Meadow': '阳光草地',
  'Deep Forest': '大森林',
  'Snowy Mountain': '雪山',
  'Sandy Beach': '沙滩',
  'Candy Castle': '糖果城堡',
  // lesson tips (toasts at the start)
  'Find the bumps on F and J!': '摸一摸 F 和 J 上的小凸点！',
  'Middle fingers on D and K.': '中指放在 D 和 K 上。',
  'Ring fingers on S and L.': '无名指放在 S 和 L 上。',
  'Pinkies on A and ;.': '小指放在 A 和 ; 上。',
  'Pointer fingers reach in for G and H.': '食指往里伸，按 G 和 H。',
  'Whole words, all on the home row!': '只用基本键，打整个单词！',
  'Reach up for E and I!': '往上伸，按 E 和 I！',
  'Pointer fingers reach up for R and U.': '食指往上伸，按 R 和 U。',
  'Reach up and in for T and Y.': '往上再往里，按 T 和 Y。',
  // playing
  'Pause (Esc)': '暂停 (Esc)',
  'Pause': '暂停',
  'Sound (Shift + M)': '声音 (Shift + M)',
  'Sound on or off': '声音开关',
  'Call your brother (Shift + T)': '叫兄弟来帮忙 (Shift + T)',
  'Call your brother': '叫兄弟来帮忙',
  'HIGH FIVE': '击掌',
  'HIGH FIVE!': '击个掌！',
  'SPACE: hear it again': '空格：再听一遍',
  'NICE!': '真棒！',
  'GREAT!': '太好了！',
  'SUPER!': '超级棒！',
  'WOW!': '哇！',
  // the end of a stage
  'LESSON DONE!': '这课学完啦！',
  'TREASURE!': '找到宝藏啦！',
  'ACCURACY': '准确率',
  'WPM': '词/分钟',
  'NEW BEST!': '新纪录！',
  'NEXT ▶': '下一关 ▶',
  '↻ PLAY AGAIN': '↻ 再玩一次',
  '🗺️ MAP': '🗺️ 地图',
  'Enter next · R play again · Esc map': '回车 下一关 · R 再玩一次 · Esc 地图',
  // pause
  'PAUSED': '暂停',
  '▶ RESUME': '▶ 继续',
  '↻ START OVER': '↻ 重新开始',
  'P · Esc · Space resume · R start over · Q map · M sound': 'P · Esc · 空格 继续 · R 重新开始 · Q 地图 · M 声音',
  // fingers
  'left pinky': '左手小指',
  'left ring finger': '左手无名指',
  'left middle finger': '左手中指',
  'left pointer finger': '左手食指',
  'right pointer finger': '右手食指',
  'right middle finger': '右手中指',
  'right ring finger': '右手无名指',
  'right pinky': '右手小指',
  // the ? panel
  'type the letter that glows': '按发亮的那个键',
  'hear the word again': '再听一遍',
  'call your brother (2 players: high five)': '叫兄弟来帮忙（双人：击掌）',
  'sound': '声音',
  'pause': '暂停',
  'menu: play · 1 or 2 players · sound': '菜单：开始 · 单人或双人 · 声音',
  'map: pick a stage · go · back': '地图：选一关 · 出发 · 返回',
  'Fingers on the home row: A S D F and J K L ;, the bumps on F and J under your pointer fingers. The glowing key and the coloured finger show what to press. A wrong key just goes boop: no problem, try again! Every letter is a letter while you type, so your brother, sound and pause take Shift.':
    '手指放在基本键上：A S D F 和 J K L ;，两个食指摸到 F 和 J 上的小凸点。发亮的键和彩色的手指告诉你按哪个键。按错了只会“嘟”一声，没关系，再试一次！打字的时候每个字母键都用来打字，所以叫兄弟、声音和暂停要按住 Shift。',
  "Tap the keys on the screen to type. Tap SPACE to hear the word again, and your brother's face (bottom left) to call him.":
    '点屏幕上的键盘打字。点空格再听一遍，点左下角兄弟的头像叫他来帮忙。',
});

// text with names, numbers or words in it
Kit.lang.rule(/^CALL (TEDDY|TOMMY)$/, '叫 $1');
Kit.lang.rule(/^(TEDDY|TOMMY)'S TURN$/, '轮到 $1');
Kit.lang.rule(/^(TEDDY|TOMMY) SAYS: I'LL TYPE IT!$/, '$1 说：我来帮你打！');
Kit.lang.rule(/^(\S+) (ICE CREAM|WATER|JUICE BOX|COOKIE|WATERMELON|BANANA) FROM (TEDDY|TOMMY)!$/, (m, e, item, who) =>
  `${e} ${who} 送来的${{ 'ICE CREAM': '冰淇淋', WATER: '水', 'JUICE BOX': '果汁', COOKIE: '饼干', WATERMELON: '西瓜', BANANA: '香蕉' }[item]}！`);
Kit.lang.rule(/^BEST SPEED \(WPM\): (.*)$/, (m, rest) => `最快速度（每分钟单词）：${rest}`);
Kit.lang.rule(/^(\d+)\. (.+)$/, (m, n, name) => `${n}. ${Kit.lang.t(name)}`);
Kit.lang.rule(/^(\S+) (.+)!$/, (m, e, name) => {
  // a level's start toast: "🌼 SUNNY MEADOW!"
  const lv = { 'SUNNY MEADOW': '阳光草地', 'DEEP FOREST': '大森林', 'SNOWY MOUNTAIN': '雪山', 'SANDY BEACH': '沙滩', 'CANDY CASTLE': '糖果城堡' }[name];
  return lv ? `${e} ${lv}！` : m;
});
Kit.lang.rule(/^(\S+) (Sunny Meadow|Deep Forest|Snowy Mountain|Sandy Beach|Candy Castle)$/, (m, e, name) => `${e} ${Kit.lang.t(name)}`);
Kit.lang.rule(/^(LEFT|RIGHT) (PINKY|RING FINGER|MIDDLE FINGER|POINTER FINGER): (.+)$/, (m, side, f, key) =>
  `${side === 'LEFT' ? '左手' : '右手'}${{ PINKY: '小指', 'RING FINGER': '无名指', 'MIDDLE FINGER': '中指', 'POINTER FINGER': '食指' }[f]}：${key}`);
Kit.lang.rule(/^(TEDDY|TOMMY): BEST ⚡ (\d+) · TOTAL ⭐ (\d+)(.*)$/, (m, who, best, total, rest) =>
  `${who}：最快 ⚡ ${best} · 一共 ⭐ ${total}${rest ? rest.replace(/(TEDDY|TOMMY): BEST ⚡ (\d+) · TOTAL ⭐ (\d+)/g, '$1：最快 ⚡ $2 · 一共 ⭐ $3') : ''}`);
