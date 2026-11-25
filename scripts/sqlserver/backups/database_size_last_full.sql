/*
 * Name: Tamaño de bases y último backup FULL
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Lectura de las tablas de historial de backups de msdb; verificar permisos en el entorno; visibilidad de bases y archivos
 * Risk: READ_ONLY
 * Description: Tamaño asignado por base y último respaldo completo registrado en msdb.
 * Tags: bases, tamaño, full, historial
 */

-- IMPORTANTE: El último FULL registrado puede ser COPY_ONLY o snapshot; no confirma que sea recuperable.

-- Muestra tamaño de datos, logs, total, último backup,
-- tamaño comprimido y duración del respaldo.
-- Ordena las bases por tamaño descendente.
-- No incluye tempdb.

USE master;
GO

WITH DBSize AS (
    SELECT
        database_id,
        SUM(CASE WHEN type = 0
            THEN CAST(size AS BIGINT) ELSE 0 END)
            * 8.0 / 1024 / 1024 AS Data_GB,

        SUM(CASE WHEN type = 1
            THEN CAST(size AS BIGINT) ELSE 0 END)
            * 8.0 / 1024 / 1024 AS Log_GB,

        SUM(CAST(size AS BIGINT))
            * 8.0 / 1024 / 1024 AS Total_GB
    FROM sys.master_files
    GROUP BY database_id
)
SELECT
    d.name AS Database_Name,
    d.state_desc AS Estado,
    d.recovery_model_desc AS Recovery_Model,

    CAST(s.Data_GB AS DECIMAL(18,2)) AS Data_GB,
    CAST(s.Log_GB AS DECIMAL(18,2)) AS Log_GB,
    CAST(s.Total_GB AS DECIMAL(18,2)) AS Total_GB,

    CAST(b.backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Backup_GB,

    CAST(b.compressed_backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Backup_Comprimido_GB,

    b.backup_start_date AS Inicio_Backup,
    b.backup_finish_date AS Fin_Backup,

    DATEDIFF(SECOND,
        b.backup_start_date,
        b.backup_finish_date) AS Duracion_Seg,

    CAST(DATEDIFF(SECOND,
        b.backup_start_date,
        b.backup_finish_date) / 60.0
        AS DECIMAL(18,2)) AS Duracion_Min

FROM sys.databases d
JOIN DBSize s
    ON d.database_id = s.database_id
OUTER APPLY (
    SELECT TOP 1 *
    FROM msdb.dbo.backupset b
    WHERE b.database_name = d.name
      AND b.type = 'D'
      AND b.backup_finish_date IS NOT NULL
    ORDER BY b.backup_finish_date DESC
) b
WHERE d.name <> 'tempdb'
ORDER BY s.Total_GB DESC;
GO
