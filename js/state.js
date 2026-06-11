// Persistent app state in localStorage.
const KEY = 'monfrancais.v1';

const DEFAULTS = {
  settings: {
    frOnly: false,          // French-only learning mode
    ttsRate: 0.9,
    ttsVoice: '',           // preferred voice name
    newPerSession: 8,       // new cards mixed into a practice session
    dailyGoal: 20,          // words to practice per day
    onboarded: false,       // quick-start screen shown once
  },
  // word progress, keyed by dictionary key or custom word.
  // { status: 'new'|'learning'|'known', box: 0..5, due: ts, correct, wrong,
  //   lastResult, lastSeen, learnedAt, topicOverride, posOverride }
  words: {},
  customWords: [],          // [{word, en, pos, ipa, topic, source:'doc'}]
  sentences: [],            // [{fr, en, cat, words:[...], source, addedAt}]
  documents: [],            // [{name, addedAt, wordCount, matched}]
  audioCache: {},           // word -> commons audio URL ('' = known missing)
  log: [],                  // [{day:'YYYY-MM-DD', learned, reviews, correct}]
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    return { ...structuredClone(DEFAULTS), ...data,
             settings: { ...DEFAULTS.settings, ...(data.settings || {}) } };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export const state = load();

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { console.warn('save failed', e); }
  }, 200);
}

export function wordEntry(key) {
  if (!state.words[key]) {
    state.words[key] = { status: 'new', box: 0, due: 0, correct: 0, wrong: 0,
                         lastResult: null, lastSeen: 0, learnedAt: 0 };
  }
  return state.words[key];
}

export function setStatus(key, status) {
  const w = wordEntry(key);
  w.status = status;
  if (status === 'known' && !w.learnedAt) w.learnedAt = Date.now();
  if (status !== 'known') w.learnedAt = 0;
  if (status === 'known') w.box = 5;
  if (status === 'new') { w.box = 0; w.due = 0; }
  save();
}

const DAY = 24 * 3600 * 1000;
const BOX_DELAYS = [0, 1, 2, 4, 8, 21]; // days until next review per box

// Record an answer in memorization mode; simple Leitner spaced repetition.
export function recordAnswer(key, ok) {
  const w = wordEntry(key);
  w.lastSeen = Date.now();
  w.lastResult = ok;
  if (ok) {
    w.correct++;
    w.box = Math.min(5, (w.box || 0) + 1);
    if (w.box >= 4 && w.status !== 'known') { w.status = 'known'; w.learnedAt = Date.now(); }
    else if (w.status === 'new') w.status = 'learning';
  } else {
    w.wrong++;
    w.box = Math.max(0, (w.box || 0) - 2);
    if (w.status === 'known') { w.status = 'learning'; w.learnedAt = 0; }
    if (w.status === 'new') w.status = 'learning';
  }
  w.due = Date.now() + BOX_DELAYS[w.box] * DAY;
  logToday(ok);
  save();
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function logToday(ok) {
  let d = state.log.find(l => l.day === todayStr());
  if (!d) { d = { day: todayStr(), reviews: 0, correct: 0 }; state.log.push(d); }
  d.reviews++;
  if (ok) d.correct++;
  if (state.log.length > 400) state.log = state.log.slice(-400);
}

export function statsThisWeek() {
  const weekAgo = Date.now() - 7 * DAY;
  let learned = 0;
  for (const k in state.words) {
    const w = state.words[k];
    if (w.status === 'known' && w.learnedAt >= weekAgo) learned++;
  }
  let reviews = 0, correct = 0;
  for (const l of state.log) {
    if (new Date(l.day + 'T00:00:00').getTime() >= weekAgo - DAY) {
      reviews += l.reviews; correct += l.correct;
    }
  }
  return { learned, reviews, correct };
}

// Consecutive days (ending today or yesterday) with at least one review.
export function streak() {
  const days = new Set(state.log.filter(l => l.reviews > 0).map(l => l.day));
  let n = 0;
  const d = new Date();
  // a streak is still alive if yesterday was practiced but today not yet
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// Words reviewed today vs. the daily goal.
export function todayProgress() {
  const t = state.log.find(l => l.day === todayStr());
  return { reviews: t ? t.reviews : 0, goal: state.settings.dailyGoal || 20 };
}

export function isDue(key) {
  const w = state.words[key];
  return w && w.status !== 'new' && (w.due || 0) <= Date.now();
}

export function addCustomWord(cw) {
  const exists = state.customWords.find(w => w.word === cw.word);
  if (!exists) { state.customWords.push(cw); save(); return true; }
  return false;
}

export function addSentence(s) {
  if (state.sentences.some(x => x.fr === s.fr)) return false;
  state.sentences.push({ ...s, addedAt: Date.now() });
  save();
  return true;
}

export function resetAll() {
  localStorage.removeItem(KEY);
  location.reload();
}
