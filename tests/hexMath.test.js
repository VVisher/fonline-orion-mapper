import { describe, it, expect } from 'vitest';
import {
  HEX_WIDTH, HEX_LINE_HEIGHT,
  hexToPixel, hexToPixelCenter, pixelToHex,
  hexDistance, hexNeighbors, hexPath,
  offsetToCube, cubeToOffset,
} from '../src/engine/hexMath.js';

describe('hexToPixel', () => {
  it('returns (0,0) for hex (0,0)', () => {
    expect(hexToPixel(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('even row: no offset', () => {
    const p = hexToPixel(3, 4);
    expect(p.x).toBe(3 * HEX_WIDTH);
    expect(p.y).toBe(4 * HEX_LINE_HEIGHT);
  });

  it('odd row: offset by HEX_WIDTH/2', () => {
    const p = hexToPixel(3, 5);
    expect(p.x).toBe(3 * HEX_WIDTH + HEX_WIDTH / 2);
    expect(p.y).toBe(5 * HEX_LINE_HEIGHT);
  });

  it('produces consistent results for a range of hexes', () => {
    for (let hy = 0; hy <= 10; hy++) {
      for (let hx = 0; hx <= 10; hx++) {
        const p = hexToPixel(hx, hy);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('hexToPixelCenter', () => {
  it('returns center of hex (0,0)', () => {
    const c = hexToPixelCenter(0, 0);
    expect(c.x).toBe(HEX_WIDTH / 2);
    expect(c.y).toBe(8); // Half of hex height (16px)
  });
});

describe('pixelToHex', () => {
  it('round-trips through hexToPixelCenter for a grid of hexes', () => {
    for (let hy = 0; hy <= 20; hy++) {
      for (let hx = 0; hx <= 20; hx++) {
        const center = hexToPixelCenter(hx, hy);
        const result = pixelToHex(center.x, center.y);
        expect(result).toEqual({ hx, hy });
      }
    }
  });

  it('handles pixel near hex (0,0) center', () => {
    // hex (0,0) center is at pixel (16, 8)
    const result = pixelToHex(16, 8);
    expect(result.hx).toBe(0);
    expect(result.hy).toBe(0);
  });
});

describe('offsetToCube / cubeToOffset', () => {
  it('round-trips for a range of coordinates', () => {
    for (let hy = 0; hy <= 10; hy++) {
      for (let hx = 0; hx <= 10; hx++) {
        const cube = offsetToCube(hx, hy);
        // Cube invariant: q + r + s = 0
        expect(cube.q + cube.r + cube.s).toBe(0);
        const back = cubeToOffset(cube.q, cube.r);
        expect(back).toEqual({ hx, hy });
      }
    }
  });
});

describe('hexDistance', () => {
  it('distance to self is 0', () => {
    expect(hexDistance(5, 5, 5, 5)).toBe(0);
  });

  it('distance to immediate neighbor is 1', () => {
    const neighbors = hexNeighbors(5, 5);
    for (const nb of neighbors) {
      expect(hexDistance(5, 5, nb.hx, nb.hy)).toBe(1);
    }
  });

  it('distance is symmetric', () => {
    expect(hexDistance(0, 0, 5, 7)).toBe(hexDistance(5, 7, 0, 0));
  });

  it('known distance: (0,0) to (3,0) = 3', () => {
    expect(hexDistance(0, 0, 3, 0)).toBe(3);
  });
});

describe('hexNeighbors', () => {
  it('returns 6 neighbors', () => {
    expect(hexNeighbors(5, 5)).toHaveLength(6);
    expect(hexNeighbors(5, 4)).toHaveLength(6);
  });

  it('all neighbors are distance 1 away', () => {
    for (const parity of [4, 5]) { // even and odd row
      const nbs = hexNeighbors(5, parity);
      for (const nb of nbs) {
        expect(hexDistance(5, parity, nb.hx, nb.hy)).toBe(1);
      }
    }
  });

  it('neighbors are unique', () => {
    const nbs = hexNeighbors(5, 5);
    const keys = nbs.map(n => `${n.hx},${n.hy}`);
    expect(new Set(keys).size).toBe(6);
  });
});

describe('hexPath', () => {
  it('path from hex to itself is just that hex', () => {
    const path = hexPath({ hx: 5, hy: 5 }, { hx: 5, hy: 5 });
    expect(path).toEqual([{ hx: 5, hy: 5 }]);
  });

  it('path to neighbor has length 2', () => {
    const nb = hexNeighbors(5, 5)[0];
    const path = hexPath({ hx: 5, hy: 5 }, nb);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual({ hx: 5, hy: 5 });
    expect(path[1]).toEqual(nb);
  });

  it('path length equals hex distance + 1', () => {
    const path = hexPath({ hx: 0, hy: 0 }, { hx: 5, hy: 0 });
    const dist = hexDistance(0, 0, 5, 0);
    expect(path).toHaveLength(dist + 1);
  });

  it('path is contiguous (each step is a neighbor)', () => {
    const path = hexPath({ hx: 2, hy: 3 }, { hx: 8, hy: 7 });
    for (let i = 1; i < path.length; i++) {
      const d = hexDistance(path[i - 1].hx, path[i - 1].hy, path[i].hx, path[i].hy);
      expect(d).toBe(1);
    }
  });

  it('returns empty array if no path (out of bounds target)', () => {
    const path = hexPath({ hx: 0, hy: 0 }, { hx: -5, hy: -5 }, 10, 10);
    expect(path).toHaveLength(0);
  });
});
