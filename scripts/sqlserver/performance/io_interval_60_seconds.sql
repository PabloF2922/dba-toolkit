/*
 * Name: I/O por archivo en 60 segundos
 * Engine: SQL Server
 * Category: Performance
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno; permisos para crear tablas temporales
 * Risk: TEMPDB_WRITE
 * Description: Compara dos muestras de I/O y calcula throughput, IOPS y latencia.
 * Tags: io, iops, latencia, throughput, intervalo
 */

-- IMPORTANTE: Ajustar X: a la unidad deseada. Espera 60 segundos y crea y elimina #IO_Inicial en tempdb; no mide capacidad máxima.

-- Toma dos muestras de los contadores de SQL Server
-- separadas por 60 segundos.
--
-- Muestra:
--  Lectura y escritura MB/s
--  IOPS lectura y escritura
--  Latencia promedio de lectura y escritura
--
-- Filtra los archivos ubicados en X:.
-- Mide actividad real durante el intervalo,
-- NO la velocidad máxima que soporta el almacenamiento.

IF OBJECT_ID('tempdb..#IO_Inicial') IS NOT NULL
    DROP TABLE #IO_Inicial;

SELECT
    database_id,
    file_id,
    num_of_reads,
    num_of_writes,
    num_of_bytes_read,
    num_of_bytes_written,
    io_stall_read_ms,
    io_stall_write_ms
INTO #IO_Inicial
FROM sys.dm_io_virtual_file_stats(NULL, NULL);

DECLARE @Inicio DATETIME2 = SYSDATETIME();

WAITFOR DELAY '00:01:00';

DECLARE @Segundos FLOAT =
    DATEDIFF(MILLISECOND, @Inicio, SYSDATETIME()) / 1000.0;

SELECT
    DB_NAME(v.database_id) AS Base,
    f.type_desc AS Tipo,
    f.physical_name AS Archivo,

    CAST((v.num_of_bytes_read - i.num_of_bytes_read)
        / 1048576.0 / @Segundos
        AS DECIMAL(18,2)) AS Lectura_MB_s,

    CAST((v.num_of_bytes_written - i.num_of_bytes_written)
        / 1048576.0 / @Segundos
        AS DECIMAL(18,2)) AS Escritura_MB_s,

    CAST((v.num_of_reads - i.num_of_reads)
        / @Segundos
        AS DECIMAL(18,2)) AS IOPS_Lectura,

    CAST((v.num_of_writes - i.num_of_writes)
        / @Segundos
        AS DECIMAL(18,2)) AS IOPS_Escritura,

    CAST((v.io_stall_read_ms - i.io_stall_read_ms)
        * 1.0 /
        NULLIF(v.num_of_reads - i.num_of_reads, 0)
        AS DECIMAL(18,2)) AS Latencia_Lectura_ms,

    CAST((v.io_stall_write_ms - i.io_stall_write_ms)
        * 1.0 /
        NULLIF(v.num_of_writes - i.num_of_writes, 0)
        AS DECIMAL(18,2)) AS Latencia_Escritura_ms

FROM sys.dm_io_virtual_file_stats(NULL, NULL) v

JOIN #IO_Inicial i
    ON v.database_id = i.database_id
    AND v.file_id = i.file_id

JOIN sys.master_files f
    ON v.database_id = f.database_id
    AND v.file_id = f.file_id

WHERE f.physical_name LIKE 'X:\%'
ORDER BY Base, Tipo;

DROP TABLE #IO_Inicial;
GO
