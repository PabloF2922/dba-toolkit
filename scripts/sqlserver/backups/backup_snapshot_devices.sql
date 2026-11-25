/*
 * Name: Identificar snapshots y dispositivos de backup
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Lectura de las tablas de historial de backups de msdb; verificar permisos en el entorno
 * Risk: READ_ONLY
 * Description: Examina metadatos de snapshots, dispositivos y proveedor en backups FULL.
 * Tags: veeam, snapshot, vdi, backup
 */

-- IMPORTANTE: Reemplazar NombreDeBase; estos datos no identifican de forma concluyente al producto o job.

-- Permite identificar si el backup utiliza snapshots,
-- dispositivos virtuales (VDI) u otro mecanismo.
--
-- is_snapshot = 1 : backup mediante snapshot
-- device_type = 7 : dispositivo virtual
-- is_copy_only = 1 : backup COPY_ONLY
--
-- El tiempo registrado para un snapshot no necesariamente
-- equivale al tiempo completo del job de Veeam.

SELECT TOP 20
    b.database_name,
    b.backup_start_date,
    b.backup_finish_date,

    DATEDIFF(SECOND,
        b.backup_start_date,
        b.backup_finish_date) AS Duracion_Seg,

    CAST(b.backup_size / 1073741824.0
        AS DECIMAL(18,2)) AS Backup_GB,

    b.is_snapshot,
    b.is_copy_only,
    b.user_name,
    b.software_vendor_id,
    m.software_name,
    f.device_type,
    f.physical_device_name

FROM msdb.dbo.backupset b
LEFT JOIN msdb.dbo.backupmediafamily f
    ON b.media_set_id = f.media_set_id
LEFT JOIN msdb.dbo.backupmediaset m
    ON b.media_set_id = m.media_set_id

WHERE b.database_name = 'NombreDeBase'
  AND b.type = 'D'
ORDER BY b.backup_finish_date DESC;
GO
