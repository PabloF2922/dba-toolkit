/*
 * Name: Cuenta del servicio SQL Server
 * Engine: SQL Server
 * Category: Instancias
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Permisos de estado del servidor y acceso a metadatos; verificar segun version y entorno
 * Risk: READ_ONLY
 * Description: Consulta cuentas y estados de los servicios de SQL Server.
 * Tags: servicio, cuenta, permisos, backup
 */

-- IMPORTANTE: Verificar permisos sobre sys.dm_server_services para la versión correspondiente.

-- Identifica la cuenta que ejecuta SQL Server.
-- Importante para validar permisos de escritura al
-- realizar backups directamente a recursos compartidos.

SELECT
    servicename,
    service_account,
    status_desc

FROM sys.dm_server_services;
GO
