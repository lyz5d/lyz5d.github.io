import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { seventeenPattern } from "../utils/seventeen"
import { useStore } from "../store/useStore"

const pattern = seventeenPattern()
const DOT = 9
const GAP = 4
const STEP = DOT + GAP

type Phase = "assemble" | "grow" | "watermark" | "exit"

const VARIANTS: Record<Phase, { scale: number; x: string; opacity: number }> = {
  assemble: { scale: 1, x: "0%", opacity: 1 },
  grow: { scale: 2.6, x: "0%", opacity: 1 },
  watermark: { scale: 3.4, x: "-26%", opacity: 0.08 },
  exit: { scale: 3.4, x: "-140%", opacity: 0 },
}

export function Seventeen() {
  const introDone = useStore((s) => s.introDone)
  const stage = useStore((s) => s.stage)
  const [phase, setPhase] = useState<Phase>("assemble")
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("grow"), 1500)
    const t2 = setTimeout(() => setPhase("watermark"), 2700)
    const t3 = setTimeout(() => introDone(), 3900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [introDone])

  // stage 2 -> 3: the watermark flies away to the left, then unmounts
  useEffect(() => {
    if (stage === 3) setPhase("exit")
  }, [stage])

  if (gone) return null

  return (
    <motion.div
      className="seventeen"
      animate={VARIANTS[phase]}
      transition={{
        duration: phase === "assemble" ? 0.3 : phase === "exit" ? 0.8 : 1.1,
        ease: phase === "exit" ? "easeIn" : "easeInOut",
      }}
      onAnimationComplete={() => {
        if (phase === "exit") setGone(true)
      }}
    >
      <div
        className="seventeen-grid"
        style={{ width: pattern.cols * STEP, height: pattern.rows * STEP }}
      >
        {pattern.dots.map((d) => (
          <motion.span
            key={d.index}
            className="seventeen-dot"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: d.index * 0.018, duration: 0.3 }}
            style={{ left: d.x * STEP, top: d.y * STEP, width: DOT, height: DOT }}
          />
        ))}
      </div>
    </motion.div>
  )
}
