// Coordinates for tracing, colouring and dots. All on the 100 x 100 box the content is written in.

export interface Point {
  x: number;
  y: number;
}

export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);

// Evenly spaced points along a stroke, always keeping its first and last point.
export const samplePolyline = (stroke: readonly (readonly [number, number])[], step: number): Point[] => {
  const points: Point[] = [];
  stroke.forEach(([x, y], i) => {
    if (i === 0) {
      points.push({ x, y });
      return;
    }
    const [px, py] = stroke[i - 1];
    const length = Math.hypot(x - px, y - py);
    const segments = Math.max(1, Math.round(length / step));
    for (let s = 1; s <= segments; s++) {
      points.push({ x: px + ((x - px) * s) / segments, y: py + ((y - py) * s) / segments });
    }
  });
  return points;
};

// Moves through a stroke's checkpoints. A finger may skip a little ahead, because small hands
// jump between touch events, but cannot finish a stroke by touching only its far end.
export const advanceCheckpoint = (
  checkpoints: readonly Point[],
  reached: number,
  finger: Point,
  tolerance: number,
  maxSkip = 2,
): number => {
  let next = reached;
  const limit = Math.min(checkpoints.length - 1, reached + 1 + maxSkip);
  for (let i = reached + 1; i <= limit; i++) {
    if (distance(checkpoints[i], finger) <= tolerance) next = i;
  }
  return next;
};

// How to place a thin rotated View between two points. View-based, so it needs no SVG library.
export const segmentStyle = (a: Point, b: Point, thickness: number) => {
  const length = distance(a, b);
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  return {
    left: (a.x + b.x) / 2 - length / 2,
    top: (a.y + b.y) / 2 - thickness / 2,
    width: length,
    height: thickness,
    angleDeg: (angle * 180) / Math.PI,
  };
};
