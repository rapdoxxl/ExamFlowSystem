Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
  Where-Object { $_.CommandLine -like '*RegSysOL*' -or $_.CommandLine -like '*next start*' -or $_.CommandLine -like '*next dev*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
