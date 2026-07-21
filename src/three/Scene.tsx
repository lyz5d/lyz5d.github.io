import { Canvas } from "@react-three/fiber"
import { CameraRig } from "./CameraRig"
import { GlobeGroup } from "./GlobeGroup"
import { DragController } from "./DragController"

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 55 }}
      gl={{ alpha: true, antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <CameraRig />
      <DragController />
      <GlobeGroup />
    </Canvas>
  )
}
