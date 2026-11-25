/*
 * Name: Historial de backups
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2012+ (verificar en el entorno)
 * Permissions: Acceso de lectura a msdb.dbo.backupset
 * Risk: READ_ONLY
 * Description: Muestra los ultimos 100 backups registrados en msdb.
 * Tags: backup, historial, copia, msdb
 */

SELECT TOP (100)
    database_name,
    backup_start_date,
    backup_finish_date,
    type,
    backup_size
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;
