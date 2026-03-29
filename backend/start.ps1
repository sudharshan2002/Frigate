param(
  [switch]$Reload
)

function Test-PythonCandidate {
  param(
    [string]$PythonPath
  )

  if (-not $PythonPath -or -not (Test-Path $PythonPath)) {
    return $false
  }

  try {
    & $PythonPath -c "import sys; print(sys.executable)" *> $null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

$localVenvPython = Join-Path $PSScriptRoot "..\venv\Scripts\python.exe"

$candidates = @(
  $localVenvPython,
  $env:PYTHON,
  (Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  (Get-Command py -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  "C:\Users\USER\AppData\Local\Programs\Python\Python312\python.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

$pythonExe = $candidates | Where-Object { Test-PythonCandidate $_ } | Select-Object -First 1

if (-not $pythonExe) {
  throw "No working Python executable was found. Recreate the virtual environment or set the PYTHON environment variable."
}

Push-Location $PSScriptRoot
try {
  if ($Reload) {
    $env:RELOAD = "true"
  }

  & $pythonExe run.py
} finally {
  Pop-Location
}
