import { matchesSearch } from "./search.js";
import { addEntry, CLIPBOARD_LIMIT, readEntries, saveEntries, validateToken } from "./clipboard-store.js";

const engines = ["Todos", "SQL Server", "Oracle", "MariaDB", "MongoDB", "PostgreSQL"];
const $ = (selector) => document.querySelector(selector);
const state = { scripts: [], engine: "Todos", category: "Todos", query: "", selected: null };
const chatMessages = [];
const chatAccessKey = "dba-toolkit.chat-password.v1";
let chatPassword = "";
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

function renderChat() {
  const container = $("#chat-messages");
  container.replaceChildren();
  if (chatMessages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "Escribí una pregunta para empezar.";
    container.append(empty);
    return;
  }
  for (const message of chatMessages) {
    const item = document.createElement("div");
    item.className = `chat-message chat-${message.role}`;
    item.textContent = message.content;
    container.append(item);
  }
  container.scrollTop = container.scrollHeight;
}

$("#chat-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#chat-input");
  const send = $("#chat-form button");
  const content = input.value.trim();
  if (!content || send.disabled) return;
  if (!chatPassword) {
    try {
      chatPassword = sessionStorage.getItem(chatAccessKey) || "";
    } catch {
      $("#chat-status").textContent = "El navegador no permite guardar el código de acceso.";
      return;
    }
  }
  if (!chatPassword) {
    chatPassword = window.prompt("Ingresá el código privado del chat:")?.trim() || "";
    if (!chatPassword) {
      $("#chat-status").textContent = "Ingresá un código para usar el chat.";
      return;
    }
  }
  chatMessages.push({ role: "user", content });
  input.value = "";
  send.disabled = true;
  $("#chat-status").textContent = "Pensando...";
  renderChat();
  try {
    const endpoint = document.body.dataset.chatEndpoint || "/api/chat";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Chat-Password": chatPassword },
      body: JSON.stringify({ messages: chatMessages })
    });
    const data = await response.json();
    if (response.status === 401) {
      chatPassword = "";
      sessionStorage.removeItem(chatAccessKey);
      throw new Error("Código incorrecto. Volvé a intentarlo.");
    }
    if (!response.ok || typeof data.answer !== "string") throw new Error(data.error || `HTTP ${response.status}`);
    chatMessages.push({ role: "assistant", content: data.answer });
    sessionStorage.setItem(chatAccessKey, chatPassword);
    $("#chat-status").textContent = "";
  } catch (error) {
    chatMessages.pop();
    $("#chat-status").textContent = `No se pudo enviar: ${error.message}`;
  } finally {
    send.disabled = false;
    renderChat();
    input.focus();
  }
});

let clipboardEntries = [];
let clipboardAvailable = false;
let clipboardBusy = false;
let clipboardToken = "";
const clipboardTokenKey = "dba-toolkit.github-token.v1";
const clipboardStatus = $("#clipboard-status");

function renderClipboard() {
  const list = $("#clipboard-list");
  list.replaceChildren();
  $("#clipboard-count").textContent = `${clipboardEntries.length}/${CLIPBOARD_LIMIT}`;
  $("#clipboard-empty").hidden = clipboardEntries.length !== 0 || !clipboardAvailable;
  $("#clipboard-clear").disabled = clipboardBusy || !clipboardAvailable || clipboardEntries.length === 0;
  $("#clipboard-refresh").disabled = clipboardBusy;
  $("#clipboard-form button").disabled = clipboardBusy;
  $("#clipboard-auth-status").textContent = clipboardToken ? "Token guardado en esta pestaña; se verificará al leer y escribir." : "El portapapeles es privado. Conectá un token para leer, guardar o borrar.";
  clipboardEntries.forEach((entry, index) => {
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
        await navigator.clipboard.writeText(entry.text);
        clipboardStatus.textContent = "Texto copiado al portapapeles.";
      } catch {
        clipboardStatus.textContent = "No se pudo copiar. Seleccioná el texto y copialo manualmente.";
      }
    });
    const remove = button("Eliminar", "text-button", async () => {
      await updateClipboard((entries) => {
        if (!entries.some((item) => item.id === entry.id)) throw new Error("Este texto ya no está disponible. Actualizá la lista.");
        return entries.filter((item) => item.id !== entry.id);
      }, "Texto eliminado de la lista actual. Permanece en el historial público.");
    });
    remove.disabled = clipboardBusy;
    remove.setAttribute("aria-label", `Eliminar texto ${index + 1}`);
    copy.setAttribute("aria-label", `Copiar texto ${index + 1}`);
    actions.append(copy, remove);
    heading.append(title, actions);
    const preview = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = entry.text;
    preview.append(code);
    item.append(heading, preview);
    list.append(item);
  });
}

async function updateClipboard(transform, message) {
  if (clipboardBusy) {
    clipboardStatus.textContent = "Hay una operación en curso. El texto queda en el campo; volvé a intentar.";
    return false;
  }
  if (!clipboardToken) {
    clipboardStatus.textContent = "Conectá un token de GitHub para guardar o borrar. El texto queda en el campo.";
    return false;
  }
  clipboardBusy = true;
  const token = clipboardToken;
  renderClipboard();
  clipboardStatus.textContent = "Guardando en GitHub...";
  try {
    const current = await readEntries(fetch, token);
    const entries = transform(current.entries);
    await saveEntries(token, current.sha, entries);
    clipboardEntries = entries;
    clipboardAvailable = true;
    clipboardStatus.textContent = message;
    return true;
  } catch (error) {
    clipboardStatus.textContent = `No se pudo guardar: ${error.message}`;
    return false;
  } finally {
    clipboardBusy = false;
    renderClipboard();
  }
}

async function addClipboardText(text) {
  const saved = await updateClipboard(
    (entries) => addEntry(entries, text, crypto.randomUUID()),
    "Texto guardado públicamente en GitHub."
  );
  if (saved && $("#clipboard-input").value === text) $("#clipboard-input").value = "";
}

async function refreshClipboard() {
  if (clipboardBusy) return;
  if (!clipboardToken) {
    clipboardAvailable = false;
    renderClipboard();
    clipboardStatus.textContent = "Conectá un token de GitHub para consultar el portapapeles privado.";
    return;
  }
  clipboardBusy = true;
  renderClipboard();
  clipboardStatus.textContent = "Cargando desde GitHub...";
  try {
    const current = await readEntries(fetch, clipboardToken);
    clipboardEntries = current.entries;
    clipboardAvailable = true;
    clipboardStatus.textContent = "Lista actualizada desde GitHub.";
  } catch (error) {
    clipboardStatus.textContent = `No se pudo cargar el portapapeles: ${error.message}`;
  } finally {
    clipboardBusy = false;
    renderClipboard();
  }
}

try {
  clipboardToken = sessionStorage.getItem(clipboardTokenKey) || "";
} catch {
  clipboardStatus.textContent = "El navegador no permite acceder al almacenamiento de sesión para el token.";
}
renderClipboard();
refreshClipboard();

$("#clipboard-token-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = $("#clipboard-token").value.trim();
  if (!token) {
    clipboardStatus.textContent = "Ingresá un token antes de conectar.";
    return;
  }
  const connect = $("#clipboard-token-form button[type=submit]");
  connect.disabled = true;
  clipboardStatus.textContent = "Verificando el token con GitHub...";
  try {
    const login = await validateToken(token);
    sessionStorage.setItem(clipboardTokenKey, token);
    clipboardToken = token;
    $("#clipboard-token").value = "";
    clipboardStatus.textContent = `Token válido para ${login}. El permiso de escritura se verificará al guardar.`;
    renderClipboard();
    await refreshClipboard();
  } catch (error) {
    clipboardStatus.textContent = `No se pudo conectar: ${error.message}`;
  } finally {
    connect.disabled = false;
  }
});
$("#clipboard-disconnect").addEventListener("click", () => {
  try {
    sessionStorage.removeItem(clipboardTokenKey);
    clipboardToken = "";
    $("#clipboard-token").value = "";
    clipboardStatus.textContent = "Token eliminado de esta pestaña.";
    renderClipboard();
  } catch {
    clipboardStatus.textContent = "No se pudo eliminar el token de la sesión del navegador.";
  }
});

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
  event.preventDefault();
  const input = $("#clipboard-input");
  input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
  addClipboardText(input.value);
});
$("#clipboard-form").addEventListener("submit", (event) => {
  event.preventDefault();
  addClipboardText($("#clipboard-input").value);
});
$("#clipboard-clear").addEventListener("click", () => updateClipboard(() => [], "Lista borrada. Los textos permanecen en el historial público."));
$("#clipboard-refresh").addEventListener("click", refreshClipboard);

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
