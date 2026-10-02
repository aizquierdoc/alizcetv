# Script para descargar imagenes de Unsplash al proyecto
$dir = "frontend\public\mock"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$imgs = @{
  "cw-dune.jpg"        = "https://images.unsplash.com/photo-1778585040075-0991abfd4ed9?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "cw-tlou.jpg"        = "https://images.unsplash.com/photo-1773592612185-bd985ac2bfe2?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "cw-bladerunner.jpg" = "https://images.unsplash.com/photo-1782020934325-cfe4cea4fd9c?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "net-peliculas.jpg"  = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "net-series.jpg"     = "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "net-descargas.jpg"  = "https://images.unsplash.com/photo-1518676590629-3dcba9c5a555?crop=entropy&cs=srgb&fm=jpg&w=800&q=85"
  "poster-1.jpg"       = "https://images.unsplash.com/photo-1478720568477-152d9b164e26?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "poster-2.jpg"       = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "poster-3.jpg"       = "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "poster-4.jpg"       = "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "poster-5.jpg"       = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "poster-6.jpg"       = "https://images.unsplash.com/photo-1542204165-65bf26472b9b?crop=entropy&cs=srgb&fm=jpg&w=600&q=85"
  "arcade.jpg"         = "https://images.unsplash.com/photo-1706466615917-e44750d177d7?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85"
}

$ok = 0
$fail = 0

foreach ($name in $imgs.Keys) {
  $url = $imgs[$name]
  $out = Join-Path $dir $name
  try {
    Invoke-WebRequest -Uri $url -OutFile $out -TimeoutSec 15 -ErrorAction Stop
    $size = [math]::Round((Get-Item $out).Length / 1KB, 1)
    Write-Host "OK   $name ($size KB)" -ForegroundColor Green
    $ok++
  } catch {
    Write-Host "FAIL $name -> $url" -ForegroundColor Red
    $fail++
  }
}

Write-Host ""
Write-Host "Descargadas: $ok / Fallidas: $fail"