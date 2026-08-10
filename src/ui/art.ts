// Art files live in src/art/*.svg and are imported raw so they can be
// injected inline (needed for stroke animations + DOM eye tracking).
const artModules = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>

// person id -> art file (without extension). One drawing can serve both the
// real roster and the demo roster.
const ART_BY_ID: Record<string, string> = {
  c48: "fox", // 孙安 — owner of the nickname
  f02: "fox", // 虎离 (demo roster)
}

export function artRaw(id: string): string | null {
  const file = ART_BY_ID[id]
  if (!file) return null
  for (const k in artModules) {
    if (k.endsWith("/" + file + ".svg")) return artModules[k]
  }
  return null
}
