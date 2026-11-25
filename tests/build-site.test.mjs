import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildSite } from "../tools/build-site.mjs";

test("versions styles, app and module imports in the deployment without changing sources", async () => {
  const temp = await mkdtemp(join(tmpdir(), "dba-toolkit-build-"));
  try {
    const source = join(temp, "source");
    await cp(new URL("../web/", import.meta.url), source, { recursive: true });
    const first = join(temp, "first");
    await buildSite(source, first);
    const html = await readFile(join(first, "index.html"), "utf8");
    const app = await readFile(join(first, "app.js"), "utf8");
    assert.match(html, /styles\.css\?v=[0-9a-f]{16}/);
    assert.match(html, /app\.js\?v=[0-9a-f]{16}/);
    assert.match(app, /search\.js\?v=[0-9a-f]{16}/);
    assert.match(app, /clipboard-store\.js\?v=[0-9a-f]{16}/);
    assert.doesNotMatch(await readFile(join(source, "index.html"), "utf8"), /styles\.css\?v=/);

    await writeFile(join(source, "search.js"), "export const changed = true;\n");
    const second = join(temp, "second");
    await buildSite(source, second);
    const newHtml = await readFile(join(second, "index.html"), "utf8");
    assert.notEqual(html.match(/app\.js\?v=[0-9a-f]{16}/)[0], newHtml.match(/app\.js\?v=[0-9a-f]{16}/)[0]);
    assert.equal(html.match(/styles\.css\?v=[0-9a-f]{16}/)[0], newHtml.match(/styles\.css\?v=[0-9a-f]{16}/)[0]);
    await assert.rejects(buildSite(source, second), /EEXIST/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
