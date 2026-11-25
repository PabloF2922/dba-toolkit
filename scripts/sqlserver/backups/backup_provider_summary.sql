/*
 * Name: Resumen del proveedor de backup
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Lectura de las tablas de historial de backups de msdb; verificar permisos en el entorno
 * Risk: READ_ONLY
 * Description: Consulta los dispositivos, snapshots y nombre de software registrados.
 * Tags: veeam, proveedor, snapshot, vdi
 */

-- IMPORTANTE: Reemplazar NombreDeBase; el software registrado no identifica necesariamente al orquestador.

-- Consulta rápida para identificar el método de respaldo.
-- Útil para detectar VDI, snapshots y software registrado.
-- software_name puede indicar Microsoft SQL Server
-- incluso cuando el respaldo es coordinado por Veeam.

SELECT TOP 5
    b.is_snapshot,
    b.is_copy_only,
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
