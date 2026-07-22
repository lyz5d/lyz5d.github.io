import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CLASSMATES } from "../data"
import { latLngToVec3, GLOBE_RADIUS } from "../utils/geo"
import { useStore } from "../store/useStore"

const diamondGeometry = new THREE.RingGeometry(0.02, 0.028, 4)
const dotGeometry = new THREE.CircleGeometry(0.008, 12)

const UP = new THREE.Vector3(0, 0, 1)
const tmpNorm = new THREE.Vector3()

// The selected university's pin on the decorative focus-view globe.
// Slides along the arc as you cycle people (position lerped, like the old gate).
export function FocusPin() {
  const focusedId = useStore((s) => s.focusedStudentId)
  const groupRef = useRef<THREE.Group>(null)
  const diamondRef = useRef<THREE.Mesh>(null)
  const initialized = useRef(false)

  const student = useMemo(
    () =>
      CLASSMATES.find((c) => c.id === focusedId && !c.confidential) ??
      CLASSMATES.find((c) => !c.confidential),
    [focusedId],
  )
  const lat = student?.lat ?? 35
  const lng = student?.lng ?? 105
  const target = useMemo(() => latLngToVec3(lat, lng, GLOBE_RADIUS * 1.006), [lat, lng])

  useFrame((state, dt) => {
    const g = groupRef.current
    if (!g) return
    if (!initialized.current) {
      g.position.copy(target)
      initialized.current = true
    } else {
      const k = 1 - Math.pow(0.001, dt)
      g.position.lerp(target, k)
    }
    tmpNorm.copy(g.position).normalize()
    g.quaternion.setFromUnitVectors(UP, tmpNorm)

    // same twinkle as the list-view active pin
    const twinkle = Math.floor(state.clock.elapsedTime * 2.4) % 2 === 0 ? 1 : 0.25
    if (diamondRef.current) {
      ;(diamondRef.current.material as THREE.MeshBasicMaterial).opacity = twinkle
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={dotGeometry}>
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={diamondRef} geometry={diamondGeometry} rotation={[0, 0, Math.PI / 4]}>
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
