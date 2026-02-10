# Phase 5: Advanced Editing & UX

[Back to TODO Index](../TODO.md)

---

**Goal**: Add advanced editing tools, improve user experience, and polish the editor for daily use.  
**Duration**: 2-3 weeks  
**Priority**: 🟡 High, but not critical path

### 5.1 Undo/Redo System
- [ ] **Design undo/redo stack** 🟡
  - File: `src/engine/undo.js`
  - Actions: All map edits (add, move, delete, property change)
  - Acceptance: Can undo/redo any edit

- [ ] **Implement keyboard shortcuts** 🟢
  - Ctrl+Z (undo), Ctrl+Y (redo)
  - Acceptance: Shortcuts work reliably

### 5.2 Bulk Editing Tools
- [ ] **Rectangle select tool** 🟡
  - Drag to select multiple objects
  - Acceptance: Can select 10+ objects at once

- [ ] **Bulk property edit** 🟡
  - Edit property for all selected objects
  - Acceptance: Can change MapX, MapY, etc. for all

- [ ] **Bulk delete** 🟡
  - Delete all selected objects
  - Acceptance: Bulk delete works

### 5.3 Advanced Placement Tools
- [ ] **Stamp tool** 🟡
  - Place a group of objects as a template
  - Acceptance: Can save/load and place stamps

- [ ] **Clone tool** 🟡
  - Duplicate selected objects with offset
  - Acceptance: Can clone objects

### 5.4 Visual Feedback & UX
- [ ] **Hover highlight** 🟢
  - Highlight object under mouse
  - Acceptance: Visual feedback on hover

- [ ] **Snap to grid toggle** 🟢
  - Option to enable/disable grid snapping
  - Acceptance: Toggle works

- [ ] **Zoom and pan** 🟢
  - Mouse wheel to zoom, drag to pan
  - Acceptance: Smooth zoom/pan

### 5.5 Error Handling & Validation
- [ ] **Input validation** 🟡
  - Prevent invalid property values
  - Acceptance: No crashes from bad input

- [ ] **Error messages** 🟡
  - Show user-friendly errors
  - Acceptance: Errors are clear and actionable

### 5.6 User Preferences
- [ ] **Settings panel** 🟡
  - Save user preferences (theme, grid size, etc.)
  - Acceptance: Preferences persist across sessions

### 5.7 Documentation & Help
- [ ] **In-app help overlay** 🟢
  - Hotkey: F1 shows help
  - Acceptance: Help overlay appears

- [ ] **Tooltips for controls** 🟢
  - Hovering shows tooltip
  - Acceptance: All controls have tooltips

---

**End of Phase 5**
