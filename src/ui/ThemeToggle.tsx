import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "../store/useStore"

// live-inversion scan wipe: the theme does NOT flip at click. an overlay with
// backdrop-filter: invert(1) expands left -> right, so the scanned region
// shows the live page inverted — which, for a strictly 2-color site, is the
// new theme (globe keeps spinning on both sides of the line). at full cover
// the real theme flips underneath and the overlay unmounts in the same frame.
const WIPE_EASE = [0.7, 0, 0.16, 1] as const
const WIPE_DURATION = 1.0

export function ThemeToggle() {
  const stage = useStore((s) => s.stage)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const [lineColor, setLineColor] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const startWipe = () => {
    if (lineColor) return
    // line in the OLD theme's fg: visible against the un-scanned area
    setLineColor(theme === "dark" ? "#ffffff" : "#000000")
    // suppress color cross-fades: at the flip everything must snap at once,
    // or transitioning elements (buttons, borders) fade and read as flicker
    document.documentElement.classList.add("theme-flip")
  }

  return (
    <>
      {lineColor && (
        <motion.div
          className="theme-wipe"
          initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          transition={{ duration: WIPE_DURATION, ease: [...WIPE_EASE] }}
          onAnimationComplete={() => {
            toggleTheme() // real flip; inverted-old == new, so it's seamless
            setLineColor(null)
            document.documentElement.classList.remove("theme-flip")
          }}
        >
          <div
            className="theme-wipe-line"
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
