export type Classmate = {
  id: string
  lastName: string // CN, always shown (name[0])
  firstName?: string // CN, name.slice(1); omitted for confidential
  university: string // CN; "[CLASSIFIED]" for confidential
  lat: number | null // null for confidential
  lng: number | null
  major?: string // CN; placeholder until filled in
  quote?: string // free text; placeholder shown until filled in
  confidential?: boolean
}

export type Teacher = {
  id: string
  name: string // CN
  subject: string // EN
  isHead: boolean
}

export type Mode = "mates" | "teachers"
export type Stage = 1 | 2 | 3
export type View = "list" | "focus"
