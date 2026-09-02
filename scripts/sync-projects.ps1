# Sync generated projects from container to local host directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Split-Path -Parent $scriptDir
$targetDir = Join-Path $repoRoot "generated-projects"

Write-Host "Syncing generated projects from Docker container 'maa-ai-engine' to '$targetDir'..."
docker cp maa-ai-engine:/app/generated-projects/. "$targetDir\"
Write-Host "Sync completed successfully!" -ForegroundColor Green
