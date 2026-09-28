# ==========================================================
# SHMS Auto Startup Installer (Windows 11)
# Run ONLY ONCE
# ==========================================================

$TaskName = "SHMS Enterprise Auto Deployment"
$ScriptPath = "C:\Users\bandh\OneDrive\Desktop\New Folder\start-shms.ps1"

Write-Host ""
Write-Host "Installing SHMS Auto Startup..." -ForegroundColor Cyan

# Remove old task if present
Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue |
    Unregister-ScheduledTask -Confirm:$false

# Task Action
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`""

# Trigger at Login
$Trigger = New-ScheduledTaskTrigger -AtLogOn

# Settings
$Settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable

# Register Task
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " SHMS AUTO STARTUP INSTALLED SUCCESSFULLY " -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

Write-Host "Task Name : $TaskName" -ForegroundColor Yellow
Write-Host "Script    : $ScriptPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Laptop login ayyaka SHMS automatic ga run avuthundi." -ForegroundColor Cyan