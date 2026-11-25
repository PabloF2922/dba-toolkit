import { matchesSearch } from "./search.js";
import { addEntry, CLIPBOARD_LIMIT, readEntries, saveEntries } from "./clipboard-store.js";

const engines = ["Todos", "SQL Server", "Oracle", "MariaDB", "MongoDB", "PostgreSQL"];
const $ = (selector) => document.querySelector(selector);
const state = { scripts: [], engine: "Todos", category: "Todos", query: "", selected: null };
const riskLabels = {
  READ_ONLY: "SOLO LECTURA",
  TEMPDB_WRITE: "USA TEMPDB",
  BACKUP: "GENERA BACKUP",
  RESTORE: "RESTAURA BD",
  MODIFIES_DATA: "MODIFICA DATOS",
  MODIFIES_STRUCTURE: "MODIFICA ESTRUCTURA"
};

function button(text, className, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = text;
  element.className = className;
  element.addEventListener("click", onClick);
  return element;
}

function renderFilters() {
  const engineContainer = $("#engines");
  engineContainer.replaceChildren();
  for (const engine of engines) {
    const active = state.engine === engine;
    const item = button(engine, `engine ${active ? "active" : ""}`, () => {
      state.engine = engine;
      state.category = "Todos";
      render();
    });
    item.setAttribute("aria-pressed", String(active));
    engineContainer.append(item);
  }
  const available = state.scripts.filter((script) => state.engine === "Todos" || script.engine === state.engine);
  const categories = ["Todos", ...new Set(available.map((script) => script.category).sort((a, b) => a.localeCompare(b, "es")))];
  const categoryContainer = $("#categories");
  categoryContainer.replaceChildren();
  for (const category of categories) {
    const active = state.category === category;
    const item = button(category, `category ${active ? "active" : ""}`, () => {
      state.category = category;
      render();
    });
    item.setAttribute("aria-pressed", String(active));
    const count = document.createElement("span");
    count.textContent = category === "Todos" ? available.length : available.filter((script) => script.category === category).length;
    item.append(count);
    categoryContainer.append(item);
  }
}

function render() {
  renderFilters();
  const results = state.scripts.filter((script) =>
    (state.engine === "Todos" || script.engine === state.engine) &&
    (state.category === "Todos" || script.category === state.category) &&
    matchesSearch(script, state.query)
  );
  $("#total-count").textContent = String(state.scripts.length).padStart(2, "0");
  $("#result-count").textContent = `${results.length} ${results.length === 1 ? "script" : "scripts"}`;
  const list = $("#script-list");
  list.replaceChildren();
  $("#empty").hidden = results.length > 0;
  for (const script of results) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "script-card";
    const icon = document.createElement("span");
    icon.className = "file-icon";
    icon.textContent = "</>";
    const body = document.createElement("span");
    body.className = "card-body";
    const title = document.createElement("strong");
    title.textContent = script.name;
    const description = document.createElement("span");
    description.className = "card-description";
    description.textContent = script.description;
    const meta = document.createElement("span");
    meta.className = "card-meta";
    meta.textContent = `${script.engine}  /  ${script.category}  /  ${script.path.split("/").pop()}`;
    body.append(title, description, meta);
    const right = document.createElement("span");
    right.className = "card-right";
    const risk = document.createElement("span");
    risk.className = `risk ${script.risk === "READ_ONLY" ? "" : "risk-write"}`;
    risk.textContent = riskLabels[script.risk] || script.risk;
    const arrow = document.createElement("span");
    arrow.className = "arrow";
    arrow.textContent = "↗";
    right.append(risk, arrow);
    card.append(icon, body, right);
    card.addEventListener("click", () => openScript(script));
    list.append(card);
  }
}

function openScript(script) {
  state.selected = script;
  $("#detail-name").textContent = script.name;
  $("#detail-path").textContent = script.path;
  $("#detail-description").textContent = script.description;
  $("#detail-sql").textContent = script.sql;
  $("#copy-status").textContent = "";
  const meta = $("#detail-meta");
  meta.replaceChildren();
  for (const [label, value] of [
    ["Motor", script.engine], ["Categoría", script.category], ["Compatibilidad", script.compatibility],
    ["Permisos", script.permissions], ["Riesgo", riskLabels[script.risk] || script.risk], ["Etiquetas", script.tags.join(", ")]
  ]) {
    const row = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    const text = document.createElement("strong");
    text.textContent = value;
    row.append(name, text);
    meta.append(row);
  }
  $("#detail").showModal();
}

$("#search").addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});
$("#close").addEventListener("click", () => $("#detail").close());
$("#copy").addEventListener("click", async () => {
  try {
    if (!navigator.clipboard) throw new Error("Portapapeles no disponible");
    await navigator.clipboard.writeText(state.selected.sql);
    $("#copy-status").textContent = "SQL copiado al portapapeles.";
  } catch {
    $("#copy-status").textContent = "No se pudo copiar. Seleccioná el SQL y copialo manualmente.";
  }
});

let clipboardEntries = [];
let clipboardAvailable = false;
const clipboardStatus = $("#clipboard-status");

function renderClipboard() {
  const list = $("#clipboard-list");
  list.replaceChildren();
  $("#clipboard-count").textContent = `${clipboardEntries.length}/${CLIPBOARD_LIMIT}`;
  $("#clipboard-empty").hidden = clipboardEntries.length !== 0 || !clipboardAvailable;
  $("#clipboard-clear").disabled = !clipboardAvailable || clipboardEntries.length === 0;
  clipboardEntries.forEach((text, index) => {
    const item = document.createElement("li");
    const heading = document.createElement("div");
    heading.className = "clipboard-item-heading";
    const title = document.createElement("strong");
    title.textContent = index === 0 ? "Más reciente" : `Texto ${index + 1}`;
    const actions = document.createElement("div");
    actions.className = "clipboard-item-actions";
    const copy = button("Copiar", "copy-button", async () => {
      try {
        if (!navigator.clipboard) throw new Error("Portapapeles no disponible");
        await navigator.clipboard.writeText(text);
        clipboardStatus.textContent = "Texto copiado al portapapeles.";
      } catch {
        clipboardStatus.textContent = "No se pudo copiar. Seleccioná el texto y copialo manualmente.";
      }
    });
    const remove = button("Eliminar", "text-button", () => {
      updateClipboard(clipboardEntries.filter((_, entryIndex) => entryIndex !== index), "Texto eliminado.");
    });
    remove.setAttribute("aria-label", `Eliminar texto ${index + 1}`);
    copy.setAttribute("aria-label", `Copiar texto ${index + 1}`);
    actions.append(copy, remove);
    heading.append(title, actions);
    const preview = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = text;
    preview.append(code);
    item.append(heading, preview);
    list.append(item);
  });
}

function updateClipboard(entries, message) {
  try {
    saveEntries(sessionStorage, entries);
    clipboardEntries = entries;
    clipboardStatus.textContent = message;
    renderClipboard();
    return true;
  } catch {
    clipboardStatus.textContent = "No se pudo guardar en esta pestaña. Revisá el almacenamiento del navegador y volvé a intentar.";
    return false;
  }
}

function addClipboardText(text) {
  try {
    return updateClipboard(addEntry(clipboardEntries, text), "Texto guardado en esta pestaña.");
  } catch (error) {
    clipboardStatus.textContent = error.message;
    return false;
  }
}

try {
  clipboardEntries = readEntries(sessionStorage);
  clipboardAvailable = true;
} catch {
  clipboardStatus.textContent = "No se pudo abrir el portapapeles temporal. Revisá el almacenamiento del navegador.";
  $("#clipboard-input").disabled = true;
  $("#clipboard-form button").disabled = true;
}
renderClipboard();

$("#clipboard-input").addEventListener("paste", (event) => {
  if (!event.clipboardData) {
    clipboardStatus.textContent = "No se pudo leer el texto pegado. Usá el botón Guardar texto.";
    return;
  }
  const text = event.clipboardData.getData("text/plain");
  if (!text) {
    clipboardStatus.textContent = "El contenido pegado no contiene texto.";
    return;
  }
  if (addClipboardText(text)) event.preventDefault();
});
$("#clipboard-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (addClipboardText($("#clipboard-input").value)) $("#clipboard-input").value = "";
});
$("#clipboard-clear").addEventListener("click", () => updateClipboard([], "Portapapeles temporal borrado."));

try {
  const response = await fetch("./catalog.json", { cache: "no-cache" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  state.scripts = await response.json();
  if (!Array.isArray(state.scripts)) throw new Error("formato inválido");
  render();
} catch (error) {
  $("#error").textContent = `No se pudo cargar el catálogo (${error.message}). Ejecutá npm run build y abrí el portal mediante el servidor local indicado en el README.`;
  $("#error").hidden = false;
}
