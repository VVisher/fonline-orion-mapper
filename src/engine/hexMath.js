/**
 * Hex Math Library for FOnline offset coordinate system.
 *
 * FOnline uses a staggered hex grid with offset coordinates.
 * Odd rows are shifted right by HEX_WIDTH/2.
 */

export const HEX_WIDTH = 32;
export const HEX_HEIGHT = 16;
export const HEX_LINE_HEIGHT = 12;

/**
 * Get the 6 vertices of a hex polygon for rendering.
 * FOnline hexes are flat-top hexagons:
 *
 *      top-left ---- top-right
 *     /                        \
 *   left                      right
 *     \                        /
 *      bot-left ---- bot-right
 *
 * The hex cell occupies HEX_WIDTH x HEX_HEIGHT pixels,
 * but rows overlap by (HEX_HEIGHT - HEX_LINE_HEIGHT) = 4px.
 *
 * @param {number} hx - Hex X coordinate
 * @param {number} hy - Hex Y coordinate
 * @returns {Array<{x: number, y: number}>} 6 vertices in order
 */
export function getHexVertices(hx, hy) {
  const { x, y } = hexToPixel(hx, hy);

  // POINTY-TOP hex (Fallout 2 / FOnline cavalier oblique projection).
  // Height = HEX_LINE_HEIGHT (12) for row tessellation.
  // Width = HEX_WIDTH (32).
  //
  // The top and bottom are pointed vertices at center-x.
  // The left and right sides have short vertical flat segments
  // connecting the upper and lower slope vertices.
  //
  //          (x+16, y)              pointy top
  //         /          \
  //   (x, y+4)      (x+32, y+4)    upper-left / upper-right
  //   |                          |  flat vertical sides (8px)
  //   (x, y+12)     (x+32, y+12)   lower-left / lower-right
  //         \          /
  //          (x+16, y+16)           pointy bottom
  //
  // Height = HEX_HEIGHT (16px). Rows spaced HEX_LINE_HEIGHT (12px) apart.
  // Overlap = 4px. Diagonal neighbors share edges in the overlap zone.
  // Verified: (0,0).lower-right(32,12) == (0,1).top(32,12) ✓
  //           (0,0).bottom(16,16) == (0,1).upper-left(16,16) ✓
  return [
    { x: x + 16, y: y },       // Top point
    { x: x + 32, y: y + 4 },   // Upper-right
    { x: x + 32, y: y + 12 },  // Lower-right
    { x: x + 16, y: y + 16 },  // Bottom point
    { x: x,      y: y + 12 },  // Lower-left
    { x: x,      y: y + 4 },   // Upper-left
  ];
}

/**
 * Convert hex coordinates to pixel position (top-left of hex bounding box).
 * FOnline uses a specific staggered system where odd rows
 * are shifted exactly 16 pixels (half width) to the right.
 * @param {number} hx - Hex X coordinate
 * @param {number} hy - Hex Y coordinate
 * @returns {{ x: number, y: number }}
 */
export function hexToPixel(hx, hy) {
  let x = hx * 32; 
  const y = hy * 12; // The 12px vertical jump

  if (hy % 2 !== 0) {
    x += 16; // The 16px stagger
  }
  return { x, y };
}

/**
 * Convert hex coordinates to pixel position of the hex center.
 * Center is at (x + HEX_WIDTH/2, y + HEX_LINE_HEIGHT/2) of the polygon.
 * @param {number} hx - Hex X coordinate
 * @param {number} hy - Hex Y coordinate
 * @returns {{ x: number, y: number }}
 */
export function hexToPixelCenter(hx, hy) {
  const { x, y } = hexToPixel(hx, hy);
  return { x: x + 16, y: y + 8 };
}

/**
 * Convert pixel position to hex coordinates.
 * Uses initial approximation then refines by checking neighbors.
 * @param {number} px - Pixel X
 * @param {number} py - Pixel Y
 * @returns {{ hx: number, hy: number }}
 */

export function pixelToHex(px, py) {
  // 1. Get rough estimate of the row (hy)
  let hy = Math.floor(py / 12); // Using HEX_LINE_HEIGHT (12)
  
  // 2. Get rough estimate of the column (hx)
  // Odd rows are shifted right by 16px (HEX_WIDTH / 2)
  let hx = (hy % 2 === 0) 
    ? Math.floor(px / 32) 
    : Math.floor((px - 16) / 32);

  // 3. The Refinement (Critical for that 'tilt' and overlap)
  // Check the candidate and its immediate neighbors
  const candidates = [
    { hx, hy },
    { hx: hx - 1, hy }, { hx: hx + 1, hy },
    { hx, hy: hy - 1 }, { hx, hy: hy + 1 },
    { hx: hx - 1, hy: hy - 1 }, { hx: hx + 1, hy: hy - 1 },
    { hx: hx - 1, hy: hy + 1 }, { hx: hx + 1, hy: hy + 1 }
  ];

  let closest = candidates[0];
  let minDist = Infinity;

  for (const c of candidates) {
    // Calculate the pixel center of this specific hex
    const centerX = (c.hx * 32) + 16 + (c.hy % 2 !== 0 ? 16 : 0);
    const centerY = (c.hy * 12) + 8; // Half of hex height (16) — polygon center

    const dx = px - centerX;
    const dy = py - centerY;
    const dist = dx * dx + dy * dy;

    if (dist < minDist) {
      minDist = dist;
      closest = c;
    }
  }

  return closest;
}


/**
 * Convert offset coordinates to cube coordinates for distance/pathfinding.
 * @param {number} hx - Hex X (offset)
 * @param {number} hy - Hex Y (offset)
 * @returns {{ q: number, r: number, s: number }}
 */
export function offsetToCube(hx, hy) {
  const q = hx - Math.floor((hy - (hy & 1)) / 2);
  const r = hy;
  const s = -q - r;
  return { q, r, s };
}

/**
 * Convert cube coordinates back to offset coordinates.
 * @param {number} q
 * @param {number} r
 * @returns {{ hx: number, hy: number }}
 */
export function cubeToOffset(q, r) {
  const hx = q + Math.floor((r - (r & 1)) / 2);
  const hy = r;
  return { hx, hy };
}

/**
 * Calculate the distance between two hexes in hex steps.
 * @param {number} hx1
 * @param {number} hy1
 * @param {number} hx2
 * @param {number} hy2
 * @returns {number}
 */
export function hexDistance(hx1, hy1, hx2, hy2) {
  const a = offsetToCube(hx1, hy1);
  const b = offsetToCube(hx2, hy2);
  return Math.max(
    Math.abs(a.q - b.q),
    Math.abs(a.r - b.r),
    Math.abs(a.s - b.s),
  );
}

/**
 * Get the 6 neighboring hex coordinates (offset coords, odd-row shift).
 * Direction order: E, NE, NW, W, SW, SE (0-5)
 * @param {number} hx
 * @param {number} hy
 * @returns {Array<{ hx: number, hy: number }>}
 */
export function hexNeighbors(hx, hy) {
  const isOdd = hy & 1;
  if (isOdd) {
    return [
      { hx: hx + 1, hy },       // E
      { hx: hx + 1, hy: hy - 1 }, // NE
      { hx,         hy: hy - 1 }, // NW
      { hx: hx - 1, hy },       // W
      { hx,         hy: hy + 1 }, // SW
      { hx: hx + 1, hy: hy + 1 }, // SE
    ];
  } else {
    return [
      { hx: hx + 1, hy },       // E
      { hx,         hy: hy - 1 }, // NE
      { hx: hx - 1, hy: hy - 1 }, // NW
      { hx: hx - 1, hy },       // W
      { hx: hx - 1, hy: hy + 1 }, // SW
      { hx,         hy: hy + 1 }, // SE
    ];
  }
}

/**
 * A* pathfinding on the hex grid.
 * Returns an array of { hx, hy } from start to end (inclusive).
 * @param {{ hx: number, hy: number }} start
 * @param {{ hx: number, hy: number }} end
 * @param {number} [maxHexX=400] - Map width bound
 * @param {number} [maxHexY=400] - Map height bound
 * @returns {Array<{ hx: number, hy: number }>}
 */
export function hexPath(start, end, maxHexX = 400, maxHexY = 400) {
  const key = (hx, hy) => `${hx},${hy}`;

  const openSet = new Map(); // key -> { hx, hy, g, f }
  const cameFrom = new Map(); // key -> key
  const gScore = new Map();

  const startKey = key(start.hx, start.hy);
  const endKey = key(end.hx, end.hy);

  gScore.set(startKey, 0);
  const startF = hexDistance(start.hx, start.hy, end.hx, end.hy);
  openSet.set(startKey, { ...start, g: 0, f: startF });

  while (openSet.size > 0) {
    // Find node in openSet with lowest f
    let currentKey = null;
    let currentNode = null;
    let lowestF = Infinity;
    for (const [k, node] of openSet) {
      if (node.f < lowestF) {
        lowestF = node.f;
        currentKey = k;
        currentNode = node;
      }
    }

    if (currentKey === endKey) {
      // Reconstruct path
      const path = [];
      let ck = endKey;
      while (ck) {
        const [chx, chy] = ck.split(',').map(Number);
        path.unshift({ hx: chx, hy: chy });
        ck = cameFrom.get(ck);
      }
      return path;
    }

    openSet.delete(currentKey);

    const neighbors = hexNeighbors(currentNode.hx, currentNode.hy);
    for (const nb of neighbors) {
      // Bounds check
      if (nb.hx < 0 || nb.hy < 0 || nb.hx >= maxHexX || nb.hy >= maxHexY) continue;

      const nbKey = key(nb.hx, nb.hy);
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

      if (tentativeG < (gScore.get(nbKey) ?? Infinity)) {
        cameFrom.set(nbKey, currentKey);
        gScore.set(nbKey, tentativeG);
        const f = tentativeG + hexDistance(nb.hx, nb.hy, end.hx, end.hy);
        openSet.set(nbKey, { ...nb, g: tentativeG, f });
      }
    }
  }

  // No path found
  return [];
}
