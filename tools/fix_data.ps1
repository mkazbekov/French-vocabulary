# One-time data cleanup: removes duplicate-sense entries (their meaning is
# merged into the primary entry's gloss), fixes bad translations, and adds
# replacement words to keep the list at exactly 3000 entries.
param([string]$Repo = (Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# entries to delete entirely (first field exact match)
$remove = @('devoir(s)','devoir (nom)','pouvoir (nom)','nom (grammaire)','mort (adj)',
  'fin (adj)','moyen (taille)','souvenir (objet)','froid (nom)','intérêt (banque)',
  'verre (matière)','prêt (nom)','neuf (adj)','ensemble (nom)','naissance (lieu de)',
  'étranger (adj)','souris (informatique)','toucher (émotion)','présent (adj)',
  'quotidien (nom)','minuscule (taille)','entrée (plat)','plat (adj)')

# gloss replacements: first field -> new gloss (merges removed senses)
$gloss = @{
  'pas'        = 'not; step (un pas)'
  'nom'        = 'name; noun'
  'fin'        = 'end; thin, fine (adj)'
  'souvenir'   = 'memory; souvenir'
  'pouvoir'    = 'to be able to, can; power (noun)'
  'devoir'     = 'to have to, must; duty, homework'
  'prêt'       = 'ready; loan (noun)'
  'ensemble'   = 'together; set, whole (noun)'
  'étranger'   = 'foreigner; foreign, abroad'
  'quotidien'  = 'daily; daily life (noun)'
  'plat'       = 'dish, course; flat (adj)'
  'nationalité'= 'nationality'
}

$removed = 0; $fixed = 0
foreach ($f in 1..9) {
  $path = Join-Path $Repo "js\data\words$f.js"
  $out = New-Object System.Collections.Generic.List[string]
  $inData = $false
  foreach ($line in [IO.File]::ReadLines($path, $utf8)) {
    $t = $line.Trim()
    if ($t.StartsWith('export default `')) { $inData = $true; $out.Add($line); continue }
    if ($t.StartsWith('`')) { $inData = $false; $out.Add($line); continue }
    if (-not $inData -or $t -eq '' -or $t.StartsWith('//') -or -not $t.Contains('|')) { $out.Add($line); continue }
    $p = $t.Split('|')
    $head = $p[0].Trim()
    if ($remove -contains $head) { $removed++; continue }
    if ($head -eq 'pas' -and $p[1].Trim() -eq 'step') { $removed++; continue }
    if ($gloss.ContainsKey($head)) {
      $p[1] = $gloss[$head]
      $out.Add(($p -join '|'))
      $fixed++
      continue
    }
    $out.Add($line)
  }
  [IO.File]::WriteAllLines($path, $out, $utf8)
}
Write-Host "removed=$removed glossFixed=$fixed"

# append 24 replacement words (common produce vocabulary, none already present)
$new = @(
  'poire|pear|nf|pwaʁ|grocery'
  'cerise|cherry|nf|səʁiz|grocery'
  'prune|plum|nf|pʁyn|grocery'
  'noix|walnut, nut|nf|nwa|grocery'
  'noisette|hazelnut|nf|nwazɛt|grocery'
  'framboise|raspberry|nf|fʁɑ̃bwaz|grocery'
  'myrtille|blueberry|nf|miʁtij|grocery'
  'pastèque|watermelon|nf|pastɛk|grocery'
  'melon|melon|nm|məlɔ̃|grocery'
  'ananas|pineapple|nm|anana|grocery'
  'abricot|apricot|nm|abʁiko|grocery'
  'aubergine|eggplant|nf|obɛʁʒin|grocery'
  'courgette|zucchini|nf|kuʁʒɛt|grocery'
  'épinard|spinach|nm|epinaʁ|grocery'
  'chou|cabbage|nm|ʃu|grocery'
  'chou-fleur|cauliflower|nm|ʃuflœʁ|grocery'
  'haricot|bean|nm|aʁiko|grocery'
  'petits pois|peas|expr|pəti pwa|grocery'
  'lentille|lentil; lens|nf|lɑ̃tij|grocery'
  'poivron|bell pepper|nm|pwavʁɔ̃|grocery'
  'navet|turnip; flop (film)|nm|navɛ|grocery'
  'radis|radish|nm|ʁadi|grocery'
  'concombre|cucumber|nm|kɔ̃kɔ̃bʁ|grocery'
  'citrouille|pumpkin|nf|sitʁuj|grocery'
)
$p9 = Join-Path $Repo 'js\data\words9.js'
$txt = [IO.File]::ReadAllText($p9, $utf8)
$insert = ($new -join "`n") + "`n"
$txt = $txt -replace "(?s)`n``\.trim\(\)", ("`n" + $insert + '`.trim()')
[IO.File]::WriteAllText($p9, $txt, $utf8)
Write-Host "appended $($new.Count) new entries"
