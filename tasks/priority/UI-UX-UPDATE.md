## 🎨 UI/UX Suggestions (Priority Order):

### 🔴 CRITICAL (Do These First):

#### 1. **Visual Prefab Thumbnails**
**Current**: Text list (`5622`, `2067`, etc.)
**Suggested**: 
- Show sprite thumbnails (64x64px) next to or instead of ProtoID numbers
- User sees WHAT they're placing, not a number
- Fallback: colored squares if sprite missing

```
Instead of:
  □ 5622
  □ 2067
  □ 666

Show:
  [Floor Tile Icon] Industrial Floor (5622)
  [Wall Icon] Metal Wall (2067)
  [Locker Icon] Metal Locker (666)
```

#### 2. **Search/Filter Bar**
**Where**: Top of left sidebar
**Why**: With 1000+ protos, scrolling is painful
**Features**:
- Text search (fuzzy matching)
- Filter by category dropdown
- "Recently used" quick access

```
┌─────────────────────────┐
│ 🔍 Search protos...     │
├─────────────────────────┤
│ Category: [All ▼]       │
├─────────────────────────┤
│ Recently Used:          │
│  [Icon] Floor           │
│  [Icon] Wall            │
└─────────────────────────┘
```

#### 3. **Selected Object Highlight**
**Current**: Hard to see what's selected
**Suggested**:
- Bright outline (yellow/cyan) around selected object
- Selected object properties in right panel
- Show selection count if multi-select

#### 4. **Minimap**
**Where**: Bottom-right corner (small, 150x150px)
**Why**: Navigate large maps quickly
**Features**:
- Shows entire 400x400 map scaled down
- White rectangle = current viewport
- Click minimap to jump to location
- Toggle visibility (button)

---

### 🟡 IMPORTANT (Quality of Life):

#### 5. **Layer Toggle Buttons**
**Where**: Top toolbar
**Why**: Hide clutter when working
**Buttons**:
```
[👁️ Tiles] [👁️ Objects] [👁️ Grid] [👁️ Roof]
```
- Click to toggle visibility
- Hotkeys: F1-F4 (like legacy mapper)

#### 6. **Zoom Controls**
**Where**: Top-right or bottom-left
**UI**:
```
[−] 50% [+]
```
- Slider for smooth zoom
- Mouse wheel still works
- Show current zoom percentage

#### 7. **Camera Pan Indicator**
**Why**: Easy to get lost on 400x400 maps
**Show**: Current camera center hex in top bar
```
📍 View: (200, 200) | Zoom: 100%
```

#### 8. **Object Count**
**Where**: Bottom status bar
**Show**:
```
Objects: 147 | Tiles: 1240 | Selected: 3
```

#### 9. **Validation Status Indicator**
**Where**: Top-right corner
**Icons**:
- ✅ Green checkmark: No issues
- ⚠️ Yellow warning: Warnings (overlaps, etc.)
- ❌ Red X: Errors (out of bounds, invalid ProtoID)
**Click**: Opens validation report panel

---

### 🟢 NICE-TO-HAVE (Polish):

#### 10. **Undo/Redo Buttons**
**Where**: Top toolbar
```
[↶ Undo] [↷ Redo]
```
- Show hotkeys on hover (Ctrl+Z, Ctrl+Shift+Z)
- Disable if stack empty (grayed out)

#### 11. **Object Placement Preview**
**Before placing**: Show ghost sprite at mouse cursor
**Visual**: Semi-transparent (50% opacity)
**Why**: See what you're about to place before clicking

#### 12. **Smart Grid Snapping Toggle**
**Where**: Top toolbar checkbox
```
☑ Snap to Grid
```
- When on: Objects snap to hex centers
- When off: Free placement (for precise offsets)

#### 13. **Multi-Select Rectangle**
**How**: Click-drag to draw selection box
**Visual**: Dotted blue rectangle while dragging
**Result**: All objects inside = selected

#### 14. **Context Menu (Right-Click)**
```
Right-click object:
  Copy (Ctrl+C)
  Delete (Del)
  Duplicate (Ctrl+D)
  ───────────────
  Properties
```

#### 15. **File Menu Bar**
```
File  Edit  View  Tools  Help
├─ File:
│  New Map (Ctrl+N)
│  Open Map (Ctrl+O)
│  Save Map (Ctrl+S)
│  Export to Server
│  ─────────────
│  Quit
├─ Edit:
│  Undo (Ctrl+Z)
│  Redo (Ctrl+Shift+Z)
│  Copy (Ctrl+C)
│  Paste (Ctrl+V)
│  Delete (Del)
├─ View:
│  Toggle Grid (F10)
│  Toggle Tiles (F1)
│  Toggle Objects (F2)
│  Zoom In (+)
│  Zoom Out (-)
│  Reset Zoom (Ctrl+0)
├─ Tools:
│  Road Generator
│  Building Generator
│  Forest Generator
│  Validate Map
├─ Help:
│  Tutorial
│  Hotkeys Reference
│  About
```

---

## 🎯 Workflow Improvements:

#### 16. **Quick Toolbar** (Most-Used Actions)
```
[New] [Open] [Save] | [Undo] [Redo] | [Grid] [Validate] | [Road] [Building]
```

#### 17. **Properties Panel Tabs**
**When object selected**:
```
┌─────────────────────┐
│ [Basic] [Scripts] [Advanced]
├─────────────────────┤
│ Basic:              │
│  ProtoID: 5622      │
│  Position: 146, 154 │
│  OffsetX: -7        │
│  OffsetY: 8         │
├─────────────────────┤
│ Scripts:            │
│  Script: [PHX_dungeons ▼]
│  Function: [_InitDungeonLocker ▼]
│  Item_Val0: 5940    │
├─────────────────────┤
│ Advanced:           │
│  MapObjType: 1      │
│  Collision: Yes     │
```

#### 18. **Bulk Operations Panel**
**When multi-select active**:
```
┌─────────────────────┐
│ 12 Objects Selected │
├─────────────────────┤
│ Move All:           │
│  ΔX: [0] ΔY: [0]    │
│  [Apply]            │
├─────────────────────┤
│ Replace Script:     │
│  [PHX_dungeons ▼]   │
│  [Apply to All]     │
└─────────────────────┘
```

---

## 🚀 Advanced Features (Post-MVP):

#### 19. **Template System**
**Save common patterns**:
```
User places:
  - Floor tile
  - Wall
  - Locker (with script)

Saves as: "Storage Room Template"

Later: Click "Storage Room" → all 3 objects placed at once
```

#### 20. **Lighting Preview**
**Toggle**: Day/Night/Dusk modes
**Effect**: Apply color overlay to show how map looks at different times
**Uses**: DayColor values from header

#### 21. **Script Library Panel**
**Show**: All available server scripts
**Filter**: By category (dungeon, quest, crafting)
**Drag-drop**: Script onto object to attach

---

## 🎨 Visual Polish:

#### 22. **Color Scheme** (Current looks good, but consider):
- **Selected objects**: Bright cyan/yellow outline
- **Hovered object**: Subtle highlight
- **Invalid objects**: Red tint
- **Collision objects**: Different color when grid toggled

#### 23. **Icons Over Text** (Where Possible)
```
Instead of:        Use:
"Delete"       →   🗑️
"Save"         →   💾
"Undo"         →   ↶
"Validate"     →   ✓
"Road Tool"    →   🛣️
"Building"     →   🏢
```

#### 24. **Tooltips Everywhere**
- Hover any button → show tooltip with description + hotkey
- Example: Hover trash icon → "Delete (Del)"

---

## 🏗️ Architecture Suggestions:

#### 25. **Keyboard Shortcuts Panel**
**Press**: `?` or `F1`
**Shows**: Modal with all hotkeys
```
┌─────────────────────────────┐
│     Keyboard Shortcuts      │
├─────────────────────────────┤
│ Ctrl+N     New Map          │
│ Ctrl+O     Open Map         │
│ Ctrl+S     Save Map         │
│ Ctrl+Z     Undo             │
│ Ctrl+Y     Redo             │
│ Del        Delete Selected  │
│ F10        Toggle Grid      │
│ +/-        Zoom In/Out      │
└─────────────────────────────┘
```

#### 26. **Autosave**
- Save map state every 5 minutes to temp file
- On crash: "Recover unsaved changes?"

#### 27. **Export Dialog** (Enhanced)
```
┌─────────────────────────────┐
│      Export Map             │
├─────────────────────────────┤
│ Filename: [mymap.fomap]     │
│ Location: [Browse...]       │
│                             │
│ ☑ Validate before export    │
│ ☑ Backup existing file      │
│ ☐ Generate Locations.cfg    │
│ ☐ Generate WorldGen.cfg     │
│                             │
│ [Cancel]  [Export]          │
└─────────────────────────────┘
```

---

## 📊 What To Prioritize:

**Week 1** (Critical UX):
1. Thumbnails for prefabs (#1)
2. Search bar (#2)
3. Selected object highlight (#3)
4. Validation indicator (#9)

**Week 2** (Navigation):
5. Minimap (#4)
6. Layer toggles (#5)
7. Zoom controls (#6)

**Week 3** (Workflow):
8. Undo/Redo UI (#10)
9. Properties panel tabs (#17)
10. Context menu (#14)

**Week 4** (Polish):
11. Ghost preview (#11)
12. File menu (#15)
13. Tooltips (#24)

---

## 💬 My Honest Take:

**You've built the foundation in DAYS, not weeks. That's insane.**

The fact that the hex grid renders, objects place, and you have a working properties panel means you're already past Phase 2 in the TODO. 

The suggestions above are **gravy**. The tool is already usable. Now it's about making it **delightful** to use.

**What matters most**:
1. Visual thumbnails (so users see sprites, not numbers)
2. Search (so users can find stuff fast)
3. Validation feedback (so users know if map will work)
4. Minimap (so users don't get lost)

Everything else is polish. Kurwa.
