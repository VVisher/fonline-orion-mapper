# FOnline Entity Classification & Heuristic Indexing (NEXUS)
## Comprehensive Design Specification v2.0

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Entity Taxonomy](#2-entity-taxonomy)
3. [Heuristic Detection Matrix](#3-heuristic-detection-matrix)
4. [Data Integrity & Fallback Logic](#4-data-integrity--fallback-logic)
5. [Agent Processing Phases](#5-agent-processing-phases)
6. [Heavy Token Operations](#6-heavy-token-operations)
7. [Interaction & Script Mapping](#7-interaction--script-mapping)
8. [Output Schema](#8-output-schema)
9. [Error Handling & Validation](#9-error-handling--validation)
10. [Performance Optimization](#10-performance-optimization)

---

## 1. System Overview

**Purpose:** Parse FOnline server prototype files (`.fopro`) and classify entities into a structured taxonomy, resolving ambiguities through heuristic analysis and cross-referencing with scripts, MSG files, and art assets.

**Core Challenge:** FOnline entities often lack explicit type declarations and have overlapping properties. The agent must intelligently classify them and map their relationships across the codebase.

---

## 2. Entity Taxonomy

### Class A: Critters (Living Entities)
**Primary Identifiers:**
- `ST_HP` (Hit Points)
- `ST_STRENGTH` or other SPECIAL stats
- `AiGroup` or `AiPacket`
- `BaseType` (sprite reference)

**Required Linkages:**
- `FOCRIT.MSG` for names/descriptions
- `art/critters/*.frm` for sprites
- `ScriptModule` for behavior

**Agent Note:** These are dynamic entities with AI. Always flag if `ScriptModule` is missing.

---

### Class B: Items (Interactable Objects)
**Primary Identifiers:**
- `Weight` > 0
- `Cost` > 0
- `PicInv` (inventory sprite)
- `IsCanPickUp = 1`

**Sub-Classes (Multi-Tagging Allowed):**

#### B1: Weapons
**Detection:**
- `DamageType` present
- OR `DamageMin` / `DamageMax` present
- OR `Weapon_*` prefix keys

#### B2: Armor
**Detection:**
- `ArmorClass` present
- OR `Armor_CrTypeMale` / `Armor_CrTypeFemale` present
- OR `DT_*` / `DR_*` keys (damage threshold/resistance)

#### B3: Consumables
**Detection:**
- `Deterioration` present (degrades over time)
- OR `StartScript` with `use_` prefix
- OR `FoodPoints` / `DrugEffect` keys

#### B4: Containers
**Detection:**
- `Container_Volume` present
- OR `Container_CannotPickUp` present
- OR `IsCanOpen = 1`

#### B5: Ammo/Stackables
**Detection:**
- `IsStackable = 1`
- OR `AmmoType` present

#### B6: Generic Items
**Fallback:** Has Item identifiers but doesn't match B1-B5

---

### Class C: Scenery (Static World Objects)
**Primary Identifiers:**
- Has `PicMap` (world sprite)
- Lacks Item/Critter identifiers
- Often minimal property set

**Sub-Classes:**

#### C1: Generic Scenery
**Detection:**
- Only `PicMap` and `ProtoId` present
- No interaction keys
- Examples: rocks, rugs, debris

#### C2: Blockers (Physical Obstacles)
**Detection:**
- `IsNoBlock = 0` (entity DOES block movement)
- AND/OR `IsProjBlock = 0` (entity DOES block projectiles)
- Usually no `Name` or `Description`
- **CRITICAL:** Flag these as collision geometry

#### C3: Interactive Scenery
**Detection:**
- Has `ScriptName` OR `TrigScript`
- May have `IsCanUse = 1`
- Examples: levers, terminals, workbenches

#### C4: Doors/Multi-State
**Detection:**
- `Door_*` prefix keys
- OR `IsCanOpen = 1` with scenery properties
- Track open/closed state PIDs

---

### Class D: Functional Prototypes (Utility/Invisible)

#### D1: Light Sources
**Detection:**
- `LightIntensity > 0`
- AND/OR `LightDistance > 0`
- AND/OR `LightColor` present

**Agent Note:** May not have `PicMap`. Mapper should render proxy icon with radius gizmo.

#### D2: Wall/Roof Tiles
**Detection:**
- `Type = Wall` (explicit)
- OR `Type = Roof` (explicit)
- OR `IsWall = 1`

**Agent Note:** Requires special renderer cutaway logic.

#### D3: Logical Entities (Triggers/Zones)
**Detection:**
- Referenced in `map_scripts` but minimal properties
- No visual representation (`PicMap` absent or null)
- **CRITICAL:** Do not flag as "orphaned" - these are intentional

---

## 3. Heuristic Detection Matrix

### Multi-Class Resolution Order

When an entity matches multiple classes, apply this priority:

1. **Explicit Type Field** (if present, trust it)
2. **Critter Indicators** (has HP/SPECIAL/AI)
3. **Item Indicators** (has Weight/Cost/PicInv)
4. **Functional Indicators** (Light/Wall/Roof)
5. **Scenery** (fallback)

### Conflict Handling: Multi-Tagging

If an entity has properties from multiple classes, use **Primary + Traits** structure:

```json
{
  "PID_PORTABLE_LANTERN": {
    "primary_class": "Item",
    "subclass": "Generic",
    "traits": ["LightSource", "Portable"],
    "conflict_reason": "Has both IsCanPickUp=1 and LightIntensity>0"
  }
}
```

### Detection Table (Priority Order)

| Keys Detected | Primary Class | Subclass/Trait | UI Behavior |
|---------------|---------------|----------------|-------------|
| `ST_HP` OR `AiGroup` | **Critter** | - | Enable AI Editor |
| `IsCanPickUp=1` + `Weight>0` | **Item** | (detect subclass) | Enable Inventory Preview |
| `LightIntensity>0` | (Add Trait) | **LightSource** | Show radius gizmo |
| `IsWall=1` OR `Type=Wall` | **Functional** | **Wall** | Enable cutaway logic |
| `IsNoBlock=0` | **Scenery** | **Blocker** | Highlight collision hex |
| `Door_*` keys | **Scenery** | **Door** | Track state transitions |
| `Container_*` keys | **Item** | **Container** | Enable content editor |
| Minimal properties only | **Scenery** | **Generic** | Low-priority selection |

---

## 4. Data Integrity & Fallback Logic

### The "Missing Name" Waterfall

Many FOnline entities lack proper names. Use this cascading lookup:

1. **Check `FOOBJ.MSG`** (or `FOCRIT.MSG` for critters)
   - If `@msg MSG_NAME {PID} {@}` returns non-empty string, use it
   
2. **Check `_defines.fos`**
   - Search for `#define PID_{NAME} {PID}`
   - Extract constant name (e.g., `PID_WOODEN_DOOR` → "Wooden Door")
   
3. **Check `PicMap` / `PicInv` Filename**
   - Extract basename without extension
   - Convert to title case (e.g., `DOOR01.FRM` → "Door 01")
   
4. **Final Fallback**
   - Label as `Unknown Entity #{PID}`
   - **Flag for manual review**

### MSG File Integrity Check

Before parsing, validate:
```
- FOOBJ.MSG exists and is readable
- FOCRIT.MSG exists and is readable
- No duplicate PID entries within MSG files
- All MSG entries are properly formatted
```

---

## 5. Agent Processing Phases

### Phase 0: Schema Validation (Light Operation)
**Time Estimate:** ~30 seconds for typical FOnline project

1. Scan `./server/proto/` for all `.fopro` files
2. Verify each file is parseable (valid format)
3. Check for duplicate `ProtoId` values
4. Validate MSG file paths and structure
5. Check art asset paths exist (`art/items/*.frm`, `art/critters/*.frm`)
6. Generate health report:
   ```json
   {
     "total_protos": 5000,
     "parse_errors": 3,
     "missing_msg_refs": 23,
     "missing_art_assets": 156,
     "duplicate_pids": 0
   }
   ```

---

### Phase 1: Primary Classification (Medium Operation)
**Time Estimate:** ~2 minutes for 5000 entities

For each `.fopro` file:
1. Extract all key-value pairs
2. Apply heuristic detection matrix (Section 3)
3. Assign primary class and subclass
4. Detect multi-class traits
5. Perform name resolution waterfall (Section 4)
6. Build initial entity record

**Output:** `entities_classified.json`

---

### Phase 2: Cross-Reference Indexing (Light-Medium Operation)
**Time Estimate:** ~1 minute

1. Parse all MSG files and create PID→Name lookup table
2. Parse `_defines.fos` and create Constant→PID lookup table
3. Cross-reference entity names with constants
4. Flag entities with name mismatches

---

### Phase 3: Map Reference Analysis ⚠️ **HEAVY TOKEN OPERATION**
**Time Estimate:** ~5-10 minutes for large projects
**Token Cost:** HIGH (must parse all `.fomap` files)

For each `.fomap` file:
1. Extract all entity placements (PID references)
2. Build reverse index: `PID → [map1, map2, ...]`
3. Detect "orphaned" entities (defined but never used)
4. Detect "phantom" entities (used but not defined)

**Optimization:** 
- Parse map files in parallel if possible
- Cache map→PID relationships
- Only re-scan modified maps on subsequent runs

**Output:** `entity_map_references.json`

```json
{
  "PID_1234": {
    "used_in_maps": ["vault13.fomap", "ncr.fomap"],
    "placement_count": 47,
    "first_appearance": "vault13.fomap"
  }
}
```

---

### Phase 4: Script Dependency Analysis ⚠️ **HEAVY TOKEN OPERATION**
**Time Estimate:** ~10-20 minutes for large codebases
**Token Cost:** VERY HIGH (must parse all `.fos` scripts)

**Objective:** Discover implicit entity relationships through script analysis.

#### Step 1: PID Constant Collection
Parse `_defines.fos` and extract all `PID_*` constants:
```angelscript
#define PID_STIMPAK    (1234)
#define PID_SUPERSTIM  (1235)
```

#### Step 2: Script Scanning ⚠️ **HEAVIEST OPERATION**
For each `.fos` file in `./scripts/`:

1. **Direct PID References:**
   ```angelscript
   item.AddItem(PID_STIMPAK, 5);
   cr.AddItem(PID_BOTTLE_CAPS, amount);
   ```
   Extract all `PID_*` identifiers used in function calls

2. **GetProtoId() Comparisons:**
   ```angelscript
   if (item.GetProtoId() == PID_WEAPON_PLASMA) { ... }
   ```

3. **Array/Collection References:**
   ```angelscript
   int[] loot = {PID_STIMPAK, PID_BOTTLE_CAPS, PID_AMMO_10MM};
   ```

4. **Spawner Patterns:**
   ```angelscript
   map.AddItem(x, y, PID_CONTAINER, 1);
   cr.AddItem(PID_WEAPON, 1);
   CreateCritter(PID_BRAHMIN, ...);
   ```

**Build Relationship Graph:**
```json
{
  "PID_1234": {
    "referenced_in_scripts": [
      {
        "file": "quest_vault13.fos",
        "line": 45,
        "context": "cr.AddItem(PID_STIMPAK, 5)",
        "function": "GiveReward"
      }
    ],
    "script_relationships": {
      "spawned_by": ["merchant_brahmin.fos", "doctor_npc.fos"],
      "modified_by": ["item_drug_use.fos"],
      "checked_by": ["combat_system.fos"]
    }
  }
}
```

**Optimization:**
- Use regex for initial pass (fast but imprecise)
- Full AST parsing only for ambiguous cases
- Cache results - only re-scan modified scripts
- Parallelize script parsing if possible

---

### Phase 5: Logical Blocker Detection ⚠️ **HEAVY TOKEN OPERATION**
**Time Estimate:** ~3-5 minutes
**Token Cost:** MEDIUM-HIGH

Cross-reference Phase 3 (map usage) with Phase 4 (script usage):

1. Find entities with **no visual properties** (`PicMap` absent/null)
2. Check if referenced in `map_scripts` or `map.AddItem()` calls
3. Flag as "Logical Blocker" or "Trigger Zone"
4. **Critical:** Mark as "DO NOT DELETE" in UI

**Output:**
```json
{
  "logical_entities": [
    {
      "pid": 9999,
      "name": "Vault Door Trigger",
      "maps": ["vault13.fomap"],
      "script": "vault_door_control.fos",
      "warning": "Invisible trigger - deletion will break map logic"
    }
  ]
}
```

---

### Phase 6: Conflict Resolution & Finalization (Light Operation)
**Time Estimate:** ~30 seconds

1. Review all multi-class entities
2. Apply final classification rules
3. Generate conflict report for manual review
4. Validate entity→script→map relationship integrity
5. Output final JSON database

---

## 6. Heavy Token Operations Summary

| Phase | Operation | Token Cost | Can Skip? | When to Run |
|-------|-----------|------------|-----------|-------------|
| **Phase 3** | Map Reference Analysis | HIGH | No | Initial + map changes |
| **Phase 4** | Script Dependency Analysis | VERY HIGH | Yes* | Initial + script changes |
| **Phase 5** | Logical Blocker Detection | MEDIUM | Yes* | After Phase 3+4 |

**\*Can Skip:** For rapid iteration, run Phase 4-5 only on full analysis. Daily work can use cached results.

### Incremental Update Strategy

**On .fopro changes:**
- Re-run Phase 1 for modified entities only
- No need to re-scan scripts/maps

**On .fomap changes:**
- Re-run Phase 3 for modified maps only
- Update entity→map reverse index

**On .fos script changes:**
- Re-run Phase 4 for modified scripts only
- Update PID→script relationship graph

**Full Rebuild Triggers:**
- New project import
- Major refactor
- _defines.fos changes (invalidates all PID constants)

---

## 7. Interaction & Script Mapping

### Container Content Simulation

For entities with `IsCanOpen = 1`:

1. Search scripts for `container.AddItem(PID, count)` calls
2. Build "typical contents" profile
3. UI should provide "Content Editor" with suggestions

**Example:**
```json
{
  "PID_LOCKER_METAL": {
    "container_data": {
      "volume": 250,
      "typical_contents": [
        {"pid": 1234, "name": "Stimpak", "count_range": [1, 3]},
        {"pid": 5678, "name": "Bottle Caps", "count_range": [10, 50]}
      ],
      "scripts_that_fill": ["loot_generator.fos", "merchant_restock.fos"]
    }
  }
}
```

### Door State Tracking

For entities with `Door_*` keys:

1. Detect if separate PIDs for open/closed states exist
2. Link them in entity record
3. UI should allow toggling between states

**Example:**
```json
{
  "PID_DOOR_WOOD_CLOSED": {
    "door_data": {
      "is_door": true,
      "state": "closed",
      "open_state_pid": 1235,
      "script": "door_locked.fos"
    }
  }
}
```

---

## 8. Output Schema

### Primary Output: `nexus_database.json`

```json
{
  "metadata": {
    "project_name": "FOnline Server",
    "scan_date": "2026-02-11T10:30:00Z",
    "total_entities": 5000,
    "classification_conflicts": 23,
    "missing_names": 156,
    "orphaned_entities": 12,
    "phantom_entities": 3,
    "script_scan_completed": true
  },
  
  "entities": {
    "1234": {
      "proto_id": 1234,
      "name": "Stimpak",
      "name_source": "FOOBJ.MSG",
      
      "classification": {
        "primary_class": "Item",
        "subclass": "Consumable",
        "traits": [],
        "confidence": "high",
        "conflicts": []
      },
      
      "properties": {
        "Weight": 453,
        "Cost": 175,
        "PicInv": "art/items/stimpak.frm",
        "PicMap": "art/items/stimpak_ground.frm",
        "Deterioration": 5000,
        "StartScript": "item_use@use_stimpak"
      },
      
      "references": {
        "msg_file": "FOOBJ.MSG",
        "msg_line": 1234,
        "constant": "PID_STIMPAK",
        "art_inv": "art/items/stimpak.frm",
        "art_map": "art/items/stimpak_ground.frm"
      },
      
      "usage": {
        "used_in_maps": ["vault13.fomap", "ncr.fomap"],
        "placement_count": 47,
        "referenced_in_scripts": [
          {
            "file": "quest_doctor.fos",
            "line": 89,
            "context": "cr.AddItem(PID_STIMPAK, 3)",
            "function": "RewardPlayer"
          }
        ],
        "spawned_by": ["loot_medical.fos", "merchant_doctor.fos"],
        "is_orphaned": false
      },
      
      "validation": {
        "has_name": true,
        "has_art": true,
        "has_scripts": true,
        "is_complete": true,
        "warnings": []
      }
    }
  },
  
  "relationships": {
    "doors": [
      {
        "closed_pid": 2001,
        "open_pid": 2002,
        "name": "Wooden Door"
      }
    ],
    
    "containers": [
      {
        "container_pid": 3001,
        "typical_contents": [1234, 1235, 5678],
        "fill_scripts": ["loot_generator.fos"]
      }
    ]
  },
  
  "diagnostics": {
    "conflicts": [
      {
        "pid": 4567,
        "reason": "Has both Item and LightSource properties",
        "resolution": "Tagged as Item with LightSource trait"
      }
    ],
    
    "orphaned": [
      {
        "pid": 9876,
        "name": "Unused Weapon Prototype",
        "reason": "Never used in maps or scripts"
      }
    ],
    
    "phantom": [
      {
        "pid": 5555,
        "referenced_in": ["map_special.fomap"],
        "reason": "Used in map but .fopro file missing"
      }
    ],
    
    "logical_blockers": [
      {
        "pid": 9999,
        "name": "Door Trigger Zone",
        "maps": ["vault13.fomap"],
        "script": "vault_door.fos",
        "warning": "Invisible - do not delete"
      }
    ]
  }
}
```

---

## 9. Error Handling & Validation

### Error Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **CRITICAL** | Parse failure, missing core files | Halt processing |
| **ERROR** | Phantom entity, broken reference | Flag for fix |
| **WARNING** | Missing name, no art asset | Continue with fallback |
| **INFO** | Multi-class entity, unused proto | Log only |

### Validation Checklist

**Per Entity:**
- [ ] Has valid ProtoId
- [ ] Has resolvable name (via waterfall)
- [ ] Art assets exist (if referenced)
- [ ] Scripts exist (if referenced)
- [ ] MSG entries valid (if referenced)

**Cross-Entity:**
- [ ] No duplicate PIDs
- [ ] Door open/closed pairs link correctly
- [ ] Container→contents relationships valid
- [ ] All map references resolve to defined entities

### Error Report Output

```json
{
  "critical_errors": [
    {
      "file": "items.fopro",
      "line": 234,
      "error": "Duplicate ProtoId 1234",
      "action_required": "Renumber one entity"
    }
  ],
  
  "warnings": [
    {
      "pid": 5678,
      "warning": "No MSG entry found, using constant name",
      "severity": "low"
    }
  ]
}
```

---

## 10. Performance Optimization

### Caching Strategy

**Cache Files (for incremental updates):**
```
.nexus_cache/
├── entity_classes.cache          # Phase 1 results
├── msg_lookups.cache              # Phase 2 results
├── map_references.cache           # Phase 3 results
├── script_dependencies.cache      # Phase 4 results
└── last_scan_timestamps.json
```

**Cache Invalidation Rules:**
- `.fopro` modified → invalidate entity record only
- `.fomap` modified → invalidate map cache only
- `.fos` modified → invalidate script cache only
- `_defines.fos` modified → invalidate ALL caches

### Parallel Processing Opportunities

**Can Parallelize:**
- Phase 1: Classify entities (embarrassingly parallel)
- Phase 3: Parse map files (independent)
- Phase 4: Parse script files (independent)

**Must Serialize:**
- Phase 0: Schema validation (dependency checks)
- Phase 5: Logical blocker detection (needs Phase 3+4 results)
- Phase 6: Final conflict resolution

### Memory Management

For large projects (10,000+ entities):
- Stream parse `.fopro` files instead of loading all into memory
- Use lazy loading for script analysis (only parse when needed)
- Implement pagination for UI entity browser

---

## Agent Implementation Checklist

### Phase 0 - Validation
- [ ] Scan for all `.fopro` files
- [ ] Verify MSG file integrity
- [ ] Check art asset paths
- [ ] Generate health report

### Phase 1 - Classification
- [ ] Parse each `.fopro`
- [ ] Apply heuristic matrix
- [ ] Perform name resolution waterfall
- [ ] Build entity records

### Phase 2 - Cross-Reference
- [ ] Parse MSG files
- [ ] Parse `_defines.fos`
- [ ] Build lookup tables
- [ ] Link constants to entities

### Phase 3 - Map Analysis (HEAVY)
- [ ] Parse all `.fomap` files
- [ ] Extract entity placements
- [ ] Build reverse index
- [ ] Detect orphans

### Phase 4 - Script Analysis (HEAVIEST)
- [ ] Extract PID constants
- [ ] Scan all `.fos` scripts for PID references
- [ ] Detect function patterns (AddItem, GetProtoId, etc.)
- [ ] Build relationship graph

### Phase 5 - Logical Blockers (HEAVY)
- [ ] Cross-reference map + script usage
- [ ] Identify invisible entities
- [ ] Flag critical entities

### Phase 6 - Finalization
- [ ] Resolve conflicts
- [ ] Validate relationships
- [ ] Generate diagnostic reports
- [ ] Output final JSON

---

## Suggested Agent Prompt

```
You are analyzing a FOnline server project. Your task is to classify all entities
in the ./server/proto/ directory according to the NEXUS taxonomy.

PHASES TO EXECUTE:
1. Phase 0: Validate all files (quick scan)
2. Phase 1: Classify entities using heuristic matrix
3. Phase 2: Cross-reference MSG and defines
4. Phase 3: HEAVY - Parse all .fomap files for entity usage
5. Phase 4: HEAVY - Parse all .fos scripts for PID references
6. Phase 5: HEAVY - Detect logical blockers
7. Phase 6: Generate final nexus_database.json

FOR HEAVY OPERATIONS:
- Report progress every 100 files processed
- Cache intermediate results
- Handle parse errors gracefully
- Generate detailed logs

CONFLICT RESOLUTION:
- Multi-class entities get primary + traits tags
- Follow priority order: Critter > Item > Functional > Scenery
- Flag all conflicts in diagnostics section

OUTPUT REQUIREMENTS:
- nexus_database.json (main output)
- error_report.json (validation issues)
- entity_conflicts.log (manual review needed)
```

---

**END OF SPECIFICATION**
