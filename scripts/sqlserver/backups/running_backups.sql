/*
 * Name: Monitorear backups en ejecución
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno
 * Risk: READ_ONLY
 * Description: Progreso y tiempos estimados de operaciones de backup activas.
 * Tags: backup, progreso, sesiones, monitoreo
 */

-- IMPORTANTE: Los tiempos de finalización son estimaciones.

-- Muestra porcentaje completado, tiempo transcurrido,
-- tiempo restante estimado y tipo de espera.
-- Ejecutar desde otra sesión de SSMS mientras corre.

SELECT
    session_id,
    DB_NAME(database_id) AS Database_Name,
    command,
    start_time,

    CAST(percent_complete AS DECIMAL(5,2))
        AS Porcentaje,

    CAST(total_elapsed_time / 60000.0
        AS DECIMAL(18,2)) AS Min_Transcurridos,

    CAST(estimated_completion_time / 60000.0
        AS DECIMAL(18,2)) AS Min_Restantes,

    DATEADD(SECOND,
        estimated_completion_time / 1000,
        GETDATE()) AS Fin_Estimado,

    wait_type

FROM sys.dm_exec_requests
WHERE command LIKE 'BACKUP%';
GO
