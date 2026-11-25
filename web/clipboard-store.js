export const CLIPBOARD_LIMIT = 5;
const key = "dba-toolkit.clipboard.v1";

export function readEntries(storage) {
  const raw = storage.getItem(key);
  if (raw === null) return [];
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.length > CLIPBOARD_LIMIT ||
      entries.some((entry) => typeof entry !== "string" || !entry.trim())) {
    throw new Error("Los datos del portapapeles tienen un formato inválido.");
  }
  return entries;
}

export function saveEntries(storage, entries) {
  storage.setItem(key, JSON.stringify(entries));
}

export function addEntry(entries, text) {
  if (!text.trim()) throw new Error("Pegá o escribí un texto antes de guardarlo.");
  return [text, ...entries].slice(0, CLIPBOARD_LIMIT);
}
