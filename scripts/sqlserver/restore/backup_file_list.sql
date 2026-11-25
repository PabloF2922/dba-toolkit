/*
 * Name: Consultar archivos incluidos en un backup
 * Engine: SQL Server
 * Category: Restore
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos para RESTORE FILELISTONLY y lectura del backup; verificar segun version y destino
 * Risk: READ_ONLY
 * Description: Plantilla comentada para consultar archivos lógicos y físicos de un backup.
 * Tags: restore, filelistonly, archivos, nombres logicos
 */

-- IMPORTANTE: Plantilla comentada: adaptar la ruta y comprobar permisos antes de ejecutar.

-- Consulta los nombres lógicos y rutas originales
-- de los archivos incluidos dentro de un backup.
--
-- Es necesario antes de restaurar con WITH MOVE.
-- No restaura ni modifica la base de datos.
--
-- Sustituir la ruta por un backup existente.
--
-- DESCOMENTAR LUEGO DE CONFIGURAR LA RUTA.

/*
RESTORE FILELISTONLY
FROM DISK = '\\servidor\backups\NombreDeBase_FULL.bak';
GO
*/
