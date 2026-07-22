import * as THREE from "three"

// Shared, non-react: globe screen projection (center + radius) updated each frame
// by GlobeGroup, read by the DOM ListView to place cards on the globe's arc.
export const globeScreen = { cx: 0, cy: 0, r: 0, ready: false }

// World-space globe center, updated each frame by GlobeGroup.
// Read by Pins for camera-facing fade.
export const globeWorld = new THREE.Vector3()

// Screen-space position of the centered university's pin (list view), updated
// each frame by GlobeGroup; read by ListView to draw the connector line.
export const pinScreen = { x: 0, y: 0, visible: false }
