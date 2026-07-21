import { useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { CLASSMATES } from "../data"
import { latLngToVec3, GLOBE_RADIUS } from "../utils/geo"
import { useStore } from "../store/useStore"
import { globeWorld } from "./sharedRefs"

type UniGroup = { uni: string; lat: number; lng: number; ids: string[] }

function useUniversityGroups(): UniGroup[] {
  return useMemo(() => {
    const map = new Map<string, UniGroup>()
    for (const c of CLASSMATES) {
      if (c.confidential || c.lat == null || c.lng == null) continue
      const existing = map.get(c.university)
      if (existing) existing.ids.push(c.id)
      else map.set(c.university, { uni: c.university, lat: c.lat, lng: c.lng, ids: [c.id] })
    }
    const groups = Array.from(map.values())
    // decluster: spread pins sharing a ~0.1deg bucket into a small circle
    const buckets = new Map<string, UniGroup[]>()
    for (const g of groups) {
      const key = `${Math.round(g.lat * 10)},${Math.round(g.lng * 10)}`
      const b = buckets.get(key)
      if (b) b.push(g)
      else buckets.set(key, [g])
    }
    for (const b of buckets.values()) {
      if (b.length <= 1) continue
      b.forEach((g, i) => {
        const ang = (i / b.length) * Math.PI * 2
        g.lat = g.lat + 0.18 * Math.cos(ang)
        g.lng = g.lng + 0.18 * Math.sin(ang)
      })
    }
    return groups
  }, [])
}

const tmpWorld = new THREE.Vector3()
const tmpToCam = new THREE.Vector3()

// 4 short ticks on the diamond's diagonals; extend outward on hover/active
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

function Pin({
  group,
  active,
  onClick,
}: {
  group: UniGroup
  active: boolean
  onClick: () => void
}) {
  const ref = useRef<THREE.Group>(null)
  const diamondRef = useRef<THREE.Mesh>(null)
  const dotRef = useRef<THREE.Mesh>(null)
  const tickRef = useRef<THREE.LineSegments>(null)
  const hoverT = useRef(0)
  const [hovered, setHovered] = useState(false)

  const pos = useMemo(() => latLngToVec3(group.lat, group.lng, GLOBE_RADIUS * 1.004), [group.lat, group.lng])
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()),
    [pos],
  )
  const activeRef = useRef(active)
  activeRef.current = active
  const hoveredRef = useRef(hovered)
  hoveredRef.current = hovered

  useFrame((state) => {
    const g = ref.current
    if (!g) return
    // fade + disable pins on the far side of the globe
    g.getWorldPosition(tmpWorld)
    tmpToCam.copy(state.camera.position).sub(globeWorld)
    const facing = tmpWorld.sub(globeWorld).normalize().dot(tmpToCam.normalize())
    const vis = THREE.MathUtils.clamp((facing - 0.02) / 0.25, 0, 1)
    g.visible = vis > 0.01

    const t = state.clock.elapsedTime
    // active marker twinkles in hard steps, like the ticker dot
    const twinkle = Math.floor(t * 2.4) % 2 === 0 ? 1 : 0.25
    const glow = activeRef.current ? twinkle : hoveredRef.current ? 1 : 0.7

    if (diamondRef.current) {
      const mat = diamondRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = glow * vis
      const sc = activeRef.current ? 1.5 : hoveredRef.current ? 1.3 : 1
      diamondRef.current.scale.setScalar(sc)
    }
    if (dotRef.current) {
      const mat = dotRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.min(1, glow + 0.2) * vis
    }
    if (tickRef.current) {
      const want = activeRef.current || hoveredRef.current ? 1 : 0
      hoverT.current += (want - hoverT.current) * 0.18
      tickRef.current.scale.setScalar(1 + hoverT.current * 0.5)
      ;(tickRef.current.material as THREE.LineBasicMaterial).opacity = (0.3 + hoverT.current * 0.7) * vis
    }
  })

  return (
    <group
      ref={ref}
      position={pos}
      quaternion={quat}
      onPointerDown={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* center dot */}
      <mesh ref={dotRef}>
        <circleGeometry args={[0.006, 12]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* diamond reticle: 4-segment ring reads as a rotated square outline */}
      <mesh ref={diamondRef} rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.016, 0.023, 4]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {/* corner ticks */}
      <lineSegments ref={tickRef} geometry={tickGeometry}>
        <lineBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </lineSegments>
    </group>
  )
}

export function Pins() {
  const groups = useUniversityGroups()
  const centered = useStore((s) => s.centeredUniversity)
  const requestScroll = useStore((s) => s.requestScroll)

  return (
    <group>
      {groups.map((g) => (
        <Pin
          key={g.uni}
          group={g}
          active={centered === g.uni}
          onClick={() => requestScroll(g.uni, true)}
        />
      ))}
    </group>
  )
}
