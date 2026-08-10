import { useEffect } from "react"
import { motion } from "framer-motion"
import { useStore } from "../store/useStore"

export function ThemeToggle() {
  const stage = useStore((s) => s.stage)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  if (stage === 1) return null
  return (
    <motion.button
      className="class-hud theme-hud"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      onClick={toggleTheme}
    >
      {theme === "dark" ? "LIGHT" : "DARK"}
    </motion.button>
  )
}
