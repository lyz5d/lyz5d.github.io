import { useEffect, useRef, useState } from "react"

const GLYPHS = "!<>-_\\/[]{}=+*^?#01"

// Text decodes from random glyphs left-to-right; the reveal frontier
// decelerates (ease-out) and the glyph swap rate decays near the end,
// so the last characters click into place one by one.
export function Decode({
  text,
  pad,
  delay = 0,
  duration = 1.2,
  className,
}: {
  text: string
  pad?: number
  delay?: number
  duration?: number
  className?: string
}) {
  const target = pad ? text.padEnd(pad, " ") : text
  const [out, setOut] = useState(() => target.replace(/./g, " "))
  const scrambleRef = useRef<string[]>([])

  useEffect(() => {
    scrambleRef.current = Array.from(
      { length: target.length },
      () => GLYPHS[(Math.random() * GLYPHS.length) | 0],
    )
    let raf = 0
    const t0 = performance.now() + delay * 1000
    const tick = () => {
      const p = (performance.now() - t0) / (duration * 1000)
      if (p < 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      if (p >= 1) {
        setOut(target)
        return
      }
      // ease-out reveal: frantic start, characters click in one-by-one at the end
      const eased = 1 - Math.pow(1 - p, 2.4)
      const revealed = Math.floor(eased * target.length)
      // glyph churn decays as p approaches 1
      const churn = 1 - p
      const scramble = scrambleRef.current
      let s = ""
      for (let i = 0; i < target.length; i++) {
        if (i < revealed) {
          s += target[i]
        } else {
          if (Math.random() < churn * 0.85 + 0.05) {
            scramble[i] = GLYPHS[(Math.random() * GLYPHS.length) | 0]
          }
          s += scramble[i]
        }
      }
      setOut(s)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, delay, duration])

  return (
    <span className={className} style={{ whiteSpace: "pre" }}>
      {out}
    </span>
  )
}
