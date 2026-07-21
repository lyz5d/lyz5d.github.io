import * as THREE from "three"

export const GLOBE_RADIUS = 1.6

export function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = (lng * Math.PI) / 180
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta),
  )
}

// Orients the globe so China (35N, 105E) faces the camera (+Z) with the north
// pole up: yaw the 105E meridian to +Z, then pitch 35deg, then a small
// stylistic roll. Keeps the equator (near) horizontal.
export function chinaFacingQuaternion(): THREE.Quaternion {
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (-105 * Math.PI) / 180)
  const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (35 * Math.PI) / 180)
  const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (-6 * Math.PI) / 180)
  return roll.multiply(pitch).multiply(yaw)
}

// Uniform dot distribution on a sphere via the Fibonacci spiral.
export function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const offset = 2 / count
  const increment = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const phi = i * increment
    positions[i * 3] = Math.cos(phi) * r * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = Math.sin(phi) * r * radius
  }
  return positions
}

