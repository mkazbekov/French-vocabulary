// Dictionary: loads the 3000-word frequency list and exposes lookups.
import b1 from './data/words1.js';
import b2 from './data/words2.js';
import b3 from './data/words3.js';
import b4 from './data/words4.js';
import b5 from './data/words5.js';
import b6 from './data/words6.js';
import b7 from './data/words7.js';
import b8 from './data/words8.js';
import b9 from './data/words9.js';
import RANKS from './data/ranks.js';

export const POS_LABELS = {
  v:    { en: 'verb',        fr: 'verbe' },
  n:    { en: 'noun',        fr: 'nom' },
  nm:   { en: 'noun (m)',    fr: 'nom masculin' },
  nf:   { en: 'noun (f)',    fr: 'nom féminin' },
  adj:  { en: 'adjective',   fr: 'adjectif' },
  adv:  { en: 'adverb',      fr: 'adverbe' },
  pron: { en: 'pronoun',     fr: 'pronom' },
  prep: { en: 'preposition', fr: 'préposition' },
  conj: { en: 'conjunction', fr: 'conjonction' },
  det:  { en: 'determiner',  fr: 'déterminant' },
  num:  { en: 'number',      fr: 'nombre' },
  intj: { en: 'interjection',fr: 'interjection' },
  expr: { en: 'expression',  fr: 'expression' },
};

export const TOPIC_LABELS = {
  daily:     { en: 'daily life',  fr: 'vie quotidienne' },
  food:      { en: 'food',        fr: 'nourriture' },
  grocery:   { en: 'grocery',     fr: 'courses' },
  classroom: { en: 'classroom',   fr: 'salle de classe' },
  work:      { en: 'work',        fr: 'travail' },
  travel:    { en: 'travel',      fr: 'voyage' },
  questions: { en: 'questions',   fr: 'questions' },
  emotions:  { en: 'emotions',    fr: 'émotions' },
  people:    { en: 'people',      fr: 'personnes' },
  places:    { en: 'places',      fr: 'lieux' },
  time:      { en: 'time',        fr: 'temps' },
  home:      { en: 'home',        fr: 'maison' },
  body:      { en: 'body',        fr: 'corps' },
  health:    { en: 'health',      fr: 'santé' },
  nature:    { en: 'nature',      fr: 'nature' },
  weather:   { en: 'weather',     fr: 'météo' },
  numbers:   { en: 'numbers',     fr: 'nombres' },
  colors:    { en: 'colors',      fr: 'couleurs' },
  clothes:   { en: 'clothes',     fr: 'vêtements' },
  money:     { en: 'money',       fr: 'argent' },
  animals:   { en: 'animals',     fr: 'animaux' },
  art:       { en: 'arts & music',fr: 'arts et musique' },
  general:   { en: 'general',     fr: 'général' },
};

// Normalize a French token for lookup: lowercase, normalize apostrophes.
export function norm(w) {
  return (w || '').toLowerCase().replace(/[’ʼ]/g, "'").trim();
}

// Strip a display key like "verre (matière)" down to "verre (matière)" kept,
// but the matchable headword is the part before any parenthesis.
function headword(w) {
  return norm(w).replace(/\s*\(.*\)\s*$/, '').trim();
}

export const WORDS = [];
const byWord = new Map();

// corpus-based order (see tools/validate.ps1): word -> position
const rankOrder = new Map();
RANKS.forEach((w, i) => { if (!rankOrder.has(w)) rankOrder.set(w, i); });

for (const band of [b1, b2, b3, b4, b5, b6, b7, b8, b9]) {
  for (const line of band) {
    const parts = line.split('|');
    if (parts.length < 2) continue;
    const entry = {
      rank: 0,
      word: parts[0].trim(),
      en: (parts[1] || '').trim(),
      pos: (parts[2] || '').trim() || 'n',
      ipa: (parts[3] || '').trim(),
      topic: (parts[4] || '').trim() || 'general',
      key: headword(parts[0]),
    };
    WORDS.push(entry);
  }
}

// Sort by real corpus frequency (OpenSubtitles 2018); entries missing from
// the generated order keep their file position at the end.
WORDS.forEach((e, i) => { e._ord = rankOrder.has(norm(e.word)) ? rankOrder.get(norm(e.word)) : 100000 + i; });
WORDS.sort((a, b) => a._ord - b._ord);
WORDS.forEach((e, i) => { e.rank = i + 1; delete e._ord; });
for (const e of WORDS) { if (!byWord.has(e.key)) byWord.set(e.key, e); }

export const TOTAL = WORDS.length;

export function lookup(word) {
  return byWord.get(norm(word)) || byWord.get(headword(word)) || null;
}

export function posLabel(pos, lang) {
  const l = POS_LABELS[pos];
  return l ? l[lang] || l.en : pos;
}

export function topicLabel(topic, lang) {
  const l = TOPIC_LABELS[topic];
  return l ? l[lang] || l.en : topic;
}

// Broad POS group used for filtering (verbs, nouns, adjectives, ...).
export function posGroup(pos) {
  if (pos === 'nm' || pos === 'nf' || pos === 'n') return 'n';
  return pos;
}
