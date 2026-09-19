# Porting these changes back to Hanzi Quest

Cantonese Quest was forked from [Hanzi Quest](../Hanzi%20Quest) at its `69a0039`
and has diverged in two ways since. Some of it is about Cantonese and belongs
here only. The rest is interface, correctness and tooling work that applies to
both, and leaving it unported means the two apps drift apart on things neither
of them meant to disagree about.

**Nothing here has been applied to Hanzi Quest.** It is untouched at `69a0039`.

Grouped by area rather than by the order I happened to do them in, because that
is the order you would want to work through them. Each entry says what changed,
why, and where — with a note where Hanzi Quest needs it done differently.

Read **§0 first**: those are defects rather than preferences, and every one of
them is in Hanzi Quest's source today, at the line numbers given.

---

## How to work through this

1. **§0, in order.** They are bugs, they are small, and two of them are one
   line each.
2. **§9 Tooling** next, so the checks exist before the changes they guard. The
   handler check in particular has caught three separate dead controls in this
   app and would have caught all three earlier.
3. **§1 Type and chrome** — mechanical, and the glosses have to land before the
   heading convention has anything to show.
4. **§2 The dashboard** — the largest, and worth doing in the measured order
   inside it.
5. Everything else as it suits you.

Bump the version after each (`node tools/version.mjs patch`) and run every
checker before pushing — a push is a deploy on both:

```
node tools/smoke.mjs && node tools/check-strokes.mjs && node tools/check-components.mjs
```

---

## What keeps going wrong — read before starting

Four patterns cost me real time in this app. They will cost the same in the
other one.

**Grep before naming a class.** Two separate bugs came from reusing a class
name that already meant something: `.menu-head` put a vermilion rule and
centred type on a page introduction, and `.empty` — a general-purpose
empty-state panel — made three flashcard decks 159px tall instead of 60 and
stretched the whole dashboard around them. Both looked like layout problems and
neither was.

**A helper belongs next to what uses it, not next to what it was written for.**
`capName()` was declared above the page it was written for; deleting the page
deleted it, and the Next button in the introduction silently threw. Same shape
as `openMenuLesson()`, which never existed at all.

**A checker that cries wolf gets ignored, and one that is too narrow catches
nothing.** A general called-but-undeclared scan reported 132 false positives
(prose inside string literals: `o:"A person (人) with..."` reads as
`person()`). Scoped to handler bodies it was exact — but it only read the first
call in each handler, so it missed `capName` on line three. Scope it tightly,
then make sure it reads the whole thing.

**Measure, do not guess, and look at the output.** Every dashboard number in
here was measured in the browser. The composed stroke data looked right in the
data and was visibly wrong on screen — 佢 rendered as a bare 巨 — because the
radical frames had been averaged from the wrong donors.

---

## What is in here

| | |
|---|---|
| **§0** | [Bugs that are live in Hanzi Quest right now](#0--bugs-that-are-live-in-hanzi-quest-right-now) — start here |
| **§1** | Type and chrome |
| **§2** | The Today dashboard |
| **§3** | The teaching card, drills and audio |
| **§4** | Writing |
| **§5** | Reference pages |
| **§6** | Onboarding |
| **§7** | The side quest (menu) |
| **§8** | Data, audio and tooling |
| **§9** | Per-tab quick-start guides |
| **§10** | Smaller fixes |
| **§11** | [Growing the curriculum, and milestones](#11--growing-the-curriculum-and-milestones) |
| | **Do not port these** — Cantonese-specific |

---

## §0 · Bugs that are live in Hanzi Quest right now

All five verified against Hanzi Quest's working tree at the time of writing —
these are not "might apply", they are there:

| bug | where in Hanzi Quest | one-line summary |
|---|---|---|
| Study ahead rewrites the setting | `js/app.js:2796` — `state.goalNew += 5` | one click makes every later day a ten-character day |
| Study ahead re-deals the whole target | same handler, plus `buildSession()` | 5 → 15 → 30 → 50 characters across four rounds |
| Space skips the writing quiz | `js/app.js:3544` — `\|\| $("#skipW")` in the space-bar list | two taps give up on the quiz with nothing written |
| `data-speak` has no listener | `js/app.js:1484` emits it; `dataset.speak` appears nowhere | those buttons do nothing at all |
| The 正 tally overflows its corner | `js/app.js:2684` — `tallyRow(exToday)` with no `max` | 31 reps draws seven glyphs and pushes the container |
| The Library's stage filter dies at stage 10 | `js/app.js:2858` — `libFilter.length === 2 && ch.stage !== +libFilter[1]` | Hanzi Quest has 13 stages; chips 10–13 select nothing and show everything |


### "Study ahead" ran away in two separate places

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

### Two dead controls, and the checker that now catches them

**`openMenuLesson()` never existed.** The Menu's "Learn 個" button called a
name that appears exactly once in the repository — at the call site. Clicking
it threw a ReferenceError and did nothing at all.

**`data-speak` had no listener.** It was on the menu's five "Say it out loud"
phrases from the start; nothing anywhere ever listened for it.

Both are the same shape of bug — a control wired to nothing — and neither was
catchable, because smoke can load `srs.js` and `data.js` (DOM-free) but not
`app.js`. Smoke now checks that **every handler in app.js calls something that
exists**, 34 of them.

**A general "is every called name declared" scan was tried first and
abandoned.** Scanning the raw text, prose inside string literals reads as
calls: `o:"A person (人) with..."` is `person()`, CSS `var(--seal)` is `var()`.
It reported 132 false positives. A version with a real string-aware scanner
still ate code and lost declarations. Scoped to handler bodies the check is
exact and has no false-positive surface — verify it by reverting the fix and
watching it fail.

---

### Space moves you on; it does not answer for you

`#skipW` was in the space-bar target list. On a writing drill — the one that
comes straight after meeting a character — **two taps of space gave up on the
quiz without a stroke being written**: the first dismissed the card, the second
hit "Show me the strokes". That reads as the space bar skipping the quiz,
because it is.

Skip keeps its own key (`S`), where pressing it is a decision rather than a
reflex. And when there is nothing to advance to, space is swallowed rather than
ignored, so a held key cannot run ahead into whatever renders next.

---

### The 正 tally has to stay in its corner

`tallyRow(n, max)` draws complete marks up to `max` and then collapses to a
single 正 with a multiplier. The default of 6 was chosen for a page that could
scroll, and in a fixed corner it fails at **particular counts, not large ones**:
50 reps came out as `正 × 10` and fitted, while **31 drew seven glyphs** and
pushed its container into overflow.

**Where:** `js/app.js` — the `tallyRow(exToday, 3)` call in the Go deeper block;
`css/app.css` — `max-width` and `flex-wrap: nowrap` on the count.

Swept 15, 16, 20, 26, 31, 34, 50, 120, 400: no overflow, widest 117px.

---

## §1 · Type and chrome

### The wonky `J` was not WONK — it is Fraunces

**This entry previously said the fix was pinning the `WONK` axis to 0. That was
wrong, and Hanzi Quest should not copy it.**

Rendered side by side at 54px, `WONK 0` and `WONK 1` are identical for "Jen",
and so are `ss01`–`ss04`, `salt`, `cv01` and `cv02`. Fraunces simply draws a J
that drops below the baseline and curls left, and the one heading that
addresses the learner by name is exactly where it shows. No axis, feature or
stylistic set reaches it.

The only fix is a different display family. Cantonese Quest moved to
**Newsreader**: same editorial warmth, an optical-size axis like Fraunces had,
pairs with IBM Plex Sans, ordinary J.

    --f-display: "Newsreader", Georgia, "Times New Roman", serif;
    …css2?family=Newsreader:opsz,wght@6..72,500;6..72,600;6..72,700…

Pinning `WONK` costs nothing and does nothing; drop it with the family.

---

### Section headings: one convention, and hoverable

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

### Untaught characters on screen have no tooltip

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

## §2 · The Today dashboard

### Today is a dashboard, not a scroll

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

### The day's block: alignment, the ring, and what the labels say

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

### The day's characters: a rail, not a wall

At five a day the strip is one row; at sixty-five it was a wall. It is a single
scrolling row with `‹ ›` arrows, and a **See all** that opens a panel spanning
the full width of the enclosure — under both columns, since by then it concerns
the whole day rather than one card.

**Where:** `js/app.js` — `charTile()`, `LT_VISIBLE`, the `.learned-rail` markup,
the `.today-all` panel inside `.dash-today`, and the arrow handlers;
`css/app.css` — `.learned-rail`, `.lt-arrow`, `.today-all`, `.today-all-grid`.

---

### The two blocks are an open notebook, not a page

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

2. **Both enclosures are colourless, but not transparent.** The `--sunken`
   tint comes off; the ground becomes `--sheet`, the same near-white the cards
   use. Transparent was tried first and is wrong: it puts the grid on the desk
   rather than on a sheet of paper, and in dark mode the enclosure then sits
   *darker* than the cards it holds. `--sheet` reads as squared paper in both
   themes without a second rule.

3. **The cards give up their fill, but the text does not.** With the cards
   left opaque, the paper only showed in the 9px of padding around them —
   texture on a frame, not a page. But grid lines behind a *paragraph* are
   noise, not paper: the rules were running straight through the day's
   characters, the practice list and the word's definition. So the cards go
   fill-less and the text areas keep a ground — `.lc`, `.today-all`,
   `.wotw-word`, `.learned`, `.todo-list`, `.wotw-note`. They are the same
   `--sheet` as the enclosure, so the fill draws no box; it just stops the
   grid, which is all it is there to do.

4. **Three binder holes, not two.** The first version drew one dot and faked a
   second with `box-shadow: 0 11rem 0` — which is why there were only two: a
   third shadow would have landed past the bottom of a column whose height is
   not fixed. Three `radial-gradient`s on a full-height strip place themselves
   at 20/50/80% of whatever the column turns out to be, and each paints its
   own 1px rim. Measured at 480px of column: holes at 20/50/80% exactly.

5. **`.wotw-word`'s gap.** The dashboard carried `gap: .1rem`, written when
   that card was a vertical stack. It became a row when the meaning moved
   beside the characters, and .1rem left 劏房 touching its own jyutping.

**Where:** `css/app.css` — the `.dash-today, .dash-side` block, the two
`.dash-col:nth-child(2)` pseudo-elements, and the transparency rule. The gutter
widens from `.55rem` to `.9rem`, because a fold needs room; the fold sits at
`calc(-.45rem - .5px)` and the holes at `calc(-.45rem - 3px)`, both measured
against the real gutter centre rather than guessed.

Nothing below 1180px changes — the enclosure only exists at that breakpoint, so
the narrow layouts keep their ordinary cards.

---

### A section on paper needs a title, not a label

On a plain card a floating `.eyebrow` is enough. On squared paper it is not:
the rules run through it and it reads as one more line of text rather than the
name of what follows. On the dashboard it becomes a small stuck-on tab —
`--sunken` ground, 1px rule, 6px radius — sitting slightly proud of the block
it names, with the Chinese gloss brought up to full opacity because it is part
of the label now rather than a whisper after it.

Two things that are easy to get wrong:

- **`display: inline-block` is not enough.** In `.decks` and `.deeper-title`
  the label is a *flex child*, so it stretches to the full column — two of the
  five tabs came out as full-width bands and the other three as chips. It
  needs `align-self: flex-start` as well.
- **Go deeper's band is itself `--sunken`**, so a `--sunken` tab on it is
  invisible but for its border. That one takes `--sheet`. The tab is always
  the other half of the pair from whatever it sits on.

Scope it to the paper enclosures and the Go deeper band. Every other
`.eyebrow` in the app is still on a plain card and still wants to be quiet.

**Where:** `css/app.css` — "a section is titled, not just labelled".

---

### The flashcard decks are one hue at three depths

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

### A borrowed class name made the whole dashboard look stretched

Day one looked padded out: the hero 769px tall for 340px of content, the
practice list 679 for five short rows. It read as a layout problem and it was
not one.

`oneDeck()` marked a deck with no cards `.empty` — and `.empty` is a
**general-purpose class elsewhere in the app**: `text-align: center;
flex-direction: column; padding: 2.5rem 1rem`. So each of the three empty
decks came out **159px instead of 60**, the side column was 789px of *natural*
height, and every other block stretched to match it, because the columns are
deliberately equal-height.

Renaming the modifier to `.deck-bare` took the enclosure from **789px to
513px** and the day-one dashboard from overflowing to fitting exactly.

**This is the second class-name collision in this app** — `.menu-head` was the
first. Grep before naming a class, and when a block looks mysteriously
stretched, check what classes it is actually matching before adjusting the
layout around it.

---

### The four-week tracker belongs behind the streak chip

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

## §3 · The teaching card, drills and audio

### The teaching card fits on the screen it is being taught on

`charCard()` is six blocks in a 34rem column — the character, where it comes
from, how to remember it, what it is built from, the words it turns up in, and
a sentence. Measured on a 1280-wide screen: **1352px of reading inside a 632px
window**, 720px of overflow, with roughly 700px of screen empty on either side
of the column. You met a new character by scrolling past it.

Above 1000px the column widens to 64rem and the card becomes two parts — the
character on the left, everything written about it on the right:

    .cardx        grid: 17rem | 1fr
    .cardx-blocks columns: 2

**Multi-column, not grid.** Five blocks of unequal length into two columns of
equal height is exactly what column balancing does; a 2-column grid leaves one
column a row short. Each block needs `break-inside: avoid`, and its gap becomes
`margin-bottom`, since `column-gap` is horizontal only.

**The markup change is two wrappers.** `charCard()` gains `<div class="cardx">`
round everything and `<div class="cardx-blocks">` round the five text blocks.
Both call sites — the session intro and the Library detail — get it for free.

**The intro's header had to move.** "New character · 👤 Who" plus the menu chip
was a band across the full width above the card: 66px of header for eleven
words, and it is the character's label anyway. `charCard()` takes a `topper`
now and renders it at the top of the hero column. That one change is 66px of
the 76px that separated "just overflows" from "comfortable" at 1280×720.

Measured after, all 146 characters:

| window | tallest card | overflowing |
|---|---|---|
| 1280 × 720 | 551 of 592 | 0 of 146 |
| 1024 × 768 | 551 of 640 | 0 of 146 |

The tallest are 冇 咗 喎 — the ones with no stroke data, where the explanatory
note makes the *hero* the binding side rather than the text. The card needs 679px
of window height; below that it scrolls again, as it should.

**What did not need fixing:** all seven drill kinds, before and after answering
— tallest 470 of 637. The drills were never the problem, and it is worth
measuring before widening them too. Nor the Library sheet's own chrome: its
first measurement said every character overflowed by 29px, which was
`document.documentElement.scrollHeight` reading the page *behind* the dialog.
The sheet has its own scroller and fits with 68px to spare.

**Where:** `js/app.js` — `charCard()` signature and its two wrappers, the
intro branch in `renderStep()`; `css/app.css` — "The teaching card, on a screen
wider than a phone".

---

### A sentence does not fit in 1.4 seconds

Read them in context plays the line back when you answer it, and a flat
`AUTO_ADVANCE_MS = 1400` then moved to the next card — where `renderStep()`
calls `stopPhrase()`. So the advance was what silenced the audio. Timed in the
app: 請問，洗手間喺邊度？ is **6140ms** of clips, so 1400ms cut it off after
about **1.8 characters of eight**.

There is no way to know the length up front — a line is played as one clip per
character and the clips load lazily — so `sayPhrase()` gains a completion
callback, `onPhraseEnd()` attaches to a chain already in flight (settle() runs
after the audio has started, so it cannot pass one in), and `armAdvance()`
waits:

    const PHRASE_TAIL_MS = 650;   // not the full 1400: you have already had
                                  // six seconds of sentence to take it in

Three details that matter:

- **`clearAdvance()` bumps a generation counter** and the queued callback
  checks it, so an advance waiting behind a sentence cannot fire after you
  have already pressed Next yourself.
- **`stopPhrase()` drops the callback.** A chain cut short does not owe anyone
  the call — otherwise skipping a card advances the next one early.
- **The button's countdown is only armed for the part that is a countdown.**
  While the line plays it reads as a plain Next, which is true: nothing is
  ticking, and pressing it still works.

Measured after: the card holds at `idx=0` through 5000ms and moves between
6500 and 7400ms. Recognition drills still advance between 1300 and 1700ms —
unchanged.

**A second bug found while in there.** The verdict's 🔊 ran `say(ch.c)` — one
character of a sentence you had just been shown whole. The line that was read
is kept on `item.said` and replayed properly.

**Where:** `js/app.js` — `stopPhrase`/`sayPhrase`/`onPhraseEnd`, `clearAdvance`
and `armAdvance`, the `d` branch of `renderDrill`, and the `#replay` handler in
`settle()`.

---

### Characters with no stroke data render as an empty box

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

### Stroke data for characters no font has ever drawn

Ten characters here had no upstream graphics — 佢 哋 冇 喺 嚟 嗰 攰 咗 喎 啱 —
all Cantonese-only, all invented for writing Cantonese after the fonts the
data comes from were built. They showed as a static glyph in a different
typeface with 筆順 and 默寫 hidden, which made the first characters a learner
meets the ugliest things on the page.

**Eight of them are ordinary compounds of parts that do have data**, so
`tools/compose-strokes.mjs` builds them: 口 + 地 for 哋, 口 + 個 for 嗰, 亻 + 巨
for 佢, and so on. 冇 is not a compound — it is 有 with the two short strokes
inside the 月 removed, which is exactly what its own etymology says, and
strokes 5 and 6 of 有 are precisely those two.

**The composition is measured, not guessed.** The app already teaches real
口+X characters with upstream data — 嘅 咩 呀 啦 喇 囉 嘢 — so the frame the
mouth sits in and the frame its partner sits in are read off those and
averaged. What comes out is an approximation of the *shape* and an exact
account of the stroke **order** and **count**, which is what the writing
drills check.

**The mistake worth inheriting:** the first version measured one left frame
from the 口 compounds and used it for everything, which squashed 亻 — tall and
narrow — into the mouth's squat box, and 佢 rendered as a bare 巨. Each radical
needs its own donors. Always look at the output: this is the one kind of
generated data where correctness is a thing you can see.

Output goes to `js/strokes-made.js`, **not** into `js/strokes.js`, so
`check-strokes.mjs` can go on comparing the real bundle byte-for-byte with
upstream. The app merges them at load and never overwrites a real entry;
`STROKE_MADE` lists what was generated, and the card footnotes it rather than
hiding the buttons. Coverage went 136/146 → 144/146.

Hanzi Quest teaches simplified from a much larger set and will have far fewer
gaps, but the technique is the same wherever upstream is short.

---

## §4 · Writing

### Writing practice: two exercises, not one control with two positions

The source switch was a segmented control — one box split in half, the selected
half filled solid with `--ink`, each side carrying a bare number. Three things
wrong with that:

- **It said the wrong thing about the choice.** Today's characters and whole
  words are different exercises, not two settings of one: single characters
  from today's lesson, or a real word written straight through.
- **The count had nothing to say what it counted.** "Today's characters 136"
  — 136 of what?
- **A solid slab of ink** for "selected" is heavier than anything else on the
  page, in a view whose whole subject is a faint grey character to trace.

They are two cards now, side by side, each with its Chinese label, its name and
a count that says what it is a count of ("136 to trace", "203 you can write").
Selected is a seal wash and a seal border — the same "this one is live" the
tracing squares already use. Disabled reads "none yet" rather than a greyed
zero. Below 520px they stack, because side by side at phone width they are two
cramped boxes rather than a choice.

The rest of the header follows from that: the shuffle button stops sharing a
row with the switch, the word being written moves out of the title bar and into
the band at full size (characters, jyutping, meaning), and the progress bar
spans the same width instead of a `min(26rem, 90vw)` of its own.

**One deletion worth making.** The title bar repeated the word and the round —
`bin1 dou6 · where` up there, and the same thing in the band six millimetres
below. It says `抄寫 Writing practice` now, and nothing else.

**Where:** `js/app.js` — `renderNotebook()`, the `mode()` helper and the
`#nbTitle` line; `css/app.css` — "writing practice: choosing what to write".

---

### The stroke player belongs under the picker, not over the page

It shipped as a modal, which is the wrong shape for it: you watch the
animation *in order to* write the character, and a dialog makes you dismiss
the thing you are copying before you can copy it. It is a docked panel under
"Trace a character" now — one fixed place, filled by whatever is selected, and
still there while you write. Again / Step (with a stroke counter) / Show.

**Where:** `js/app.js` — `renderPickStage()` replaces `showStrokeOrder()`;
`.pick-stage` in the CSS; the `#strokeOrder` dialog comes out of index.html.

---

## §5 · Reference pages

### The radicals page needed a way in, not more prose

5222px of wall: twenty-seven cards of dense prose in one flat list, with
nothing at the top to say what a radical *is*. Someone new to the writing
system arrived at a reference work and was expected to know what to do with it.

Three changes, none of them more text:

1. **Show it.** 媽 is 女 + 馬 — the woman says what it means, the horse says how
   it sounds, and the result is "mum", said maa1. Meaning part underlined in
   jade, sound part in gold. That one worked example is the whole idea, and it
   is built from the curriculum's own `comp` data rather than hand-written, so
   it cannot drift out of step with the character it describes.
2. **A map before the territory.** Every radical as one chip with a progress
   bar, anchored to its card. The whole set visible at a glance, any of it one
   click away.
3. **Four themes instead of a flat list** — the body, people, the natural
   world, things made and done. Hand-grouped on purpose: the traditional
   214-radical ordering is by stroke count, which is for looking things up in a
   paper dictionary and useless for learning what the parts mean. Anything not
   hand-placed falls into a catch-all rather than vanishing off the page.

Plus two compactions: cards go two and three across (eleven of the
twenty-seven hold a single character, so a full-width row was mostly margin),
with families over eight keeping the full width; and the "other shared parts"
tail folds into a `<details>`.

**5222px → 3407px**, a third shorter *while adding* the example and the map.

---

### 聲調 — a page that teaches the tones

The contour line has sat beside every reading since the first commit,
unexplained. Everything assumed you would imitate your way there, which works
if you already speak a tonal language and is a wall otherwise.

The demonstration is built from **the curriculum's own characters**, not the
textbook 詩史試時市是 set: 哥 嗰 個 give tones 1-2-3 and 埋 買 賣 give 4-5-6,
every one of them taught by the app and every one with a recorded clip — so
the tones can be *heard*, not just described. 買 maai5 (buy) against 賣 maai6
(sell) opens the page, because one tone apart and opposite in meaning makes
the argument better than any paragraph.

Mandarin has four tones, not six, so this ports as a structure rather than as
content: find the minimal sets inside the curriculum (`bare(p)` grouped, ≥3
distinct tones) rather than reaching for a textbook example with no audio.

---

### The 入門 tab dissolves into the tabs it was about

A whole tab of background notes is read once and never again. The four that
survive live where they belong: *what a character is* and *what written
Cantonese is* in the Library, *the full forms* in the exercise book, and
*jyutping* with the tones. Two are deleted rather than moved — "Cantonese, not
Chinese" is the opening of the introduction and "characters are built" is the
entire 部首 page. The "what you actually do" steps go too: the introduction has
just walked through them.

A reference note gets read when it sits next to the thing it explains.

---

## §6 · Onboarding

### The first run: four stages, and none of them a form

The first version of this put everything in one 入門 tab and shut the rest of
the app until it had been scrolled. That made reference material into a toll
gate, and it was still mostly prose. Reworked into four stages, in this order:

1. **Hello.** A small card, 你好 written stroke by stroke by the app's own
   animator — the product demonstrating itself — then it moves on by itself.
2. **What Cantonese is.** One overlay: the language and a sketch map of the
   Pearl River Delta across the top, then two equal halves below — how
   characters are built (女 + 馬 = 媽) and the six tones, with 買/賣 to tap.
3. **How this app teaches it.** Learn → Practise → Go deeper as three cards
   with arrows, then Menu and Sprint as the two things that are just good.
4. **The page itself**, with its parts named — the coach overlay.

Each of 2 and 3 waits for Next and has nothing else to click, which is the
gate. Afterwards the **wordmark** reopens stages 2–3, because "what was that
about tones" is a day-three question.

**More picture than paragraph, deliberately.** The seven prose cards this
replaced were clicked through unread, which is worse than not showing them.

**Two things that came out of it.** The 入門 tab moves to the *end* of the nav
— it is reference, consulted once and then occasionally. And the old
seven-card tab tour is dropped from the first run entirely: it said the same
things less well and made four dialogs into five. It stays in Settings.

---

### The first run, second pass

What changed after using it:

- **The hello finishes.** It cut away 100ms after 好 landed. The timing is
  taken from the real strokes now — hanzi-writer runs about 330ms a stroke —
  so both characters finish and then there are two seconds to look at them. A
  click skips it. It also has something to look at: the seal, two 田字格, the
  jyutping and the gloss.
- **The questionnaire moved inside the introduction**, straight after the
  hello. Two questions after a greeting read as someone saying hello back; the
  same two questions ahead of everything read as a form standing between you
  and the app.
- **Nothing chosen means everything.** The word of the week is purely a
  reward, and nobody should ever meet the card that explains why it is empty.
  Applied on save, on skip, and on load for records that already exist.
- **The coach locks on the first run** — no ✕, the veil does not dismiss, and
  `closeCoach()` refuses unless forced. Reopened from the `?` it closes
  normally: someone checking one thing should not have to walk the set.
- **The session button pulses** while the overlay points at it, with a
  `prefers-reduced-motion` opt-out.
- **The headline wraps rather than truncates.** `nowrap` + `text-overflow` was
  keeping it to one line by cutting off the learner's name — "Ready when you
  are, J…". A greeting that truncates the person it is greeting is worse than
  one that takes two lines.

---

### Placement waits for the moment it is relevant

Placement used to be a stranger's opening question — and for a complete
beginner it was a quiz whose only possible result was "you know nothing".

The introduction asks instead, with a gauge: none at all / a few words / I can
get by / I read some. Then the **first** press of the session button decides:

- **"None at all"** — no question. The session starts at the first character.
- **anything else** — asked once, here, where it is finally relevant: take the
  check, or start from the beginning anyway. The wording quotes what they
  said, so it reads as a follow-up rather than a fresh interrogation.

After that it is an ordinary button for good (`state.levelAsked`). The level
itself is kept and not otherwise acted on, which is the honest position: we do
not yet know what else to do with it, and collecting it costs nothing.

---

### 入門 — a primer on the language, not the app

The tour explains the tabs. Nothing explained the writing system, so a first
day looked like 你好 with no account of what a character is, why there are two
of them, or what the number after the romanisation is for.

Seven cards after the questionnaire, once: Cantonese is not a dialect of
Mandarin; a character is a syllable; characters are built from a meaning part
and a sound part; jyutping is a tool and not the language; six tones and they
*are* the word; traditional forms; and written Cantonese as distinct from
formal Chinese.

**The shell is the existing tour.** `walk = { cards, done, label }` replaces
the hard-coded `TOUR` in `renderTour` and the two handlers, so a second
walkthrough costs an array and two functions. Check the first one still works
after the refactor — it is the kind of change that quietly breaks the thing it
generalised.

---

## §7 · The side quest (menu)

### Eight menu characters were taught but nowhere to be found

`MENU_CHARS` teaches 43 characters. Eight of them — 我 該 個 呀 幾 碗 呢 埋 —
appear only in the phrases you say to a waiter, never on the printed dish
list. The card said "One character a day. **Find it on the menu below**"
regardless, which was already misleading; the day the Menu tab stopped
rendering the phrases, 呢 had nowhere to be found at all.

Two fixes, both needed. The phrases come back onto the Menu tab (speakable
now, and with the day's character highlighted in them). And the copy tells the
truth about where to look:

    onPrintedMenu(c) ? "on the menu below" : "in the phrases under the menu"

`PRINTED` is derived from `MENU` at load rather than listed by hand, so
editing the menu data cannot put it out of date.

**Smoke gains three checks**: every `MENU_CHARS` character appears somewhere on
the page; exactly eight are phrase-only (so adding a ninth is a deliberate
decision, not a silent one); and `renderQuest` still renders the phrase list.

---

### The side quest keeps its own books

Reported as: *"ive just started and it is saying i can read every character on
the menu — but that's definitely not true."*

It ran entirely on the main library. What you could read was `isKnown()`, the
daily character was the next unknown **in curriculum order**, and learning one
called `introduce()`. Three consequences, all wrong for what the tab is for:

- It **marched in step with Today**. A good placement or a few sessions moved
  the quest forward without the learner having opened the tab — which is how a
  new learner got told they could read the lot.
- Learning a character here **fed the same schedule as everything else**, so a
  thing meant as an aside became another obligation.
- Finishing a menu lesson **ticked off "Learn today's characters"** — a task
  about the day's five, completed by looking at a character from another tab.

**Cross-reference in, progression out.** The tab now has:

| | |
|---|---|
| `state.menuTaught` | what the menu itself has taught — its own book |
| `menuCanRead(c)` | `isKnown(c) \|\| taughtHere(c)` — a character learned *anywhere* still inks in, which is the whole point of the page |
| `MENU_ORDER` | the order you meet characters reading the menu, top left to bottom right, instead of curriculum order |
| `menuOwn()` | "N of 35 learned here" — the only number the tab controls |
| `menuLearn(c)` | records it and nothing else: no `introduce`, no review date, no day count |
| `session.menu` | set by `teachOne(c, {menu:true})`; suppresses every `markDone` at session end |

The menu lesson is **the card and no drill** — a drill would grade it, and
grading is the schedule.

**The trade-off, stated plainly:** a character met on the menu is not scheduled
for review. It is recognition and immersion, not retention. That is acceptable
here because every menu character is in the curriculum and will be taught
properly in its own time.

**Two follow-on bugs from the same change**, both from code still asking the
library: the card's `learnedIt` used `isKnown`, so today's character never
looked done and would be offered again; and `glyphs()` — the menu's ink — used
`isKnown`, so a character the tab had just taught stayed grey. Both take
`menuCanRead`. **When you decouple a store, grep for every reader of the old
one.**

Smoke covers the lot: learning on the menu advances the quest, joins the
flashcard deck, and leaves `state.chars`, the review queue and the day record
untouched — while a character learned the ordinary way still inks the menu in.

---

### A character learned on an errand is not part of the day's list

The menu quest's "Learn 個" ran the ordinary intro, which calls `introduce()`
and `tally("new")` — so a menu character landed in today's rail, counted
against the day's new-character goal, and moved the ring, all without the
learner having opened a session. "5 learned" meant six.

A record learned that way is marked `viaMenu`, and `learnedToday()` excludes
it. It still enters the library and the review queue like anything else — it
is only the *day's list* it stays out of, because that list is the day's
session and the menu is a separate errand you went and asked for.

    if (item.menu) rec(item.c).viaMenu = true; else { tally("new"); … }

Verified on a fresh record: after the menu character, `learned` 0 and the
goal still 5; after a session character, `learned` 1 and the goal 4. The menu
character is known and scheduled throughout.

**Where:** `js/app.js` — `learnedToday()`, `menuLearnedToday()`, `teachOne(c,
{menu})`, the `#gotIt` handler.

### The menu is not all on the wall at once

The fix above was half of it. The other half took another round to find, and it
is the more general lesson: **"on the menu" is not one set of characters.**

`renderMenuCard` prints the masthead and the dish names from the start, a
dish's small print from level 2, and the set-lunch board from level 3. Nothing
in the model knew that. So:

- **The daily pick walked the whole card**, and walked the set-lunch board
  *first*, because the board is printed above the sections. The ninth character
  the quest ever offered was **快** — which appears nowhere except that board —
  printed in red above a menu that did not contain it, under the words "find it
  on the menu below". Unfindable on anybody's screen until level 3, roughly a
  fortnight later.
- **The bar counted `MENU_CHARS`**, which includes the eight spoken-only
  characters from the entry above. All eight are taught in the first four
  stages, so they arrived pre-ticked: the bar was several points ahead of
  anything the learner could actually read.

The model now derives, from `MENU` itself, what is printed **at each level**:

    const MENU_READ = [], MENU_LEVELS = [];   /* 1-indexed by menu level */

`MENU_READ[n]` is that level's characters in the order the eye meets them going
down the card; `MENU_LEVELS[n]` is the same as a Set. `MENU_PRINTED` is
`MENU_READ[3]` — the whole card — and the pick comes from
`menuOnWall()`, which is `MENU_READ[current level]`.

Three consequences worth copying:

- **`menuTier()` and `menuNext()` had to move from `app.js` to `srs.js`.**
  `menuToday()` must know the level to pick a findable character, and `srs.js`
  cannot reach into `app.js`. A `PRINTED` set that had been sitting in `app.js`
  went with them — it turned out to be dead code, never read.
- **A cached pick that is no longer on the wall gets re-picked.** The pick is
  deliberately fixed for the day so it cannot shift underfoot, but anyone
  holding 快 when this shipped would otherwise have spent the rest of the day
  hunting for it. That is a repair, not a shift.
- **Running out at this level is not finishing the quest.** `menuToday()`
  returns `wall: true` when the level is exhausted but the card is not, and the
  card says so — "You can read this whole menu … there is more on a longer
  menu" — rather than declaring the quest complete.

**The bar keeps a stable denominator (53, the whole card) and the note carries
the countable one.** A denominator that shrank and grew as levels arrived would
have the learner apparently losing progress on being promoted. But 53 is not a
number anyone can check against the menu in front of them, so the line under
the bar says "You can read **13** of the 23 characters on the menu as it
stands" — the figure they can verify by looking.

`MENU_TIERS` thresholds were rescaled with the denominator (20 → 17, 34 → 30,
against 53 rather than 61). Measured over a 30-day run: level 2 on day 14,
level 3 on day 23, and every pick on the wall on the day it is offered.

Hanzi Quest's menu has the same three-level reveal and the same one-set model
behind it, so it has both bugs waiting — its board characters are simply luckier
in where they fall in its 763-character order.

---

## §8 · Data, audio and tooling

### An audit of the stroke data

`check-strokes.mjs` compares the bundle byte-for-byte with Make Me a Hanzi,
which settles stroke **order** — the order is the array order and the array is
upstream's. `tools/audit-strokes.mjs` covers what that cannot see:

| pass | what it catches |
|---|---|
| coverage | a character offered for writing with no data — and whether upstream has it, so a bundling miss reads differently from a real gap |
| traditional forms | a traditional character carrying the simplified glyph's strokes, which would teach the wrong hand silently; and the `SIMPLIFIED` map against Unihan |
| stated counts | `RADICALS[].strokes` against the form the card prints |
| structure | one median per stroke, points inside the 1024-unit box, no truncated paths |
| components | 部件 claims against upstream's own decomposition |

**It found a real inconsistency.** `strokes` is meant to count the form the
card prints — the card shows 忄, so "3 strokes" has to be 忄's three, not 心's
four. Four entries did that; 食, 心 and 手 counted the dictionary key instead.
Now 8, 3, 3.

**Two lessons from writing it, both worth having before porting it.** It first
reported 水 and 艸 as wrong because it compared the key rather than the printed
form — a correct entry flagged as a bug, which is how a checker loses its
authority. And expanding the decomposition by *substitution* turned 8 honest
component notes into 104 useless ones: Make Me a Hanzi bottoms out in `？`, so
replacing 言 with its own decomposition deletes the 言 the claim is about.
Expansion has to append.

Hanzi Quest teaches simplified from a much larger set, so the
traditional-forms pass needs inverting there; everything else ports as is.

---

### Four more interests, and the check that caught them

Work & money, Getting around, Moods & feelings, Games & mahjong — eight
categories now. Every reading was looked up in CC-Canto before it was written
down, and `check-jyutping.mjs` agreed.

**`smoke.mjs` then failed**, correctly: *every one of them has a clip — 16
missing*. New vocabulary brings new characters, and a word you can see is a
word you can tap; one missing clip makes `sayPhrase` give up on the whole word.
`node tools/make-audio.mjs Sinji` regenerates the bundle (386 clips, 2.8 MB).
**Adding interest words means regenerating audio — the checker will tell you,
but only if you run it.**

---

### Tooling

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

## §9 · Per-tab quick-start guides, and two small ones

### The ? belongs to the page it is standing on

One overlay explaining the Today page is a tutorial. Eight overlays, one per
tab, each explaining the page you are actually looking at, is a manual you
never have to go and find.

`COACH` is keyed by view. `openCoach()` reads `COACH[view]`, and `syncHelp()`
runs on every `go()`: it hides the `?` on a tab with no guide rather than
opening an empty overlay, and names the page in the tooltip — "How Sprint
works", not "Help".

Three details worth copying:

- **A step whose target is not on screen is skipped**, not pointed at nothing.
  The flashcard column stacks away on a narrow layout and the mistake notebook
  does not exist until you have made mistakes.
- **Point at selectors that actually exist.** Four of mine did not on the first
  pass — `.sp-board`, `.leech-list`, `.rec-head`, `.lib-bar` were all invented.
  Walk every tab and assert each target resolves; it takes one loop and it is
  the whole difference between a guide and a blank overlay.
- **The first run's coach is locked** (no ✕, the veil does not dismiss); the
  one from the `?` closes normally.

**Where:** `js/app.js` — `COACH`, `coachSteps()`, `syncHelp()`, `openCoach()`.

---

### The gear was invisible

`⚙` (U+2699) renders as thin monochrome text in most fonts and all but
vanished beside the emoji next to it. `⚙️` — the same codepoint with the
variation selector — asks for the emoji glyph.

**Where:** `index.html`, the settings button.

---

### The side quest may only pick a character that is on the menu

The card says "find it on the menu below", so the character it picks has to be
there. `MENU_CHARS` counts everything on the page — dish names, section heads,
the set-lunch board, the small print under a dish, and the phrases you say to a
waiter — which is right for *progress* and wrong for *picking*.

`MENU_PRINTED` is the narrower set: dish names and section headings, the part
of the menu you read in order to order. `menuToday()` picks from that. Eight
characters are consequently never taught by the quest — they are still taught
by the ordinary curriculum.

Two smoke checks hold it: every pickable character is on the dish list, and
nothing off the dish list is pickable.

**Where:** `js/data.js` — `MENU_PRINTED`; `js/srs.js` — `menuToday()`.

---

### The clip can teach a different word from the card

Ten characters here are taught with a **colloquial** reading that is not the
dictionary default — 文白異讀, the literary/spoken split. `say` reads a
character in isolation, so it uses the default, and the recording then teaches
a different word from the one on the card. Reported as "some of the tone
pronunciations are off".

**Check it by comparison, not by ear** — synthesise the character and a
homophone of the reading you expect, and compare the audio. Identical bytes
mean the voice used that reading:

    行 == 恆    say uses hang4;   card teaches haang4   wrong
    喎 == 蛙    say uses waa1;    card teaches wo3      wrong
    聽 != 廳    say is not teng1; card teaches teng1    wrong
    朝 != 招    say is not ziu1;  card teaches ziu1     wrong
    呀 == 亞    say uses aa3;     card teaches aa3      fine
    返 == 番    say uses faan1;   card teaches faan1    fine

`SAY_AS` in `tools/make-audio.mjs` records those two from a homophone instead —
same syllable, same tone, a character the voice is sure of. **`UNFIXED` lists
the six that cannot be fixed this way** (名 meng2, 呢 ni1, 坐 co5, 平 peng4,
行 haang4, 喎 wo3): the reading belongs to that character alone, so no
substitute exists. Recording the *word* each appears in would fix it, and the
bundle is per character. Written down rather than quietly lived with.

**A trap in the smoke check for it.** Two separate encodes of the same sound
are not byte-identical — the M4A container stamps each with its own creation
time, so they diverge from byte 67. Compare the `mdat` atom, not the file, or
the check reports a difference nobody can hear. And assert that two *different*
characters fail the comparison, or it proves nothing.

Mandarin has the same literary/colloquial splits, so Hanzi Quest will have its
own list — run the comparison rather than copying mine.

---

### The gear was invisible, then it was wrong

`⚙` (U+2699) renders as thin monochrome text and all but vanished. `⚙️` with
the emoji selector is a colour glyph, which sits oddly on a pale bar between
two line icons. An inline SVG inherits `currentColor` and matches its
neighbours in both themes.

---

## §10 · Smaller fixes

### Smaller interface fixes

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

### Smaller things in the same pass

| what | why | where |
|---|---|---|
| The greeting block and the study-ahead button get a ground | The rule that strips fills inside the paper enclosures caught them too, so the grid ran through the date, the headline and the one button on the page. `--sheet` alone stops the grid but matches the ground it sits on, so the block also needs a hairline to read as a block | `.dash-today .hero-top`, `.hero-cta .btn-ghost` |
| Word of the week and the flashcards join Go deeper | They are the three things that are *not* today's work, so they share one surface | `.dash-side .wotw`, `.dash-side .decks` |
| 生字 shrinks on the deck face | The dashboard's card front is 34px wide; `.82rem` put the two characters edge to edge with no card showing round them. Now `.6rem` | `.decks .dc1.dc-word` |
| "Solid" is defined where it is counted | Three modes each count separately and the word appeared five times on the band without ever being explained | `.deeper-sub`, `.solid-def` |
| Six nibs, and `T` in the exercise book | Finest was 5px. Now 1.5–13. `T` already toggled the trackpad in the notebook and nothing said it worked here — note `wpControls` must use `innerHTML`, since `textContent` wiped the key hint on the first repaint | `#wpPen`, `onKey`, `wpControls` |
| Flashcard faces carry no hint at all | First they repeated the footer, then they said "Tap to flip" on a face whose main gesture is now *hear it* — the label was wrong as often as it was right. The three behaviours are listed under the card and the face is a card; it needs no caption | `renderFlash`, `.card-face .hint` deleted |
| The radicals page says what it is not | "Is this all of them?" is the right question: 27 of the traditional 214, and the answer belongs on the page rather than in a commit message | `.rad-scope` |

---

### Three small ones

| what | why | where |
|---|---|---|
| Today's practice rows share the height equally | `space-evenly` distributes what is left *after* the flex gap, so the space above the first row was 23px and between rows 16 — even by the spec, uneven to the eye. A grid of equal fractions is even to both | `.dash .todo-list` |
| Names are capitalised | Each word, and after a hyphen or apostrophe: mary-jane → Mary-Jane, o'brien → O'Brien. The rest of the word is left alone or McRae and van der Berg break in the name of tidiness. Applied on save *and* on load, since records already exist | `capName()`, `load()` |
| The greeting takes the first name only | The headline is one line by design and "Ready when you are, Jen O'Brien." came out as "…, J…" | `renderToday()` |
| Flashcard buttons show ← and → | The footer named the space bar and said nothing about the arrow keys that were already working | `renderFlash()` |

---

### 示範 Demo mode

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

## §11 · Growing the curriculum, and milestones

Cantonese Quest went from 146 characters to **300**, in eleven new themed
stages, and gained a celebration every fiftieth character. Hanzi Quest already
has 763 characters and 13 stages, so the *content* does not port — but every
one of the following bit it on the way, and would bite Hanzi Quest the next
time its curriculum grows.

### The numbers that turn out to be hardcoded

Adding characters is not only adding characters. In order of how long each one
took to find:

- **`STAGES[].end` is cumulative and hand-written.** Miss one and
  `STAGES.find(s => i < s.end)` returns `undefined` for every character past
  it, and `ch.stage = …​.n` throws at load with a null-property error that says
  nothing about stages. Recompute the whole column, and have the checker count
  characters per stage rather than trusting the arithmetic.
- **`libFilter.length === 2`** — see §0. The Library's stage filter reads one
  digit of the filter key, so `s10` and up match nothing and quietly return the
  unfiltered library. A regex, `/^s(\d+)$/`, is the whole fix.
- **Prose that states a count.** `js/srs.js` said "all 146", `js/data.js` said
  "the library is 145 characters", `tools/smoke.mjs` said it four times. None
  of them break; all of them become lies. `grep -n` for the old number before
  starting and again at the end.
- **Radical coverage text.** The radicals page said "the other 187 are real" —
  `214 - 27`, typed out. It is `${214 - documented.length}` now.
- **`RAD_THEMES` is a hand-grouped list of radical keys**, with a catch-all for
  anything not in it. The catch-all means new radicals never vanish, but they
  all pile into "Others" until you place them.

### A chip row that scrolls is a chip row that hides things

Twenty-one stage chips came to **2,395px inside a 1,136px row**. It scrolled,
so nothing was broken and nothing looked broken — and half the curriculum sat
off the right-hand edge with no affordance saying so. The five state filters
stayed as chips; the stages became a `<select>` styled as one more chip.

The general shape: **a horizontally scrolling row is fine for five things and a
trap for twenty.** Hanzi Quest's 13 stages are already at the edge of it.

### Checkers earn their keep at scale

Every one of these was caught by a tool rather than by reading:

| checker | what it caught in 154 new entries |
|---|---|
| `check-components` | 3 wrong `comp` claims — and two of them were the checker's fault: `⺮` was missing from its squeezed-radical map, so 答 and 笑 "claimed 竹 which isn't there" |
| `check-jyutping` | 13 sentences with a comma inside the jyutping, 7 words glossed two different ways, 18 readings that disagreed with CC-Canto |
| `check-strokes` | 啲 had no data at all until 的 was added as a component so the fetcher would pull it |
| `audit-strokes` | 11 false "component not in decomposition" notes, from a one-to-one variant map that could not express 肉 → both 月 and ⺼ |
| `smoke` | 189 missing audio clips, a character with no all-taught example word, 3 meanings containing Chinese, and one calibration that had gone stale |

Two of those deserve spelling out, because both are the checker being wrong
rather than the data:

**A variant map wants many forms per key.** `{ "肉": "月" }` cannot also say
`⺼`, and `{ "八": "丷" }` was simply missing. Both audit maps now hold a string
of forms and test `[...forms].some(f => decomp.includes(f))`.

**A threshold calibrated against the library size measures the library.**
`smoke` asserted that 40 rounds of practice touch `HQ.length * 0.6` distinct
characters. The pool deliberately spends 70% of every round inside a
40-character recent window, so the fraction it can reach *falls* as the library
grows — the check was passing at 145 and failing at 300 with the rotation
working perfectly. What it actually wanted was that the 30% reaching back lands
somewhere new nearly every time:

    const older = total - hits;
    ok('rotation spreads across the library', seen.size > recent.size + older * 0.7);

That one holds at any size. **Any threshold with the library's own size in it
should be read twice** — usually it is measuring the wrong thing.

### Composing a glyph needs its parts bundled

`啲` is `口` + `的`, and the composer had both recipes and donors — but `的` was
in neither the curriculum nor any `comp` array, so `fetch-strokes` had never
downloaded it and the composer reported "missing a part". Declaring it as a
component of 啲 (which is also simply true) put it in the fetch list. **The
composer can only use parts the bundle already holds.**

### Milestones

Every fiftieth character, and the last one, stop the session for a moment.

    const MILESTONES = [50, 100, 150, 200, 250, 300];
    const hailed = () => (state.hailed = state.hailed || []);

Four decisions in it, all of which would come up again:

- **Record what was celebrated; do not derive it from the count.** The count
  goes down as well as up — a reset, a character dropped from the curriculum —
  and deriving it congratulates someone twice for the same fifty. There is a
  smoke check that deletes 60 characters and asserts nothing re-arms.
- **Offer the highest passed, not the lowest.** The placement test can credit
  sixty characters at once. A queue of overlays to click through turns the
  moment into a chore, so `markMilestone(m)` marks everything at or below `m`.
- **Placement marks silently.** `hailSilently()` runs in `afterPlacement()`:
  the overlay is for work done, and congratulating somebody for the test they
  have just taken cheapens the five they earn afterwards.
- **One celebratory gesture per app.** The card stamps the number as the same
  red 印章 the session grade uses, at the same `rotate(-7deg)`, with the same
  `stamp` keyframes. Confetti would belong to different software.

The copy names what the characters bought rather than saying well done —
"enough to say hello, count to ten, name the people around you and ask for a
table" instead of "50 characters!". For Hanzi Quest with 763, the natural list
is coarser: probably every hundred, plus the end.

A smoke check compares `MILESTONES` against the keys of `HAIL` in `js/app.js`
as text, because a milestone with no card opens an empty overlay and app.js has
no DOM in the harness.

---

## Do not port these

Cantonese-specific, and wrong for Hanzi Quest:

- **The curriculum order and its contents.** Numbers-and-pictographs first,
  greetings second, 300 characters, five tiers.
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
