/* Regenerate the EXTRA_GLOSS block at the foot of js/data.js.

   Every Chinese character on screen is hoverable, and the tooltip used to come
   only from the curriculum — so the 224 characters that appear in menus,
   example words, sentences and the word of the week without being taught had
   no tooltip at all. On the cha chaan teng menu that is most of it: 44 distinct
   characters printed, 13 of them taught. Hovering 菠蘿包 and being told nothing
   is worse than not being able to hover it, because it looks broken.

   These are reference glosses, not teaching material. They carry a reading and
   a short sense and nothing else: no mnemonic, no etymology, no drills, and
   they never enter the curriculum, the review queue or any count. What they do
   is answer "what is that one?" for a character you can see but have not been
   taught.

   Readings come from Unihan, which is authoritative for a character in
   isolation. Senses come from CC-Canto, whose single-character glosses are
   uneven — so they are trimmed hard and the entry matching Unihan's reading is
   preferred over the others.

   Run:  node tools/fetch-glosses.mjs
*/

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { UNIHAN, UNIHAN_DEF, cantoOf } from './jyut.mjs';

const file = fileURLToPath(new URL('../js/data.js', import.meta.url));
const src = readFileSync(file, 'utf8');
const { HQ, CHAR_INDEX, MENU, INTERESTS, FESTIVALS } =
  new Function(src + '\nreturn {HQ,CHAR_INDEX,MENU,INTERESTS,FESTIVALS};')();

/* Everything the app can put on screen as a hoverable glyph. */
const want = new Set();
const add = s => [...String(s || '')].forEach(c => { if (/[\u4e00-\u9fff]/.test(c)) want.add(c); });
add(MENU.title); add(MENU.name);
MENU.sections.forEach(s => { add(s.head); s.items.forEach(i => { add(i[0]); if (i[4]) add(i[4][0]); }); });
MENU.phrases.forEach(p => add(p[0]));
add(MENU.specials.head); MENU.specials.items.forEach(i => add(i[0])); add(MENU.specials.note[0]);
Object.values(INTERESTS).forEach(c => c.words.forEach(w => add(w[0])));
FESTIVALS.forEach(f => f.words.forEach(w => add(w[0])));
HQ.forEach(ch => { ch.words.forEach(w => add(w[0])); add(ch.sent[0]); ch.comp.forEach(add); });

/* The interface is written in Chinese too — 加練, 每週一詞, 錯字本, every drill
   label — and those characters are hoverable like any other. Scanning the source
   rather than listing them by hand means a heading added later is covered
   without anybody remembering to come back here. */
['../js/app.js', '../js/sprint.js', '../index.html'].forEach(f =>
  add(readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8')));

/* A dictionary entry is not a tooltip. Both sources write for lexicographers:
   CC-Canto numbers its senses and CC-CEDICT appends measure words and Mandarin
   cross-references, so 雞 arrives as "fowl; chicken M: 隻zhī [隻]" and 錢 leads
   with "a surname". All of that is noise at hover size, and the surname sense
   in particular is almost never the one being asked about. */
const tidy = g => g
  .replace(/\s*\(Cantonese\)\s*/g, ' ')
  .replace(/\s*\d+\s*[.、)]\s*/g, ' ')                    /* "1. grill, 2. barbeque" */
  .replace(/\s*KangXi radical.*$/i, '')
  .replace(/^\((?:noun|verb|adjective|adverb|pronoun|measure word|particle|classifier)\)\s*/i, '')
  .replace(/\s*M:\s*.*$/, '')                            /* measure-word notes */
  .replace(/\s*CL:\s*.*$/, '')
  .replace(/\s*Mandarin equivalent.*$/i, '')
  .replace(/\s*see also.*$/i, '')
  .replace(/\s*\[[^\]]*\]\s*/g, ' ')                     /* "zhī [隻]" */
  .replace(/\s*#.*$/, '')
  .replace(/\s{2,}/g, ' ')
  .trim();

const dull = g => !g || g.length > 42
  || /^(a |the )?surname$/i.test(g)
  || /^(variant|used in|abbr)/i.test(g)
  || /[\u4e00-\u9fff]/.test(g);                          /* a gloss in Chinese explains nothing */

function senseFor(c, reading) {
  const hits = cantoOf(c);
  if (!hits.length) return null;
  const ranked = [...hits].sort((a, b) => (b.jyut === reading) - (a.jyut === reading));
  for (const h of ranked) {
    const senses = h.gloss.split('/').map(tidy).filter(g => !dull(g));
    if (senses.length) return senses.slice(0, 2).join('; ').slice(0, 56);
  }
  /* nothing but surnames and variants — fall through to Unihan */
  return null;
}

/* Unihan's gloss, trimmed to the first couple of senses.

   This is the first choice, not the fallback. CC-Canto's single-character
   entries lean hard toward the Cantonese-specific colloquial sense, which is
   exactly wrong for a reference gloss: it returned 牛 as "stubborn and
   unreasonable" and 腩 as "potbelly", when the characters on the menu mean cow
   and brisket. Unihan gives the core sense, tersely and consistently. */
function unihanSense(c) {
  const d = UNIHAN_DEF[c];
  if (!d) return null;
  const senses = d.split(/[;,]/).map(tidy).filter(g => !dull(g));
  return senses.length ? senses.slice(0, 2).join('; ').slice(0, 56) : null;
}

const out = {};
const noReading = [], noSense = [];
for (const c of [...want].filter(c => !CHAR_INDEX[c])) {
  const p = UNIHAN[c];
  if (!p) { noReading.push(c); continue; }
  const m = unihanSense(c) || senseFor(c, p);
  if (!m) { noSense.push(c); continue; }
  out[c] = [p, m];
}

const pairs = Object.entries(out).sort((a, b) => a[0].localeCompare(b[0]))
  .map(([c, [p, m]]) => `"${c}":["${p}","${m.replace(/["\\]/g, '')}"]`);
const block = `/* ---------- reference glosses ----------
   Generated by tools/fetch-glosses.mjs from Unihan and CC-Canto. Do not
   hand-edit. These characters appear on screen — in menus, example words,
   sentences, the word of the week — without being taught, and this is what
   their hover tooltip says. They are never drilled, counted or scheduled.
   ${pairs.length} of them. */
const EXTRA_GLOSS = {${pairs.join(',')}};
`;

const marked = /\/\* ---------- reference glosses ----------[\s\S]*?\nconst EXTRA_GLOSS = \{[^}]*\};\n/;
writeFileSync(file, marked.test(src) ? src.replace(marked, block) : src + '\n' + block);
console.log(`${pairs.length} reference glosses written`);
if (noReading.length) console.log(`no Unihan reading: ${noReading.join(' ')}`);
if (noSense.length) console.log(`no usable CC-Canto sense (${noSense.length}): ${noSense.join(' ')}`);
