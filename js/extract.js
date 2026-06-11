// Text extraction from PDF/DOCX/plain text, word tokenization and
// sentence splitting/categorization.
import { lookup, norm } from './dict.js';

const MAX_CHARS = 800_000; // safety cap for very large documents

export async function extractFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return extractPdf(file);
  if (name.endsWith('.docx')) return extractDocx(file);
  if (name.endsWith('.txt') || file.type.startsWith('text/')) return file.text();
  throw new Error('Unsupported file type. Use PDF, DOCX or TXT.');
}

async function extractPdf(file) {
  if (!window.pdfjsLib) throw new Error('PDF library not loaded (check your connection).');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const buf = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
  let out = [];
  let total = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map(i => i.str).join(' ');
    out.push(text);
    total += text.length;
    if (total > MAX_CHARS) break;
  }
  return out.join('\n');
}

async function extractDocx(file) {
  if (!window.mammoth) throw new Error('DOCX library not loaded (check your connection).');
  const buf = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return result.value || '';
}

// ---- Word extraction ----------------------------------------------------
const STOP_SHORT = new Set(['l', 'd', 'j', 'm', 'n', 's', 't', 'c', 'qu']);

export function extractWords(text) {
  const clipped = text.slice(0, MAX_CHARS);
  const tokens = clipped.toLowerCase()
    .replace(/[’ʼ]/g, "'")
    .match(/[a-zàâäéèêëîïôöùûüÿçœæ]+(?:[-'][a-zàâäéèêëîïôöùûüÿçœæ]+)*/gi) || [];
  const freq = new Map();
  for (let t of tokens) {
    // split elisions: l'homme -> homme
    const m = t.match(/^([ldjmnstc]|qu)'(.+)$/);
    if (m) t = m[2];
    if (t.length < 2 || STOP_SHORT.has(t)) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  const words = [];
  for (const [w, count] of freq) {
    const dictEntry = lookup(w);
    words.push({ word: w, count, entry: dictEntry });
  }
  // dictionary matches first (by frequency rank), then unknown words by count
  words.sort((a, b) => {
    if (a.entry && b.entry) return a.entry.rank - b.entry.rank;
    if (a.entry) return -1;
    if (b.entry) return 1;
    return b.count - a.count;
  });
  return words;
}

// ---- Sentence extraction & categorization -------------------------------
const SENT_CATS = {
  question:  { en: 'question',          fr: 'question' },
  classroom: { en: 'classroom phrase',  fr: 'phrase de classe' },
  travel:    { en: 'travel phrase',     fr: 'phrase de voyage' },
  work:      { en: 'work phrase',       fr: 'phrase de travail' },
  dialog:    { en: 'dialog',            fr: 'dialogue' },
  daily:     { en: 'daily conversation',fr: 'conversation quotidienne' },
  grammar:   { en: 'grammar example',   fr: 'exemple de grammaire' },
  expression:{ en: 'useful expression', fr: 'expression utile' },
  statement: { en: 'statement',         fr: 'affirmation' },
};
export { SENT_CATS };

const CAT_HINTS = [
  ['classroom', /\b(classe|professeur|élève|leçon|devoir|cahier|tableau|école|apprend|étudi|exercice|répét|conjugu)\w*/i],
  ['travel', /\b(gare|train|avion|aéroport|hôtel|billet|valise|voyage|touriste|réserv|métro|taxi|passeport|plage)\w*/i],
  ['work', /\b(travail|bureau|réunion|patron|collègue|entreprise|salaire|projet|client|emploi)\w*/i],
  ['daily', /\b(bonjour|salut|merci|s'il (te|vous) plaît|au revoir|ça va|excuse|pardon|bonne (journée|nuit|soirée))\b/i],
  ['expression', /\b(il y a|il faut|avoir (besoin|envie|peur|raison|faim|soif)|quand même|tant (pis|mieux)|bien sûr)\b/i],
];

export function categorizeSentence(fr) {
  const s = fr.trim();
  if (/\?\s*$/.test(s) || /^(est-ce que|qu'est-ce|pourquoi|comment|combien|quand|où|qui|quel)/i.test(s)) return 'question';
  if (/^[-—«"]/.test(s)) return 'dialog';
  for (const [cat, re] of CAT_HINTS) if (re.test(s)) return cat;
  if (/\b(je|tu) (suis|es|ai|as|vais|vas)\b/i.test(s)) return 'daily';
  return 'statement';
}

export function extractSentences(text) {
  const clipped = text.slice(0, MAX_CHARS).replace(/\s+/g, ' ');
  const raw = clipped.match(/[^.!?…]+[.!?…]+/g) || [];
  const seen = new Set();
  const out = [];
  for (let s of raw) {
    s = s.trim();
    const words = s.split(/\s+/);
    if (words.length < 3 || words.length > 30) continue;
    if (!/[a-zàâéèêëîïôùûüçœ]/i.test(s)) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    // key words: dictionary words in the sentence, most frequent first
    const keyWords = [];
    for (const t of s.toLowerCase().match(/[a-zàâäéèêëîïôöùûüÿçœæ]+/gi) || []) {
      const e = lookup(t);
      if (e && e.rank > 60 && !keyWords.some(x => x.key === e.key)) keyWords.push(e);
      if (keyWords.length >= 6) break;
    }
    out.push({ fr: s, cat: categorizeSentence(s), keyWords });
    if (out.length >= 400) break;
  }
  return out;
}

// Find example sentences containing a given dictionary word.
export function sentencesContaining(sentences, key) {
  const re = new RegExp(`(^|[^a-zàâäéèêëîïôöùûüÿçœæ])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zàâäéèêëîïôöùûüÿçœæ]|$)`, 'i');
  return sentences.filter(s => re.test(s.fr)).slice(0, 3);
}
