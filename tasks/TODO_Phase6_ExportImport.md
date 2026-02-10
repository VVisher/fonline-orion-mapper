# Phase 6: Export, Import, and File I/O

[Back to TODO Index](../TODO.md)

---

**Goal**: Enable saving/loading maps, exporting to game formats, and robust file management.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

### 6.1 Map Export
- [ ] **Export to .FOMAP** 🔴
  - File: `src/io/exportFomap.js`
  - Acceptance: Can export current map to valid .fomap file

- [ ] **Export to .CFG** 🔴
  - File: `src/io/exportCfg.js`
  - Acceptance: Can export to .cfg format

- [ ] **Export to .INI** 🟡
  - File: `src/io/exportIni.js`
  - Acceptance: Can export to .ini format

### 6.2 Map Import
- [ ] **Import from .FOMAP** 🔴
  - File: `src/io/importFomap.js`
  - Acceptance: Can import .fomap file, objects appear on map

- [ ] **Import from .CFG** 🔴
  - File: `src/io/importCfg.js`
  - Acceptance: Can import .cfg file

- [ ] **Import from .INI** 🟡
  - File: `src/io/importIni.js`
  - Acceptance: Can import .ini file

### 6.3 File Management
- [ ] **File open/save dialogs** 🔴
  - Use Electron or browser APIs
  - Acceptance: User can open/save files from disk

- [ ] **Recent files list** 🟡
  - Show last 5 opened files
  - Acceptance: Recent files menu works

- [ ] **Auto-save** 🟡
  - Save every 5 minutes or on major change
  - Acceptance: No data loss on crash

### 6.4 Data Validation
- [ ] **Validate on import/export** 🔴
  - Check for missing/invalid fields
  - Acceptance: Invalid files are rejected with error

- [ ] **Show import/export errors** 🔴
  - User-friendly error messages
  - Acceptance: Errors are clear and actionable

---

**End of Phase 6**
