/*
 * Name: Espacio asignado por unidad
 * Engine: SQL Server
 * Category: Storage
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Visibilidad de archivos en sys.master_files
 * Risk: READ_ONLY
 * Description: Agrupa el espacio asignado a archivos de datos y log por unidad.
 * Tags: disco, espacio, archivos, capacidad
 */

-- IMPORTANTE: El agrupamiento por los dos primeros caracteres no representa rutas UNC ni puntos de montaje.

-- Agrupa los archivos de SQL Server por unidad.
--
-- Muestra:
--  Cantidad de BD
--  Cantidad de archivos
--  GB asignados a datos
--  GB asignados a logs
--  Total asignado
--
-- El tamaño corresponde a archivos asignados,
-- no necesariamente a datos realmente utilizados.

SELECT
    LEFT(physical_name, 2) AS Disco,

    COUNT(DISTINCT database_id) AS Cantidad_BD,
    COUNT(*) AS Cantidad_Archivos,

    CAST(SUM(CASE WHEN type = 0
        THEN CAST(size AS BIGINT) ELSE 0 END)
        / 131072.0 AS DECIMAL(18,2)) AS Datos_GB,

    CAST(SUM(CASE WHEN type = 1
        THEN CAST(size AS BIGINT) ELSE 0 END)
        / 131072.0 AS DECIMAL(18,2)) AS Logs_GB,

    CAST(SUM(CAST(size AS BIGINT))
        / 131072.0 AS DECIMAL(18,2)) AS Total_GB

FROM sys.master_files

GROUP BY LEFT(physical_name, 2)
ORDER BY Total_GB DESC;
GO
