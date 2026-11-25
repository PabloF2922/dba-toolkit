/*
 * Name: Capacidad y espacio libre por volumen
 * Engine: SQL Server
 * Category: Storage
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno
 * Risk: READ_ONLY
 * Description: Consulta capacidad y espacio disponible en volúmenes con archivos SQL Server.
 * Tags: volumen, disco, espacio, libre, capacidad
 */

-- IMPORTANTE: No enumera necesariamente todos los volúmenes del sistema operativo.

-- Muestra tamaño total, espacio usado, espacio libre
-- y porcentaje libre de los volúmenes donde SQL Server
-- tiene archivos.
--
-- No necesariamente muestra todos los discos del SO.
-- No requiere permisos de escritura sobre los discos.

SELECT DISTINCT
    v.volume_mount_point AS Disco,
    v.logical_volume_name AS Nombre_Volumen,
    v.file_system_type AS FileSystem,

    CAST(v.total_bytes / 1073741824.0
        AS DECIMAL(18,2)) AS Total_GB,

    CAST((v.total_bytes - v.available_bytes)
        / 1073741824.0
        AS DECIMAL(18,2)) AS Usado_GB,

    CAST(v.available_bytes / 1073741824.0
        AS DECIMAL(18,2)) AS Libre_GB,

    CAST(v.available_bytes * 100.0 /
        NULLIF(v.total_bytes, 0)
        AS DECIMAL(10,2)) AS Libre_Pct

FROM sys.master_files f

CROSS APPLY sys.dm_os_volume_stats(
    f.database_id,
    f.file_id
) v

ORDER BY Disco;
GO
