@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo Starting Cloudflare Quick Tunnel for Grafana (Port 3001)
echo ========================================================
python scripts\start_tunnel.py %*
if errorlevel 1 (
    echo.
    echo Running with python failed. Checking if cloudflared is installed directly...
    cloudflared tunnel --url http://localhost:3001
)
pause
