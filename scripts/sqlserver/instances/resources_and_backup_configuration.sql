/*
 * Name: Recursos y configuración de backup
 * Engine: SQL Server
 * Category: Instancias
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno; acceso a configuracion y metadatos de la base
 * Risk: READ_ONLY
 * Description: Consulta versión, CPU, memoria, TDE y configuración de compresión.
 * Tags: cpu, memoria, version, tde, compresion
 */

-- IMPORTANTE: Reemplazar NombreDeBase. La lectura de sp_configure no cambia la configuración.

-- Muestra recursos disponibles para SQL Server.
-- Permite conocer la configuración de compresión
-- predeterminada y si la BD está cifrada con TDE.

SELECT @@VERSION AS Version_SQL;

SELECT
    cpu_count AS CPU_Logicas,
    scheduler_count AS Schedulers,
    physical_memory_kb / 1024 / 1024 AS RAM_GB
FROM sys.dm_os_sys_info;

SELECT
    name,
    is_encrypted,
    recovery_model_desc
FROM sys.databases
WHERE name = 'NombreDeBase';

EXEC sp_configure 'backup compression default';
GO
