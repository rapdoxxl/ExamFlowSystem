$ErrorActionPreference = 'Stop'
$BackupScript = Join-Path $PSScriptRoot 'backup.ps1'
$Action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$BackupScript`""
$TriggerNoon = New-ScheduledTaskTrigger -Daily -At 12:00
$TriggerMidnight = New-ScheduledTaskTrigger -Daily -At 00:00
Register-ScheduledTask -TaskName 'RegSysOL_Backup_1200' -Action $Action -Trigger $TriggerNoon -Force | Out-Null
Register-ScheduledTask -TaskName 'RegSysOL_Backup_0000' -Action $Action -Trigger $TriggerMidnight -Force | Out-Null
Get-ScheduledTask -TaskName 'RegSysOL_Backup_1200','RegSysOL_Backup_0000' | Select-Object TaskName,State
