/*
 * Name: Backup FULL a recurso de red
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos BACKUP DATABASE y escritura de la cuenta del servicio SQL Server en el destino
 * Risk: BACKUP
 * Description: Plantilla comentada para backup FULL a un recurso compartido.
 * Tags: backup, full, red, unc, copy_only
 */

-- IMPORTANTE: Plantilla comentada: adaptar base y ruta; verificar acceso, espacio y autorización.

-- Envía directamente el backup a una ruta UNC.
-- No necesita generar previamente un archivo local.
--
-- La cuenta del servicio SQL Server debe tener acceso
-- de escritura al recurso compartido.
--
-- Sustituir servidor y recurso.
-- Verificar que el destino tenga espacio suficiente.
--
-- DESCOMENTAR ÚNICAMENTE CUANDO CORRESPONDA.

/*
BACKUP DATABASE [NombreDeBase]
TO DISK = '\\servidor\recurso\NombreDeBase_FULL.bak'
WITH
    COPY_ONLY,
    COMPRESSION,
    CHECKSUM,
    STATS = 5;
GO
*/
