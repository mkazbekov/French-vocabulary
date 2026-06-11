# 3000-Word Database Validation Report

Generated: 2026-06-11 18:07

## Counts

| Check | Result |
|---|---|
| Total entries | 3000 |
| Unique headwords | 3000 |
| Duplicate headwords | 0 |
| Missing translations | 0 |
| Identical spelling in French and English (cognates, reviewed: legitimate) | 169 |
| Missing hand-written IPA (auto-generated at runtime) | 0 |
| Missing part of speech | 0 |
| Invalid part of speech | 0 |
| No explicit topic (defaults to 'general') | 907 |
| Invalid topic code | 0 |
| Words with unexpected characters | 0 |
| Malformed data lines | 0 |

## Frequency ranking (corpus verification)

- **Corpus**: OpenSubtitles 2018 French frequency list (50,000 forms), via hermitdave/FrequencyWords.
- **Method**: each headword is matched against the corpus; expressions use the frequency of their rarest content word x 0.5. The whole list is re-sorted by corpus frequency (ranks.js).
- Entries found in corpus: **2947 / 3000**
- Entries not in corpus (kept, ordered after matched words): **53** — mostly multi-word expressions.
- Entries whose position changed by more than 100 ranks: **2573**

### Corpus top-1000 forms not covered by the list (389)

Most are inflected verb forms (e.g. 'suis' = form of 'être') — the list teaches lemmas (dictionary forms), so inflections are intentionally not separate entries. Sample:

`c'` (#11), `l'` (#16), `j'` (#19), `d'` (#24), `qu'` (#26), `ai` (#28), `n'` (#29), `t'` (#43), `m'` (#48), `s'` (#53), `était` (#56), `as` (#57), `ils` (#59), `veux` (#66), `ma` (#68), `toi` (#69), `dit` (#71), `es` (#74), `cette` (#79), `peux` (#82), `avez` (#85), `vais` (#86), `ton` (#88), `ont` (#94), `sa` (#105), `oh` (#106), `tous` (#108), `peut` (#109), `ces` (#111), `êtes` (#112), `allez` (#113), `ta` (#114), `mes` (#123), `avait` (#125), `dois` (#128), `vu` (#133), `étais` (#137), `quelqu'` (#142), `avais` (#145), `ouais` (#151)

## Cognates (same spelling in French and English)

These 169 entries have identical French/English spelling. They were reviewed: all are genuine cognates (restaurant, orange, question, six, table, ...). Two earlier real bugs (nationalité, mistranslated) were fixed.

`moment`, `table`, `question`, `silence`, `minute`, `train`, `nature`, `cause`, `possible`, `important`, `long`, `simple`, `six`, `fruit`, `orange`, `restaurant`, `menu`, `cousin`, `parents`, `surprise`, `intelligent`, `garage`, `message`, `page`, `bus`, `lion`, `animal`, `village`, `direction`, `sport`, `danger`, `police`, `crime`, `prison`, `justice`, `nation`, `prince`, `radio`, `photo`, `opinion`, `secret`, `discussion`, `conversation`, `double`, `million`, `kilo`, `distance`, `machine`, `science`, `date`, `surface`, `attention`, `intention`, `solution`, `obstacle`, `attitude`, `tradition`, `culture`, `religion`, `courage`

## Audio

No audio files are bundled. Audio is resolved at runtime: native recordings are fetched from Wiktionary/Wikimedia Commons per word (cached locally); browser French text-to-speech is the fallback. Coverage therefore depends on Wiktionary (top-frequency words have near-complete native audio coverage).

## Broken references

Data files contain no cross-references; the only reference structure is the rank order (now generated in ranks.js from the corpus) and headword keys used by app state. Malformed lines: 0.
