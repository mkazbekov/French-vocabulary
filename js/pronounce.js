// Rule-based French grapheme→IPA approximation and pronunciation tips.
// Used as a fallback when no hand-written IPA exists, and to generate
// human-readable pronunciation explanations (in English or French).

const RULES = [
  // [regex (applied on lowercased word), ipa]
  [/eau/g, 'o'], [/au/g, 'o'],
  [/oin/g, 'wɛ̃'],
  [/ain|aim|ein|eim/g, 'ɛ̃'],
  [/tion/g, 'sjɔ̃'],
  [/ille/g, 'ij'], [/ail$/g, 'aj'], [/eil$/g, 'ɛj'], [/euil|ueil/g, 'œj'],
  [/gn/g, 'ɲ'],
  [/qu/g, 'k'], [/q$/g, 'k'],
  [/ch/g, 'ʃ'], [/ph/g, 'f'], [/th/g, 't'],
  [/eux?$/g, 'ø'], [/eu/g, 'œ'], [/œu?/g, 'œ'],
  [/ou/g, 'u'],
  [/oi/g, 'wa'], [/oy/g, 'waj'],
  [/an|am|en|em/g, 'ɑ̃'],
  [/on|om/g, 'ɔ̃'],
  [/un|um$/g, 'œ̃'], [/in|im|yn|ym/g, 'ɛ̃'],
  [/é|ez$|er$|et$/g, 'e'], [/è|ê|ai|ei/g, 'ɛ'],
  [/â/g, 'ɑ'], [/à/g, 'a'],
  [/î|ï/g, 'i'], [/ô/g, 'o'], [/û|ù/g, 'y'],
  [/ç/g, 's'],
  [/j/g, 'ʒ'],
  [/g(?=[eiy])/g, 'ʒ'], [/g/g, 'ɡ'],
  [/c(?=[eiy])/g, 's'], [/c/g, 'k'],
  [/ss/g, 's'], [/s(?=[aeiouy])(?<=[aeiouy]s)/g, 'z'],
  [/h/g, ''],
  [/u/g, 'y'],
  [/y/g, 'i'],
  [/x$/g, ''], [/[dtspz]$/g, ''], [/e$/g, ''],
  [/r/g, 'ʁ'],
];

export function approxIPA(word) {
  let w = (word || '').toLowerCase().replace(/[-']/g, ' ').trim();
  return w.split(/\s+/).map(part => {
    let s = part;
    for (const [re, out] of RULES) s = s.replace(re, out);
    return s;
  }).join(' ');
}

// Pronunciation tips: detect notable French patterns in a word and explain
// them in plain language. Returns [{en, fr}] tips.
const PATTERNS = [
  { re: /eau|au/, en: '"eau"/"au" sounds like "o" in "go" — never like English "ow".', fr: '« eau »/« au » se prononce [o], comme dans « mot ».' },
  { re: /ou/, en: '"ou" sounds like "oo" in "food".', fr: '« ou » se prononce [u], comme dans « loup ».' },
  { re: /oi/, en: '"oi" sounds like "wa" in "watt".', fr: '« oi » se prononce [wa], comme dans « roi ».' },
  { re: /u(?![aeiouns])/, en: 'French "u" [y] has no English equivalent: say "ee" while rounding your lips.', fr: 'Le « u » français [y] : dites « i » en arrondissant les lèvres.' },
  { re: /an|am|en|em/, en: 'Nasal "an/en" [ɑ̃]: air flows through the nose, do not pronounce the N/M.', fr: 'Voyelle nasale « an/en » [ɑ̃] : l\'air passe par le nez, on ne prononce pas le N/M.' },
  { re: /on|om/, en: 'Nasal "on" [ɔ̃]: like "oh" through the nose, the N/M is silent.', fr: 'Voyelle nasale « on » [ɔ̃] : un « o » nasal, le N/M est muet.' },
  { re: /in|im|ain|ein|un/, en: 'Nasal "in/ain/un" [ɛ̃]: like "a" in "cat" through the nose.', fr: 'Voyelle nasale « in/ain/un » [ɛ̃] : prononcée par le nez.' },
  { re: /é|er$|ez$/, en: '"é" (and final -er/-ez) sounds like "ay" in "say" but shorter and without the glide.', fr: '« é » (et -er/-ez final) se prononce [e], bref et net.' },
  { re: /è|ê|ai|ei/, en: '"è/ê/ai" sounds like "e" in "bed".', fr: '« è/ê/ai » se prononce [ɛ], comme dans « mère ».' },
  { re: /ch/, en: '"ch" sounds like English "sh" in "shoe".', fr: '« ch » se prononce [ʃ], comme dans « chat ».' },
  { re: /gn/, en: '"gn" sounds like "ny" in "canyon".', fr: '« gn » se prononce [ɲ], comme dans « montagne ».' },
  { re: /ille|ail|eil/, en: '"ill/ail/eil" usually sounds like "y" in "yes".', fr: '« ill/ail/eil » se prononce généralement [j], comme dans « fille ».' },
  { re: /j|g[eiy]/, en: '"j" (and "g" before e/i/y) sounds like "s" in "measure" [ʒ].', fr: '« j » (et « g » devant e/i/y) se prononce [ʒ], comme dans « jour ».' },
  { re: /qu/, en: '"qu" is just a "k" sound — no "w".', fr: '« qu » se prononce simplement [k].' },
  { re: /h/, en: 'The "h" is always silent in French.', fr: 'Le « h » est toujours muet en français.' },
  { re: /r/, en: 'French "r" [ʁ] is made at the back of the throat, like a soft gargle.', fr: 'Le « r » français [ʁ] se prononce au fond de la gorge.' },
  { re: /eu|œu/, en: '"eu/œu" [ø/œ]: say "ay" with rounded lips.', fr: '« eu/œu » [ø/œ] : dites « é » avec les lèvres arrondies.' },
  { re: /ç/, en: '"ç" always sounds like "s".', fr: '« ç » se prononce toujours [s].' },
  { re: /[dtspxz]$/, en: 'The final consonant is usually silent.', fr: 'La consonne finale est généralement muette.' },
  { re: /e$/, en: 'The final "e" is silent (it just softens the consonant before it).', fr: 'Le « e » final est muet.' },
];

export function pronunciationTips(word, lang = 'en') {
  const w = (word || '').toLowerCase();
  const tips = [];
  for (const p of PATTERNS) {
    if (p.re.test(w)) tips.push(lang === 'fr' ? p.fr : p.en);
    if (tips.length >= 4) break;
  }
  if (!tips.length) {
    tips.push(lang === 'fr'
      ? 'Prononcez chaque syllabe de façon égale, sans accent tonique fort.'
      : 'Pronounce each syllable evenly — French has no strong stress accent.');
  }
  return tips;
}
