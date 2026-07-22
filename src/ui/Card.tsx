import type { Classmate } from "../data/schema"

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
