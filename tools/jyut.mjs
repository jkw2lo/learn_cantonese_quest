/* Look a character or word up in the reference data, while writing js/data.js.

   Two sources, both cached beside this file (see tools/.gitignore):
   Unihan's kCantonese field, which is one preferred jyutping reading for every
   CJK character, and CC-Canto, which is where the Cantonese-only vocabulary
   lives. Unihan is authoritative for a character in isolation and says nothing
   about which sense you meant; CC-Canto knows senses and is noisier.

   Run:  node tools/jyut.mjs 睇 食飯 佢哋
*/

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const here = p => fileURLToPath(new URL(p, import.meta.url));

const unihanFields = (() => {
  const reading = {}, define = {};
  for (const line of readFileSync(here('.unihan-cantonese.txt'), 'utf8').split('\n')) {
    if (!line.startsWith('U+')) continue;
    const [cp, field, ...rest] = line.split('\t');
    const ch = String.fromCodePoint(parseInt(cp.slice(2), 16));
    if (field === 'kCantonese') reading[ch] = rest.join('\t').trim();
    if (field === 'kDefinition') define[ch] = rest.join('\t').trim();
  }
  return { reading, define };
})();

export const UNIHAN = unihanFields.reading;

/* Unihan's own English gloss. Terse, consistent and present for essentially
   every character — which CC-Canto is not: a third of the characters this app
   prints have a CC-Canto entry carrying a reading and no definition at all. */
export const UNIHAN_DEF = unihanFields.define;

/* traditional simplified [pinyin] {jyutping} /gloss/gloss/ */
const LINE = /^(\S+) (\S+) \[([^\]]*)\] \{([^}]*)\}\s*(?:\/(.*)\/)?/;

export const CANTO = (() => {
  const m = new Map();
  for (const f of ['.cccanto.txt', '.cccanto-readings.txt']) {
    for (const line of readFileSync(here(f), 'utf8').split('\n')) {
      if (line.startsWith('#') || !line.trim()) continue;
      const hit = LINE.exec(line);
      if (!hit) continue;
      const [, trad, simp, pin, jyut, gloss] = hit;
      if (!m.has(trad)) m.set(trad, []);
      m.get(trad).push({ trad, simp, pin, jyut: jyut.trim(), gloss: (gloss || '').trim() });
    }
  }
  return m;
})();

export const unihanOf = c => UNIHAN[c] || null;
export const cantoOf = w => CANTO.get(w) || [];

/* What CC-Canto thinks a whole word sounds like, or the per-character readings
   strung together when it has never heard of the word. The second is a guess
   and is labelled as one — Cantonese words are not always the sum of their
   characters. */
export function wordJyut(w) {
  const hit = cantoOf(w);
  if (hit.length) return { jyut: hit[0].jyut, from: 'cc-canto', all: [...new Set(hit.map(h => h.jyut))] };
  return { jyut: [...w].map(c => UNIHAN[c] || '?').join(' '), from: 'unihan (per character — check it)' };
}

if (process.argv[1] === here('jyut.mjs')) {
  const args = process.argv.slice(2);
  if (!args.length) { console.log('usage: node tools/jyut.mjs 睇 食飯'); process.exit(0); }
  for (const a of args) {
    console.log(`\n== ${a}`);
    if ([...a].length === 1) {
      console.log(`  unihan: ${unihanOf(a) || '— none'}`);
    } else {
      const w = wordJyut(a);
      console.log(`  ${w.jyut}   [${w.from}]`);
      if (w.all && w.all.length > 1) console.log(`  other readings: ${w.all.slice(1).join(' / ')}`);
    }
    const hits = cantoOf(a).slice(0, 6);
    hits.forEach(h => console.log(`  {${h.jyut}}  ${h.gloss.replace(/\//g, ' · ').slice(0, 110)}`));
    if (!hits.length && [...a].length > 1) console.log('  (not in CC-Canto)');
  }
  console.log('');
}
