/* An audit of the stroke data, beyond "does it match upstream".

   tools/check-strokes.mjs already compares js/strokes.js byte-for-byte with
   Make Me a Hanzi's graphics.txt, which settles stroke ORDER: the order is the
   array order, and the array is upstream's. That check cannot see the things
   that go wrong *around* the data, which is what this one looks for:

     1. coverage — every character the app offers to teach writing for
     2. the right GLYPH — a traditional character must not be carrying the
        simplified form's strokes, which would silently teach the wrong hand
     3. stroke COUNTS we state in prose (RADICALS[].strokes) against the data
     4. structural sanity — one median per stroke, points inside the viewbox,
        no zero-length strokes
     5. the 部件 claims in the curriculum against Make Me a Hanzi's own
        decomposition, as a second opinion on tools/check-components.mjs

   Run: node tools/audit-strokes.mjs            */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';

const here = p => fileURLToPath(new URL(p, import.meta.url));
const root = fileURLToPath(new URL('../', import.meta.url));

const { HQ, RADICALS, SIMPLIFIED } =
  new Function(readFileSync(root + 'js/data.js', 'utf8') + '\nreturn {HQ,RADICALS,SIMPLIFIED};')();
const win = {};
new Function('window', readFileSync(root + 'js/strokes.js', 'utf8'))(win);
try { new Function('window', readFileSync(root + 'js/strokes-made.js', 'utf8'))(win); } catch { /* not built */ }
const upstreamBundle = win.STROKE_DATA;
const composed = win.STROKE_COMPOSED || {};
const madeList = win.STROKE_MADE || [];
/* the app merges these at load; the audit has to see the same thing it does */
const bundle = Object.assign({}, upstreamBundle, composed);

/* Make Me a Hanzi's dictionary: decomposition, radical, and the character's
   own identity. Same corpus the graphics come from, so a disagreement between
   them would itself be news. */
const mmah = new Map();
if (existsSync(here('.mmah-dictionary.txt'))) {
  for (const line of readFileSync(here('.mmah-dictionary.txt'), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    mmah.set(o.character, o);
  }
}

/* Unihan's variant table, for the traditional/simplified question. */
const simplifiedOf = new Map(), traditionalOf = new Map();
if (existsSync(here('.unihan-variants.txt'))) {
  for (const line of readFileSync(here('.unihan-variants.txt'), 'utf8').split('\n')) {
    if (!line.startsWith('U+')) continue;
    const [cp, field, rest] = line.split('\t');
    const ch = String.fromCodePoint(parseInt(cp.slice(2), 16));
    const targets = (rest || '').trim().split(/\s+/)
      .filter(t => t.startsWith('U+'))
      .map(t => String.fromCodePoint(parseInt(t.slice(2), 16)));
    if (!targets.length) continue;
    if (field === 'kSimplifiedVariant') simplifiedOf.set(ch, targets);
    if (field === 'kTraditionalVariant') traditionalOf.set(ch, targets);
  }
}

let notes = 0, problems = 0;
const say = (lvl, msg) => { console.log(`  ${lvl === 'x' ? '✗' : lvl === '!' ? '·' : '✓'} ${msg}`); };
const bad = msg => { problems++; say('x', msg); };
const note = msg => { notes++; say('!', msg); };

/* ---------- 1. coverage ---------- */
console.log('\ncoverage');
const missing = HQ.filter(c => !bundle[c.c]).map(c => c.c);
if (madeList.length) say('.', `${madeList.length} composed from parts: ${madeList.join(' ')}`);
const have = HQ.length - missing.length;
say('.', `${have} of ${HQ.length} characters carry stroke data`);
if (missing.length) {
  note(`${missing.length} without: ${missing.join(' ')}`);
  /* they are only acceptable if upstream genuinely has nothing */
  const upstreamHas = missing.filter(c => mmah.has(c));
  if (upstreamHas.length) bad(`but Make Me a Hanzi HAS these: ${upstreamHas.join(' ')} — the bundle is short, not the source`);
  else say('.', 'and Make Me a Hanzi has none of them either — a real gap, not a bundling miss');
}

/* ---------- 2. the right glyph ---------- */
console.log('\ntraditional forms');
let wrongForm = 0;
for (const ch of HQ) {
  if (!bundle[ch.c]) continue;
  /* If this character is itself the simplification of something else, the app
     is teaching a simplified glyph while claiming to teach traditional. */
  const trad = traditionalOf.get(ch.c);
  if (trad && !trad.includes(ch.c)) {
    /* 了, 个 and friends are their own traditional form too; Unihan lists a
       traditional variant only when they genuinely differ */
    bad(`${ch.c} is a simplified form; traditional is ${trad.join(' ')}`);
    wrongForm++;
  }
}
if (!wrongForm) say('.', 'no character in the curriculum is a simplified form wearing a traditional label');
/* and the SIMPLIFIED cross-reference should agree with Unihan */
let simpDrift = 0;
for (const [trad, simp] of Object.entries(SIMPLIFIED || {})) {
  const u = simplifiedOf.get(trad);
  if (!u) { note(`${trad} → ${simp}: Unihan lists no simplified variant`); continue; }
  if (!u.includes(simp)) { bad(`${trad} → ${simp}, but Unihan says ${u.join(' ')}`); simpDrift++; }
}
if (!simpDrift) say('.', `all ${Object.keys(SIMPLIFIED || {}).length} simplified cross-references agree with Unihan`);

/* Make Me a Hanzi's decomposition is a prefix expression — ⿱艹⿱人木 — and its
   `matches` array says which top-level part each stroke belongs to. Together
   they give the stroke count of a component that has no glyph entry of its
   own, which is exactly the case for the left-edge radical forms: 氵, 艹, 釒
   and 糹 are not characters and are not in the graphics file. */
const IDC = /[\u2FF0-\u2FFB]/;
function topParts(decomp) {
  const chars = [...decomp];
  let i = 0;
  const read = () => {
    const c = chars[i++];
    if (c === undefined) return null;
    if (IDC.test(c)) {
      const n = (c === '\u2FF2' || c === '\u2FF3') ? 3 : 2;   /* ⿲ and ⿳ take three */
      const kids = [];
      for (let k = 0; k < n; k++) kids.push(read());
      return { kids };
    }
    return { leaf: c };
  };
  const root = read();
  return root && root.kids ? root.kids : root ? [root] : [];
}
/* how many strokes the component `form` takes, learned from any character
   built out of it */
function strokesOfForm(form) {
  for (const [c, d] of mmah) {
    if (!d.decomposition || !d.matches || !bundle[c]) continue;
    const parts = topParts(d.decomposition);
    const idx = parts.findIndex(p => p.leaf === form);
    if (idx < 0) continue;
    const n = d.matches.filter(m => Array.isArray(m) && m[0] === idx).length;
    if (n) return { n, from: c };
  }
  return null;
}

/* ---------- 3. stroke counts stated in prose ---------- */
console.log('\nstated stroke counts');
let countWrong = 0;
for (const [key, r] of Object.entries(RADICALS)) {
  /* Count the form the card actually prints. 水 is four strokes and 氵 is
     three; the card shows 氵 and says three, and checking that against the
     dictionary key 水 is how a correct entry gets reported as a bug. */
  const form = r.form || key;
  let n = bundle[form] ? bundle[form].strokes.length : null;
  let via = n !== null ? 'the glyph itself' : null;
  if (n === null) {
    const derived = strokesOfForm(form);
    if (derived) { n = derived.n; via = `its strokes in ${derived.from}`; }
  }
  if (n === null) { note(`${key} (${r.name}): nothing to check "${r.strokes} strokes" against`); continue; }
  if (n !== r.strokes) {
    bad(`${key} (${r.name}) prints ${form} and says ${r.strokes} strokes; ${via} says ${n}`);
    countWrong++;
  }
}
if (!countWrong) say('.', `every RADICALS stroke count matches the form the card prints`);

/* ---------- 4. structural sanity ---------- */
console.log('\nstructure');
let structural = 0;
for (const ch of HQ) {
  const g = bundle[ch.c];
  if (!g) continue;
  if (!Array.isArray(g.strokes) || !g.strokes.length) { bad(`${ch.c}: no strokes array`); structural++; continue; }
  if (!Array.isArray(g.medians) || g.medians.length !== g.strokes.length) {
    bad(`${ch.c}: ${g.strokes.length} strokes but ${g.medians ? g.medians.length : 0} medians`); structural++; continue;
  }
  g.medians.forEach((m, i) => {
    if (!m.length) { bad(`${ch.c} stroke ${i + 1}: empty median`); structural++; return; }
    /* Make Me a Hanzi draws in a 1024-unit box with a 124-unit descender */
    const out = m.filter(([x, y]) => x < -200 || x > 1224 || y < -324 || y > 1124);
    if (out.length) { bad(`${ch.c} stroke ${i + 1}: ${out.length} median point(s) outside the glyph box`); structural++; }
  });
  if (g.strokes.some(s => typeof s !== 'string' || s.length < 8)) {
    bad(`${ch.c}: a stroke path is empty or truncated`); structural++;
  }
}
if (!structural) say('.', `every glyph has one median per stroke, inside the box, with a real path`);

/* ---------- 4b. the composed glyphs ---------- */
if (madeList.length) {
  console.log('\ncomposed glyphs');
  let bad4 = 0;
  /* nothing generated may quietly shadow something upstream actually has */
  const shadow = madeList.filter(c => upstreamBundle[c]);
  if (shadow.length) { bad(`generated over real upstream data: ${shadow.join(' ')}`); bad4++; }
  /* a composed glyph is only ever the strokes of its parts, in order, so its
     count must equal the sum of the parts it was built from */
  const RECIPE = { "哋": ["口", "地"], "喺": ["口", "係"], "嚟": ["口", "黎"], "嗰": ["口", "個"],
                   "咗": ["口", "左"], "喎": ["口", "咼"] };
  for (const [c, parts] of Object.entries(RECIPE)) {
    if (!composed[c]) continue;
    const want = parts.reduce((a, p) => a + (upstreamBundle[p] ? upstreamBundle[p].strokes.length : 0), 0);
    if (composed[c].strokes.length !== want) {
      bad(`${c} has ${composed[c].strokes.length} strokes; ${parts.join(' + ')} is ${want}`); bad4++;
    }
  }
  if (composed["佢"] && composed["佢"].strokes.length !== 2 + (upstreamBundle["巨"]?.strokes.length || 0)) {
    bad(`佢 is not 亻(2) + 巨(${upstreamBundle["巨"]?.strokes.length})`); bad4++;
  }
  if (composed["冇"] && composed["冇"].strokes.length !== (upstreamBundle["有"]?.strokes.length || 0) - 2) {
    bad(`冇 should be 有 less its two inner strokes`); bad4++;
  }
  /* and it has to sit inside the glyph box, or it draws off the square */
  for (const [c, g] of Object.entries(composed)) {
    const all = g.medians.flat();
    const out = all.filter(([x, y]) => x < -120 || x > 1140 || y < -160 || y > 1100);
    if (out.length) { bad(`${c}: ${out.length} point(s) outside the box`); bad4++; }
  }
  if (!bad4) say('.', `every composed glyph is its parts' strokes, in order, inside the box`);
}

/* ---------- 5. components, second opinion ---------- */
console.log('\ncomponents, against Make Me a Hanzi');
let compNotes = 0;
for (const ch of HQ) {
  const d = mmah.get(ch.c);
  if (!d || !ch.comp || !ch.comp.length) continue;
  /* One level is not enough: 謝 decomposes to ⿰言射 and the 身 it claims is
     inside 射. But expansion has to ADD, not replace — Make Me a Hanzi bottoms
     out in ？ for anything unanalysable, so substituting 言 for its own
     decomposition deletes the 言 the claim is about. Replacing turned 8 honest
     notes into 104 useless ones. */
  const expand = (t, depth) => {
    let out = t;
    for (let d = 0; d < depth; d++) {
      let next = out;
      for (const c of [...out]) {
        const sub = mmah.get(c);
        if (sub && sub.decomposition && sub.decomposition !== c) next += sub.decomposition;
      }
      if (next === out) break;
      out = next;
    }
    return out;
  };
  const decomp = expand(d.decomposition || '', 2);
  const unseen = ch.comp.filter(k => !decomp.includes(k));
  if (unseen.length) {
    /* variants are the usual reason: 亻 in the decomposition, 人 in the claim */
    const VARIANT = { "人": "亻𠆢", "水": "氵氺", "火": "灬", "心": "忄㣺⺗", "手": "扌",
                      "言": "訁讠", "食": "飠饣", "艸": "艹", "辵": "辶⻌", "犬": "犭",
                      "玉": "王𤣩", "示": "礻", "衣": "衤", "肉": "月⺼", "刀": "刂⺈",
                      "金": "釒钅", "糸": "糹纟", "八": "丷龸", "攴": "攵", "阜": "阝⻖",
                      "竹": "⺮𥫗", "小": "⺌⺍", "网": "罒", "爪": "爫⺤", "土": "龶",
                      "卜": "⺊" };
    const still = unseen.filter(k =>
      !(VARIANT[k] && [...VARIANT[k]].some(v => decomp.includes(v))));
    if (still.length) { note(`${ch.c}: claims ${still.join(' ')}, decomposition is ${decomp}`); compNotes++; }
  }
}
if (!compNotes) say('.', 'every 部件 claim appears in the upstream decomposition');

console.log(`\n${problems ? `${problems} problem(s)` : 'no problems'}${notes ? `, ${notes} note(s) to read` : ''}.`);
process.exit(problems ? 1 : 0);
