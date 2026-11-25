/*
 * Name: Restaurar una base en otras rutas
 * Engine: SQL Server
 * Category: Restore
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos RESTORE DATABASE y acceso de la cuenta del servicio a origen y destinos
 * Risk: RESTORE
 * Description: Plantilla comentada de restauración con MOVE para datos y log.
 * Tags: restore, move, mdf, ldf, recuperacion
 */

-- IMPORTANTE: Plantilla comentada: comprobar backup, nombres lógicos, destino, espacio y autorización; puede modificar bases y archivos.

-- Restaura la BD cambiando las rutas físicas de MDF y LDF.
--
-- Permite restaurar en discos distintos al origen.
-- Ejemplo:
--   Origen:  X:\SQLData\
--   Destino: E:\SQLData\ y G:\SQLLogs\
--
-- IMPORTANTE:
-- 1. Verificar nombres lógicos con RESTORE FILELISTONLY.
-- 2. Verificar espacio disponible en destino.
-- 3. Confirmar que la BD destino no exista para evitar
--    cualquier riesgo de sobrescritura.
-- 4. Confirmar permisos sobre las rutas.
-- 5. Ejecutar exclusivamente en el servidor destino.
-- 6. Comprobar que el backup sea recuperable.
--
-- Los nombres lógicos siguientes son ejemplos.
--
-- DESCOMENTAR ÚNICAMENTE CON AUTORIZACIÓN.

/*
RESTORE DATABASE [NombreDeBase]
FROM DISK = '\\servidor\backups\NombreDeBase_FULL.bak'
WITH
    MOVE 'NombreDeBase'
        TO 'E:\SQLData\NombreDeBase.mdf',

    MOVE 'NombreDeBase_log'
        TO 'G:\SQLLogs\NombreDeBase_log.ldf',

    RECOVERY,
    STATS = 5;
GO
*/
