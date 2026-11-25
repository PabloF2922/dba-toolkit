export function normalize(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function matchesSearch(script, query) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  const haystack = normalize([
    script.name, script.path, script.engine, script.category, script.description,
    script.compatibility, script.permissions, script.risk, ...script.tags, script.sql
  ].join(" "));
  return terms.every((term) => haystack.includes(term));
}
