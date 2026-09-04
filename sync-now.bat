@echo off
echo Syncing generated projects from Docker container to Windows host...
docker cp maa-ai-engine:/app/generated-projects/. "%~dp0generated-projects\"
echo.
echo Sync completed successfully!
echo Files are in: %~dp0generated-projects
timeout /t 3
