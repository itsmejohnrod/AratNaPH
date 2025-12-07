$log = "tmp\server-check.log"
if(-not (Test-Path tmp)) { New-Item -Path tmp -ItemType Directory | Out-Null }
"=== START $(Get-Date) ===" | Out-File $log -Append
try { & python --version 2>&1 | Out-File $log -Append } catch { "python not found or failed" | Out-File $log -Append }
try { $pc = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -WarningAction SilentlyContinue } catch { $pc = $null }
if($pc) { "TcpTestSucceeded: $($pc.TcpTestSucceeded)" | Out-File $log -Append } else { "Test-NetConnection unavailable or returned $null" | Out-File $log -Append }
if(-not ($pc -and $pc.TcpTestSucceeded)) { "Port free - starting python http.server on 8000" | Out-File $log -Append; Start-Process -FilePath python -ArgumentList '-m','http.server','8000' -WorkingDirectory (Get-Location); Start-Sleep -Seconds 1 } else { "Port 8000 in use - skipping start" | Out-File $log -Append }
"=== Smoke checks ===" | Out-File $log -Append
$pages = @('Packages.html','Hotel.html','tour-detail-elnido.html')
foreach($p in $pages) {
  $url = 'http://127.0.0.1:8000/' + $p
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 5
    ($p + ': ' + $r.StatusCode) | Out-File $log -Append
  } catch {
    ($p + ': ERROR - ' + $_.Exception.Message) | Out-File $log -Append
  }
}
"=== END $(Get-Date) ===" | Out-File $log -Append
Write-Host "Wrote log to $log"
