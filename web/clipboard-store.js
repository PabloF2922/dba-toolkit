export const CLIPBOARD_LIMIT = 5;
const endpoint = "https://api.github.com/repos/PabloF2922/dba-toolkit-portapapeles/contents/portapapeles/recientes.json";

function decodeBase64(value) {
  const bytes = Uint8Array.from(atob(value.replace(/\s/g, "")), (character) => character.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function request(fetcher, url, options = {}) {
  const response = await fetcher(url, {
    cache: "no-store",
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers
    }
  });
  if (!response.ok) {
    if (response.status === 409) throw new Error("GitHub HTTP 409: el portapapeles cambió en otro equipo. Actualizá y volvé a intentar.");
    if (response.status === 401) throw new Error("GitHub HTTP 401: el token no es válido, venció o fue revocado. Creá o conectá otro token.");
    if (response.status === 403 || response.status === 429) {
      let detail = {};
      try {
        detail = await response.json();
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
      }
      const message = typeof detail?.message === "string" ? detail.message.toLowerCase() : "";
      if (response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0" ||
          response.headers.get("retry-after") !== null || message.includes("rate limit")) {
        throw new Error(`GitHub HTTP ${response.status}: se alcanzó un límite de solicitudes. Esperá antes de volver a intentar.`);
      }
      throw new Error("GitHub HTTP 403: acceso denegado. Revisá que el token tenga acceso a PabloF2922/dba-toolkit-portapapeles y permiso Contents: Read and write.");
    }
    if (response.status === 404) throw new Error("GitHub HTTP 404: no se encontró el archivo o el token no tiene acceso al repositorio seleccionado.");
    throw new Error(`GitHub respondió HTTP ${response.status}.`);
  }
  return response.json();
}

export async function validateToken(token, fetcher = fetch) {
  if (!token) throw new Error("Ingresá un token antes de conectar.");
  const user = await request(fetcher, "https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (typeof user.login !== "string" || !user.login) throw new Error("GitHub devolvió una respuesta de usuario inválida.");
  return user.login;
}

export async function readEntries(fetcher = fetch, token = "") {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const file = await request(fetcher, endpoint, { headers });
  if (!file.sha || file.encoding !== "base64" || typeof file.content !== "string") {
    throw new Error("GitHub devolvió un archivo de portapapeles inválido.");
  }
  const entries = JSON.parse(decodeBase64(file.content));
  if (!Array.isArray(entries) || entries.length > CLIPBOARD_LIMIT ||
      entries.some((entry) => !entry || typeof entry.id !== "string" ||
        typeof entry.text !== "string" || !entry.text.trim()) ||
      new Set(entries.map((entry) => entry.id)).size !== entries.length) {
    throw new Error("El portapapeles tiene un formato inválido.");
  }
  return { entries, sha: file.sha };
}

export function addEntry(entries, text, id) {
  if (!text.trim()) throw new Error("Pegá o escribí un texto antes de guardarlo.");
  return [{ id, text }, ...entries].slice(0, CLIPBOARD_LIMIT);
}

export async function saveEntries(token, sha, entries, fetcher = fetch) {
  if (!token) throw new Error("Conectá un token de GitHub para guardar o borrar.");
  const content = `${JSON.stringify(entries, null, 2)}\n`;
  if (new TextEncoder().encode(content).length > 512 * 1024) {
    throw new Error("Los cinco textos superan el límite conjunto de 512 KiB.");
  }
  await request(fetcher, endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Actualizar portapapeles compartido\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>",
      content: encodeBase64(content),
      sha,
      branch: "main"
    })
  });
}
