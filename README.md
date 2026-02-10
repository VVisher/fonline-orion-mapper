# ORION: FOnline Map Architect

**ORION** is a standalone, procedural-assisted map creation suite designed to replace the legacy FOnline mapper. Built for designers, not coders.

---

## Table of Contents

1. [Project Vision](#project-vision)
2. [Why ORION?](#why-orion)
3. [Core Philosophy](#core-philosophy)
4. [Feature Overview](#feature-overview)
5. [Technical Architecture](#technical-architecture)
6. [File Structure Reference](#file-structure-reference)
7. [Development Roadmap](#development-roadmap)
8. [Technical Deep-Dive](#technical-deep-dive)
9. [Getting Started (For Developers)](#getting-started-for-developers)

---

## Project Vision

ORION transforms FOnline map creation from a technical nightmare into an intuitive, visual workflow. The goal is **zero-code map creation** where users work with visual concepts (Roads, Buildings, Rubble) while the system handles all the hex-offset calculations, proto-stacking, and script-attachment under the hood.

### Target Users

- **Primary**: Game designers, level designers, world-builders with **zero coding knowledge**
- **Secondary**: Modders who want rapid iteration without fighting the legacy mapper
- **Tertiary**: Server admins who need to quickly generate or modify maps

---

## Why ORION?

### Problems with Legacy Mapper

The original FOnline mapper (`fo_mapper.dll`) is a nightmare of:

- **Signed/unsigned mismatches** in coordinate systems
- **Obscure script warnings** that require engine knowledge to debug
- **Pixel-hunting** for offset placement
- **No validation** - invalid maps crash the server at runtime
- **No procedural tools** - everything is manual placement
- **Cryptic ProtoID numbers** instead of visual previews
- **Manual script injection** for every "smart object"
- **Client dependency** - can't run standalone

### ORION Solutions

| Legacy Problem | ORION Solution |
|----------------|----------------|
| Cryptic ProtoIDs (e.g., `5622`) | Visual catalog with thumbnails: "Industrial Floor Tile" |
| Manual hex math | Automatic grid snapping with visual feedback |
| Script attachment hell | Smart prefabs with pre-configured scripts |
| No validation | Real-time validation before export |
| Pixel offset guessing | Visual offset adjustment with preview |
| No procedural tools | Built-in PCG for roads, forests, ruins, buildings |
| Client-dependent | Standalone web/desktop app |
| Map corruption on save | Robust serialization with backup system |

---

## Core Philosophy

### "Lego-Brick" Design Pattern

Users interact with **high-level concepts**:

- **Roads** → System places cobblestone tiles, road debris, tire stacks with proper randomization
- **Forest** → System distributes trees with natural clustering, understory vegetation
- **Building Interior** → System generates floor tiles, walls, furniture with collision handling
- **Ruined City** → System blends rubble, broken walls, debris with procedural variation

The user never sees:
- Hex coordinates (146, 154)
- ProtoIDs (5622, 2067, 7869)
- Offset values (OffsetX: -7, OffsetY: 8)
- Script attachment syntax (ScriptName: PHX_dungeons, FuncName: _InitDungeonLocker)

### Zero-Code Guarantee

**No user should ever need to:**
- Write AngelScript code
- Edit `.fomap` files manually
- Calculate hex coordinates
- Look up ProtoIDs in documentation
- Remember offset conventions
- Debug script errors

---

## Feature Overview

### 1. Visual Prefab System

**Concept**: Users pick from categorized visual libraries, not raw ProtoIDs.

**Implementation**:
- Parse all `.fopro` files to build searchable database
- Generate thumbnail previews from `.fofrm` sprite files
- Organize into logical categories:
  - **Terrain**: Floors, Tiles, Ground
  - **Walls & Doors**: Interior/Exterior structures
  - **Furniture**: Tables, Chairs, Lockers, Shelves
  - **Decoration**: Props, Clutter, Plants
  - **Interactive**: Containers, Terminals, Workbenches
  - **Environmental**: Trees, Rocks, Water features
  - **Themed Sets**: Enclave Tech, Sewer, Desert, Urban

**User Experience**:
```
User clicks "Furniture" → "Storage"
  Sees visual grid:
    [Locker Image] "Metal Locker"
    [Footlocker Image] "Footlocker"
    [Filing Cabinet Image] "Filing Cabinet"
  Clicks "Metal Locker"
  Clicks map location
  → System automatically:
    1. Places floor tile (if needed)
    2. Places locker with correct offset
    3. Attaches PHX_dungeons script
    4. Sets Item_Val0 = 5940 (loot table)
```

### 2. Procedural Content Generation (PCG)

**Concept**: One-click generation of complex structures using algorithms from `mapper_pcg.fos`.

#### 2.1 Road Generator

**User Interface**:
- User draws a line or curve on map
- Selects road type: "Cobblestone", "Asphalt", "Dirt Path"
- Adjusts width slider: 1-4 hexes
- Checks optional: "Add debris", "Add side decoration"

**System Behavior**:
```javascript
// Under the hood (invisible to user)
function generateRoad(startHex, endHex, roadType, width, options) {
  // 1. Calculate path using hex pathfinding
  path = calculateHexPath(startHex, endHex);
  
  // 2. For each hex in path:
  for (hex in path) {
    // Place main road tiles
    placeTile(hex, getRoadPids(roadType));
    
    // Add width
    if (width > 1) {
      adjacentHexes = getAdjacentHexes(hex, width);
      for (adjHex in adjacentHexes) {
        placeTile(adjHex, getRoadPids(roadType));
      }
    }
    
    // Random debris (if enabled)
    if (options.debris && random() < 0.15) {
      debris = randomChoice(roadStuff);
      placeObject(hex, debris, randomOffset());
    }
  }
  
  // 3. Side decoration (if enabled)
  if (options.sideDecoration) {
    placeRoadSideStuff(path, width);
  }
}
```

**ProtoID Mappings** (from `mapper_pcg.fos`):
- Cobblestone: `[7869, 7870, 7871, 7872, 7873, 7874, 7875, 7876, 7877, 7878]`
- Asphalt: `[2278, 2279, 2280]`
- Debris: `[2224, 2225, 2226, 2227, 2228, 4523, 4522, 4520, 4521, 4573, 4574, 7003-7007]`
- Tire Stacks: `[4973, 4974, 4975]`

#### 2.2 Building Generator

**User Interface**:
- User draws rectangle on map
- Selects building type: "Office", "Warehouse", "Apartment", "Shop"
- Selects condition: "Pristine", "Weathered", "Ruined"
- Selects floor count: 1-3
- Auto-generate: "Interior furniture", "Loot containers"

**System Behavior**:
```javascript
function generateBuilding(bounds, buildingType, condition, floors, options) {
  // 1. Generate walls
  placeWalls(bounds, getWallStyle(buildingType, condition));
  
  // 2. Generate floors
  for (floor in floors) {
    placeFloorTiles(bounds, getFloorStyle(buildingType));
    
    // 3. Place doors
    placeDoors(floor, buildingType);
    
    // 4. Furniture placement
    if (options.autoFurniture) {
      furniture = getFurnitureSet(buildingType);
      placeFurnitureWithCollision(floor, furniture);
    }
    
    // 5. Loot containers
    if (options.lootContainers) {
      containers = getLootContainers(buildingType);
      placeContainersWithScripts(floor, containers);
    }
  }
  
  // 6. Weathering/damage
  if (condition === "Ruined") {
    addRubble(bounds);
    breakWalls(bounds, 0.3); // 30% of walls damaged
  }
}
```

#### 2.3 Forest Generator

**User Interface**:
- User draws polygon on map
- Selects forest density: "Sparse", "Medium", "Dense"
- Selects tree types: "Pine", "Oak", "Dead Trees", "Mixed"
- Add undergrowth: checkbox
- Add rocks/boulders: checkbox

**System Behavior**:
```javascript
function generateForest(polygon, density, treeTypes, options) {
  // 1. Use Poisson disk sampling for natural tree distribution
  treePositions = poissonDiskSampling(polygon, getDensityRadius(density));
  
  // 2. Place trees with variation
  for (pos in treePositions) {
    treeProto = weightedRandomChoice(getTreePids(treeTypes));
    placeTree(pos, treeProto);
    
    // Add undergrowth nearby
    if (options.undergrowth && random() < 0.6) {
      bushPos = getAdjacentHex(pos);
      placeBush(bushPos);
    }
  }
  
  // 3. Add rocks/boulders
  if (options.rocks) {
    rockCount = Math.floor(polygon.area * 0.05);
    placeRandomRocks(polygon, rockCount);
  }
}
```

### 3. Smart Object System

**Concept**: Objects that "know" how they should behave, with pre-configured scripts and parameters.

**Object Categories**:

#### 3.1 Containers (Auto-configured loot)
```
Metal Locker:
  ProtoID: 666
  Auto-script: PHX_dungeons._InitDungeonLocker
  Auto-param: Item_Val0 = 5940 (loot table ID)
  Collision: blocks = true
  Interaction: Can be opened/locked
```

#### 3.2 Workstations (Auto-configured crafting)
```
Workbench:
  ProtoID: [from phx_crafting.fopro]
  Auto-script: crafting_init
  Auto-params: WorkbenchType, CraftingTier
  Collision: blocks = true
  Interaction: Opens crafting menu
```

#### 3.3 Terminals (Auto-configured interaction)
```
Computer Terminal:
  ProtoID: [from phx_scripted_items.fopro]
  Auto-script: terminal_init
  Auto-params: DialogID, HackDifficulty
  Collision: blocks = false
  Interaction: Opens dialog tree
```

### 4. Validation & Error Prevention

**Real-time Checks**:
- ✓ Objects within map bounds (0-MaxHexX, 0-MaxHexY)
- ✓ No overlapping collision objects
- ✓ All ProtoIDs valid (exist in proto database)
- ✓ Scripts referenced exist in server files
- ✓ Required parameters present (e.g., Item_Val0 for containers)
- ✓ Offset values reasonable (-100 to +100)
- ✓ Tile layers don't conflict

**Pre-save Validation**:
```javascript
function validateMap(mapData) {
  errors = [];
  warnings = [];
  
  // Check header integrity
  if (mapData.header.MaxHexX < 50 || mapData.header.MaxHexX > 1000) {
    errors.push("Map dimensions out of range");
  }
  
  // Check each object
  for (obj in mapData.objects) {
    // Position validation
    if (obj.MapX > mapData.header.MaxHexX) {
      errors.push(`Object ${obj.ProtoId} out of bounds at (${obj.MapX}, ${obj.MapY})`);
    }
    
    // Proto validation
    if (!protoDatabase.exists(obj.ProtoId)) {
      errors.push(`Unknown ProtoID: ${obj.ProtoId}`);
    }
    
    // Script validation
    if (obj.ScriptName && !scriptExists(obj.ScriptName, obj.FuncName)) {
      warnings.push(`Script ${obj.ScriptName}.${obj.FuncName} not found in server`);
    }
    
    // Collision check
    collisions = checkCollision(obj, mapData.objects);
    if (collisions.length > 0) {
      warnings.push(`Object at (${obj.MapX}, ${obj.MapY}) overlaps with ${collisions.length} other objects`);
    }
  }
  
  return { errors, warnings };
}
```

### 5. Direct-to-File Export

**Bypasses client entirely** - saves optimized `.fomap` directly to server folder.

**Export Process**:
1. User clicks "Export Map"
2. System validates map (show errors/warnings)
3. User confirms or fixes issues
4. System serializes to `.fomap` format (matching `filing.fomap` structure)
5. Optionally: backup old version, save new version
6. Server can immediately load the map (no client restart needed)

---

## Technical Architecture

### System Layers

```
┌─────────────────────────────────────────┐
│   USER INTERFACE LAYER                  │
│   - Visual prefab browser               │
│   - Drag-and-drop canvas                │
│   - Property panels                     │
│   - PCG wizards                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   BUSINESS LOGIC LAYER                  │
│   - Hex coordinate math                 │
│   - Collision detection                 │
│   - PCG algorithms                      │
│   - Validation engine                   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   DATA LAYER                            │
│   - Proto database (parsed .fopro)      │
│   - Sprite cache (.fofrm)               │
│   - Map state (in-memory JSON)          │
│   - Script metadata                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   SERIALIZATION LAYER                   │
│   - .fomap writer                       │
│   - Backup system                       │
│   - Server file integration             │
└─────────────────────────────────────────┘
```

### Technology Stack Options

#### Option 1: Web Application (Recommended)

**Frontend**:
- **React** - UI component framework
- **Konva.js** or **PixiJS** - Canvas rendering for hex grid
- **TailwindCSS** - Styling

**Backend**:
- **Node.js + Express** - File I/O, proto parsing
- **Better-SQLite3** - Proto database cache

**Deployment**:
- **Electron** - Desktop wrapper for standalone app
- Self-contained, downloads with server folder structure

**Advantages**:
- Cross-platform (Windows, Mac, Linux)
- Rich UI libraries available
- Easy to iterate and update
- Can run in browser OR as desktop app

#### Option 2: Python/Qt Desktop App

**Framework**:
- **PyQt6** or **PySide6** - Native desktop UI
- **Pillow** - Image processing for sprite previews
- **SQLite** - Proto database

**Advantages**:
- Native performance
- Direct file system access
- Easier integration with existing Python tools

#### Option 3: Godot Engine

**Advantages**:
- Built-in hex grid support
- Native sprite handling
- Cross-platform export
- Visual editor for UI

**Disadvantages**:
- Heavier download
- Overkill for a map editor

**Recommendation**: **Web App (React + Electron)** for maximum flexibility and ease of development.

---

## File Structure Reference

### Source Files (Input)

These files from the archive serve as the "Source of Truth":

#### 1. `filing.fomap` - Map Format Template

**Purpose**: Defines the exact serialization format for `.fomap` files.

**Structure**:
```
[Header]
Version              4
MaxHexX              200
MaxHexY              200
WorkHexX             151      # Active/visible area
WorkHexY             166
ScriptModule         -        # Or module name
ScriptFunc           -        # Or function name
NoLogOut             0        # Map flag
Time                 0        # Game time
DayTime              300  600  1140 1380   # Hour markers
DayColor0-3          R G B values...       # Lighting per phase

[Tiles]
# Optional tile layer data

[Objects]
MapObjType           2        # 1=Item, 2=Scenery, 3=Critter
ProtoId              5622
MapX                 146
MapY                 154
# Optional fields:
ScriptName           PHX_dungeons
FuncName             _InitDungeonLocker
OffsetX              -7
OffsetY              8
Item_Val0            5940
# ... etc
```

**Critical Fields**:
- `MapObjType`: 1 (Item), 2 (Scenery), 3 (Critter)
- `ProtoId`: Reference to `.fopro` entry
- `MapX`, `MapY`: Hex coordinates
- `OffsetX`, `OffsetY`: Pixel offset from hex center
- `ScriptName`, `FuncName`: Server-side script hooks
- `Item_Val0` through `Item_Val9`: Custom parameters

#### 2. `mapper_pcg.fos` - PCG Algorithms

**Purpose**: Contains procedural generation logic and prefab lists.

**Key Components**:

**Placeholder Class**:
```angelscript
class Placeholder {
    int x, y;           // Position
    int width, height;  // Collision bounds
    int idx;            // Proto index
    int color;          // Debug visualization
    bool place;         // Actually place or just reserve space?
    
    void Bully() {
        // Remove overlapping objects from dat[] array
    }
    
    bool CheckCollision(int x, int y, int w, int h) {
        // AABB collision detection
    }
}
```

**Prefab Arrays**:
```angelscript
const uint[] CobblestoneRoadPids = {7869, 7870, 7871, ...};
const uint[] roadPids = {2278, 2279, 2280};
const uint[] tirestackPids = {4973, 4974, 4975};
const uint[] roadStuff = {2224, 2225, ... };
const uint[][] roadSideStuffX = {{2291}, {2294}, {...}};
const uint[][] roadSideStuffY = {{2293}, {2292}, {...}};
```

**Usage in ORION**:
- Extract these arrays to build "Road" prefab palette
- Port collision logic to JavaScript/Python
- Use as reference for which ProtoIDs work together

#### 3. `mapper_main.fos` - Interface Logic Reference

**Purpose**: Shows how the legacy mapper handles user input and map operations.

**Key Functions** (documented in comments):
```angelscript
// Map operations
LoadMap(string& fileName, int pathType)
SaveMap(MapperMap@+ map, string& fileName, int pathType)
ShowMap(MapperMap@+ map)

// Object manipulation
DeleteObject(MapperObject@+ obj)
SelectObject(MapperObject@+ obj, bool set)
GetMonitorObject(int x, int y, bool ignoreInterface)

// Coordinate system
GetHexPos(uint16 hx, uint16 hy, int& x, int& y)
GetMonitorHex(int x, int y, uint16& hx, uint16& hy)
MoveHexByDir(uint16& hexX, uint16& hexY, uint8 dir, uint steps)

// Rendering hooks (for reference)
render_iface(uint layer)
render_map()
mouse_down(int click)
mouse_up(int click)
key_down(uint8 key)
```

**Usage in ORION**:
- **Don't** port AngelScript code directly
- **Do** use as specification for required features
- **Do** implement same coordinate math in target language

#### 4. `mapper_documentation.txt` - API Reference

**Purpose**: Complete API documentation for mapper functions.

**Key Information**:
- Geometry settings (hex width, height, offsets)
- Coordinate conversion formulas
- Object property flags
- Tab system for organizing items

**Usage in ORION**:
- Reference for hex math implementation
- Understanding of map geometry constants

#### 5. `config/mapper_default.ini` - UI Layout Spec

**Purpose**: Defines legacy mapper's UI element positions.

**Not directly useful** for ORION (we're building new UI), but documents:
- Expected workflow (tabs for Items, Tiles, Critters, etc.)
- Hotkey conventions (F1-F10)

#### 6. `proto/*.fopro` - Proto Database

**Purpose**: Define all placeable objects in the game.

**File Count**: 60+ files, 1000s of proto entries

**Structure** (per entry):
```ini
[Proto]
ProtoId=4240
Type=11              # Object type (11=scenery, etc.)
PicMap=art\scenery_phx\stone6a.fofrm
PicInv=art\inven\reserved.frm
Flags=268443672      # Bitfield (collision, interaction, etc.)
DisableEgg=1
SoundId=48
Material=1
```

**Categorization** (by filename):
- `phx_sceneries.fopro` - Environmental objects
- `phx_weapon.fopro` - Weapons
- `phx_armor.fopro` - Armor
- `phx_crafting.fopro` - Crafting stations
- `phx_containers.fopro` - Storage objects
- `door.fopro` - Doors
- `wall.fopro` - Wall segments
- etc.

**ORION Database Build**:
```javascript
// Parse all .fopro files into SQLite database:
CREATE TABLE protos (
  proto_id INTEGER PRIMARY KEY,
  type INTEGER,
  name TEXT,
  category TEXT,         -- Inferred from filename
  pic_map TEXT,
  pic_inv TEXT,
  flags INTEGER,
  collision BOOLEAN,     -- Derived from flags
  interactive BOOLEAN,   -- Derived from flags
  description TEXT,
  tags TEXT              -- JSON array: ["industrial", "metal", "container"]
);

// Build searchable index:
CREATE INDEX idx_category ON protos(category);
CREATE INDEX idx_tags ON protos(tags);
CREATE VIRTUAL TABLE protos_fts USING fts5(name, description, tags);
```

---

## Development Roadmap

See [TODO.md](./TODO.md) for detailed task breakdown.

**High-Level Phases**:

### Phase 0: Foundation (2-3 weeks)

**Goal**: Set up development environment and make architectural decisions.

**Tasks**:
- [ ] Choose tech stack (React + Electron recommended)
- [ ] Set up project structure
- [ ] Design database schema for proto storage
- [ ] Create mock UI layouts
- [ ] Document coordinate system math

**Deliverable**: Empty shell app that launches, with basic UI chrome.

### Phase 1: The Serializer (1 week)

**Goal**: Prove we can write valid `.fomap` files.

**Tasks**:
- [ ] Parse `filing.fomap` to understand format
- [ ] Create `.fomap` writer class
- [ ] Write unit tests with known-good maps
- [ ] Validate output against server loading

**Deliverable**: Script that takes JSON map data → writes `.fomap` file that server accepts.

### Phase 2: The Grid Engine (2 weeks)

**Goal**: Implement hex coordinate system and rendering.

**Tasks**:
- [ ] Implement hex-to-pixel conversion (from `mapper_main.fos`)
- [ ] Implement pixel-to-hex conversion
- [ ] Render hex grid on canvas
- [ ] Handle click-to-hex selection
- [ ] Add zoom/pan controls
- [ ] Display ProtoID sprites on hexes

**Deliverable**: Interactive hex grid where you can click hexes and see coordinates.

### Phase 3: Proto Database & Prefab Library (2 weeks)

**Goal**: Build searchable catalog of all game objects.

**Tasks**:
- [ ] Parse all `.fopro` files
- [ ] Extract ProtoID, Type, PicMap, Flags
- [ ] Categorize by filename and Type
- [ ] Generate sprite thumbnails from `.fofrm` files
- [ ] Build search/filter UI
- [ ] Tag system (manual or AI-generated)

**Deliverable**: Searchable library where user can browse and pick objects.

### Phase 4: Basic Map Editing (2 weeks)

**Goal**: Place and manipulate objects manually.

**Tasks**:
- [ ] Click prefab → click map → place object
- [ ] Select object → show properties panel
- [ ] Edit object properties (offsets, scripts, parameters)
- [ ] Delete object
- [ ] Move object (drag or arrow keys)
- [ ] Copy/paste objects
- [ ] Multi-select (drag rectangle)

**Deliverable**: Basic map editor where you can place, move, edit, delete objects.

### Phase 5: Smart Object System (1 week)

**Goal**: Auto-configure scripts and parameters.

**Tasks**:
- [ ] Define object templates (JSON or database)
- [ ] Detect object category (container, workbench, etc.)
- [ ] Auto-attach scripts based on category
- [ ] Auto-fill common parameters (Item_Val0 for loot)
- [ ] User override option

**Deliverable**: Placing a "Locker" automatically attaches loot script without user intervention.

### Phase 6: Validation Engine (1 week)

**Goal**: Prevent invalid maps.

**Tasks**:
- [ ] Bounds checking (objects within map size)
- [ ] ProtoID validation (exists in database)
- [ ] Script validation (exists in server files)
- [ ] Collision detection and warnings
- [ ] Pre-save validation report

**Deliverable**: Exporting a map shows all errors/warnings before writing file.

### Phase 7: PCG - Roads (2 weeks)

**Goal**: Generate roads procedurally.

**Tasks**:
- [ ] Implement line drawing on hex grid
- [ ] Road type selector (Cobblestone, Asphalt, Dirt)
- [ ] Width adjustment (1-4 hexes)
- [ ] Randomized tile selection from road ProtoID arrays
- [ ] Optional debris placement
- [ ] Optional side decoration

**Deliverable**: User draws line → road appears with proper tiles and debris.

### Phase 8: PCG - Buildings (3 weeks)

**Goal**: Generate building structures procedurally.

**Tasks**:
- [ ] Rectangle drawing tool
- [ ] Wall placement algorithm
- [ ] Floor tile filling
- [ ] Door placement logic
- [ ] Interior furniture generation
- [ ] Collision-aware object placement
- [ ] Weathering/damage states

**Deliverable**: User draws rectangle → complete building generated with walls, floors, doors, furniture.

### Phase 9: PCG - Forests & Natural Features (2 weeks)

**Goal**: Generate natural environments procedurally.

**Tasks**:
- [ ] Polygon drawing tool
- [ ] Poisson disk sampling for tree distribution
- [ ] Tree type selection and mixing
- [ ] Undergrowth/bush placement
- [ ] Rock/boulder scattering
- [ ] Density controls

**Deliverable**: User draws area → forest appears with realistic tree distribution.

### Phase 10: Polish & UX (2-3 weeks)

**Goal**: Make it production-ready.

**Tasks**:
- [ ] Undo/redo system
- [ ] Layer management (tiles, objects, roofs)
- [ ] Minimap view
- [ ] Lighting preview
- [ ] Export dialog with options
- [ ] Backup system for maps
- [ ] Tutorial/help system
- [ ] Hotkey customization

**Deliverable**: Polished, professional tool ready for distribution.

---

## Technical Deep-Dive

### Hex Coordinate System

FOnline uses **offset coordinates** (not cube or axial).

**Conversion Formulas** (from `mapper_main.fos` API):

```javascript
// Hex to pixel
function hexToPixel(hx, hy) {
  const HEX_WIDTH = 32;      // From geometry settings
  const HEX_HEIGHT = 16;
  const HEX_LINE_HEIGHT = 12;
  
  let x = hx * HEX_WIDTH;
  let y = hy * HEX_LINE_HEIGHT;
  
  // Offset every other row (staggered hex grid)
  if (hy % 2 === 1) {
    x += HEX_WIDTH / 2;
  }
  
  return { x, y };
}

// Pixel to hex (mouse click)
function pixelToHex(px, py) {
  const HEX_WIDTH = 32;
  const HEX_LINE_HEIGHT = 12;
  
  let hy = Math.floor(py / HEX_LINE_HEIGHT);
  let hx;
  
  if (hy % 2 === 0) {
    hx = Math.floor(px / HEX_WIDTH);
  } else {
    hx = Math.floor((px - HEX_WIDTH / 2) / HEX_WIDTH);
  }
  
  // Refine with distance check to handle hex edges
  return refinedHexFromPixel(px, py, hx, hy);
}

function refinedHexFromPixel(px, py, hx, hy) {
  // Check candidate hex and neighbors, return closest
  const candidates = [
    { hx, hy },
    { hx: hx - 1, hy },
    { hx: hx + 1, hy },
    { hx, hy: hy - 1 },
    { hx, hy: hy + 1 }
  ];
  
  let closest = candidates[0];
  let minDist = Infinity;
  
  for (const candidate of candidates) {
    const hexCenter = hexToPixel(candidate.hx, candidate.hy);
    const dist = Math.hypot(px - hexCenter.x, py - hexCenter.y);
    if (dist < minDist) {
      minDist = dist;
      closest = candidate;
    }
  }
  
  return closest;
}
```

### Collision Detection

Based on `mapper_pcg.fos` Placeholder class:

```javascript
class CollisionBox {
  constructor(x, y, width, height, protoId) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.protoId = protoId;
  }
  
  overlaps(other) {
    // AABB (Axis-Aligned Bounding Box) collision
    return !(
      this.x + this.width < other.x ||
      other.x + other.width < this..x ||
      this.y + this.height < other.y ||
      other.y + other.height < this.y
    );
  }
}

function checkCollisions(mapObjects) {
  const collisions = [];
  
  for (let i = 0; i < mapObjects.length; i++) {
    for (let j = i + 1; j < mapObjects.length; j++) {
      const objA = mapObjects[i];
      const objB = mapObjects[j];
      
      // Only check collision for objects with collision flags
      if (objA.hasCollision() && objB.hasCollision()) {
        const boxA = objA.getCollisionBox();
        const boxB = objB.getCollisionBox();
        
        if (boxA.overlaps(boxB)) {
          collisions.push({ objA, objB });
        }
      }
    }
  }
  
  return collisions;
}
```

### .fomap Serialization

```javascript
class FomapSerializer {
  constructor(mapData) {
    this.mapData = mapData;
  }
  
  serialize() {
    let output = "";
    
    // Write header
    output += "[Header]\n";
    output += `Version              ${this.mapData.header.version}\n`;
    output += `MaxHexX              ${this.mapData.header.maxHexX}\n`;
    output += `MaxHexY              ${this.mapData.header.maxHexY}\n`;
    output += `WorkHexX             ${this.mapData.header.workHexX}\n`;
    output += `WorkHexY             ${this.mapData.header.workHexY}\n`;
    output += `ScriptModule         ${this.mapData.header.scriptModule || '-'}\n`;
    output += `ScriptFunc           ${this.mapData.header.scriptFunc || '-'}\n`;
    output += `NoLogOut             ${this.mapData.header.noLogOut}\n`;
    output += `Time                 ${this.mapData.header.time}\n`;
    output += `DayTime              ${this.mapData.header.dayTime.join('  ')}\n`;
    output += `DayColor0            ${this.mapData.header.dayColor0.join('  ')}\n`;
    output += `DayColor1            ${this.mapData.header.dayColor1.join('  ')}\n`;
    output += `DayColor2            ${this.mapData.header.dayColor2.join('  ')}\n`;
    output += `DayColor3            ${this.mapData.header.dayColor3.join('  ')}\n`;
    output += "\n";
    
    // Write tiles
    output += "[Tiles]\n";
    for (const tile of this.mapData.tiles) {
      // Tile format (if any)
    }
    output += "\n";
    
    // Write objects
    output += "[Objects]\n";
    for (const obj of this.mapData.objects) {
      output += `MapObjType           ${obj.mapObjType}\n`;
      output += `ProtoId              ${obj.protoId}\n`;
      output += `MapX                 ${obj.mapX}\n`;
      output += `MapY                 ${obj.mapY}\n`;
      
      // Optional fields
      if (obj.scriptName) {
        output += `ScriptName           ${obj.scriptName}\n`;
      }
      if (obj.funcName) {
        output += `FuncName             ${obj.funcName}\n`;
      }
      if (obj.offsetX !== undefined) {
        output += `OffsetX              ${obj.offsetX}\n`;
      }
      if (obj.offsetY !== undefined) {
        output += `OffsetY              ${obj.offsetY}\n`;
      }
      
      // Item parameters (Item_Val0 through Item_Val9)
      for (let i = 0; i <= 9; i++) {
        const valKey = `item_Val${i}`;
        if (obj[valKey] !== undefined) {
          output += `Item_Val${i}            ${obj[valKey]}\n`;
        }
      }
      
      output += "\n";
    }
    
    return output;
  }
  
  writeToFile(filepath) {
    const content = this.serialize();
    fs.writeFileSync(filepath, content, 'utf-8');
  }
}
```

---

## Getting Started (For Developers)

### Prerequisites

- **Node.js 18+** (if using React/Electron stack)
- **Git**
- **Code editor** (VS Code recommended)

### Setup Steps

1. **Clone repository**:
```bash
git clone <repo-url>
cd orion-mapper
```

2. **Install dependencies**:
```bash
npm install
```

3. **Extract proto database**:
```bash
npm run parse-protos
# This script:
# 1. Reads all .fopro files from source/proto/
# 2. Parses proto entries
# 3. Builds SQLite database in data/protos.db
# 4. Generates category mappings
```

4. **Run development server**:
```bash
npm run dev
# Starts React dev server on http://localhost:3000
```

5. **Build desktop app**:
```bash
npm run build
npm run electron:build
# Creates standalone executable in dist/
```

### Project Structure

```
orion-mapper/
├── src/
│   ├── components/        # React UI components
│   │   ├── HexGrid.jsx
│   │   ├── PrefabBrowser.jsx
│   │   ├── PropertiesPanel.jsx
│   │   └── PCGWizard.jsx
│   ├── engine/            # Core logic
│   │   ├── hexMath.js
│   │   ├── collision.js
│   │   ├── serializer.js
│   │   └── validator.js
│   ├── pcg/               # Procedural generators
│   │   ├── roads.js
│   │   ├── buildings.js
│   │   └── forests.js
│   ├── database/          # Proto DB interface
│   │   ├── protoParser.js
│   │   └── protoQuery.js
│   └── App.jsx
├── data/
│   ├── protos.db          # SQLite database of protos
│   └── templates/         # PCG templates
├── source/                # Original mapper files (reference)
│   ├── config/
│   ├── proto/
│   ├── filing.fomap
│   ├── mapper_pcg.fos
│   └── mapper_main.fos
├── tests/
│   ├── hexMath.test.js
│   ├── serializer.test.js
│   └── validation.test.js
├── package.json
├── README.md
└── TODO.md
```

### Development Workflow

1. **Pick a task** from TODO.md
2. **Create feature branch**: `git checkout -b feature/road-generator`
3. **Implement feature**
4. **Write tests**
5. **Test against real server**:
   - Export `.fomap` file
   - Copy to `<server>/data/maps/`
   - Start server, load map
   - Verify no errors
6. **Create pull request**
7. **Iterate based on feedback**

### Testing Strategy

**Unit Tests**:
- Hex math (coordinate conversions)
- Collision detection
- Serialization (JSON → .fomap)
- Validation rules

**Integration Tests**:
- Full map creation workflow
- PCG algorithms with known seeds
- Export → server load → verify

**Manual Tests**:
- UI/UX flows
- Performance with large maps (1000+ objects)
- Edge cases (max map size, weird ProtoIDs)

---

## FAQ

**Q: Can I use ORION to edit existing maps?**
A: Yes! Phase 1 includes a `.fomap` parser. Load existing maps, edit them, and re-export.

**Q: Does ORION replace the server?**
A: No, it only creates map files. You still need a FOnline server to run the game.

**Q: What about critter (NPC) placement?**
A: Fully supported. Critters are MapObjType 3, with AI scripts and parameters.

**Q: Can I add custom ProtoIDs?**
A: Yes. ORION reads from your server's `proto/` folder. Add `.fopro` files, re-parse, and they'll appear.

**Q: Does it support multiple floors/levels?**
A: Not in Phase 1. Multi-level maps are a future enhancement (Phase 11+).

**Q: Can I extend the PCG with custom algorithms?**
A: Absolutely! The PCG system is modular. Add your own generators in `src/pcg/`.

**Q: What if my server has custom scripts?**
A: ORION lets you specify script names and parameters manually. For auto-configuration, you'd add templates in the database.

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Code style guide
- PR process
- Bug reporting
- Feature requests

---

## License

[To be determined - likely MIT or Apache 2.0]

---

## Credits

- **Original FOnline Mapper**: cvet
- **PCG Algorithms**: Extracted from community mappers
- **ORION Project**: [Your name/team]

---

## Contact

- **Discord**: [server link]
- **Forum**: [forum link]
- **Issues**: [GitHub issues]

---

**Ready to build the future of FOnline mapping. Let's make it happen.**
