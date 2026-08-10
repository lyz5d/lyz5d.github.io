import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useStore } from "../store/useStore"

// reveal wipe: the theme flips instantly underneath; an overlay in the OLD
// colors covers the screen and recedes left -> right, so the moment the scan
// line passes a pixel, that pixel already shows the new theme. no blank phase.
const WIPE_EASE = [0.7, 0, 0.16, 1] as const
const WIPE_DURATION = 1.0

type Wipe = { bg: string; fg: string }

export function ThemeToggle() {
  const stage = useStore((s) => s.stage)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const [wipe, setWipe] = useState<Wipe | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const startWipe = () => {
    if (wipe) return
    // snapshot the OLD theme for the receding overlay, then flip instantly
    setWipe(theme === "dark" ? { bg: "#000000", fg: "#ffffff" } : { bg: "#ffffff", fg: "#000000" })
    toggleTheme()
  }

  return (
    <>
      {wipe && (
        <motion.div
          className="theme-wipe"
          style={{ background: wipe.bg }}
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 100%)" }}
          transition={{ duration: WIPE_DURATION, ease: [...WIPE_EASE] }}
          onAnimationComplete={() => setWipe(null)}
        >
          <div
            className="theme-wipe-line"
            style={{ background: wipe.fg, boxShadow: `0 0 12px ${wipe.fg}` }}
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
