// Shared, non-react state for high-frequency 3D values.
export const dragState = {
  target: 0, // desired azimuth offset (radians), clamped to +/- 15deg
  current: 0, // smoothed value applied to the orbit group
  dragging: false,
  lastX: 0,
}

export const MAX_DRAG = (15 * Math.PI) / 180
