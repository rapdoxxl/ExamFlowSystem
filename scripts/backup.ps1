$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $Root
$BackupDir = Join-Path $Root 'backups'
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
$Stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$Destination = Join-Path $BackupDir "RegSysOL_backup_$Stamp.zip"
$Paths = @('prisma', 'storage', '.env', '附件') | ForEach-Object { Join-Path $Root $_ } | Where-Object { Test-Path $_ }
Compress-Archive -Path $Paths -DestinationPath $Destination -Force
Write-Host "Backup created: $Destination"
