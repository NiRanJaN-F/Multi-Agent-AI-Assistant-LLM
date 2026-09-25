@echo off
echo Syncing generated projects from Docker container to Windows host...
docker cp maa-ai-engine:/app/generated-projects/. "%~dp0generated-projects"
echo.
echo Sync completed successfully!
echo Files are in: %~dp0generated-projects
ping -n 3 127.0.0.1 >nul
