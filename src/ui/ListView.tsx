import { useEffect, useMemo, useRef, useState } from "react"
import { CLASSMATES } from "../data"
import type { Classmate } from "../data/schema"
import { useStore } from "../store/useStore"
import { globeScreen, pinScreen } from "../three/sharedRefs"
import { MateCard } from "./Card"

const ANGLE_STEP = 0.23
const CARD_CLEARANCE = 230 // card circle radius beyond the globe's screen radius
const SCROLLBAR_GAP = 460 // scrollbar arc radius beyond the globe's screen radius
const ARC_HALF = 0.42 // scrollbar arc half-span (radians); shorter than the column
const WARP_MS = 500

function wrap(off: number, n: number): number {
  const h = n / 2
  return (((off + h) % n) + n) % n - h
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0)
  const y0 = cy + r * Math.sin(a0)
  const x1 = cx + r * Math.cos(a1)
  const y1 = cy + r * Math.sin(a1)
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

// flat list: classmates in university-sorted order (adjacency shows the grouping)
function usePeople(query: string): Classmate[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, Classmate[]>()
    for (const c of CLASSMATES) {
      if (q && !(c.lastName + (c.firstName ?? "") + c.university).toLowerCase().includes(q)) continue
      const existing = map.get(c.university)
      if (existing) existing.push(c)
      else map.set(c.university, [c])
    }
    return Array.from(map.values()).flat()
  }, [query])
}

export function ListView() {
  const stage = useStore((s) => s.stage)
  const view = useStore((s) => s.view)
  const query = useStore((s) => s.query)
  const setQuery = useStore((s) => s.setQuery)
  const setCenteredUniversity = useStore((s) => s.setCenteredUniversity)
  const scrollTarget = useStore((s) => s.scrollTarget)
  const consumeScroll = useStore((s) => s.consumeScroll)
  const focusStudent = useStore((s) => s.focusStudent)
  const requestScroll = useStore((s) => s.requestScroll)

  const [input, setInput] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)
  const [cursorLeft, setCursorLeft] = useState(2)
  const [centeredIdx, setCenteredIdx] = useState(0)
  const [hoveredKey, setHoveredKey] = useState("")

  const people = usePeople(query)
  const peopleRef = useRef(people)
  peopleRef.current = people
  const L = people.length

  const slotsRef = useRef<(HTMLDivElement | null)[]>([])
  const currentRef = useRef(0)
  const targetRef = useRef(0)
  const velRef = useRef(0)
  const centeredRef = useRef(-1)
  const hoveredRef = useRef("")
  hoveredRef.current = hoveredKey
  const enterAtRef = useRef(0)
  const warpRef = useRef<{ t0: number; dest: number; applied: boolean } | null>(null)
  const listViewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const measureRef = useRef<CanvasRenderingContext2D | null>(null)
  const trackPathRef = useRef<SVGPathElement>(null)
  const thumbPathRef = useRef<SVGPathElement>(null)
  const hitPathRef = useRef<SVGPathElement>(null)
  const linkPathRef = useRef<SVGPathElement>(null)
  const linkNodeRef = useRef<SVGCircleElement>(null)
  const indexRef = useRef<HTMLDivElement>(null)

  const centeredItem = centeredIdx >= 0 && centeredIdx < L ? people[centeredIdx] : null
  const centeredCount = centeredItem ? people.filter((p) => p.university === centeredItem.university).length : 0

  const warpTo = (pos: number) => {
    const n = peopleRef.current.length || 1
    const adjusted = pos + n * Math.round((currentRef.current - pos) / n)
    warpRef.current = { t0: performance.now(), dest: adjusted, applied: false }
  }

  const glideTo = (pos: number) => {
    const n = peopleRef.current.length || 1
    velRef.current = 0
    targetRef.current = pos + n * Math.round((currentRef.current - pos) / n)
  }

  const updateCursor = (value: string) => {
    const el = inputRef.current
    if (!el) return
    if (!measureRef.current) {
      const ctx = document.createElement("canvas").getContext("2d")
      if (ctx) ctx.font = '0.85rem "Share Tech Mono", ui-monospace, monospace'
      measureRef.current = ctx
    }
    const w = measureRef.current?.measureText(value).width ?? 0
    setCursorLeft(Math.min(w + 2, el.clientWidth - 10))
  }

  useEffect(() => {
    currentRef.current = 0
    targetRef.current = 0
    velRef.current = 0
    warpRef.current = null
    centeredRef.current = -1
    setCenteredUniversity(peopleRef.current[0]?.university ?? null)
  }, [query, setCenteredUniversity])

  useEffect(() => {
    if (!scrollTarget) return
    const idx = peopleRef.current.findIndex((c) => c.university === scrollTarget.uni)
    if (idx >= 0) warpTo(idx)
    consumeScroll()
  }, [scrollTarget, consumeScroll])

  useEffect(() => {
    if (stage !== 3) return
    const onWheel = (e: WheelEvent) => {
      if (warpRef.current) return
      targetRef.current += e.deltaY * 0.0008
      velRef.current += e.deltaY * 0.00045
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        if (warpRef.current) return
        velRef.current = 0
        targetRef.current = Math.round(targetRef.current) + (e.key === "ArrowDown" ? 1 : -1)
      }
    }
    let touchY: number | null = null
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
      velRef.current = 0
    }
    const onTouchMove = (e: TouchEvent) => {
      if (touchY == null || warpRef.current) return
      const y = e.touches[0].clientY
      const dy = touchY - y
      touchY = y
      targetRef.current += dy * 0.008
      velRef.current = dy * 0.004
    }
    window.addEventListener("wheel", onWheel, { passive: true })
    window.addEventListener("keydown", onKey)
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: true })
    return () => {
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
    }
  }, [stage])

  // curved scrollbar drag: pointer angle -> list position (shortest path)
  useEffect(() => {
    if (stage !== 3) return
    const hit = hitPathRef.current
    if (!hit) return
    let dragging = false
    const apply = (clientX: number, clientY: number) => {
      const { cx, cy, ready } = globeScreen
      if (!ready) return
      const span = ARC_HALF * 2
      const a = Math.min(ARC_HALF, Math.max(-ARC_HALF, Math.atan2(clientY - cy, clientX - cx)))
      const frac = (a + ARC_HALF) / span
      const n = peopleRef.current.length
      if (!n) return
      velRef.current = 0
      const desired = frac * n
      const d = wrap(desired - (currentRef.current % n), n)
      targetRef.current = currentRef.current + d
    }
    const onDown = (e: PointerEvent) => {
      dragging = true
      hit.setPointerCapture(e.pointerId)
      apply(e.clientX, e.clientY)
    }
    const onMove = (e: PointerEvent) => {
      if (dragging) apply(e.clientX, e.clientY)
    }
    const onUp = () => {
      dragging = false
    }
    hit.addEventListener("pointerdown", onDown)
    hit.addEventListener("pointermove", onMove)
    hit.addEventListener("pointerup", onUp)
    return () => {
      hit.removeEventListener("pointerdown", onDown)
      hit.removeEventListener("pointermove", onMove)
      hit.removeEventListener("pointerup", onUp)
    }
  }, [stage, view])

  useEffect(() => {
    if (stage === 3) enterAtRef.current = performance.now()
  }, [stage])

  useEffect(() => {
    if (stage !== 3) return
    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)

      // warp fade: out -> teleport -> in (pin clicks / search jumps only)
      let warpFade = 1
      if (warpRef.current) {
        const p = (performance.now() - warpRef.current.t0) / WARP_MS
        if (!warpRef.current.applied && p >= 0.36) {
          currentRef.current = targetRef.current = warpRef.current.dest
          velRef.current = 0
          warpRef.current.applied = true
        }
        warpFade = p < 0.36 ? 1 - p / 0.36 : Math.min(1, (p - 0.36) / 0.64)
        if (p >= 1) warpRef.current = null
      }
      if (listViewRef.current) {
        listViewRef.current.style.filter = warpFade < 0.999 ? `blur(${((1 - warpFade) * 3).toFixed(2)}px)` : ""
      }

      if (!warpRef.current) {
        targetRef.current += velRef.current
        velRef.current *= 0.93
        if (Math.abs(velRef.current) < 0.0002) velRef.current = 0
      }

      const cur = currentRef.current
      const k = 1 - Math.pow(0.008, 1 / 60)
      const next = cur + (targetRef.current - cur) * k
      currentRef.current = next

      const items = peopleRef.current
      const n = items.length
      if (!n) return

      const ci = ((Math.round(next) % n) + n) % n
      if (ci !== centeredRef.current) {
        centeredRef.current = ci
        setCenteredIdx(ci)
        setCenteredUniversity(items[ci]?.university ?? null)
      }
      if (indexRef.current) {
        indexRef.current.textContent = `${String(ci + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`
      }

      const { cx, cy, r, ready } = globeScreen
      const R = (ready ? r : window.innerHeight * 0.35) + CARD_CLEARANCE
      const baseX = ready ? cx : window.innerWidth * 0.35
      const baseY = ready ? cy : window.innerHeight * 0.5
      const elapsed = (performance.now() - enterAtRef.current) / 1000
      const slots = slotsRef.current
      let anchorX = 0
      let anchorY = 0
      let anchorOk = false
      for (let i = 0; i < n; i++) {
        const el = slots[i]
        if (!el) continue
        const off = wrap(i - next, n)
        const abs = Math.abs(off)
        const ang = off * ANGLE_STEP
        const enter = Math.min(1, Math.max(0, (elapsed - 0.15 - Math.min(abs, 6) * 0.07) / 0.7))
        const eased = 1 - Math.pow(1 - enter, 3)
        const x = baseX + R * Math.cos(ang)
        const y = baseY + R * Math.sin(ang) + (1 - eased) * 46
        const hoverBoost = items[i].id === hoveredRef.current && abs > 0.5 ? 1.05 : 1
        const scale = Math.max(0.64, 1 - abs * 0.06) * hoverBoost * (0.9 + eased * 0.1)
        const opacity = Math.max(0, 1 - abs * 0.15 - Math.max(0, abs - 1) * 0.35) * eased * warpFade
        el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`
        el.style.opacity = String(opacity)
        el.style.zIndex = String(100 - Math.round(abs))
        el.style.pointerEvents = abs > 2.4 || warpFade < 0.99 ? "none" : "auto"
        if (i === centeredRef.current && abs < 0.5) {
          anchorX = x - 150 * scale
          anchorY = y
          anchorOk = true
        }
      }

      // connector line: centered card's left edge -> pin on the globe
      if (linkPathRef.current && linkNodeRef.current) {
        if (anchorOk && pinScreen.visible && warpFade > 0.99) {
          const mx = (anchorX + pinScreen.x) / 2
          linkPathRef.current.setAttribute(
            "d",
            `M ${anchorX.toFixed(1)} ${anchorY.toFixed(1)} C ${mx.toFixed(1)} ${anchorY.toFixed(1)}, ${mx.toFixed(1)} ${pinScreen.y.toFixed(1)}, ${pinScreen.x.toFixed(1)} ${pinScreen.y.toFixed(1)}`,
          )
          linkNodeRef.current.setAttribute("cx", pinScreen.x.toFixed(1))
          linkNodeRef.current.setAttribute("cy", pinScreen.y.toFixed(1))
          linkPathRef.current.style.opacity = "1"
          linkNodeRef.current.style.opacity = "1"
        } else {
          linkPathRef.current.style.opacity = "0"
          linkNodeRef.current.style.opacity = "0"
        }
      }

      // curved scrollbar: track + traveling arc-segment thumb
      if (ready && trackPathRef.current && thumbPathRef.current && hitPathRef.current) {
        const Rs = r + SCROLLBAR_GAP
        const span = ARC_HALF * 2
        trackPathRef.current.setAttribute("d", arcPath(cx, cy, Rs, -ARC_HALF, ARC_HALF))
        hitPathRef.current.setAttribute("d", arcPath(cx, cy, Rs, -ARC_HALF, ARC_HALF))
        const frac = (((next % n) + n) % n) / n
        const thumbLen = Math.max(0.08, (span * Math.min(7, n)) / n)
        const aStart = -ARC_HALF + frac * (span - thumbLen)
        thumbPathRef.current.setAttribute("d", arcPath(cx, cy, Rs, aStart, aStart + thumbLen))
        if (indexRef.current) {
          indexRef.current.style.transform = `translate(${(cx + Rs + 18).toFixed(1)}px, ${cy.toFixed(1)}px)`
        }
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stage, setCenteredUniversity])

  // render while stage is 3 regardless of view; AnimatePresence owns unmounting
  if (stage !== 3) return null

  return (
    <>
      <div className="search">
        {query && people.length > 0 ? (
          <button
            className="clear-btn"
            onClick={() => {
              setQuery("")
              setInput("")
            }}
          >
            ✕ CLEAR
          </button>
        ) : (
          <>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                updateCursor(e.target.value)
              }}
              onFocus={() => {
                setSearchFocused(true)
                updateCursor(input)
              }}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setQuery(input)
                  const q = input.trim().toLowerCase()
                  const first = CLASSMATES.find((c) =>
                    (c.lastName + (c.firstName ?? "")).toLowerCase().includes(q),
                  )
                  if (first) requestScroll(first.university, true)
                }
              }}
              placeholder="Search name…"
              spellCheck={false}
              aria-label="Search classmates"
            />
            {searchFocused && (
              <span className="cursor-block" style={{ left: cursorLeft }} aria-hidden="true" />
            )}
          </>
        )}
      </div>

      <svg className="scrollbar-arc" aria-hidden="true">
        <path ref={trackPathRef} className="arc-track" fill="none" />
        <path ref={thumbPathRef} className="arc-thumb" fill="none" />
        <path ref={hitPathRef} className="arc-hit" fill="none" />
      </svg>
      <div className="arc-index" ref={indexRef} aria-hidden="true" />

      <svg className="link-layer" aria-hidden="true">
        <path ref={linkPathRef} className="link-line" fill="none" />
        <circle ref={linkNodeRef} className="link-node" r="3" />
      </svg>

      <div className="list-view" ref={listViewRef}>
        {people.length === 0 && <div className="list-empty">NO SIGNAL</div>}
        {people.map((c, i) => (
          <div
            key={c.id}
            className="slot"
            ref={(el) => {
              slotsRef.current[i] = el
            }}
            style={{ position: "absolute", left: 0, top: 0 }}
            onMouseEnter={() => setHoveredKey(c.id)}
            onMouseLeave={() => setHoveredKey("")}
          >
            <div
              onClick={() => {
                if (i !== centeredIdx) glideTo(i)
                else focusStudent(c.id)
              }}
            >
              <MateCard item={c} active={i === centeredIdx} />
            </div>
          </div>
        ))}
      </div>

      {centeredItem && (
        <div className="telemetry hud-frame" key={centeredItem.university + centeredIdx}>
          <div className="tele-row tele-uni">{centeredItem.university}</div>
          <div className="tele-row">
            <span className="tele-label">COORD</span>
            {centeredItem.lat != null && centeredItem.lng != null
              ? `${centeredItem.lat.toFixed(2)}°N ${centeredItem.lng.toFixed(2)}°E`
              : "CLASSIFIED"}
          </div>
          <div className="tele-row">
            <span className="tele-label">SITE</span>×{centeredCount}{" "}
            {centeredCount > 1 ? "PEOPLE" : "PERSON"}
          </div>
          <div className="tele-row">
            <span className="tele-label">INDEX</span>
            {String(centeredIdx + 1).padStart(2, "0")} / {String(L).padStart(2, "0")}
          </div>
        </div>
      )}
    </>
  )
}
