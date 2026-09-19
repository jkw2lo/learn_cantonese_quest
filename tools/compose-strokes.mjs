/* Build stroke data for the characters Make Me a Hanzi has never heard of.

   Ten characters in this curriculum have no upstream graphics, and all ten are
   Cantonese-only: 佢 哋 冇 喺 嚟 嗰 攰 咗 喎 啱. They were invented for writing
   Cantonese and the fonts the data is built from predate anyone typesetting
   it. In the app they showed as a static glyph in a different typeface with
   the 筆順 and 默寫 buttons hidden — which is worse than it needs to be,
   because eight of the ten are ordinary compounds of parts that DO have data.

   The composition is measured, not guessed. This app already teaches ten real
   口+X characters with upstream data — 嘅 咩 呀 啦 喇 囉 嘢 叫 — so the frame
   the mouth radical sits in, and the frame its partner sits in, are read off
   those and averaged. The generated glyph is then the real 口 strokes and the
   real partner strokes, each mapped into the frame the font itself uses.

   What comes out is an approximation of the shape and an exact account of the
   stroke ORDER and COUNT, which is what the writing drills are for. Output is
   js/strokes-made.js, kept separate so tools/check-strokes.mjs can go on
   comparing js/strokes.js byte-for-byte with upstream.

   Run: node tools/compose-strokes.mjs */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('../', import.meta.url));
const win = {};
new Function('window', readFileSync(root + 'js/strokes.js', 'utf8'))(win);
const D = win.STROKE_DATA;

/* ---------- geometry ---------- */

const bbox = medians => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const m of medians) for (const [x, y] of m) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
};

/* the affine that carries box `from` onto box `to` */
const fit = (from, to) => {
  const sx = (to[2] - to[0]) / (from[2] - from[0] || 1);
  const sy = (to[3] - to[1]) / (from[3] - from[1] || 1);
  return { sx, sy, tx: to[0] - from[0] * sx, ty: to[1] - from[1] * sy };
};
const ap = (t, x, y) => [x * t.sx + t.tx, y * t.sy + t.ty];

/* Paths use M L Q C Z with absolute coordinates and nothing else — checked
   across the whole bundle — so transforming one is transforming its numbers
   in pairs. */
function movePath(d, t) {
  const out = [];
  const tok = d.match(/[MLQCZ]|-?\d+(?:\.\d+)?/gi) || [];
  let i = 0;
  while (i < tok.length) {
    const c = tok[i++];
    if (!/[MLQCZ]/i.test(c)) continue;
    out.push(c);
    const n = { M: 2, L: 2, Q: 4, C: 6, Z: 0 }[c.toUpperCase()];
    for (let k = 0; k < n; k += 2) {
      const [x, y] = ap(t, +tok[i++], +tok[i++]);
      out.push(round(x), round(y));
    }
  }
  return out.join(' ');
}
const round = n => Math.round(n * 10) / 10;
const moveMedians = (ms, t) => ms.map(m => m.map(([x, y]) => ap(t, x, y).map(v => Math.round(v))));

/* ---------- read the frames off the font's own compounds ---------- */

/* A radical gets its own frame, because they are not the same shape.

   The first version measured one left box from the 口 compounds and used it
   for everything, which squashed 亻 — tall and narrow — into the mouth's
   squat box, and 佢 came out as a bare 巨 with a smear beside it. Each family
   is measured from its own donors.

   叫 is left out of the 口 set: its mouth is unusually wide. 呢 and 問 are
   left out because their right parts wrap round the mouth rather than sitting
   beside it, so the two boxes overlap and would drag the average sideways. */
const FAMILY = {
  "口": { n: 3, donors: ["嘅", "咩", "呀", "啦", "喇", "囉", "嘢"] },
  "亻": { n: 2, donors: ["你", "係", "仔", "住", "做", "個", "仲"] }
};

const mean = rows => [0, 1, 2, 3].map(i => rows.reduce((a, r) => a + r[i], 0) / rows.length);

function framesFor(key) {
  const f = FAMILY[key];
  const L = [], R = [];
  for (const d of f.donors) {
    if (!D[d] || D[d].medians.length <= f.n) continue;
    L.push(bbox(D[d].medians.slice(0, f.n)));
    R.push(bbox(D[d].medians.slice(f.n)));
  }
  if (!L.length) throw new Error(`no donors with data for ${key}`);
  return { left: mean(L), right: mean(R), n: L.length };
}

/* ---------- the recipes ---------- */

/* Left-right compounds: the left part written first, then the right, which is
   the order these are actually written in. */
const COMPOUND = [
  { c: "哋", fam: "口", left: "口", right: "地" },
  { c: "喺", fam: "口", left: "口", right: "係" },
  { c: "嚟", fam: "口", left: "口", right: "黎" },
  { c: "嗰", fam: "口", left: "口", right: "個" },
  { c: "咗", fam: "口", left: "口", right: "左" },
  { c: "喎", fam: "口", left: "口", right: "咼" },
  { c: "啲", fam: "口", left: "口", right: "的" },
  /* 亻 is not a character and has no entry of its own, so it is lifted from
     你 — whose first two strokes are exactly that radical. */
  { c: "佢", fam: "亻", left: { from: "你", take: [0, 2] }, right: "巨" }
];

/* 冇 is not a compound. It is 有 with the two short strokes inside the 月
   removed — which is what the character's own etymology says, and strokes 5
   and 6 of 有 are exactly those two. */
const CARVED = [{ c: "冇", from: "有", drop: [4, 5] }];

/* ---------- build ---------- */

const made = {};
const frameNote = [];
const notes = [];

const partOf = spec => {
  if (typeof spec === "string") return D[spec] && { strokes: D[spec].strokes, medians: D[spec].medians };
  const src = D[spec.from];
  if (!src) return null;
  return { strokes: src.strokes.slice(...spec.take), medians: src.medians.slice(...spec.take) };
};

for (const r of COMPOUND) {
  const a = partOf(r.left), b = partOf(r.right);
  if (!a || !b) { notes.push(`${r.c}: missing a part`); continue; }
  const frames = framesFor(r.fam);
  if (!frameNote.includes(r.fam)) {
    frameNote.push(r.fam);
    console.log(`${r.fam} frame from ${frames.n} donors:` +
      ` left ${frames.left.map(Math.round).join(',')} right ${frames.right.map(Math.round).join(',')}`);
  }
  const ta = fit(bbox(a.medians), frames.left);
  const tb = fit(bbox(b.medians), frames.right);
  made[r.c] = {
    strokes: [...a.strokes.map(s => movePath(s, ta)), ...b.strokes.map(s => movePath(s, tb))],
    medians: [...moveMedians(a.medians, ta), ...moveMedians(b.medians, tb)]
  };
}

for (const r of CARVED) {
  const src = D[r.from];
  if (!src) { notes.push(`${r.c}: ${r.from} has no data`); continue; }
  const keep = i => !r.drop.includes(i);
  made[r.c] = {
    strokes: src.strokes.filter((_, i) => keep(i)),
    medians: src.medians.filter((_, i) => keep(i))
  };
}

const body = Object.entries(made)
  .map(([c, g]) => `  ${JSON.stringify(c)}: ${JSON.stringify(g)}`).join(',\n');

writeFileSync(root + 'js/strokes-made.js',
`/* GENERATED by tools/compose-strokes.mjs — do not edit by hand.

   Stroke data for the Cantonese-only characters Make Me a Hanzi has no entry
   for, composed from the real strokes of their parts. The frames the parts are
   fitted into were measured, per radical, from this library's own compounds
   that DO have upstream data — so the proportions are the font's own rather
   than a guess, and 亻 gets a tall narrow column while 口 gets a squat one.

   These are approximations of the SHAPE. The stroke count and stroke ORDER
   are exact, which is what the writing drills check. Anything listed in
   STROKE_MADE is labelled as generated wherever it is drawn. */
window.STROKE_MADE = ${JSON.stringify(Object.keys(made))};
window.STROKE_COMPOSED = {
${body}
};
`);

console.log(`generated ${Object.keys(made).length}: ${Object.keys(made).join(' ')}`);
for (const n of notes) console.log('  · ' + n);
const missing = ["佢","哋","冇","喺","嚟","嗰","攰","咗","喎","啱"].filter(c => !made[c]);
console.log(`still without: ${missing.join(' ') || 'none'}`);
