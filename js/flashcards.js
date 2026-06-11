// Practice session builder: prioritizes due reviews and weak words,
// then mixes in the most common unlearned words from the 3000 list.
import { WORDS } from './dict.js';
import { state, isDue } from './state.js';

export function buildSession(size = 15, filter = null) {
  const pool = filter ? WORDS.filter(filter) : WORDS;
  const due = [];
  const weak = [];
  const fresh = [];

  for (const e of pool) {
    const w = state.words[e.key];
    if (!w || w.status === 'new') { fresh.push(e); continue; }
    if (w.status === 'known' && !isDue(e.key)) continue;
    if (isDue(e.key)) due.push(e);
    else if (w.status === 'learning' && w.wrong > w.correct) weak.push(e);
  }

  // order: overdue first (lowest box first = weakest), then weak, then new by rank
  due.sort((a, b) => (state.words[a.key].box - state.words[b.key].box) || (a.rank - b.rank));
  weak.sort((a, b) => a.rank - b.rank);
  fresh.sort((a, b) => a.rank - b.rank);

  const maxNew = Math.min(state.settings.newPerSession || 8, size);
  const cards = [...due, ...weak].slice(0, size - Math.min(maxNew, fresh.length));
  for (const f of fresh) {
    if (cards.length >= size) break;
    cards.push(f);
  }
  return cards.slice(0, size);
}

export function sessionStats() {
  let due = 0, learning = 0;
  for (const e of WORDS) {
    const w = state.words[e.key];
    if (!w) continue;
    if (isDue(e.key)) due++;
    if (w.status === 'learning') learning++;
  }
  return { due, learning };
}
