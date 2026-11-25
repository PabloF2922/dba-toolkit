/*
 * Name: Espacio asignado y utilizado por archivos
 * Engine: SQL Server
 * Category: Storage
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Acceso a la base, sus metadatos y permisos para DBCC SQLPERF; verificar segun version
 * Risk: READ_ONLY
 * Description: Espacio de archivos de datos y porcentaje usado del log.
 * Tags: archivos, espacio, log, datos, fileproperty
 */

-- IMPORTANTE: Reemplazar NombreDeBase. DBCC SQLPERF(LOGSPACE) informa sobre múltiples bases.

-- Muestra tamaño asignado y espacio utilizado de los
-- archivos de datos de NombreDeBase.
-- Para los logs, DBCC SQLPERF permite consultar el
-- porcentaje utilizado del transaction log.
-- FILEPROPERTY('SpaceUsed') no es una medida fiable
-- del espacio utilizado dentro de archivos LOG.

USE NombreDeBase;
GO

SELECT
    name,
    type_desc,
    physical_name,

    CAST(size / 131072.0
        AS DECIMAL(18,2)) AS Asignado_GB,

    CAST(FILEPROPERTY(name, 'SpaceUsed') / 131072.0
        AS DECIMAL(18,2)) AS Utilizado_GB,

    CAST((size - FILEPROPERTY(name, 'SpaceUsed'))
        / 131072.0 AS DECIMAL(18,2)) AS Libre_GB

FROM sys.database_files
WHERE type_desc = 'ROWS';

DBCC SQLPERF(LOGSPACE);
GO

USE master;
GO
