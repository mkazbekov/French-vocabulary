// Audio: native-speaker audio from Wiktionary/Wikimedia Commons when
// available, with browser text-to-speech (fr-FR) as a reliable fallback.
import { state, save } from './state.js';

let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

export function frenchVoices() {
  return voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('fr'));
}

function pickVoice() {
  const fr = frenchVoices();
  if (!fr.length) return null;
  if (state.settings.ttsVoice) {
    const chosen = fr.find(v => v.name === state.settings.ttsVoice);
    if (chosen) return chosen;
  }
  return fr.find(v => /fr[-_]FR/i.test(v.lang)) || fr[0];
}

export function speak(text, slow = false) {
  if (!('speechSynthesis' in window)) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = (state.settings.ttsRate || 0.9) * (slow ? 0.55 : 1);
  const v = pickVoice();
  if (v) u.voice = v;
  speechSynthesis.speak(u);
  return true;
}

// --- Wikimedia Commons audio lookup ------------------------------------
// French Wiktionary pages usually embed a pronunciation file named like
// "Fr-<word>.ogg" or "LL-Q150 (fra)-...-<word>.wav". We query the French
// Wiktionary API (CORS-enabled with origin=*) for audio files on the page,
// then resolve the file to a direct URL. Results are cached in localStorage.

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('http ' + r.status);
  return r.json();
}

async function findCommonsAudio(word) {
  const title = encodeURIComponent(word);
  const api = `https://fr.wiktionary.org/w/api.php?action=query&titles=${title}&prop=images&imlimit=50&format=json&origin=*`;
  const data = await fetchJSON(api);
  const pages = data?.query?.pages || {};
  const page = Object.values(pages)[0];
  const images = page?.images || [];
  const audios = images
    .map(i => i.title)
    .filter(t => /\.(ogg|oga|wav|mp3|flac)$/i.test(t));
  if (!audios.length) return '';
  // Prefer files that contain the word or are standard pronunciation files.
  const wl = word.toLowerCase();
  audios.sort((a, b) => {
    const score = t => {
      const tl = t.toLowerCase();
      let s = 0;
      if (tl.includes(wl)) s -= 2;
      if (/^fichier:(fr|ll)-/i.test(tl)) s -= 1;
      return s;
    };
    return score(a) - score(b);
  });
  const file = audios[0].replace(/^[^:]+:/, ''); // strip "Fichier:" prefix
  const info = await fetchJSON(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(file)}&prop=imageinfo&iiprop=url&format=json&origin=*`);
  const p = Object.values(info?.query?.pages || {})[0];
  return p?.imageinfo?.[0]?.url || '';
}

let currentAudio = null;

// Play the best available audio for a French word.
// Returns 'native' if real audio played, 'tts' for speech synthesis.
export async function playWord(word, slow = false) {
  const key = word.toLowerCase();
  let url = state.audioCache[key];
  if (url === undefined) {
    try { url = await findCommonsAudio(word); }
    catch { url = ''; }
    state.audioCache[key] = url;
    save();
  }
  if (url) {
    try {
      if (currentAudio) currentAudio.pause();
      currentAudio = new Audio(url);
      currentAudio.playbackRate = slow ? 0.6 : 1;
      await currentAudio.play();
      return 'native';
    } catch { /* fall through to TTS */ }
  }
  speak(word, slow);
  return 'tts';
}

// Play a word N times with a pause between repetitions (repeat mode).
export async function repeatWord(word, times = 3, slow = false) {
  for (let i = 0; i < times; i++) {
    await playWord(word, slow);
    await new Promise(r => setTimeout(r, slow ? 1600 : 1100));
  }
}

export function playSentence(text, slow = false) {
  speak(text, slow);
}
