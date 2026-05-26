$processIds = @(
  Get-NetTCPConnection -LocalPort 8018 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
)

if ($processIds.Count -eq 0) {
  $processIds = @(
    netstat -ano |
      Select-String '^\s*TCP\s+\S+:8018\s+\S+\s+LISTENING\s+(\d+)$' |
      ForEach-Object { [int]$_.Matches[0].Groups[1].Value } |
      Sort-Object -Unique
  )
}

foreach ($processId in $processIds) {
  if ($processId -and $processId -ne $PID) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
}
