export type Dot = { x: number; y: number; index: number }

// 5x7 dot-matrix glyphs
const ONE = [
  [0, 0, 1, 0, 0],
  [0, 1, 1, 0, 0],
  [1, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [1, 1, 1, 1, 1],
]
const SEVEN = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 1],
  [0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0],
  [0, 1, 0, 0, 0],
  [0, 1, 0, 0, 0],
]

export type SeventeenPattern = {
  dots: Dot[]
  cols: number
  rows: number
}

export function seventeenPattern(): SeventeenPattern {
  const gap = 1
  const cols = ONE[0].length + gap + SEVEN[0].length
  const rows = ONE.length
  const dots: Dot[] = []
  let index = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < ONE[0].length; c++) {
      if (ONE[r][c]) {
        dots.push({ x: c, y: r, index: index++ })
      }
    }
    for (let c = 0; c < SEVEN[0].length; c++) {
      if (SEVEN[r][c]) {
        dots.push({ x: c + ONE[0].length + gap, y: r, index: index++ })
      }
    }
  }
  return { dots, cols, rows }
}
