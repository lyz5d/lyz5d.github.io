import { useRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { useStore } from "../store/useStore"
import type { Stage, View } from "../data/schema"

const CAM: Record<Stage, Record<View, { pos: [number, number, number]; look: [number, number, number] }>> = {
  1: { list: { pos: [0, 0, 8], look: [0, 0, 0] }, focus: { pos: [0, 0, 8], look: [0, 0, 0] } },
  2: { list: { pos: [0, 0, 5.4], look: [0, 0, 0] }, focus: { pos: [0, 0, 5.4], look: [0, 0, 0] } },
  3: {
    list: { pos: [0, 0, 5.6], look: [-0.7, 0, 0] },
    focus: { pos: [0, 0.4, 6.0], look: [0, -1.0, 0] },
  },
}

const tmpPos = new THREE.Vector3()
const tmpLook = new THREE.Vector3()

export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const stage = useStore((s) => s.stage)
  const view = useStore((s) => s.view)
  const lookRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.0005, dt)
    const c = CAM[stage][view]
    camera.position.lerp(tmpPos.set(...c.pos), k)
    lookRef.current.lerp(tmpLook.set(...c.look), k)
    camera.lookAt(lookRef.current)
  })

  return null
}
