/* Smoke test for Hanzi Quest.  Run: node tools/smoke.mjs

   data.js and srs.js are DOM-free, so they run here for real. app.js needs a
   browser, but it depends on these two through a shared global scope — and a
   name deleted from srs.js while app.js still calls it fails only on click.
   The CONTRACT list below pins those names so that can't happen quietly. */

import { readFileSync, existsSync } from 'fs';

const read = f => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
globalThis.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; } };

/* Everything app.js reaches for across the file boundary. */
const CONTRACT = [
  'HQ', 'STAGES', 'CHAR_INDEX', 'FAMILIES', 'RADICALS', 'QUESTS',
  'TIERS', 'TIER_UNLOCK', 'tierOf', 'tierChars', 'tierFrom', 'tierProgress',
  'tierUnlocked', 'tierNeeds', 'unlockedCeiling', 'isLocked',
  'POS_LABEL', 'MENU', 'MENU_CHARS', 'MENU_PRINTED', 'MENU_ORDER', 'MENU_READ', 'MENU_LEVELS',
  'MENU_UNTAUGHT', 'EXTRA_GLOSS', 'MENU_INK', 'MENU_INK_CEILING', 'menuLegible',
  'menuTier', 'menuNext', 'menuOnWall', 'menuWall',
  'state', 'blank', 'load', 'save', 'dayKey', 'toneOf', 'connectRemote',
  'rec', 'isKnown', 'strength', 'grade', 'introduce', 'today', 'tally', 'liveStreak',
  'dueList', 'dueCount', 'nextNew', 'remainingNew', 'stageProgress', 'currentStage',
  'skillStanding', 'passesIn', 'PASSES_FOR_SOLID', 'reviewedToday', 'resetProgress',
  'tallyExtra', 'extraToday', 'extraTotal', 'extraBestDay', 'dayReps',
  'studyAhead', 'aheadToday', 'dayGoal', 'newLeftToday', 'goalMet', 'GOAL_MIN', 'GOAL_MAX',
  'placeKnown', 'wasPlaced', 'PLACE_MISS_LIMIT', 'PLACED_REST',
  'wordOfWeek', 'weekKey', 'INTERESTS', 'INTEREST_KEYS', 'shownIn', 'shuffle',
  'FESTIVALS', 'festivalThisWeek', 'festivalDate', 'wotwEntry',
  'menuProgress', 'menuToday', 'menuLearn', 'menuKnown', 'menuOwn', 'menuCanRead',
  'MILESTONES', 'milestoneDue', 'markMilestone',
  'MENU_TIERS', 'practicePool', 'knownChars', 'daysStudied',
  'sprintState', 'sprintMark', 'sprintMarkOf', 'sprintHits', 'sprintMisses', 'sprintByMode',
  'sprintTrouble', 'sprintFluent', 'sprintForget', 'rightRun', 'troubleScore',
  'recordRun', 'sheetKey', 'sprintBests', 'sprintRecent', 'tallySprint', 'sprintTotal',
  'SPRINT_WINDOW', 'SPRINT_TROUBLE', 'SPRINT_CLEAR', 'SPRINT_FLUENT'
];

/* typeof guards so a missing name reports cleanly instead of crashing */
const api = new Function(
  read('js/data.js') + '\n' + read('js/srs.js') + '\n' +
  'return {' + CONTRACT.map(n => `${n}: typeof ${n} === "undefined" ? undefined : ${n}`).join(',') + '};'
)();

let failures = 0;
const ok = (label, cond, detail = '') => {
  if (cond) console.log('  ✓ ' + label);
  else { console.log('  ✗ ' + label + (detail ? ' — ' + detail : '')); failures++; }
};

console.log('\ncontract');
CONTRACT.forEach(n => ok(n, api[n] !== undefined));

console.log('\nversion');
{
  /* The version is only useful if it can be trusted: a number on screen that
     doesn't match the query strings would tell you the cache had cleared when
     it hadn't. */
  const html = read('index.html');
  const declared = (html.match(/const APP_VERSION = "([^"]+)"/) || [])[1];
  ok('index.html declares a version', /^\d+\.\d+\.\d+$/.test(declared || ''), String(declared));
  ok('and a date', /^\d{4}-\d{2}-\d{2}$/.test((html.match(/APP_DATE = "([^"]+)"/) || [])[1] || ''));
  const stamped = [...html.matchAll(/\?v=([^"']+)/g)].map(m => m[1]);
  ok('every local asset is stamped', stamped.length >= 5, stamped.length + ' stamped');
  /* audio.js is fetched by app.js instead of being listed here, so it needs
     its own stamp — from APP_VERSION, or it would cache forever */
  const appjs = read('js/app.js');
  ok('the deferred audio bundle is stamped too',
     /js\/audio\.js\?v=\$\{appVersion\(\)\}/.test(appjs));
  ok('and index.html no longer blocks on it', !/src="js\/audio\.js/.test(html));
  ok('and all stamps match the declared version',
     stamped.every(v => v === declared), [...new Set(stamped.filter(v => v !== declared))].join(' '));
  /* a path with no query string at all is one the bump script will miss */
  const bare = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)"/g)].map(m => m[1]);
  ok('no local asset is left unstamped', !bare.length, bare.join(' '));
}

console.log('\ncurriculum');
const { HQ, CHAR_INDEX, MENU, MENU_CHARS, STAGES } = api;
ok(`${HQ.length} characters`, HQ.length > 0);
ok('no duplicates', new Set(HQ.map(c => c.c)).size === HQ.length);
const missing = HQ.filter(c => !c.c || !c.p || !c.m || !c.story || !c.o || !c.pos?.length || !c.words?.length || c.sent?.length !== 3);
ok('every character complete', !missing.length, missing.map(c => c.c).join(' '));
const badPos = [...new Set(HQ.flatMap(c => c.pos))].filter(p => !api.POS_LABEL[p]);
ok('grammar tags all labelled', !badPos.length, badPos.join(' '));
ok('every character lands in a stage', HQ.every(c => STAGES.some(s => s.n === c.stage)));

console.log('\nmenu');
const cjk = s => [...s].filter(c => /[一-鿿]/.test(c));
const onMenu = new Set([...cjk(MENU.title), ...cjk(MENU.name),
  ...MENU.sections.flatMap(s => [...cjk(s.head), ...s.items.flatMap(i => cjk(i[0]))])]);
const spoken = new Set(MENU.phrases.flatMap(p => cjk(p[0])));
/* The menu is a real one, and a real cha chaan teng menu cannot be written
   with 300 characters — 菠蘿包, 乾炒牛河 and 羅宋湯 all need characters this
   library does not teach. Hanzi Quest could demand that every glyph on its
   menu was taught because it has 763 of them; demanding it here would mean
   inventing dishes nobody sells.

   So the quest targets only what it teaches, the menu stays honest, and the
   thing worth checking is that enough of it comes within reach to make the
   promise real. A wall of grey with four inked characters is not a quest. */
const printedTaught = [...onMenu].filter(c => CHAR_INDEX[c]);
const spokenTaught = [...spoken].filter(c => CHAR_INDEX[c]);
ok('the quest targets only characters it teaches', MENU_CHARS.every(c => CHAR_INDEX[c]),
   MENU_CHARS.filter(c => !CHAR_INDEX[c]).join(' '));

/* Every character the menu quest teaches has to be somewhere a learner can
   actually look at it. Eight of the forty-three — 我 該 個 呀 幾 碗 呢 埋 —
   are only in the phrases, never on the dish list, and the day the phrases
   stopped being shown on the Menu tab there was nowhere to find 呢 at all
   while the card still said "find it on the menu below". */
{
  const seen = new Set();
  const eat = t => { for (const c of String(t)) if (/[\u4e00-\u9fff]/.test(c)) seen.add(c); };
  const section = x => { eat(x.head); x.items.forEach(i => { eat(i[0]); if (i[4]) eat(i[4][0]); }); };
  eat(MENU.title); eat(MENU.name);
  MENU.sections.forEach(section);
  if (MENU.specials) { section(MENU.specials); if (MENU.specials.note) eat(MENU.specials.note[0]); }
  const printed = new Set(seen);
  MENU.phrases.forEach(p => eat(p[0]));

  const nowhere = MENU_CHARS.filter(c => !seen.has(c));
  ok('every menu character is somewhere on the menu page', !nowhere.length, nowhere.join(' '));

  const phraseOnly = MENU_CHARS.filter(c => !printed.has(c));
  ok('and the ones only in the phrases are known to be', phraseOnly.length === 8, phraseOnly.join(' '));

  /* The card tells you to go and find today's character on the menu, so the
     pick has to come from what is printed on the card — dish names, headings,
     the small print under a dish and the set-lunch board — and never from the
     phrases underneath it, which are things you say rather than read. */
  const stray = api.MENU_PRINTED.filter(c => !printed.has(c));
  ok('every character the quest can pick is printed on the menu card', !stray.length, stray.join(' '));
  ok('and nothing that is only ever spoken can be picked',
     phraseOnly.every(c => !api.MENU_PRINTED.includes(c)),
     phraseOnly.filter(c => api.MENU_PRINTED.includes(c)).join(' '));
  const curriculumOrder = api.HQ.map(ch => ch.c).filter(c => api.MENU_PRINTED.includes(c));
  ok('the quest walks the menu in reading order, not the curriculum\'s',
     api.MENU_ORDER.join('') !== curriculumOrder.join(''),
     api.MENU_ORDER.slice(0, 6).join(''));

  /* ---- and only as far down the card as is actually being printed ----

     The card is not all on the wall at once: a dish's small print arrives at
     level 2 and the set-lunch board at level 3. The pick used to walk the full
     reading order — with the board FIRST, because it is printed above the
     sections — so the ninth character the quest offered was 快, which appears
     nowhere but that board, under the words "find it on the menu below". */
  const only = (has, lacks) => [...has].filter(c => !lacks.has(c));
  const descOnly = only(api.MENU_LEVELS[2], api.MENU_LEVELS[1]);
  const boardOnly = only(api.MENU_LEVELS[3], api.MENU_LEVELS[2]);
  ok('each level only adds to the one below',
     api.MENU_READ[1].every(c => api.MENU_LEVELS[2].has(c)) &&
     api.MENU_READ[2].every(c => api.MENU_LEVELS[3].has(c)));
  ok('level 1 is dish names and headings alone', api.MENU_READ[1].length < api.MENU_READ[2].length,
     api.MENU_READ[1].length + ' of ' + api.MENU_READ[3].length);
  ok('the small print is not reachable until level 2', descOnly.length > 0 &&
     descOnly.every(c => !api.MENU_LEVELS[1].has(c)), descOnly.length + ' characters');
  ok('the set-lunch board is not reachable until level 3', boardOnly.length > 0 &&
     boardOnly.every(c => !api.MENU_LEVELS[2].has(c)), boardOnly.join(' '));
  ok('快 in particular, which is printed on that board and nowhere else',
     boardOnly.includes('快'));

  const app = read('js/app.js');
  ok('so the Menu tab still renders the phrases', /MENU\.phrases\.map/.test(app.split('renderQuest')[1] || ''));
}
ok('and covers every taught character on the menu',
   [...printedTaught, ...spokenTaught].every(c => MENU_CHARS.includes(c)),
   [...printedTaught, ...spokenTaught].filter(c => !MENU_CHARS.includes(c)).join(' '));
ok('printed characters come first', MENU_CHARS.slice(0, printedTaught.length).every(c => onMenu.has(c)),
   'so day one lights up a visible dish');
{
  /* A fifth, not a half. 300 characters against a real menu is what it is, and
     inflating the number by inventing dishes made of the characters we happen
     to teach would be measuring the test rather than the learner. What the
     floor is for is catching a menu that has drifted so far from the curriculum
     that the quest stops meaning anything. */
  const share = printedTaught.length / onMenu.size;
  ok('enough of the printed menu is reachable to be worth reading',
     share >= 0.2, `${printedTaught.length} of ${onMenu.size} printed glyphs (${(share * 100).toFixed(0)}%)`);
  const dishes = MENU.sections.flatMap(s => s.items);
  const partly = dishes.filter(i => cjk(i[0]).some(c => CHAR_INDEX[c])).length;
  ok('and every section has something in it you can read',
     MENU.sections.every(s => s.items.some(i => cjk(i[0]).some(c => CHAR_INDEX[c]))),
     `${partly} of ${dishes.length} dishes have at least one taught character`);
}

console.log('\nscheduling');
api.load();
const first = api.nextNew(3);
ok('new characters follow curriculum order', first.join(' ') === HQ.slice(0, 3).map(c => c.c).join(' '), first.join(' '));
api.introduce(first[0]);
ok('a new character is not due again today', !api.dueList().includes(first[0]));
api.grade(first[0], false, 'r');
ok('a missed character comes back today', api.dueList().includes(first[0]));
api.grade(first[0], true, 'r');
ok('a correct answer schedules it forward', !api.dueList().includes(first[0]));
api.tally('new');
ok('studying starts a streak', api.liveStreak() === 1);

console.log('\nside quest');
const pick = api.menuToday();
ok('picks a character', !!pick.c);
ok('the pick is stable within the day', api.menuToday().c === pick.c);
ok('the pick is printed on the menu card', api.MENU_PRINTED.includes(pick.c), pick.c);
ok('and on the part of it being printed at this level',
   api.menuOnWall().includes(pick.c), `level ${api.menuTier().n}`);
ok('the pick is one the learner cannot already read', !api.menuCanRead(pick.c), pick.c);

/* The bar counts the card, not the vocabulary. Eight of the quest's characters
   are only ever spoken to a waiter and all eight are taught early, so counting
   them read the bar half full while every dish was still opaque. */
{
  const p0 = api.menuProgress();
  ok('the bar counts printed characters only', p0.total === api.MENU_PRINTED.length,
     `${p0.total}, not ${api.MENU_CHARS.length}`);
  const spoken = api.MENU_CHARS.filter(c => !api.MENU_PRINTED.includes(c));
  spoken.forEach(c => api.introduce(c));
  ok('so learning a spoken-only character does not move it',
     api.menuProgress().known === p0.known, spoken.join(' '));
}

/* ---- and the quest keeps its own books ----

   It used to run on the main library: what you could read was isKnown(), the
   pick was the next unknown in curriculum order, and learning one called
   introduce(). So a good placement could march the quest to the end and have
   it announce "you can read every character on this menu" to somebody who had
   never opened the tab. Cross-reference in, progression out. */
const before = api.menuProgress().known;
const charsBefore = Object.keys(api.state.chars).length;
const dayBefore = JSON.stringify(api.state.days[api.dayKey()] || {});
api.menuLearn(pick.c);
ok('learning it advances the quest', api.menuProgress().known === before + 1);
ok('and it joins the flashcard deck', api.menuKnown().includes(pick.c));
ok('and the quest counts it as its own', api.menuOwn().taught === 1);
ok('but it does not enter the library', Object.keys(api.state.chars).length === charsBefore);
ok('and has no review date', !api.rec(pick.c));
ok('and does not touch the day', JSON.stringify(api.state.days[api.dayKey()] || {}) === dayBefore);

/* a character learned in the ordinary way still inks the menu in */
const other = api.MENU_PRINTED.find(c => c !== pick.c && !api.menuCanRead(c));
api.introduce(other);
ok('a character learned anywhere still reads on the menu', api.menuCanRead(other));
ok('and the quest moves past it', api.menuToday.length >= 0 &&
   !api.MENU_ORDER.filter(c => !api.menuCanRead(c)).includes(other));

console.log('\nthe rest of the wall');
{
  /* The card prints 98 characters and the curriculum teaches 53 of them. The
     other 45 are dish names — 菠蘿包, 叉燒, 羅宋湯 — and a real cha chaan teng
     menu cannot be written without them. Inking them the same grey as "not
     learned yet" put the learner 45 characters further from the goal than they
     were, and at 53 of 53 would have claimed a menu still half grey. */
  const app = read('js/app.js');
  const onCard = new Set();
  const eat = t => cjk(t).forEach(c => onCard.add(c));
  eat(MENU.title); eat(MENU.name);
  MENU.sections.forEach(sec => {
    eat(sec.head);
    sec.items.forEach(i => { eat(i[0]); if (i[4]) eat(i[4][0]); });
  });
  eat(MENU.specials.head);
  MENU.specials.items.forEach(i => eat(i[0]));
  eat(MENU.specials.note[0]);

  ok('the untaught set is not empty', api.MENU_UNTAUGHT.length > 20, api.MENU_UNTAUGHT.length);
  ok('and none of it is in the curriculum',
     api.MENU_UNTAUGHT.every(c => !api.CHAR_INDEX[c]),
     api.MENU_UNTAUGHT.filter(c => api.CHAR_INDEX[c]).join(' '));
  ok('taught and untaught do not overlap',
     !api.MENU_UNTAUGHT.some(c => api.MENU_PRINTED.includes(c)));
  ok('together they are the whole card',
     api.MENU_UNTAUGHT.length + api.MENU_PRINTED.length === onCard.size,
     `${api.MENU_UNTAUGHT.length} + ${api.MENU_PRINTED.length} vs ${onCard.size}`);
  ok('every one of them still has a gloss to hover',
     api.MENU_UNTAUGHT.every(c => api.EXTRA_GLOSS[c]),
     api.MENU_UNTAUGHT.filter(c => !api.EXTRA_GLOSS[c]).join(' '));

  ok('the menu inks them as a third thing', /CHAR_INDEX\[c\] \? "" : "outside"/.test(app));
  ok('and the legend says what that ink means', /not taught here, hover for the gloss/.test(app));
  ok('the bar says what its denominator is',
     /characters on this menu that\s+Cantonese Quest\s+teaches/i.test(app));
  ok('and finishing does not claim the whole menu',
     /Every character on it this app teaches/.test(app) &&
     !/You can read the whole menu/.test(app));
}

console.log('\nthe order of the day');
{
  /* The list order is also the order nextExercise() hands you things in, so it
     is behaviour rather than decoration — and it has been deliberately changed
     once already, from sound-first to shape-first. Pinned so a reshuffle is a
     decision somebody made rather than a diff nobody noticed. */
  const app = read('js/app.js');
  const ids = [...app.slice(app.indexOf('const TODAY_TASKS = ['))
    .slice(0, 900).matchAll(/id: "(\w+)"/g)].map(m => m[1]);
  ok('the day goes recognise, read, hear, write',
     ids.join() === 'recall,read,say,copy', ids.join(' '));
  ok('and writing is last, being the only one that asks you to produce',
     ids[ids.length - 1] === 'copy');

  const pr = [...app.slice(app.indexOf('const PRACTICE = {'))
    .slice(0, 600).matchAll(/^  (\w+):\s+\{/gm)].map(m => m[1]);
  ok('Go deeper follows the same order', pr.join() === 'read,say,write', pr.join(' '));
  /* Object key order is insertion order and the panel uses Object.entries, so
     the literal above is the order on screen — this check is the only thing
     keeping that implicit dependency honest. */
  ok('and the panel still reads it in insertion order',
     /Object\.entries\(PRACTICE\)\.map/.test(app));
}

console.log('\nthe porting guide still describes this app');
{
  /* PORTING.md is the one file whose whole value is being trustworthy, and it
     is the one file nothing was checking. Five entries had quietly rotted: two
     described a `wall` flag and a set of MENU_TIERS thresholds that later work
     deleted, one cited a `PRINTED` helper that turned out to be dead code, one
     named a `menuLearnedToday()` that never survived the side-quest rewrite,
     and one pointed at a `.nb-switch` class that does not exist.

     So: every identifier the guide cites in backticks must appear in the
     source — unless it is listed below as deliberately named for being gone,
     which several entries do on purpose ("X replaces Y", "both are gone"). */
  const doc = readFileSync(new URL('../PORTING.md', import.meta.url), 'utf8');
  const files = ['js/app.js', 'js/srs.js', 'js/data.js', 'js/sprint.js',
                 'index.html', 'css/app.css',
                 'tools/check-strokes.mjs', 'tools/check-components.mjs',
                 'tools/check-jyutping.mjs', 'tools/audit-strokes.mjs',
                 'tools/compose-strokes.mjs', 'tools/make-audio.mjs',
                 'tools/version.mjs'];
  /* this file is deliberately not in that list: the GONE names are written out
     below, so including it would find every one of them in "the source" and
     the check would pass by looking at itself */
  const sources = files.map(read).join('\n');
  const smoke = read('tools/smoke.mjs');

  /* named on purpose as things that no longer exist */
  const GONE = new Set([
    '.rec-head', '.lib-bar',                                // invented selectors, §9
    'onPrintedMenu', 'menuLearnedToday', 'showStrokeOrder'  // replaced, and said so
  ]);

  const cited = new Set();
  for (const m of doc.matchAll(/`([A-Za-z_$][\w$]*)\(\)`/g)) cited.add(m[1]);
  for (const m of doc.matchAll(/`([A-Z][A-Z0-9_]{3,})`/g)) cited.add(m[1]);
  for (const m of doc.matchAll(/`(\.[a-z][a-z0-9-]{3,})`/g)) cited.add(m[1]);

  const all = sources + '\n' + smoke;
  const stale = [...cited].filter(n => !GONE.has(n) && !all.includes(n));
  ok('every name the guide cites is still in the source', !stale.length, stale.join(' '));

  /* and the reverse: an allowlist entry that came back is just as misleading */
  const resurrected = [...GONE].filter(n => sources.includes(n));
  ok('and nothing on the gone-list has come back', !resurrected.length, resurrected.join(' '));

  ok('the guide covers every section it advertises',
     [...doc.matchAll(/^\| \*\*§(\d+)\*\*/gm)].every(m => doc.includes(`## §${m[1]} ·`)));
}

console.log('\nhow much of the wall you can read');
{
  /* Counted in ink, not in vocabulary: every character printed on the card,
     repeats and all, because 茶 in four dishes is four characters of wall that
     light up together. The 53-character bar answers "how much of the list do I
     know"; this answers the question the quest is named after. */
  const g = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,MENU_INK,MENU_INK_CEILING,menuLegible,load,introduce,menuLearn,MENU_PRINTED,MENU_UNTAUGHT};')();
  globalThis.localStorage._d = {};
  g.load();

  ok('the ink counts repeats', g.MENU_INK.length > new Set(g.MENU_INK).size,
     `${g.MENU_INK.length} printed, ${new Set(g.MENU_INK).size} distinct`);
  ok('and every one of them is Chinese', g.MENU_INK.every(c => /[一-鿿]/.test(c)));

  const zero = g.menuLegible();
  ok('a new learner reads none of it', zero.read === 0 && zero.pct === 0);
  ok('but the ceiling is known from the start', zero.ceiling === g.MENU_INK_CEILING);

  ok('the ceiling is below the whole wall', g.MENU_INK_CEILING < g.MENU_INK.length,
     `${g.MENU_INK_CEILING} of ${g.MENU_INK.length} — ${Math.round(g.MENU_INK_CEILING / g.MENU_INK.length * 100)}%`);
  /* which is only true because the card prints characters nothing teaches */
  ok('and that is exactly the untaught dish names',
     g.MENU_INK.length - g.MENU_INK_CEILING === g.MENU_INK.filter(c => g.MENU_UNTAUGHT.includes(c)).length);

  g.HQ.forEach(ch => g.introduce(ch.c));
  const full = g.menuLegible();
  ok('learning the whole library reaches the ceiling and stops', full.read === full.ceiling && full.maxed,
     `${full.read}/${full.total} = ${Math.round(full.pct * 100)}%`);
  ok('which is not 100%', full.pct < 1);

  const app = read('js/app.js');
  ok('the ceiling is drawn on the bar rather than hidden',
     /ink-bar[\s\S]{0,240}left:\$\{\(lg\.ceilingPct \* 100\)/.test(app));
  ok('and the copy says what it is', /where this stops/.test(app));
}

console.log('\nsay it out loud');
{
  const app = read('js/app.js');
  ok('the phrases get one column each', /--phrase-n:\$\{Math\.min\(MENU\.phrases\.length, 6\)\}/.test(app));
  const css = read('css/app.css');
  /* Every track minmax(0, 1fr) is what makes overlap impossible at any count:
     a track can never be wider than its share, so the cards cannot collide
     however many phrases the menu grows. */
  ok('every track is capped at its share',
     /grid-template-columns: repeat\(var\(--phrase-n, 2\), minmax\(0, 1fr\)\)/.test(css));
  /* and the longest line in a card, which has no break opportunities of its
     own, is allowed to break rather than push its track open */
  ok('the reading may break inside a syllable',
     /\.phrase \.p \{[^}]*overflow-wrap: anywhere/.test(css));
  ok('six is where one row stops being readable, and it wraps instead',
     /past six the\s*\n?\s*cards are too narrow/.test(app));
}

console.log('\nvague meanings');
{
  /* Twenty-two meanings are a job description in brackets rather than a
     translation — the particles and the measure words. They cannot be told
     apart by their English, so the reading rides along; but tagging only ONE
     option of four would say which one is the answer. */
  const app = read('js/app.js');
  const vague = api.HQ.filter(ch => /^\(/.test(ch.m));
  ok('there are meanings that only describe a job', vague.length > 10, vague.length + ' of ' + api.HQ.length);
  ok('and every one of them is a particle or a measure word',
     vague.every(ch => ch.pos.some(p => p === 'mw' || p.startsWith('part'))),
     vague.filter(ch => !ch.pos.some(p => p === 'mw' || p.startsWith('part'))).map(c => c.c).join(' '));
  ok('the reading only rides along when two options need it',
     /const say = ms\.filter\(isJobGloss\)\.length >= 2;/.test(app));
  ok('and the tag is gated on that flag', /say && o && isJobGloss\(m\)/.test(app));

  /* The other place a meaning stands alone with no character beside it. */
  ok('the placement prompt carries it too',
     /place-q[^`]*isJobGloss\(ch\.m\)/.test(app));
}

console.log('\nmilestones');
{
  /* Its own store, so the running state above is left alone. */
  const m = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,load,introduce,knownChars,MILESTONES,milestoneDue,markMilestone,state};')();
  globalThis.localStorage._d = {};
  const st = m.load();
  ok('nothing to celebrate at zero', m.milestoneDue() === null);

  m.HQ.slice(0, 49).forEach(ch => m.introduce(ch.c));
  ok('nor at forty-nine', m.milestoneDue() === null, m.knownChars().length + ' known');
  m.introduce(m.HQ[49].c);
  ok('fifty is a milestone', m.milestoneDue() === 50);

  m.markMilestone(50);
  ok('and is not offered twice', m.milestoneDue() === null);

  /* The jump a placement test makes: past two at once. */
  m.HQ.slice(50, 160).forEach(ch => m.introduce(ch.c));
  ok('a jump offers the highest passed, not the lowest', m.milestoneDue() === 150,
     m.knownChars().length + ' known');
  m.markMilestone(150);
  ok('marking it clears the ones jumped over', m.milestoneDue() === null);
  ok('and they are recorded, not merely hidden', st.hailed.includes(100));

  /* The count can go down — a reset, or a character dropped from the
     curriculum — and nobody gets congratulated for the same fifty twice. */
  m.knownChars().slice(0, 60).forEach(c => delete st.chars[c]);
  ok('losing characters does not re-arm a milestone', m.milestoneDue() === null,
     m.knownChars().length + ' known');

  ok('the last milestone is the whole library', m.MILESTONES[m.MILESTONES.length - 1] === m.HQ.length);
  ok('every fiftieth character is one', m.MILESTONES.every((x, i) => x === (i + 1) * 50));

  /* The copy lives in app.js, which has no DOM here — but a milestone with no
     card would open an empty overlay, so the two lists are compared as text. */
  const app = read('js/app.js');
  const keys = [...app.slice(app.indexOf('const HAIL = {')).slice(0, 2000).matchAll(/^  (\d+):/gm)].map(x => +x[1]);
  ok('every milestone has a card', m.MILESTONES.every(x => keys.includes(x)),
     keys.join(' '));
  ok('and no card is left over', keys.every(x => m.MILESTONES.includes(x)));
}

console.log('\npractice');
const someone = api.knownChars();
ok('practice pool draws on learned characters', api.practicePool('r', 5).every(c => someone.includes(c)));
const target = someone[0];
const dueBefore = api.rec(target).due;
api.grade(target, true, 'r', { practice: true });
ok('practice does not push the review date out', api.rec(target).due === dueBefore);
ok('but it still counts toward the skill', api.rec(target).skills.r > 0);
api.grade(target, false, 'r', { practice: true });
ok('failing in practice still pulls the review forward', api.rec(target).due === api.dayKey());

console.log('\nhandwriting is graded gently');
const hw = api.knownChars()[0];
api.rec(hw).lvl = 4;
api.rec(hw).due = api.dayKey();
const lvlBefore = api.rec(hw).lvl;
api.grade(hw, false, 'w', { gentle: true });
ok('a missed stroke never demotes the character', api.rec(hw).lvl === lvlBefore);
ok('and never drags it back to today', api.rec(hw).due > api.dayKey());
ok('but the attempt is recorded', api.rec(hw).wrong > 0);
ok('and no writing credit is given', (api.rec(hw).skills.w || 0) === 0);
const lvl2 = api.rec(hw).lvl;
api.grade(hw, false, 'r');
ok('a missed RECOGNITION still costs a level', api.rec(hw).lvl < lvl2);

console.log('\nmenu tiers');
ok('three tiers defined', api.MENU_TIERS.length === 3);
ok('they are numbered in order', api.MENU_TIERS.every((t, i) => t.n === i + 1));

/* The gate is the menu itself: you get the next one when you can read this
   one. It used to be a menu count plus an overall-character count, which meant
   the card could grow because of work done on the Today tab — "it grows after
   3 more characters overall" promised a harder menu for reasons having nothing
   to do with the menu. */
{
  const g = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {MENU_READ,MENU_TIERS,load,introduce,menuLearn,menuTier,menuOnWall,menuCanRead,state};')();
  globalThis.localStorage._d = {};
  g.load();
  ok('a new learner gets the short menu', g.menuTier().n === 1);

  /* one short of the whole of level 1 */
  g.MENU_READ[1].slice(0, -1).forEach(c => g.menuLearn(c));
  ok('and keeps it while one character is still grey', g.menuTier().n === 1,
     g.menuOnWall().filter(c => !g.menuCanRead(c)).join(''));

  /* everything else in the library, which used to be what opened the gate */
  g.MENU_READ[3].filter(c => !g.MENU_READ[1].includes(c)).forEach(c => g.introduce(c));
  ok('learning the rest of the card elsewhere does not open it', g.menuTier().n === 1,
     'still level 1 with ' + g.menuOnWall().filter(c => !g.menuCanRead(c)).length + ' to go');

  g.menuLearn(g.MENU_READ[1][g.MENU_READ[1].length - 1]);
  ok('reading the last one does', g.menuTier().n === 3, 'level ' + g.menuTier().n);
  ok('and the wall grows with it', g.menuOnWall().length === g.MENU_READ[3].length);
}
const withDesc = MENU.sections.flatMap(s => s.items).filter(i => i[4]);
ok('every dish has a description for tier 2', withDesc.length === MENU.sections.flatMap(s => s.items).length);
const tierGlyphs = [...withDesc.flatMap(i => cjk(i[4][0])),
                    ...MENU.specials.items.flatMap(i => cjk(i[0])),
                    ...cjk(MENU.specials.note[0]), ...cjk(MENU.specials.head)];
{
  const taught = [...new Set(tierGlyphs.filter(c => CHAR_INDEX[c]))];
  const all = [...new Set(tierGlyphs)];
  ok('the grown-up menu is partly readable too', taught.length > all.length * 0.2,
     `${taught.length} of ${all.length} glyphs taught`);
  ok('and every character it does teach is a quest target',
     taught.every(c => MENU_CHARS.includes(c)), taught.filter(c => !MENU_CHARS.includes(c)).join(' '));
}

console.log('\nwhat today\'s numbers count');
/* "Reviewed today" read as a count of characters but incremented on every
   answer, so one character drilled four times read as four. */
const rc = api.knownChars()[0];
const revsBefore = api.reviewedToday().length;
api.tally('rev', rc);
api.tally('rev', rc);
api.tally('rev', rc);
ok('three answers on one character is one character revised',
   api.reviewedToday().length === revsBefore + 1, api.reviewedToday().join(' '));
ok('but every answer still counts as a card', api.today().rev >= 3);
const rc2 = api.knownChars()[1];
api.tally('rev', rc2);
ok('a second character is counted separately', api.reviewedToday().length === revsBefore + 2);

console.log('\nskill standing');
/* The tiles used to show only how many characters had crossed three clean
   passes, so a whole round of practice could leave the screen unchanged. */
api.nextNew(4).forEach(api.introduce);          /* make sure there are four to measure */
const sc = api.knownChars().slice(0, 4);
sc.forEach(c => { api.rec(c).skills.p = 0; });
const zero = api.skillStanding('p', sc);
ok('four characters to measure', sc.length === 4, `got ${sc.length}`);
ok('nothing practised reads as zero', zero.pct === 0 && zero.solid === 0 && zero.untouched === sc.length);
api.rec(sc[0]).skills.p = 1;
const one = api.skillStanding('p', sc);
ok('one clean pass moves the ring', one.pct > zero.pct, `${zero.pct} → ${one.pct}`);
ok('without claiming the character is solid', one.solid === 0 && one.partway === 1);
sc.forEach(c => { api.rec(c).skills.p = api.PASSES_FOR_SOLID; });
const full = api.skillStanding('p', sc);
ok('three passes each is a full ring', full.pct === 1 && full.solid === sc.length && full.untouched === 0);
sc.forEach(c => { api.rec(c).skills.p = 99; });
ok('extra reps never overflow it', api.skillStanding('p', sc).pct === 1);
ok('an empty set is not a division by zero', api.skillStanding('p', []).pct === 0);
ok('buckets account for every character',
   full.buckets.reduce((a, b) => a + b, 0) === full.total);

console.log('\nextra reps are their own count');
/* Today's list is finishable and ticks; Go deeper is unbounded and tallies.
   The two must not feed each other's numbers. */
const revStart = api.today().rev, extraStart = api.extraToday();
api.tallyExtra(); api.tallyExtra(); api.tallyExtra();
ok('reps accumulate', api.extraToday() === extraStart + 3);
ok('and never touch the review tally', api.today().rev === revStart);
ok('the lifetime total sees them', api.extraTotal() >= 3);
ok('so does the best day', api.extraBestDay() >= 3);
const revd0 = api.reviewedToday().length;
api.tallyExtra();
ok('a rep is not a character revised', api.reviewedToday().length === revd0);

console.log('\nwhat a practice round draws');
/* The old pool sorted the whole library by weakness and took the top N, so the
   same characters came round every time and the rest were never seen again. */
{
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,state,load,introduce,grade,practicePool,knownChars,rec,shownIn};')();
  globalThis.localStorage._d = {};
  fresh.load();
  /* Sized to this library rather than to Hanzi Quest's. RECENT_WINDOW is 40,
     so the learner needs at least that many "recent" characters and a decent
     tail of older ones behind them; with 300 in total, 40 recent and 260 old
     is the shape the split was designed for. */
  fresh.HQ.forEach(ch => fresh.introduce(ch.c));
  const OLD = fresh.HQ.length - 40;
  fresh.knownChars().forEach((c, i) => { fresh.rec(c).first = i < OLD ? '2000-01-01' : '2030-01-01'; });
  const recent = new Set(fresh.knownChars().filter(c => fresh.rec(c).first === '2030-01-01'));
  let hits = 0, total = 0;
  const seen = new Map();
  for (let i = 0; i < 40; i++) for (const c of fresh.practicePool('r', 10)) {
    total++; if (recent.has(c)) hits++;
    seen.set(c, (seen.get(c) || 0) + 1);
    fresh.grade(c, true, 'r', { practice: true });
  }
  const share = hits / total;
  ok('about 70% of a round is recently learned', share > 0.6 && share < 0.8, (share * 100).toFixed(0) + '%');
  ok('the rest reaches back into older characters', [...seen.keys()].some(c => !recent.has(c)));
  /* Not "most of the library": the pool deliberately spends 70% of every round
     on the recent window, so a fixed number of rounds can only reach so far
     into a library of any size — and the bigger the library, the smaller that
     fraction, which made the old `HQ.length * 0.6` a test of the library's
     size rather than of the rotation. What matters is that the 30% reaching
     back lands somewhere new nearly every time. */
  const older = total - hits;
  ok('rotation spreads across the library', seen.size > recent.size + older * 0.7,
     `${seen.size} distinct, of at most ${recent.size + older}`);
  const olderCounts = [...seen.entries()].filter(([c]) => !recent.has(c)).map(([, n]) => n);
  ok('and no old character is hammered', Math.max(...olderCounts) <= 4, 'max ' + Math.max(...olderCounts));
  ok('being asked is counted separately from being right',
     fresh.shownIn(fresh.knownChars()[0], 'r') >= fresh.rec(fresh.knownChars()[0]).skills.r);
  const small = fresh.practicePool('r', 10, fresh.knownChars().slice(0, 4));
  ok('a pool smaller than the round is returned whole', small.length === 4);
}

console.log('\nplacement');
{
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,state,load,placeKnown,wasPlaced,rec,isKnown,dueCount,knownChars,dayKey,nextNew,grade,PLACED_REST};')();
  globalThis.localStorage._d = {};
  fresh.load();
  ok('nobody is placed to begin with', !fresh.wasPlaced());

  /* someone who knew the first 60 apart from three they missed */
  const missed = new Set([fresh.HQ[7].c, fresh.HQ[22].c, fresh.HQ[51].c]);
  const got = fresh.HQ.slice(0, 60).map(ch => ch.c).filter(c => !missed.has(c));
  const added = fresh.placeKnown(got);

  ok('exactly what was answered is credited', added === got.length);
  ok('and nothing else', fresh.knownChars().length === got.length);
  ok('a missed character is not credited', [...missed].every(c => !fresh.isKnown(c)));
  ok('credited characters are marked as placed', got.every(c => fresh.rec(c).placed));
  ok('they carry the recognition they demonstrated', got.every(c => fresh.rec(c).skills.r === 1));

  /* the whole point of the rework: day one is not a backlog */
  ok('NOTHING is due today', fresh.dueCount() === 0);
  const soonest = Math.min(...got.map(c => fresh.rec(c).due).map(d => {
    const [y, m, dd] = d.split('-').map(Number);
    const [ty, tm, td] = fresh.dayKey().split('-').map(Number);
    return Math.round((new Date(y, m - 1, dd) - new Date(ty, tm - 1, td)) / 864e5);
  }));
  ok('nothing is due tomorrow either', soonest >= 2, soonest + ' days to the first');
  const spread = new Set(got.map(c => fresh.rec(c).due));
  ok('reviews are fanned across weeks', spread.size >= 15, spread.size + ' distinct dates');

  /* and day one is the ordinary first session */
  const five = fresh.nextNew(5);
  ok('day one still offers five new characters', five.length === 5);
  ok('starting at the first one you missed', five[0] === fresh.HQ[7].c, five.join(' '));
  ok('and never re-offers one you knew', five.every(c => !got.includes(c)));

  /* Placement credits land today, so `first` is today's date for all of them.
     learnedToday() in app.js filters on `placed` to tell "credited this
     morning" from "actually sat down and learnt it" — without that, being
     placed at 69 put 69 characters in the Learned today strip and asked you to
     write out and pronounce every one. This asserts the flag that hook needs. */
  const k = fresh.dayKey();
  const learntToday = got.filter(c => fresh.rec(c).first === k && !fresh.rec(c).placed);
  ok('placed characters all carry today as their first day', got.every(c => fresh.rec(c).first === k));
  ok('but none of them reads as learnt today', learntToday.length === 0);
  ok('while still counting as known', got.every(c => fresh.isKnown(c)));

  /* retaking only adds */
  const before = fresh.rec(got[0]).due;
  fresh.rec(got[0]).lvl = 8;
  const again = fresh.placeKnown([got[0], fresh.HQ[7].c]);
  ok('a retake credits only what is new', again === 1);
  ok('and leaves an existing record alone', fresh.rec(got[0]).lvl === 8 && fresh.rec(got[0]).due === before);
  ok('crediting nothing is harmless', fresh.placeKnown([]) === 0);
}

console.log('\nword of the week');
ok('no interests, no word', (() => { api.state.interests = []; api.state.wotw = null; return api.wordOfWeek() === null; })());
api.state.interests = ['food', 'tech'];
api.state.wotw = null; api.state.wotwPast = [];
const w1 = api.wordOfWeek();
ok('picking interests produces one', !!w1 && !!api.INTERESTS[w1.cat]);
ok('it comes from an interest you chose', api.state.interests.includes(w1.cat));
ok('and it is stable within the week', JSON.stringify(api.wordOfWeek()) === JSON.stringify(w1));
ok('every interest word is complete', api.INTEREST_KEYS.every(k =>
  api.INTERESTS[k].words.every(w => w.length === 4 && w.every(part => part && part.trim()))));
ok('every interest has an icon and a name', api.INTEREST_KEYS.every(k =>
  api.INTERESTS[k].icon && api.INTERESTS[k].name && api.INTERESTS[k].zh));
ok('week keys look like ISO weeks', /^\d{4}-W\d{2}$/.test(api.weekKey()));
ok('and change from week to week',
   api.weekKey(new Date(2026, 0, 5)) !== api.weekKey(new Date(2026, 0, 15)));

console.log('\neverything speakable has a clip');
{
  /* Clips used to be generated for the taught characters only, so 金 in 现金
     and 第 in 第一 were silent — and one gap made sayPhrase abandon the whole
     word to a system voice that may not exist. */
  const want = new Set();
  const add = t => [...String(t || '')].forEach(c => { if (/[\u4e00-\u9fff]/.test(c)) want.add(c); });
  HQ.forEach(ch => { add(ch.c); ch.words.forEach(w => add(w[0])); add(ch.sent[0]); });
  add(MENU.title); add(MENU.name);
  MENU.sections.forEach(x => { add(x.head); x.items.forEach(i => { add(i[0]); if (i[4]) add(i[4][0]); }); });
  (MENU.phrases || []).forEach(x => add(x[0]));
  add(MENU.specials.head);
  MENU.specials.items.forEach(i => add(i[0]));
  add(MENU.specials.note[0]);
  Object.values(api.INTERESTS).forEach(c => c.words.forEach(w => add(w[0])));
  api.FESTIVALS.forEach(f => f.words.forEach(w => add(w[0])));

  let bundled = null;
  try {
    const w = {};
    new Function('window', read('js/audio.js'))(w);
    bundled = new Set(Object.keys(w.HQ_AUDIO || {}));
  } catch { /* not generated in this checkout */ }

  if (!bundled) {
    console.log('  – js/audio.js not present, skipping (run tools/make-audio.mjs)');
  } else {
    const missing = [...want].filter(c => !bundled.has(c));
    ok(`${want.size} speakable characters`, want.size > HQ.length);
    ok('every one of them has a clip', !missing.length,
       missing.length + ' missing: ' + missing.slice(0, 30).join(''));
  }
}

console.log('\nno drill shows a character you have not met');
{
  /* The build-the-word drill filtered its target on CHAR_INDEX — is this in
     the library — rather than isKnown, and drew its distractor tiles from the
     whole library regardless. Ninety-nine rounds in a hundred put at least one
     unseen character in front of the learner, which makes the wrong answers
     noise rather than choices. The gap drill had the same fault more quietly.

     This can only be checked properly in the browser, where renderDrill lives.
     What is asserted here is the data condition it relies on: that every
     character has a word it can be drilled with, and soon. */
  /* How long a character waits for a pairing it could actually be drilled
     with — not whether it waits at all.

     This used to ask a yes/no question: does a readable pairing exist the
     moment the character is taught? That cannot tell a wait of one character
     from a wait of sixteen, and a wait of one is not a problem in any sense —
     你 and 好 cannot both be first, and whichever loses is ready in the same
     session. Measuring the wait says the thing worth knowing, and it came out
     stricter rather than looser: a character waiting eleven now shows up,
     where before it hid in the same ten per cent as 朋 waiting for 友.

     Stage 1 is excluded from the tight bound because at that point almost
     nothing has been taught and the question is meaningless — but it is still
     held to the outer one, so nothing can be stranded there. */
  const cjk = t => [...String(t)].filter(c => /[\u4e00-\u9fff]/.test(c));
  const at = new Map(HQ.map((c, i) => [c.c, i]));
  const waitFor = ch => {
    const ready = ch.words
      .filter(w => cjk(w[0]).length > 1 && cjk(w[0]).every(x => at.has(x)))
      .map(w => Math.max(...cjk(w[0]).map(x => at.get(x))));
    return ready.length ? Math.max(0, Math.min(...ready) - at.get(ch.c)) : Infinity;
  };
  const DAY = 5;                       /* one session's worth of new characters */
  const all = HQ.map(waitFor);
  ok('every character eventually gets a word made only of taught characters',
     all.every(w => w < Infinity), HQ.filter((_, i) => all[i] === Infinity).map(c => c.c).join(' '));
  const slow = HQ.filter((_, i) => all[i] > DAY * 14);
  ok('and none waits more than a fortnight of sessions for it', !slow.length,
     slow.map(c => c.c).join(' '));

  const past = HQ.filter(ch => ch.stage > 1);
  const waits = past.map(waitFor);
  const within = waits.filter(w => w <= DAY).length;
  ok('past the first stage, nearly all are drillable within a session',
     within > past.length * 0.9, `${within} of ${past.length} wait ${DAY} characters or fewer`);
  {
    const worst = HQ.map((ch, i) => ({ c: ch.c, w: all[i] })).sort((a, b) => b.w - a.w).slice(0, 3);
    console.log(`    longest waits: ${worst.map(x => `${x.c} ${x.w}`).join(', ')}`);
  }
  /* a word is only useful as a drill if it actually contains its character */
  const off = HQ.filter(ch => ch.words.some(w => !w[0].includes(ch.c)));
  ok('every word listed under a character contains it', !off.length,
     off.slice(0, 8).map(c => c.c).join(''));
  /* a character listed as its own word teaches nothing as a pairing, and the
     gap and build drills both need two characters to work with */
  const selfy = HQ.filter(ch => ch.words.some(w => w[0] === ch.c));
  ok('and none is just the character over again', !selfy.length,
     selfy.map(c => c.c).join(''));
  const dupes = HQ.filter(ch => new Set(ch.words.map(w => w[0])).size !== ch.words.length);
  ok('no character lists the same word twice', !dupes.length,
     dupes.map(c => c.c).join(''));
  const multi = HQ.filter(ch => !ch.words.some(w => cjk(w[0]).length > 1));
  ok('every character has at least one multi-character pairing', !multi.length,
     multi.map(c => c.c).join(''));
  /* the pinyin should have roughly one syllable per character */
  const odd = [];
  HQ.forEach(ch => ch.words.forEach(w => {
    const n = cjk(w[0]).length;
    const v = (w[1].match(/[aeiou\u00e0-\u01dc]+/gi) || []).length;
    if (v && Math.abs(v - n) > 1) odd.push(ch.c + ' ' + w[0] + '=' + w[1]);
  }));
  ok('and pinyin syllables line up with characters', !odd.length, odd.slice(0, 6).join(' '));
}

console.log('\nthe trackpad lets go');
{
  /* Pointer lock is the browser's, not ours. padStop() used to tear down the
     brush, the hint and every listener while leaving the lock held, so the
     cursor stayed captured and the only way out was Escape — the key the
     browser handles itself. None of this can run under node, so what is
     asserted is the shape of the code that fixes it. */
  const app = read('js/app.js');
  const stop = app.slice(app.indexOf('function padStop()'));
  const body = stop.slice(0, stop.indexOf('\n}'));
  ok('padStop releases the pointer lock', /exitPointerLock/.test(body));
  ok('and detaches its change listener before doing so',
     body.indexOf('removeEventListener("pointerlockchange"') < body.indexOf('exitPointerLock'));
  /* Handing the brush to a new square must not drop the lock and ask for it
     back: browsers rate-limit a re-request landing in the cooldown after an
     unlock, and re-requesting a lock already held fires no event at all, so
     padArm never runs and the trackpad goes dead. */
  ok('a handoff retargets instead of restarting', /function padHandoff/.test(app));
  ok('and the notebook hands off rather than stopping',
     /padHandoff\(\$\("\.tian", sq\)/.test(app));
  const nbSwitch = app.slice(app.indexOf('data-nbsrc]').valueOf());
  ok('changing exercise no longer tears the lock down',
     !/padStop\(\); nb\.word = null/.test(app));
}

console.log('\njyutping on the pairings');
{
  /* The deep audit of every reading — against Unihan for the characters and
     CC-Canto for the words — lives in tools/check-jyutping.mjs, because it
     needs reference data too large to carry in here and it has something to
     say that a pass/fail cannot: which divergences from the dictionary are
     deliberate. What this checks is that it is still there to be run, and the
     two things about a reading that are wrong in any dialect. */
  ok('the jyutping audit exists', existsSync(new URL('check-jyutping.mjs', import.meta.url)),
     'run node tools/check-jyutping.mjs');
  const SYL = /^[a-z]{1,6}[1-6]$/;
  const toneless = [];
  HQ.forEach(ch => {
    if (!SYL.test(ch.p)) toneless.push(`${ch.c}=${ch.p}`);
    ch.words.forEach(w => w[1].split(/\s+/).forEach(x => { if (!SYL.test(x)) toneless.push(`${w[0]} ${x}`); }));
  });
  ok('every syllable carries a tone digit', !toneless.length, toneless.slice(0, 8).join(' '));
  const off = [];
  HQ.forEach(ch => ch.words.forEach(w => {
    const n = [...w[0]].filter(c => /[一-鿿]/.test(c)).length;
    if (n !== w[1].trim().split(/\s+/).length) off.push(`${w[0]} ${w[1]}`);
  }));
  ok('and every word has one syllable per character', !off.length, off.slice(0, 6).join('  '));
}

console.log('\nnothing gives the answer away');
{
  const cjk = t => [...String(t)].filter(c => /[\u4e00-\u9fff]/.test(c));
  /* The recall and writing drills show a character's meaning as the hint and
     ask you to produce the character. A meaning with Chinese in it therefore
     hands over the answer — 什 was glossed "what (in 什么)". */
  const leaky = HQ.filter(ch => cjk(ch.m).length);
  ok('no character meaning contains Chinese', !leaky.length,
     leaky.map(c => c.c + '=' + c.m).join(' '));
  /* The build-the-word drill shows the English meaning and asks you to
     assemble the characters. */
  const wordy = [];
  HQ.forEach(ch => ch.words.forEach(w => { if (cjk(w[2]).length) wordy.push(w[0] + '=' + w[2]); }));
  ok('no pairing meaning contains Chinese', !wordy.length, wordy.slice(0, 6).join(' '));
  /* A definition that is only the romanisation teaches nothing: 北京 glossed
     "Beijing" says no more than the pinyin already showing above it. Proper
     nouns are allowed one, but should carry a literal sense as well. */
  const bareOf = t => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z]/g, '');
  const echo = [];
  HQ.forEach(ch => ch.words.forEach(w => {
    const p = bareOf(w[1]), m = bareOf(w[2]);
    if (p.length > 3 && m === p) echo.push(w[0] + ' ' + w[1] + ' = ' + w[2]);
  }));
  ok('and none is purely its own romanisation', !echo.length, echo.slice(0, 6).join('  '));

  /* A word is listed under every character it contains, so the same word is
     written out two or three times. Those copies drifted apart: 北京 was
     "Beijing (northern capital)" under 北 and plain "Beijing" under 京, and
     汉字 was capitalised under one and not the other. A learner meeting the
     same word twice should meet the same word. */
  const byWord = new Map();
  HQ.forEach(ch => ch.words.forEach(w => {
    const e = byWord.get(w[0]) || [];
    e.push({ under: ch.c, pin: w[1], mean: w[2] });
    byWord.set(w[0], e);
  }));
  const repeated = [...byWord.entries()].filter(([, v]) => v.length > 1);
  const pinSplit = repeated.filter(([, v]) => new Set(v.map(x => x.pin)).size > 1);
  const meanSplit = repeated.filter(([, v]) => new Set(v.map(x => x.mean)).size > 1);
  ok(`${repeated.length} words are listed under more than one character`, repeated.length > 0);
  ok('and each reads the same wherever it appears', !pinSplit.length,
     pinSplit.slice(0, 5).map(([w, v]) => w + ' ' + v.map(x => x.pin).join('/')).join('  '));
  ok('and means the same wherever it appears', !meanSplit.length,
     meanSplit.slice(0, 5).map(([w, v]) => w + ' ' + v.map(x => JSON.stringify(x.mean)).join('/')).join('  '));
}

console.log('\nseasonal words');
ok('every festival word is complete', api.FESTIVALS.every(f =>
  f.words.every(w => w.length === 4 && w.every(part => part && String(part).trim()))));
ok('every festival has enough words to not repeat for years',
   api.FESTIVALS.every(f => f.words.length >= 5),
   api.FESTIVALS.filter(f => f.words.length < 5).map(f => f.key).join(' '));
ok('a fixed-date festival resolves', !!api.festivalDate(api.FESTIVALS.find(f => f.key === 'christmas'), 2027));
ok('a lunar one resolves from its table', !!api.festivalDate(api.FESTIVALS.find(f => f.key === 'cny'), 2027));
ok('and declines to guess outside it', !api.festivalDate(api.FESTIVALS.find(f => f.key === 'cny'), 2099));
ok('christmas week is detected', api.festivalThisWeek(new Date('2026-12-25T12:00:00'))?.key === 'christmas');
ok('lunar new year week is detected', api.festivalThisWeek(new Date('2026-02-17T12:00:00'))?.key === 'cny');
{
  /* An ordinary week has to actually be ordinary. The Hong Kong calendar is
     crowded enough that picking a date by eye is how you end up asserting that
     a public holiday isn't one. */
  let free = null;
  for (let d = new Date('2026-01-01T12:00:00'); d < new Date('2027-01-01T12:00:00'); d.setDate(d.getDate() + 7)) {
    if (!api.festivalThisWeek(new Date(d))) { free = new Date(d); break; }
  }
  ok('an ordinary week is not', free && !api.festivalThisWeek(free),
     free ? free.toISOString().slice(0, 10) : 'every week of 2026 has a festival in it');
}
{
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {state,load,wordOfWeek,wotwEntry,FESTIVALS};')();
  globalThis.localStorage._d = {};
  fresh.load();
  fresh.state.interests = ['food'];
  const picks = [];
  for (let y = 2026; y <= 2031; y++) {
    fresh.state.wotw = null;
    const e = fresh.wotwEntry(fresh.wordOfWeek(new Date(y + '-12-25T12:00:00')));
    picks.push(e.word[0]);
    if (!e.festival) picks.push('NOT-A-FESTIVAL-WORD');
  }
  ok('christmas week teaches a christmas word', !picks.includes('NOT-A-FESTIVAL-WORD'));
  ok('and a different one every year', new Set(picks).size === picks.length, picks.join(' '));
  /* the interest pool may cycle; festival history may not be wiped */
  const hist = fresh.state.wotwPast.filter(x => x.startsWith('f:'));
  ok('festival history is kept', hist.length === 6);
}
ok('a festival word shows even with no interests picked', (() => {
  const f2 = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {state,load,wordOfWeek,wotwEntry};')();
  globalThis.localStorage._d = {};
  f2.load();
  f2.state.interests = [];
  const e = f2.wotwEntry(f2.wordOfWeek(new Date('2026-12-25T12:00:00')));
  return !!e && e.festival;
})());
ok('and no interests in an ordinary week means no word', (() => {
  const f3 = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {state,load,wordOfWeek};')();
  globalThis.localStorage._d = {};
  f3.load();
  f3.state.interests = [];
  return f3.wordOfWeek(new Date('2026-05-06T12:00:00')) === null;
})());

console.log('\ntiers gate the library');
{
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,TIERS,TIER_UNLOCK,state,load,introduce,tierProgress,tierUnlocked,tierNeeds,unlockedCeiling,isLocked,nextNew,remainingNew,tierFrom,tierChars,tierOf,placeKnown};')();
  globalThis.localStorage._d = {};
  fresh.load();
  /* Five gates now. The boundaries sit where the ability changes rather than
     every sixty characters, which is why they are uneven — 81, 65, 41, 71, 42.
     What is checked is that they tile the library with no gaps and no overlap. */
  ok('tiers end where the library does', fresh.TIERS[fresh.TIERS.length - 1].to === fresh.HQ.length,
     fresh.TIERS.map(t => t.to).join());
  ok('they tile the curriculum with no gaps',
     fresh.TIERS.every((t, i) => fresh.tierFrom(t) === (i ? fresh.TIERS[i - 1].to : 0)));
  ok('tier 1 is open from the start', fresh.tierUnlocked(fresh.TIERS[0]));
  ok('tier 2 is not', !fresh.tierUnlocked(fresh.TIERS[1]));
  ok('the ceiling starts at the first tier', fresh.unlockedCeiling() === fresh.TIERS[0].to,
     String(fresh.unlockedCeiling()));
  const PAST = fresh.TIERS[0].to + 5;
  ok('a character past it is locked', fresh.isLocked(fresh.HQ[PAST].c));
  ok('one inside it is not', !fresh.isLocked(fresh.HQ[10].c));
  ok('new characters never come from beyond the gate',
     fresh.nextNew(500).every(c => fresh.HQ.find(x => x.c === c).i < fresh.TIERS[0].to));
  ok('and "remaining" counts only what you may start',
     fresh.remainingNew() === fresh.TIERS[0].to);
  ok('the gate says what would open it', (() => {
    const nd = fresh.tierNeeds(fresh.TIERS[1]);
    return nd && nd.tier.n === 1 && nd.more === Math.ceil(fresh.TIERS[0].to * fresh.TIER_UNLOCK);
  })());
  /* learn enough of tier 1 and the door opens */
  fresh.HQ.slice(0, Math.ceil(fresh.TIERS[0].to * fresh.TIER_UNLOCK)).forEach(ch => fresh.introduce(ch.c));
  ok('reaching the threshold unlocks the next tier', fresh.tierUnlocked(fresh.TIERS[1]));
  /* the ceiling stops at the end of the last OPEN tier, or the end of what is
     written — whichever comes first. Pinning it to HQ.length was only right
     while the library stopped inside tier 2. */
  ok('and the ceiling moves with it',
     fresh.unlockedCeiling() === Math.min(fresh.TIERS[1].to, fresh.HQ.length),
     String(fresh.unlockedCeiling()));
  ok('what was locked no longer is', !fresh.isLocked(fresh.HQ[PAST].c));
  ok('the last tier ends the library', fresh.TIERS[fresh.TIERS.length - 1].to === fresh.HQ.length);
  ok('and never reports more built than planned',
     fresh.TIERS.every(t => fresh.tierProgress(t).built <= fresh.tierProgress(t).planned));
}
{
  /* placement credits past a gate, and that is what opens it */
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') +
    '\nreturn {HQ,TIERS,state,load,placeKnown,tierUnlocked,unlockedCeiling};')();
  globalThis.localStorage._d = {};
  fresh.load();
  fresh.placeKnown(fresh.HQ.slice(0, fresh.TIERS[0].to + 20).map(ch => ch.c));
  ok('a placement past tier 1 opens tier 2', fresh.tierUnlocked(fresh.TIERS[1]));
  ok('and the ceiling follows',
     fresh.unlockedCeiling() === Math.min(fresh.TIERS[1].to, fresh.HQ.length));
}

console.log('\nstreak safety');
api.setState ? 0 : 0;
ok('days studied counts every active day', typeof api.daysStudied() === 'number' && api.daysStudied() >= 1);

console.log('\nreset leaves nothing behind');
/* Object.assign(state, blank()) only overwrites the keys blank() declares, so
   anything the record grew afterwards survived a "reset everything". */
api.nextNew(3).forEach(api.introduce);
api.state.menuPick = { d: api.dayKey(), c: api.MENU_CHARS[0], done: false };
api.state.lastBackup = 1;
api.state.somethingAddedLater = 'still here';
api.save();
ok('there is something to clear', Object.keys(api.state.chars).length > 0);
const fresh = api.resetProgress();
ok('characters are gone', Object.keys(fresh.chars).length === 0);
ok('days are gone', Object.keys(fresh.days).length === 0);
ok('the streak is gone', fresh.streak.cur === 0 && fresh.streak.last === null);
ok('settings are back to their defaults', fresh.goalNew === api.blank().goalNew);
const strays = Object.keys(fresh).filter(k => !(k in api.blank()));
ok('no key outlives the reset', !strays.length, strays.join(' '));
const stored = JSON.parse(globalThis.localStorage.getItem('cantonese-quest-v1'));
ok('and the stored copy matches', !Object.keys(stored).some(k => !(k in api.blank())));
ok('the tour is due again', fresh.tour === false);

/* ---------- tones ----------

   The 聲調 page states as fact that a stopped syllable — one ending p, t or k
   — only ever carries tone 1, 3 or 6. That is a real rule of Cantonese
   phonology (入聲 takes only the level pitches), and the page says it is true
   of this library with no exceptions. If a word list ever contradicts it,
   either the reading is wrong or the page is lying. */

/* ---------- clips and the readings they are meant to carry ----------

   Ten characters are taught with a colloquial reading that is not the
   dictionary default, and `say` reads a character in isolation — so for those
   the clip can teach a different word from the card. Two are recorded from a
   homophone instead (tools/make-audio.mjs, SAY_AS). This checks the swap is
   still in the bundle: an identical clip means the same audio was used. */

console.log('\naudio: the clip matches the reading on the card');
{
  /* Evaluate the bundle rather than pattern-match it: it is one very long
     object literal on one line, and a regex over 2.8 MB of base64 is a way to
     be confidently wrong. */
  const w = {};
  new Function('window', read('js/audio.js'))(w);
  /* Compare the audio, not the file. Two separate encodes of the same sound
     differ from byte 67 — the M4A container stamps each one with its own
     creation time — so comparing the clips whole reports a difference that
     nobody can hear. The mdat atom is the audio itself. */
  const grab = c => {
    const raw = (w.HQ_AUDIO || {})[c];
    if (!raw) return null;
    const buf = Buffer.from(raw, 'base64');
    const i = buf.indexOf('mdat');
    return i < 0 ? null : buf.slice(i + 4);
  };
  for (const [c, via] of [['聽', '廳'], ['朝', '招']]) {
    const a = grab(c), b = grab(via);
    ok(`${c} is recorded as ${via}`, !!a && !!b && a.equals(b),
       !a ? 'no clip' : !b ? `${via} is not in the bundle` : 'the audio differs');
  }
  /* and the comparison is worth something: two different characters must not
     pass it */
  ok('two different characters do not match', !grab('一').equals(grab('二')));
  const src = read('tools/make-audio.mjs');
  ok('and the six with no homophone are written down',
     /const UNFIXED = \[[^\]]*"呢"[^\]]*\]/.test(src));
}

console.log('\ntones: what the 聲調 page claims');
{
  const toneOfP = p => +((String(p).match(/([1-6])\s*$/) || [])[1] || 0);
  const checked = HQ.filter(c => /[ptk][1-6]\s*$/.test(c.p));
  const tones = [...new Set(checked.map(c => toneOfP(c.p)))].sort();
  ok('there are stopped syllables to talk about', checked.length > 10, checked.length + '');
  ok('and every one carries tone 1, 3 or 6',
     tones.every(t => [1, 3, 6].includes(t)),
     checked.filter(c => ![1, 3, 6].includes(toneOfP(c.p))).map(c => c.c + ' ' + c.p).join(' '));

  /* the two demonstration sets have to keep existing, with their audio */
  const bare = p => String(p).replace(/[1-6]/g, '').trim();
  for (const [syl, want] of [['go', [1, 2, 3]], ['maai', [4, 5, 6]]]) {
    const got = HQ.filter(c => bare(c.p) === syl).map(c => toneOfP(c.p));
    ok(`${syl} still covers tones ${want.join('')}`,
       want.every(t => got.includes(t)), 'has ' + [...new Set(got)].sort().join(''));
  }
  const demo = ['哥', '嗰', '個', '埋', '買', '賣'];
  ok('all six demonstration characters are taught', demo.every(c => CHAR_INDEX[c]),
     demo.filter(c => !CHAR_INDEX[c]).join(' '));
  const app = read('js/app.js');
  ok('and the page is wired into the nav', /tones:\s*renderTones/.test(app));
}

/* ---------- studying ahead ----------

   The bug this pins: "Study ahead — 5 more characters" did `goalNew += 5`,
   which is the standing setting. One click on a Tuesday made every day after
   it a ten-character day, and the settings stepper read 10 with nobody having
   touched it. */

console.log('\nstudying ahead: today only');
{
  const a = new Function(
    read('js/data.js') + '\n' + read('js/srs.js') + '\n' +
    'return {state,load,blank,save,today,dayKey,studyAhead,aheadToday,dayGoal,newLeftToday,goalMet,nextNew,introduce,tally,remainingNew};')();
  const KEY = 'cantonese-quest-v1';
  /* load() REASSIGNS the module-level `state`, so the object handed back in
     the harness snapshot goes stale the moment it is called. Always read the
     record load() returns, never `a.state`. */
  const reset = (over = {}) => {
    globalThis.localStorage._d[KEY] = JSON.stringify(Object.assign(a.blank(), over));
    return a.load();
  };

  let st = reset();
  const base = st.goalNew;
  ok('the day starts on the standing goal', a.dayGoal() === base);
  a.studyAhead(5);
  ok('asking for more deals more today', a.dayGoal() === base + 5);
  ok('but the setting is untouched', st.goalNew === base);
  a.studyAhead(5);
  ok('and twice is still the setting', st.goalNew === base && a.dayGoal() === base + 10);

  /* tomorrow: the same record, read on a different day */
  const tomorrow = new Date(a.dayKey() + 'T12:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const k2 = a.dayKey(tomorrow);
  ok('the extra belongs to the day it was asked for', !(st.days[k2] && st.days[k2].ahead));

  /* a finished day stays finished */
  st = reset();
  a.nextNew(st.goalNew).forEach(c => { a.introduce(c); a.tally('new'); });
  const was = a.goalMet();
  a.studyAhead(5);
  ok('a day that was done is still done after asking for more', was && a.goalMet() === was);

  /* ---- the runaway ----

     The second half of the same bug, and the half that survived the first
     fix. nextNew(n) returns the next n characters you have NEVER seen, so it
     cannot see what today already taught you: dealing nextNew(dayGoal()) on a
     finished day of five handed out ten more. Click, finish, click, finish,
     and the day went 5 -> 15 -> 30 -> 50 while the hero counted down a
     different number from the one the session dealt. */
  st = reset();
  const round = () => {
    const owed = a.newLeftToday();
    a.nextNew(owed).forEach(c => { a.introduce(c); a.tally('new'); });
    return owed;
  };
  const first = round();
  ok('the first session deals the standing goal', first === base, 'dealt ' + first);
  ok('and the day is then clear', a.newLeftToday() === 0);

  const dealt = [];
  for (let i = 0; i < 4; i++) { a.studyAhead(5); dealt.push(round()); }
  ok('every study-ahead round deals exactly five', dealt.every(n => n === 5), dealt.join(','));
  ok('so four rounds taught 5 + 20, not 5 -> 15 -> 30 -> 50',
     st.days[a.dayKey()].new === base + 20, 'learned ' + st.days[a.dayKey()].new);
  ok('and the setting never moved through any of it', st.goalNew === base);
}

console.log('\nthe setting repairs itself');
{
  const a = new Function(
    read('js/data.js') + '\n' + read('js/srs.js') + '\n' +
    'return {load,blank,GOAL_MIN,GOAL_MAX};')();
  const KEY = 'cantonese-quest-v1';
  const stored = goalNew => {
    globalThis.localStorage._d[KEY] = JSON.stringify(Object.assign(a.blank(), { goalNew }));
    return a.load().goalNew;
  };
  /* what a record left by the old `goalNew += 5` actually looks like */
  ok('a goalNew the stepper cannot produce goes back to the default',
     stored(60) === a.blank().goalNew, 'got ' + stored(60));
  ok('but a number someone could have chosen is left alone', stored(12) === 12);
  ok('and neither is zero a setting', stored(0) === a.blank().goalNew);
  ok('the stepper range is the one the repair uses', a.GOAL_MIN === 1 && a.GOAL_MAX === 30);
}

/* ---------- sprint ----------

   js/sprint.js is DOM-free at the top level — every line of it that touches
   the page is inside a function — so it runs here alongside the other two,
   which is what lets the cross-file names be pinned rather than hoped for. */

console.log('\nsprint: the record behind the sheets');
{
  const sprintSrc = read('js/sprint.js');
  const appSrc = read('js/app.js');
  const fresh = new Function(read('js/data.js') + '\n' + read('js/srs.js') + '\n' + sprintSrc +
    '\nreturn {HQ,state,load,save,introduce,grade,rec,dayKey,addDays,knownChars,' +
    'sprintState,sprintMark,sprintTrouble,sprintFluent,sprintForget,rightRun,sprintMisses,sprintHits,' +
    'sprintByMode,recordRun,sheetKey,sprintBests,sprintRecent,tallySprint,sprintToday,' +
    'SPRINT,WRITE_STYLES,SPRINT_WINDOW,SPRINT_CLEAR,SPRINT_TROUBLE,SPRINT_FLUENT,SPRINT_MINUTES,' +
    'SPRINT_COUNTS,SPRINT_MIN_POOL,sprintGrade,sprintPar,sprintDeal,fmtClock,sprintPick,liveStreak,today,' +
    'dayReps,daysStudied};')();
  globalThis.localStorage._d = {};
  fresh.load();
  const chars = fresh.HQ.slice(0, 20).map(c => c.c);
  chars.forEach(fresh.introduce);
  const a = chars[0], b = chars[1];

  ok('a fresh record carries a sprint block', !!fresh.state.sprint && !!fresh.state.sprint.marks);

  /* marks */
  fresh.sprintMark(a, 'r', false);
  fresh.sprintMark(a, 'r', false);
  ok('misses are counted per mode', fresh.sprintMisses(a) === 2);
  ok('and the recent string records them', fresh.sprintState().marks[a].s === '00');
  ok('two misses put it in the 错字本', fresh.sprintTrouble().includes(a));
  fresh.sprintMark(a, 'l', true);
  fresh.sprintMark(a, 'r', true);
  ok('two right answers are not enough to leave', fresh.sprintTrouble().includes(a));
  ok('and the run is counted across modes', fresh.rightRun(a) === 2);
  fresh.sprintMark(a, 'r', true);
  ok(`${fresh.SPRINT_CLEAR} in a row clears it`, !fresh.sprintTrouble().includes(a));
  ok('but the history is kept', fresh.sprintMisses(a) === 2 && fresh.sprintHits(a) === 3);
  ok('the per-mode split survives', fresh.sprintByMode(a).find(x => x.mode === 'l').hit === 1);

  /* the recent string is what keeps the record from growing without limit */
  for (let i = 0; i < 40; i++) fresh.sprintMark(b, 'r', i % 2 === 0);
  ok('the recent window is capped', fresh.sprintState().marks[b].s.length === fresh.SPRINT_WINDOW);

  /* dismissing, and the evidence against it */
  const c = chars[2];
  fresh.sprintMark(c, 'w', false); fresh.sprintMark(c, 'w', false);
  ok('a third character is on the page', fresh.sprintTrouble().includes(c));
  fresh.sprintForget(c);
  ok('dismissing takes it off', !fresh.sprintTrouble().includes(c));
  fresh.sprintMark(c, 'w', false);
  ok('and missing it again puts it back', fresh.sprintTrouble().includes(c));

  /* fluent */
  const d = chars[3];
  for (let i = 0; i < fresh.SPRINT_FLUENT; i++) fresh.sprintMark(d, 'r', true);
  ok('a long clean run reads as fluent', fresh.sprintFluent().includes(d));
  fresh.sprintMark(d, 'r', false);
  ok('and one miss ends that', !fresh.sprintFluent().includes(d));

  /* a sprint must never make tomorrow worse */
  const e = chars[4];
  const before = { lvl: fresh.rec(e).lvl, due: fresh.rec(e).due };
  fresh.grade(e, false, 'r', { speed: true });
  ok('a sprint miss leaves the level alone', fresh.rec(e).lvl === before.lvl);
  ok('and leaves the review date alone', fresh.rec(e).due === before.due);
  ok('but it is still counted as a miss', fresh.rec(e).wrong === 1);
  fresh.grade(e, true, 'r', { speed: true });
  ok('a sprint hit gives skill credit', fresh.rec(e).skills.r === 1);
  ok('without pushing the review out', fresh.rec(e).due === before.due);

  /* sheets and the board */
  const run1 = { mode: 'r', style: null, n: 40, secs: 120, right: 31, answered: 40, done: true, ms: 96000 };
  ok('the first run on a sheet is a best', fresh.recordRun(run1).best);
  const worse = { ...run1, right: 28, ms: 90000 };
  ok('a lower score is not', !fresh.recordRun(worse).best);
  const faster = { ...run1, ms: 80000 };
  ok('the same score, quicker, is', fresh.recordRun(faster).best);
  const bigger = { ...run1, right: 33, ms: 119000 };
  ok('and more right beats quicker', fresh.recordRun(bigger).best);
  ok('the board keeps the best of them', fresh.sprintState().best['r:40:120'].right === 33);
  ok('a different size is a different sheet',
     fresh.recordRun({ ...run1, n: 60 }).best && Object.keys(fresh.sprintState().best).length === 2);
  ok('and so is a different writing style',
     fresh.sheetKey({ mode: 'w', n: 40, secs: 120, style: 'type' })
     !== fresh.sheetKey({ mode: 'w', n: 40, secs: 120, style: 'spot' }));
  ok('the picker remembers the last sheet', fresh.sprintPick('r').n === 60);
  ok('recent runs are listed newest first', fresh.sprintRecent('r')[0].n === 60);

  /* the day, and the streak */
  const day = fresh.today();
  fresh.tallySprint(40);
  ok('sprint answers keep a streak alive', fresh.liveStreak() >= 1);
  ok('and are counted', fresh.sprintToday() === 40);
  ok('a sprint-only day counts as a day studied', fresh.daysStudied() === 1);
  ok("but stay out of today's checklist", day.new === 0 && day.rev === 0);
  ok('and still ink the day', fresh.dayReps(day) === 40);

  /* dealing a sheet */
  const pool = chars.slice(0, 5);
  const dealt = fresh.sprintDeal(pool, 100);
  ok('a sheet is always the length asked for', dealt.length === 100);
  ok('and never repeats a character back to back',
     dealt.every((x, i) => i === 0 || x !== dealt[i - 1]));
  const counts = pool.map(c => dealt.filter(x => x === c).length);
  ok('and spreads them evenly', Math.max(...counts) - Math.min(...counts) <= 1,
     counts.join(' '));

  /* difficulty is relative to the mode, which is the whole point of having par */
  ok('the same pace is harder to type than to read',
     fresh.sprintPar('w', 'type') > fresh.sprintPar('r'));
  ok('a generous sheet reads as steady', fresh.sprintGrade('r', 20, 300).zh === '慢');
  ok('and a brutal one does not', fresh.sprintGrade('r', 100, 60).zh === '狂');
  ok('the clock formats as minutes and seconds', fresh.fmtClock(95000) === '1:35');

  /* ---- every button goes somewhere ----

     The Menu's "Learn 個" ran openMenuLesson(), a name that appears exactly
     once in the repository: at the call site. The click threw a
     ReferenceError and the button did nothing, and nothing caught it — smoke
     can load srs.js and data.js because they are DOM-free, but app.js is not.

     A general "is every called name declared" scan was tried and abandoned:
     it read prose inside string literals as calls (o:"A person (人) with..."
     is person(); CSS var(--seal) is var()) and cried wolf 132 times. This
     looks only at handler bodies, which is where a dead name actually hides,
     and is exact. */
  /* The whole handler body, not just its first call.

     The first version of this matched one call per handler, which is fine for
     `onclick = () => foo()` and blind to everything after the first line of a
     braced body. capName() was deleted along with the page it had been
     declared next to, and the only call left to it was on line three of the
     introduction's Next handler — so Next silently threw and the button did
     nothing, which is precisely the bug this check exists to catch. */
  const OPEN = /(?:\.onclick\s*=|addEventListener\(\s*["'][a-z]+["']\s*,)\s*(?:async\s*)?(?:\(\s*[\w$,\s]*\)|[\w$]+)?\s*=>\s*/g;
  const DIRECT = /\.onclick\s*=\s*([A-Za-z_$][\w$]*)\s*;/g;
  const called = new Set();
  for (const m of appSrc.matchAll(DIRECT)) called.add(m[1]);
  for (const m of appSrc.matchAll(OPEN)) {
    let i = m.index + m[0].length;
    let body;
    if (appSrc[i] === "{") {
      /* walk to the matching brace so the whole body is covered */
      let depth = 0, j = i;
      for (; j < appSrc.length; j++) {
        if (appSrc[j] === "{") depth++;
        else if (appSrc[j] === "}") { depth--; if (!depth) break; }
      }
      body = appSrc.slice(i, j + 1);
    } else {
      body = appSrc.slice(i, appSrc.indexOf("\n", i) + 1 || undefined);
    }
    for (const c of body.matchAll(/(^|[^\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) called.add(c[2]);
  }
  /* `if` and friends open a handler body and are not calls; the rest the
     browser supplies. A name declared in srs.js counts — app.js is loaded
     after it and shares the global scope. */
  const NOT_A_CALL = new Set(['if', 'for', 'while', 'switch', 'return', 'typeof', 'await', 'catch',
                              'function', 'else', 'do', 'new', 'delete', 'void', 'in', 'of', 'try', 'throw',
                              'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'confirm',
                              'alert', 'fetch', 'requestAnimationFrame', 'Promise', 'Object', 'Array',
                              'Math', 'JSON', 'Set', 'Map', 'Date', 'Number', 'String', 'Boolean', 'Error',
                              'RegExp', 'KeyboardEvent', 'CustomEvent', 'Event', 'IntersectionObserver',
                              'getComputedStyle', 'addEventListener', 'removeEventListener', 'scrollTo',
                              'SpeechSynthesisUtterance', 'matchMedia', 'structuredClone', 'queueMicrotask']);
  /* data.js counts too: shuffle() lives there, and app.js is loaded after all
     three and shares the global scope with them. */
  const bundle = appSrc + sprintSrc + read('js/srs.js') + read('js/data.js');
  const isDeclared = n => new RegExp(
    `(?:const|let|var|function)\\s+${n.replace(/\$/g, '\\$')}(?![\\w$])`).test(bundle);
  const dead = [...called].filter(n => !NOT_A_CALL.has(n) && !isDeclared(n));
  ok(`every handler in app.js calls something that exists (${called.size} checked)`,
     !dead.length, dead.join(' '));

  /* the cross-file contract, both ways */
  const needsFromApp = ['startRepair', 'REPAIR_SIZE', 'esc', 'bare', 'searchable', 'optionSet', 'hanLabel',
                        'say', 'stopPhrase', 'toneMark', 'clipFor', 'clipCount', 'openChar',
                        'renderAll', 'celebrate', 'one', 'pick'];
  const missingInApp = needsFromApp.filter(n =>
    !new RegExp(`(const|let|function)\\s+${n}\\b`).test(appSrc));
  ok('everything sprint.js calls in app.js is declared there', !missingInApp.length, missingInApp.join(' '));
  const needsFromSprint = ['renderSprint', 'sprintOpen', 'sprintClose', 'sprintPause', 'sprintResume', 'sp'];
  const missingInSprint = needsFromSprint.filter(n =>
    !new RegExp(`(const|let|function)\\s+${n}\\b`).test(sprintSrc));
  ok('and everything app.js calls in sprint.js is declared there', !missingInSprint.length, missingInSprint.join(' '));
  ok('app.js renders the sprint tab', /RENDER = \{[^}]*sprint: renderSprint/.test(appSrc));
  ok('index.html loads sprint.js before app.js', (() => {
    const h = read('index.html');
    /* the tags, not the prose — index.html explains the cache in a comment
       that names js/app.js long before anything loads it */
    return h.indexOf('src="js/sprint.js') > 0
        && h.indexOf('src="js/sprint.js') < h.indexOf('src="js/app.js');
  })());
  ok('and gives it a tab in both navs', (read('index.html').match(/data-nav="sprint"/g) || []).length === 2);
  ok('the mistake notebook has somewhere to send you',
     /function startRepair/.test(appSrc) && /REPAIR_MODE/.test(appSrc));
}

console.log(failures ? `\nFAILED — ${failures} check(s)\n` : '\nall checks passed\n');
process.exit(failures ? 1 : 0);
