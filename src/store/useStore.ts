import { create } from "zustand"
import type { Mode, Stage, View } from "../data/schema"

type ScrollTarget = { uni: string; expand: boolean; nonce: number }
type Theme = "dark" | "light"

function initTheme(): Theme {
  try {
    return localStorage.getItem("cg-theme") === "light" ? "light" : "dark"
  } catch {
    return "dark"
  }
}

type Store = {
  stage: Stage
  setStage: (s: Stage) => void
  introDone: () => void

  view: View
  setView: (v: View) => void

  mode: Mode
  toggleMode: () => void
  teachersFrom: View
  backFromTeachers: () => void

  focusedStudentId: string | null
  focusStudent: (id: string) => void
  setFocusedStudentId: (id: string) => void
  backToList: () => void

  focusedTeacherId: string
  setFocusedTeacher: (id: string) => void

  query: string
  setQuery: (q: string) => void

  centeredUniversity: string | null
  setCenteredUniversity: (u: string | null) => void

  scrollTarget: ScrollTarget | null
  requestScroll: (uni: string, expand: boolean) => void
  consumeScroll: () => void

  theme: Theme
  toggleTheme: () => void
}

export const useStore = create<Store>((set, get) => ({
  stage: 1,
  setStage: (s) => set({ stage: s }),
  introDone: () => set({ stage: 2 }),

  view: "list",
  setView: (v) => set({ view: v }),

  mode: "mates",
  toggleMode: () => {
    const st = get()
    if (st.mode === "mates") {
      set({ mode: "teachers", view: "focus", focusedTeacherId: "t01", teachersFrom: st.view })
    } else {
      set({ mode: "mates", view: "focus" })
    }
  },
  teachersFrom: "list",
  backFromTeachers: () => {
    const st = get()
    if (st.mode !== "teachers") return
    // return to wherever the user entered teachers from; focus view needs a
    // valid student, so fall back to the list if none was ever focused
    const view = st.teachersFrom === "focus" && st.focusedStudentId ? "focus" : "list"
    set({ mode: "mates", view })
  },

  focusedStudentId: null,
  focusStudent: (id) => set({ mode: "mates", view: "focus", focusedStudentId: id }),
  setFocusedStudentId: (id) => set({ focusedStudentId: id }),
  backToList: () => set({ view: "list" }),

  focusedTeacherId: "t01",
  setFocusedTeacher: (id) => set({ focusedTeacherId: id }),

  query: "",
  setQuery: (q) => set({ query: q }),

  centeredUniversity: null,
  setCenteredUniversity: (u) => set({ centeredUniversity: u }),

  scrollTarget: null,
  requestScroll: (uni, expand) =>
    set((s) => ({ scrollTarget: { uni, expand, nonce: (s.scrollTarget?.nonce ?? 0) + 1 } })),
  consumeScroll: () => set({ scrollTarget: null }),

  theme: initTheme(),
  toggleTheme: () =>
    set((s) => {
      const theme: Theme = s.theme === "dark" ? "light" : "dark"
      try {
        localStorage.setItem("cg-theme", theme)
      } catch {
        // private mode etc: theme just won't persist
      }
      return { theme }
    }),
}))
