/* TT Typing: what there is to type.
   - TY.KEYS: the on-screen keyboard (letters and ;), and which finger presses each key (touch typing: fingers rest on
     A S D F and J K L ;, the bumps on F and J).
   - TY.LESSONS: the home-row lessons, in order. Each brings in new keys; a lesson only ever asks for keys taught so
     far (js/check.js proves it). Lesson 6 is words made of home-row keys only, and lessons 7 to 9 reach up to the top
     row. Words per lesson for English and for 中文 (pinyin syllables made of the same keys).
   - TY.LEVELS: the adventure, five places along a trail, and TY.WORDS: the words to type there. English EASY words are
     three letters (Tommy), NORMAL words four to eight (Teddy), longer as the levels go on. 中文 is pinyin: the 汉字
     and its pinyin with tone marks show on the card, and you type the letters without tone marks (猫 māo: m a o),
     the way a pinyin keyboard does. No ü words, so there's never a v to type.
   Every entry is [shown, emoji] for English or [汉字, pinyin with tones, emoji] for 中文 (emoji may be ''). */
(function () {
  'use strict';
  const TY = (window.TY = window.TY || {});

  // ---------------------------------------------------------------- the keyboard and the fingers

  const ROWS = ['qwertyuiop', 'asdfghjkl;', 'zxcvbnm'];
  // lp = left pinky ... li = left pointer, ri = right pointer ... rp = right pinky
  const FINGER = {};
  const set = (keys, f) => { for (const k of keys) FINGER[k] = f; };
  set('qaz', 'lp'); set('wsx', 'lr'); set('edc', 'lm'); set('rfvtgb', 'li');
  set('yhnujm', 'ri'); set('ik', 'rm'); set('ol', 'rr'); set('p;', 'rp');
  const FINGERS = {
    lp: { hand: 'left', name: 'pinky', color: '#ff6fb5' },
    lr: { hand: 'left', name: 'ring finger', color: '#ff9a2e' },
    lm: { hand: 'left', name: 'middle finger', color: '#ffd400' },
    li: { hand: 'left', name: 'pointer finger', color: '#4fd43a' },
    ri: { hand: 'right', name: 'pointer finger', color: '#39b0ff' },
    rm: { hand: 'right', name: 'middle finger', color: '#ffd400' },
    rr: { hand: 'right', name: 'ring finger', color: '#ff9a2e' },
    rp: { hand: 'right', name: 'pinky', color: '#ff6fb5' },
  };
  const HOME = 'asdfjkl;';
  TY.KEYS = { ROWS, FINGER, FINGERS, HOME, ALL: ROWS.join('') };

  // ---------------------------------------------------------------- the home-row lessons

  // keys: the new keys; words: { en: { easy, normal }, zh: { easy, normal } } (lessons 6-9)
  TY.LESSONS = [
    { id: 'L1', keys: 'fj', name: 'F and J', tip: 'Find the bumps on F and J!' },
    { id: 'L2', keys: 'dk', name: 'D and K', tip: 'Middle fingers on D and K.' },
    { id: 'L3', keys: 'sl', name: 'S and L', tip: 'Ring fingers on S and L.' },
    { id: 'L4', keys: 'a;', name: 'A and ;', tip: 'Pinkies on A and ;.' },
    { id: 'L5', keys: 'gh', name: 'G and H', tip: 'Pointer fingers reach in for G and H.' },
    {
      id: 'L6', keys: '', name: 'Home row words', tip: 'Whole words, all on the home row!', words: {
        en: {
          easy: [['dad', '👨'], ['sad', '😢'], ['add', '➕'], ['ask', '❓'], ['all', ''], ['gas', '⛽'], ['had', ''], ['has', ''], ['lad', '👦'], ['ash', '']],
          normal: [['flag', '🚩'], ['glad', '😊'], ['fall', '🍂'], ['half', '🌗'], ['salad', '🥗'], ['glass', '🥛'], ['flask', ''], ['dash', '💨'], ['shall', ''], ['hall', ''], ['flash', '⚡'], ['lads', '👦']],
        },
        zh: {
          easy: [['大', 'dà', '🐘'], ['发', 'fā', ''], ['卡', 'kǎ', '🃏'], ['拉', 'lā', ''], ['哈', 'hā', '😄'], ['沙', 'shā', '🏜️'], ['打', 'dǎ', '👊'], ['啊', 'ā', '😮']],
          normal: [['沙发', 'shāfā', '🛋️'], ['哈哈', 'hāha', '😄'], ['大', 'dà', '🐘'], ['打', 'dǎ', '👊'], ['沙', 'shā', '🏜️'], ['卡', 'kǎ', '🃏'], ['拉', 'lā', ''], ['发', 'fā', ''], ['嘎', 'gā', '🦆']],
        },
      },
    },
    {
      id: 'L7', keys: 'ei', name: 'E and I', tip: 'Reach up for E and I!', words: {
        en: { normal: [['lid', ''], ['kid', '🧒'], ['hide', '🙈'], ['side', ''], ['like', '👍'], ['see', '👀'], ['feel', ''], ['leaf', '🍃'], ['hike', '🥾'], ['dish', '🍽️'], ['fish', '🐟'], ['sea', '🌊']] },
        zh: { normal: [['鸡', 'jī', '🐔'], ['家', 'jiā', '🏠'], ['河', 'hé', '🏞️'], ['飞', 'fēi', '🕊️'], ['黑', 'hēi', '⚫'], ['地', 'dì', '🌍'], ['鹅', 'é', '🦢'], ['姐姐', 'jiějie', '👧']] },
      },
    },
    {
      id: 'L8', keys: 'ru', name: 'R and U', tip: 'Pointer fingers reach up for R and U.', words: {
        en: { normal: [['rug', ''], ['red', '🔴'], ['ride', ''], ['fur', ''], ['hug', '🤗'], ['jug', ''], ['rush', ''], ['fresh', ''], ['sugar', '🍬'], ['jar', '🫙'], ['fire', '🔥'], ['hair', '💇']] },
        zh: { normal: [['书', 'shū', '📖'], ['树', 'shù', '🌳'], ['花', 'huā', '🌸'], ['瓜', 'guā', '🍉'], ['虎', 'hǔ', '🐯'], ['鼓', 'gǔ', '🥁'], ['热', 'rè', '🥵'], ['日', 'rì', '☀️'], ['鹿', 'lù', '🦌']] },
      },
    },
    {
      id: 'L9', keys: 'ty', name: 'T and Y', tip: 'Reach up and in for T and Y.', words: {
        en: { normal: [['yes', '✅'], ['tree', '🌳'], ['dry', ''], ['fly', '🪰'], ['sky', '🌤️'], ['hat', '🎩'], ['tag', '🏷️'], ['eat', '😋'], ['kite', '🪁'], ['tiger', '🐯'], ['yard', ''], ['turtle', '🐢'], ['jelly', '']] },
        zh: { normal: [['鸭', 'yā', '🦆'], ['牙', 'yá', '🦷'], ['鱼', 'yú', '🐟'], ['雨', 'yǔ', '🌧️'], ['兔', 'tù', '🐰'], ['铁', 'tiě', '🔩'], ['叶', 'yè', '🍃'], ['月', 'yuè', '🌙'], ['塔', 'tǎ', '🗼']] },
      },
    },
  ];

  // ---------------------------------------------------------------- the adventure

  TY.LEVELS = [
    { id: 'A1', theme: 'meadow', emoji: '🌼', name: 'Sunny Meadow' },
    { id: 'A2', theme: 'forest', emoji: '🌲', name: 'Deep Forest' },
    { id: 'A3', theme: 'snow', emoji: '🏔️', name: 'Snowy Mountain' },
    { id: 'A4', theme: 'beach', emoji: '🏖️', name: 'Sandy Beach' },
    { id: 'A5', theme: 'candy', emoji: '🏰', name: 'Candy Castle' },
  ];

  TY.WORDS = {
    en: {
      // three letters, every one a picture
      easy: [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['egg', '🥚'], ['pig', '🐷'], ['cow', '🐮'], ['bee', '🐝'], ['hat', '🎩'], ['car', '🚗'],
        ['bed', '🛏️'], ['box', '📦'], ['cup', '☕'], ['fox', '🦊'], ['owl', '🦉'], ['ant', '🐜'], ['bat', '🦇'], ['map', '🗺️'], ['pen', '🖊️'], ['key', '🔑'],
        ['toy', '🧸'], ['ice', '🧊'], ['pie', '🥧'], ['bug', '🐛'], ['hen', '🐔'], ['web', '🕸️'], ['van', '🚐'], ['log', '🪵'], ['net', '🥅'], ['gem', '💎'],
        ['tub', '🛁'], ['jet', '✈️'], ['yak', '🐃'], ['zip', '🤐']],
      // four letters and up, sorted into the levels by length (see wordsFor)
      normal: [['frog', '🐸'], ['duck', '🦆'], ['fish', '🐟'], ['bear', '🐻'], ['lion', '🦁'], ['star', '⭐'], ['moon', '🌙'], ['tree', '🌳'], ['boat', '⛵'], ['cake', '🎂'],
        ['kite', '🪁'], ['ball', '⚽'], ['milk', '🥛'], ['rain', '🌧️'], ['ship', '🚢'], ['snow', '❄️'], ['corn', '🌽'], ['drum', '🥁'], ['bike', '🚲'], ['sock', '🧦'],
        ['book', '📖'], ['lamp', '💡'], ['rock', '🪨'], ['leaf', '🍃'], ['king', '🤴'], ['wolf', '🐺'], ['crab', '🦀'], ['goat', '🐐'],
        ['apple', '🍎'], ['train', '🚆'], ['robot', '🤖'], ['pizza', '🍕'], ['tiger', '🐯'], ['horse', '🐴'], ['sheep', '🐑'], ['zebra', '🦓'], ['snake', '🐍'], ['whale', '🐋'],
        ['shark', '🦈'], ['mouse', '🐭'], ['house', '🏠'], ['cloud', '☁️'], ['bread', '🍞'], ['lemon', '🍋'], ['piano', '🎹'], ['truck', '🚚'], ['crown', '👑'], ['heart', '❤️'],
        ['ghost', '👻'], ['grape', '🍇'], ['juice', '🧃'], ['candy', '🍬'],
        ['rocket', '🚀'], ['banana', '🍌'], ['castle', '🏰'], ['turtle', '🐢'], ['monkey', '🐒'], ['rabbit', '🐰'], ['parrot', '🦜'], ['dragon', '🐉'], ['cookie', '🍪'], ['cherry', '🍒'],
        ['carrot', '🥕'], ['planet', '🪐'], ['guitar', '🎸'], ['flower', '🌸'], ['penguin', '🐧'], ['dolphin', '🐬'], ['octopus', '🐙'], ['rainbow', '🌈'], ['balloon', '🎈'], ['unicorn', '🦄'],
        ['dinosaur', '🦕'], ['keyboard', '⌨️']],
    },
    zh: {
      // one syllable
      easy: [['猫', 'māo', '🐱'], ['狗', 'gǒu', '🐶'], ['鱼', 'yú', '🐟'], ['牛', 'niú', '🐮'], ['马', 'mǎ', '🐴'], ['羊', 'yáng', '🐑'], ['鸡', 'jī', '🐔'], ['鸭', 'yā', '🦆'],
        ['猪', 'zhū', '🐷'], ['兔', 'tù', '🐰'], ['虎', 'hǔ', '🐯'], ['龙', 'lóng', '🐉'], ['蛇', 'shé', '🐍'], ['熊', 'xióng', '🐻'], ['花', 'huā', '🌸'], ['树', 'shù', '🌳'],
        ['山', 'shān', '⛰️'], ['水', 'shuǐ', '💧'], ['火', 'huǒ', '🔥'], ['月', 'yuè', '🌙'], ['星', 'xīng', '⭐'], ['云', 'yún', '☁️'], ['雨', 'yǔ', '🌧️'], ['雪', 'xuě', '❄️'],
        ['车', 'chē', '🚗'], ['船', 'chuán', '⛵'], ['书', 'shū', '📖'], ['笔', 'bǐ', '✏️'], ['球', 'qiú', '⚽'], ['门', 'mén', '🚪'], ['灯', 'dēng', '💡'], ['伞', 'sǎn', '☂️'],
        ['蛋', 'dàn', '🥚'], ['茶', 'chá', '🍵'], ['糖', 'táng', '🍬'], ['面', 'miàn', '🍜'], ['桃', 'táo', '🍑'], ['瓜', 'guā', '🍉'], ['手', 'shǒu', '✋'], ['心', 'xīn', '❤️']],
      // two or three syllables, sorted into the levels by how many letters you type
      normal: [['太阳', 'tàiyáng', '☀️'], ['月亮', 'yuèliang', '🌙'], ['星星', 'xīngxing', '⭐'], ['苹果', 'píngguǒ', '🍎'], ['香蕉', 'xiāngjiāo', '🍌'], ['西瓜', 'xīguā', '🍉'],
        ['草莓', 'cǎoméi', '🍓'], ['葡萄', 'pútao', '🍇'], ['熊猫', 'xióngmāo', '🐼'], ['老虎', 'lǎohǔ', '🐯'], ['兔子', 'tùzi', '🐰'], ['猴子', 'hóuzi', '🐒'],
        ['小狗', 'xiǎogǒu', '🐶'], ['小猫', 'xiǎomāo', '🐱'], ['大象', 'dàxiàng', '🐘'], ['狮子', 'shīzi', '🦁'], ['恐龙', 'kǒnglóng', '🦖'], ['汽车', 'qìchē', '🚗'],
        ['火车', 'huǒchē', '🚂'], ['飞机', 'fēijī', '✈️'], ['火箭', 'huǒjiàn', '🚀'], ['足球', 'zúqiú', '⚽'], ['篮球', 'lánqiú', '🏀'], ['气球', 'qìqiú', '🎈'],
        ['蛋糕', 'dàngāo', '🎂'], ['面包', 'miànbāo', '🍞'], ['牛奶', 'niúnǎi', '🥛'], ['雪人', 'xuěrén', '⛄'], ['彩虹', 'cǎihóng', '🌈'], ['房子', 'fángzi', '🏠'],
        ['书包', 'shūbāo', '🎒'], ['铅笔', 'qiānbǐ', '✏️'], ['电脑', 'diànnǎo', '💻'], ['键盘', 'jiànpán', '⌨️'], ['电话', 'diànhuà', '📞'], ['雨伞', 'yǔsǎn', '☂️'],
        ['帽子', 'màozi', '🧢'], ['眼镜', 'yǎnjìng', '👓'], ['机器人', 'jīqìrén', '🤖'], ['城堡', 'chéngbǎo', '🏰'], ['火山', 'huǒshān', '🌋'], ['蝴蝶', 'húdié', '🦋'],
        ['蜜蜂', 'mìfēng', '🐝'], ['小鸟', 'xiǎoniǎo', '🐦'], ['鲸鱼', 'jīngyú', '🐋'], ['乌龟', 'wūguī', '🐢'], ['青蛙', 'qīngwā', '🐸'], ['狐狸', 'húli', '🦊'],
        ['冰淇淋', 'bīngqílín', '🍦'], ['自行车', 'zìxíngchē', '🚲']],
    },
  };

  // 'māo' → 'mao': what a pinyin keyboard types (tone marks off; ü would be v, but no word here has one)
  TY.toneless = (py) => py.normalize('NFD').replace(/u\u0308/g, 'v').replace(/[\u0300-\u036f]/g, '').toLowerCase();
})();
