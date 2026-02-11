# Phase 3: FOnline Entity Database & Script Integration

[Back to TODO Index](../TODO.md)

---

**Goal**: Build comprehensive database of all FOnline entities with script defines cross-referencing.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 3.1 FOnline Entity Parsing
- [x] **Create FOnline entity parser** ✅ **COMPLETED**
  - File: `src/database/entityParser.js` → `src/database/DatabaseManager.js`
  - Function: `parseEntityFiles()` → `getAllEntities()`
  - Parse `.fopro` files for standard protos (items, scenery, critters)
  - Parse `.fo` script files for custom entities and defines
  - Extract: ProtoId, Type, PicMap, PicInv, Flags, ScriptDefines, etc.
  - **Acceptance: ✅ Can parse all entity files without errors**

- [x] **Script defines cross-referencer** ✅ **COMPLETED** 
  - File: `src/database/scriptDefinesParser.js` → Integrated into DatabaseManager
  - Parse server script files (`*.fo`, `*.fos`)
  - Extract `#define` constants and enum values
  - Cross-reference with protoId values
  - Build mapping: scriptDefine ↔ protoId ↔ entityName
  - **Acceptance: ✅ Complete mapping of script defines to entities**

- [x] **Batch parse all entity files** ✅ **COMPLETED**
  - Script: `scripts/parse-all-entities.js` → `scripts/create-entity-db.cjs`
  - Read all `.fopro` files from `source/proto/`
  - Read all script files from `source/scripts/`
  - Parse and cross-reference entities
  - Combine into single JSON array with script mappings
  - Save to `data/all-entities.json` → `data/entities.db` (SQLite)
  - **Acceptance: ✅ SQLite database with 9,259 entities and script mappings**

### 3.2 Comprehensive Database Creation
- [x] **Design entity database schema** ✅ **COMPLETED**
  - Create `docs/entity-database.md` with SQL schema
  - Tables: entities (42 columns) with comprehensive entity data
  - **Acceptance: ✅ SQLite database with 9,259 entities, 6.4MB size**

- [x] **Create entity database builder** ✅ **COMPLETED**
  - Script: `scripts/create-entity-db.cjs`
  - Build SQLite database from parsed entities
  - Include classification, properties, art assets, script references
  - **Acceptance: ✅ Database with 97% high confidence classification**

- [x] **Implement browser-compatible export** ✅ **COMPLETED**
  - Script: `scripts/export-entities-for-browser.cjs`
  - Export SQLite to JSON for browser consumption
  - Remove duplicates, clean proto_id mapping
  - **Acceptance: ✅ 9,259 unique entities exported to JSON**

- [x] **FOBJ.MSG string integration** ✅ **COMPLETED**
  - Script: `scripts/integrate-msg-strings.cjs`
  - Process FOOBJ.MSG files for entity names and descriptions
  - Use PID * 100 for names, PID * 100 + 1 for descriptions
  - **Acceptance: ✅ 6,229 entities with FOOBJ names, 2,754 descriptions**

### 3.3 Entity Reactor Interface (NEW)
- [x] **Entity Reactor Window** ✅ **COMPLETED**
  - File: `src/components/EntityReactor/EntityReactorWindow.jsx`
  - Table, Cards, and Detailed views for entity browsing
  - Image preview system for PicMapName assets
  - **Acceptance: ✅ Can browse 9,259 entities with images and descriptions**

- [ ] **Entity Vision System** 🔴 **NEW**
  - Visual feedback when selecting entities in database
  - Show entity placement preview on hex grid
  - Highlight entity bounds and interaction areas
  - **Acceptance: Selected entity shows visual preview on map**

- [ ] **Map Protection Mode** 🔴 **NEW**
  - Prevent hexGrid modification while Entity Reactor is engaged
  - Disable placement tools during entity browsing
  - Protect map from accidental damage
  - **Acceptance: Map editing disabled when Entity Reactor open**

- [ ] **Console Input Isolation** 🔴 **NEW**
  - Fix Entity Reactor console input blocking WASD map movement
  - Separate input contexts for console vs map navigation
  - Prevent keyboard conflicts between systems
  - **Acceptance: Console input doesn't interfere with map controls**

- [ ] **Smart Default Filtering** 🔴 **NEW**
  - Add default filter on Entity Reactor startup
  - Don't unload entire database on dry launch
  - Smart initial filtering by entity type or category
  - **Acceptance: Fast startup with filtered entity list**
      name TEXT,
      category TEXT,
      pic_map TEXT,
      pic_inv TEXT,
      flags INTEGER,
      collision BOOLEAN,
      interactive BOOLEAN,
      description TEXT,
      tags TEXT,  -- JSON array
      script_defines TEXT,  -- JSON array of script constants
      custom_properties TEXT  -- JSON for unique entity types
    );
    
    CREATE TABLE script_defines (
      define_name TEXT PRIMARY KEY,
      value INTEGER,
      entity_id INTEGER,
      script_file TEXT,
      line_number INTEGER,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
    );
    
    CREATE TABLE entity_types (
      type_id INTEGER PRIMARY KEY,
      type_name TEXT,
      description TEXT,
      is_custom BOOLEAN
    );
    
    CREATE INDEX idx_category ON entities(category);
    CREATE INDEX idx_type ON entities(type);
    CREATE INDEX idx_proto_id ON entities(proto_id);
    CREATE INDEX idx_define_value ON script_defines(value);
    ```
  - Acceptance: Schema supports all FOnline entity types and script integration

- [ ] **Create entity database builder** 🔴
  - Script: `scripts/build-entity-db.js`
  - Read `data/all-entities.json`
  - Insert into SQLite database with script mappings
  - Generate categories from entity types (items, scenery, critters, blockers, etc.)
  - Generate tags from script defines and entity properties
  - Save to `data/entities.db`
  - Acceptance: Database created, queryable with script cross-references

- [ ] **Implement entity query API** 🔴
  - File: `src/database/entityQuery.js`
  - Functions:
    - `getEntityById(entityId)` → entity object
    - `getEntityByProtoId(protoId)` → entity object
    - `getEntitiesByType(type)` → array
    - `getEntitiesByScriptDefine(defineName)` → array
    - `searchEntities(searchTerm)` → array (full-text search)
    - `getEntitiesByTags(tags)` → array
    - `getScriptDefinesForEntity(entityId)` → array
  - Acceptance: Can query entities efficiently (< 50ms per query)

### 3.3 Enhanced Categorization & Tagging
- [ ] **Define comprehensive entity taxonomy** 🔴
  - Create `docs/entity-categories.md`
  - Categories:
    - **Terrain**: Floors, ground tiles, roads
    - **Walls**: All wall types (normal, corner, special)
    - **Doors**: Standard and custom doors
    - **Furniture**: Chairs, tables, lockers, beds, etc.
    - **Containers**: Chests, crates, lockers, safes
    - **Decoration**: Props, plants, environmental objects
    - **Interactive**: Terminals, workbenches, computers
    - **Weapons**: All weapon types
    - **Armor**: All armor types
    - **Consumables**: Food, drugs, ammo
    - **Critters**: All NPC and creature types
    - **Vehicles**: Cars, bikes, boats
    - **Blockers**: Special collision objects
    - **Custom**: Server-specific entities
  - Acceptance: Every entity fits into at least one category

- [ ] **Implement smart auto-categorization** 🟡
  - Rule-based system:
    - Type === 1 → "Critters"
    - Type === 2 → "Items" 
    - Type === 3 → "Scenery"
    - Type === 11 → "Blockers"
    - Script contains "WALL_" → "Walls"
    - Script contains "DOOR_" → "Doors"
    - ProtoId in blocker range → "Blockers"
    - Custom script defines → "Custom"
  - Fallback: "Uncategorized"
  - Acceptance: 95%+ of entities auto-categorized correctly

- [ ] **Enhanced tag generation** 🟢
  - Manual: Create `data/entity-tags.json` with tags for common entities
  - Automatic: Generate tags from script defines and entity properties
  - Examples:
    - "Metal Locker" → ["metal", "storage", "container", "industrial", "locker"]
    - "Oak Tree" → ["tree", "nature", "forest", "organic", "wood"]
    - "Terminal Computer" → ["computer", "terminal", "electronic", "interactive"]
  - Acceptance: At least 500 entities have comprehensive tags

### 3.4 Advanced Entity Browser UI
- [ ] **Create EntityBrowser component** 🔴
  - File: `src/components/EntityBrowser.jsx`
  - Layout: Sidebar with category tabs + grid of entities
  - Display: Entity thumbnail (or placeholder) + name + type
  - Show script defines for each entity
  - Click to select entity → stores in app state
  - Acceptance: Can browse and select all entity types

- [ ] **Implement advanced filtering** 🔴
  - Tabs: "All", "Terrain", "Walls", "Furniture", "Critters", "Custom", etc.
  - Type filtering: Filter by entity type and sub-type
  - Script filtering: Filter by script defines or source file
  - Click tab → filter grid to show only that category
  - Acceptance: Can switch categories and types smoothly

- [ ] **Implement comprehensive search** 🔴
  - Search bar: Type to filter entities by name, tags, script defines
  - Real-time filtering (debounced for performance)
  - Search in script defines and entity properties
  - Highlight matches in results
  - Acceptance: Search "locker" → shows all locker variants and script references

- [ ] **Generate enhanced entity previews** 🟡
  - For each entity, render sprite to small image (64x64 px)
  - Cache in `data/entity-previews/`
  - Show entity type and script defines in preview
  - Fallback: Color-coded placeholder by type with script info
  - Acceptance: Most entities have visual previews with metadata

### 3.5 Script Integration Tools
- [ ] **Script define browser** 🔴
  - UI for browsing script defines and their entity mappings
  - Show which entities use each define
  - Navigate to script source location
  - Acceptance: Can browse and understand script-define relationships

- [ ] **Entity validation tool** 🔴
  - Validate protoId ranges against script defines
  - Check for orphaned entities (no script references)
  - Check for missing entities (script defines without entities)
  - Acceptance: Can identify and report entity-script inconsistencies

### 3.6 Server Configuration Helpers
- [ ] **Enhanced Locations.cfg editor** 🔴
  - UI for editing Locations.cfg entries with entity browser
  - Auto-suggest entities based on location type
  - Generate [Area X] section for new maps
  - PID picker based on map type and existing locations
  - Warning if PID conflicts with existing locations
  - Acceptance: Can generate and validate Location.cfg entries

- [ ] **Enhanced world map position helper** 🔴
  - Visual world map (2000x2000 grid)
  - Place location marker with entity preview
  - Generate GenerateWorld.cfg entry with entity references
  - Show nearby locations and potential conflicts
  - Acceptance: Can place location on world map with entity context

### 3.7 Mapper Integration
- [ ] **Connect entity browser to tile brush** 🔴
  - Select entity from browser → set as current tile brush
  - Show entity preview in tile brush area
  - Validate entity type for current tool
  - Acceptance: Can select any entity for placement

- [ ] **Enhanced selection preview with entity data** 🔴
  - Show actual entity information from database
  - Display script defines and custom properties
  - Show entity usage in scripts
  - Acceptance: Selection preview shows real entity data
