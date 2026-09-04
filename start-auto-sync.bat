@echo off
title Multi-Agent Assistant - Continuous Project Auto-Sync
echo ======================================================================
echo  Watching 'maa-ai-engine' container for new generated projects...
echo  Every project you generate will appear in 'generated-projects\'
echo  Keep this window open while using the application.
echo ======================================================================
echo.

:loop
docker cp maa-ai-engine:/app/generated-projects/. "%~dp0generated-projects\" 2>nul
timeout /t 2 /nobreak >nul
goto loop
