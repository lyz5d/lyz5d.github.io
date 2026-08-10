import { motion } from "framer-motion"
import { useStore } from "../store/useStore"

export function ClassHud() {
  const stage = useStore((s) => s.stage)
  const mode = useStore((s) => s.mode)
  const toggleMode = useStore((s) => s.toggleMode)
  const backFromTeachers = useStore((s) => s.backFromTeachers)
  if (stage !== 3) return null
  return (
    <motion.button
      className="class-hud"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      onClick={mode === "mates" ? toggleMode : backFromTeachers}
    >
      {mode === "mates" ? "CLASS / 27" : "← BACK TO CLASS"}
    </motion.button>
  )
}
