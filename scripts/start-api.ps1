# Start Ledger Book Python API
# Run from project root: .\scripts\start-api.ps1

Set-Location $PSScriptRoot\..

# Load .env if present
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}

# Find Python
$python = $null
foreach ($cmd in @('python', 'python3', 'py')) {
    try {
        $v = & $cmd --version 2>$null
        if ($LASTEXITCODE -eq 0) { $python = $cmd; break }
    } catch {}
}

if (-not $python) {
    Write-Host "Python not found. Install Python 3.11+ from https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Yellow
    exit 1
}

Write-Host "Using: $python"
& $python -m pip install -q -r requirements.txt
& $python -m uvicorn server.main:app --reload --port 3001
