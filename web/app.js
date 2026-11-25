import { matchesSearch } from "./search.js";

const engines = ["Todos", "SQL Server", "Oracle", "MariaDB", "MongoDB", "PostgreSQL"];
const $ = (selector) => document.querySelector(selector);
const state = { scripts: [], engine: "Todos", category: "Todos", query: "", selected: null };
const riskLabels = { READ_ONLY: "SOLO LECTURA", MODIFIES_DATA: "MODIFICA DATOS", MODIFIES_STRUCTURE: "MODIFICA ESTRUCTURA" };

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
