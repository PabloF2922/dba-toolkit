/*
 * Name: Backup FULL dividido en varios archivos
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos BACKUP DATABASE y escritura de la cuenta del servicio SQL Server en el destino
 * Risk: BACKUP
 * Description: Plantilla comentada para distribuir un backup FULL entre varios archivos.
 * Tags: backup, full, striping, discos, copy_only
 */

-- IMPORTANTE: Plantilla comentada: adaptar rutas y base; se necesitan todos los archivos para restaurar.

-- Permite repartir un mismo backup entre varios archivos
-- y destinos físicos.
--
-- Para restaurar se necesitan TODOS los archivos.
-- SQL Server puede escribirlos en paralelo.
--
-- Cuidado: un volumen puede llenarse antes que los otros.
-- Validar espacio libre y rendimiento de cada destino.
--
-- DESCOMENTAR ÚNICAMENTE CUANDO CORRESPONDA.

/*
BACKUP DATABASE [NombreDeBase]
TO
    DISK = 'E:\NombreDeBase_FULL_01.bak',
    DISK = 'F:\NombreDeBase_FULL_02.bak',
    DISK = 'E:\NombreDeBase_FULL_03.bak',
    DISK = 'F:\NombreDeBase_FULL_04.bak'
WITH
    COPY_ONLY,
    COMPRESSION,
    CHECKSUM,
    STATS = 5;
GO
*/
