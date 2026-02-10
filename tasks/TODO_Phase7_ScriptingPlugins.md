# Phase 7: Scripting, Automation, and Plugins

[Back to TODO Index](../TODO.md)

---

**Goal**: Add scripting support, automation tools, and plugin architecture for extensibility.  
**Duration**: 2-3 weeks  
**Priority**: 🟡 High, not critical path

### 7.1 Scripting Support
- [ ] **Script runner integration** 🟡
  - File: `src/scripting/runner.js`
  - Run scripts on map objects/events
  - Acceptance: Can run scripts, see output

- [ ] **Script editor UI** 🟡
  - In-app code editor (Monaco, Ace, or similar)
  - Syntax highlighting, error checking
  - Acceptance: Can edit and save scripts

### 7.2 Automation Tools
- [ ] **Batch placement tool** 🟡
  - Place objects from CSV or template
  - Acceptance: Can import and place 100+ objects

- [ ] **Auto-tile tool** 🟡
  - Automatically fill areas with tiles
  - Acceptance: Can auto-fill regions

### 7.3 Plugin Architecture
- [ ] **Plugin loader** 🟡
  - Load plugins from /plugins folder
  - Acceptance: Can load/unload plugins at runtime

- [ ] **Plugin API documentation** 🟡
  - Document available hooks, events, and APIs
  - Acceptance: Plugin devs have clear docs

### 7.4 Example Plugins
- [ ] **Sample plugin: Randomizer** 🟢
  - Randomizes object positions
  - Acceptance: Plugin works, can be enabled/disabled

- [ ] **Sample plugin: Export Stats** 🟢
  - Exports map stats to CSV
  - Acceptance: Plugin works, can be enabled/disabled

---

**End of Phase 7**
