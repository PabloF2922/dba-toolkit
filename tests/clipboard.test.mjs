import test from "node:test";
import assert from "node:assert/strict";
import { addEntry, readEntries, saveEntries } from "../web/clipboard-store.js";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

test("keeps the five most recent entries without changing their text", () => {
  let entries = [];
  for (let i = 1; i <= 6; i++) entries = addEntry(entries, `  texto ${i}\n`);
  assert.deepEqual(entries, ["  texto 6\n", "  texto 5\n", "  texto 4\n", "  texto 3\n", "  texto 2\n"]);
  assert.throws(() => addEntry(entries, "  \n"), /Pegá o escribí/);
});

test("persists, restores and clears tab storage", () => {
  const tab = storage();
  assert.deepEqual(readEntries(tab), []);
  saveEntries(tab, ["SELECT 1;\n", "otro"]);
  assert.deepEqual(readEntries(tab), ["SELECT 1;\n", "otro"]);
  saveEntries(tab, []);
  assert.deepEqual(readEntries(tab), []);
  assert.deepEqual(readEntries(storage()), []);
});

test("surfaces storage failures and invalid stored data", () => {
  const tab = storage();
  tab.setItem("dba-toolkit.clipboard.v1", JSON.stringify(["ok", 1]));
  assert.throws(() => readEntries(tab), /formato inválido/);
  assert.throws(() => readEntries({ getItem() { throw new Error("disabled"); } }), /disabled/);
  assert.throws(() => saveEntries({ setItem() { throw new Error("quota"); } }, ["text"]), /quota/);
});
