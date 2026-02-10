# Phase 2: The Grid Engine

[Back to TODO Index](../TODO.md)

---

**Goal**: Render hex grid, handle mouse interaction, display sprites.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 2.1 Hex Math Library
- [ ] **Implement hex-to-pixel conversion** 🔴
  - File: `src/engine/hexMath.js`
  - Function: `hexToPixel(hx, hy)` → `{x, y}`
  - Constants: `HEX_WIDTH = 32`, `HEX_LINE_HEIGHT = 12`
  - Handle row staggering (odd rows offset by HEX_WIDTH/2)
  - Acceptance: Unit tests with known coordinates pass

- [ ] **Implement pixel-to-hex conversion** 🔴
  - Function: `pixelToHex(px, py)` → `{hx, hy}`
  - Initial approximation (integer division)
  - Refinement: check candidate hex + neighbors, pick closest
  - Acceptance: Click any pixel → get correct hex coordinate

- [ ] **Implement hex distance calculation** 🟡
  - Function: `hexDistance(hx1, hy1, hx2, hy2)` → integer
  - Use offset coordinate distance formula
  - Acceptance: Unit tests for known distances pass

- [ ] **Implement hex pathfinding** 🟢
  - Function: `hexPath(start, end)` → array of hexes
  - Simple A* or Dijkstra on hex grid
  - Acceptance: Can generate straight paths for road generator

- [ ] **Write comprehensive unit tests** 🔴
  - File: `tests/hexMath.test.js`
  - Test: hexToPixel for hexes (0,0) to (10,10)
  - Test: pixelToHex round-trip accuracy
  - Test: Distance calculation correctness
  - Test: Path between two hexes
  - Acceptance: 100% code coverage on hexMath.js

### 2.2 PixiJS Canvas Rendering
- [ ] **Set up PixiJS application** 🔴
  - File: `src/components/HexGrid.jsx`
  - Create PixiJS Application in React component
  - Render to `<canvas>` element
  - Handle resize (fit to window)
  - Acceptance: Blank canvas renders in app

- [ ] **Render hex grid overlay** 🔴
  - Draw hex outlines using PixiJS Graphics
  - Color: semi-transparent lines
  - Toggle visibility (F10 hotkey, like legacy mapper)
  - Acceptance: Can see hex grid, toggle on/off

- [ ] **Implement camera controls** 🔴
  - Pan: Click-drag or arrow keys
  - Zoom: Mouse wheel or +/- keys
  - Constraints: Don't zoom past min/max, don't pan beyond map
  - Acceptance: Smooth camera movement, no jank

- [ ] **Highlight hex under mouse** 🔴
  - Convert mouse position to hex coordinate
  - Draw highlight rectangle on hovered hex
  - Display hex coordinates in UI (top bar or tooltip)
  - Acceptance: Hover shows (hx, hy) in real-time

### 2.3 Sprite Rendering
- [ ] **Load sprite assets** 🟡
  - Parse `.fofrm` files to extract sprite frames
  - Cache in memory or IndexedDB
  - Fallback: Use placeholder rectangles if sprite missing
  - Acceptance: Can load and display at least 10 sprite types

- [ ] **Render objects on grid** 🔴
  - For each object in map state:
    1. Get sprite by ProtoID
    2. Calculate pixel position (hex + offset)
    3. Render sprite at position
  - Z-ordering: Sort by (MapY, then MapX)
  - Acceptance: Objects render in correct positions

- [ ] **Optimize rendering for performance** 🟡
  - Cull off-screen objects (don't render if outside viewport)
  - Object pooling for sprites (reuse PixiJS objects)
  - Benchmark: 1000 objects should render at 60 FPS
  - Acceptance: No frame drops with large maps

### 2.4 Mouse Interaction
- [ ] **Click to select hex** 🔴
  - Left-click: Select hex, show coordinates
  - Store selected hex in React state
  - Visual feedback: Outline selected hex
  - Acceptance: Click anywhere → hex selected

- [ ] **Click to place object** 🔴
  - If object selected in prefab browser:
    1. Click map → place object at hex
    2. Add to map state
    3. Render immediately
  - Acceptance: Can place 10 objects on map

- [ ] **Click to select object** 🔴
  - Click on object → select it (highlight)
  - Show properties panel with object data
  - Multi-select: Ctrl+click
  - Acceptance: Can select, see properties

- [ ] **Drag to move object** 🟢
  - Click-drag selected object → move to new hex
  - Visual: Ghost sprite follows mouse
  - Update map state on release
  - Acceptance: Can reposition objects
