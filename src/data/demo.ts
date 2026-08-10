import type { Classmate } from "./schema"

// Privacy-safe fake roster for screen recording (?demo in the URL).
// Real list never leaves the machine on camera.
export const FAKE_CLASSMATES: Classmate[] = [
  {
    id: "f01",
    lastName: "刘",
    firstName: "雨泽",
    university: "燕山大学",
    lat: 39.92,
    lng: 119.52,
  },
  {
    id: "f02",
    lastName: "虎",
    firstName: "离",
    university: "宁夏大学",
    lat: 38.5,
    lng: 106.13,
  },
]
