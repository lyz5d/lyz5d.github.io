import { useMemo } from "react"
import * as THREE from "three"
import { latLngToVec3, GLOBE_RADIUS } from "../utils/geo"

// Graticule: meridians + parallels every 15deg as line segments.
function buildGraticule(radius: number): Float32Array {
  const pts: number[] = []
  const seg = 72
  const pushPair = (a: THREE.Vector3, b: THREE.Vector3) => {
    pts.push(a.x, a.y, a.z, b.x, b.y, b.z)
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * 360
      const a1 = ((i + 1) / seg) * 360
      pushPair(latLngToVec3(lat, a0, radius), latLngToVec3(lat, a1, radius))
    }
  }
  for (let lng = 0; lng < 180; lng += 15) {
    for (let i = 0; i < seg; i++) {
      const a0 = -90 + (i / seg) * 180
      const a1 = -90 + ((i + 1) / seg) * 180
      pushPair(latLngToVec3(a0, lng, radius), latLngToVec3(a1, lng, radius))
      pushPair(latLngToVec3(a0, lng + 180, radius), latLngToVec3(a1, lng + 180, radius))
    }
  }
  return new Float32Array(pts)
}

// Limb: camera-facing silhouette circle, lives outside the rotating groups.
function buildCircle(radius: number, seg = 160): Float32Array {
  const pts = new Float32Array(seg * 3)
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    pts[i * 3] = radius * Math.cos(a)
    pts[i * 3 + 1] = radius * Math.sin(a)
    pts[i * 3 + 2] = 0
  }
  return pts
}

export function Globe({ dim = 1 }: { dim?: number }) {
  const positions = useMemo(() => buildGraticule(GLOBE_RADIUS), [])
  return (
    <group>
      {/* opaque body: blocks the "17" watermark bleeding through and occludes
          all back-side lines, so only front-facing lines render */}
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS * 0.98, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.12 * dim}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}

export function GlobeLimb({ dim = 1 }: { dim?: number }) {
  const positions = useMemo(() => buildCircle(GLOBE_RADIUS), [])
  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.4 * dim}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineLoop>
  )
}
