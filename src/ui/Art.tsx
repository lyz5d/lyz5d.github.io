import { useEffect, useMemo, useRef } from "react"

// white-on-black inversion + strip fixed size so the svg scales to its box
function prepare(raw: string): string {
  return raw
    .replace(/#000000/gi, "#ffffff")
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/i, "$1")
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/i, "$1")
}

// sharp attack, long luxurious settle
const DRAW_EASE = "cubic-bezier(0.7, 0, 0.16, 1)"
const FIRST_DELAY = 450 // let the info rows land first
const STAGGER = 140 // head-to-tail cascade; heavy overlap since strokes run 1.1-2s

type Eye = {
  ball: SVGEllipseElement
  hx: number // pupil home (as drawn: resting top-left of the socket)
  hy: number
  sx: number // socket center
  sy: number
  maxX: number
  maxY: number
  cur: { x: number; y: number }
  tgt: { x: number; y: number }
}

export function Art({ raw }: { raw: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const html = useMemo(() => prepare(raw), [raw])

  useEffect(() => {
    const host = hostRef.current
    const svg = host?.querySelector("svg")
    if (!host || !svg) return
    svg.style.width = "100%"
    svg.style.height = "auto"
    svg.style.display = "block"

    const anims: Animation[] = []

    // trim-path draw-on: document order (head -> tail), starts staggered but
    // each stroke runs long, so several are always mid-draw at once
    const shapes = Array.from(svg.querySelectorAll<SVGGeometryElement>("path, ellipse, circle"))
    const stroked = shapes.filter((el) => el.style.fill === "none")
    const filled = shapes.filter((el) => el.style.fill !== "none")
    stroked.forEach((el, i) => {
      const len = el.getTotalLength()
      el.setAttribute("pathLength", "100")
      el.style.strokeDasharray = "100"
      el.style.strokeDashoffset = "100"
      const dur = Math.min(2000, Math.max(1100, 900 + len * 4))
      anims.push(
        el.animate([{ strokeDashoffset: "100" }, { strokeDashoffset: "0" }], {
          duration: dur,
          delay: FIRST_DELAY + i * STAGGER,
          easing: DRAW_EASE,
          fill: "both",
        }),
      )
    })
    // filled shapes (pupils, nose) can't trim; the "eyes open" near the end
    const fillStart = FIRST_DELAY + stroked.length * STAGGER * 0.7
    filled.forEach((el, i) => {
      anims.push(
        el.animate([{ opacity: "0" }, { opacity: "1" }], {
          duration: 800,
          delay: fillStart + i * 150,
          easing: "ease-out",
          fill: "both",
        }),
      )
    })

    // eyeball cursor tracking (only when the drawing names its eyes)
    const socketL = svg.querySelector<SVGEllipseElement>("#eye-left")
    const socketR = svg.querySelector<SVGEllipseElement>("#eye-right")
    const ballL = svg.querySelector<SVGEllipseElement>("#eyeball-left")
    const ballR = svg.querySelector<SVGEllipseElement>("#eyeball-right")
    let cleanupEyes: (() => void) | null = null
    if (socketL && socketR && ballL && ballR) {
      const mk = (s: SVGEllipseElement, b: SVGEllipseElement): Eye => ({
        ball: b,
        hx: Number(b.getAttribute("cx")),
        hy: Number(b.getAttribute("cy")),
        sx: Number(s.getAttribute("cx")),
        sy: Number(s.getAttribute("cy")),
        maxX: (Number(s.getAttribute("rx")) - Number(b.getAttribute("rx"))) * 0.7,
        maxY: (Number(s.getAttribute("ry")) - Number(b.getAttribute("ry"))) * 0.7,
        cur: { x: 0, y: 0 },
        tgt: { x: 0, y: 0 },
      })
      const eyes = [mk(socketL, ballL), mk(socketR, ballR)]
      const vb = svg.viewBox.baseVal
      let pointer: { x: number; y: number } | null = null
      let raf = 0
      const onMove = (e: PointerEvent) => {
        pointer = { x: e.clientX, y: e.clientY }
      }
      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (pointer) {
          const rect = svg.getBoundingClientRect()
          const scale = rect.width / vb.width // height auto => uniform scale
          const px = (pointer.x - rect.left) / scale + vb.x
          const py = (pointer.y - rect.top) / scale + vb.y
          for (const eye of eyes) {
            // clamp the gaze target inside the socket ellipse, then express
            // it as a translation from the pupil's drawn home position
            let dx = px - eye.sx
            let dy = py - eye.sy
            const q = Math.hypot(dx / eye.maxX, dy / eye.maxY)
            if (q > 1) {
              dx /= q
              dy /= q
            }
            eye.tgt.x = eye.sx + dx - eye.hx
            eye.tgt.y = eye.sy + dy - eye.hy
          }
        }
        for (const eye of eyes) {
          eye.cur.x += (eye.tgt.x - eye.cur.x) * 0.14
          eye.cur.y += (eye.tgt.y - eye.cur.y) * 0.14
          eye.ball.setAttribute(
            "transform",
            `translate(${eye.cur.x.toFixed(2)} ${eye.cur.y.toFixed(2)})`,
          )
        }
      }
      raf = requestAnimationFrame(loop)
      window.addEventListener("pointermove", onMove, { passive: true })
      cleanupEyes = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener("pointermove", onMove)
      }
    }

    return () => {
      anims.forEach((a) => a.cancel())
      cleanupEyes?.()
    }
  }, [html])

  return <div className="focus-art" ref={hostRef} dangerouslySetInnerHTML={{ __html: html }} />
}
