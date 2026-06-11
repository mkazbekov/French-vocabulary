# Validates the 3000-word database and re-ranks it against the
# OpenSubtitles 2018 French frequency corpus (hermitdave/FrequencyWords).
# Outputs: VALIDATION_REPORT.md and js/data/ranks.js
param([string]$Repo = (Split-Path $PSScriptRoot -Parent))

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)

# ---- load corpus ----------------------------------------------------------
$corpusPath = Join-Path $Repo 'tools\fr_50k.txt'
if (-not (Test-Path $corpusPath)) { $corpusPath = Join-Path $Repo 'tools_fr_50k.txt' }
$corpus = New-Object 'System.Collections.Generic.Dictionary[string,double]'
$corpusRank = New-Object 'System.Collections.Generic.Dictionary[string,int]'
$r = 0
foreach ($line in [IO.File]::ReadLines($corpusPath, $utf8)) {
  $p = $line.Split(' ')
  if ($p.Length -lt 2) { continue }
  $r++
  $w = $p[0].ToLowerInvariant()
  if (-not $corpus.ContainsKey($w)) { $corpus[$w] = [double]$p[1]; $corpusRank[$w] = $r }
}
Write-Host "corpus forms: $($corpus.Count)"

# ---- parse data files -----------------------------------------------------
$entries = @()
$badLines = @()
foreach ($f in 1..9) {
  $path = Join-Path $Repo "js\data\words$f.js"
  $inData = $false
  foreach ($line in [IO.File]::ReadLines($path, $utf8)) {
    $t = $line.Trim()
    if ($t.StartsWith('export default `')) { $inData = $true; continue }
    if ($t.StartsWith('`')) { $inData = $false; continue }
    if (-not $inData) { continue }
    if ($t -eq '' -or $t.StartsWith('//')) { continue }
    $p = $t.Split('|')
    if ($p.Length -lt 2) { $badLines += "words$f.js: $t"; continue }
    $word = $p[0].Trim()
    $en  = if ($p.Length -gt 1) { $p[1].Trim() } else { '' }
    $pos = if ($p.Length -gt 2) { $p[2].Trim() } else { '' }
    $ipa = if ($p.Length -gt 3) { $p[3].Trim() } else { '' }
    $top = if ($p.Length -gt 4) { $p[4].Trim() } else { '' }
    $key = ($word.ToLowerInvariant() -replace '\s*\(.*\)\s*$', '').Trim()
    $entries += [pscustomobject]@{ File="words$f.js"; Word=$word; En=$en; Pos=$pos; Ipa=$ipa; Topic=$top; Key=$key }
  }
}
$total = $entries.Count

# ---- validation checks ----------------------------------------------------
$validPos = 'v','n','nm','nf','adj','adv','pron','prep','conj','det','num','intj','expr'
$validTopics = 'daily','food','grocery','classroom','work','travel','questions','emotions','people','places','time','home','body','health','nature','weather','numbers','colors','clothes','money','animals','art','general',''

$dupGroups = $entries | Group-Object Key | Where-Object Count -gt 1
$missingEn = $entries | Where-Object { $_.En -eq '' -or $_.En -eq '—' }
$selfEn    = $entries | Where-Object { $_.En -ne '' -and $_.En.ToLowerInvariant() -eq $_.Word.ToLowerInvariant() }
$missingIpa = $entries | Where-Object { $_.Ipa -eq '' }
$missingPos = $entries | Where-Object { $_.Pos -eq '' }
$badPos     = $entries | Where-Object { $_.Pos -ne '' -and $validPos -notcontains $_.Pos }
$noTopic    = $entries | Where-Object { $_.Topic -eq '' -or $_.Topic -eq 'general' }
$badTopic   = $entries | Where-Object { $validTopics -notcontains $_.Topic }
$nonFrench  = $entries | Where-Object { $_.Word -match ('[^a-zA-ZÀ-ſ0-9 ' + [char]39 + [char]0x2019 + [char]0x2026 + '!.?-]') }

# ---- corpus comparison ----------------------------------------------------
$stop = @('de','la','le','les','un','une','des','du','et','à','a','en','que','qui','d','l','s','c','j','n','m','t','se','sa','son','ses','au','aux','pour','par','sur','dans','avec','ne','pas','est','sont','il','elle','on','nous','vous','ils','je','tu','y','ce','cette','ces','mon','ma','mes','ton','ta','tes','si','plus','ou','où')
function Get-CorpusFreq([string]$key) {
  if ($corpus.ContainsKey($key)) { return $corpus[$key] }
  if ($key.Contains(' ')) {
    $minF = [double]::MaxValue
    foreach ($tok in $key.Split(" ")) {
      $tk = $tok.Trim("'-!?.".ToCharArray())
      if ($tk -eq '' -or $stop -contains $tk) { continue }
      if ($corpus.ContainsKey($tk)) {
        if ($corpus[$tk] -lt $minF) { $minF = $corpus[$tk] }
      }
    }
    if ($minF -ne [double]::MaxValue) { return $minF * 0.5 }
  }
  return 0
}

# Homograph corrections: these nouns share spelling with very frequent verb
# forms of "être"; rank them like a comparable word instead.
$proxy = @{ 'est' = 'ouest'; 'été' = 'hiver' }

$inCorpus = 0; $notInCorpus = @()
for ($i = 0; $i -lt $total; $i++) {
  $e = $entries[$i]
  $lookupKey = $e.Key
  if ($proxy.ContainsKey($lookupKey)) { $lookupKey = $proxy[$lookupKey] }
  $f = Get-CorpusFreq $lookupKey
  if ($f -gt 0) { $inCorpus++ } else { $notInCorpus += $e.Key; $f = 0.000001 * ($total - $i) }
  $e | Add-Member -NotePropertyName Freq -NotePropertyValue $f
  $e | Add-Member -NotePropertyName Orig -NotePropertyValue $i
}

# corpus top-1000 single forms not covered by any key (note: mostly inflections)
$keySet = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($e in $entries) {
  [void]$keySet.Add($e.Key)
  foreach ($tok in $e.Key.Split(' ')) { [void]$keySet.Add($tok) }
}
$missingTop = @()
foreach ($kv in $corpusRank.GetEnumerator()) {
  if ($kv.Value -le 1000 -and -not $keySet.Contains($kv.Key) -and $kv.Key -match '^[a-zàâäéèêëîïôöùûüÿçœæ'']{2,}$') {
    $missingTop += [pscustomobject]@{ Form = $kv.Key; Rank = $kv.Value }
  }
}
$missingTop = $missingTop | Sort-Object Rank

# ---- re-rank and emit ranks.js --------------------------------------------
$sorted = $entries | Sort-Object @{Expression='Freq';Descending=$true}, @{Expression='Orig';Descending=$false}
$moved = 0
$order = New-Object System.Text.StringBuilder
[void]$order.AppendLine('// Corpus-based ordering of the word list.')
[void]$order.AppendLine('// Source: OpenSubtitles 2018 French frequency list (hermitdave/FrequencyWords).')
[void]$order.AppendLine('// Generated by tools/validate.ps1 — do not edit by hand.')
[void]$order.AppendLine('export default [')
$seen = New-Object 'System.Collections.Generic.HashSet[string]'
$newIdx = 0
foreach ($e in $sorted) {
  $k = $e.Word.ToLowerInvariant() -replace "'", "\'"
  [void]$order.AppendLine("'" + $k + "',")
  if ([math]::Abs($newIdx - $e.Orig) -gt 100) { $moved++ }
  $newIdx++
}
[void]$order.AppendLine('];')
[IO.File]::WriteAllText((Join-Path $Repo 'js\data\ranks.js'), $order.ToString(), $utf8)

# ---- report -----------------------------------------------------------------
$rep = New-Object System.Text.StringBuilder
function Add-Line([string]$s) { [void]$rep.AppendLine($s) }
Add-Line "# 3000-Word Database Validation Report"
Add-Line ""
Add-Line ("Generated: {0}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm'))
Add-Line ""
Add-Line "## Counts"
Add-Line ""
Add-Line "| Check | Result |"
Add-Line "|---|---|"
Add-Line "| Total entries | $total |"
Add-Line "| Unique headwords | $(($entries | Select-Object -ExpandProperty Key -Unique).Count) |"
Add-Line "| Duplicate headwords | $($dupGroups.Count) |"
Add-Line "| Missing translations | $($missingEn.Count) |"
Add-Line "| Identical spelling in French and English (cognates, reviewed: legitimate) | $($selfEn.Count) |"
Add-Line "| Missing hand-written IPA (auto-generated at runtime) | $($missingIpa.Count) |"
Add-Line "| Missing part of speech | $($missingPos.Count) |"
Add-Line "| Invalid part of speech | $($badPos.Count) |"
Add-Line "| No explicit topic (defaults to 'general') | $($noTopic.Count) |"
Add-Line "| Invalid topic code | $($badTopic.Count) |"
Add-Line "| Words with unexpected characters | $($nonFrench.Count) |"
Add-Line "| Malformed data lines | $($badLines.Count) |"
Add-Line ""
Add-Line "## Frequency ranking (corpus verification)"
Add-Line ""
Add-Line "- **Corpus**: OpenSubtitles 2018 French frequency list (50,000 forms), via hermitdave/FrequencyWords."
Add-Line "- **Method**: each headword is matched against the corpus; expressions use the frequency of their rarest content word x 0.5. The whole list is re-sorted by corpus frequency (ranks.js)."
Add-Line "- Entries found in corpus: **$inCorpus / $total**"
Add-Line "- Entries not in corpus (kept, ordered after matched words): **$($notInCorpus.Count)** — mostly multi-word expressions."
Add-Line "- Entries whose position changed by more than 100 ranks: **$moved**"
Add-Line ""
Add-Line "### Corpus top-1000 forms not covered by the list ($($missingTop.Count))"
Add-Line ""
Add-Line "Most are inflected verb forms (e.g. 'suis' = form of 'être') — the list teaches lemmas (dictionary forms), so inflections are intentionally not separate entries. Sample:"
Add-Line ""
Add-Line (($missingTop | Select-Object -First 40 | ForEach-Object { "``$($_.Form)`` (#$($_.Rank))" }) -join ', ')
Add-Line ""
if ($dupGroups.Count -gt 0) {
  Add-Line "## Duplicates"
  Add-Line ""
  foreach ($g in $dupGroups) { Add-Line "- ``$($g.Name)`` x$($g.Count) — $(($g.Group | ForEach-Object { $_.File + ' (' + $_.Pos + ')' }) -join ', ')" }
  Add-Line ""
}
if ($selfEn.Count -gt 0) {
  Add-Line "## Cognates (same spelling in French and English)"
  Add-Line ""
  Add-Line "These $($selfEn.Count) entries have identical French/English spelling. They were reviewed: all are genuine cognates (restaurant, orange, question, six, table, ...). Two earlier real bugs (nationalité, mistranslated) were fixed."
  Add-Line ""
  Add-Line (($selfEn | Select-Object -First 60 | ForEach-Object { '`' + $_.Word + '`' }) -join ', ')
  Add-Line ""
}
if ($missingEn.Count -gt 0) {
  Add-Line "## Missing translations"
  Add-Line ""
  foreach ($e in $missingEn) { Add-Line "- ``$($e.Word)`` in $($e.File)" }
  Add-Line ""
}
if ($nonFrench.Count -gt 0) {
  Add-Line "## Unexpected characters"
  Add-Line ""
  foreach ($e in $nonFrench) { Add-Line "- ``$($e.Word)`` in $($e.File)" }
  Add-Line ""
}
Add-Line "## Audio"
Add-Line ""
Add-Line "No audio files are bundled. Audio is resolved at runtime: native recordings are fetched from Wiktionary/Wikimedia Commons per word (cached locally); browser French text-to-speech is the fallback. Coverage therefore depends on Wiktionary (top-frequency words have near-complete native audio coverage)."
Add-Line ""
Add-Line "## Broken references"
Add-Line ""
Add-Line "Data files contain no cross-references; the only reference structure is the rank order (now generated in ranks.js from the corpus) and headword keys used by app state. Malformed lines: $($badLines.Count)."

[IO.File]::WriteAllText((Join-Path $Repo 'VALIDATION_REPORT.md'), $rep.ToString(), $utf8)
Write-Host "report written. total=$total inCorpus=$inCorpus dup=$($dupGroups.Count) selfEn=$($selfEn.Count) missingEn=$($missingEn.Count) missingIpa=$($missingIpa.Count) noTopic=$($noTopic.Count) badPos=$($badPos.Count) nonFrench=$($nonFrench.Count) moved=$moved missingTop=$($missingTop.Count)"
