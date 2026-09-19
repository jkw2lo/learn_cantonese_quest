/* Audit every reading in js/data.js against the reference data.

   Hand-written jyutping drifts, and Cantonese gives it more room to drift than
   Mandarin does: many characters carry a literary reading and a spoken one,
   and the spoken one is usually the one you want. 行 is hang4 in a dictionary
   and haang4 in the street.

   So this does not simply demand that the file match Unihan. It checks the
   things that are unambiguously wrong — malformed syllables, a word that does
   not contain its own character, jyutping whose syllable count disagrees with
   the characters it is transcribing — and then prints every divergence from
   Unihan as a list to read, so that each one is a choice somebody made rather
   than a typo nobody caught.

   Run:  node tools/check-jyutping.mjs
*/

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { UNIHAN, cantoOf } from './jyut.mjs';

const src = readFileSync(fileURLToPath(new URL('../js/data.js', import.meta.url)), 'utf8');
const { HQ, MENU, INTERESTS, FESTIVALS, CHAR_INDEX, SIMPLIFIED } =
  new Function(src + '\nreturn {HQ,MENU,INTERESTS,FESTIVALS,CHAR_INDEX,SIMPLIFIED};')();

let fails = 0, notes = 0;
const bad = (what, detail) => { console.log(`  ✗ ${what}${detail ? ' — ' + detail : ''}`); fails++; };
const note = line => { console.log(`    ${line}`); notes++; };

const CJK = /[㐀-䶿一-鿿]/;
const cjk = s => [...String(s)].filter(c => CJK.test(c));

/* How many syllables a written form ought to have.

   Not simply the character count: Hong Kong Cantonese mixes Latin into words
   and means it — 紅Van is a red minibus, K歌 is a karaoke number, and both are
   ordinary words rather than code-switching. A run of Latin letters is one
   syllable, so 紅Van is two and K歌 is two. */
const units = s => (String(s).match(/[㐀-䶿一-鿿]|[A-Za-z]+/g) || []).length;

/* jyutping: an initial, a final, and a tone digit 1-6. The tone digit is the
   part hand-written jyutping forgets. */
const SYL = /^[a-z]{1,6}[1-6]$/;
const syls = j => String(j).trim().split(/\s+/).filter(Boolean);

console.log('\nshape');
{
  const missing = HQ.filter(ch => !ch.c || !ch.p || !ch.m || !ch.story || !ch.o
                                || !ch.pos?.length || !ch.words?.length || ch.sent?.length !== 3);
  missing.length ? bad('every character complete', missing.map(c => c.c).join(' '))
                 : console.log(`  ✓ all ${HQ.length} characters complete`);
  const dupes = HQ.map(c => c.c).filter((c, i, a) => a.indexOf(c) !== i);
  dupes.length ? bad('no duplicate characters', dupes.join(' ')) : console.log('  ✓ no duplicates');
  const single = HQ.filter(ch => cjk(ch.c).length !== 1);
  single.length ? bad('every entry is one character', single.map(c => c.c).join(' '))
                : console.log('  ✓ every entry is a single character');
}

console.log('\njyutping is well formed');
{
  const badChar = HQ.filter(ch => !SYL.test(ch.p));
  badChar.length ? bad('character readings', badChar.map(c => `${c.c}=${c.p}`).join(' '))
                 : console.log(`  ✓ all ${HQ.length} character readings`);

  const badWord = [];
  HQ.forEach(ch => ch.words.forEach(w => {
    if (!syls(w[1]).every(s => SYL.test(s))) badWord.push(`${ch.c}: ${w[0]} ${w[1]}`);
  }));
  badWord.length ? bad('word readings', badWord.join(' | ')) : console.log('  ✓ all word readings');

  const badSent = HQ.filter(ch => !syls(ch.sent[1]).every(s => SYL.test(s)));
  badSent.length ? bad('sentence readings', badSent.map(c => `${c.c}: ${c.sent[1]}`).join(' | '))
                 : console.log('  ✓ all sentence readings');
}

console.log('\nsyllables line up with characters');
{
  const off = [];
  HQ.forEach(ch => ch.words.forEach(w => {
    const n = units(w[0]), s = syls(w[1]).length;
    if (n !== s) off.push(`${ch.c}: ${w[0]} (${n}) vs ${w[1]} (${s})`);
  }));
  off.length ? bad('words', off.join(' | ')) : console.log('  ✓ every word');

  const offS = [];
  HQ.forEach(ch => {
    const n = units(ch.sent[0]), s = syls(ch.sent[1]).length;
    if (n !== s) offS.push(`${ch.c}: ${ch.sent[0]} (${n}) vs ${ch.sent[1]} (${s})`);
  });
  offS.length ? bad('sentences', offS.join(' | ')) : console.log('  ✓ every sentence');
}

console.log('\nwords are about their own character');
{
  const orphan = [], self = [], dupe = [];
  HQ.forEach(ch => {
    const seen = new Set();
    ch.words.forEach(w => {
      if (![...w[0]].includes(ch.c)) orphan.push(`${ch.c}: ${w[0]}`);
      if (cjk(w[0]).length < 2) self.push(`${ch.c}: ${w[0]}`);
      if (seen.has(w[0])) dupe.push(`${ch.c}: ${w[0]}`);
      seen.add(w[0]);
    });
    if (![...ch.sent[0]].includes(ch.c)) orphan.push(`${ch.c}: sentence`);
  });
  orphan.length ? bad('every pairing contains its character', orphan.join(' | ')) : console.log('  ✓ every pairing contains its character');
  self.length ? bad('no single-character "word"', self.join(' | ')) : console.log('  ✓ every pairing is a real pairing');
  dupe.length ? bad('no word listed twice', dupe.join(' | ')) : console.log('  ✓ no word listed twice');
}

console.log('\nthe same word agrees with itself wherever it appears');
{
  const readings = new Map();
  HQ.forEach(ch => ch.words.forEach(w => {
    if (!readings.has(w[0])) readings.set(w[0], new Map());
    readings.get(w[0]).set(w[1], (readings.get(w[0]).get(w[1]) || 0) + 1);
  }));
  const clash = [...readings].filter(([, m]) => m.size > 1)
    .map(([w, m]) => `${w}: ${[...m.keys()].join(' / ')}`);
  clash.length ? bad('one reading per word', clash.join(' | ')) : console.log('  ✓ every repeated word reads the same everywhere');

  const glosses = new Map();
  HQ.forEach(ch => ch.words.forEach(w => {
    if (!glosses.has(w[0])) glosses.set(w[0], new Set());
    glosses.get(w[0]).add(w[2]);
  }));
  const gclash = [...glosses].filter(([, s]) => s.size > 1).map(([w, s]) => `${w}: ${[...s].join(' / ')}`);
  gclash.length ? bad('one meaning per word', gclash.join(' | ')) : console.log('  ✓ and means the same everywhere');
}

console.log('\nnothing gives the answer away');
{
  /* A story or an etymology that spells out the meaning turns a recall drill
     into a reading test. The meaning appearing inside its own sentence
     translation is the usual way this happens. */
  const leak = HQ.filter(ch => {
    const first = ch.m.split(/[;(]/)[0].trim().toLowerCase();
    return first.length > 3 && ch.sent[2].toLowerCase().includes(first) && ch.m.split(';').length === 1
      && ch.sent[2].toLowerCase().split(first).length > 2;
  });
  leak.length ? note(`meaning echoed in its own sentence: ${leak.map(c => c.c).join(' ')}`)
              : console.log('  ✓ no meaning is echoed back by its own example');
}

console.log('\nagainst Unihan');
{
  const differ = HQ.filter(ch => UNIHAN[ch.c] && UNIHAN[ch.c] !== ch.p);
  const unknown = HQ.filter(ch => !UNIHAN[ch.c]);
  console.log(`  ${HQ.length - differ.length - unknown.length} of ${HQ.length} match Unihan exactly`);
  if (unknown.length) note(`not in Unihan at all: ${unknown.map(c => `${c.c}=${c.p}`).join(' ')}`);
  if (differ.length) {
    console.log(`  ${differ.length} deliberately differ — the spoken reading, not the literary one:`);
    differ.forEach(ch => note(`${ch.c}  file ${ch.p.padEnd(8)} unihan ${UNIHAN[ch.c]}   (${ch.m})`));
  }
}

console.log('\nagainst CC-Canto');
{
  /* Everything with a reading attached, not just the curriculum.

     This used to check the curriculum words and the menu and stop there — so
     打冷 sat in the interests list reading daa2 laang5 for as long as it took
     somebody to notice by ear. CC-Canto has it as daa2 laang1, and it was
     right: the 冷 there is a Teochew loan, not the Cantonese word for cold.
     Anything the app will say out loud gets checked. */
  const words = new Map();
  HQ.forEach(ch => ch.words.forEach(w => words.set(w[0], w[1])));
  MENU.sections.forEach(s => s.items.forEach(i => {
    if (cjk(i[0]).length > 1) words.set(i[0], i[1]);
    if (i[4] && cjk(i[4][0]).length > 1) words.set(i[4][0], i[4][1]);
  }));
  MENU.phrases.forEach(p => words.set(p[0], p[1]));
  Object.values(INTERESTS).forEach(c => c.words.forEach(w => words.set(w[0], w[1])));
  FESTIVALS.forEach(f => f.words.forEach(w => words.set(w[0], w[1])));
  let checked = 0, agreed = 0;
  const differ = [];
  for (const [w, jyut] of words) {
    const hits = cantoOf(w);
    if (!hits.length) continue;
    checked++;
    const all = new Set(hits.map(h => h.jyut));
    if (all.has(jyut)) agreed++;
    else differ.push({ word: w, line: `${w}  file ${jyut}   cc-canto ${[...all].slice(0, 3).join(' / ')}` });
  }
  console.log(`  ${agreed} of ${checked} words CC-Canto knows agree exactly (${words.size - checked} it has never heard of)`);
  /* Divergences that have been looked at and kept, with the reason. Anything
     not on this list is new and prints loudly.

     The list exists because 打冷 hid for weeks inside a run of twenty-nine
     unexplained notes, all of which looked alike. Twenty-eight were 變調 — the
     tone changes Cantonese makes in compounds — and one was simply wrong. A
     note nobody can triage is a note nobody reads. */
  const REVIEWED = {
    "男人": "變調 — jan4 raises to jan2 in this compound",
    "女人": "變調 — jan4 raises to jan2 in this compound",
    "靚女": "變調 — neoi5 raises to neoi2",
    "宵夜": "變調 — je6 raises to je2",
    "出面": "min6 is the 'outside' sense; min2 belongs to another",
    "西多士": "士 is si2 in the Hong Kong 多士, not the literary si6",
    "乾炒牛河": "河 takes the changed tone ho2 in the dish name",
    "凍檸茶": "檸 is ning4; ling4 is the n/l merger, common but not the standard",
    "青菜": "cing1 is the character's own reading; ceng1 is the colloquial variant",
    "屋企人": "企 is kei2 inside 屋企, not its standalone kei5",
    "過嚟": "嚟 is lai4 throughout this file", "返嚟": "嚟 is lai4; and 返 is faan1, not the literary faan2",
    "入嚟": "嚟 is lai4 throughout this file", "就嚟": "嚟 is lai4 throughout this file",
    "爸爸": "reduplicated kin terms take a low-falling first syllable",
    "媽媽": "reduplicated kin terms take a low-falling first syllable",
    "哥哥": "reduplicated kin terms take a low-falling first syllable",
    "姐姐": "reduplicated kin terms take a low-falling first syllable",
    "弟弟": "reduplicated kin terms take a low-falling first syllable",
    "妹妹": "reduplicated kin terms take a low-falling first syllable",
    "行路": "haang4 is the spoken reading; hang4 is literary",
    "坐低": "co5 is the spoken reading; zo5 is literary",
    "劏房": "變調 — 房 takes fong2 here, as it does in 廚房",
    "唔好意思": "意思 is ji3 si1; si3 is not a reading 思 takes here",
    "粵語殘片": "片 is pin2 in the film sense",
    "利是": "利是 is lai6 si6 in Hong Kong; lei6 is the literary reading of 利",
    "幾多錢": "變調 — 錢 lifts to cin2 after another word, as CC-Canto itself has it in 有錢",
    "收錢": "變調 — 錢 lifts to cin2 after another word, as CC-Canto itself has it in 俾錢",
    "百分百": "分 is fan1 in the percentage sense, as in 百分比",
    "間房": "間 here is the measure word gaan1, not the 'between' sense",
    "打字": "CC-Canto has a stray double space in this entry; the reading agrees",
    "請假": "請 is cing2 throughout this file; ceng2 is the colloquial variant",
    "巴士站": "士 is si2 in 巴士, which is how CC-Canto reads 巴士 itself",
    "為咗": "wai6 is the 'for the sake of' reading; wai4 is 'to do'"
  };
  const fresh = differ.filter(d => !REVIEWED[d.word]);
  const seen = differ.filter(d => REVIEWED[d.word]);
  console.log(`  ${seen.length} differ for reasons already reviewed (see REVIEWED in this file)`);
  if (fresh.length) {
    bad(`${fresh.length} unreviewed divergence(s)`,
        'each is either a tone change to record in REVIEWED, or a mistake');
    fresh.forEach(d => note(d.line));
  } else {
    console.log('  ✓ no unreviewed divergences');
  }
  const stale = Object.keys(REVIEWED).filter(w => !differ.some(d => d.word === w));
  if (stale.length) note(`REVIEWED lists ${stale.length} word(s) that no longer differ: ${stale.join(' ')}`);
}

console.log('\nthe simplified cross-reference');
{
  /* Generated by tools/fetch-simplified.mjs. This is here so that hand-editing
     it, which is what went wrong the first time, cannot survive a check run. */
  const self = Object.entries(SIMPLIFIED).filter(([t, s]) => t === s);
  self.length ? bad('no character is its own simplified form', self.map(x => x[0]).join(' '))
              : console.log('  ✓ no character is listed as its own simplified form');
  const stray = Object.keys(SIMPLIFIED).filter(c => !CHAR_INDEX[c]);
  stray.length ? bad('every entry is a taught character', stray.join(' '))
               : console.log(`  ✓ all ${Object.keys(SIMPLIFIED).length} entries are taught characters`);
  const outside = Object.values(SIMPLIFIED).filter(c => c.codePointAt(0) > 0xFFFF);
  outside.length ? bad('every form is drawable', outside.join(' '))
                 : console.log('  ✓ every form is inside the BMP, so a phone can draw it');
}

console.log('\nthe quest');
{
  const printed = new Set();
  MENU.sections.forEach(s => s.items.forEach(i => cjk(i[0]).forEach(c => printed.add(c))));
  const taught = [...printed].filter(c => CHAR_INDEX[c]);
  console.log(`  ✓ the menu prints ${printed.size} distinct characters, ${taught.length} of them taught`);
  const badLen = [];
  MENU.sections.forEach(s => s.items.forEach(i => {
    if (units(i[0]) !== syls(i[1]).length) badLen.push(`${i[0]} vs ${i[1]}`);
    if (i[4] && units(i[4][0]) !== syls(i[4][1]).length) badLen.push(`${i[4][0]} vs ${i[4][1]}`);
  }));
  MENU.phrases.forEach(p => { if (units(p[0]) !== syls(p[1]).length) badLen.push(`${p[0]} vs ${p[1]}`); });
  badLen.length ? bad('menu jyutping lines up', badLen.join(' | ')) : console.log('  ✓ every line of the menu lines up');
}

console.log('\nthe word of the week');
{
  const badLen = [];
  const check = (w, where) => { if (units(w[0]) !== syls(w[1]).length) badLen.push(`${where}: ${w[0]} vs ${w[1]}`); };
  Object.entries(INTERESTS).forEach(([k, c]) => c.words.forEach(w => check(w, k)));
  FESTIVALS.forEach(f => f.words.forEach(w => check(w, f.key)));
  badLen.length ? bad('jyutping lines up', badLen.join(' | ')) : console.log('  ✓ every interest and festival word lines up');
}

console.log(fails ? `\nFAILED — ${fails} check(s), ${notes} note(s) to read\n`
                  : `\nall checks passed — ${notes} note(s) to read\n`);
process.exit(fails ? 1 : 0);
