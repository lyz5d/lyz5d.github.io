import { useMemo } from "react"
import * as THREE from "three"
import { fibonacciSphere, GLOBE_RADIUS } from "../utils/geo"

const DOT_COUNT = 8000

export function Globe({ dim = 1 }: { dim?: number }) {
  const positions = useMemo(() => fibonacciSphere(DOT_COUNT, GLOBE_RADIUS), [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        sizeAttenuation
        transparent
        opacity={0.85 * dim}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
