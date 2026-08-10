import type { Classmate } from "./schema"

// Privacy-safe fake roster for screen recording (?demo in the URL).
// Two people, looped 5x so the arc looks populated on camera.
// Odd ids = 刘雨泽, even ids = 虎离 (fox art owner in demo mode).
const BASE: Omit<Classmate, "id">[] = [
  {
    lastName: "刘",
    firstName: "雨泽",
    university: "燕山大学",
    lat: 39.92,
    lng: 119.52,
  },
  {
    lastName: "虎",
    firstName: "离",
    university: "宁夏大学",
    lat: 38.5,
    lng: 106.13,
  },
]

export const FAKE_CLASSMATES: Classmate[] = Array.from({ length: 5 }, (_, round) =>
  BASE.map((p, i) => ({
    ...p,
    id: `f${String(round * 2 + i + 1).padStart(2, "0")}`,
  })),
).flat()
