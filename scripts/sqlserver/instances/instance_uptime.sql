/*
 * Name: Ultimo inicio de SQL Server
 * Engine: SQL Server
 * Category: Instancias
 * Compatibility: SQL Server 2012+ (verificar para Azure SQL)
 * Permissions: VIEW SERVER STATE hasta SQL Server 2019; VIEW SERVER PERFORMANCE STATE desde SQL Server 2022
 * Risk: READ_ONLY
 * Description: Consulta la fecha y hora del ultimo inicio de la instancia.
 * Tags: reinicio, uptime, inicio, patching
 */

SELECT sqlserver_start_time
FROM sys.dm_os_sys_info;
