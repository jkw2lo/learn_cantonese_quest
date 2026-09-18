# Cantonese Quest

A practice notebook for learning to speak and read Cantonese. 146 characters
across ten stages, taught in the order that gets you through a day in Hong Kong
rather than the order a frequency list would give you.

Built from [Hanzi Quest](../Hanzi%20Quest), which teaches Mandarin and
simplified characters. The app — the scheduler, the session, the sprints, the
notebook, the design system — is the same code. The curriculum, the tone
system, the quest and the fonts are not, and this file is mostly about why.

## Running it

No build step, no dependencies.

    node tools/server.mjs         # open http://localhost:8732

## Before you ship a change

    node tools/smoke.mjs
    node tools/check-jyutping.mjs
    node tools/check-components.mjs
    node tools/check-strokes.mjs
    node tools/version.mjs patch

Four checks rather than three. The extra one is the reason the readings can be
trusted — see **The readings** below.

## What's different from Hanzi Quest, and why

### Sound leads

Hanzi Quest opens the day with recognition, which is right for a language most
people meet on a page. Cantonese is the other way round. You meet it spoken —
in a kitchen, on a phone, in a film — and written Cantonese is a niche skill
even in Hong Kong, where formal writing is Standard Chinese and reads nothing
like what anybody says out loud.

So the day opens with 聽力, hearing it. `TODAY_TASKS` puts listening first,
`PRACTICE` does the same, the Sprint tab leads with its listening panel, and
`drillKind` puts `l` in the bag twice from the first review rather than once
from the third. A character you can hear and say is half learnt before you ever
have to recognise the shape.

The skills bar in **Record** was reordered to match: 聽 Hear it, 認 Recognise,
寫 Recall the form, 筆 Write from memory. Same four skills, different order of
importance.

### Traditional characters, with the simplified form shown

Cantonese is written in traditional script across Hong Kong, Macau and most
overseas Cantonese communities. It was never really a choice: the characters
Cantonese needs most — 佢, 哋, 咗, 喺, 冇, 嘅, 唔, 嘢 — only exist in
traditional, so a simplified curriculum would have been half traditional
anyway.

Thirty-seven of the 146 look different on the mainland, and the card shows that
form as a quiet footnote under the meaning. It is a cross-reference and nothing
more: the simplified form is never drilled, never counted, and never what the
app asks you for.

That mapping is **generated**, by `tools/fetch-simplified.mjs`, from Unihan's
`kSimplifiedVariant`. The first version was hand-written and seven of its forty
claims were wrong — five characters given a "simplified form" identical to
themselves, 嚟 given 来 (which simplifies 來, a different character entirely),
and 閒 given 闲 where Unihan says otherwise. None of that is knowable by eye,
which is the whole argument for generating it. `check-jyutping.mjs` now fails if
anyone hand-edits the block back.

Only mappings inside the Basic Multilingual Plane are kept: Unihan's simplified
form for 瞓 is an extension-B character almost no phone can draw, and a
cross-reference nobody can see is worse than none.

### Six tones, written as digits

Jyutping puts the tone on the end of the syllable as a number — `ngo5`, `hai6`,
`jat1` — instead of over a vowel. Everything downstream gets easier: it is
plain ASCII, so it sorts, it searches, and it can be typed on any keyboard.
`toneOf` reads the trailing digit, `toneless` strips it, and the Sprint's typing
mode needs none of pinyin's diacritic-stripping.

There is no neutral tone. Every Cantonese syllable carries one of the six, so a
syllable without a digit is an error rather than a shorthand, and
`check-jyutping.mjs` refuses one.

The contours are drawn rather than named, because three of the six are level
tones that differ only in height — "mid level" and "low level" tell you nothing
about how far apart they are, and two lines at different heights tell you
exactly. The y values are the standard five-point pitch scale: 55, 25, 33, 21,
23, 22.

### The readings, and why there is a fourth checker

Cantonese gives hand-written romanisation far more room to drift than Mandarin
does, because most characters carry a **literary** reading and a **spoken** one,
and the spoken one is usually what you want. Unihan lists 行 as `hang4`; the
street says `haang4`. The same goes for 坐 `zo6`/`co5`, 平 `ping4`/`peng4`, 返
`faan2`/`faan1`, 呢 `nai4`/`ni1`.

So `tools/check-jyutping.mjs` does not simply demand that the file match a
dictionary. It fails on what is unambiguously wrong — a malformed syllable, a
word that does not contain its own character, jyutping whose syllable count
disagrees with the characters it transcribes, the same word read two ways in two
places — and then **prints every divergence from Unihan as a list to read**, so
each one is a choice somebody made rather than a typo nobody caught.

Ten characters deliberately differ from Unihan. Twenty-one words deliberately
differ from CC-Canto, and almost all of them are 變調, the tone changes Cantonese
makes in compounds: 爸爸 is `baa4 baa1` and not `baa1 baa1`, 靚女 is `leng3
neoi2` and not `neoi5`. Both lists print on every run.

**It only checked what it was pointed at.** The first version cross-checked the
curriculum words and the menu and stopped there, so 打冷 sat in the interests
list reading `daa2 laang5` until somebody noticed by ear. CC-Canto had it as
`daa2 laang1` and was right — the 冷 there is a Teochew loan, not the Cantonese
word for cold. It now checks everything the app will ever say aloud, which
caught two more: 加油 as `gaa1 jau2` (油 is `jau4`) and 倒數 as `dou2 sou2`.

**And a list of notes nobody can triage is a list nobody reads.** 打冷 hid inside
a run of twenty-nine unexplained divergences that all looked alike; twenty-eight
were 變調 and one was wrong. Reviewed divergences are now recorded in a
`REVIEWED` map with the reason for each — "reduplicated kin terms take a
low-falling first syllable", "企 is kei2 inside 屋企" — so anything new prints on
its own and fails the run.

Sources, both cached beside the tool and both in `.gitignore`:

- **Unihan** `kCantonese` — one preferred reading for every CJK character.
  Covers all 145 taught characters and all 209 with their components, with no
  gaps.
- **CC-Canto** (CC BY-SA 3.0) — 34,335 entries, and the only open source with
  real Cantonese vocabulary in it. Its glosses are uneven — it defines 睇 as "to
  catch" — so it is a source to check against, never to copy from.

### Ten characters have no stroke data

hanzi-writer's data comes from Make Me a Hanzi, which is built from fonts that
predate written Cantonese being taken seriously as something to typeset. It has
nothing for 佢, 哋, 冇, 喺, 嚟, 嗰, 攰, 咗, 喎 or 啱 — which are, between them,
among the most frequent characters in written Cantonese.

They also broke the first session anybody ran. hanzi-writer fills an empty
mount, so a character it has no data for left the 田字格 simply **blank** — and
because 佢 and 哋 were the third and fourth characters taught, a new learner's
first day showed them two empty squares with a sound and a meaning attached. The
font draws these perfectly well; only the animation needs the data. So
`writerBox` now sets the character in type when there is no data, the
stroke-order and try-writing buttons are hidden rather than left to fail
silently, and the card says plainly why.

Beyond that the app already degraded correctly: no writing drills for those
characters, and `practiceChars("write")` excludes them so the 筆順 bar isn't
permanently short of full. `check-strokes.mjs` carries them in a `KNOWN_GAP`
list and reports them rather than failing — so a *new* character with no data
still fails the check.

### 茶餐廳 instead of a restaurant menu

The side quest is a cha chaan teng: Hong Kong's own invention, a diner serving
Western food reimagined through a Cantonese kitchen, at speed, on a laminated
menu nobody has time to explain to you. It is a genuine test, because the menu
is written in Cantonese shorthand rather than Standard Chinese — 凍 for iced, 少
甜 for less sugar, 走 for hold the.

Hanzi Quest could require that **every** glyph on its menu was a taught
character, because it has 763 of them. Here that would have meant inventing
dishes nobody sells. 菠蘿包, 乾炒牛河 and 羅宋湯 all need characters this library
does not teach, and they are what is actually on the wall.

So the menu stays real, the quest targets only the characters it teaches (25 of
them), and the smoke test asks a different question: is enough of the menu
within reach for the promise to mean anything? The floor is a fifth of the
printed glyphs and at least one readable dish in every section. Inflating that
number by inventing dishes would be measuring the test rather than the learner.

### Two tiers, not three

Hanzi Quest's tiers are the literacy milestones — 200, 500, 1,000. This library
is 145 characters, so it has one door to walk through (過日辰, at 76) and one to
see ahead of you (傾得, at 145). A third would be a locked door with nothing
behind it.

## The curriculum

Ordered by what gets you through a day, not by frequency. A frequency list for
written Cantonese would put 的 and 是 near the top — because most writing in Hong
Kong is Standard Chinese — and you would learn to read a newspaper without being
able to order a coffee.

| | stage | ends | what it covers |
|---|---|---|---|
| 🔢 | 數字 Counting | 16 | The ten numbers and a few pictures — one to five strokes each |
| 👋 | 打招呼 Saying hello | 32 | Hello, good morning, good night, thank you, sorry, goodbye |
| 🧍 | 我哋 Who | 46 | People, counting things, and the particles that hold a sentence together |
| 🍜 | 飲食 Eating | 63 | Ordering: hot or iced, more or less sugar |
| 🗺️ | 去邊度 Places | 81 | Asking where something is, and getting there |
| 🕐 | 幾點 Time | 91 | The clock and the calendar |
| 👨‍👩‍👧 | 屋企人 Family | 102 | The people around you, and the prefix 老 that isn't about age |
| 🏃 | 做乜嘢 Doing | 118 | The verbs a day is made of |
| 📏 | 點形容 Describing | 132 | Small, cheap, tired — and the tone pairs that mean opposite things |
| 💬 | 語氣 Particles | 146 | The little words that carry everything English puts in the voice |

### The opening was reordered twice, for two different reasons

**The first draft ordered by frequency**, which is what a corpus tells you to do
and is the wrong answer. Measured against what a learner could actually *say*,
day one gave you 我哋, 你哋 and 佢哋 — three plural pronouns, and not one thing
you would address to a person. 唔該 and 多謝, the two most useful phrases in the
language, sat at positions 30 and 31: six weeks at five a day before you could
thank anybody.

**So it was reordered around phrases** — 你好 on day one, 唔該 多謝 早晨 on day
two. That fixed the wrong problem. The first sixteen characters then averaged
**8.9 strokes and peaked at 謝, which has seventeen**. For somebody who has never
written a Chinese character, being handed 謝 in week one is not gratifying, it is
a wall.

**The two goals only looked opposed.** Numbers dissolve it: 一二三 are literally
one, two and three strokes, and they are useful in Hong Kong the moment you leave
the house — prices, bus routes, floor numbers, how many you want. The opening is
numbers and pictographs now, with the greetings immediately behind:

| after day | new characters | strokes | what that unlocks |
|---|---|---|---|
| 1 | 一 二 三 四 五 | 1–5 | you can write all five |
| 2 | 六 七 八 九 十 | 2–4 | 二十 · 五月 · 九月 |
| 3 | 人 大 女 月 今 | 2–4 | 大人 · 女人 · 今日 |
| 4 | 你 好 我 係 唔 | 6–10 | 你好 · 唔係 · 唔好 |
| 5 | 該 多 謝 早 晨 | 6–17 | 唔該 · 多謝 · 早晨 |

**2.9 strokes across the first sixteen, against 8.9** — and 你好 still arrives on
day four, 唔該 and 多謝 on day five, against week six in the original.

晨 is the one character added, taking the library from 145 to 146. It exists
solely so 早晨 works — the greeting Hong Kong actually uses far more than 你好,
and the only word 晨 appears in.

A curriculum-order *setting* was considered and rejected. The person who would
have to choose is the one least able to: day one, no prior knowledge, no way to
judge which theory suits them. It would not add a setting so much as a second
curriculum — every guarantee the checkers enforce would have to hold twice — and
it is unchangeable in practice anyway, since the review schedule is keyed to
curriculum position. Fixing the one order was the cheaper and better answer.

The last stage is where Cantonese stops looking like Mandarin with different
sounds. English carries attitude in intonation; Cantonese can't, because pitch
is already spoken for by the tones. So it carries attitude in a set of little
words hung on the end of a sentence — and leaving them off doesn't make you
sound neutral, it makes you sound abrupt.

### What the checks found while it was being written

Every one of these was caught by tooling rather than by reading it back:

- **Six characters had no pairing a learner could ever read** — 早, 肉, 車, 睇,
  瞓, 寫 — so none of them could have driven a gap-fill or build-the-word drill.
- **Six pairings didn't contain their own character.** 哥 was teaching 大佬, 弟
  was teaching 細佬, and 肉 was teaching 叉燒.
- **Eight words were glossed two different ways** under two different characters.
- **Nine component claims were wrong.** 四 claimed 口 where the glyph has 囗; 見
  claimed 人 where it has 儿; 新 claimed 木 where the modern form has 亲; 閒
  claimed a bar across the gate where it has the moon. Three characters claimed
  辵 where every one of them has 辶.
- **Two meanings contained Chinese**, which hands the answer over in a recall
  drill: 該 was glossed "ought to; (in 唔該) please".
- **Two characters were given the wrong reading for the sense being taught** —
  糖 as `tong2`, which is a sweet you can hold rather than sugar.
- **Seven of forty hand-written simplified forms were wrong**, which is what
  moved that block to being generated.
- **Two of the first four characters rendered as an empty box**, because
  hanzi-writer has no data for 佢 or 哋 and nothing fell back to simply drawing
  them. Found by using the app, not by a checker — which is its own lesson.
- **五 characters learned today showed four squares** in the writing practice.
  `todaysWritable()` drops anything without stroke data, which was right, but it
  dropped them silently — so a day containing 佢 or 哋 quietly lost a square. The
  notebook now names what is missing and why.
- **The trackpad kept the pointer lock after the last character was written**,
  capturing the cursor over the two buttons the finishing card had just put on
  screen. It lets go when there is nothing left to write.
- **The menu priced its food in ¥.** It is a Hong Kong diner.
- **The "does this character arrive with a readable pairing" check was asking a
  yes/no question** it could not answer usefully: it could not tell a wait of one
  character from a wait of sixteen, and a wait of one is not a problem — 你 and
  好 cannot both be first. It measures the wait now, which made it stricter:
  characters waiting eleven used to hide inside the same tolerance as 朋 waiting
  for 友.

## Reference glosses

Every Chinese character on screen is hoverable. The tooltip used to come only
from the curriculum, so the **224 characters that appear without being taught**
— in menus, example words, sentences, the word of the week — had no tooltip at
all. On the cha chaan teng menu that is most of it: 44 distinct characters
printed, 13 taught. Hovering 菠蘿包 and being told nothing reads as broken rather
than as out of scope.

`tools/fetch-glosses.mjs` generates a reading and a short sense for all of them.
They are reference only: never drilled, never counted, never scheduled, and the
tooltip says so.

Getting the *sense* right took some care, because both sources write for
lexicographers. CC-Canto numbers its senses and CC-CEDICT appends measure words
and cross-references, so 雞 arrives as "fowl; chicken M: 隻zhī [隻]" and 錢 leads
with "a surname". CC-Canto's single-character entries also lean hard toward the
Cantonese-specific colloquial sense, which is exactly wrong for a reference
gloss — it returned 牛 as "stubborn and unreasonable" when the character on the
menu means cow. So Unihan's `kDefinition` is the primary source and CC-Canto the
fallback, with both put through the same trimming.

## Today is a dashboard, and the menu has a tab

**Today was a scroll.** Everything on it is something you glance at to decide
what to do next, and a page you have to scroll to see your options is a page
that hides half of them. Measured on a 1280×720 laptop: 629 pixels below the
bars, and the page wanted **1451**. The session button, the day's list and the
flashcards were never on screen together.

It is three columns now with Go deeper as a band across the foot — it was
described in its own code comment as a band and then given a column, where it
ate 283px. The one block that grew without bound, the day's character strip, is
clamped to two rows with a **Show all** underneath: at sixty characters it was
362px on its own, more than half the screen.

A second pass took it the rest of the way:

- **The columns are equal height.** They used to size to their contents, so
  three columns of different lengths left a ragged bottom edge with the Go
  deeper band hanging under the shortest of them.
- **Go deeper lost its footer**, folded into a subtitle and a count in the top
  right corner. Its empty state said "no reps yet today", then "0 today", then
  "no reps yet" — three ways of saying nothing.
- **The word of the week reads across** rather than down, with the copy button
  moved into its corner instead of claiming a column of its own.
- **The four-week tracker moved behind the streak chip.** It was a full-width
  sticky bar that opened with 🔥 N, sitting directly under a chip that also said
  🔥 N — two rows of chrome for one fact. Hover the chip, focus it, or tap it.

**672px**, down from 1451. That fits a 1280×720 laptop with room to spare.

## 睇餐牌 The menu, and its pacing

The menu quest lived on Today, fourth on a page you already had to scroll —
the wrong place for the part of the app that is meant to be the reward. A menu
you are slowly able to read is something to go and look at, not something to
scroll past on the way to the session button. It has a tab.

**Its pacing was wrong, and measurably so.** Menu characters are not spread
evenly through the curriculum — they bunch in the Eating stage, where you learn
eight of them in two days. Gating the levels on menu progress alone meant level
2 arrived on **day 8** and level 3 on **day 11**: dish names, then descriptions,
then set lunches, all inside a week, while the learner was fifty characters in
and could read thirteen of the menu's forty-four glyphs. It got denser without
getting more readable, which is the opposite of a reward.

Each level now needs menu progress **and** an overall total, whichever comes
later. The total is what guarantees the pacing, because it advances at exactly
the rate you study and cannot bunch:

| level | needs | arrives |
|---|---|---|
| 1 · dish names only | — | day 1 |
| 2 · with what the waiter says | 20 menu characters and 70 overall | day 14 |
| 3 · full menu, set lunches | 34 menu characters and 115 overall | day 23 |

## 示範 Demo mode

A toggle in **Settings** that opens every tier at once, so the Library lists all
146 characters and any card can be read. Opening a tier and *showing* it turned
out to be two things: the first version patched `unlockedCeiling`, but the
Library asks `tierUnlocked` directly and never consults the ceiling, so tier 2
unlocked and then stayed folded shut behind its caret. The gate is patched in
one place now — `tierUnlocked`, which everything else derives from — and demo
mode expands every tier rather than only the one you are working in. For showing somebody the whole app
without spending six weeks earning the right to.

It does that and nothing else. No character is marked known, nothing is graded,
and the review queue, the streak and the day's record are untouched — turning it
off puts the gate exactly back where it was, because the gate was only ever
computed from your record and the record never moved. While it is on there is an
unmissable red banner across the top, because a gate that is off for a demo and
then forgotten is worse than no gate: the app silently stops behaving the way it
documents.

**To remove it entirely**, set `DEMO_BUILD = false` in `js/srs.js`. The toggle
disappears from Settings, the banner can never render, and `unlockedCeiling`
stops consulting the flag at all — the feature is gone rather than merely off. A
record that had it switched on is unaffected; the flag just sits there ignored.

## Files

    index.html        page shell
    css/app.css       the whole design system
    js/data.js        curriculum, radicals, the cha chaan teng, interests — all the content
    js/strokes.js     bundled stroke-order data (generated, do not hand-edit)
    js/audio.js       bundled Cantonese speech (generated, do not hand-edit)
    js/srs.js         scheduling, streaks, sprint records, storage
    js/sprint.js      the 速練 tab: timed sheets, the boards, the 錯字本
    js/app.js         views, the study session, flashcards, repair rounds
    tools/jyut.mjs            look a character or word up while writing data.js
    tools/fetch-glosses.mjs   regenerate the reference glosses for untaught characters
    tools/check-jyutping.mjs  audit every reading against Unihan and CC-Canto
    tools/fetch-simplified.mjs  regenerate the simplified cross-reference
    tools/fetch-strokes.mjs   regenerate js/strokes.js
    tools/make-audio.mjs      regenerate js/audio.js — `node tools/make-audio.mjs Sinji`
    tools/server.mjs          dev server (UTF-8)
    tools/smoke.mjs           run this after touching js/
    tools/version.mjs         bump the version and re-stamp every asset URL

## The audio

Generated on macOS with **Sinji**, the system `zh_HK` voice, by
`node tools/make-audio.mjs Sinji`. 370 clips, 2.0 MB of speech, bundled as
base64 in `js/audio.js` and fetched after the first render rather than ahead of
it.

**This has not been checked by ear.** The generator rejects a clip shorter than
0.15 seconds, which catches a mute voice, and every taught character has a clip
of real length — but nothing here verifies that Sinji is reading these
characters *correctly in Cantonese*, and it is being handed traditional forms
including ones invented for Cantonese. Before this is used in anger, someone who
speaks Cantonese should listen to a sample, starting with 佢, 哋, 咗, 喺, 冇, 嘅
and 嘢.

## What this doesn't do

- **It teaches characters, not conversation.** There is no grammar explanation
  beyond what fits in a mnemonic, and no dialogue practice.
- **The sentences are Cantonese, but they are one sentence long.** Nothing here
  builds toward a paragraph.
- **146 characters is a beginning.** The structure — stages, tiers, the gate at
  81 — is built to extend, and `check-jyutping.mjs` will hold new entries to the
  same standard as the existing ones.

## Licensing

The code and curriculum are original. Two upstream datasets are used at build
time and neither is redistributed in raw form:

- **Unihan** (Unicode, Inc.) — character readings and variant mappings.
- **CC-Canto** (CC BY-SA 3.0, Pleco Software) — used to check readings, never
  copied into the curriculum.
- **hanzi-writer-data** — stroke paths, bundled into `js/strokes.js`.

`js/audio.js` is macOS speech output. The same caveat Hanzi Quest carries
applies: redistributing Apple's synthesised voice is a grey area, and if you'd
rather it weren't in the repo, add it back to `.gitignore` and regenerate it
locally.
