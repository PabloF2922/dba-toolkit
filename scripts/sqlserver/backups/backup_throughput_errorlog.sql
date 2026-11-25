/*
 * Name: Velocidad de backups en ERRORLOG
 * Engine: SQL Server
 * Category: Backups
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permiso para ejecutar xp_readerrorlog y leer el errorlog; verificar segun version
 * Risk: READ_ONLY
 * Description: Busca mensajes con velocidad de backup en el errorlog actual y anteriores.
 * Tags: backup, errorlog, velocidad, throughput
 */

-- IMPORTANTE: Los archivos históricos pueden no existir o no conservar esos mensajes.

-- Busca mensajes de backups anteriores con throughput
-- expresado en MB/sec.
--
-- Permite encontrar estadísticas de backups nativos
-- sin ejecutar nuevos respaldos.
--
-- Los logs históricos pueden no conservar la información.

-- ERRORLOG actual
EXEC xp_readerrorlog 0, 1, N'MB/sec';

-- ERRORLOG anteriores
EXEC xp_readerrorlog 1, 1, N'MB/sec';
EXEC xp_readerrorlog 2, 1, N'MB/sec';
EXEC xp_readerrorlog 3, 1, N'MB/sec';
GO
