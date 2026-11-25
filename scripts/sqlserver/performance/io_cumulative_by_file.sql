/*
 * Name: I/O acumulado por archivo
 * Engine: SQL Server
 * Category: Performance
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno
 * Risk: READ_ONLY
 * Description: Lecturas, escrituras, volumen y latencia acumulados por archivo.
 * Tags: io, lecturas, escrituras, latencia, historico
 */

-- IMPORTANTE: Ajustar X: a la unidad deseada. Los contadores pueden reiniciarse.

-- Muestra operaciones y volumen total de I/O registrado
-- por SQL Server desde el reinicio de sus contadores.
--
-- Incluye:
--  Total de lecturas y escrituras
--  GB leídos y escritos
--  Latencia promedio histórica
--
-- No permite determinar el throughput máximo.

SELECT
    DB_NAME(v.database_id) AS Base,
    f.physical_name AS Archivo,

    v.num_of_reads AS Total_Lecturas,
    v.num_of_writes AS Total_Escrituras,

    CAST(v.num_of_bytes_read / 1073741824.0
        AS DECIMAL(18,2)) AS Total_Leido_GB,

    CAST(v.num_of_bytes_written / 1073741824.0
        AS DECIMAL(18,2)) AS Total_Escrito_GB,

    CAST(v.io_stall_read_ms * 1.0 /
        NULLIF(v.num_of_reads, 0)
        AS DECIMAL(18,2)) AS Latencia_Lectura_ms,

    CAST(v.io_stall_write_ms * 1.0 /
        NULLIF(v.num_of_writes, 0)
        AS DECIMAL(18,2)) AS Latencia_Escritura_ms

FROM sys.dm_io_virtual_file_stats(NULL, NULL) v

JOIN sys.master_files f
    ON v.database_id = f.database_id
    AND v.file_id = f.file_id

WHERE f.physical_name LIKE 'X:\%'
ORDER BY Total_Leido_GB DESC;
GO
