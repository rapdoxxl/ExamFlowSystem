@echo off
schtasks /Delete /TN "RegSysOL_Backup_1200" /F
schtasks /Delete /TN "RegSysOL_Backup_0000" /F
echo Backup scheduled tasks removed.
pause
