/*
 * Name: Tamaño y duracion de backups
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2012+ (verificar en el entorno)
 * Permissions: Acceso de lectura a msdb.dbo.backupset
 * Risk: READ_ONLY
 * Description: Muestra tamaño, compresion y duracion de los ultimos 100 backups.
 * Tags: backup, tamaño, duracion, compresion, msdb
 */

SELECT TOP (100)
    database_name,
    backup_start_date,
    backup_finish_date,
    type,
    DATEDIFF(SECOND, backup_start_date, backup_finish_date) AS duration_seconds,
    backup_size / 1048576.0 AS backup_size_mb,
    compressed_backup_size / 1048576.0 AS compressed_size_mb
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;
