import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"
import { dragState, MAX_DRAG } from "./dragState"
import { useStore } from "../store/useStore"

export function DragController() {
  const gl = useThree((s) => s.gl)
  const stage = useStore((s) => s.stage)
  const view = useStore((s) => s.view)
  const active = stage === 3 && view === "list"

  useEffect(() => {
    const el = gl.domElement
    const onDown = (e: PointerEvent) => {
      if (!active) return
      dragState.dragging = true
      dragState.lastX = e.clientX
    }
    const onMove = (e: PointerEvent) => {
      if (!dragState.dragging) return
      const dx = e.clientX - dragState.lastX
      dragState.lastX = e.clientX
      dragState.target = THREE.MathUtils.clamp(dragState.target + dx * 0.005, -MAX_DRAG, MAX_DRAG)
    }
    const onUp = () => {
      dragState.dragging = false
    }
    el.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [gl, active])

  return null
}
