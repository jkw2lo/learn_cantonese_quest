# Porting these changes back to Hanzi Quest

Cantonese Quest was forked from [Hanzi Quest](../Hanzi%20Quest) at its
`69a0039` and has diverged in two different ways since. Some of it is about
Cantonese and belongs here only. The rest is interface and tooling work that
applies to both, and leaving it unported means the two apps drift apart on
things neither of them meant to disagree about.

This file is the list. Each entry says what changed, why it changed, and where
it lives, with a note where Hanzi Quest needs it done differently.

**Nothing here has been applied to Hanzi Quest.** It is untouched at `69a0039`.

---

## Port these

### 1 · Fraunces renders a wonky `J`

Fraunces ships a **`WONK` axis** — the name is literal — which splays a handful
of glyphs. `J` is the one it treats worst, and the axis defaults to **on**. Both
apps request the family without mentioning it, so both get the wonky forms. It
shows up wherever a display-font heading contains one of the affected letters;
here it was the greeting, which addresses you by name.

**Where:** `index.html`, the Google Fonts `<link>`.

```
- family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700
+ family=Fraunces:opsz,wght,WONK@9..144,500,0;9..144,600,0;9..144,700,0
```

Hanzi Quest's link is character-for-character the same, so this is a
copy-paste. Verified the axis-pinned URL returns 200 and serves real `woff2`
files before relying on it.

---

### 2 · Characters with no stroke data render as an empty box

hanzi-writer fills an empty mount, so a character it has no data for leaves the
田字格 **blank** — a sound and a meaning attached to nothing. The font draws
these perfectly well; only the stroke-by-stroke animation needs the data.

**Where:** `js/app.js` — `drawable()`, `writerBox()`, and the tools row in
`charCard()`. `css/app.css` — `.tian-plain`, `.no-strokes`.

- `writerBox()` sets the character in type when `drawable()` is false.
- The 筆順 and 默寫 buttons are hidden rather than left to fail silently.
- A note under the card says why.

**Hanzi Quest caveat:** it may have no such characters today — its curriculum is
simplified and hanzi-writer covers it. Port it anyway as a guard: the failure
mode is silent and the fix costs nothing when the data is there.

---

### 3 · Untaught characters on screen have no tooltip

Every Chinese character in these apps is hoverable, but the tooltip was built
only from the curriculum — so anything printed without being taught had no
tooltip at all. Here that was **224 characters**: menus, example words,
sentences, the word of the week. On the menu quest specifically it was most of
what is printed, and hovering a dish and being told nothing reads as broken
rather than as out of scope.

**Where:** `tools/fetch-glosses.mjs` (new) generates an `EXTRA_GLOSS` block into
`js/data.js`; `js/app.js` — `gloss()` consults it, and `initTips()` falls back
to it instead of bailing.

**Hanzi Quest caveat:** its restaurant menu has the same problem — it prints
characters it never teaches. The generator is Cantonese-shaped in one respect:
readings come from Unihan's `kCantonese`. For Hanzi Quest, read `kMandarin`
instead, and drop CC-Canto.

Two things learnt writing it, worth keeping:

- **Unihan's `kDefinition` should be the primary source, not the fallback.**
  CC-Canto's single-character entries lean toward the colloquial sense, which is
  wrong for a reference gloss — it returned 牛 as "stubborn and unreasonable"
  when the character on the menu means cow.
- **Both sources write for lexicographers.** Glosses arrive with measure-word
  notes, numbered senses and cross-references: 雞 as "fowl; chicken M: 隻zhī
  [隻]", 錢 leading with "a surname". The `tidy()` and `dull()` filters exist for
  that and port as-is.

---

### 4 · Section headings: one convention, and hoverable

Two conventions coexisted. `sprint.js` put Chinese first — 錯字本 Mistake
notebook — while Today put it last or left it out: "Go deeper 加練" beside a bare
"Flashcards".

**The convention is English first, Chinese second**, the Chinese set quieter and
without the uppercase tracking, because in a section heading the English is the
label and the Chinese is a gloss on it. This is deliberately the *opposite* of
the nav tabs and the drill labels, which stay Chinese-first — there the Chinese
**is** the label.

The characters in those headings are hoverable too. They were the only Chinese
on screen you could not look up, and 加練 and 錯字本 are exactly what a learner
wants to hover.

**Where:** `js/app.js` — `hanLabel()`; every `.eyebrow` in `app.js` and
`sprint.js`; `css/app.css` — `.eyebrow .han-label`. `tools/fetch-glosses.mjs`
scans `js/app.js`, `js/sprint.js` and `index.html` as well as the data, so a
heading added later gets a gloss without anyone remembering to come back.

---

### 5 · Today is a dashboard, not a scroll

Everything on Today is a choice about what to do next, so a page you have to
scroll to see the choices hides half of them. Measured on a 1280×720 laptop:
**629px below the bars against a page that wanted 1451.** The session button,
the day's list and the flashcards were never on screen together.

**Where:** `js/app.js` — the `$("#viewToday").innerHTML` layout and `todayOpen`;
`css/app.css` — `.dash`, `.dash-col`, `.dash-today`, `.dash-side`, `.dash-wide`,
`.learned-strip`, `.learned-more`.

What did the work, in order of how much height each returned:

- **Clamp the one block that grows without bound.** The day's character strip
  was 362px on its own at sixty characters — more than half the screen. Two
  rows, with a **Show all** under it.
- **Go deeper became a band across the foot.** Its own code comment already
  called it a band, and it had been given a column where it ate 283px.
- **Equal-height columns.** They sized to their contents, so three columns of
  different lengths left a ragged bottom edge. Stretching them removes the
  negative space rather than moving it.
- **The day's characters and the day's practice share an enclosure** — the same
  subject, rather than two adjacent cards.
- **Side rail order:** word of the week above the flashcards.

**707px**, from 1451.

---

### 6 · The four-week tracker belongs behind the streak chip

It was a full-width sticky bar that opened with 🔥 N, sitting directly beneath a
chip that also said 🔥 N. Two rows of chrome for one fact, and 34px of height.

**Where:** `index.html` — `.streak-pop` wrapping the chip and `#tracker`;
`js/app.js` — `renderTracker()` and the handlers in `boot()`; `css/app.css` —
`.streak-pop`, `.tracker`.

Three things that were not obvious:

- **Sizing.** `max-width: 24rem` cropped a 28-day row that wants 445px, so the
  popover cut off the thing it existed to show. It sizes to its contents and
  only the viewport bounds it.
- **Clicking the chip to close it did nothing**, because `.streak-pop:hover`
  held it open while the pointer was still on the chip. A `shut` class overrides
  hover until the pointer leaves.
- Now that it is not next to a 🔥, it can spend its words on what the chip does
  not say: the run, days studied, the best.

---

### 7 · The 正 tally has to stay in its corner

`tallyRow(n, max)` draws complete marks up to `max` and then collapses to a
single 正 with a multiplier. The default of 6 was chosen for a page that could
scroll, and in a fixed corner it fails at **particular counts, not large ones**:
50 reps came out as `正 × 10` and fitted, while **31 drew seven glyphs** and
pushed its container into overflow.

**Where:** `js/app.js` — the `tallyRow(exToday, 3)` call in the Go deeper block;
`css/app.css` — `max-width` and `flex-wrap: nowrap` on the count.

Swept 15, 16, 20, 26, 31, 34, 50, 120, 400: no overflow, widest 117px.

---

### 8 · Smaller interface fixes

| what | why | where |
|---|---|---|
| Notebook releases the trackpad when the deck is finished | It held the pointer lock over the two buttons the finishing card had just put on screen | `startSquare()` `onComplete`, `nbAutoPad()`, `nbPad()` |
| Notebook names the characters it dropped | `todaysWritable()` silently drops characters without stroke data, so five learned showed four squares | `renderNotebook()`, `.nb-missing` |
| Notebook source switcher is a segmented pair | Three chips made "which set" and "give me another" look like the same control | `.nb-switch`, `.nb-seg` |
| Word of the week reads across, with a copy button | The meaning was a third line under a tall stack; the copy button had claimed a column | `.wotw-row`, `.wotw-said`, `copyText()`, `legacyCopy()` |
| The vocabulary deck says 生字 | It sampled its own contents, so its face was whatever word came first — it read as a card about that word | `oneDeck("deckWords", …)` |
| Go deeper reads across in three | A narrow label, the modes in the middle, the reps on the right in line with the heading | `.dash-wide .deeper` |

`copyText()` keeps an `execCommand` fallback deliberately: these apps run from a
`file://` clone as readily as from a server, and a copy button that silently
does nothing is worse than none.

---

### 9 · 示範 Demo mode

A Settings toggle that opens every tier at once so the Library lists the whole
library and any card can be read — for showing somebody the app without
spending six weeks earning the right to. It does that and **nothing** else:
nothing is marked known, nothing graded, and the queue, streak and day's record
are untouched.

**Where:** `js/srs.js` — `DEMO_BUILD`, `state.demo`, `demoOn()`, and the guard
in `tierUnlocked()`; `js/app.js` — the Settings row, `renderDemoBar()`, and the
`demoOn()` check in `renderLibrary()`'s tier-open logic; `index.html` —
`#demoBar`; `css/app.css` — `.demo-bar`.

Two things worth copying exactly:

- **Patch `tierUnlocked()`, not `unlockedCeiling()`.** The first version patched
  the ceiling, but the Library asks `tierUnlocked` directly and never consults
  it — so the gate opened and tier 2 stayed folded shut behind its caret. One
  gate, one place.
- **Unlocking a tier and showing it are different.** The Library collapses every
  tier but the one you are working in, so demo mode has to expand them too.

`DEMO_BUILD = false` removes it entirely — the toggle disappears, the banner
cannot render, and the gate stops consulting the flag. Gone rather than off.

---

### 10 · Tooling

**The pairing check was asking a yes/no question it could not answer.** "Does
this character arrive with a readable pairing?" cannot tell a wait of one
character from a wait of sixteen — and a wait of one is not a problem, since 你
and 好 cannot both be first. Measuring the wait made it *stricter*: a character
waiting eleven used to hide in the same tolerance as 朋 waiting for 友.
(`tools/smoke.mjs`, the "no drill shows a character you have not met" block.)

**Check everything the app says aloud, not just the curriculum.** The reading
audit covered curriculum words and the menu and stopped, so a wrong reading sat
in the word-of-the-week list until it was noticed by ear. Widening it caught two
more. Hanzi Quest's pinyin audit has the same shape and the same gap.

**A list of notes nobody can triage is a list nobody reads.** The wrong reading
was hiding among twenty-nine unexplained divergences that all looked alike —
twenty-eight legitimate, one wrong. Reviewed divergences now live in a
`REVIEWED` map with the reason written beside each, so a new one prints alone
and fails the run. (`tools/check-jyutping.mjs`.)

---

## Do not port these

Cantonese-specific, and wrong for Hanzi Quest:

- **The curriculum order and its contents.** Numbers-and-pictographs first,
  greetings second, 146 characters, two tiers.
- **Six-tone jyutping** — `toneOf()`, `toneless`, `TONE_PATHS`, and the
  ASCII-based `bare`/`searchable`/`untoned`. Hanzi Quest's four-tone diacritic
  handling is correct for pinyin.
- **Sound-first ordering** — `TODAY_TASKS`, `PRACTICE`, the Sprint panel order,
  the `drillKind()` bag, and the skills-bar order in Record. This is a claim
  about Cantonese, not about learning generally.
- **Traditional-first font stacks** and the `SIMPLIFIED` cross-reference.
- **The cha chaan teng**, its pacing gate, and its own tab. The *mechanism* —
  gating a level on menu progress **and** an overall total, so clustered
  characters cannot make it fire twice in a week — ports fine if Hanzi Quest's
  menu ever paces badly. Its levels are currently spread across 763 characters,
  so it probably does not.
- **Prices in `$`.** Hanzi Quest's restaurant is on the mainland; `¥` is right.
- **The reading audit itself** (`tools/check-jyutping.mjs`, `tools/jyut.mjs`) —
  though see Tooling above for the two ideas in it that do port.

---

## Suggested order

1. **Fraunces `WONK`** — one line, immediate, affects every heading.
2. **Reference glosses** — self-contained, and the menu quest needs it most.
3. **Heading convention** — mechanical, and the glosses have to land first so
   the headings have something to show.
4. **Dashboard** — the largest, and worth doing in the measured order above.
5. **Tracker popover** — depends on the dashboard being settled.
6. **Demo mode**, then the smaller fixes and the tooling.

Bump the version after each (`node tools/version.mjs patch`) and run
`node tools/smoke.mjs` before pushing — a push is a deploy on both.
