# 🇫🇷 Start Here — Mon Français

A French vocabulary & pronunciation trainer that teaches you the
**3000 most common French words**, with audio, IPA and smart flashcards.

## How to start (Windows — easiest)

1. Open the app folder.
2. **Double-click `START.bat`.**
3. The app opens in your browser automatically. That's it! 🎉

Keep the black window open while you study; close it when you're done.

> ⚠️ Don't double-click `index.html` directly — browsers block apps opened
> that way. If you do, the app will show you these same instructions.

## How to start (Mac / Linux)

Open a terminal in the app folder and run **one** of these:

```bash
python3 -m http.server 8123     # if you have Python
npx serve -l 8123               # if you have Node.js
```

Then open <http://localhost:8123> in your browser.

## What the app does

- **ROAD TO 3000** — your home screen. Shows words learned, today's target,
  your streak, and one big **START LEARNING** button. Just press it.
- **Levels** — words are ranked by real frequency (film subtitles corpus).
  You progress Level 1 (Top 100) → 2 (500) → 3 (1000) → 4 (2000) → 5 (3000).
- **Practice** — you *hear* a French word first, see its spelling and IPA,
  guess the meaning, then grade yourself. Wrong words come back more often
  (spaced repetition). 🔊 replay · 🐢 slow · 🔁 repeat ×3.
- **Words** — browse and filter all 3000 words (frequency, type, topic, status).
- **Add Text** — drop in a PDF/DOCX or paste French text; the app extracts
  words and sentences and shows which of the 3000 words appear in it.
- **Sentences** — saved sentences with audio, categorized (questions,
  travel phrases, classroom phrases, …).
- **French-only mode** — toggle in the top-right: the whole app switches to
  French and English is hidden until you click it.

Your progress is saved automatically in your browser (no account needed).
Use **Settings → Export** to back it up.

## Need more?

- `README.md` — project overview & technical details
- `VALIDATION_REPORT.md` — quality report for the 3000-word database
