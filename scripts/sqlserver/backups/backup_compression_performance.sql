/*
 * Name: Compresión y rendimiento histórico de backups
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Lectura de las tablas de historial de backups de msdb; verificar permisos en el entorno
 * Risk: READ_ONLY
 * Description: Calcula compresión y throughput de respaldos FULL no snapshot en msdb.
 * Tags: backup, compresion, throughput, rendimiento
 */

-- IMPORTANTE: Excluir snapshots no garantiza que el backup sea nativo. El throughput se basa en el tamaño original.

-- Busca backups FULL registrados, excluyendo snapshots.
-- Calcula ratio de compresión, ahorro de espacio,
-- duración y throughput promedio en MB/s.
-- Útil para estimar tiempos de nuevos respaldos.

SELECT TOP 50
    database_name,
    backup_start_date,

    CAST(backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Original_GB,

    CAST(compressed_backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Final_GB,

    CAST(backup_size /
        NULLIF(compressed_backup_size, 0)
        AS DECIMAL(10,2)) AS Ratio_Compresion,

    CAST((1.0 - compressed_backup_size /
        NULLIF(backup_size, 0)) * 100
        AS DECIMAL(10,2)) AS Ahorro_Pct,

    CAST(DATEDIFF(SECOND,
        backup_start_date,
        backup_finish_date) / 60.0
        AS DECIMAL(10,2)) AS Duracion_Min,

    CAST(backup_size / 1048576.0 /
        NULLIF(DATEDIFF(SECOND,
            backup_start_date,
            backup_finish_date), 0)
        AS DECIMAL(18,2)) AS Throughput_MB_s

FROM msdb.dbo.backupset
WHERE type = 'D'
  AND is_snapshot = 0
  AND backup_finish_date IS NOT NULL
ORDER BY backup_start_date DESC;
GO
