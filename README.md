# 🇫🇷 Mon Français — French Vocabulary & Pronunciation Trainer

Learn the **3000 most common French words** with native audio, IPA
transcriptions, pronunciation tips and spaced-repetition flashcards.
Runs entirely in your browser — no account, no install, no build step.

**➡️ New here? Read [START_HERE.md](START_HERE.md) — on Windows just double-click `START.bat`.**

## Features

- **ROAD TO 3000** dashboard — words learned, daily target, streak,
  estimated finish date, and one big START LEARNING button.
- **5 levels** — Top 100 → 500 → 1000 → 2000 → 3000, ordered by *real*
  corpus frequency (OpenSubtitles 2018, see below).
- **Pronunciation first** — every word has IPA (hand-written for common
  words, rule-generated otherwise), rule-based pronunciation explanations
  (in English or French), native recordings from Wiktionary/Wikimedia
  Commons when available, and French TTS fallback. Replay 🔊, slow 🐢 and
  repeat ×3 🔁 controls everywhere.
- **Listening-first flashcards** — hear the word, guess the meaning, grade
  yourself. Simple Leitner spaced repetition prioritizes weak words.
- **Document import** — drag-and-drop PDF/DOCX/TXT or paste any French
  text; the app extracts words & sentences, shows which of the 3000 words
  appear, and uses your texts as example sentences.
- **Sentence learning** — auto-categorized sentences (questions, dialogs,
  travel/classroom/work phrases, …) with audio and key-word links.
- **French-only mode** — full French interface, English blurred until clicked.
- **Filters** — search French/English; filter by status, part of speech,
  topic, frequency band. Categories editable per word.
- Progress saved in localStorage; export/import as JSON in Settings.

## Word database

- 3000 curated entries: French word, English meaning, part of speech, IPA,
  topic category.
- Ranked by the **OpenSubtitles 2018 French frequency corpus**
  ([hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords));
  2947/3000 headwords matched directly, expressions ranked by their rarest
  content word. See [VALIDATION_REPORT.md](VALIDATION_REPORT.md) for the
  full audit (duplicates, translations, IPA, categories, …).
- Regenerate the report/ranking: `powershell -File tools/validate.ps1`
  (requires `tools/fr_50k.txt` from the repo above).

## Running

| Platform | How |
|---|---|
| Windows | double-click **START.bat** |
| Mac/Linux | `python3 -m http.server 8123` in the folder, open <http://localhost:8123> |
| Any | any static file server pointed at the repo root |

The app must be served over HTTP (ES modules don't work from `file://`);
opening `index.html` directly shows friendly instructions instead of a
blank page.

## Structure

```
index.html          app shell + startup guard (never a blank screen)
css/style.css       styles
js/app.js           UI / views (Road to 3000, practice, import, …)
js/dict.js          3000-word dictionary loader (corpus-ranked)
js/data/words*.js   word list data (9 files)
js/data/ranks.js    corpus-based ordering (generated)
js/state.js         localStorage state, spaced repetition, streak
js/pronounce.js     rule-based IPA + pronunciation tips (en/fr)
js/audio.js         Wiktionary audio lookup + TTS fallback, slow/repeat
js/extract.js       PDF/DOCX/text extraction, sentence categorization
js/flashcards.js    practice session builder
serve.ps1           tiny static server (Windows, no installs)
START.bat           one-click launcher (Windows)
tools/validate.ps1  database audit + corpus re-ranking
```

## Known limitations

- Word matching is exact (lemma) — inflected forms in imported texts
  (e.g. *mangeons*) are not yet linked to their lemma (*manger*).
- Native audio depends on Wiktionary coverage and an internet connection;
  offline you get TTS only.
- English glosses are short hints, not full dictionary definitions.
