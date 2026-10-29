@echo off
title TikTok Live Game + Cloudflare Tunnel
echo ============================================================
echo   🎮 TikTok Live Game - Cloudflare Public Tunnel Launcher
echo ============================================================
echo.
echo [1/2] Menyalakan Server Node.js (Port 3500)...
start "TikTok Game Server" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Membuka Cloudflare Tunnel...
echo.
echo Perhatikan link HTTPS di bawah (misal: https://xxxx.trycloudflare.com).
echo Link tersebut dapat dibuka dari HP, OBS di PC lain, atau dibagikan ke teman!
echo ============================================================
echo.
.\cloudflared.exe tunnel --url http://127.0.0.1:3500
pause
