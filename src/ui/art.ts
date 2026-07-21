const artModules = import.meta.glob("../art/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

export function artUrl(id: string): string | null {
  for (const k in artModules) {
    if (k.endsWith("/" + id + ".svg")) return artModules[k]
  }
  return null
}
