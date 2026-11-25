import test from "node:test";
import assert from "node:assert/strict";
import { parseScript } from "../tools/build-catalog.mjs";
import { matchesSearch } from "../web/search.js";

const sql = `/*
 * Name: Prueba
 * Engine: SQL Server
 * Category: Instancias
 * Compatibility: 2012+
 * Permissions: Lectura
 * Risk: READ_ONLY
 * Description: Reinicio de instancia
 * Tags: inicio, uptime
 */
SELECT sqlserver_start_time FROM sys.dm_os_sys_info;
`;

test("preserves original SQL and parses metadata", () => {
  const script = parseScript(sql, "scripts/test.sql");
  assert.equal(script.sql, sql);
  assert.deepEqual(script.tags, ["inicio", "uptime"]);
  assert.equal(script.path, "scripts/test.sql");
});

test("rejects incomplete or invalid metadata", () => {
  assert.throws(() => parseScript(sql.replace(" * Risk: READ_ONLY\n", ""), "x.sql"), /falta Risk/);
  assert.throws(() => parseScript(sql.replace("READ_ONLY", "UNKNOWN"), "x.sql"), /riesgo desconocido/);
  assert.throws(() => parseScript(sql.replace("SQL Server", "Otro"), "x.sql"), /motor desconocido/);
  assert.throws(() => parseScript(sql.replace(" * Name: Prueba", " * Name: Prueba\n * Name: Otra"), "x.sql"), /duplicado Name/);
});

test("searches content, metadata and accent-insensitive terms", () => {
  const script = parseScript(sql, "scripts/test.sql");
  assert.equal(matchesSearch(script, "INSTANCIAS sqlserver_start_time"), true);
  assert.equal(matchesSearch(script, "reinicio uptime"), true);
  assert.equal(matchesSearch(script, "backups"), false);
  assert.equal(matchesSearch(script, ""), true);
});
