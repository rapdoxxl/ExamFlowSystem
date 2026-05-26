Get-ScheduledTask -TaskName 'RegSysOL_Backup_1200','RegSysOL_Backup_0000' | ForEach-Object {
  Write-Host $_.TaskName
  $_.Triggers | Format-List StartBoundary,Enabled
}
