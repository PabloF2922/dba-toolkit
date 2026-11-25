import test from "node:test";
import assert from "node:assert/strict";
import { addEntry, readEntries, saveEntries } from "../web/clipboard-store.js";

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}
function file(entries) {
  return { sha: "abc", encoding: "base64", content: Buffer.from(JSON.stringify(entries)).toString("base64") };
}

test("keeps the five newest entries and exact Unicode text", () => {
  let entries = [];
  for (let i = 1; i <= 6; i++) entries = addEntry(entries, `  texto ñ ${i}\n`, String(i));
  assert.deepEqual(entries.map((entry) => entry.text), ["  texto ñ 6\n", "  texto ñ 5\n", "  texto ñ 4\n", "  texto ñ 3\n", "  texto ñ 2\n"]);
  assert.throws(() => addEntry(entries, "  \n", "7"), /Pegá o escribí/);
});

test("reads public data without a token and preserves SHA", async () => {
  const entries = [{ id: "1", text: "SELECT 'ñ';\n" }];
  const result = await readEntries(async (url, options) => {
    assert.match(url, /portapapeles\/recientes\.json$/);
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers.Authorization, undefined);
    return response(file(entries));
  });
  assert.deepEqual(result, { sha: "abc", entries });
});

test("writes authenticated UTF-8 payload with expected SHA", async () => {
  const entries = [{ id: "1", text: "área 🐢\n" }];
  await saveEntries("example-token", "abc", entries, async (url, options) => {
    assert.equal(options.method, "PUT");
    assert.equal(options.headers.Authorization, "Bearer example-token");
    const body = JSON.parse(options.body);
    assert.equal(body.sha, "abc");
    assert.equal(body.branch, "main");
    assert.deepEqual(JSON.parse(Buffer.from(body.content, "base64").toString("utf8")), entries);
    return response({});
  });
  await assert.rejects(saveEntries("", "abc", entries), /Conectá un token/);
  await assert.rejects(saveEntries("token", "abc", [{ id: "1", text: "a".repeat(512 * 1024) }]), /512 KiB/);
});

test("surfaces API conflicts, permission errors, and malformed content", async () => {
  await assert.rejects(saveEntries("token", "abc", [], async () => response({}, 409)), /otro equipo/);
  await assert.rejects(saveEntries("token", "abc", [], async () => response({}, 403)), /permisos/);
  await assert.rejects(readEntries(async () => response(file([{ id: "1", text: "" }]))), /formato inválido/);
  await assert.rejects(readEntries(async () => response({}, 404)), /HTTP 404/);
});
