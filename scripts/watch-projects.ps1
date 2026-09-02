# Continuous background auto-sync from Docker container to host generated-projects folder
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Split-Path -Parent $scriptDir
$targetDir = Join-Path $repoRoot "generated-projects"

Write-Host "Auto-sync active: Watching 'maa-ai-engine' container for new generated projects..." -ForegroundColor Cyan
Write-Host "Destination: $targetDir" -ForegroundColor Gray

while ($true) {
    try {
        docker cp maa-ai-engine:/app/generated-projects/. "$targetDir\" 2>$null
    } catch {
        # ignore transient errors during generation
    }
    Start-Sleep -Seconds 2
}
