# Porting these changes back to Hanzi Quest

Cantonese Quest was forked from [Hanzi Quest](../Hanzi%20Quest) at its
`69a0039` and has diverged in two different ways since. Some of it is about
Cantonese and belongs here only. The rest is interface and tooling work that
applies to both, and leaving it unported means the two apps drift apart on
things neither of them meant to disagree about.

This file is the list. Each entry says what changed, why it changed, and where
it lives, with a note where Hanzi Quest needs it done differently.

**Nothing here has been applied to Hanzi Quest.** It is untouched at `69a0039`.
One entry — #14, "Study ahead" — is a **bug** and not a preference: the same
line is live in Hanzi Quest at `js/app.js:2796`, where it is quietly rewriting
the "new characters a day" setting every time someone clicks the button.

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

### 7 · The day's block: alignment, the ring, and what the labels say

A pass of detail work on the Today hero, all of it applicable:

- **The progress ring moved to the left.** Every other ring and tick in these
  apps is left-aligned — the practice list, Go deeper — and this one sat on the
  right on its own.
- **The headline is one line.** "You're clear for today, Jen." wrapped to two in
  a dashboard column, which looked unbalanced beside a ring. The phrasing is
  shorter and the size is down to 1.45rem with `white-space: nowrap`.
- **`New` and `Due` did not say what they meant.** They are `To learn` and
  `To review` now, with titles explaining that the first is your daily goal and
  the second is the schedule's decision, not yours. `Revised today` → `Done`.
- **The card aligns with the side rail** at both ends. Two things were in the
  way: the enclosure contributes a border and padding the rail did not have, and
  the rail's first sheet carried a 14.4px top margin of its own. Measured after:
  tops 92/92, bottoms 524/524.
- **The hero's 96px of slack is distributed** rather than pooling under the last
  block — `justify-content: space-between`, which also makes the card read as a
  page with things placed on it.
- **The practice list distributes its five rows** over the column height instead
  of sitting at the top of it, and its progress bar has room above it so it
  reads as a bar rather than as an underline of the heading.

**Where:** `js/app.js` — the `hero` template and `headline`; `css/app.css` —
`.hero-top`, `.hero-title`, `.dash-side`, `.dash-today .hero`, `.todo-block`.

---

### 8 · The day's characters: a rail, not a wall

At five a day the strip is one row; at sixty-five it was a wall. It is a single
scrolling row with `‹ ›` arrows, and a **See all** that opens a panel spanning
the full width of the enclosure — under both columns, since by then it concerns
the whole day rather than one card.

**Where:** `js/app.js` — `charTile()`, `LT_VISIBLE`, the `.learned-rail` markup,
the `.today-all` panel inside `.dash-today`, and the arrow handlers;
`css/app.css` — `.learned-rail`, `.lt-arrow`, `.today-all`, `.today-all-grid`.

---

### 9 · The two blocks are an open notebook, not a page

The first attempt gave the enclosure ruled lines, a vermilion margin rule down
the **far left**, and two binder holes beside it. That reads as one page with
two columns printed on it — but they are not two columns, they are two facing
leaves: the day's characters on the left, the day's practice on the right. So
the margin rule and the holes move into the **gutter between them**, where the
fold of a real spread is, and the horizontal rules become **squared paper** —
the paper Chinese writing practice actually happens on.

Three things had to be true together, and each was measured:

1. **The side rail is an enclosure of its own** — same 1px border, same
   `.55rem` of padding, same paper. That is what makes its first card start on
   the line the enclosure's first card starts on, and it replaces the
   `padding-top: calc(.55rem + 1px)` that was faking the same result. Measured
   after: both enclosures `87→558`, all four inner blocks `97→548`.

2. **Both enclosures are colourless.** The `--sunken` tint has come off. The
   texture alone says "these belong together", and it lets the cards inside
   read as sheets laid on paper rather than panels sunk into it.

3. **The cards inside give up their fill and their border.** This is the one
   that matters and the one that is easy to skip: with the cards left opaque,
   the paper only showed in the 9px of padding around them, which is a texture
   on a frame and not a page. Only `.lc`, `.today-all` and `.wotw-word` keep a
   ground of their own, because they are the things *written on* the paper.

**Where:** `css/app.css` — the `.dash-today, .dash-side` block, the two
`.dash-col:nth-child(2)` pseudo-elements, and the transparency rule. The gutter
widens from `.55rem` to `.9rem`, because a fold needs room; the fold sits at
`calc(-.45rem - .5px)` and the holes at `calc(-.45rem - 3px)`, both measured
against the real gutter centre rather than guessed.

Nothing below 1180px changes — the enclosure only exists at that breakpoint, so
the narrow layouts keep their ordinary cards.

---

### 9a · The flashcard decks are one hue at three depths

Three decks in three unrelated hues — gold, jade, vermilion — said nothing.
The decks are not unrelated: today's characters are a handful, everything you
know is more, and the words those characters make is more again. One hue at
three strengths makes the ramp itself the information — the deck gets darker as
it gets bigger.

    .decks .deck        jade  6% into --sheet
    .decks .deck-all    jade 15%
    .decks .deck-words  jade 24%

**Watch the caption contrast.** The ramp costs `--ink-3` its legibility on the
deepest rung: measured 2.5:1 in light and 2.2:1 in dark, both well under 4.5.
Two changes fix it — `.decks .deck-text small` moves up to `--ink-2`, and the
deepest rung eases from 27% to 24%. Measured after, dark mode: `6.58 / 5.49 /
4.53`; light: `6.98 / 6.24 / 5.54`. Background luminance still ramps cleanly
(`.023 → .038 → .057` dark, `.874 → .775 → .683` light), so the ramp survives
the accessibility fix rather than being flattened by it.

The deepest card face also needs `background: var(--sheet)` put back, or it
disappears into the ground it sits on.

**Where:** `css/app.css` — `.decks .deck`, `.deck-all`, `.deck-words`.

---

### 10 · The 正 tally has to stay in its corner

`tallyRow(n, max)` draws complete marks up to `max` and then collapses to a
single 正 with a multiplier. The default of 6 was chosen for a page that could
scroll, and in a fixed corner it fails at **particular counts, not large ones**:
50 reps came out as `正 × 10` and fitted, while **31 drew seven glyphs** and
pushed its container into overflow.

**Where:** `js/app.js` — the `tallyRow(exToday, 3)` call in the Go deeper block;
`css/app.css` — `max-width` and `flex-wrap: nowrap` on the count.

Swept 15, 16, 20, 26, 31, 34, 50, 120, 400: no overflow, widest 117px.

---

### 11 · Smaller interface fixes

| what | why | where |
|---|---|---|
| Notebook releases the trackpad when the deck is finished | It held the pointer lock over the two buttons the finishing card had just put on screen | `startSquare()` `onComplete`, `nbAutoPad()`, `nbPad()` |
| Notebook names the characters it dropped | `todaysWritable()` silently drops characters without stroke data, so five learned showed four squares | `renderNotebook()`, `.nb-missing` |
| Notebook source switcher is a segmented pair | Three chips made "which set" and "give me another" look like the same control | `.nb-switch`, `.nb-seg` |
| Word of the week reads across, with a copy button | The meaning was a third line under a tall stack; the copy button had claimed a column | `.wotw-row`, `.wotw-said`, `copyText()`, `legacyCopy()` |
| The vocabulary deck says 生字 | It sampled its own contents, so its face was whatever word came first — it read as a card about that word | `oneDeck("deckWords", …)` |
| Go deeper reads across in three | A narrow label, the modes in the middle, the reps on the right in line with the heading | `.dash-wide .deeper` |
| The streak chip closes what it opened | Clicking a second time removed the class, but `:hover` held the popover open while the pointer was still on the chip | `boot()`, `.streak-pop.shut` |
| Tooltip listeners guard their target | `closest` is an `Element` method, and an event target is not always one — a click dispatched on `document` threw and took the handler chain with it | `initTips()` |

`copyText()` keeps an `execCommand` fallback deliberately: these apps run from a
`file://` clone as readily as from a server, and a copy button that silently
does nothing is worse than none.

---

### 12 · 示範 Demo mode

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

### 13 · Tooling

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

### 14 · "Study ahead" ran away in two separate places

A real bug, reported twice, and Hanzi Quest has both halves of it.

**Half one — the setting.**

    $("#aheadBtn")...  state.goalNew += 5; save(); startSession();

`goalNew` is the **standing setting** — "new characters a day", the one the
settings stepper shows. So one click on a Tuesday quietly made every day after
it a ten-character day; the stepper read 10 with nobody having touched it, and
clicking again made it 15. What the button means is "give me more *today*", so
the extra now lives on the day and dies with it:

    const aheadToday = () => (state.days[dayKey()] || {}).ahead || 0;
    function studyAhead(n) { const t = today(); t.ahead = (t.ahead || 0) + n; save(); }
    const dayGoal = () => state.goalNew + aheadToday();

**Half two — the dealing, which survived the first fix.** This is the one that
made the day visibly run away, and it is easy to call the job done before
reaching it.

`nextNew(n)` returns the next n characters you have **never seen**. It has no
idea what today already taught you. So `nextNew(dayGoal())` on a finished day
of five hands out *ten more*, not five — and the hero, which was computing
`dayGoal() - t.new` by hand, counted down a completely different number from
the one the session dealt. Measured in the live app, click-and-finish five
times over with the setting at 5:

    before   session 1 dealt  5 | learned  5
             session 2 dealt 10 | learned 15
             session 3 dealt 15 | learned 30
             session 4 dealt 20 | learned 50
             session 5 dealt 25 | learned 75

    after    every session dealt 5 | learned 5, 10, 15, 20, 25

The fix is one function, and the point of it is that **one function answers
both questions** — the number the session deals and the number the hero counts
down had drifted apart, which is what let one of them run away:

    const newLeftToday = () =>
      Math.max(0, Math.min(dayGoal(), remainingNew()) - today().new);

`buildSession()` deals `nextNew(newLeftToday())`; `renderToday()` sets
`newLeft = newLeftToday()`. Neither computes it itself any more.

**`goalMet()` deliberately stays on `state.goalNew`.** Asking for five more
characters is extra credit, and extra credit must not take back a day you had
already finished — or the streak that came with it.

**Half three — the wreckage already in storage.** Fixing the code does not fix
the records it already wrote. A `goalNew` outside the stepper's own 1–30 range
cannot have come from a person, so `load()` puts it back to the default:

    const GOAL_MIN = 1, GOAL_MAX = 30;
    if (!(state.goalNew >= GOAL_MIN && state.goalNew <= GOAL_MAX))
      state.goalNew = blank().goalNew;

Note the limit of this: a bugged value that landed *inside* the range — 10, 15,
20, 25, 30 — is indistinguishable from one somebody chose, and is left alone.
Anyone who used the button before the fix should check Settings once.

**Where:** `js/srs.js` — `aheadToday`/`studyAhead`/`dayGoal`/`newLeftToday`
after `extraToday`, `GOAL_MIN`/`GOAL_MAX`, the guard in `load()`, and the
comment on `goalMet()`; `js/app.js` — `buildSession()`, `renderToday()`, the
`#aheadBtn` handler, and the stepper's clamp (which hard-coded `1` and `30`);
`tools/smoke.mjs` — fifteen checks under "studying ahead: today only" and "the
setting repairs itself".

**One trap in testing this.** `load()` *reassigns* the module-level `state`, so
a harness that captured `state` once is reading a stale object from then on —
the first version of these tests passed against the wrong record. Read what
`load()` returns.

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

0. **The "Study ahead" fix (#14)** — first, because it is the only entry
   here that is a bug rather than a preference, and every day it is left in
   place it corrupts a setting the user never touched.
1. **Fraunces `WONK`** — one line, immediate, affects every heading.
2. **Reference glosses** — self-contained, and the menu quest needs it most.
3. **Heading convention** — mechanical, and the glosses have to land first so
   the headings have something to show.
4. **Dashboard** — the largest, and worth doing in the measured order above.
5. **Tracker popover** — depends on the dashboard being settled.
6. **Demo mode**, then the smaller fixes and the tooling.

Bump the version after each (`node tools/version.mjs patch`) and run
`node tools/smoke.mjs` before pushing — a push is a deploy on both.
