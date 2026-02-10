# Phase 1: The Serializer

[Back to TODO Index](../TODO.md)

---

**Goal**: Prove we can write valid `.fomap` files that the FOnline server accepts.  
**Duration**: 2 weeks  
**Priority**: 🔴 Critical path

---

## CRITICAL SERIALIZATION RULES & VALIDATION

- All fields for objects (types 0, 1, 2) must be left-aligned, value starts at column 21 (0-indexed: position 20).
- Tiles use a special format: `tile       HexX HexY            art\path\to\sprite.frm`.
  - HexX: right-aligned in 4 chars
  - HexY: right-aligned in 3 chars
  - Path starts at column 27
- Critter parameters: `Critter_ParamIndexN` must be immediately followed by `Critter_ParamValueN`.
- No OffsetX/Y fields if value is 0.
- MapObjType must be correct (0=Critter, 1=Item, 2=Scenery).
- Dir for critters must be 0-5.
- LightDistance (0-20), LightIntensity (0-100) valid for all types.
- Line endings must be \n (Unix), not \r\n (Windows).
- File ends with a blank line.
- Blank line separates every object block.
- Byte-for-byte identical output required.

---

### 1.1 .fomap Parser (Read)
- [ ] **Create FomapParser class** 🔴
  - File: `src/serialization/FomapParser.js`
  - Method: `parse(fileContent)` → returns map object
  - Parse `[Header]` section into `header` object
  - Parse `[Tiles]` section into `tiles[]` array (NEW: must handle tile lines as in d3.fomap)
  - Parse `[Objects]` section into `objects[]` array
  - Handle optional fields gracefully
  - Acceptance: Can parse `source/filing.fomap` and `source/d3.fomap` without errors
  - See code snippet for tile parsing:
    ```javascript
    // hexX must be right-aligned in 4 chars
    const xStr = String(tile.hexX).padStart(4, ' ');
    // hexY must be right-aligned in 3 chars
    const yStr = String(tile.hexY).padStart(3, ' ');
    // Construct line
    const line = `tile       ${xStr}  ${yStr}       ${tile.path}`;
    ```

#### 1.1.5: Parse Tile Section
- [ ] Parse `[Tiles]` section from .fomap files
- [ ] Extract: HexX, HexY, SpritePath
- [ ] Handle column-specific formatting (not same as objects!)
- Acceptance: Can parse d3.fomap tiles without errors

- [ ] **Write unit tests for parser** 🔴
  - File: `tests/FomapParser.test.js`
  - Test: Parse minimal map (header + 1 object)
  - Test: Parse filing.fomap (reference file)
  - Test: Parse d3.fomap (tiles, critters, lights)
  - Test: Handle missing optional fields
  - Test: Reject invalid format (wrong section order)
  - Acceptance: All tests pass

### 1.2 .fomap Serializer (Write)
- [ ] **Create FomapSerializer class** 🔴
  - File: `src/serialization/FomapSerializer.js`
  - Method: `serialize(mapObject)` → returns file content string
  - Write `[Header]` with proper spacing/alignment
  - Write `[Tiles]` section (NEW: must match d3.fomap tile format exactly)
  - Write `[Objects]` with all fields (required + optional, including critter and light fields)
  - Match exact format of filing.fomap and d3.fomap (spacing matters!)
  - Acceptance: Can serialize simple map, output matches expected format
  - See code snippet for object field alignment:
    ```javascript
    const fieldName = "ProtoId";
    const value = "5622";
    const COLUMN_START = 21;
    const spacesNeeded = COLUMN_START - fieldName.length;
    const line = fieldName + " ".repeat(spacesNeeded) + value;
    // Result: "ProtoId              5622"
    ```

#### 1.2.3: Serialize Tile Section
- [ ] Write `[Tiles]` section with correct spacing
- [ ] Format: `tile       HexX HexY            path`
- [ ] Right-align coordinates in their columns
- Acceptance: Tile section matches d3.fomap format exactly

- [ ] **Write unit tests for serializer** 🔴
  - File: `tests/FomapSerializer.test.js`
  - Test: Serialize minimal map
  - Test: Round-trip (parse → serialize → parse again, should match)
  - Test: Serialize map with all optional fields
  - Test: Serialize map with tiles, critters, lights (d3.fomap)
  - Test: Proper newline handling (Unix vs. Windows)
  - Acceptance: All tests pass, round-trip works

#### 1.5: Critter (MapObjType 0) Support
- [ ] Parse critter-specific fields (Dir, Critter_Cond, etc.)
- [ ] Parse Critter_ParamIndex/Value pairs
- [ ] Serialize critters with all fields
- Acceptance: Can round-trip d3.fomap critters

#### 1.6: Light Properties Support
- [ ] Parse LightDistance and LightIntensity
- [ ] Apply to all object types (0, 1, 2)
- [ ] Serialize light properties
- Acceptance: Light-emitting objects work

#### 1.7: Updated Round-Trip Test
- [ ] Test with d3.fomap (2518 lines, tiles, critters, lights)
- [ ] Byte-for-byte comparison
- Acceptance: d3.fomap round-trips perfectly

### 1.3 Validation Against Server
- [ ] **Set up test server** 🔴
  - Install FOnline server (TLA SDK or Fonline Reloaded)
  - Configure to load maps from `data/maps/`
  - Document setup in `docs/testing-with-server.md`
  - Acceptance: Server starts, can load a known-good map

- [ ] **Create test suite with known-good maps** 🔴
  - Copy `source/filing.fomap` and `source/d3.fomap` to `tests/fixtures/`
  - Create 3 variations:
    1. Minimal map (100x100, 5 objects)
    2. Medium map (200x200, 50 objects, scripts)
    3. Complex map (200x200, 200 objects, tiles, multiple types)
  - Acceptance: All fixtures documented in `tests/fixtures/README.md`

- [ ] **Automated server validation test** 🟡
  - Script: `tests/validate-with-server.sh`
  - For each fixture:
    1. Serialize to .fomap
    2. Copy to server maps folder
    3. Start server, attempt to load map
    4. Parse server log for errors
    5. Report: PASS if no errors, FAIL otherwise
  - Acceptance: Script exists, all fixtures pass

### 1.4 File I/O Integration
- [ ] **Implement file read/write in Electron** 🔴
  - Electron IPC: `read-fomap`, `write-fomap`, `list-maps`
  - Main process: Use Node.js `fs` module
  - Renderer process: Call via IPC bridge
  - Security: Validate file paths (prevent directory traversal)
  - Acceptance: Can read/write .fomap from React app

- [ ] **Add file picker dialog** 🟡
  - Use Electron `dialog.showOpenDialog` for load
  - Use Electron `dialog.showSaveDialog` for save
  - Filter: `.fomap` files only
  - Remember last directory (localStorage)
  - Acceptance: User can load/save files via GUI

---

## PRIORITY UPDATES

**The following are now CRITICAL PATH 🔴**:

1. **Tile section support** - Many real maps use tiles
2. **Critter support** - Can't make maps without NPCs
3. **Light properties** - Common in real maps

**Update Phase 1 duration**: 1 week → **2 weeks** (due to increased complexity)

---

## COMMON MISTAKES TO AVOID

- Using tabs for spacing (must use spaces)
- Wrong column alignment (values must start at column 21)
- Applying object spacing to tiles (tiles have their own column rules)

---

## EMERGENCY DEBUGGING

If the server rejects your map and you can't see why:

- Compare byte-by-byte:
  ```bash
  hexdump -C d3.fomap > reference.hex
  hexdump -C your_map.fomap > your_map.hex
  diff reference.hex your_map.hex
  # Look for:
  # - 0x09 (tab character) - should be 0x20 (space)
  # - 0x0d 0x0a (Windows CRLF) - should be 0x0a (Unix LF)
  # - Misaligned columns (extra 0x20 or missing 0x20)
  ```

---

## 2. Tile Section Format (SPECIAL CASE)

**⚠️ CRITICAL: Tiles are formatted DIFFERENTLY from Objects!**

Do **NOT** use the Object alignment rule for tiles. Tiles use specific fixed-width columns for coordinates.

**Format**:
```
tile       HexX HexY            art\path\to\sprite.frm
```

**Strict Column Layout**:
1.  **Keyword**: `tile` (columns 0-3)
2.  **Spacer**: 7 spaces (columns 4-10).
3.  **HexX**: Right-aligned in a 4-character space (columns 11-14).
4.  **Spacer**: 2 spaces (columns 15-16).
5.  **HexY**: Right-aligned in a 3-character space (columns 17-19).
6.  **Spacer**: 7 spaces (columns 20-26).
7.  **Path**: Starts at column 27.

**Example**:
```
tile       108  20             art\tiles\EDG5001.frm
```
- `tile` (0-3)
- spaces (4-10)
- HexX (11-14)
- spaces (15-16)
- HexY (17-19)
- spaces (20-26)
- Path (27+)

**Serialization Logic**:
```javascript
// hexX must be right-aligned in 4 chars
const xStr = String(tile.hexX).padStart(4, ' ');
// hexY must be right-aligned in 3 chars
const yStr = String(tile.hexY).padStart(3, ' ');
// Construct line
// "tile" + 7 spaces + X + 2 spaces + Y + padding to col 27
// Note: "tile" (4) + 7 spaces = 11. X is 4 chars. Ends at 15.
// + 2 spaces = 17. Y is 3 chars. Ends at 20.
// To reach 27, we need 7 spaces after Y.
const line = `tile       ${xStr}  ${yStr}       ${tile.path}`;
```

---

**DO NOT move to Phase 2 until the serializer passes the byte-identical round-trip test with d3.fomap.**

The entire project depends on this working perfectly. The server doesn't care about your UI if the file format is wrong.

---

## TESTING THE SERIALIZER

### Test 1: Round-Trip

```javascript
// 1. Parse existing d3.fomap (contains tiles & critters)
const originalContent = fs.readFileSync('tests/fixtures/d3.fomap', 'utf-8');
const parsedMap = FomapParser.parse(originalContent);

// 2. Serialize back
const serializedContent = new FomapSerializer(parsedMap).serialize();

// 3. Compare byte-by-byte
if (originalContent === serializedContent) {
  console.log("✓ PASS: Serializer is byte-perfect!");
} else {
  console.log("✗ FAIL: Serializer output differs!");
  // Show differences
  const diff = require('diff');
  const differences = diff.diffChars(originalContent, serializedContent);
  console.log(differences);
}
```

### Test 2: Server Load Test

```bash
#!/bin/bash
# 1. Serialize map
node serialize-map.js input.json output.fomap

# 2. Copy to server
cp output.fomap /path/to/server/data/maps/test_map.fomap

# 3. Start server and check logs
cd /path/to/server
./FOnlineServer > server.log 2>&1 &

# 4. Check for map load errors
sleep 5
grep -i "test_map" server.log

# 5. Look for errors
if grep -i "error" server.log | grep -i "test_map"; then
  echo "✗ FAIL: Server rejected the map!"
  exit 1
else
  echo "✓ PASS: Server accepted the map!"
fi
```

---

**Your serializer MUST pass these tests before proceeding to the next phase.**

