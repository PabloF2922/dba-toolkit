import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scriptRoot = join(root, "scripts");
const output = join(root, "web", "catalog.json");
const engines = ["SQL Server", "Oracle", "MariaDB", "MongoDB", "PostgreSQL"];
const risks = ["READ_ONLY", "MODIFIES_DATA", "MODIFIES_STRUCTURE"];
const required = ["Name", "Engine", "Category", "Compatibility", "Permissions", "Risk", "Description", "Tags"];

export function parseScript(content, path) {
  const header = content.match(/^\s*\/\*([\s\S]*?)\*\//);
  if (!header) throw new Error(`${path}: falta la cabecera de metadatos`);
  const fields = {};
  for (const line of header[1].split(/\r?\n/)) {
    const match = line.match(/^\s*\*\s*([A-Za-z]+):\s*(.*?)\s*$/);
    if (match) {
      if (Object.hasOwn(fields, match[1])) throw new Error(`${path}: campo duplicado ${match[1]}`);
      fields[match[1]] = match[2];
    }
  }
  for (const field of required) {
    if (!fields[field]) throw new Error(`${path}: falta ${field}`);
  }
  if (!engines.includes(fields.Engine)) throw new Error(`${path}: motor desconocido ${fields.Engine}`);
  if (!risks.includes(fields.Risk)) throw new Error(`${path}: riesgo desconocido ${fields.Risk}`);
  const tags = fields.Tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  if (!tags.length) throw new Error(`${path}: falta al menos una etiqueta`);
  return {
    path, name: fields.Name, engine: fields.Engine, category: fields.Category,
    compatibility: fields.Compatibility, permissions: fields.Permissions,
    risk: fields.Risk, description: fields.Description, tags, sql: content
  };
}

async function findSql(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await findSql(path));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".sql")) result.push(path);
  }
  return result;
}

export async function buildCatalog() {
  const files = (await findSql(scriptRoot)).sort();
  const catalog = [];
  for (const file of files) {
    const path = relative(root, file).split(sep).join("/");
    catalog.push(parseScript(await readFile(file, "utf8"), path));
  }
  await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Catalogo generado: ${catalog.length} scripts.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildCatalog().catch((error) => {
    console.error(`No se pudo generar el catalogo: ${error.message}`);
    process.exitCode = 1;
  });
}
