# Phase 0: Foundation & Architecture

[Back to TODO Index](../TODO.md)

---

**Goal**: Make all critical technical decisions and set up the development environment.  
**Duration**: 2-3 weeks  
**Priority**: 🔴 Critical path

### 0.1 Technology Stack Selection

- [ ] **Decision: Frontend framework** 🔴
  - Options: React, Vue, Svelte, vanilla JS
  - Recommendation: **React** (ecosystem, components, Electron compatibility)
  - Acceptance: Document decision in `docs/architecture.md`

- [ ] **Decision: Desktop wrapper** 🔴
  - Options: Electron, Tauri, NW.js, native (Qt/GTK)
  - Recommendation: **Electron** (cross-platform, web tech reuse)
  - Acceptance: Document decision in `docs/architecture.md`

- [ ] **Decision: Canvas rendering library** 🔴
  - Options: Konva.js, PixiJS, Fabric.js, raw Canvas API
  - Recommendation: **PixiJS** (performance, hex grid support)
  - Acceptance: Create proof-of-concept rendering 10x10 hex grid

- [ ] **Decision: Backend/file I/O** 🟡
  - Options: Node.js, Python bridge, Rust WASM
  - Recommendation: **Node.js** (native in Electron, npm ecosystem)
  - Acceptance: Write test script that reads/writes `.fomap` file

- [ ] **Decision: Database for protos** 🟡
  - Options: SQLite, IndexedDB, JSON files
  - Recommendation: **Better-SQLite3** (performance, SQL queries)
  - Acceptance: Create schema, insert 100 test protos, query by category

- [ ] **Decision: Testing framework** 🟢
  - Options: Jest, Vitest, Mocha+Chai
  - Recommendation: **Vitest** (fast, ESM support, works with React)
  - Acceptance: Write 3 sample tests (passing)

### 0.2 Project Setup

- [ ] **Initialize Git repository** 🔴
  - Create `.gitignore` (node_modules, dist, build, *.db)
  - Initial commit with README.md and TODO.md
  - Create `main` and `develop` branches

- [ ] **Initialize Node.js project** 🔴
  - Run `npm init -y`
  - Install core dependencies: `react`, `react-dom`, `electron`
  - Install dev dependencies: `vite`, `vitest`, `eslint`, `prettier`
  - Create `package.json` scripts: `dev`, `build`, `test`, `lint`

- [ ] **Set up Vite for React** 🔴
  - Create `vite.config.js`
  - Configure Electron build target
  - Test: `npm run dev` launches React app in browser

- [ ] **Set up Electron boilerplate** 🔴
  - Create `electron/main.js` (main process)
  - Create `electron/preload.js` (IPC bridge)
  - Configure Electron builder (`electron-builder` package)
  - Test: `npm run electron:dev` launches desktop app

- [ ] **Set up linting and formatting** 🟡
  - Configure ESLint for React + Node.js
  - Configure Prettier
  - Add pre-commit hook (husky + lint-staged)
  - Test: Intentionally write bad code, verify linter catches it

- [ ] **Create folder structure** 🔴
  ```
  src/
    ├── components/       (React UI components)
    ├── engine/           (Hex math, collision, logic)
    ├── pcg/              (Procedural generators)
    ├── database/         (Proto parsing, queries)
    ├── serialization/    (.fomap reader/writer)
    ├── validation/       (Map validation rules)
    ├── utils/            (Helpers, constants)
    └── App.jsx           (Root component)
  electron/
    ├── main.js
    └── preload.js
  data/
    └── protos.db         (Will be generated)
  source/                 (Reference files from archive)
  tests/
  docs/
  ```
  - Acceptance: Folders exist, each has a `README.md` stub

### 0.3 Documentation & Specifications

- [ ] **Document coordinate system** 🔴
  - Create `docs/coordinate-system.md`
  - Diagram: hex grid with labeled (hx, hy) coordinates
  - Formulas: hex-to-pixel, pixel-to-hex (with staggering)
  - Code examples in JavaScript
  - Acceptance: Another developer can implement hex math from this doc alone

- [ ] **Document .fomap file format** 🔴
  - Create `docs/fomap-format.md`
  - Specification of [Header], [Tiles], [Objects] sections
  - Field-by-field documentation (type, required/optional)
  - Examples of minimal and complex maps
  - Acceptance: Can write valid .fomap by hand from this spec

- [ ] **Document proto database schema** 🔴
  - Create `docs/proto-database.md`
  - SQL schema with field descriptions
  - Categorization rules (how filenames → categories)
  - Query examples (search, filter)
  - Acceptance: Can query protos without looking at code

- [ ] **Create architectural diagrams** 🟡
  - System architecture (UI → Logic → Data → File layers)
  - Data flow diagram (user action → map state → file export)
  - PCG pipeline (user input → algorithm → object placement)
  - Tool: Draw.io, Mermaid, or Excalidraw
  - Acceptance: Diagrams in `docs/architecture.md`

### 0.4 Reference File Analysis

- [ ] **Parse filing.fomap structure** 🔴
  - Manually inspect `source/filing.fomap`
  - Identify all field types and formats
  - Note: spacing, alignment, optional fields
  - Create annotated example in `docs/fomap-format.md`
  - Acceptance: Can explain every line of filing.fomap

- [ ] **Extract all ProtoID arrays from mapper_pcg.fos** 🟡
  - Grep for `const uint[]` arrays
  - Document in `docs/pcg-prefabs.md`:
    - `CobblestoneRoadPids`
    - `roadPids`
    - `tirestackPids`
    - `roadStuff`
    - `roadSideStuffX/Y`
  - Note: Which ProtoIDs work together aesthetically
  - Acceptance: Markdown table of all prefab arrays

- [ ] **List all Mapper API functions from mapper_main.fos** 🟢
  - Extract function signatures
  - Document in `docs/mapper-api-reference.md`
  - Note: Which functions we need to replicate vs. ignore
  - Acceptance: Checklist of "must implement" functions
