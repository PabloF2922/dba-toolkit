/*
 * Name: Inventario de archivos de bases de datos
 * Engine: SQL Server
 * Category: Storage
 * Compatibility: SQL Server 2014+ (orientativo; verificar version y entorno)
 * Permissions: Visibilidad de las bases y sus archivos en sys.databases y sys.master_files
 * Risk: READ_ONLY
 * Description: Lista nombres, tipos, tamaños y rutas de archivos de bases.
 * Tags: mdf, ndf, ldf, inventario, rutas
 */

-- IMPORTANTE: Reemplazar NombreDeBase para priorizar una base. LEFT de la ruta no representa todos los volúmenes o rutas UNC.

-- Muestra todos los archivos MDF, NDF y LDF.
--
-- Incluye:
--  Base de datos
--  Estado
--  Nombre lógico
--  Tipo de archivo
--  Disco
--  Ruta física
--  Tamaño en GB
--
-- Prioriza NombreDeBase en el resultado.

SELECT
    DB_NAME(f.database_id) AS Base,
    d.state_desc AS Estado,
    f.name AS Nombre_Logico,
    f.type_desc AS Tipo_Archivo,

    LEFT(f.physical_name, 2) AS Disco,

    f.physical_name AS Ruta_Completa,

    CAST(f.size / 131072.0
        AS DECIMAL(18,2)) AS Tamano_GB

FROM sys.master_files f

JOIN sys.databases d
    ON f.database_id = d.database_id

ORDER BY
    CASE WHEN d.name = 'NombreDeBase' THEN 0 ELSE 1 END,
    d.name,
    f.type,
    f.file_id;
GO
