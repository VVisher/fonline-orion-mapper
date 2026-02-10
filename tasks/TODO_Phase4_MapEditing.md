# Phase 4: Basic Map Editing

[Back to TODO Index](../TODO.md)

---

**Goal**: Place, select, edit, delete, move objects manually.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 4.1 Map State Management
- [ ] **Design map state structure** 🔴
  - File: `src/engine/mapState.js`
  - State schema: (see full schema in main TODO)
  - Acceptance: Schema documented in `docs/map-state.md`

- [ ] **Implement map state reducer** 🔴
  - Use React Context or Redux
  - Actions: `ADD_OBJECT`, `UPDATE_OBJECT`, `DELETE_OBJECT`, `MOVE_OBJECT`
  - Acceptance: Can dispatch actions, state updates correctly

### 4.2 Object Placement
- [ ] **Place object at clicked hex** 🔴
  - User flow: select prefab, click hex, object added, renders immediately
  - Auto-calculate offsets (default to 0, or proto-specific)
  - Acceptance: Can place 50+ objects on map

- [ ] **Prevent duplicate placement** 🟡
  - Warn if object already at hex (same ProtoID)
  - Option to allow/prevent duplicates
  - Acceptance: User gets feedback before creating duplicate

### 4.3 Object Selection
- [ ] **Click to select object** 🔴
  - Visual feedback, store selected object ID
  - Acceptance: Can select any object on map

- [ ] **Multi-select with Ctrl+click** 🟡
  - Ctrl+click/Shift+click for multi/range select
  - Acceptance: Can select multiple objects

- [ ] **Select all (Ctrl+A)** 🟢
  - Hotkey: Ctrl+A selects all objects
  - Acceptance: Ctrl+A works

### 4.4 Properties Panel
- [ ] **Create PropertiesPanel component** 🔴
  - Show all fields, editable and read-only
  - Acceptance: Panel appears on selection

- [ ] **Editable fields** 🔴
  - MapX, MapY, OffsetX, OffsetY, ScriptName, FuncName, Item_Val0-9
  - Acceptance: Can edit any field, changes reflected

- [ ] **Read-only fields** 🟡
  - ProtoID, MapObjType (derived)
  - Acceptance: User can't accidentally break ProtoID

### 4.5 Object Deletion
- [ ] **Delete selected object (Del key)** 🔴
  - Confirmation dialog if multiple
  - Acceptance: Can delete objects

- [ ] **Delete all in selection** 🟡
  - Bulk delete, undo support (Phase 10)
  - Acceptance: Bulk delete works

### 4.6 Object Movement
- [ ] **Drag-and-drop to move** 🔴
  - Ghost sprite follows mouse, update on release
  - Acceptance: Can reposition objects visually

- [ ] **Arrow keys to move** 🟡
  - Arrow keys move selected object 1 hex, Shift+Arrow = 5 hexes
  - Acceptance: Keyboard movement works

### 4.7 Copy/Paste
- [ ] **Copy selected object (Ctrl+C)** 🟢
  - Copy object data to clipboard state
  - Acceptance: Ctrl+C stores object

- [ ] **Paste object (Ctrl+V)** 🟢
  - Paste at current mouse hex, new unique ID
  - Acceptance: Ctrl+V creates copy

### 4.8: Critter Placement Tool
- [ ] UI for placing NPCs (MapObjType 0)
- [ ] Direction picker (0-5, visual arrows)
- [ ] Animation selectors (Anim1, Anim2)
- [ ] Stat editor (ParamIndex/Value pairs)
- Acceptance: Can place and configure NPCs

### 4.9: Light Properties Editor
- [ ] Light distance slider (0-20 hexes)
- [ ] Intensity slider (0-100)
- [ ] Visual preview of light radius
- Acceptance: Can make objects emit light
