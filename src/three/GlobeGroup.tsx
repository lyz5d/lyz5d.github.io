import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useStore } from "../store/useStore"
import { CLASSMATES } from "../data"
import { chinaFacingQuaternion, latLngToVec3, GLOBE_RADIUS } from "../utils/geo"
import { dragState } from "./dragState"
import { globeScreen, globeWorld, gateScreen, pinScreen } from "./sharedRefs"
import { Globe } from "./Globe"
import { MapLayer } from "./MapLayer"
import { Pins } from "./Pins"

const BASE_QUAT = chinaFacingQuaternion()
const FLY_IN_DURATION = 2.2

const tmpPos = new THREE.Vector3()
const tmpGate = new THREE.Vector3()
const tmpFacing = new THREE.Vector3()
const tmpProjected = new THREE.Vector3()
const tmpToCam = new THREE.Vector3()

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function GlobeGroup() {
  const posRef = useRef<THREE.Group>(null)
  const orbitRef = useRef<THREE.Group>(null)
  const pitchRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)
  const stage = useStore((s) => s.stage)
  const view = useStore((s) => s.view)
  const mode = useStore((s) => s.mode)
  const focusedStudentId = useStore((s) => s.focusedStudentId)
  const centeredUniversity = useStore((s) => s.centeredUniversity)
  const spinAngle = useRef(0)
  const enterAt = useRef<number | null>(null)

  const focusedStudent = useMemo(
    () =>
      CLASSMATES.find((c) => c.id === focusedStudentId && !c.confidential) ??
      CLASSMATES.find((c) => !c.confidential),
    [focusedStudentId],
  )
  const gateLocal = useMemo(
    () => latLngToVec3(focusedStudent?.lat ?? 35, focusedStudent?.lng ?? 105, GLOBE_RADIUS * 1.004),
    [focusedStudent],
  )

  const centeredSpot = useMemo(() => {
    const c = CLASSMATES.find((c) => c.university === centeredUniversity && !c.confidential && c.lat != null)
    return c ? { lat: c.lat as number, lng: c.lng as number } : null
  }, [centeredUniversity])
  const pinLocal = useMemo(
    () => (centeredSpot ? latLngToVec3(centeredSpot.lat, centeredSpot.lng, GLOBE_RADIUS * 1.004) : null),
    [centeredSpot],
  )

  useFrame((state, dt) => {
    const pos = posRef.current
    const orbit = orbitRef.current
    const pitch = pitchRef.current
    const spin = spinRef.current
    if (!pos || !orbit || !pitch || !spin) return
    const k = 1 - Math.pow(0.0008, dt)

    let tx = 0
    let ty = 0
    let ts = 0.0001
    if (stage === 2) {
      tx = 2.9
      ts = 1.25
    } else if (stage === 3 && view === "list") {
      tx = -2.0
      ts = 1.6
    } else if (stage === 3 && view === "focus") {
      tx = 0
      ty = -7.7
      ts = 3.6
    }

    // Stage 1 -> 2 entrance: the globe flies in from close to the camera.
    let entering = false
    if (stage === 2) {
      if (enterAt.current == null) enterAt.current = state.clock.elapsedTime
      const et = state.clock.elapsedTime - enterAt.current
      if (et < FLY_IN_DURATION) {
        entering = true
        const p = easeOutExpo(et / FLY_IN_DURATION)
        pos.position.set(tx + (0.4 - tx) * (1 - p), ty + (-2.4 - ty) * (1 - p), 5.2 * (1 - p))
        pos.scale.setScalar(Math.max(0.0001, ts + (4.6 - ts) * (1 - p)))
      }
    } else if (stage === 1) {
      enterAt.current = null
    }

    if (!entering) {
      pos.position.lerp(tmpPos.set(tx, ty, 0), k)
      const ns = pos.scale.x + (ts - pos.scale.x) * k
      pos.scale.setScalar(Math.max(0.0001, ns))
    }

    // focus view: pitch the globe forward so the China cluster rises onto the
    // top limb of the decorative bottom arc, where the 2D gate can walk.
    const pitchTarget = stage === 3 && view === "focus" ? -Math.PI / 2 + 0.22 : 0
    pitch.rotation.x += (pitchTarget - pitch.rotation.x) * (1 - Math.pow(0.004, dt))

    if (!dragState.dragging) {
      dragState.target += (0 - dragState.target) * (1 - Math.pow(0.02, dt))
    }
    dragState.current += (dragState.target - dragState.current) * (1 - Math.pow(0.0008, dt))
    orbit.rotation.y = dragState.current

    if (stage === 2) {
      const boosting = entering ? 2.2 : 1
      spinAngle.current += dt * 0.18 * boosting
    } else {
      // wrap to (-PI, PI] so the globe always takes the short way home,
      // no matter how many turns it made during stage 2
      const a = spinAngle.current
      spinAngle.current = Math.atan2(Math.sin(a), Math.cos(a))
      spinAngle.current += (0 - spinAngle.current) * (1 - Math.pow(0.01, dt))
    }
    spin.rotation.y = spinAngle.current

    // project globe center + radius for the DOM arc
    const cam = state.camera as THREE.PerspectiveCamera
    pos.getWorldPosition(globeWorld)
    tmpProjected.copy(globeWorld).project(cam)
    const w = state.size.width
    const h = state.size.height
    globeScreen.cx = (tmpProjected.x * 0.5 + 0.5) * w
    globeScreen.cy = (-tmpProjected.y * 0.5 + 0.5) * h
    const d = globeWorld.distanceTo(cam.position)
    const fov = (cam.fov * Math.PI) / 180
    const Rw = GLOBE_RADIUS * pos.scale.x
    globeScreen.r = (Rw * (h / 2)) / (Math.tan(fov / 2) * d)
    globeScreen.ready = true

    // project the focused university for the 2D gate marker (focus view)
    if (stage === 3 && view === "focus" && mode === "mates") {
      tmpGate.copy(gateLocal)
      spin.localToWorld(tmpGate)
      tmpToCam.copy(cam.position).sub(globeWorld)
      const facing = tmpFacing
        .copy(tmpGate)
        .sub(globeWorld)
        .normalize()
        .dot(tmpToCam.normalize())
      tmpProjected.copy(tmpGate).project(cam)
      gateScreen.x = (tmpProjected.x * 0.5 + 0.5) * w
      gateScreen.y = (-tmpProjected.y * 0.5 + 0.5) * h
      gateScreen.visible = facing > 0.02 && tmpProjected.z < 1
    } else {
      gateScreen.visible = false
    }

    // project the centered university's pin (list view) for the connector line
    if (stage === 3 && view === "list" && pinLocal) {
      tmpGate.copy(pinLocal)
      spin.localToWorld(tmpGate)
      tmpToCam.copy(cam.position).sub(globeWorld)
      const facing = tmpFacing
        .copy(tmpGate)
        .sub(globeWorld)
        .normalize()
        .dot(tmpToCam.normalize())
      tmpProjected.copy(tmpGate).project(cam)
      pinScreen.x = (tmpProjected.x * 0.5 + 0.5) * w
      pinScreen.y = (-tmpProjected.y * 0.5 + 0.5) * h
      pinScreen.visible = facing > 0.02 && tmpProjected.z < 1
    } else {
      pinScreen.visible = false
    }
  })

  if (stage === 1) return null

  const showPins = stage === 3 && view === "list"
  const dim = stage === 3 && view === "focus" ? 0.5 : 1

  return (
    <group ref={posRef} scale={0.0001}>
      <group ref={orbitRef}>
        <group ref={pitchRef}>
          <group quaternion={BASE_QUAT}>
            <group ref={spinRef}>
              <Globe dim={dim} />
              <MapLayer dim={dim} />
              {showPins && <Pins />}
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}
