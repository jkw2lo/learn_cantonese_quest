/* ============================================================
   State, scheduling and persistence.

   Progress lives in localStorage so the app works instantly and
   offline. When the page is published as an Artifact with the `db`
   capability, the same record also syncs to the viewer's private
   store so a streak survives switching devices.
   ============================================================ */

const KEY = "cantonese-quest-v1";

/* Leitner-ish intervals, in days, indexed by level. */
const INTERVALS = [1, 1, 2, 4, 8, 16, 35, 75, 150];
const MAX_LVL = INTERVALS.length - 1;

/* ---------- dates ---------- */

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return dayKey(dt);
}
function daysBetween(a, b) {
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  return Math.round((new Date(pb[0], pb[1] - 1, pb[2]) - new Date(pa[0], pa[1] - 1, pa[2])) / 864e5);
}

/* ---------- jyutping → tone ----------

   Six tones, written as a digit on the end of the syllable rather than as a
   mark over a vowel. That is the whole difference from pinyin, and it makes
   everything downstream easier: jyutping is plain ASCII, so it sorts, it
   searches, and it can be typed on any keyboard without a compose key.

   There is no neutral tone. Every Cantonese syllable carries one of the six,
   which is why leaving the digit off is not a shortcut but an error — and why
   tools/check-jyutping.mjs refuses a syllable without one. */

function toneOf(jyut) {
  const m = /([1-6])\s*$/.exec(String(jyut).trim());
  return m ? +m[1] : 0;          /* 0 = we were handed something malformed */
}

/* The syllable without its tone, for searching and for typing. */
const toneless = j => String(j).replace(/[1-6]/g, "");

/* ---------- state ---------- */

const blank = () => ({
  v: 1,
  chars: {},
  days: {},
  charWeeks: {},         /* week -> char -> {seen,right,wrong}, see tallyCharWeek */
  streak: { cur: 0, best: 0, last: null },
  goalNew: 5,
  quest: "menu",
  started: dayKey(),
  audio: true,
  voice: null,
  timer: true,
  tour: false,
  primer: false,
  started: false,
  level: null,          /* how much Cantonese they arrived with — see LEVELS */
  levelAsked: false,    /* whether the first session has offered placement yet */
  writeDrills: true,
  writeLeniency: 1,      /* HanziWriter's own quiz leniency, scaled — see LENIENCY_LEVELS */
  padAuto: false,
  /* how the four answers are laid out: "auto" lets the window decide, "row"
     and "grid" overrule it — see optColsEffective in app.js */
  optCols: "auto",
  demo: false,
  sprint: { marks: {}, runs: [], best: {}, pick: {} },
  spTell: true,          /* the verdict wash on a phone, see sprintTells */
  menuTaught: {},       /* the side quest's own books — see menuCanRead */
  hailed: [],           /* milestones already celebrated — see MILESTONES */
  name: "",
  interests: [],
  profiled: false,
  updated: Date.now()
});

let state = blank();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
    if (!(state.goalNew >= GOAL_MIN && state.goalNew <= GOAL_MAX)) state.goalNew = blank().goalNew;
    /* Names are capitalised on the way in now; a record written before that
       carries whatever was typed, and the greeting says it every morning. */
    if (state.name) state.name = String(state.name).trim()
      .replace(/(^|[\s\-'\u2019])(\p{L})/gu, (m, sep, first) => sep + first.toLocaleUpperCase());
  } catch { /* private mode, cleared storage — carry on with a fresh record */ }
  return state;
}

let saveTimer = null;
function save() {
  state.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushRemote, 1500);
}

/* Start again, leaving nothing behind.

   This was `Object.assign(state, blank())`, which only overwrites the keys
   blank() happens to declare — so everything the record grew afterwards
   survived the wipe: the day's menu pick (`menuPick`), the last-backup stamp,
   and whatever the next feature adds. Replacing the binding outright is the
   only version that stays correct as the shape of the record changes. The
   caller clears the practice diary, which lives in IndexedDB, separately. */
function resetProgress() {
  state = blank();
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
  save();                                /* writes the blank record, and syncs it */
  return state;
}

/* ---------- 示範 demo mode ----------

   For showing somebody the whole app without spending six weeks earning the
   right to. It opens every tier at once, so the Library lists all 300
   characters and any card can be opened — and it does nothing else. It never
   marks a character known, never grades anything, never touches the review
   queue or the streak. Turning it off puts the gate straight back where it
   was, because the gate was only ever computed from your record and the
   record has not moved.

   DEMO_BUILD is the kill switch. Set it to false and the toggle disappears
   from Settings, the banner can never appear, and unlockedCeiling stops
   consulting the flag at all — the feature is gone rather than merely off,
   which is what "fully disable for normal usage" has to mean if it is going
   to mean anything. A record that had it switched on is unaffected: the flag
   sits there ignored. */
const DEMO_BUILD = true;
const demoOn = () => DEMO_BUILD && !!state.demo;

/* ---------- merging two records of the same person ----------

   Last write wins is the right rule for a setting and the wrong rule for work.
   A morning on the phone and an afternoon on the laptop are both real; whichever
   pushed second would erase the other, and the thing erased would be the thing
   the person actually did. So preferences follow the clock and anything earned
   is unioned.

   What makes the union safe is that everything counted here only ever goes up.
   `seen`, `right`, `wrong`, `skills` and `shown` are incremented in grade() and
   reset nowhere, so max() of two counts of the same monotonic thing is the true
   count — the only way to overcount would be to record one session twice, and a
   session happens on one device.

   `lvl` and `due` are the exception, and are not counts: they are a position in
   a review queue. Maxing them would invent a schedule neither device had, so
   they come as a pair from whichever record was written later. */

const day = d => String(d || "");
const laterDay = (a, b) => (day(a) >= day(b) ? day(a) : day(b)) || null;
const earlierDay = (a, b) => (!a ? b : !b ? a : (day(a) <= day(b) ? a : b)) || null;
const bigger = (a, b) => Math.max(a || 0, b || 0);

const CH_COUNTS = ["seen", "right", "wrong"];
const CH_SKILLS = ["r", "p", "c", "w"];

function mergeChar(x, y) {
  if (!x) return y;
  if (!y) return x;
  /* the later sighting carries the schedule: the other device's queue has
     since moved on, and its lvl/due are a snapshot of a queue that no longer
     exists */
  const lead = day(y.last) >= day(x.last) ? y : x;
  const out = Object.assign({}, lead);
  CH_COUNTS.forEach(k => out[k] = bigger(x[k], y[k]));
  out.skills = {}; out.shown = {};
  CH_SKILLS.forEach(k => {
    out.skills[k] = bigger(x.skills && x.skills[k], y.skills && y.skills[k]);
    out.shown[k] = bigger(x.shown && x.shown[k], y.shown && y.shown[k]);
  });
  out.first = earlierDay(x.first, y.first);
  out.last = laterDay(x.last, y.last);
  return out;
}

/* A day's tally is counts and a set of characters revised. Both union. */
function mergeDay(x, y) {
  if (!x) return y;
  if (!y) return x;
  const out = Object.assign({}, x, y);
  /* sp/spr (sprint reps/rounds, see tallySprint) used to be missing from this
     list — they were written onto the day record but fell through to plain
     Object.assign above, last-write-wins, so a sprint logged on one device
     could vanish the moment another device's day record synced over it */
  ["new", "rev", "ahead", "extra", "sp", "spr"].forEach(k => {
    if (x[k] !== undefined || y[k] !== undefined) out[k] = bigger(x[k], y[k]);
  });
  if (x.revC || y.revC) out.revC = unionKeys(x.revC, y.revC);
  /* did (today's ticked-off tasks, see markDone) is the same shape as revC —
     a keyed flag map, not a counter — and had the same gap: one device
     finishing "read" and another finishing "menu" on the same day would
     otherwise have one completion overwrite the other instead of unioning */
  if (x.did || y.did) out.did = unionKeys(x.did, y.did);
  return out;
}

/* charWeeks is two levels of the same "counters only ever go up" shape
   mergeChar already relies on: a week merges character by character, and a
   character within a week merges field by field. Left as a plain
   Object.assign in mergeState (the way an ordinary settings field is
   merged) this would have the exact shape of the mergeDay bug above — a
   week only one device logged answers in would win or lose wholesale
   instead of unioning per character. */
function mergeCharWeek(x, y) {
  if (!x) return y;
  if (!y) return x;
  return { seen: bigger(x.seen, y.seen), right: bigger(x.right, y.right), wrong: bigger(x.wrong, y.wrong) };
}
const mergeWeek = (x, y) => mergeBy(x, y, mergeCharWeek);

/* Every key from both sides, in a fixed order.

   Sorted, and not for tidiness: the merged record is serialised to compare it
   against the local one and again to write it to the remote. Keys arriving in
   whichever order the arguments happened to be in would make two identical
   records compare as different — a repaint on every pull, and a write on every
   load. Dates sort chronologically as a bonus. */
const mergeBy = (x = {}, y = {}, f) => {
  const out = {};
  for (const k of [...new Set([...Object.keys(x), ...Object.keys(y)])].sort()) out[k] = f(x[k], y[k]);
  return out;
};
/* a plain union of two flag objects, in the same fixed order — Object.assign
   would keep whichever order the arguments arrived in */
const unionKeys = (x, y) => mergeBy(x, y, (a, b) => (b === undefined ? a : b));

/* Every mode a sprint mark can be keyed by — see js/sprint.js's SPRINT
   object, which this file cannot import (see mergeSprint's mark merge). */
const SPRINT_MODES = ["l", "r", "w", "a"];

/* x is the older record and y the newer, so the preferences in here resolve by
   the clock rather than by which way round the caller happened to pass them */
function mergeSprint(x = {}, y = {}) {
  const out = {};
  /* a mark is [right, wrong] per mode plus `s`, a rolling window of the last
     few results — the window is a recent history, so it comes from one device
     whole rather than being interleaved into a sequence that never happened */
  out.marks = mergeBy(x.marks, y.marks, (a, b) => {
    if (!a) return b;
    if (!b) return a;
    /* every sprint mode this record's marks can carry — kept as a literal
       list rather than read off SPRINT (js/sprint.js) because this file has
       to stay usable on its own, with no DOM and no sprint.js loaded, which
       is exactly the shape the smoke suite runs it in */
    const total = m => SPRINT_MODES.reduce((n, k) => n + ((m[k] || [0, 0])[0] + (m[k] || [0, 0])[1]), 0);
    const lead = total(b) >= total(a) ? b : a;
    const m = Object.assign({}, lead);
    SPRINT_MODES.forEach(k => {
      if (a[k] || b[k]) m[k] = [bigger((a[k] || [])[0], (b[k] || [])[0]),
                                bigger((a[k] || [])[1], (b[k] || [])[1])];
    });
    return m;
  });
  out.best = mergeBy(x.best, y.best, (a, b) => (!b ? a : !a ? b : (beats(a, b) ? a : b)));
  out.cleared = unionKeys(x.cleared, y.cleared);
  /* every finished sheet from both devices, newest first, deduped on the
     millisecond it was recorded */
  const seen = new Set();
  out.runs = [...(x.runs || []), ...(y.runs || [])]
    .filter(r => r && !seen.has(r.at) && seen.add(r.at))
    .sort((a, b) => (b.at || 0) - (a.at || 0))
    .slice(0, SPRINT_RUNS_KEPT);
  /* the sheet settings last chosen — a preference, so the later device's copy
     wins, which is why mergeState hands these over in clock order */
  out.pick = unionKeys(x.pick, y.pick);
  return out;
}

function mergeState(a, b) {
  if (!a) return b;
  if (!b) return a;
  const newer = (b.updated || 0) >= (a.updated || 0) ? b : a;
  const older = newer === a ? b : a;

  /* settings, name, interests, the day's menu pick: answers rather than
     accumulations, so the clock decides */
  const out = Object.assign(blank(), older, newer);

  out.chars = mergeBy(a.chars, b.chars, mergeChar);
  out.days = mergeBy(a.days, b.days, mergeDay);
  out.charWeeks = mergeBy(a.charWeeks, b.charWeeks, mergeWeek);
  out.sprint = mergeSprint(older.sprint, newer.sprint);
  out.menuTaught = unionKeys(a.menuTaught, b.menuTaught);
  out.hailed = [...new Set([...(a.hailed || []), ...(b.hailed || [])])].sort((x, y) => x - y);
  out.streak = {
    /* a best is a claim about the past and cannot be undone by the other
       device not knowing about it */
    best: bigger(a.streak && a.streak.best, b.streak && b.streak.best),
    cur: (newer.streak || {}).cur || 0,
    last: laterDay(a.streak && a.streak.last, b.streak && b.streak.last)
  };
  out.started = earlierDay(a.started, b.started);
  out.lastBackup = bigger(a.lastBackup, b.lastBackup) || null;
  out.placed = (a.placed && b.placed)
    ? (bigger(a.placed.known, b.placed.known) === (a.placed.known || 0) ? a.placed : b.placed)
    : (a.placed || b.placed || null);
  out.updated = Math.max(a.updated || 0, b.updated || 0);
  return out;
}

/* ---------- optional cross-device sync ----------

   One document per person, holding the whole record. Two providers can supply
   it and neither is required: `window.claude` when this app runs inside a
   Claude artifact, and js/sync.js when a Firebase project has been configured.
   Both hand over the same tiny shape — an object with get() and set() — so
   everything below is written once.

   With no provider at all, remoteDoc stays null, pushRemote is a no-op and the
   app is exactly the localStorage-only app it was. */

let remoteDoc = null;
let onRemoteChange = null;             /* set by app.js, so a pull can repaint */

/* Hand the record a document to sync against. Returns whether the local state
   changed as a result, so the caller knows whether to re-render. */
async function useRemote(doc) {
  remoteDoc = doc;
  if (!doc) return false;
  try {
    const snap = await doc.get();
    const remote = snap && snap.exists ? snap.data() : null;
    if (remote) {
      const merged = mergeState(state, remote);
      const changed = JSON.stringify(merged) !== JSON.stringify(state);
      state = merged;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
      /* push unconditionally: even when nothing changed locally, the remote is
         missing whatever this device knew that it didn't */
      pushRemote();
      return changed;
    }
    pushRemote();
  } catch { remoteDoc = null; }
  return false;
}

function dropRemote() { remoteDoc = null; }

async function connectRemote() {
  if (!window.claude?.use) return false;
  try {
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
    if (!db) return false;
    const uid = user ? await user.id() : null;
    return await useRemote(db.doc(`data/users/${uid || "me"}/progress`));
  } catch { remoteDoc = null; }
  return false;
}

async function pushRemote() {
  if (!remoteDoc) return;
  try { await remoteDoc.set(JSON.parse(JSON.stringify(state))); } catch { /* offline or refused */ }
}

/* ---------- per-character record ---------- */

function rec(c) {
  return state.chars[c] || null;
}
function ensure(c) {
  if (!state.chars[c]) {
    state.chars[c] = {
      lvl: 0, due: dayKey(), seen: 0, right: 0, wrong: 0,
      skills: { r: 0, p: 0, c: 0, w: 0 },  /* clean answers: recognise, pinyin, recall, write */
      shown: { r: 0, p: 0, c: 0, w: 0 },   /* times asked at all, right or wrong */
      first: dayKey(), last: dayKey()
    };
  }
  /* records written before `shown` existed */
  if (!state.chars[c].shown) state.chars[c].shown = { r: 0, p: 0, c: 0, w: 0 };
  return state.chars[c];
}

/* How many times this character has come up in this mode, however it went.
   `skills` counts only the clean answers, which is the wrong measure for
   deciding what to show next: a character you keep getting wrong would stay
   at the front of the queue forever. */
const shownIn = (c, skill) => {
  const r = rec(c);
  return (r && r.shown && r.shown[skill]) || 0;
};

const isKnown  = c => !!state.chars[c];
const isDue    = c => { const r = rec(c); return r && r.due <= dayKey(); };
function strength(c) {
  const r = rec(c);
  if (!r) return "locked";
  if (isDue(c)) return "due";
  if (r.lvl >= 5) return "strong";
  return "learning";
}

/* ---------- grading ---------- */

function grade(c, correct, skill, opts = {}) {
  const r = ensure(c);
  /* Both kinds of extra work reinforce without rescheduling. */
  const extra = opts.practice || opts.speed;
  r.seen++;
  r.last = dayKey();
  tallyCharWeek(c, correct);
  if (skill && r.shown[skill] !== undefined) r.shown[skill]++;
  if (correct) {
    r.right++;
    if (skill && r.skills[skill] !== undefined) r.skills[skill]++;
    /* Extra practice reinforces and counts toward the skill bars, but it
       doesn't push the review date out — drilling a card early shouldn't
       delay the review you actually needed. Getting it wrong still does. */
    if (!extra || r.due <= dayKey()) {
      r.lvl = Math.min(MAX_LVL, r.lvl + 1);
      r.due = addDays(dayKey(), INTERVALS[r.lvl]);
    }
  } else if (opts.speed) {
    /* A sprint. Racing produces slips that say nothing about whether you know
       the character — you knew it, you were two hundred milliseconds late
       reading the fourth option. So a miss here is recorded and counted, and
       goes into the 错字本 where it can be worked on properly, but it never
       demotes the character or drags it back into today's queue. The same
       rule as Go deeper, for the same reason: a mode you choose to do extra
       must not be able to make tomorrow worse. */
    r.wrong++;
  } else if (opts.gentle) {
    /* Handwriting. Failing to produce 学 from memory says little about
       whether you can read it, and a stroke can simply fail to register on a
       trackpad — so a miss here records the attempt and withholds the skill
       credit, but never demotes the character or drags it back to today. */
    r.wrong++;
    r.due = addDays(dayKey(), INTERVALS[r.lvl]);
  } else {
    r.wrong++;
    r.lvl = Math.max(0, r.lvl - 2);
    r.due = dayKey();            /* comes round again today */
  }
  save();
  return r;
}

function introduce(c) {
  const r = ensure(c);
  r.due = addDays(dayKey(), 1);
  save();
  return r;
}

/* ---------- daily tally and streak ---------- */

function today() {
  const k = dayKey();
  if (!state.days[k]) state.days[k] = { new: 0, rev: 0 };
  return state.days[k];
}

/* `rev` counts answers, which is the right unit for the activity heatmap — a
   day of forty reps was a bigger day than one of four. It is the wrong unit
   for "reviewed today": a character you saw four times in one session is one
   character revised, not four, and counting it four times made the number
   race ahead of the queue it was sitting next to. So the characters
   themselves are recorded alongside the rep count. */
function tally(kind, ch) {
  const t = today();
  t[kind]++;
  if (kind === "rev" && ch) (t.revC = t.revC || {})[ch] = true;
  touchStreak();
  save();
}

const reviewedToday = () => Object.keys((state.days[dayKey()] || {}).revC || {});

/* ---------- extra practice: reps, counted like reps ----------

   Today's list is a finishable checklist and closes. Go deeper is the
   opposite — unbounded, never "done", and the place where repetition actually
   happens. A checklist tick is the wrong reward for that: you want to see the
   pile grow. So extra reps are counted separately from everything else and
   never touch the day's completion. */
function tallyExtra() {
  const t = today();
  t.extra = (t.extra || 0) + 1;
  touchStreak();
  save();
}

const extraToday = () => (state.days[dayKey()] || {}).extra || 0;

/* ---------- studying ahead ----------

   "Study ahead — 5 more characters" used to do `state.goalNew += 5`, which is
   the setting, not the day. So one click on a Tuesday quietly rewrote "new
   characters a day" from 5 to 10 and left it there: Wednesday dealt ten, the
   settings stepper read 10, and clicking again made it 15. What the button
   means is "give me more today", so the extra is kept on the day and is gone
   with it. */
const aheadToday = () => (state.days[dayKey()] || {}).ahead || 0;
function studyAhead(n) {
  const t = today();
  t.ahead = (t.ahead || 0) + n;
  save();
}

/* Today's target: the standing setting, plus anything asked for on top of it
   today. This is a *target*, not a batch size — see newLeftToday(). */
const dayGoal = () => state.goalNew + aheadToday();

/* How many new characters are still owed today, and the only number allowed to
   decide how many a session deals.

   Getting this wrong is what made "Study ahead" run away even after the extra
   stopped touching the setting. nextNew(n) returns the next n characters you
   have *never seen*, so it has no idea what today already taught you: dealing
   nextNew(dayGoal()) after a finished day of five handed out ten more, not
   five. Click, finish, click, finish and the day went 5 → 15 → 30 → 50, with
   the hero counting down a different number from the one the session dealt.
   One function now answers both. */
const newLeftToday = () =>
  Math.max(0, Math.min(dayGoal(), remainingNew()) - today().new);

/* The stepper's own range. A stored goalNew outside it cannot have come from a
   person — it is wreckage from the version that did `goalNew += 5` — so it
   goes back to the default on load rather than sitting at a number nobody
   chose and the stepper cannot walk back down to. */
const GOAL_MIN = 1, GOAL_MAX = 30;

/* HanziWriter's own quiz option is a raw multiplier on averageDistanceThreshold
   (default 350; leniency 1 is that default) — not a number anyone picks by
   feel. Five named steps stand in for it in Settings; the strictness itself
   doesn't move by default, only how forgiving of a wobbly trackpad stroke it
   is willing to be. */
const LENIENCY_LEVELS = [
  { v: 0.7,  label: "Strict" },
  { v: 0.85, label: "A little stricter" },
  { v: 1,    label: "As it's always been" },
  { v: 1.3,  label: "A little more forgiving" },
  { v: 1.6,  label: "Forgiving" }
];
const extraTotal = () => Object.values(state.days).reduce((a, d) => a + (d.extra || 0), 0);
const extraBestDay = () => Object.values(state.days).reduce((a, d) => Math.max(a, d.extra || 0), 0);
const extraDays = () => Object.values(state.days).filter(d => d.extra > 0).length;

function touchStreak() {
  const k = dayKey();
  const s = state.streak;
  if (s.last === k) return;
  if (s.last && daysBetween(s.last, k) === 1) s.cur++;
  else s.cur = 1;
  s.last = k;
  if (s.cur > s.best) s.best = s.cur;
}

/* Which of today's practice tasks are ticked off. */
function markDone(id) {
  if (typeof window !== "undefined" && window.CQDIAG) CQDIAG.note("did", id);
  const t = today();
  (t.did = t.did || {})[id] = true;
  save();
}
const didToday = id => !!(state.days[dayKey()] && state.days[dayKey()].did && state.days[dayKey()].did[id]);

/* A streak only stands if you studied today or yesterday. */
function liveStreak() {
  const s = state.streak;
  if (!s.last) return 0;
  const gap = daysBetween(s.last, dayKey());
  return gap <= 1 ? s.cur : 0;
}

/* Deliberately the standing goal and not dayGoal(): asking for five more
   characters is extra credit, and extra credit cannot take back a day you had
   already finished — or the streak that came with it. */
function goalMet() {
  const t = state.days[dayKey()];
  if (!t) return false;
  return t.new + t.rev > 0 && t.new >= Math.min(state.goalNew, remainingNew()) && dueCount() === 0;
}

/* ---------- queues ---------- */

function dueList() {
  const k = dayKey();
  return Object.keys(state.chars)
    .filter(c => state.chars[c].due <= k)
    .sort((a, b) => state.chars[a].lvl - state.chars[b].lvl);
}
const dueCount = () => dueList().length;

/* New characters come in curriculum order — the order is the teaching.
   The menu side quest runs on its own daily thread and never reorders this. */
function nextNew(n) {
  const out = [];
  const ceiling = unlockedCeiling();
  for (const ch of HQ) {
    if (out.length >= n) break;
    if (ch.i >= ceiling) break;              /* the tier gate, not just an ordering */
    if (!state.chars[ch.c]) out.push(ch.c);
  }
  return out;
}
/* What is left that you're actually allowed to start on. Counting the whole
   library here would promise "study ahead" sessions the gate then refuses. */
const remainingNew = () => HQ.slice(0, unlockedCeiling()).filter(ch => !state.chars[ch.c]).length;

/* ---------- word of the week ----------

   The curriculum order is fixed and impersonal by design — you learn 的 and 是
   before anything you would have chosen, because everything else is built on
   them. This runs beside it rather than through it: one real word a week from
   whatever you said you cared about, usually made of characters well past where
   you have reached.

   It is deliberately not a drill. Nothing here is scheduled, graded, counted,
   or added to the review queue — the moment it becomes homework it stops being
   the thing that makes you want to keep going.

   The pick is stable for the whole week (an ISO week key seeds it) and won't
   repeat until everything in your chosen interests has had a turn. */

function weekKey(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);          /* to the Thursday of this week */
  const jan1 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - jan1) / 864e5 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/* A per-character-per-week tally, aggregated rather than logged event by
   event — a full per-answer history was ruled out as unbounded and not
   worth the storage, so this is the one bucket both the weekly trend chart
   and the weakness report are built from. Called from exactly one place,
   grade(), the single choke-point every drill and every sprint answer
   already funnels through — so every answer anywhere in the app lands here
   without needing a second call site. */
function tallyCharWeek(c, ok) {
  const wk = weekKey();
  const w = state.charWeeks[wk] || (state.charWeeks[wk] = {});
  const r = w[c] || (w[c] = { seen: 0, right: 0, wrong: 0 });
  r.seen++; ok ? r.right++ : r.wrong++;
}

/* The last `weeks` weeks, oldest first, every one present even with nothing
   in it — a chart with a gap where a quiet week should be reads as missing
   data, not as a quiet week. Summed across every character: this is weekly
   activity, not a per-character breakdown — that detail stays in
   charWeeks itself, for weaknessReport below. */
function charWeekTrend(weeks = 8) {
  const now = new Date();
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i * 7);
    const wk = weekKey(d);
    const vals = Object.values(state.charWeeks[wk] || {});
    out.push({
      week: wk,
      seen: vals.reduce((a, r) => a + r.seen, 0),
      right: vals.reduce((a, r) => a + r.right, 0),
      wrong: vals.reduce((a, r) => a + r.wrong, 0),
      chars: vals.length
    });
  }
  return out;
}

/* "Reads fine, writes badly" is this shape: a character attempted enough on
   at least two of the four skills for the numbers to mean something, where
   one skill's accuracy trails another's by more than a coincidence. Reuses
   state.chars[c].skills/.shown — lifetime per-skill counts the scheduler
   already keeps for its own reasons — rather than a new bucket. */
const WEAKNESS_SKILLS = ["r", "p", "c", "w"];
const WEAKNESS_MIN_SHOWN = 3;
const WEAKNESS_MIN_GAP = 0.34;

function weaknessReport(limit = 10) {
  const out = [];
  Object.keys(state.chars).forEach(c => {
    const r = state.chars[c];
    const rates = WEAKNESS_SKILLS
      .filter(k => (r.shown[k] || 0) >= WEAKNESS_MIN_SHOWN)
      .map(k => ({ skill: k, rate: r.skills[k] / r.shown[k] }));
    if (rates.length < 2) return;
    const best = rates.reduce((a, b) => (b.rate > a.rate ? b : a));
    const worst = rates.reduce((a, b) => (b.rate < a.rate ? b : a));
    const gap = best.rate - worst.rate;
    if (gap > WEAKNESS_MIN_GAP) out.push({ c, best: best.skill, worst: worst.skill, gap });
  });
  return out.sort((a, b) => b.gap - a.gap).slice(0, limit);
}

/* The Monday and Sunday bounding a date, so "is the festival this week"
   has a definite answer. */
function weekBounds(d = new Date()) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));           /* back to Monday */
  const end = new Date(t); end.setDate(end.getDate() + 6);
  return [t, end];
}

/* When a festival falls in a given year, or null if we can't say. Fixed-date
   ones are trivial; the lunar ones are tabled, and a year outside the table
   simply doesn't fire rather than guessing. */
function festivalDate(f, year) {
  if (f.on) {
    const [m, d] = f.on.split("-").map(Number);
    return new Date(year, m - 1, d);
  }
  if (f.lunar) {
    const v = f.lunar[year];
    if (!v) return null;
    const [m, d] = v.split("-").map(Number);
    return new Date(year, m - 1, d);
  }
  if (f.lunarOffset) {
    const base = FESTIVALS.find(x => x.key === f.lunarOffset.from);
    const bd = base && festivalDate(base, year);
    if (!bd) return null;
    const out = new Date(bd);
    out.setDate(out.getDate() + f.lunarOffset.days);
    return out;
  }
  return null;
}

/* Whichever festival lands inside this week. Checking the neighbouring years
   too, since the week of 30 December contains 1 January. */
function festivalThisWeek(d = new Date()) {
  const [from, to] = weekBounds(d);
  for (const f of FESTIVALS) {
    for (const y of [from.getFullYear(), to.getFullYear()]) {
      const fd = festivalDate(f, y);
      if (fd && fd >= from && fd <= to) return f;
    }
  }
  return null;
}

/* What has been shown before, ever. Festival words in particular must not
   come round again next year, so this history is never wiped — only the
   interest pool is allowed to cycle once it is exhausted. */
const wotwSeen = () => new Set(state.wotwPast || []);

function rememberWord(key) {
  state.wotwPast = [...(state.wotwPast || []), key].slice(-600);
}

function wordOfWeek(d = new Date()) {
  const wk = weekKey(d);
  const held = state.wotw;
  if (held && held.week === wk) {
    const src = held.fest ? FESTIVALS.find(f => f.key === held.fest) : INTERESTS[held.cat];
    if (src && src.words[held.i]) return held;
  }

  const seen = wotwSeen();
  let choice = null;

  /* a festival in this week wins over anything the interests would offer */
  const fest = festivalThisWeek(d);
  if (fest) {
    const fresh = fest.words.map((_, i) => i).filter(i => !seen.has(`f:${fest.key}:${i}`));
    /* every one already used — this festival has come round more times than it
       has words, so start again from the one seen longest ago */
    const pool = fresh.length ? fresh : fest.words.map((_, i) => i);
    const idx = fresh.length
      ? pool[hashOf(wk) % pool.length]
      : pool.reduce((best, i) => {
          const at = (state.wotwPast || []).lastIndexOf(`f:${fest.key}:${i}`);
          return best === null || at < best.at ? { i, at } : best;
        }, null).i;
    choice = { week: wk, fest: fest.key, i: idx };
  } else {
    const cats = (state.interests || []).filter(k => INTERESTS[k]);
    if (!cats.length) return null;
    const all = [];
    cats.forEach(k => INTERESTS[k].words.forEach((_, i) => all.push(`${k}:${i}`)));
    let fresh = all.filter(x => !seen.has(x));
    if (!fresh.length) {
      /* been through every word in every interest — let them cycle */
      state.wotwPast = (state.wotwPast || []).filter(x => x.startsWith("f:"));
      fresh = all;
    }
    const [cat, i] = fresh[hashOf(wk) % fresh.length].split(":");
    choice = { week: wk, cat, i: +i };
  }

  state.wotw = choice;
  rememberWord(choice.fest ? `f:${choice.fest}:${choice.i}` : `${choice.cat}:${choice.i}`);
  save();
  return choice;
}

/* a stable hash, so the pick doesn't wander between reloads in the same week */
const hashOf = str => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

/* Resolve a pick to the thing it points at. */
function wotwEntry(w) {
  if (!w) return null;
  const src = w.fest ? FESTIVALS.find(f => f.key === w.fest) : INTERESTS[w.cat];
  if (!src || !src.words[w.i]) return null;
  return { src, word: src.words[w.i], festival: !!w.fest };
}

/* ---------- placement ----------

   The first version sampled — five characters stood for twenty — and credited
   the whole range. Two things were wrong with that, and the second was worse.

   It guessed. Most of what it credited was never shown, so "we found your
   level" really meant "we assumed you knew seventy characters we never asked
   about".

   And it dumped. Everything credited went into the review queue, so being
   placed at 100 meant opening the app to sixty-two cards on day one, a
   mixture of characters you knew cold and characters you had never seen. That
   is the worst possible first session: too long, and too uneven to be either
   satisfying or useful.

   So now it walks every character in curriculum order and stops once you have
   missed more than PLACE_MISS_LIMIT of them. Nothing is inferred: a character
   is credited if and only if you answered it correctly.

   And credit does not mean homework. A credited character goes into the
   library as **known** — it counts for tier progress, it turns up in Go deeper,
   it inks itself in sentences and vocabulary, exactly as if you had learnt it
   in some earlier session. What it does not do is land in tomorrow's queue.
   Its first review sits PLACED_REST days out, fanned across PLACED_FAN more,
   so day one is what it should be for everybody: five new characters. */

const PLACE_MISS_LIMIT = 3;    /* stop once misses go past this */
const PLACED_LVL = 4;
const PLACED_REST = 12;        /* days before a credited character is first checked */
const PLACED_FAN = 24;         /* and the spread after that */

/* The last few before you started missing are the shakiest things you got
   right — you were at the edge of what you know. They come back within the
   week rather than in a month: the refresher, without the backlog. */
const PLACE_TAIL = 12;
const TAIL_REST = 3;
const TAIL_FAN = 5;

/* Credit exactly what was answered correctly, and nothing else. */
function placeKnown(chars) {
  const k = dayKey();
  const list = [...chars].filter(c => CHAR_INDEX[c] && !state.chars[c]);
  let added = 0;
  list.forEach((c, i) => {
    const r = ensure(c);
    const tail = i >= list.length - PLACE_TAIL;
    r.lvl = tail ? Math.max(1, PLACED_LVL - 2) : PLACED_LVL;
    r.placed = true;
    r.seen = 1; r.right = 1;
    r.skills.r = 1;              /* it was a recognition question, and you got it */
    r.shown.r = 1;
    r.due = tail ? addDays(k, TAIL_REST + (i % TAIL_FAN))
                 : addDays(k, PLACED_REST + (i % PLACED_FAN));
    added++;
  });
  const last = list.length ? CHAR_INDEX[list[list.length - 1]].i + 1 : 0;
  state.placed = {
    on: k,
    at: Math.max(last, (state.placed && state.placed.at) || 0),
    known: ((state.placed && state.placed.known) || 0) + added
  };
  save();
  return added;
}

const wasPlaced = () => !!state.placed;

/* ---------- sticking points ----------
   A character you keep missing isn't going to yield to another repetition of
   the same drill. Flag it so it can be looked at properly instead. */

const LEECH_MISSES = 5;

function isLeech(c) {
  const r = rec(c);
  return !!r && r.wrong >= LEECH_MISSES && r.wrong >= r.right;
}
const leeches = () => Object.keys(state.chars)
  .filter(c => CHAR_INDEX[c] && isLeech(c))
  .sort((a, b) => state.chars[b].wrong - state.chars[a].wrong);

/* ---------- practice: extra reps, weakest first ---------- */

/* ---------- what a round of extra practice draws on ----------

   Sorting the whole library by weakness and taking the top N stopped working
   once the library got big: the same forty characters were always the weakest,
   so the same forty came round every time, and the hundred behind them were
   never seen again.

   Two rules fix it.

   Most of a round is what you have learned recently, because that is what is
   actually at risk of slipping — RECENT_SHARE of it, drawn from the last
   RECENT_WINDOW characters you were introduced to. The rest reaches back into
   everything older, so the early stages don't rot.

   And within either group, what comes up is what has come up *least* — by
   `shown`, the count of times a character has been asked in this mode at all.
   Weakness breaks the tie, not the other way round: ordering by weakness alone
   pins a character you keep missing to the front of the queue permanently,
   which is how you end up seeing 难 six times an evening. */

const RECENT_SHARE = 0.7;
const RECENT_WINDOW = 40;

/* Newest first: by the day it was introduced, then by curriculum position for
   everything introduced on the same day (a placement quiz credits hundreds at
   once, and they all share a date). */
function byRecency(chars) {
  return [...chars].sort((a, b) => {
    const ra = rec(a), rb = rec(b);
    return (rb.first || "").localeCompare(ra.first || "") || CHAR_INDEX[b].i - CHAR_INDEX[a].i;
  });
}

/* Least-asked first, weakest as the tie-break, then a coin toss so equal
   characters don't always come out in the same order. */
function byNeed(skill) {
  return (a, b) => shownIn(a, skill) - shownIn(b, skill)
                || (rec(a).skills[skill] || 0) - (rec(b).skills[skill] || 0)
                || rec(a).lvl - rec(b).lvl
                || Math.random() - 0.5;
}

function practicePool(skill, n, pool) {
  const all = (pool || knownChars());
  if (all.length <= n) return [...all].sort(byNeed(skill));

  const ranked = byRecency(all);
  const recent = ranked.slice(0, RECENT_WINDOW);
  const older = ranked.slice(RECENT_WINDOW);

  const wantRecent = Math.min(recent.length, Math.round(n * RECENT_SHARE));
  const wantOlder = Math.min(older.length, n - wantRecent);

  const picked = [
    ...[...recent].sort(byNeed(skill)).slice(0, wantRecent),
    ...[...older].sort(byNeed(skill)).slice(0, wantOlder)
  ];

  /* If one side couldn't fill its share — a new learner has no `older` at all
     — take the shortfall from whatever is left rather than serving a short
     round. */
  if (picked.length < n) {
    const have = new Set(picked);
    picked.push(...ranked.filter(c => !have.has(c)).sort(byNeed(skill)).slice(0, n - picked.length));
  }
  return shuffle(picked);
}

const knownChars = () => Object.keys(state.chars).filter(c => CHAR_INDEX[c]);

/* ---------- milestones ----------

   Every fiftieth character, and the last one, get a moment. The list is
   deliberately coarse: a library of 300 gives six of these, which is often
   enough to look forward to and rare enough that one still means something.

   `hailed` records what has been celebrated rather than deriving it from the
   count, because the count goes down as well as up — a reset, or a character
   removed from the curriculum — and nobody should be congratulated twice for
   the same fifty. */
const MILESTONES = [50, 100, 150, 200, 250, 300];
const hailed = () => (state.hailed = state.hailed || []);

/* The HIGHEST milestone reached and not yet celebrated, not the lowest.
   The placement test can credit sixty characters in one go, and a queue of
   overlays to click through would turn the moment into a chore. */
function milestoneDue() {
  const n = knownChars().length;
  const due = MILESTONES.filter(m => n >= m && !hailed().includes(m));
  return due.length ? due[due.length - 1] : null;
}

/* Marking one marks everything below it, so the ones jumped over do not
   queue up and surface one at a time over the next six sessions. */
function markMilestone(m) {
  MILESTONES.forEach(x => { if (x <= m && !hailed().includes(x)) hailed().push(x); });
  save();
}

/* Everything done on one day, counted in reps.

   The day's own session counts cards — `new` and `rev`. Go deeper and Sprint
   count answers, in `extra` and `sp`, and are deliberately kept out of the
   day's checklist, which is a finishable list of the day's characters. But
   they are not kept out of *practice*: both already keep a streak alive, and
   both used to leave the day's square on the heatmap blank and the "days
   studied" total unmoved. A 🔥 1 sitting beside "0 days studied" is the app
   disagreeing with itself, and it got much easier to produce once a whole tab
   could be used without touching the queue.

   So the ink and the totals count all of it. What counts as *done* — goalMet,
   the checklist — still counts only new and rev, which is the distinction that
   was worth keeping. */
const dayReps = d => d ? (d.new || 0) + (d.rev || 0) + (d.extra || 0) + (d.sp || 0) : 0;

/* Days you actually studied — this never resets, unlike the streak. */
const daysStudied = () => Object.values(state.days).filter(d => dayReps(d) > 0).length;

/* ---------- the menu side quest: one character a day ---------- */

function menuQuest() { return QUESTS.find(q => q.id === "menu"); }

/* ---------- the menu keeps its own books ----------

   The side quest used to run entirely on the main library: what you could
   read was isKnown(), the daily character was the next unknown in curriculum
   order, and learning one introduced it into the review queue. Three
   consequences, all wrong for what this tab is meant to be.

   It marched in step with Today, so a good placement or a few sessions moved
   the quest forward without the learner having opened this tab. It could
   announce "you can read every character on this menu" to somebody who had
   never looked at it, because placement had credited the characters. And
   learning a character here fed the same schedule as everything else, which
   made a thing meant to be an aside into another obligation.

   So the menu now has its own record of what it has taught — `menuTaught` —
   and its own order. What it does NOT have is its own idea of what you can
   read: a character learned anywhere still inks in here, because the whole
   point of the page is watching it fill up. Cross-reference in, progression
   out. */

const menuTaught = () => (state.menuTaught = state.menuTaught || {});
const taughtHere = c => !!menuTaught()[c];

/* Can the learner read this character on the menu? Anything the library knows
   counts, and so does anything this tab has shown them. */
const menuCanRead = c => isKnown(c) || taughtHere(c);

/* The bar counts the menu, and only the menu.

   It used to count MENU_CHARS, which also holds the eight characters that
   appear nowhere on the card — 我 該 個 呀 幾 碗 呢 埋, the ones you say to a
   waiter. All eight are taught in the first four stages, so a learner arrived
   with them already ticked and the bar read half full while every dish on the
   wall was still unreadable. Now: characters you can read that are printed on
   the menu, out of the characters printed on the menu. */
function menuProgress() {
  const known = MENU_PRINTED.filter(menuCanRead).length;
  return { known, total: MENU_PRINTED.length, pct: known / MENU_PRINTED.length,
           done: known === MENU_PRINTED.length };
}

/* ---------- how much of the card is on the wall ----------

   Lived in app.js, which meant menuToday() could not ask what the learner can
   actually see — and menuToday() has to ask, or it picks characters off a part
   of the menu that is not being printed yet. Model logic, so it lives here. */
/* You get the next menu when you can read this one — see MENU_TIERS. */
function menuTier() {
  let n = 1;
  while (n < MENU_TIERS.length && MENU_READ[n].every(menuCanRead)) n++;
  return MENU_TIERS[n - 1];
}

/* What is standing between you and the next level, and it is only ever one
   thing now: the characters still grey on the menu in front of you. */
function menuNext() {
  const t = MENU_TIERS[menuTier().n];
  if (!t) return null;
  const left = menuOnWall().filter(c => !menuCanRead(c));
  return { tier: t, left: left.length, chars: left };
}

/* The characters printed on the card AS IT STANDS — what the learner can
   actually point at right now, in the order they read it. */
const menuOnWall = () => MENU_READ[menuTier().n] || MENU_READ[1];

/* How much of the printed menu is legible to you, counted in ink rather than
   in vocabulary — see MENU_INK. `ceiling` is where this curriculum runs out. */
function menuLegible() {
  const read = MENU_INK.filter(menuCanRead).length;
  return {
    read, total: MENU_INK.length, pct: read / MENU_INK.length,
    ceiling: MENU_INK_CEILING, ceilingPct: MENU_INK_CEILING / MENU_INK.length,
    maxed: read === MENU_INK_CEILING
  };
}

/* The countable claim. The bar runs to 53 because the quest is the whole card
   and a denominator that shrank and grew underneath the learner would be
   worse than a steady one — but 53 is not a number anybody can check against
   the menu in front of them, and at level 1 only 23 of them are on it. This
   is the number they can check by looking. */
function menuWall() {
  const wall = menuOnWall();
  const known = wall.filter(menuCanRead).length;
  return { known, total: wall.length, done: known === wall.length };
}

/* What this tab itself has taught, which is the only number it controls. */
function menuOwn() {
  const mine = Object.keys(menuTaught()).filter(c => MENU_PRINTED.includes(c));
  return { taught: mine.length, total: MENU_PRINTED.length };
}

/* Today's menu character, fixed once chosen so it can't shift underfoot.

   The card says "find it on the menu below", so the pick has to be ON the menu
   below — which means the menu at THIS level, not the whole card. Walking the
   full reading order offered 快 on day nine, a character printed only on the
   set-lunch board, which does not appear until level 3. The learner was sent
   to look for something that was not on their screen.

   Reading order, too, not the curriculum's: the character you meet next is the
   next one you cannot read going down the card, which has nothing to do with
   where the Today tab has got to.

   `wall` distinguishes the two ways of running out. If there is nothing left
   on the wall but more on the card, the quest is not finished — the menu just
   has not grown yet, and saying "done" would be a lie. */
function menuToday() {
  const k = dayKey();
  const held = state.menuPick;
  /* A pick from today stands — except one that is no longer on the wall. That
     is not the pick shifting underfoot, it is a repair: anyone holding 快 from
     before this was fixed would otherwise spend the rest of the day being told
     to find it on a menu that does not print it. */
  if (held && held.d === k && held.c && menuOnWall().includes(held.c)) return held;
  if (held && held.d === k && !held.c && menuOnWall().every(menuCanRead)) return held;
  const next = menuOnWall().find(c => !menuCanRead(c)) || null;
  /* Clearing the wall now promotes you on the spot, so there is no longer a
     state where the level is finished and the card is not: `next` is null only
     when the whole menu is read. */
  state.menuPick = { d: k, c: next, done: !next };
  save();
  return state.menuPick;
}

/* Learning a character here is recorded here and nowhere else.

   Deliberately not introduce(): no review date, no day count, nothing in the
   main schedule. The curriculum will teach this character properly in its own
   time — every one of them is in it — and until then the menu has shown it to
   you, which is what this tab is for. */
function menuLearn(c) {
  if (!c) return;
  menuTaught()[c] = dayKey();
  const p = menuToday();
  if (p.c === c) p.done = true;
  save();
}

/* The menu characters you can already read — the flashcard deck. Printed
   ones: a card for 埋, which is on no part of the menu, is not a menu card. */
const menuKnown = () => MENU_PRINTED.filter(menuCanRead);

function stageProgress(stageNo) {
  const inStage = HQ.filter(c => c.stage === stageNo);
  const known = inStage.filter(c => isKnown(c.c)).length;
  return { known, total: inStage.length, pct: inStage.length ? known / inStage.length : 0 };
}

/* ---------- tiers ----------

   `to` is the milestone the tier stands for, not how many characters are
   written yet: tier 2 runs to 500 but the library currently stops at 348, so
   `tierChars` returns what actually exists and `tierPlanned` says what it is
   aiming at. Keeping those apart is what lets the Library show an honest
   "148 of 300 written" instead of pretending the rest are missing. */

const tierFrom = t => t.n === 1 ? 0 : TIERS[t.n - 2].to;
const tierChars = t => HQ.slice(tierFrom(t), t.to);
const tierPlanned = t => t.to - tierFrom(t);
const tierOf = i => TIERS.find(t => i < t.to) || TIERS[TIERS.length - 1];

function tierProgress(t) {
  const inTier = tierChars(t);
  const known = inTier.filter(ch => isKnown(ch.c)).length;
  return { known, built: inTier.length, planned: tierPlanned(t),
           pct: inTier.length ? known / inTier.length : 0 };
}

/* Tier 1 is always open. After that you need TIER_UNLOCK of the previous
   tier's *written* characters — and every tier before that too, so a gap
   early on can't be stepped over. */
function tierUnlocked(t) {
  if (DEMO_BUILD && state.demo) return true;       /* 示範 — see below */
  for (let i = 0; i < t.n - 1; i++) {
    const p = tierProgress(TIERS[i]);
    if (!p.built || p.pct < TIER_UNLOCK) return false;
  }
  return true;
}

/* How many more of the blocking tier are needed to open this one. */
function tierNeeds(t) {
  for (let i = 0; i < t.n - 1; i++) {
    const prev = TIERS[i], p = tierProgress(prev);
    if (!p.built || p.pct < TIER_UNLOCK) {
      return { tier: prev, more: Math.max(1, Math.ceil(p.built * TIER_UNLOCK) - p.known) };
    }
  }
  return null;
}

/* The curriculum position past which nothing may be studied yet. Everything
   the daily session and the Library hand out is checked against this. */
function unlockedCeiling() {
  let ceiling = 0;
  for (const t of TIERS) {
    if (!tierUnlocked(t)) break;
    ceiling = Math.min(t.to, HQ.length);
  }
  return ceiling;
}

const isLocked = c => {
  const ch = CHAR_INDEX[c];
  return !!ch && !isKnown(c) && ch.i >= unlockedCeiling();
};

function currentStage() {
  for (const s of STAGES) {
    const p = stageProgress(s.n);
    if (p.known < p.total) return s;
  }
  return STAGES[STAGES.length - 1];
}

/* ---------- skill mastery, for the progress view ---------- */

/* Three clean answers in a mode is what makes a character solid in it. The
   number is arbitrary but the shape isn't: one right answer can be a lucky
   guess, three spread over different days is knowledge. */
const PASSES_FOR_SOLID = 3;

const passesIn = (c, skill) => {
  const r = rec(c);
  return (r && r.skills && r.skills[skill]) || 0;
};

/* How a skill stands across a set of characters.

   "12 of 30 solid" alone hid the actual work: two clean passes on every
   character reads as zero, and so does none. What's wanted is credit for the
   passes themselves — going through the material again and getting it right
   is the thing that makes it stick — so this also returns the buckets, and a
   percentage against the whole three-passes-each goal rather than against a
   threshold nothing crosses for a week. */
function skillStanding(skill, chars) {
  const buckets = [0, 0, 0, 0];         /* characters with 0, 1, 2, 3+ clean passes */
  let passes = 0;
  chars.forEach(c => {
    const n = Math.min(PASSES_FOR_SOLID, passesIn(c, skill));
    buckets[n]++;
    passes += n;
  });
  const total = chars.length;
  return {
    total, buckets, passes,
    solid: buckets[PASSES_FOR_SOLID],
    partway: buckets[1] + buckets[2],
    untouched: buckets[0],
    goal: total * PASSES_FOR_SOLID,
    pct: total ? passes / (total * PASSES_FOR_SOLID) : 0
  };
}

/* ============================================================
   速练 Sprint — the record behind the timed sheets

   The UI lives in js/sprint.js. What is here is everything that has to
   survive a reload: the per-character marks, the finished runs, and the
   best of them.

   Two numbers are kept for every character, per mode: how often it has been
   answered right and wrong under time pressure. They are deliberately not
   the same numbers the review schedule keeps. A character you read correctly
   at leisure every time and miss every time at two seconds a question is not
   a character you know — and nothing in the main record could tell you that,
   because nothing in the main record is timed.

   Alongside the counts is `s`, the last SPRINT_WINDOW answers as a string of
   1s and 0s, newest last, merged across all three modes. It is what decides
   whether a character is still a problem: the counts say what has happened
   over months, the string says what is happening now.
   ============================================================ */

const SPRINT_WINDOW = 12;        /* recent answers kept per character */
const SPRINT_TROUBLE = 2;        /* misses before it goes in the 错字本 */
const SPRINT_CLEAR = 3;          /* right answers in a row to leave it */
const SPRINT_FLUENT = 5;         /* right in a row before it counts as fluent */
const SPRINT_RUNS_KEPT = 40;     /* finished sheets kept for the recent list */

/* Records written before any of this existed have no `sprint` key at all, and
   one written by a version that only knew about `marks` has no `best`. Same
   problem `ensure` solves for `shown`, same answer. */
function sprintState() {
  const s = state.sprint = state.sprint || {};
  s.marks = s.marks || {};
  s.runs = s.runs || [];
  s.best = s.best || {};
  s.pick = s.pick || {};
  return s;
}

function sprintMark(c, mode, ok) {
  const s = sprintState();
  const m = s.marks[c] = s.marks[c] || { s: "" };
  const pair = m[mode] = m[mode] || [0, 0];
  pair[ok ? 0 : 1]++;
  m.s = (m.s + (ok ? "1" : "0")).slice(-SPRINT_WINDOW);
  /* Dismissing a character from the notebook is a claim about yourself, and
     missing it again is the evidence against. The claim loses. */
  if (!ok && s.cleared) delete s.cleared[c];
  save();
  return m;
}

const sprintMarkOf = c => sprintState().marks[c] || null;

/* Summed across every sprint mode. */
function sprintCount(c, i) {
  const m = sprintMarkOf(c);
  if (!m) return 0;
  return SPRINT_MODES.reduce((a, k) => a + (m[k] ? m[k][i] : 0), 0);
}
const sprintHits = c => sprintCount(c, 0);
const sprintMisses = c => sprintCount(c, 1);

/* How many right answers in a row it is currently on, counting sprints and
   repair rounds together — the only thing that gets a character out of the
   notebook, and the only thing that puts one on the fluent list. */
function rightRun(c) {
  const m = sprintMarkOf(c);
  if (!m || !m.s) return 0;
  let n = 0;
  for (let i = m.s.length - 1; i >= 0 && m.s[i] === "1"; i--) n++;
  return n;
}

/* Which mode a character actually fails in — "you can read it, you can't
   hear it" is the useful sentence, and it needs the per-mode split. */
function sprintByMode(c) {
  const m = sprintMarkOf(c);
  return SPRINT_MODES.map(k => ({ mode: k, hit: m && m[k] ? m[k][0] : 0, miss: m && m[k] ? m[k][1] : 0 }));
}

/* Recent misses weigh more than old ones: a character missed three times last
   week and answered right ever since is not the one to work on today. */
function troubleScore(c) {
  const m = sprintMarkOf(c);
  const recent = m && m.s ? [...m.s].filter(x => x === "0").length : 0;
  const r = rec(c);
  return recent * 3 + sprintMisses(c) + (r && isLeech(c) ? 4 : 0) - rightRun(c) * 2;
}

/* The 错字本. A character earns its page by being missed repeatedly under
   time — or by being a sticking point in the main record, which is the same
   problem arrived at from the other direction — and loses it by being
   answered right SPRINT_CLEAR times running, wherever that happens. */
function sprintTrouble() {
  const out = new Set();
  Object.keys(sprintState().marks).forEach(c => {
    if (CHAR_INDEX[c] && sprintMisses(c) >= SPRINT_TROUBLE) out.add(c);
  });
  leeches().forEach(c => out.add(c));
  return [...out]
    .filter(c => rightRun(c) < SPRINT_CLEAR && !(state.sprint.cleared || {})[c])
    .sort((a, b) => troubleScore(b) - troubleScore(a));
}

/* The other half of the same question, and the half that is nicer to be
   asked: what have you got cold? */
const sprintFluent = () => Object.keys(sprintState().marks)
  .filter(c => CHAR_INDEX[c] && rightRun(c) >= SPRINT_FLUENT)
  .sort((a, b) => rightRun(b) - rightRun(a) || sprintHits(b) - sprintHits(a));

/* "I know this one, stop showing me" — set by hand from the notebook, and
   undone by the next miss, which is the only honest way round. */
function sprintForget(c) {
  const s = sprintState();
  (s.cleared = s.cleared || {})[c] = dayKey();
  save();
}
function sprintRemember(c) {
  const s = sprintState();
  if (s.cleared) delete s.cleared[c];
  save();
}

/* ---------- finished sheets ----------

   A sheet is identified by what makes it hard: the mode, how many questions,
   how long, and — for writing, which has two input styles — which one. Bests
   are kept per sheet, because 40 questions in two minutes and 100 in two
   minutes are not the same test and one board for both would be nonsense. */

const sheetKey = run => `${run.mode}:${run.n}:${run.secs}${run.style ? ":" + run.style : ""}`;

/* More right beats faster; a tie goes to the quicker sheet. Finishing inside
   the time is not a separate ranking — a sheet you didn't finish has
   unanswered questions, and unanswered questions are not right answers. */
const beats = (a, b) => !b || a.right > b.right || (a.right === b.right && a.ms < b.ms);

function recordRun(run) {
  const s = sprintState();
  run.on = dayKey();
  run.at = Date.now();
  const key = sheetKey(run);
  const prev = s.best[key] || null;
  const best = beats(run, prev);
  if (best) s.best[key] = run;
  s.runs.unshift(run);
  s.runs = s.runs.slice(0, SPRINT_RUNS_KEPT);
  s.pick[run.mode] = { n: run.n, secs: run.secs, style: run.style };
  save();
  return { best, prev };
}

/* Every sheet of this mode you have a best for, hardest first — seconds per
   question is the honest ordering, since that is what the difficulty is. */
const sprintBests = mode => Object.keys(sprintState().best)
  .filter(k => k.startsWith(mode + ":"))
  .map(k => sprintState().best[k])
  .sort((a, b) => (a.secs / a.n) - (b.secs / b.n));

const sprintRecent = mode => sprintState().runs.filter(r => !mode || r.mode === mode);

/* Sprint answers keep a streak alive — they are real practice — but like Go
   deeper they stay out of today's checklist, which is a finishable list of
   the day's characters and not a place to pile up reps. */
function tallySprint(answers) {
  const t = today();
  t.sp = (t.sp || 0) + answers;
  t.spr = (t.spr || 0) + 1;
  touchStreak();
  save();
}
const sprintToday = () => (state.days[dayKey()] || {}).sp || 0;
const sprintTotal = () => Object.values(state.days).reduce((a, d) => a + (d.sp || 0), 0);
