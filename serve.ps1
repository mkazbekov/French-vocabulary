# Minimal static file server for local development (no Node/Python needed).
# Usage: powershell -ExecutionPolicy Bypass -File serve.ps1 [-Port 8123]
param([int]$Port = 8123)

$root = $PSScriptRoot
$mime = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'
  '.css'='text/css; charset=utf-8';   '.json'='application/json; charset=utf-8'
  '.png'='image/png'; '.jpg'='image/jpeg'; '.svg'='image/svg+xml'
  '.ico'='image/x-icon'; '.woff2'='font/woff2'; '.txt'='text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path -replace '/', '\')
  $full = [IO.Path]::GetFullPath($file)
  if ($full.StartsWith($root) -and (Test-Path $full -PathType Leaf)) {
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $type = $mime[$ext]; if (-not $type) { $type = 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($full)
    $ctx.Response.ContentType = $type
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.Close()
}
