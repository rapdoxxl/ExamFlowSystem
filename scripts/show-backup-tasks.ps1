Get-ScheduledTask -TaskName 'RegSysOL_Backup_1200','RegSysOL_Backup_0000' | ForEach-Object {
  [pscustomobject]@{
    TaskName = $_.TaskName
    State = $_.State
    Execute = $_.Actions[0].Execute
    Arguments = $_.Actions[0].Arguments
    NextRunTime = (Get-ScheduledTaskInfo -TaskName $_.TaskName).NextRunTime
  }
} | Format-List
