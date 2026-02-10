# Phase 3: Proto Database & Prefab Library

[Back to TODO Index](../TODO.md)

---

**Goal**: Build searchable catalog of all game objects.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 3.1 Proto File Parsing
- [ ] **Create .fopro parser** 🔴
  - File: `src/database/protoParser.js`
  - Function: `parseFoproFile(fileContent)` → array of proto objects
  - Parse `[Proto]` sections
  - Extract: ProtoId, Type, PicMap, PicInv, Flags, etc.
  - Acceptance: Can parse all .fopro files in `source/proto/` without errors

- [ ] **Batch parse all proto files** 🔴
  - Script: `scripts/parse-all-protos.js`
  - Read all `.fopro` files from `source/proto/`
  - Parse each file
  - Combine into single JSON array
  - Save to `data/all-protos.json`
  - Acceptance: JSON file with 1000+ proto entries

### 3.2 Database Creation
- [ ] **Design database schema** 🔴
  - Create `docs/proto-database.md` with SQL schema
  - Tables:
    ```sql
    CREATE TABLE protos (
      proto_id INTEGER PRIMARY KEY,
      type INTEGER NOT NULL,
      name TEXT,
      category TEXT,
      pic_map TEXT,
      pic_inv TEXT,
      flags INTEGER,
      collision BOOLEAN,
      interactive BOOLEAN,
      description TEXT,
      tags TEXT  -- JSON array
    );
    CREATE INDEX idx_category ON protos(category);
    CREATE INDEX idx_type ON protos(type);
    ```
  - Acceptance: Schema documented, ready to implement

- [ ] **Create database builder script** 🔴
  - Script: `scripts/build-proto-db.js`
  - Read `data/all-protos.json`
  - Insert into SQLite database
  - Generate categories from filenames (e.g., `phx_sceneries.fopro` → "Scenery")
  - Generate tags (manually or via AI)
  - Save to `data/protos.db`
  - Acceptance: Database created, queryable in SQLite browser

- [ ] **Implement proto query API** 🔴
  - File: `src/database/protoQuery.js`
  - Functions:
    - `getProtoById(protoId)` → proto object
    - `getProtosByCategory(category)` → array
    - `searchProtos(searchTerm)` → array (full-text search)
    - `getProtosByTags(tags)` → array
  - Acceptance: Can query protos efficiently (< 50ms per query)

### 3.3 Categorization & Tagging
- [ ] **Define category taxonomy** 🔴
  - Create `docs/proto-categories.md`
  - Categories:
    - Terrain (floors, ground)
    - Walls
    - Doors
    - Furniture (chairs, tables, lockers, etc.)
    - Containers (chests, crates, etc.)
    - Decoration (props, plants)
    - Interactive (terminals, workbenches)
    - Weapons
    - Armor
    - Consumables
    - Critters
    - Vehicles
  - Acceptance: Every proto fits into at least one category

- [ ] **Implement auto-categorization** 🟡
  - Rule-based system:
    - Filename contains "wall" → category "Walls"
    - Type === 11 → "Scenery"
    - Flags & COLLISION → "Collision Objects"
  - Fallback: "Uncategorized"
  - Acceptance: 90%+ of protos auto-categorized correctly

- [ ] **Tag generation** 🟢
  - Manual: Create `data/proto-tags.json` with tags for common protos
  - Optional: Use AI (GPT) to generate tags from proto names
  - Examples:
    - "Metal Locker" → ["metal", "storage", "container", "industrial"]
    - "Oak Tree" → ["tree", "nature", "forest", "organic"]
  - Acceptance: At least 100 protos have tags

### 3.4 Prefab Browser UI
- [ ] **Create PrefabBrowser component** 🔴
  - File: `src/components/PrefabBrowser.jsx`
  - Layout: Sidebar with category tabs + grid of protos
  - Display: Proto thumbnail (or placeholder) + name
  - Click to select prefab → stores in app state
  - Acceptance: Can browse and select protos from UI

- [ ] **Implement category filtering** 🔴
  - Tabs: "All", "Terrain", "Walls", "Furniture", etc.
  - Click tab → filter grid to show only that category
  - Acceptance: Can switch categories smoothly

- [ ] **Implement search** 🔴
  - Search bar: Type to filter protos by name/tags
  - Real-time filtering (debounced for performance)
  - Highlight matches
  - Acceptance: Search "locker" → shows all locker variants

- [ ] **Generate sprite thumbnails** 🟡
  - For each proto, render sprite to small image (64x64 px)
  - Cache in `data/thumbnails/`
  - Display in prefab browser grid
  - Fallback: Color-coded placeholder by type
  - Acceptance: Most protos have visual previews

### 3.5: Server Integration Helper
- [ ] UI for editing Locations.cfg entries
- [ ] Generate [Area X] section for new maps
- [ ] PID picker based on map type (uses numbering system)
- [ ] Warning if PID conflicts with existing locations
- Acceptance: Can generate Location.cfg entry

### 3.6: World Map Position Helper
- [ ] Visual world map (2000x2000 grid)
- [ ] Place location marker
- [ ] Generate GenerateWorld.cfg entry
- Acceptance: Can place location on world map
