import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function hash(content) {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function replaceOnce(content, target, replacement) {
  if (content.split(target).length !== 2) throw new Error(`No se encontró una única referencia a ${target}`);
  return content.replace(target, replacement);
}

export async function buildSite(source, output) {
  await mkdir(output);
  await cp(source, output, { recursive: true });

  let app = await readFile(join(output, "app.js"), "utf8");
  for (const name of ["search.js", "clipboard-store.js"]) {
    const dependency = await readFile(join(output, name));
    app = replaceOnce(app, `./${name}"`, `./${name}?v=${hash(dependency)}"`);
  }
  await writeFile(join(output, "app.js"), app, "utf8");
  const css = await readFile(join(output, "styles.css"));
  let html = await readFile(join(output, "index.html"), "utf8");
  html = replaceOnce(html, 'href="styles.css"', `href="styles.css?v=${hash(css)}"`);
  html = replaceOnce(html, 'src="app.js"', `src="app.js?v=${hash(app)}"`);
  await writeFile(join(output, "index.html"), html, "utf8");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error("Indica un directorio de salida que no exista.");
    process.exitCode = 1;
  } else {
    buildSite(join(root, "web"), resolve(process.argv[2])).catch((error) => {
      console.error(`No se pudo preparar el sitio: ${error.message}`);
      process.exitCode = 1;
    });
  }
}
