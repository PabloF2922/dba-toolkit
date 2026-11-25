import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("accepts risk classifications for tempdb, backups and restore", () => {
  for (const risk of ["TEMPDB_WRITE", "BACKUP", "RESTORE"]) {
    assert.equal(parseScript(sql.replace("READ_ONLY", risk), "x.sql").risk, risk);
  }
});

test("backup and restore templates remain commented", async () => {
  const templates = [
    ["../scripts/sqlserver/backups/manual_full_local.sql", "BACKUP", /BACKUP\s+DATABASE/i],
    ["../scripts/sqlserver/backups/manual_full_network.sql", "BACKUP", /BACKUP\s+DATABASE/i],
    ["../scripts/sqlserver/backups/manual_full_striped.sql", "BACKUP", /BACKUP\s+DATABASE/i],
    ["../scripts/sqlserver/restore/backup_file_list.sql", "READ_ONLY", /RESTORE\s+FILELISTONLY/i],
    ["../scripts/sqlserver/restore/restore_with_move.sql", "RESTORE", /RESTORE\s+DATABASE/i]
  ];
  for (const [path, risk, statement] of templates) {
    const content = await readFile(new URL(path, import.meta.url), "utf8");
    assert.equal(parseScript(content, path).risk, risk);
    assert.match(content, statement);
    const executable = content.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--[^\r\n]*/g, "");
    assert.doesNotMatch(executable, statement);
  }
});
