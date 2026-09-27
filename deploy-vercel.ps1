$projects = @(
  @{ name = "ddc-web-user";    dir = "apps\web-user" },
  @{ name = "ddc-web-store";   dir = "apps\web-store" },
  @{ name = "ddc-web-admin";   dir = "apps\web-admin" },
  @{ name = "ddc-web-website"; dir = "apps\web-website" }
)

foreach ($p in $projects) {
  Write-Host "`n=== Deploying $($p.name) ===" -ForegroundColor Cyan

  # Swap .vercel/project.json at repo root to target this project
  Copy-Item "$($p.dir)\.vercel\project.json" ".vercel\project.json" -Force

  vercel --prod --scope ddc13 --yes 2>&1

  Write-Host "=== Done: $($p.name) ===" -ForegroundColor Green
}
