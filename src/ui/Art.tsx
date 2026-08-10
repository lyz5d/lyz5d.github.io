import { useEffect, useMemo, useRef } from "react"

// white-on-black inversion + strip fixed size so the svg scales to its box
function prepare(raw: string): string {
  return raw
    .replace(/#000000/gi, "#ffffff")
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/i, "$1")
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/i, "$1")
}

type Eye = {
  ball: SVGEllipseElement
  cx: number
  cy: number
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

    // trim-path draw-on: every unfilled stroked shape draws itself,
    // staggered in document order like a hand sketching
    const shapes = Array.from(svg.querySelectorAll<SVGGeometryElement>("path, ellipse, circle"))
    const stroked = shapes.filter((el) => el.style.fill === "none")
    const filled = shapes.filter((el) => el.style.fill !== "none")
    let delay = 450 // let the info rows land first
    for (const el of stroked) {
      const len = el.getTotalLength()
      el.setAttribute("pathLength", "100")
      el.style.strokeDasharray = "100"
      el.style.strokeDashoffset = "100"
      const dur = Math.min(900, Math.max(320, len * 2.2))
      anims.push(
        el.animate([{ strokeDashoffset: "100" }, { strokeDashoffset: "0" }], {
          duration: dur,
          delay,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        }),
      )
      delay += 70 + dur * 0.35 // overlap: next stroke starts before this one ends
    }
    // filled shapes (eyeballs, nose) can't trim; they fade in last
    for (const el of filled) {
      anims.push(
        el.animate([{ opacity: "0" }, { opacity: "1" }], {
          duration: 420,
          delay,
          easing: "ease-out",
          fill: "both",
        }),
      )
      delay += 120
    }

    // eyeball cursor tracking (only when the drawing names its eyes)
    const socketL = svg.querySelector<SVGEllipseElement>("#eye-left")
    const socketR = svg.querySelector<SVGEllipseElement>("#eye-right")
    const ballL = svg.querySelector<SVGEllipseElement>("#eyeball-left")
    const ballR = svg.querySelector<SVGEllipseElement>("#eyeball-right")
    let cleanupEyes: (() => void) | null = null
    if (socketL && socketR && ballL && ballR) {
      const mk = (s: SVGEllipseElement, b: SVGEllipseElement): Eye => ({
        ball: b,
        cx: Number(s.getAttribute("cx")),
        cy: Number(s.getAttribute("cy")),
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
          for (const eye of eyes) {
            const sx = rect.left + (eye.cx - vb.x) * scale
            const sy = rect.top + (eye.cy - vb.y) * scale
            let dx = (pointer.x - sx) / scale
            let dy = (pointer.y - sy) / scale
            // elliptical clamp: pupils stay inside their sockets
            const q = Math.hypot(dx / eye.maxX, dy / eye.maxY)
            if (q > 1) {
              dx /= q
              dy /= q
            }
            eye.tgt.x = dx
            eye.tgt.y = dy
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
