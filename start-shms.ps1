# ==========================================================
# SHMS Enterprise Auto Deployment Script
# Author  : Bandhav
# Version : V9 FINAL PRODUCTION
# ==========================================================

# ---------------- CONFIGURATION ----------------

$Repo = "bandhav100/Server-Health-Monitoring-System"
$RepoPath = "C:\Users\bandh\OneDrive\Desktop\New Folder"

$GH = "C:\Program Files\GitHub CLI\gh.exe"
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"

$FrontendPort = 5173
$BackendPort = 8081

$FrontendPath = Join-Path $RepoPath "frontend"
$CloudflareLog = Join-Path $RepoPath "cloudflare.log"

# ---------------- START ----------------

Set-Location $RepoPath
Clear-Host

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " SHMS Enterprise Auto Deployment Started " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

# ==========================================================
# STEP 0 - WAIT FOR DOCKER DESKTOP
# ==========================================================

Write-Host "[0/8] Waiting for Docker Desktop..." -ForegroundColor Yellow

$DockerReady = $false

for ($i=1; $i -le 36; $i++) {

    docker info > $null 2>&1

    if ($LASTEXITCODE -eq 0) {
        $DockerReady = $true
        break
    }

    Write-Host "Docker not ready... Retry $i/36"
    Start-Sleep 5
}

if (-not $DockerReady) {
    Write-Host "Docker Desktop failed to start." -ForegroundColor Red
    exit
}

Write-Host "Docker Desktop Ready." -ForegroundColor Green

# ==========================================================
# STEP 1 - START DOCKER CONTAINERS
# ==========================================================

Write-Host ""
Write-Host "[1/8] Starting Docker Containers..." -ForegroundColor Yellow

docker compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker Compose failed." -ForegroundColor Red
    exit
}

Write-Host "Docker Containers Running." -ForegroundColor Green

# ==========================================================
# STEP 2 - VERIFY FRONTEND
# ==========================================================

Write-Host ""
Write-Host "[2/8] Checking Frontend..." -ForegroundColor Yellow

$FrontendURL = "http://localhost:5173"

try {
    Invoke-WebRequest $FrontendURL -UseBasicParsing -TimeoutSec 5 | Out-Null
    Write-Host "Frontend Running Successfully." -ForegroundColor Green
}
catch {
    Write-Host "Frontend is not reachable." -ForegroundColor Red
    exit
}
# ==========================================================
# STEP 3 - VERIFY BACKEND CONTAINER
# ==========================================================

Write-Host ""
Write-Host "[3/8] Checking Backend..." -ForegroundColor Yellow

$BackendPort = 5000
$BackendReady = $false

for ($i = 1; $i -le 20; $i++) {

    $portListening = Test-NetConnection -ComputerName localhost -Port $BackendPort -WarningAction SilentlyContinue

    if ($portListening.TcpTestSucceeded) {
        $BackendReady = $true
        break
    }

    Write-Host "Waiting for backend... ($i/20)"
    Start-Sleep 3
}

if (-not $BackendReady) {
    Write-Host "Backend container is not listening on port 5000." -ForegroundColor Red
    exit
}

Write-Host "Backend Running Successfully." -ForegroundColor Green

# ==========================================================
# STEP 4 - START CLOUDFLARE TUNNEL (FIXED)
# ==========================================================

Write-Host ""
Write-Host "[4/8] Starting Cloudflare Tunnel..." -ForegroundColor Yellow

# Kill old tunnel if running
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

# Delete old log
if (Test-Path $CloudflareLog) {
    Remove-Item $CloudflareLog -Force
}

Start-Sleep 2

# Start new Cloudflare tunnel
Start-Process `
    -FilePath $Cloudflared `
    -ArgumentList "tunnel --url http://localhost:5173 --logfile `"$CloudflareLog`"" `
    -NoNewWindow:$false `
    -WindowStyle Hidden

Write-Host "Waiting for Cloudflare URL..."

$TunnelURL = $null

for ($i = 1; $i -le 30; $i++) {

    Start-Sleep 2

    if (Test-Path $CloudflareLog) {

        $TunnelURL = (
            Get-Content $CloudflareLog |
            Select-String "https://[-a-zA-Z0-9.]*trycloudflare.com"
        ).Matches.Value | Select-Object -Last 1
    }

    if ($TunnelURL) {
        break
    }

    Write-Host "Retry $i/30"
}

if (-not $TunnelURL) {
    Write-Host "Cloudflare URL generation failed." -ForegroundColor Red

    if (Test-Path $CloudflareLog) {
        Write-Host ""
        Write-Host "Cloudflare Log:" -ForegroundColor Yellow
        Get-Content $CloudflareLog -Tail 20
    }

    exit
}

Write-Host ""
Write-Host "Cloudflare URL Found!" -ForegroundColor Green
Write-Host $TunnelURL -ForegroundColor Cyan
# ==========================================================
# STEP 5 - UPDATE GITHUB
# ==========================================================

Write-Host ""
Write-Host "[5/8] Updating GitHub..." -ForegroundColor Yellow

try {

    & $GH auth status | Out-Null

    & $GH secret set FRONTEND_URL `
        --repo $Repo `
        --body "$TunnelURL"

    & $GH variable set FRONTEND_LINK `
        --repo $Repo `
        --body "$TunnelURL"

    & $GH repo edit `
        $Repo `
        --homepage "$TunnelURL"

    Write-Host "GitHub Homepage Updated." -ForegroundColor Green
    Write-Host "GitHub Secret Updated." -ForegroundColor Green
    Write-Host "GitHub Variable Updated." -ForegroundColor Green

}
catch {
    Write-Host "GitHub update failed." -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# ==========================================================
# STEP 6 - AUTO COMMIT
# ==========================================================

Write-Host ""
Write-Host "[6/8] Creating Git Commit..." -ForegroundColor Yellow

$CommitTime = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$CommitMessage = "chore: SHMS tunnel refresh ($CommitTime)"

git add .
git commit --allow-empty -m "$CommitMessage"

# ==========================================================
# STEP 7 - PULL & PUSH
# ==========================================================

Write-Host ""
Write-Host "[7/8] Syncing GitHub..." -ForegroundColor Yellow

git pull --rebase origin main

if ($LASTEXITCODE -eq 0) {

    git push origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host "GitHub Push Successful." -ForegroundColor Green
    }
}

# ==========================================================
# STEP 8 - SUMMARY
# ==========================================================

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " SHMS DEPLOYMENT COMPLETED SUCCESSFULLY " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "LIVE URL :" -ForegroundColor Yellow
Write-Host $TunnelURL -ForegroundColor Cyan

Write-Host ""
Write-Host "Frontend   : http://localhost:5173"
Write-Host "Backend    : http://localhost:8081"
Write-Host "Grafana    : http://localhost:3000"
Write-Host "Prometheus : http://localhost:9090"

Write-Host ""
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"

Write-Host ""
Write-Host "Deployment Finished Successfully!" -ForegroundColor Green