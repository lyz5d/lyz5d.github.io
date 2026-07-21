import type { Teacher } from "./schema"
import { CLASSMATES } from "./classmates"

export { CLASSMATES }

// 6 teachers; head teacher first.
export const TEACHERS: Teacher[] = [
  { id: "t01", name: "韩孟良", subject: "Biology", isHead: true },
  { id: "t02", name: "王江南", subject: "Chinese", isHead: false },
  { id: "t03", name: "穆英红", subject: "Mathematics", isHead: false },
  { id: "t04", name: "刘丽", subject: "English", isHead: false },
  { id: "t05", name: "盛宝范", subject: "Physics", isHead: false },
  { id: "t06", name: "艾霞", subject: "Chemistry", isHead: false },
]
