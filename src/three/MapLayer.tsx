import { useEffect, useState } from "react"
import * as THREE from "three"
import { latLngToVec3, GLOBE_RADIUS } from "../utils/geo"

type Feature = { geometry: { type: string; coordinates: unknown } | null }
type GeoJSON = { features: Feature[] } | null

// Sample polygon rings into line-segment endpoint pairs.
function sampleSegments(data: GeoJSON, step: number, radius: number): Float32Array | null {
  if (!data || !Array.isArray(data.features)) return null
  const pts: number[] = []
  const push = (ring: number[][]) => {
    for (let i = 0; i < ring.length - 1; i++) {
      const a = ring[i]
      const b = ring[i + 1]
      const d = Math.hypot(b[0] - a[0], b[1] - a[1])
      const steps = Math.max(1, Math.ceil(d / step))
      let prev = latLngToVec3(a[1], a[0], radius)
      for (let s = 1; s <= steps; s++) {
        const t = s / steps
        const lat = a[1] + (b[1] - a[1]) * t
        const lng = a[0] + (b[0] - a[0]) * t
        const v = latLngToVec3(lat, lng, radius)
        pts.push(prev.x, prev.y, prev.z, v.x, v.y, v.z)
        prev = v
      }
    }
  }
  for (const f of data.features) {
    const g = f.geometry
    if (!g) continue
    if (g.type === "Polygon") {
      for (const ring of g.coordinates as number[][][]) push(ring)
    } else if (g.type === "MultiPolygon") {
      for (const poly of g.coordinates as number[][][][]) {
        for (const ring of poly) push(ring)
      }
    }
  }
  return pts.length ? new Float32Array(pts) : null
}

// Defer heavy sampling to idle time so it never janks an entrance animation.
function onIdle(cb: () => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(cb, { timeout: 2000 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(cb, 300)
  return () => clearTimeout(id)
}

function LineLayer({
  url,
  step,
  opacity,
  radius,
}: {
  url: string
  step: number
  opacity: number
  radius: number
}) {
  const [pos, setPos] = useState<Float32Array | null>(null)
  useEffect(() => {
    let cancelled = false
    let cancelIdle: (() => void) | null = null
    fetch(url)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: GeoJSON) => {
        if (cancelled) return
        cancelIdle = onIdle(() => {
          if (!cancelled) setPos(sampleSegments(d, step, radius))
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
      cancelIdle?.()
    }
  }, [url, step, radius])

  if (!pos) return null
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}

export function MapLayer({ dim = 1 }: { dim?: number }) {
  const base = import.meta.env.BASE_URL
  return (
    <group>
      <LineLayer url={`${base}geo/world.geojson`} step={1.2} opacity={0.14 * dim} radius={GLOBE_RADIUS * 0.985} />
      <LineLayer url={`${base}geo/china-provinces.geojson`} step={0.6} opacity={0.25 * dim} radius={GLOBE_RADIUS * 0.992} />
      <LineLayer url={`${base}geo/china-border.geojson`} step={0.3} opacity={0.7 * dim} radius={GLOBE_RADIUS * 1.0} />
    </group>
  )
}
