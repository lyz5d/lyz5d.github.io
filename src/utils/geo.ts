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

// Orients the globe so China sits slightly east of the disc center: yaw the
// 98E meridian to +Z, then pitch 35deg, then a small stylistic roll.
// Keeps the equator (near) horizontal.
export function chinaFacingQuaternion(): THREE.Quaternion {
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (-98 * Math.PI) / 180)
  const pitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), (35 * Math.PI) / 180)
  const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (-6 * Math.PI) / 180)
  return roll.multiply(pitch).multiply(yaw)
}

