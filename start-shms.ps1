# ==========================================================
# SHMS Enterprise Auto Deployment Script
# Author  : Bandhav
# Version : V6 Production
# ==========================================================

# ---------------- CONFIGURATION ----------------

$Repo = "bandhav100/Server-Health-Monitoring-System"
$RepoPath = "C:\Users\bandh\OneDrive\Desktop\New Folder"

$GH = "C:\Program Files\GitHub CLI\gh.exe"
$Cloudflared = "cloudflared"

$FrontendPort = 5173
$BackendPort = 8081

$CloudflareLog = "$RepoPath\cloudflare.log"

Set-Location $RepoPath
Clear-Host

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " SHMS Enterprise Auto Deployment Started " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# ==========================================================
# STEP 1 - START DOCKER CONTAINERS
# ==========================================================

Write-Host "[1/8] Starting Docker Containers..." -ForegroundColor Yellow

docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose failed." -ForegroundColor Red
    exit
}

Write-Host "Docker Containers Running." -ForegroundColor Green
docker ps

# ==========================================================
# STEP 2 - CHECK FRONTEND
# ==========================================================

Write-Host ""
Write-Host "[2/8] Checking Frontend..." -ForegroundColor Yellow

$FrontendURL = "http://localhost:$FrontendPort"

try {
    Invoke-WebRequest $FrontendURL -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "Frontend Running Successfully." -ForegroundColor Green
}
catch {
    Write-Host "Frontend is NOT running." -ForegroundColor Red
    Write-Host ""
    Write-Host "Start frontend first:" -ForegroundColor Cyan
    Write-Host "cd frontend"
    Write-Host "npm install"
    Write-Host "npm run dev"
    exit
}

# ==========================================================
# STEP 3 - RESTART CLOUDFLARE TUNNEL
# ==========================================================

Write-Host ""
Write-Host "[3/8] Restarting Cloudflare Tunnel..." -ForegroundColor Yellow

taskkill /F /IM cloudflared.exe 2>$null | Out-Null
Remove-Item $CloudflareLog -ErrorAction SilentlyContinue

Start-Sleep 2

Start-Process `
    -FilePath $Cloudflared `
    -ArgumentList "tunnel --url http://localhost:$FrontendPort --logfile `"$CloudflareLog`"" `
    -WindowStyle Hidden

Write-Host "Waiting for Cloudflare Tunnel..."
Start-Sleep 10

if (!(Test-Path $CloudflareLog)) {
    Write-Host "Cloudflare Log File Missing." -ForegroundColor Red
    exit
}

$TunnelURL = (
    Get-Content $CloudflareLog |
    Select-String "https://[-a-zA-Z0-9.]*trycloudflare.com"
).Matches.Value | Select-Object -First 1

if (!$TunnelURL) {
    Write-Host "Cloudflare URL Not Found." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Cloudflare Tunnel URL :" -ForegroundColor Green
Write-Host $TunnelURL -ForegroundColor Cyan

# ==========================================================
# STEP 4 - UPDATE GITHUB SECRET / VARIABLE / WEBSITE
# ==========================================================

Write-Host ""
Write-Host "[4/8] Updating GitHub..." -ForegroundColor Yellow

# Update GitHub Secret
& $GH secret set FRONTEND_URL `
    --repo $Repo `
    --body $TunnelURL

# Update GitHub Variable
& $GH variable set FRONTEND_LINK `
    --repo $Repo `
    --body $TunnelURL

# Update GitHub About -> Website
& $GH repo edit $Repo --homepage $TunnelURL

Write-Host "GitHub Secret Updated." -ForegroundColor Green
Write-Host "GitHub Variable Updated." -ForegroundColor Green
Write-Host "GitHub About Website Updated." -ForegroundColor Green
# ==========================================================
# STEP 5 - AUTO COMMIT (Commit Count Increase)
# ==========================================================

Write-Host ""
Write-Host "[5/8] Creating Git Commit..." -ForegroundColor Yellow

$CommitTime = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$CommitMessage = "chore: SHMS tunnel refresh ($CommitTime)"

git add .

git commit --allow-empty -m $CommitMessage

Write-Host "Commit Created Successfully." -ForegroundColor Green
Write-Host $CommitMessage -ForegroundColor Cyan

# ==========================================================
# STEP 6 - PULL LATEST FROM GITHUB
# ==========================================================

Write-Host ""
Write-Host "[6/8] Syncing Repository..." -ForegroundColor Yellow

git pull --rebase origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git Pull/Rebase Failed." -ForegroundColor Red
    exit
}

Write-Host "Repository Synced Successfully." -ForegroundColor Green

# ==========================================================
# STEP 7 - PUSH TO GITHUB
# ==========================================================

Write-Host ""
Write-Host "[7/8] Pushing to GitHub..." -ForegroundColor Yellow

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git Push Failed." -ForegroundColor Red
    exit
}

Write-Host "GitHub Updated Successfully." -ForegroundColor Green

# ==========================================================
# STEP 8 - DEPLOYMENT SUMMARY
# ==========================================================

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " SHMS Deployment Completed Successfully " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "Live Frontend URL :" -ForegroundColor Yellow
Write-Host $TunnelURL -ForegroundColor Cyan

Write-Host ""
Write-Host "Local Services" -ForegroundColor Yellow
Write-Host "Frontend   : http://localhost:5173" -ForegroundColor White
Write-Host "Backend    : http://localhost:8081" -ForegroundColor White
Write-Host "Grafana    : http://localhost:3000" -ForegroundColor White
Write-Host "Prometheus : http://localhost:9090" -ForegroundColor White

Write-Host ""
Write-Host "Docker Containers" -ForegroundColor Yellow
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

Write-Host ""
Write-Host "GitHub Repository :" -ForegroundColor Yellow
Write-Host "https://github.com/bandhav100/Server-Health-Monitoring-System" -ForegroundColor Cyan

Write-Host ""
Write-Host "GitHub About Website Updated." -ForegroundColor Green
Write-Host "Cloudflare URL Updated." -ForegroundColor Green
Write-Host "New Commit Created and Pushed." -ForegroundColor Green

Write-Host ""
Write-Host "SHMS Enterprise Deployment Finished Successfully!" -ForegroundColor Green