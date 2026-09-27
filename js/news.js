/* ============================================================
   新 What's new — release notes, written for the person using the app

   One entry per minor version, newest first. Patch releases fold into the
   minor they belong to: forty entries of "a border was the browser's" is a
   commit log, not news. The commit log is still there for the why; these
   say what changed for somebody studying.

   `v` is the minor version ("0.24"), matched against APP_VERSION to decide
   what counts as new. tools/smoke.mjs fails if the top entry's version
   isn't the app's current major.minor — so a minor bump without a note
   here doesn't ship.

   The manual renders these (see js/manual.js), and Today shows a one-line
   strip when there is something newer than you last saw.

   DOM-free at the top level, like manual.js and sprint.js.
   ============================================================ */

const RELEASES = [
  {
    v: "0.24", date: "2026-09-27", title: "Coming back, the manual, and bigger text",
    items: [
      "Welcome back: after a few days away with a pile of reviews waiting, the first session offers the 20 shakiest and spreads the rest over the next few days, shakiest soonest. Your new characters aren't held back, and Undo puts everything back in today.",
      "Rest days: up to two missed days a week leave your streak standing. Nothing to switch on — they show as a dashed outline on both calendars.",
      "What reviewing kept: characters you remembered after two weeks unseen, and ones you'd forgotten and brought back, are counted at the end of a session, in the tracker and on Record.",
      "Settings → Help → How Cantonese Quest works: a full guide to the app, with search and cross-links. Its numbers are read live from the app, so it's always current. It opens with this page.",
      "Settings → Text size: five steps from Default to Largest. The words really get bigger, and buttons and spacing grow with them. Saved on each device, and a phone starts one step up.",
      "On a phone, the menu button is bigger."
    ]
  },
  {
    v: "0.23", date: "2026-09-19", title: "A phone layout, and your progress on every device",
    items: [
      "The app lays out properly on a phone: a menu button in the corner, answers where the thumb is, and a writing square that fits the screen.",
      "Sign in to keep a phone and a laptop in step. Work done on either one is added together.",
      "Report a problem in Settings, and a crashed card now offers a way out instead of freezing the session.",
      "Two-character writing, Build the word as a sprint, handwriting in sprints, pen styles and nib sizes, a writing strictness setting, weekly activity and uneven skills on Record, and a chart on Sprint's board.",
      "Writing practice can be aimed at exactly the characters you choose."
    ]
  },
  {
    v: "0.22", date: "2026-09-19", title: "The day goes shape first",
    items: [
      "Today's practice now runs recognise, read, hear, write — so you've seen a character properly before you're asked to pick it out by sound. Go deeper follows the same order."
    ]
  },
  {
    v: "0.21", date: "2026-09-18", title: "How much of the menu you can read",
    items: [
      "The Menu tab shows how much of the printed menu you can read, counted in ink: every character on the wall, repeats and all. It moves with every session, not only when a menu character comes up."
    ]
  },
  {
    v: "0.20", date: "2026-09-18", title: "300 characters",
    items: [
      "The library doubles to 300 characters, in eleven more stages — paying, the body, the weather, the flat, the market, work, the MTR, feelings — and five tiers instead of two.",
      "Every fiftieth character is celebrated with a seal.",
      "The menu grows in levels as you read more of it, and says what you'll say to the waiter in one row."
    ]
  },
  {
    v: "0.19", date: "2026-09-18", title: "The menu keeps its own books",
    items: [
      "The Menu tab now counts only what it taught you, in the order you meet characters reading down the menu. A character learned anywhere still inks in, but learning one on the menu no longer ticks off the day's list."
    ]
  },
  {
    v: "0.18", date: "2026-09-18", title: "A guide for every tab",
    items: [
      "The ? button opens a short guide to the tab you're on.",
      "The menu's character of the day is always one printed on the menu.",
      "A few sound clips were saying a different word from the card; they now match."
    ]
  },
  {
    v: "0.17", date: "2026-09-18", title: "Placement when it matters",
    items: [
      "Find my level is offered on your first session, and only if you said you already know some Cantonese. A beginner goes straight in.",
      "The space bar no longer gives up on a writing drill for you."
    ]
  },
  {
    v: "0.16", date: "2026-09-18", title: "A proper hello",
    items: [
      "The opening 你好 finishes writing itself before moving on, and the questions about you join it rather than coming as a form."
    ]
  },
  {
    v: "0.15", date: "2026-09-18", title: "The first run",
    items: [
      "A four-stage introduction: a hello written stroke by stroke, what Cantonese is and how characters and tones work, how the app works, and a tour of Today."
    ]
  },
  {
    v: "0.14", date: "2026-09-18", title: "Stroke order for Cantonese characters",
    items: [
      "Eight Cantonese-only characters that no font had stroke data for — 佢, 哋, 冇 and others — can now be animated and written, built from their parts."
    ]
  },
  {
    v: "0.12", date: "2026-09-18", title: "The menu stays on its own list",
    items: [
      "Learning a character on the menu no longer counts toward the day's new characters.",
      "The stroke-order player sits under the character you're tracing instead of covering it."
    ]
  },
  {
    v: "0.11", date: "2026-09-18", title: "Tones, and an introduction to the language",
    items: [
      "聲調, a page that teaches the six tones with characters you'll learn and can hear: 買 maai5 against 賣 maai6 to start.",
      "入門, a primer on the language itself rather than on the app."
    ]
  },
  {
    v: "0.10", date: "2026-09-18", title: "Checked stroke data",
    items: [
      "An audit of every character's stroke data, which corrected the stroke counts shown for three radicals."
    ]
  },
  {
    v: "0.9", date: "2026-09-18", title: "Cleaner type, and menu characters you can find",
    items: [
      "A new heading font.",
      "Menu characters that only appear in what you say to the waiter are now shown with those phrases, so each one has somewhere to be found."
    ]
  },
  {
    v: "0.8", date: "2026-09-18", title: "Radicals, shown rather than explained",
    items: [
      "The Radicals page opens with a worked example — 媽 is 女 for the meaning and 馬 for the sound — then a map of every radical grouped by theme."
    ]
  },
  {
    v: "0.7", date: "2026-09-18", title: "Flashcards on the space bar",
    items: [
      "Flashcards: tap space to hear it, tap twice for the next card, hold to peek at the back.",
      "5 opens the card after a drill, and the tabs are grouped into four."
    ]
  },
  {
    v: "0.6", date: "2026-09-18", title: "The menu on the page",
    items: [
      "Tap a dish on the menu to hear it. The whole menu shows at once, and Learn and Say it out loud both work."
    ]
  },
  {
    v: "0.5", date: "2026-09-18", title: "The teaching card fits the screen",
    items: [
      "On a wider screen a new character's card is laid out in two parts, so you meet it without scrolling.",
      "Writing practice is two exercises: trace a character, or write a whole word."
    ]
  },
  {
    v: "0.4", date: "2026-09-18", title: "An open notebook",
    items: [
      "Today's two blocks become an open notebook on squared paper, and the flashcard decks are one colour at three depths.",
      "Study ahead gives you five more today without changing your daily setting."
    ]
  },
  {
    v: "0.3", date: "2026-09-18", title: "The menu gets a tab",
    items: [
      "The cha chaan teng menu has its own tab, and grows more slowly — levels now wait until you can read enough of the one before.",
      "Today fits on one screen as a dashboard, with the four-week tracker behind the 🔥 chip."
    ]
  },
  {
    v: "0.2", date: "2026-09-18", title: "A first week worth showing up for",
    items: [
      "Characters with no stroke data show in type instead of as an empty square.",
      "The first characters are the simplest to write, and a few readings were corrected."
    ]
  },
  {
    v: "0.1", date: "2026-09-18", title: "The first version",
    items: [
      "Cantonese Quest: spoken Cantonese and traditional characters, taught in the order that gets you through a day in Hong Kong. Sound leads — hearing a character comes before recognising it.",
      "A daily session with spaced review, Go deeper for extra practice, timed sprints with a mistake notebook, and handwriting drills with a 練字 notebook.",
      "Jyutping with tone numbers, recorded clips for every character, a word of the week from your interests, and a cha chaan teng menu to learn to read."
    ]
  }
];

/* "0.24.0" → [0, 24]; compares by major then minor */
const verParts = v => String(v || "0.0").split(".").map(Number);
const verNewer = (a, b) => {
  const [a1, a2] = verParts(a), [b1, b2] = verParts(b);
  return a1 !== b1 ? a1 > b1 : (a2 || 0) > (b2 || 0);
};
const latestRelease = () => RELEASES[0];

/* What's new since `seen`. A record that has never looked gets the latest
   one only — a list of every release since 0.1 is the archive's job. */
function releasesSince(seen) {
  if (!seen) return [latestRelease()];
  const out = RELEASES.filter(r => verNewer(r.v, seen));
  return out.length ? out : [];
}

/* Somebody new to the app has nothing to catch up on: their first look at
   Today is not an update. Only a record with history before this release
   is told about it. */
function newsUnseen() {
  if (state.seenNews == null && !Object.keys(state.chars).length) {
    state.seenNews = latestRelease().v;
    save();
    return false;
  }
  return verNewer(latestRelease().v, state.seenNews || "0.0");
}

function newsSeen() {
  if (state.seenNews === latestRelease().v) return;
  state.seenNews = latestRelease().v;
  save();
}
