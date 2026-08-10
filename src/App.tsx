import { AnimatePresence, motion } from "framer-motion"
import { Scene } from "./three/Scene"
import { Seventeen } from "./ui/Seventeen"
import { Stage2Hero } from "./ui/Stage2Hero"
import { ListView } from "./ui/ListView"
import { FocusView } from "./ui/FocusView"
import { ClassHud } from "./ui/ClassHud"
import { ThemeToggle } from "./ui/ThemeToggle"
import { EASE_IN_OUT, DUR_VIEW } from "./ui/motion"
import { useStore } from "./store/useStore"

export default function App() {
  const view = useStore((s) => s.view)

  return (
    <div className="app">
      <Seventeen />
      <Scene />
      <div className="atmosphere" aria-hidden="true" />
      <Stage2Hero />
      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div
            key="list"
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ duration: DUR_VIEW, ease: EASE_IN_OUT }}
          >
            <ListView />
          </motion.div>
        ) : (
          <motion.div
            key="focus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DUR_VIEW * 0.7 }}
          >
            <FocusView />
          </motion.div>
        )}
      </AnimatePresence>
      <ClassHud />
      <ThemeToggle />
      <div className="crt" aria-hidden="true" />
    </div>
  )
}
