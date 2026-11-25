/*
 * Name: Backup FULL comprimido local
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos BACKUP DATABASE y escritura de la cuenta del servicio SQL Server en el destino
 * Risk: BACKUP
 * Description: Plantilla comentada para backup FULL local con COPY_ONLY, compresión y checksum.
 * Tags: backup, full, copy_only, compresion, local
 */

-- IMPORTANTE: Plantilla comentada: adaptar base y ruta, revisar destino y autorizar antes de ejecutar.

-- Genera backup FULL usando COPY_ONLY, COMPRESSION
-- y CHECKSUM.
--
-- COPY_ONLY evita alterar la base de respaldos diferenciales
-- de la estrategia existente.
--
-- Validar espacio disponible, permisos y ruta.
-- Requiere autorización antes de ejecutarlo.
--
-- DESCOMENTAR ÚNICAMENTE CUANDO CORRESPONDA.

/*
BACKUP DATABASE [NombreDeBase]
TO DISK = 'E:\Backups\NombreDeBase_FULL.bak'
WITH
    COPY_ONLY,
    COMPRESSION,
    CHECKSUM,
    STATS = 5;
GO
*/
