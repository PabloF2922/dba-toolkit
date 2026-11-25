/*
 * Name: Promedios históricos de I/O
 * Engine: SQL Server
 * Category: Performance
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno
 * Risk: READ_ONLY
 * Description: Estima throughput promedio desde el inicio de la instancia.
 * Tags: io, historico, promedio, throughput
 */

-- IMPORTANTE: Ajustar X: a la unidad deseada. Es una aproximación, no mide la capacidad máxima.

-- Calcula MB/s promedio desde el inicio de la instancia.
-- Incluye tiempo de inactividad.
--
-- Versión corregida: no utiliza sample_ms, que puede
-- desbordarse en versiones antiguas de SQL Server.
--
-- Es una aproximación: los contadores de I/O pueden
-- reiniciarse después del inicio de la instancia.

SELECT
    DB_NAME(v.database_id) AS Base,
    f.type_desc AS Tipo,
    s.sqlserver_start_time AS Inicio_Instancia,

    DATEDIFF(HOUR,
        s.sqlserver_start_time,
        GETDATE()) / 24.0 AS Dias_Instancia,

    CAST(v.num_of_bytes_read / 1048576.0 /
        NULLIF(DATEDIFF(SECOND,
            s.sqlserver_start_time,
            GETDATE()), 0)
        AS DECIMAL(18,2)) AS Lectura_Promedio_MB_s,

    CAST(v.num_of_bytes_written / 1048576.0 /
        NULLIF(DATEDIFF(SECOND,
            s.sqlserver_start_time,
            GETDATE()), 0)
        AS DECIMAL(18,2)) AS Escritura_Promedio_MB_s,

    CAST(v.num_of_bytes_read / 1024.0 /
        NULLIF(v.num_of_reads, 0)
        AS DECIMAL(18,2)) AS KB_Por_Lectura,

    CAST(v.num_of_bytes_written / 1024.0 /
        NULLIF(v.num_of_writes, 0)
        AS DECIMAL(18,2)) AS KB_Por_Escritura

FROM sys.dm_io_virtual_file_stats(NULL, NULL) v

JOIN sys.master_files f
    ON v.database_id = f.database_id
    AND v.file_id = f.file_id

CROSS JOIN sys.dm_os_sys_info s

WHERE f.physical_name LIKE 'X:\%'
ORDER BY Base, Tipo;
GO
