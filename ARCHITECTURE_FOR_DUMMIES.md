# Project 412 Mapper Architecture for Complete Idiots
*(Reddit Monkey Level Documentation)*

---

## 🎯 WTF IS THIS PROJECT?

Imagine you're playing Fallout 2 and want to build your own maps. But instead of using some clunky editor, you get a **slick web-based mapper** that lets you place buildings, creatures, and items on a hex grid like a god.

**That's Project 412 Mapper.** It's a map editor for FOnline: Ashes of Phoenix (a Fallout Online mod) that runs in your browser. For now. We might need to create our own game so that this crap actually renders faster than 10 fps a second.

---

## 🗺️ THE BIG PICTURE - HOW THIS SHIT WORKS

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FOnline AoP   │───▶│   Our Scripts   │───▶│   SQLite DB     │
│   Server Files  │    │   (Node.js)     │    │   (entities.db)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   JSON Export   │              │
         │              │   (Browser)     │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   React App     │              │
         │              │   (Your Browser)│              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   MAP DISPLAY   │              │
         │              │   (Hex Grid)    │              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   ENTITY REACTOR│              │
         │              │   (Item Browser)│              │
         │              └─────────────────┘              │
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │   MAP EDITING   │              │
         │              │   (Place Stuff) │              │
         │              └─────────────────┘              │
```

---

## 📁 FOLDER STRUCTURE - WHERE THE FUCK IS WHAT?

```
Project 412 Mapper/
├── 🎮 src/                    # YOUR ACTUAL APP (React + JS)
│   ├── components/            # React building blocks
│   │   ├── EntityReactor/     # 🎯 The item browser thingy
│   │   ├── hexgrid/          # 🗺️ The hex map display
│   │   └── ui/                # 🎨 Windows, buttons, panels
│   ├── database/             # 🗄️ Database connection stuff
│   └── main.jsx              # 🚀 App entry point
│
├── 📜 scripts/                # DATA PROCESSING MAGIC
│   ├── create-entity-db.cjs   # 🏭 Builds SQLite database
│   ├── export-entities-for-browser.cjs # 📤 Exports for browser
│   ├── integrate-msg-strings.cjs # 🔗 Adds names/descriptions
│   └── reprocess-msg-files.cjs # 🔄 Fixes MSG file parsing
│
├── 💾 data/                   # PROCESSED DATA (Ready to use)
│   ├── entities.db           # 🗄️ Main SQLite database
│   ├── entities-export.json   # 📤 Browser-ready entities
│   ├── entities-integrated.json # 🎯 Entities + names + descriptions
│   └── string-mappings-corrected.json # 🔤 Cleaned text strings
│
├── 🏛️ legacy/                 # OLD SERVER STUFF (Reference only)
│   ├── proto/                # 📁 Original .fopro files
│   ├── GenerateWorld.cfg     # ⚙️ World generation config
│   └── Locations.cfg         # 📍 Location definitions
│
├── 📚 docs/                   # 📖 Documentation (You're reading this)
│   ├── ARCHITECTURE_FOR_DUMMIES.md # 🤓 THIS FILE
│   └── fonline-sdk-worldeditor-reference.md # 🔧 Technical reference
│
├── 🌐 public/                 # 🌍 Web server stuff
│   └── data/                  # 📋 Copy of processed data for browser
│
└── ⚙️ Various config files
    ├── package.json           # 📦 Node.js dependencies
    ├── vite.config.js         # ⚡ Build configuration
    └── index.html            # 🏠 Main HTML file
```

---

## 🔄 THE DATA FLOW - FROM SERVER TO YOUR SCREEN

### Step 1: Server Files → Raw Data
```
🗄️ FOnline AoP Server/
├── proto/
│   ├── items/*.fopro         # 📦 Item definitions
│   └── critters/*.fopro      # 👾 Creature definitions
├── text/engl/
│   └── FOOBJ.MSG             # 🔤 Item names & descriptions
└── maps/*.fomap              # 🗺️ Map files
```

### Step 2: Raw Data → Processed Database
```
📜 scripts/create-entity-db.cjs
├── Reads all .fopro files
├── Extracts entity data (Type, Flags, Stats, etc.)
├── Organizes into SQLite database
└── Creates: data/entities.db (9,259 entities)
```

### Step 3: Database → Browser-Ready JSON
```
📤 scripts/export-entities-for-browser.cjs
├── Reads: data/entities.db
├── Converts to JSON format
├── Removes duplicates (204 removed)
├── Fixes proto_id issues
└── Creates: data/entities-export.json
```

### Step 4: JSON + MSG Files → Final Integration
```
🔗 scripts/integrate-msg-strings.cjs
├── Reads: data/entities-export.json
├── Reads: FOOBJ.MSG (10,037 strings)
├── Matches PID * 100 = name, PID * 100 + 1 = description
├── Integrates names & descriptions
└── Creates: data/entities-integrated.json
```

### Step 5: Final Data → Your Browser
```
🌐 React App (src/)
├── DatabaseManager loads: entities-integrated.json
├── EntityReactor displays: 6,229 named entities
├── HexGrid renders: Maps with placed items
└── You can: Browse items → Place on map → Save changes
```

---

## 🎯 ENTITY REACTOR - THE ITEM BROWSER EXPLAINED

```
🎮 EntityReactorWindow.jsx
├── 📊 Table View: Spreadsheet of all items
├── 🎴 Cards View: Visual card layout
├── 🔍 Detailed View: Item info + image preview
├── 🔎 Search Bar: Find items by name
├── 🏷️ Filters: By type (items, critters, scenery)
└── 📸 Image Preview: Shows item sprites
```

**How it works:**
1. **Loads**: `entities-integrated.json` (9,259 entities)
2. **Filters**: Only shows entities with valid proto_id
3. **Displays**: Names from FOOBJ.MSG, descriptions, images
4. **Selection**: Click item → ready to place on map

---

## 🗺️ HEX GRID - THE MAP DISPLAY EXPLAINED

```
🗺️ HexGrid System
├── 📐 VirtualTileSystem: Efficient rendering
├── 🎯 Viewport Culling: Only shows visible tiles
├── 🔄 Buffer System: Smooth scrolling
├── 🖱️ Mouse Interaction: Click to place items
└── ⌨️ Keyboard Controls: WASD movement
```

**How it works:**
1. **Renders**: Hex grid based on .fomap files
2. **Optimizes**: Only draws what you can see
3. **Interacts**: Click hex → place selected item
4. **Updates**: Real-time visual feedback

---

## 🗄️ DATABASE STRUCTURE - WHAT'S INSIDE entities.db

```sql
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,     -- 🆔 Unique ID
  proto_id INTEGER,                  -- 🎯 Game PID (important!)
  name TEXT NOT NULL,                 -- 📛 Entity name
  primary_class TEXT NOT NULL,       -- 🏷️ Type (Item/Critter/Scenery)
  subclass TEXT,                      -- 📂 Sub-category
  properties TEXT,                   -- ⚙️ Game properties (JSON)
  pic_map TEXT,                       -- 🖼️ Map image path
  pic_inv TEXT,                       -- 📦 Inventory image path
  source_file TEXT,                   -- 📁 Original .fopro file
  validation_warnings TEXT,           -- ⚠️ Any issues found
  -- ... 32 more columns of detailed data
);
```

**Key Fields:**
- **proto_id**: The actual PID used in-game
- **primary_class**: Item/Critter/Scenery/Functional
- **properties**: JSON with all game stats
- **pic_map**: Path to item sprite

---

## 🔧 COMPONENT ARCHITECTURE - HOW THE UI FITS TOGETHER

```
🎮 React App Tree
├── 🏠 App.jsx                    # Main application
│   ├── 🗺️ HexGrid                 # Map display
│   ├── 🎯 EntityReactorWindow      # Item browser
│   ├── 🎛️ PanelToolbar            # Tool selection
│   ├── 📊 ConsolePanel            # Debug console
│   └── 🪟 TilePanel               # Layer/tools panel
│
├── 🎨 UI Components
│   ├── 🪟 BaseWindow.jsx          # Draggable windows
│   ├── 🔲 DockableWrapper.jsx     # Window docking system
│   └── 🪜 Nest.jsx                # Window container
│
└── 🗄️ Database System
    ├── 📊 DatabaseManager.js      # Database connection
    └── 🌐 BrowserProtoDatabaseManager.js # Browser version
```

---

## 🔄 THE COMPLETE USER JOURNEY

```
👤 User opens browser
    ↓
🌐 React app loads
    ↓
📊 DatabaseManager fetches entities-integrated.json
    ↓
🗺️ HexGrid renders map (from .fomap files)
    ↓
🎯 EntityReactor displays 9,259 entities
    ↓
👤 User browses items (search, filter, select)
    ↓
👤 User clicks "Combat Armor"
    ↓
🎯 EntityReactor shows details + image preview
    ↓
👤 User clicks hex on map
    ↓
🗺️ HexGrid places Combat Armor at that location. We probably don't know what happens next
    ↓
👤 User saves map and prays it is saved
    ↓
💾 Changes saved to .fomap format
```

---

## 🚀 PERFORMANCE TRICKS - HOW IT DOESN'T CRASH

### Virtual Tile System (VTS)
```
🗺️ Instead of drawing 10,000+ tiles:
├── 🎯 Only tiles in viewport (what you see)
├── 🔄 Buffer system for smooth scrolling
├── 📊 Efficient culling algorithms
└── ⚡ 60fps even with huge maps. In theory.
```

### Entity Database Optimization
```
📊 Instead of loading everything at once:
├── 🔍 Smart filtering by category
├── 📝 Lazy loading descriptions
├── 🖼️ Image preview on-demand
└── ⚡ Fast search with indexing
```

---

## 🐛 COMMON ISSUES - SHIT THAT BREAKS AND WHY

### Issue: "Entity Reactor shows no items!"
```
🔍 Check:
├── data/entities-integrated.json exists?
├── scripts ran in correct order?
├── FOOBJ.MSG processed correctly?
└── Browser console for errors?
```

### Issue: "Map doesn't load!"
```
🔍 Check:
├── .fomap files exist in legacy/?
├── HexGrid component initialized?
├── Map data format correct?
└── Browser console for tile errors?
```

### Issue: "Items have weird names like }{Combat Armor"
```
🔍 Check:
├── MSG string processing ran?
├── reprocess-msg-files.cjs executed?
├── String cleaning worked?
└── Integration script used corrected data?
```

---

## 🎯 HOW TO ADD NEW FEATURES - IDIOT'S GUIDE

### Adding a New Entity Type
```
1. 📝 Update scripts/create-entity-db.cjs
2. 🏷️ Add to classification system
3. 🎨 Add icon/color in EntityReactor
4. 🧪 Test with sample data
```

### Adding a New Map Tool
```
1. 🎨 Create new component in src/components/
2. 🪟 Add to TilePanel tool list
3. 🗺️ Implement hex interaction
4. ⌨️ Add keyboard shortcut
```

### Adding New Data Source
```
1. 📜 Create new processing script
2. 🗄️ Update database schema
3. 🌐 Update DatabaseManager
4. 🧪 Test integration
```

---

## 🏆 WHY THIS ARCHITECTURE DOESN'T SUCK

### ✅ What We Got Right
- **🗄️ Proper database**: SQLite for performance, JSON for browser
- **🎯 Clean separation**: Server processing → Browser display
- **🔧 Modular scripts**: Each script does one thing well
- **🎨 Component-based UI**: Reusable React components
- **📊 Good documentation**: You're reading it!

### ⚠️ What Could Be Better
- **🎨 CSS mess**: Too many inline styles (needs Tailwind)
- **🚀 Performance**: Could use more optimization
- **🧪 Testing**: Needs more automated tests
- **📱 Mobile**: Not mobile-friendly (yet)

---

## 🎓 YOU'RE NOW AN EXPERT

Congratulations! You now understand:
- ✅ How data flows from server to browser
- ✅ What each folder and file does
- ✅ How the Entity Reactor works
- ✅ How the Hex Grid renders maps
- ✅ How to debug common issues
- ✅ How to add new features

**Go forth and build amazing maps!** 🗺️✨

---

*This documentation was written because most technical docs read like they were written by robots who hate humans. If you understood this, you're ready to contribute to Project 412 Mapper.*

**If you didn't understand this, try reading it again with a cup of coffee. We don't support Kurwier's habits here.**
