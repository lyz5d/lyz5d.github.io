import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useStore } from "../store/useStore"
import { CLASSMATES } from "../data"
import { Decode } from "./Decode"

const SPOTS = CLASSMATES.filter((c) => !c.confidential && c.lat != null && c.lng != null)

function CoordTicker() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % SPOTS.length), 1800)
    return () => clearInterval(id)
  }, [])
  const c = SPOTS[i]
  if (!c) return null
  return (
    <div className="ticker" aria-hidden="true">
      <span className="ticker-dot" />
      {c.lat!.toFixed(2)}°N {c.lng!.toFixed(2)}°E · {c.university}
    </div>
  )
}

export function Stage2Hero() {
  const stage = useStore((s) => s.stage)
  const setStage = useStore((s) => s.setStage)
  return (
    <AnimatePresence>
      {stage === 2 && (
        <motion.div
          className="hero"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-side" aria-hidden="true">
            第二十七班
          </div>
          <h1 className="hero-title">
            <Decode text="WHERE" pad={10} delay={0.55} duration={1.1} />
            <br />
            <Decode text="WE ARE NOW" pad={10} delay={0.75} duration={1.3} />
          </h1>
          <p className="hero-sub">
            <Decode
              text={`${CLASSMATES.length} PEOPLE · ONE CLASS · SCATTERED ACROSS THE MAP`}
              delay={1.4}
              duration={1.4}
            />
          </p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hero-btn-wrap"
          >
            <button className="hero-btn" onClick={() => setStage(3)}>
              START EXPLORING
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 1.0 }}>
            <CoordTicker />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
