# Mon Français — French Vocabulary & Pronunciation Trainer

A personal French trainer focused on **correct pronunciation** and learning the
**3000 most common French words**. Pure HTML/CSS/JS — no build step, no backend.
All progress is stored locally in your browser.

## Run it

Any static file server works. With the included PowerShell server (no installs needed):

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1   # http://localhost:8123
```

Or `npx serve`, `python -m http.server`, GitHub Pages, etc.
(Opening `index.html` directly via `file://` won't work — ES modules need a server.)

## Features

- **3000-word frequency list** built in, with English meaning, part of speech,
  IPA transcription, and real-life topic (grocery, classroom, travel, emotions, …).
  Dashboard tracks `learned / 3000`, weekly progress, weakest words, and the most
  common words you haven't started yet.
- **Document & text input** — drag-and-drop PDF / DOCX / TXT, or paste any French
  text. The app extracts words and sentences, highlights which of the 3000 common
  words appear, and shows coverage.
- **Pronunciation-first cards** — every word has IPA (hand-written for common words,
  rule-generated otherwise), plain-language pronunciation tips, audio from
  Wiktionary/Wikimedia native recordings when available, and French text-to-speech
  as fallback.
- **Memorization mode** — hear the word first, see the transcript, guess the meaning,
  then reveal. Simple Leitner spaced repetition prioritizes words you get wrong.
- **French-only mode** — the whole interface and all pronunciation explanations
  switch to French; English is blurred until you click it.
- **Sentence learning** — extracted sentences are auto-categorized (questions,
  classroom phrases, travel phrases, dialogs, …) with audio and key-word links.
- **Filters** — search by French/English, filter by status, part of speech, topic,
  and frequency band. Word categories are editable per word.
- Progress export/import as JSON in Settings.

## Structure

```
index.html          app shell
css/style.css       styles
js/app.js           UI / views
js/dict.js          3000-word dictionary loader
js/data/words*.js   frequency list data (9 bands)
js/state.js         localStorage state + spaced repetition
js/pronounce.js     rule-based IPA + pronunciation tips (en/fr)
js/audio.js         Wiktionary audio lookup + TTS fallback
js/extract.js       PDF/DOCX/text extraction, sentence categorization
js/flashcards.js    practice session builder
serve.ps1           tiny static server for Windows
```
