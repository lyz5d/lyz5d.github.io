import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "../store/useStore"

// vertical scan line sweeps left -> right; everything it passes flips theme.
// the panel covers in the target color, the store flips at full cover, then
// the panel slides off right with the line trailing its left edge.
const WIPE_EASE = [0.7, 0, 0.16, 1] as const
const WIPE_HALF = 0.55

export function ThemeToggle() {
  const stage = useStore((s) => s.stage)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const [wipe, setWipe] = useState<"in" | "out" | null>(null)
  const targetRef = useRef<"light" | "dark">("light")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const startWipe = () => {
    if (wipe) return
    targetRef.current = theme === "dark" ? "light" : "dark"
    setWipe("in")
  }

  const toLight = (wipe ? targetRef.current : theme) === "light"
  const wipeBg = toLight ? "#ffffff" : "#000000"
  const lineColor = toLight ? "#000000" : "#ffffff"

  return (
    <>
      {wipe && (
        <motion.div
          className="theme-wipe"
          style={{ background: wipeBg }}
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
          animate={{
            clipPath: wipe === "in" ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 0% 100%)",
          }}
          transition={{ duration: WIPE_HALF, ease: [...WIPE_EASE] }}
          onAnimationComplete={() => {
            if (wipe === "in") {
              toggleTheme() // flip the site while fully covered
              setWipe("out")
            } else {
              setWipe(null)
            }
          }}
        >
          <div
            className={`theme-wipe-line ${wipe === "out" ? "trailing" : ""}`}
            style={{ background: lineColor, boxShadow: `0 0 12px ${lineColor}` }}
          />
        </motion.div>
      )}
      {stage !== 1 && (
        <motion.button
          className="class-hud theme-hud"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          onClick={startWipe}
        >
          {theme === "dark" ? "LIGHT" : "DARK"}
        </motion.button>
      )}
    </>
  )
}
