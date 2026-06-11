// Mon Français — main application.
import { WORDS, TOTAL, lookup, posLabel, topicLabel, posGroup, POS_LABELS, TOPIC_LABELS } from './dict.js';
import { state, save, wordEntry, setStatus, recordAnswer, statsThisWeek, isDue, addSentence } from './state.js';
import { approxIPA, pronunciationTips } from './pronounce.js';
import { playWord, playSentence, frenchVoices } from './audio.js';
import { extractFromFile, extractWords, extractSentences, sentencesContaining, SENT_CATS } from './extract.js';
import { buildSession, sessionStats } from './flashcards.js';

// ---------- i18n ----------------------------------------------------------
const I18N = {
  nav_dashboard: ['Dashboard', 'Tableau de bord'],
  nav_words: ['Words', 'Mots'],
  nav_practice: ['Practice', 'Entraînement'],
  nav_import: ['Add Text', 'Ajouter un texte'],
  nav_sentences: ['Sentences', 'Phrases'],
  nav_settings: ['Settings', 'Réglages'],
  fr_only: ['French-only', 'Tout en français'],
  goal_title: ['Goal: learn the 3000 most common French words', 'Objectif : apprendre les 3000 mots français les plus fréquents'],
  words_learned: ['words learned', 'mots appris'],
  this_week: ['learned this week', 'appris cette semaine'],
  reviews_week: ['reviews this week', 'révisions cette semaine'],
  accuracy: ['accuracy', 'précision'],
  due_now: ['due for review', 'à réviser'],
  weakest: ['Weakest words', 'Mots les plus difficiles'],
  most_common_unlearned: ['Most common unlearned words', 'Mots fréquents à apprendre'],
  start_practice: ['Start practice', "Commencer l'entraînement"],
  none_yet: ['Nothing here yet — start practicing!', 'Rien ici pour le moment — entraînez-vous !'],
  search: ['Search French or English…', 'Rechercher en français ou en anglais…'],
  all_status: ['All statuses', 'Tous les statuts'],
  all_pos: ['All parts of speech', 'Toutes les catégories'],
  all_topics: ['All topics', 'Tous les thèmes'],
  all_ranks: ['All frequencies', 'Toutes les fréquences'],
  status_new: ['not started', 'pas commencé'],
  status_learning: ['learning', 'en cours'],
  status_known: ['known', 'acquis'],
  rank: ['Rank', 'Rang'],
  word: ['Word', 'Mot'],
  meaning: ['Meaning', 'Sens'],
  type: ['Type', 'Type'],
  topic: ['Topic', 'Thème'],
  status: ['Status', 'Statut'],
  prev: ['Prev', 'Préc.'],
  next: ['Next', 'Suiv.'],
  drop_hint: ['Drop a PDF, DOCX or TXT file here — or click to choose', 'Déposez un fichier PDF, DOCX ou TXT ici — ou cliquez pour choisir'],
  paste_hint: ['…or paste / type French text here', '…ou collez / tapez un texte français ici'],
  analyze: ['Analyze text', 'Analyser le texte'],
  in_list: ['from the 3000 list', 'dans la liste des 3000'],
  not_in_list: ['other words', 'autres mots'],
  sentences_found: ['sentences found', 'phrases trouvées'],
  add_all_sentences: ['Save all sentences', 'Enregistrer toutes les phrases'],
  saved: ['Saved!', 'Enregistré !'],
  listen: ['Listen', 'Écouter'],
  show_transcript: ['Show word', 'Afficher le mot'],
  show_answer: ['Show answer', 'Afficher la réponse'],
  i_was_right: ['I was right', "J'avais raison"],
  i_was_wrong: ['I was wrong', "Je me suis trompé"],
  guess_hint: ['Listen, then guess the meaning', 'Écoutez, puis devinez le sens'],
  card_of: ['Card', 'Carte'],
  session_done: ['Session complete! 🎉', 'Session terminée ! 🎉'],
  correct_count: ['correct', 'justes'],
  again: ['New session', 'Nouvelle session'],
  no_cards: ['No cards available with this filter.', 'Aucune carte avec ce filtre.'],
  example: ['Example', 'Exemple'],
  pron_tips: ['Pronunciation', 'Prononciation'],
  examples_docs: ['Examples from your texts', 'Exemples tirés de vos textes'],
  show_english: ['Show English', "Afficher l'anglais"],
  edit_categories: ['Categories', 'Catégories'],
  key_words: ['Key words', 'Mots clés'],
  no_sentences: ['No sentences yet. Add a text in “Add Text”.', 'Aucune phrase. Ajoutez un texte dans « Ajouter un texte ».'],
  settings_title: ['Settings', 'Réglages'],
  set_fr_only: ['French-only mode', 'Mode tout en français'],
  set_fr_only_d: ['Interface and explanations in French; English hidden until you click.', "Interface et explications en français ; l'anglais est masqué jusqu'au clic."],
  set_rate: ['Speech speed', 'Vitesse de la voix'],
  set_voice: ['French voice', 'Voix française'],
  set_new: ['New words per session', 'Nouveaux mots par session'],
  set_export: ['Export progress (JSON)', 'Exporter la progression (JSON)'],
  set_import: ['Import progress', 'Importer la progression'],
  set_reset: ['Reset all data', 'Tout réinitialiser'],
  confirm_reset: ['Delete ALL progress?', 'Supprimer TOUTE la progression ?'],
  practice_filter: ['Practice:', 'Entraînement :'],
  pf_all: ['All words', 'Tous les mots'],
  pf_top500: ['Top 500', 'Top 500'],
  pf_top1000: ['Top 1000', 'Top 1000'],
  pf_verbs: ['Verbs only', 'Verbes seulement'],
  pf_weak: ['Weak words', 'Mots difficiles'],
  doc_coverage: ['of the 3000 most common words appear in this text', 'des 3000 mots les plus fréquents figurent dans ce texte'],
  uploaded_docs: ['Analyzed texts', 'Textes analysés'],
  band: ['Frequency', 'Fréquence'],
};

function lang() { return state.settings.frOnly ? 'fr' : 'en'; }
function L(key) {
  const e = I18N[key];
  return e ? (state.settings.frOnly ? e[1] : e[0]) : key;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// effective topic / pos for a word (user overrides win)
function effTopic(e) { return state.words[e.key]?.topicOverride || e.topic; }
function effPos(e) { return state.words[e.key]?.posOverride || e.pos; }
function ipaOf(e) { return e.ipa || approxIPA(e.word); }
function statusOf(key) { return state.words[key]?.status || 'new'; }

// English text that respects French-only mode (blurred until clicked)
function enText(text, cls = '') {
  if (!state.settings.frOnly) return `<span class="${cls}">${esc(text)}</span>`;
  return `<span class="hidden-en ${cls}" title="${esc(L('show_english'))}" onclick="this.classList.add('revealed')">${esc(text)}</span>`;
}

// ---------- navigation -----------------------------------------------------
const views = ['dashboard', 'words', 'practice', 'import', 'sentences', 'settings'];
let current = 'dashboard';

function show(view) {
  current = view;
  for (const v of views) {
    document.getElementById('view-' + v).classList.toggle('active', v === view);
  }
  document.querySelectorAll('#nav-tabs .tab').forEach(b =>
    b.classList.toggle('active', b.dataset.view === view));
  render(view);
}

function render(view) {
  ({ dashboard: renderDashboard, words: renderWords, practice: renderPractice,
     import: renderImport, sentences: renderSentences, settings: renderSettings }[view])();
}

function applyI18nChrome() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.childNodes.forEach(n => { if (n.nodeType === 3 && n.textContent.trim()) n.textContent = L(el.dataset.i18n); });
    if (el.dataset.i18n && el.tagName === 'BUTTON') el.textContent = L(el.dataset.i18n);
  });
  const span = document.querySelector('.fr-only-toggle span');
  if (span) span.textContent = L('fr_only');
}

// ---------- dashboard ------------------------------------------------------
function counts() {
  let known = 0, learning = 0;
  for (const e of WORDS) {
    const s = statusOf(e.key);
    if (s === 'known') known++;
    else if (s === 'learning') learning++;
  }
  return { known, learning };
}

function renderDashboard() {
  const { known, learning } = counts();
  const wk = statsThisWeek();
  const { due } = sessionStats();
  const pct = known / TOTAL;
  const C = 2 * Math.PI * 62;

  const weak = WORDS
    .filter(e => { const w = state.words[e.key]; return w && w.wrong > 0 && w.status !== 'known'; })
    .sort((a, b) => (state.words[b.key].wrong - state.words[b.key].correct) -
                    (state.words[a.key].wrong - state.words[a.key].correct))
    .slice(0, 6);

  const unlearned = WORDS.filter(e => statusOf(e.key) === 'new').slice(0, 8);

  let accuracy = '—';
  if (wk.reviews) accuracy = Math.round(100 * wk.correct / wk.reviews) + '%';

  const bands = [[1, 500], [501, 1000], [1001, 2000], [2001, TOTAL]];
  const bandBars = bands.map(([a, b]) => {
    const slice = WORDS.slice(a - 1, b);
    const k = slice.filter(e => statusOf(e.key) === 'known').length;
    return `<div class="mt8"><div class="row" style="font-size:13px"><span>${a}–${b}</span><span class="spacer"></span><span class="badge rank">${k}/${slice.length}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${slice.length ? (100 * k / slice.length) : 0}%"></div></div></div>`;
  }).join('');

  document.getElementById('view-dashboard').innerHTML = `
    <h2>${esc(L('goal_title'))}</h2>
    <p class="sub">🇫🇷 Mon Français</p>
    <div class="card dash-hero">
      <div class="progress-ring">
        <svg width="150" height="150">
          <circle cx="75" cy="75" r="62" fill="none" stroke="var(--line)" stroke-width="12"/>
          <circle cx="75" cy="75" r="62" fill="none" stroke="var(--blue)" stroke-width="12"
                  stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/>
        </svg>
        <div class="ring-label"><span class="big">${known}</span><span class="small">/ ${TOTAL} ${esc(L('words_learned'))}</span></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="num">${wk.learned}</div><div class="lbl">${esc(L('this_week'))}</div></div>
        <div class="stat"><div class="num">${wk.reviews}</div><div class="lbl">${esc(L('reviews_week'))}</div></div>
        <div class="stat"><div class="num">${accuracy}</div><div class="lbl">${esc(L('accuracy'))}</div></div>
        <div class="stat"><div class="num">${due + learning ? due : 0}</div><div class="lbl">${esc(L('due_now'))}</div></div>
      </div>
    </div>
    <div class="grid2">
      <div class="card">
        <h3>⚠️ ${esc(L('weakest'))}</h3>
        ${weak.length ? weak.map(wordRowHTML).join('') : `<div class="empty-note">${esc(L('none_yet'))}</div>`}
      </div>
      <div class="card">
        <h3>⭐ ${esc(L('most_common_unlearned'))}</h3>
        ${unlearned.map(wordRowHTML).join('')}
        <button class="btn primary mt16" id="dash-practice">▶ ${esc(L('start_practice'))}</button>
      </div>
    </div>
    <div class="card"><h3>📊 ${esc(L('band'))}</h3>${bandBars}</div>`;

  document.getElementById('dash-practice').onclick = () => show('practice');
  bindWordRows(document.getElementById('view-dashboard'));
}

function wordRowHTML(e) {
  const st = statusOf(e.key);
  return `<div class="word-row" data-word="${esc(e.key)}">
    <button class="btn-audio" data-audio="${esc(e.word)}">🔊</button>
    <span class="w">${esc(e.word)}</span>
    <span class="m">${state.settings.frOnly ? '·····' : esc(e.en)}</span>
    <span class="badge ${st}">${esc(L('status_' + st))}</span>
  </div>`;
}

function bindWordRows(root) {
  root.querySelectorAll('[data-audio]').forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    playWord(b.dataset.audio);
  });
  root.querySelectorAll('.word-row[data-word]').forEach(r =>
    r.onclick = () => { const e = lookup(r.dataset.word); if (e) openWordCard(e); });
}

// ---------- words view -----------------------------------------------------
const wordsView = { q: '', status: '', pos: '', topic: '', band: '', page: 0 };
const PAGE = 50;

function renderWords() {
  const root = document.getElementById('view-words');
  const posOpts = ['v', 'n', 'adj', 'adv', 'pron', 'prep', 'conj', 'det', 'num', 'intj', 'expr']
    .map(p => `<option value="${p}" ${wordsView.pos === p ? 'selected' : ''}>${esc(posLabel(p, lang()))}</option>`).join('');
  const topicOpts = Object.keys(TOPIC_LABELS)
    .map(t => `<option value="${t}" ${wordsView.topic === t ? 'selected' : ''}>${esc(topicLabel(t, lang()))}</option>`).join('');
  const bands = { '1-500': 'Top 500', '501-1000': '501–1000', '1001-2000': '1001–2000', '2001-9999': '2001+' };
  const bandOpts = Object.entries(bands)
    .map(([v, l]) => `<option value="${v}" ${wordsView.band === v ? 'selected' : ''}>${l}</option>`).join('');

  let list = WORDS.filter(e => {
    if (wordsView.status && statusOf(e.key) !== wordsView.status) return false;
    if (wordsView.pos && posGroup(effPos(e)) !== wordsView.pos) return false;
    if (wordsView.topic && effTopic(e) !== wordsView.topic) return false;
    if (wordsView.band) {
      const [a, b] = wordsView.band.split('-').map(Number);
      if (e.rank < a || e.rank > b) return false;
    }
    if (wordsView.q) {
      const q = wordsView.q.toLowerCase();
      if (!e.word.toLowerCase().includes(q) && !e.en.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  wordsView.page = Math.min(wordsView.page, pages - 1);
  const slice = list.slice(wordsView.page * PAGE, (wordsView.page + 1) * PAGE);

  root.innerHTML = `
    <h2>${esc(L('nav_words'))} <span class="badge rank">${list.length}</span></h2>
    <div class="filters">
      <input type="search" id="w-q" placeholder="${esc(L('search'))}" value="${esc(wordsView.q)}">
      <select id="w-status">
        <option value="">${esc(L('all_status'))}</option>
        ${['new', 'learning', 'known'].map(s => `<option value="${s}" ${wordsView.status === s ? 'selected' : ''}>${esc(L('status_' + s))}</option>`).join('')}
      </select>
      <select id="w-pos"><option value="">${esc(L('all_pos'))}</option>${posOpts}</select>
      <select id="w-topic"><option value="">${esc(L('all_topics'))}</option>${topicOpts}</select>
      <select id="w-band"><option value="">${esc(L('all_ranks'))}</option>${bandOpts}</select>
    </div>
    <div class="card" style="padding:6px 12px; overflow-x:auto">
      <table class="word-table">
        <thead><tr><th>${esc(L('rank'))}</th><th></th><th>${esc(L('word'))}</th><th>IPA</th><th>${esc(L('meaning'))}</th><th>${esc(L('type'))}</th><th>${esc(L('topic'))}</th><th>${esc(L('status'))}</th></tr></thead>
        <tbody>
          ${slice.map(e => {
            const st = statusOf(e.key);
            return `<tr class="clickable" data-word="${esc(e.key)}">
              <td><span class="badge rank">${e.rank}</span></td>
              <td><button class="btn-audio" data-audio="${esc(e.word)}">🔊</button></td>
              <td class="fr">${esc(e.word)}</td>
              <td class="ipa">/${esc(ipaOf(e))}/</td>
              <td>${enText(e.en)}</td>
              <td><span class="badge pos">${esc(posLabel(effPos(e), lang()))}</span></td>
              <td><span class="badge topic">${esc(topicLabel(effTopic(e), lang()))}</span></td>
              <td><span class="badge ${st}">${esc(L('status_' + st))}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    <div class="pager">
      <button class="btn small" id="w-prev" ${wordsView.page === 0 ? 'disabled' : ''}>← ${esc(L('prev'))}</button>
      <span>${wordsView.page + 1} / ${pages}</span>
      <button class="btn small" id="w-next" ${wordsView.page >= pages - 1 ? 'disabled' : ''}>${esc(L('next'))} →</button>
    </div>`;

  const rerender = () => renderWords();
  root.querySelector('#w-q').oninput = e => { wordsView.q = e.target.value; wordsView.page = 0; wordsView.refocus = true; rerender(); };
  for (const id of ['status', 'pos', 'topic', 'band']) {
    root.querySelector('#w-' + id).onchange = e => { wordsView[id] = e.target.value; wordsView.page = 0; rerender(); };
  }
  root.querySelector('#w-prev').onclick = () => { wordsView.page--; rerender(); };
  root.querySelector('#w-next').onclick = () => { wordsView.page++; rerender(); };
  root.querySelectorAll('[data-audio]').forEach(b => b.onclick = ev => { ev.stopPropagation(); playWord(b.dataset.audio); });
  root.querySelectorAll('tr[data-word]').forEach(r =>
    r.onclick = () => { const e = lookup(r.dataset.word); if (e) openWordCard(e); });
  if (wordsView.refocus) {
    wordsView.refocus = false;
    const q = root.querySelector('#w-q');
    q.focus(); q.setSelectionRange(q.value.length, q.value.length);
  }
}

// ---------- word card modal -------------------------------------------------
function openWordCard(e) {
  const st = statusOf(e.key);
  const tips = pronunciationTips(e.word, lang());
  const docExamples = sentencesContaining(state.sentences, e.key);
  const w = state.words[e.key] || {};

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <button class="close-x">×</button>
      <div class="wc-head">
        <button class="btn-audio big" data-audio="${esc(e.word)}">🔊</button>
        <div>
          <div class="wc-word">${esc(e.word)}</div>
          <div class="wc-ipa">/${esc(ipaOf(e))}/</div>
        </div>
        <span class="badge rank">#${e.rank}</span>
      </div>
      <div class="wc-meaning">${enText(e.en)}
        ${state.settings.frOnly ? `<div class="reveal-note">${esc(L('show_english'))} 👆</div>` : ''}
      </div>
      <div class="row">
        <span class="badge pos">${esc(posLabel(effPos(e), lang()))}</span>
        <span class="badge topic">${esc(topicLabel(effTopic(e), lang()))}</span>
        <span class="badge ${st}">${esc(L('status_' + st))}</span>
        ${w.correct || w.wrong ? `<span class="badge">✓ ${w.correct || 0} · ✗ ${w.wrong || 0}</span>` : ''}
      </div>
      <div class="wc-section">
        <h4>${esc(L('pron_tips'))}</h4>
        ${tips.map(t => `<div class="pron-tip">💡 ${esc(t)}</div>`).join('')}
      </div>
      ${docExamples.length ? `
      <div class="wc-section">
        <h4>${esc(L('examples_docs'))}</h4>
        ${docExamples.map(s => `
          <div class="example-block">
            <div class="row"><button class="btn-audio" data-audio-sent="${esc(s.fr)}">🔊</button>
            <span class="fr-ex">${esc(s.fr)}</span></div>
          </div>`).join('')}
      </div>` : ''}
      <div class="wc-section">
        <h4>${esc(L('status'))}</h4>
        <div class="status-picker">
          ${['new', 'learning', 'known'].map(s =>
            `<button class="btn small ${s === st ? 'sel' : ''}" data-status="${s}">${esc(L('status_' + s))}</button>`).join('')}
        </div>
      </div>
      <div class="wc-section">
        <h4>${esc(L('edit_categories'))}</h4>
        <div class="row">
          <select data-edit="pos">
            ${Object.keys(POS_LABELS).map(p => `<option value="${p}" ${effPos(e) === p ? 'selected' : ''}>${esc(posLabel(p, lang()))}</option>`).join('')}
          </select>
          <select data-edit="topic">
            ${Object.keys(TOPIC_LABELS).map(t => `<option value="${t}" ${effTopic(e) === t ? 'selected' : ''}>${esc(topicLabel(t, lang()))}</option>`).join('')}
          </select>
        </div>
      </div>
    </div>`;

  const close = () => overlay.remove();
  overlay.onclick = ev => { if (ev.target === overlay) close(); };
  overlay.querySelector('.close-x').onclick = close;
  overlay.querySelectorAll('[data-audio]').forEach(b => b.onclick = () => playWord(b.dataset.audio));
  overlay.querySelectorAll('[data-audio-sent]').forEach(b => b.onclick = () => playSentence(b.dataset.audioSent));
  overlay.querySelectorAll('[data-status]').forEach(b => b.onclick = () => {
    setStatus(e.key, b.dataset.status);
    close(); render(current);
  });
  overlay.querySelector('[data-edit="pos"]').onchange = ev => {
    wordEntry(e.key).posOverride = ev.target.value; save(); render(current);
  };
  overlay.querySelector('[data-edit="topic"]').onchange = ev => {
    wordEntry(e.key).topicOverride = ev.target.value; save(); render(current);
  };
  document.getElementById('modal-root').appendChild(overlay);
  playWord(e.word);
}

// ---------- practice (memorization mode) ------------------------------------
const practice = { cards: [], i: 0, step: 0, right: 0, filter: 'all', active: false };

const PRACTICE_FILTERS = {
  all: null,
  top500: e => e.rank <= 500,
  top1000: e => e.rank <= 1000,
  verbs: e => posGroup(e.pos) === 'v',
  weak: e => { const w = state.words[e.key]; return w && w.wrong > w.correct; },
};

function renderPractice() {
  const root = document.getElementById('view-practice');
  if (!practice.active) {
    const { due, learning } = sessionStats();
    root.innerHTML = `
      <h2>${esc(L('nav_practice'))}</h2>
      <p class="sub">🔊 ${esc(L('guess_hint'))} · ${due} ${esc(L('due_now'))}</p>
      <div class="card fc-stage">
        <div class="row" style="justify-content:center">
          <label>${esc(L('practice_filter'))}</label>
          <select id="p-filter">
            ${Object.keys(PRACTICE_FILTERS).map(f =>
              `<option value="${f}" ${practice.filter === f ? 'selected' : ''}>${esc(L('pf_' + (f === 'all' ? 'all' : f)))}</option>`).join('')}
          </select>
        </div>
        <button class="btn primary mt16" id="p-start" style="font-size:17px; padding:12px 28px">▶ ${esc(L('start_practice'))}</button>
      </div>`;
    root.querySelector('#p-filter').onchange = e => practice.filter = e.target.value;
    root.querySelector('#p-start').onclick = startSession;
    return;
  }

  if (practice.i >= practice.cards.length) {
    practice.active = false;
    root.innerHTML = `
      <div class="card fc-stage">
        <div class="fc-card">
          <div class="fc-word">${esc(L('session_done'))}</div>
          <div class="fc-meaning">${practice.right} / ${practice.cards.length} ${esc(L('correct_count'))}</div>
          <button class="btn primary" id="p-again">↻ ${esc(L('again'))}</button>
        </div>
      </div>`;
    root.querySelector('#p-again').onclick = startSession;
    return;
  }

  const e = practice.cards[practice.i];
  const docExamples = sentencesContaining(state.sentences, e.key);
  const ex = docExamples[0];
  const step = practice.step; // 0 = audio only, 1 = +transcript, 2 = answer

  root.innerHTML = `
    <div class="fc-stage">
      <div class="fc-progress">${esc(L('card_of'))} ${practice.i + 1} / ${practice.cards.length} · <span class="badge rank">#${e.rank}</span></div>
      <div class="fc-card">
        <button class="btn-audio big" id="fc-audio">🔊</button>
        ${step >= 1 ? `
          <div class="fc-word">${esc(e.word)}</div>
          <div class="fc-ipa">/${esc(ipaOf(e))}/</div>
          <div class="row" style="justify-content:center">
            <span class="badge pos">${esc(posLabel(effPos(e), lang()))}</span>
            <span class="badge topic">${esc(topicLabel(effTopic(e), lang()))}</span>
          </div>` : `<div class="fc-step-hint">${esc(L('guess_hint'))}</div>`}
        ${step >= 2 ? `
          <div class="fc-meaning">${esc(e.en)}</div>
          ${ex ? `<div class="fc-example"><span class="fr-ex">${esc(ex.fr)}</span></div>` : ''}` : ''}
      </div>
      <div class="fc-controls">
        ${step === 0 ? `<button class="btn primary" id="fc-show">${esc(L('show_transcript'))}</button>` : ''}
        ${step === 1 ? `<button class="btn primary" id="fc-answer">${esc(L('show_answer'))}</button>` : ''}
        ${step === 2 ? `
          <button class="btn good" id="fc-right">✓ ${esc(L('i_was_right'))}</button>
          <button class="btn bad" id="fc-wrong">✗ ${esc(L('i_was_wrong'))}</button>` : ''}
      </div>
    </div>`;

  root.querySelector('#fc-audio').onclick = () => playWord(e.word);
  if (step === 0) root.querySelector('#fc-show').onclick = () => { practice.step = 1; renderPractice(); };
  if (step === 1) root.querySelector('#fc-answer').onclick = () => { practice.step = 2; renderPractice(); };
  if (step === 2) {
    root.querySelector('#fc-right').onclick = () => answer(true);
    root.querySelector('#fc-wrong').onclick = () => answer(false);
  }
}

function startSession() {
  practice.cards = buildSession(15, PRACTICE_FILTERS[practice.filter]);
  practice.i = 0; practice.step = 0; practice.right = 0;
  practice.active = practice.cards.length > 0;
  if (!practice.active) { toast(L('no_cards')); renderPractice(); return; }
  renderPractice();
  playWord(practice.cards[0].word);
}

function answer(ok) {
  const e = practice.cards[practice.i];
  recordAnswer(e.key, ok);
  if (ok) practice.right++;
  practice.i++; practice.step = 0;
  renderPractice();
  if (practice.i < practice.cards.length) playWord(practice.cards[practice.i].word);
}

// ---------- import view ------------------------------------------------------
let lastAnalysis = null;

function renderImport() {
  const root = document.getElementById('view-import');
  root.innerHTML = `
    <h2>${esc(L('nav_import'))}</h2>
    <p class="sub">PDF · DOCX · TXT</p>
    <div class="dropzone" id="dz">
      <span class="big-ico">📄</span>
      ${esc(L('drop_hint'))}
      <input type="file" id="file-in" accept=".pdf,.docx,.txt,text/plain" style="display:none">
    </div>
    <div class="mt16">
      <textarea class="paste-box" id="paste-box" placeholder="${esc(L('paste_hint'))}"></textarea>
      <button class="btn primary mt8" id="analyze-btn">🔍 ${esc(L('analyze'))}</button>
    </div>
    <div id="import-results">${lastAnalysis ? '' : ''}</div>
    ${state.documents.length ? `
    <div class="card mt16">
      <h3>📚 ${esc(L('uploaded_docs'))}</h3>
      ${state.documents.slice(-8).reverse().map(d =>
        `<div class="word-row"><span class="w" style="min-width:0">${esc(d.name)}</span>
         <span class="m">${d.matched} / ${TOTAL} · ${new Date(d.addedAt).toLocaleDateString()}</span></div>`).join('')}
    </div>` : ''}`;

  const dz = root.querySelector('#dz');
  const fileIn = root.querySelector('#file-in');
  dz.onclick = () => fileIn.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('dragover'); };
  dz.ondragleave = () => dz.classList.remove('dragover');
  dz.ondrop = e => {
    e.preventDefault(); dz.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };
  fileIn.onchange = () => { if (fileIn.files[0]) handleFile(fileIn.files[0]); };
  root.querySelector('#analyze-btn').onclick = () => {
    const text = root.querySelector('#paste-box').value.trim();
    if (text) analyze(text, 'pasted text ' + new Date().toLocaleString());
  };
  if (lastAnalysis) renderAnalysis();
}

async function handleFile(file) {
  const resEl = document.getElementById('import-results');
  resEl.innerHTML = `<div class="card mt16"><div class="empty-note">⏳ ${esc(file.name)}…</div></div>`;
  try {
    const text = await extractFromFile(file);
    if (!text.trim()) throw new Error('No text found in file.');
    analyze(text, file.name);
  } catch (err) {
    resEl.innerHTML = `<div class="card mt16"><div class="empty-note">❌ ${esc(err.message)}</div></div>`;
  }
}

function analyze(text, sourceName) {
  const words = extractWords(text);
  const sentences = extractSentences(text);
  const matched = words.filter(w => w.entry);
  lastAnalysis = { sourceName, words, sentences, matched };
  state.documents.push({ name: sourceName, addedAt: Date.now(),
                         wordCount: words.length, matched: matched.length });
  if (state.documents.length > 40) state.documents = state.documents.slice(-40);
  save();
  renderAnalysis();
}

function renderAnalysis() {
  const { sourceName, words, sentences, matched } = lastAnalysis;
  const unknown = words.filter(w => !w.entry).slice(0, 40);
  const resEl = document.getElementById('import-results');
  if (!resEl) return;

  resEl.innerHTML = `
    <div class="card mt16">
      <h3>📄 ${esc(sourceName)}</h3>
      <div class="extract-summary">
        <span class="badge known">${matched.length} ${esc(L('in_list'))}</span>
        <span class="badge">${words.length - matched.length} ${esc(L('not_in_list'))}</span>
        <span class="badge topic">${sentences.length} ${esc(L('sentences_found'))}</span>
        <span class="badge rank">${Math.round(100 * matched.length / TOTAL)}% ${esc(L('doc_coverage'))}</span>
      </div>
      <h4 class="mt8">${esc(L('in_list'))}</h4>
      <div class="chip-list">
        ${matched.slice(0, 80).map(w => {
          const st = statusOf(w.entry.key);
          return `<button class="word-chip in3000 ${st === 'known' ? 'known' : ''}" data-word="${esc(w.entry.key)}">${esc(w.entry.word)} <small>×${w.count}</small></button>`;
        }).join('')}
      </div>
      ${unknown.length ? `<h4 class="mt16">${esc(L('not_in_list'))}</h4>
      <div class="chip-list">
        ${unknown.map(w => `<button class="word-chip" data-say="${esc(w.word)}">${esc(w.word)} <small>×${w.count}</small></button>`).join('')}
      </div>` : ''}
      ${sentences.length ? `
      <h4 class="mt16">${esc(L('sentences_found'))} (${sentences.length})</h4>
      <button class="btn primary small" id="add-sent">💾 ${esc(L('add_all_sentences'))}</button>
      <div class="mt8">
        ${sentences.slice(0, 25).map(s => `
          <div class="sent-item">
            <div class="sent-fr"><button class="btn-audio" data-say-sent="${esc(s.fr)}">🔊</button> ${esc(s.fr)}</div>
            <div class="sent-meta"><span class="badge topic">${esc(SENT_CATS[s.cat] ? SENT_CATS[s.cat][lang()] : s.cat)}</span></div>
          </div>`).join('')}
      </div>` : ''}
    </div>`;

  resEl.querySelectorAll('[data-word]').forEach(b =>
    b.onclick = () => { const e = lookup(b.dataset.word); if (e) openWordCard(e); });
  resEl.querySelectorAll('[data-say]').forEach(b => b.onclick = () => playWord(b.dataset.say));
  resEl.querySelectorAll('[data-say-sent]').forEach(b => b.onclick = () => playSentence(b.dataset.saySent));
  const addBtn = resEl.querySelector('#add-sent');
  if (addBtn) addBtn.onclick = () => {
    let n = 0;
    for (const s of lastAnalysis.sentences) {
      if (addSentence({ fr: s.fr, en: '', cat: s.cat, source: lastAnalysis.sourceName })) n++;
    }
    toast(`${L('saved')} (${n})`);
  };
}

// ---------- sentences view ----------------------------------------------------
const sentView = { cat: '' };

function renderSentences() {
  const root = document.getElementById('view-sentences');
  const cats = Object.keys(SENT_CATS);
  let list = state.sentences.slice().reverse();
  if (sentView.cat) list = list.filter(s => s.cat === sentView.cat);

  root.innerHTML = `
    <h2>${esc(L('nav_sentences'))} <span class="badge rank">${list.length}</span></h2>
    <div class="filters">
      <select id="s-cat">
        <option value="">${esc(L('all_topics'))}</option>
        ${cats.map(c => `<option value="${c}" ${sentView.cat === c ? 'selected' : ''}>${esc(SENT_CATS[c][lang()])}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      ${list.length ? list.slice(0, 100).map((s, i) => {
        const keyWords = [];
        for (const t of s.fr.toLowerCase().match(/[a-zàâäéèêëîïôöùûüÿçœæ]+/gi) || []) {
          const e = lookup(t);
          if (e && e.rank > 60 && !keyWords.some(x => x.key === e.key)) keyWords.push(e);
          if (keyWords.length >= 5) break;
        }
        return `<div class="sent-item">
          <div class="sent-fr"><button class="btn-audio" data-say-sent="${esc(s.fr)}">🔊</button> ${esc(s.fr)}</div>
          ${s.en ? `<div class="sent-en">${enText(s.en)}</div>` : ''}
          <div class="sent-meta">
            <span class="badge topic">${esc(SENT_CATS[s.cat] ? SENT_CATS[s.cat][lang()] : s.cat)}</span>
            ${s.source ? `<span class="badge">${esc(s.source)}</span>` : ''}
          </div>
          ${keyWords.length ? `<div class="sent-words chip-list">
            ${keyWords.map(e => `<button class="word-chip in3000" data-word="${esc(e.key)}">${esc(e.word)}</button>`).join('')}
          </div>` : ''}
        </div>`;
      }).join('') : `<div class="empty-note">${esc(L('no_sentences'))}</div>`}
    </div>`;

  root.querySelector('#s-cat').onchange = e => { sentView.cat = e.target.value; renderSentences(); };
  root.querySelectorAll('[data-say-sent]').forEach(b => b.onclick = () => playSentence(b.dataset.saySent));
  root.querySelectorAll('[data-word]').forEach(b =>
    b.onclick = () => { const e = lookup(b.dataset.word); if (e) openWordCard(e); });
}

// ---------- settings -----------------------------------------------------------
function renderSettings() {
  const root = document.getElementById('view-settings');
  const voices = frenchVoices();
  root.innerHTML = `
    <h2>${esc(L('settings_title'))}</h2>
    <div class="card">
      <div class="setting-row">
        <div><strong>${esc(L('set_fr_only'))}</strong><div class="desc">${esc(L('set_fr_only_d'))}</div></div>
        <input type="checkbox" id="set-fronly" ${state.settings.frOnly ? 'checked' : ''}>
      </div>
      <div class="setting-row">
        <div><strong>${esc(L('set_rate'))}</strong><div class="desc">${state.settings.ttsRate.toFixed(1)}×</div></div>
        <input type="range" id="set-rate" min="0.5" max="1.3" step="0.1" value="${state.settings.ttsRate}">
      </div>
      <div class="setting-row">
        <div><strong>${esc(L('set_voice'))}</strong></div>
        <select id="set-voice">
          <option value="">auto</option>
          ${voices.map(v => `<option value="${esc(v.name)}" ${state.settings.ttsVoice === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
        </select>
      </div>
      <div class="setting-row">
        <div><strong>${esc(L('set_new'))}</strong></div>
        <input type="number" id="set-new" min="0" max="15" value="${state.settings.newPerSession}" style="width:70px">
      </div>
      <div class="setting-row">
        <div><strong>${esc(L('set_export'))}</strong></div>
        <div class="row">
          <button class="btn small" id="set-export">⬇ Export</button>
          <button class="btn small" id="set-import">⬆ Import</button>
          <input type="file" id="set-import-file" accept=".json" style="display:none">
        </div>
      </div>
      <div class="setting-row">
        <div><strong style="color:var(--red)">${esc(L('set_reset'))}</strong></div>
        <button class="btn small bad" id="set-reset">🗑</button>
      </div>
    </div>`;

  root.querySelector('#set-fronly').onchange = e => setFrOnly(e.target.checked);
  root.querySelector('#set-rate').oninput = e => { state.settings.ttsRate = +e.target.value; save(); };
  root.querySelector('#set-rate').onchange = () => { renderSettings(); playWord('bonjour'); };
  root.querySelector('#set-voice').onchange = e => { state.settings.ttsVoice = e.target.value; save(); playWord('bonjour'); };
  root.querySelector('#set-new').onchange = e => { state.settings.newPerSession = Math.max(0, +e.target.value || 0); save(); };
  root.querySelector('#set-export').onclick = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'mon-francais-progress.json';
    a.click();
  };
  const impFile = root.querySelector('#set-import-file');
  root.querySelector('#set-import').onclick = () => impFile.click();
  impFile.onchange = async () => {
    try {
      const data = JSON.parse(await impFile.files[0].text());
      Object.assign(state, data);
      save(); toast(L('saved'));
      setTimeout(() => location.reload(), 400);
    } catch { toast('❌ invalid file'); }
  };
  root.querySelector('#set-reset').onclick = () => {
    if (confirm(L('confirm_reset'))) { localStorage.clear(); location.reload(); }
  };
}

function setFrOnly(on) {
  state.settings.frOnly = on;
  save();
  document.getElementById('fr-only-cb').checked = on;
  document.documentElement.lang = on ? 'fr' : 'en';
  applyI18nChrome();
  render(current);
}

// ---------- boot -----------------------------------------------------------
document.querySelectorAll('#nav-tabs .tab').forEach(b => b.onclick = () => show(b.dataset.view));
document.getElementById('fr-only-cb').checked = state.settings.frOnly;
document.getElementById('fr-only-cb').onchange = e => setFrOnly(e.target.checked);
applyI18nChrome();
show('dashboard');
