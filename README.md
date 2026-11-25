# DBA Toolkit

Biblioteca personal de scripts DBA, disponible localmente o como sitio publico
en GitHub Pages, sin conexion a bases de datos ni servicios de IA.

**Abrir la web:** [DBA Toolkit](https://pablof2922.github.io/dba-toolkit/)

## Plan

1. **Biblioteca local:** catalogo navegable, filtros, busqueda y copia del SQL.
2. **Publicacion:** repositorio publico y despliegue automatico con GitHub Pages.
3. **Contenido propio:** incorporar scripts autorizados, anonimizados y probados.
4. **Asistente:** busqueda sobre archivos existentes, con backend protegido y
   sin acceso a bases de datos. El SQL mostrado debe provenir del archivo original.
5. **Evolucion:** mas motores, runbooks y, si resulta util, generacion de SQL
   claramente identificada y separada de la busqueda.

## Empezar

Necesitas Node.js 18 o posterior y Python 3; no hay paquetes que instalar.
Desde esta carpeta, en PowerShell:

```powershell
npm run build
python -m http.server 8000 --bind 127.0.0.1 --directory web
```

Abri `http://127.0.0.1:8000` en el navegador. Para detener el servidor, usa
`Ctrl+C` en la terminal. La direccion local solo sirve en tu propia computadora;
no es una publicacion para otros dispositivos.

## Publicar en GitHub Pages

El repositorio y el sitio son publicos: cualquier persona puede ver y descargar
los scripts y el catalogo. Con GitHub Free se puede publicar desde un repositorio
publico sin una suscripcion a Copilot. En el repositorio, selecciona **Settings >
Pages > Build and deployment > Source > GitHub Actions**. El workflow en
`.github/workflows/pages.yml` ejecuta las pruebas, genera el catalogo desde
los archivos SQL y publica `web` con cada push a `main`.

Los cambios aparecen despues de que finaliza el workflow en la pestana
**Actions**. Para reproducir localmente los datos publicados, ejecuta
`npm run build` despues de modificar scripts.

## Portapapeles temporal

En la seccion **Portapapeles**, pega texto para agregarlo automaticamente o
escribelo y selecciona **Guardar texto**. Conserva los cinco mas recientes:
puedes copiarlos, eliminarlos individualmente o borrar todo. Los scripts
copiados desde la biblioteca no se agregan automaticamente.

Los textos se almacenan en `sessionStorage` del navegador para esa pestaña:
normalmente sobreviven a una recarga y se eliminan al cerrar la pestaña, aunque
algunos navegadores pueden restaurar sesiones o copiar su estado al duplicar
una pestaña. No se guardan en la biblioteca ni se envian al repositorio.
No pegues credenciales ni datos sensibles, especialmente en equipos compartidos.

## Agregar scripts

Guarda archivos `.sql` debajo de `scripts`, con la cabecera del ejemplo. Los
campos `Name`, `Engine`, `Category`, `Compatibility`, `Permissions`, `Risk`,
`Description` y `Tags` son obligatorios; `Tags` se separa con comas. Usa uno
de los motores que muestra el portal y uno de estos riesgos:

- `READ_ONLY`: consulta o inspeccion, sin cambios intencionales.
- `TEMPDB_WRITE`: utiliza objetos temporales.
- `BACKUP`: escribe archivos de respaldo.
- `RESTORE`: restaura una base de datos.
- `MODIFIES_DATA` o `MODIFIES_STRUCTURE`: modifica datos o estructuras.

La clasificacion es informativa y debe ser revisada: incluso una consulta puede
afectar el rendimiento. Los scripts de backup y restore se entregan comentados
como plantillas: requieren adaptar parametros, revisar y autorizar su ejecucion.
En los ejemplos, `NombreDeBase`, los nombres logicos y las rutas son marcadores,
no valores listos para ejecutar. Las consultas de I/O con `X:\` requieren ajustar
el filtro a la unidad deseada; los agrupamientos por letra no cubren todos los
puntos de montaje ni rutas UNC.

Ejecuta `npm run build` despues de cada cambio para actualizar
`web/catalog.json`. El generador rechaza metadatos incompletos o invalidos.
El SQL que muestra y copia el portal es el contenido completo del archivo,
incluida su cabecera. Para comprobar el proyecto, ejecuta `npm test`.

Los ejemplos son puntos de partida, no scripts recuperados de conversaciones
previas ni validados en tus servidores. Revisa permisos, compatibilidad,
resultados e impacto antes de ejecutarlos. No incluyas credenciales, IP,
nombres de clientes ni informacion cuya publicacion no este autorizada.

## Seguridad y alcance

Esta version no implementa autenticacion y GitHub Pages publica el catalogo
completo. **No subas informacion privada, credenciales ni scripts sin permiso
de publicacion**, aunque sean anonimizados. La IA requerira un backend adecuado:
ninguna clave de IA debe incorporarse al navegador o al repositorio.
