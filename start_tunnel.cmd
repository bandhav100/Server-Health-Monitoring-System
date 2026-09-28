@echo off
setlocal
cd /d "%~dp0"
echo ========================================================
echo Starting Cloudflare Quick Tunnel for SHMS App (Port 5173)
echo ========================================================
python scripts\start_tunnel.py %*
if errorlevel 1 (
    echo.
    echo Running with python failed. Checking if cloudflared is installed directly...
    cloudflared tunnel --url http://localhost:5173
)
pause
