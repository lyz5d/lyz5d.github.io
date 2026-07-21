import { useMemo } from "react"
import type { Classmate } from "../data/schema"

export function DotArt({ id }: { id: string }) {
  const cells = useMemo(() => {
    const arr: boolean[] = []
    let seed = 0
    for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) | 0
    for (let i = 0; i < 49; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      arr.push(((seed >> 8) % 3) === 0)
    }
    return arr
  }, [id])
  return (
    <div className="dot-art">
      {cells.map((on, i) => (
        <span key={i} className={on ? "on" : ""} />
      ))}
    </div>
  )
}

export function MateCard({ item, active }: { item: Classmate; active?: boolean }) {
  const c = item
  const nameDisplay = c.confidential ? c.lastName : `${c.lastName}${c.firstName ?? ""}`
  return (
    <div className={`card ${active ? "active" : ""} ${c.confidential ? "classified" : ""}`}>
      <div className="card-name">{nameDisplay}</div>
      <div className="card-sub">{c.university}</div>
    </div>
  )
}
