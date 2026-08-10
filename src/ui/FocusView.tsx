import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CLASSMATES, TEACHERS } from "../data"
import type { Classmate, Teacher } from "../data/schema"
import { useStore } from "../store/useStore"
import { nearestCity } from "../utils/city"
import { artRaw } from "./art"
import { Art } from "./Art"
import { EASE_OUT, DUR_PERSON } from "./motion"

const panelVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
}
const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

function Row({ label, ghost, children }: { label: string; ghost?: boolean; children: React.ReactNode }) {
  return (
    <motion.div className="info-row" variants={rowVariants}>
      <dt>{label}</dt>
      <dd className={ghost ? "ghost" : undefined}>{children}</dd>
    </motion.div>
  )
}

function MatePanel({ c }: { c: Classmate }) {
  const raw = c.confidential ? null : artRaw(c.id)
  const name = c.confidential ? c.lastName : `${c.lastName}${c.firstName ?? ""}`
  const city = !c.confidential && c.lat != null && c.lng != null ? nearestCity(c.lat, c.lng) : null
  return (
    <motion.div className="focus-motion" variants={panelVariants} initial="hidden" animate="show">
      <div className="focus-info angle-frame">
        <motion.h2 className="info-name" variants={rowVariants}>
          {name}
        </motion.h2>
        <motion.div className="info-uni" variants={rowVariants}>
          {c.university}
        </motion.div>
        <dl className="info-rows">
          <Row label="MAJOR" ghost={!c.major}>
            {c.major ?? "专业 · 待填写"}
          </Row>
          <Row label="CITY" ghost={!city}>
            {city ?? "CLASSIFIED"}
          </Row>
          <Row label="QUOTE" ghost={!c.quote}>
            <span className="quote-text">{c.quote ?? "还没有留下一句话…"}</span>
          </Row>
        </dl>
      </div>
      {raw && <Art raw={raw} />}
    </motion.div>
  )
}

function TeacherPanel({ t }: { t: Teacher }) {
  return (
    <motion.div className="focus-motion" variants={panelVariants} initial="hidden" animate="show">
      <div className="focus-info angle-frame">
        <motion.h2 className="info-name" variants={rowVariants}>
          {t.name}
          {t.isHead && <span className="tag">HEAD</span>}
        </motion.h2>
        <motion.div className="info-uni" variants={rowVariants}>
          {t.subject}
        </motion.div>
      </div>
    </motion.div>
  )
}

export function FocusView() {
  const stage = useStore((s) => s.stage)
  const view = useStore((s) => s.view)
  const mode = useStore((s) => s.mode)
  const focusedStudentId = useStore((s) => s.focusedStudentId)
  const focusedTeacherId = useStore((s) => s.focusedTeacherId)
  const setFocusedStudentId = useStore((s) => s.setFocusedStudentId)
  const setFocusedTeacher = useStore((s) => s.setFocusedTeacher)
  const backToList = useStore((s) => s.backToList)
  const backFromTeachers = useStore((s) => s.backFromTeachers)

  const [index, setIndex] = useState(0)
  const lastStep = useRef(0)

  const list = mode === "mates" ? CLASSMATES : TEACHERS
  const storeId = mode === "mates" ? focusedStudentId : focusedTeacherId
  const active = stage === 3 && view === "focus"

  useEffect(() => {
    if (!active) return
    const i = list.findIndex((c) => c.id === storeId)
    setIndex(i >= 0 ? i : 0)
  }, [active, mode, storeId, list])

  useEffect(() => {
    if (!active) return
    const step = (dir: number) => {
      if (performance.now() - lastStep.current < 400) return
      lastStep.current = performance.now()
      setIndex((prev) => {
        const n = list.length
        const ni = (prev + dir + n) % n
        const item = list[ni] as Classmate | Teacher
        if (mode === "mates") setFocusedStudentId(item.id)
        else setFocusedTeacher(item.id)
        return ni
      })
    }
    const onWheel = (e: WheelEvent) => {
      const dir = Math.sign(e.deltaY)
      if (dir !== 0) step(dir)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") step(1)
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") step(-1)
    }
    let touchY: number | null = null
    let accum = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
      accum = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null) return
      const y = e.touches[0].clientY
      accum += touchY - y
      touchY = y
      if (Math.abs(accum) > 48) {
        step(accum > 0 ? 1 : -1)
        accum = 0
      }
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("keydown", onKey)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [active, mode, list, setFocusedStudentId, setFocusedTeacher])

  // render while stage is 3 regardless of view; AnimatePresence owns unmounting
  if (stage !== 3) return null

  // index can exceed list bounds right after a mode switch (50 mates -> 6
  // teachers) because render happens before the sync effect; clamp it.
  const safeIndex = Math.min(index, list.length - 1)
  const item = list[safeIndex] as Classmate | Teacher
  const isMate = mode === "mates"

  return (
    <div className="focus-view">
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          className="focus-anim"
          initial={{ opacity: 0, y: 40, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -28, filter: "blur(3px)" }}
          transition={{ duration: DUR_PERSON, ease: EASE_OUT }}
        >
          {isMate ? <MatePanel c={item as Classmate} /> : <TeacherPanel t={item as Teacher} />}
        </motion.div>
      </AnimatePresence>

      <div className="focus-nav">
        <span className="focus-counter">
          {String(safeIndex + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
        </span>
        {isMate ? (
          <button className="back-btn" onClick={backToList}>
            ← BACK TO LIST
          </button>
        ) : (
          <button className="back-btn" onClick={backFromTeachers}>
            ← BACK TO CLASS
          </button>
        )}
      </div>
    </div>
  )
}
