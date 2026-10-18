// Function registry. index.ts fills this at boot so the compat client can run
// `base44.asServiceRole.functions.invoke('name', payload)` in-process — the
// Base44 cross-function call, with no extra network hop.
let registry = {};
export function setRegistry(map) {
  registry = map;
}
export function getHandler(name) {
  return registry[name] || null;
}
export function listFunctions() {
  return Object.keys(registry).sort();
}
