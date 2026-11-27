import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const webRoot = join(root, "web");

function loadLocalEnv() {
  let content;
  try {
    content = readFileSync(join(root, ".env"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

loadLocalEnv();

const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const allowedOrigin = process.env.CHAT_ALLOWED_ORIGIN || "";
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function sendJson(response, status, body, origin = "") {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {})
  });
  response.end(JSON.stringify(body));
}

function corsOrigin(request) {
  const origin = request.headers.origin;
  if (!origin || !allowedOrigin || origin === allowedOrigin) return origin || "";
  return null;
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64 * 1024) throw new Error("El mensaje es demasiado grande.");
  }
  return JSON.parse(body);
}

function validateMessages(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new Error("Enviá entre 1 y 20 mensajes.");
  }
  const messages = value.map((message) => {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim() ||
        message.content.length > 8_000) {
      throw new Error("El formato de los mensajes no es válido.");
    }
    return { role: message.role, content: message.content };
  });
  if (messages[0].role !== "user") throw new Error("El primer mensaje debe ser del usuario.");
  return messages;
}

async function chat(messages) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw Object.assign(new Error("El servidor no tiene OPENAI_API_KEY configurada."), { status: 503 });
  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Respondé en español de forma clara y breve. Si no sabés algo, decilo." },
        ...messages
      ],
      temperature: 0.2
    })
  });
  const data = await upstream.json();
  if (!upstream.ok) {
    const detail = typeof data?.error?.message === "string" ? data.error.message : "OpenAI rechazó la solicitud.";
    throw Object.assign(new Error(detail), { status: upstream.status >= 500 ? 502 : 400 });
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw Object.assign(new Error("OpenAI devolvió una respuesta vacía."), { status: 502 });
  }
  return content;
}

async function serveFile(request, response) {
  const requested = request.url === "/" ? "/index.html" : request.url.split("?")[0];
  const file = resolve(webRoot, `.${requested}`);
  if (!file.startsWith(`${webRoot}\\`) || normalize(file) === webRoot) {
    response.writeHead(404);
    response.end("No encontrado");
    return;
  }
  try {
    const content = await readFile(file);
    response.writeHead(200, { "Content-Type": contentTypes[extname(file)] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      response.writeHead(404);
      response.end("No encontrado");
      return;
    }
    throw error;
  }
}

const server = createServer(async (request, response) => {
  const origin = corsOrigin(request);
  if (request.url === "/api/chat") {
    if (origin === null) return sendJson(response, 403, { error: "Origen no autorizado." });
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        Vary: "Origin"
      });
      response.end();
      return;
    }
    if (request.method !== "POST") return sendJson(response, 405, { error: "Método no permitido." }, origin);
    try {
      const body = await readJson(request);
      const answer = await chat(validateMessages(body.messages));
      sendJson(response, 200, { answer }, origin);
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : error instanceof SyntaxError ? 400 : 500;
      sendJson(response, status, { error: error.message || "No se pudo procesar el mensaje." }, origin);
    }
    return;
  }
  try {
    await serveFile(request, response);
  } catch {
    response.writeHead(500);
    response.end("Error interno del servidor");
  }
});

server.listen(port, () => console.log(`DBA Toolkit disponible en http://localhost:${port}`));
