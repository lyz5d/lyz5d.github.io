import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CLASSMATES } from "../data"
import { latLngToVec3, GLOBE_RADIUS } from "../utils/geo"
import { useStore } from "../store/useStore"
import { globeWorld } from "./sharedRefs"

type UniGroup = { uni: string; lat: number; lng: number }

function useUniversityGroups(): UniGroup[] {
  return useMemo(() => {
    const map = new Map<string, UniGroup>()
    for (const c of CLASSMATES) {
      if (c.confidential || c.lat == null || c.lng == null) continue
      if (!map.has(c.university)) map.set(c.university, { uni: c.university, lat: c.lat, lng: c.lng })
    }
    return Array.from(map.values())
  }, [])
}

const tmpWorld = new THREE.Vector3()
const tmpToCam = new THREE.Vector3()

// 4 short ticks on the diamond's diagonals
const tickGeometry = (() => {
  const d = Math.SQRT1_2
  const segs: number[] = []
  for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    segs.push(sx * d * 0.03, sy * d * 0.03, 0, sx * d * 0.044, sy * d * 0.044, 0)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(segs), 3))
  return g
})()

// Pins are pure indicators: only the centered university's marker is visible.
function Pin({ group, active }: { group: UniGroup; active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const diamondRef = useRef<THREE.Mesh>(null)
  const dotRef = useRef<THREE.Mesh>(null)
  const tickRef = useRef<THREE.LineSegments>(null)
  const showT = useRef(0)

  const pos = useMemo(() => latLngToVec3(group.lat, group.lng, GLOBE_RADIUS * 1.004), [group.lat, group.lng])
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()),
    [pos],
  )
  const activeRef = useRef(active)
  activeRef.current = active

  useFrame((state) => {
    const g = ref.current
    if (!g) return
    // fade in/out with selection; also respect camera-facing
    showT.current += ((activeRef.current ? 1 : 0) - showT.current) * 0.12
    g.getWorldPosition(tmpWorld)
    tmpToCam.copy(state.camera.position).sub(globeWorld)
    const facing = tmpWorld.sub(globeWorld).normalize().dot(tmpToCam.normalize())
    const vis = THREE.MathUtils.clamp((facing - 0.02) / 0.25, 0, 1) * showT.current
    g.visible = vis > 0.01
    if (!g.visible) return

    const t = state.clock.elapsedTime
    const twinkle = Math.floor(t * 2.4) % 2 === 0 ? 1 : 0.25
    if (diamondRef.current) {
      ;(diamondRef.current.material as THREE.MeshBasicMaterial).opacity = twinkle * vis
      diamondRef.current.scale.setScalar(1.5)
    }
    if (dotRef.current) {
      ;(dotRef.current.material as THREE.MeshBasicMaterial).opacity = vis
    }
    if (tickRef.current) {
      ;(tickRef.current.material as THREE.LineBasicMaterial).opacity = vis
      tickRef.current.scale.setScalar(1.5)
    }
  })

  return (
    <group ref={ref} position={pos} quaternion={quat}>
      <mesh ref={dotRef}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={diamondRef} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.016, 0.023, 4]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments ref={tickRef} geometry={tickGeometry}>
        <lineBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export function Pins() {
  const groups = useUniversityGroups()
  const centered = useStore((s) => s.centeredUniversity)

  return (
    <group>
      {groups.map((g) => (
        <Pin key={g.uni} group={g} active={centered === g.uni} />
      ))}
    </group>
  )
}
