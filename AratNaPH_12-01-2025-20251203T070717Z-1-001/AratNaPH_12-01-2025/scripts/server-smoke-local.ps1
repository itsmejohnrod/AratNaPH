<#
PowerShell helper: server-smoke-local.ps1
Usage: run from project root (or supply -RootPath)
  powershell -ExecutionPolicy Bypass -File scripts\server-smoke-local.ps1
This script:
 - checks for Python (python or py launcher)
 - checks if port 8000 is in use
 - if python is available and port free, starts a background python http.server on the site root
 - runs simple HTTP smoke checks for a predefined list of pages
 - writes results to tmp/server-check.log
Notes:
 - The script is non-destructive: it will NOT kill existing processes on port 8000. It will report the owning PID and process name so you can stop it manually if desired.
 - To run the script without attempting to start a server, use -NoStart switch.
#>
param(
  [string]$RootPath = (Get-Location).Path,
  [switch]$NoStart
)

$logDir = Join-Path $RootPath 'tmp'
if(-not (Test-Path $logDir)) { New-Item -Path $logDir -ItemType Directory | Out-Null }
$log = Join-Path $logDir 'server-check.log'
"=== START $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" | Out-File $log -Append

# Helper to write lines
function Log([string]$s){ $s | Out-File $log -Append; Write-Host $s }

Log "Project root: $RootPath"

# Find python
$pythonCmd = $null
try{
  $ver = & python --version 2>&1
  if($LASTEXITCODE -eq 0 -or $ver){ $pythonCmd = 'python'; Log "Found python: $ver" }
} catch {}
if(-not $pythonCmd){
  try{ $ver = & py -3 --version 2>&1; if($LASTEXITCODE -eq 0 -or $ver){ $pythonCmd = 'py -3'; Log "Found py launcher: $ver" } } catch {}
}
if(-not $pythonCmd){ Log "Python not found on PATH. Server start will be skipped." }

# Check port 8000
$port = 8000
$inUse = $false
try{
  $conn = Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue
  if($conn -and $conn.TcpTestSucceeded){ $inUse = $true; Log "Port $port is in use (TCP test succeeded)." }
  else { Log "Port $port appears free (TCP test negative)." }
} catch {
  Log "Test-NetConnection unavailable or failed: $($_.Exception.Message)" 
  # fallback to netstat
  try{
    $lines = netstat -ano | Select-String ":$port"
    if($lines -and $lines.Count -gt 0){ $inUse = $true; Log "Port $port seen in netstat:"; $lines | Out-File $log -Append } else { Log "Port $port not found in netstat." }
  } catch { Log "netstat fallback failed: $($_.Exception.Message)" }
}

# If allowed and available, start server
$startedPid = $null
if((-not $NoStart) -and -not $inUse -and $pythonCmd){
  Log "Starting python http.server on port $port (background)..."
  $startInfo = if($pythonCmd -eq 'py -3') { @{ FilePath='py'; ArgumentList='-3','-m','http.server',$port } } else { @{ FilePath='python'; ArgumentList='-m','http.server',$port } }
  try{
    $proc = Start-Process -FilePath $startInfo.FilePath -ArgumentList $startInfo.ArgumentList -WorkingDirectory $RootPath -PassThru
    $startedPid = $proc.Id
    Log "Started server process PID=$startedPid"
    Start-Sleep -Seconds 1
  } catch { Log "Failed to start python server: $($_.Exception.Message)" }
} elseif($inUse){
  # report owning process if possible
  try{
    $c = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if($c){ $pid = $c.OwningProcess; Log "Port $port owned by PID=$pid"; try{ $p = Get-Process -Id $pid -ErrorAction SilentlyContinue; if($p){ Log "Process: $($p.ProcessName) Path:$($p.Path)" } } catch{} }
  } catch { Log "Could not determine owning process for port $port: $($_.Exception.Message)" }
}

# Smoke checks
Log "=== Smoke checks ==="
$pages = @('Packages.html','Hotel.html','tour-detail-elnido.html')
foreach($p in $pages){
  $url = "http://127.0.0.1:$port/$p"
  try{
    $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
    Log ("$p : $($r.StatusCode) $($r.StatusDescription)")
  } catch {
    Log ("$p : ERROR - " + $_.Exception.Message)
  }
}

Log "=== DONE $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
Log "Log file: $log"

# If we started a background server, print instruction to stop it (we won't kill it automatically)
if($startedPid){ Log "Server started as PID=$startedPid. To stop: Stop-Process -Id $startedPid -Force" }

# Exit
return 0
