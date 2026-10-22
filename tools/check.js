#!/usr/bin/env node
/* TT Typing: run the content, finish and math check headlessly (no browser, no npm).
     node tools/check.js            the check (must pass), then every sabotage case (each must fail)
     node tools/check.js 20         more seeds per stage and cast (default 6)
     node tools/check.js --sabotage wpm-6     one sabotage case, with its failures listed
   Exit code 0 only if the real check passes and every sabotage case is caught. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

global.window = global;
const dir = path.join(__dirname, '..', 'js');
for (const f of ['title.js', 'words.js', 'rules.js', 'check.js']) vm.runInThisContext(fs.readFileSync(path.join(dir, f), 'utf8'), { filename: f });

const args = process.argv.slice(2);
const sabIx = args.indexOf('--sabotage');
const seeds = +args.find((a) => /^\d+$/.test(a)) || 6;

function show(r) {
  for (const f of r.fails.slice(0, 12)) console.log('   ', f);
  if (r.fails.length > 12) console.log(`    … and ${r.fails.length - 12} more`);
}

if (sabIx >= 0) {
  const r = TY.check({ seeds, sabotage: args[sabIx + 1] });
  console.log(r.ok ? `sabotage ${r.sabotage}: NOT caught` : `sabotage ${r.sabotage}: caught`);
  show(r);
  process.exit(r.ok ? 1 : 0);
}

const t0 = Date.now();
const r = TY.check({ seeds });
const s = r.stats;
console.log(`check: ${r.ok ? 'PASS' : 'FAIL'} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`  ${s.stages} stages played to the end (${TY.LESSONS.length} lessons + ${TY.LEVELS.length} levels × en/zh × 4 casts × ${seeds} seeds), ${s.items} items, ${s.keys} letters, ${s.slips} slips, ${s.buddyKeys} typed by the buddy`);
show(r);

let caught = 0;
for (const sab of TY.check.SABOTAGE) {
  const x = TY.check({ seeds: 2, sabotage: sab });
  const groups = [...new Set(x.fails.map((f) => f.split(':')[0]))];
  console.log(`  sabotage ${sab.padEnd(18)} ${x.ok ? 'NOT CAUGHT' : 'caught'}${x.ok ? '' : ` (${groups.join(', ')}): ${x.fails[0]}`}`);
  if (!x.ok) caught++;
}
console.log(`sabotage: ${caught} of ${TY.check.SABOTAGE.length} caught`);
process.exit(r.ok && caught === TY.check.SABOTAGE.length ? 0 : 1);
