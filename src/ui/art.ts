// Art files live in src/art/*.svg and are imported raw so they can be
// injected inline (needed for stroke animations + DOM eye tracking).
const artModules = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>

// person id -> art file (without extension). One drawing can serve both the
// real roster and the demo roster.
function artFileFor(id: string): string | null {
  if (id === "c48") return "fox" // 孙安 — owner of the nickname
  // demo roster: even ids are 虎离 clones
  if (/^f\d+$/.test(id) && Number(id.slice(1)) % 2 === 0) return "fox"
  return null
}

export function artRaw(id: string): string | null {
  const file = artFileFor(id)
  if (!file) return null
  for (const k in artModules) {
    if (k.endsWith("/" + file + ".svg")) return artModules[k]
  }
  return null
}
