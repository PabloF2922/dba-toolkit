/*
 * Name: Historial de backups por base
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Lectura de las tablas de historial de backups de msdb; verificar permisos en el entorno
 * Risk: READ_ONLY
 * Description: Historial de respaldos de una base durante los últimos 30 días.
 * Tags: backup, historial, full, log, diferencial
 */

-- IMPORTANTE: Reemplazar NombreDeBase antes de ejecutar.

-- Lista respaldos FULL, DIFFERENTIAL y LOG de los últimos
-- 30 días, incluyendo tamaño y duración.
-- Cambiar el nombre de la BD en el WHERE.

SELECT
    database_name AS Database_Name,

    CASE type
        WHEN 'D' THEN 'FULL'
        WHEN 'I' THEN 'DIFFERENTIAL'
        WHEN 'L' THEN 'TRANSACTION LOG'
        ELSE type
    END AS Tipo_Backup,

    backup_start_date AS Inicio,
    backup_finish_date AS Fin,

    CAST(backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Backup_GB,

    CAST(compressed_backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Backup_Comprimido_GB,

    CAST(DATEDIFF(SECOND,
        backup_start_date,
        backup_finish_date) / 60.0
        AS DECIMAL(18,2)) AS Duracion_Min,

    is_copy_only AS Copy_Only

FROM msdb.dbo.backupset
WHERE database_name = 'NombreDeBase'
  AND backup_start_date >= DATEADD(DAY, -30, GETDATE())
ORDER BY backup_start_date DESC;
GO
