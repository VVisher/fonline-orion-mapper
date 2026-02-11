# Lists for parsing data to add to the mapper's spawning controls

**Note 1**: Some items will be missing their string NAME in MSG file or/and PID_NAMING within defines  
**Note 2**: Rest in pieces, bro, I salute you for diving into this archaic shit  
**Note 3**: 

## Parsing Index Structure

### Creatures index:
- `./server/proto/critter.lst` (Supposed to be accurate, but it's FOnline so,.. check manually and index)
- `./server/proto/critters/*.fopro`

### Items index:
- `./items.lst` (Supposed to be accurate, but it's FOnline so,.. check manually and index)
- `./server/proto/items/*.fopro`

### Objects dictionary (protoID link with string):
- `_msgstr.fos`

### Objects descriptions + names (protoID link):
- `./server/text/engl/FOOBJ.MSG` (this is fonline, so I'd not be surprised if we found items)

### Critters list:
- `/server/scripts/_npc_pids.fos`

### Maps:
- `./server/maps/GenerateWorld.cfg`
- `./server/maps/Locations.cfg`
- `./server/maps/_maps.fos`
- `./server/maps/PHX_maps.fos`

### Overarching list:
- `_defines.fos` (Take a note, it has ALL sort of shit here, so process it LAST, after you've done indexing and referencing stuff from proto files)

## Validation Script

**Last thing**: Add a script that will check the indexation for us after it is implemented in the future, maybe something simple in Python for our `./source/database/` folder - and link the referenced files which script will check for entries missing, it will save you crapload of manual work otherwise.

## Configuration

All paths should be configured via `aop-nightmare.json` for the FOnline: Ashes of Phoenix server installation.

## 🎭 **Movement I: Prelude - Enhanced Configuration** ✅ COMPLETE

### **1.1 Configuration Symphony (WorldEditor Enhanced)**
- [x] **Load aop-nightmare.cfg** with WorldEditor-style structure
- [x] **Add semantic categories** from WorldEditor.cfg
- [x] **Implement LINQ-style queries** for JavaScript
- [x] **Validate paths** exist and contain expected files
- [x] **Test semantic classification** logic

### **1.2 Instrument Setup**
- [x] **Create database schema** (database-guide.md with WorldEditor patterns)
- [x] **Prepare parsing tools** (enhanced entity parser)
- [x] **Set up validation system** (validate_indexation.py)
- [x] **Initialize EntityRepository** with LINQ-style methods

### **Movement I Results:**
- **Database Created**: 9,361 entities from 54 .fopro files
- **WorldEditor Patterns**: Semantic classification integrated
- **LINQ Queries**: EntityRepository with 20+ semantic methods
- **Validation System**: Operational with Unicode fixes
- **Configuration**: WorldEditor-style structure implemented

---

## 🎼 **Movement II: Allegro - Advanced Proto Processing**

### **2.1 Creatures Section (Semantic Classification)**
- [ ] **Parse critter.lst** for base creature definitions
- [ ] **Process critters/*.fopro** with WorldEditor semantic categories
- [ ] **Apply intelligent classification** using WorldEditor patterns:
  - `aliens`, `brahmins`, `deathclaws`, `dogs`, `geckos`
  - `ghouls`, `insects`, `mutants`, `plants`, `radscorpions`
  - `rats`, `robots`, `bandits`, `citizens`, `guards`
  - `merchants`, `slavers`, `tribals`, `vips`, `companions`
- [ ] **Extract creature properties**: stats, behaviors, scripts
- [ ] **Apply LINQ-style filtering** for hostile/friendly classification

### **2.2 Items Section (Semantic Classification)**
- [ ] **Parse items.lst** for base item definitions
- [ ] **Process items/*.fopro** with WorldEditor semantic categories:
  - `weapons`, `armor`, `ammunition`, `medicine`, `food`
  - `tools`, `containers`, `keys`, `books`, `misc`
- [ ] **Extract item properties**: weight, value, usage, scripts
- [ ] **Apply LINQ-style queries** for usable/takeable classification

### **2.3 Object Dictionary (Enhanced)**
- [ ] **Parse _msgstr.fos** for string mappings
- [ ] **Process multiple MSG files**: FOOBJ.MSG, FOGM.MSG, FODLG.MSG, FOGAME.MSG
- [ ] **Cross-reference proto IDs** with WorldEditor-style string data
- [ ] **Implement intelligent name resolution** with priority order

---

## 🎻 **Movement III: Andante - Script Integration**

### **3.1 NPC PIDs (Enhanced)**
- [ ] **Parse _npc_pids.fos** for NPC definitions
- [ ] **Cross-reference** with creature data using semantic categories
- [ ] **Map NPC types** to proto IDs with WorldEditor patterns
- [ ] **Apply LINQ queries** for merchant/guard/tribal classification

### **3.2 Map Configuration (WorldEditor Structure)**
- [ ] **Parse GenerateWorld.cfg** for world generation
- [ ] **Process Locations.cfg** for location definitions  
- [ ] **Parse _maps.fos** and **PHX_maps.fos** for map metadata
- [ ] **Process worldmap_h.fos** and **maps header files**
- [ ] **Apply WorldEditor path structure** for consistency

### **3.3 Overarching Defines (Process LAST)**
- [ ] **Parse _defines.fos** LAST as specified by WorldEditor
- [ ] **Extract ALL constants** and enum values
- [ ] **Cross-reference** with all previous data using LINQ queries
- [ ] **Build scriptDefines Map** for fast lookups

---

## 🎺 **Movement IV: Scherzo - Cross-Reference & Validation**

### **4.1 PID Consistency (LINQ-Enhanced)**
- [ ] **Validate all ProtoIDs** exist in defines using LINQ queries
- [ ] **Check for orphaned references** with EntityRepository
- [ ] **Map relationships** between entities using semantic categories
- [ ] **Apply WorldEditor validation patterns**

### **4.2 Script Validation (Enhanced)**
- [ ] **Verify script references** exist in server files
- [ ] **Check function signatures** match expectations
- [ ] **Validate script parameters** are correct
- [ ] **Apply LINQ-style cross-referencing**

### **4.3 Data Integrity (WorldEditor Patterns)**
- [ ] **Run validate_indexation.py** for comprehensive checks
- [ ] **Generate validation report** with LINQ-style analysis
- [ ] **Fix critical errors** before proceeding
- [ ] **Apply WorldEditor integrity checks**

---

## 🎸 **Movement V: Finale - Database Population**

### **5.1 Entity Database Creation (WorldEditor Enhanced)**
- [ ] **Create enhanced database** with WorldEditor semantic columns
- [ ] **Populate entities table** with classified data
- [ ] **Establish relationships** using semantic categories
- [ ] **Store LINQ query patterns** for reuse

### **5.2 Script Integration (Advanced)**
- [ ] **Link entities to scripts** with proper parameters
- [ ] **Store script metadata** for smart object system
- [ ] **Create usage tracking** with LINQ-style optimization
- [ ] **Apply WorldEditor script integration patterns**

### **5.3 Performance Optimization (LINQ-Style)**
- [ ] **Create database indexes** for LINQ query performance
- [ ] **Implement caching system** with EntityRepository pattern
- [ ] **Optimize for 1000+ entity** performance using WorldEditor techniques
- [ ] **Apply LINQ-style filtering** for fast data access

---

## 🎼 **Movement VI: Coda - Testing & Validation**

### **6.1 Functional Testing (WorldEditor Compatibility)**
- [ ] **Test entity lookup** by ProtoID with semantic categories
- [ ] **Test LINQ-style queries** for complex filtering
- [ ] **Test script integration** with database
- [ ] **Test WorldEditor compatibility** with existing data

### **6.2 Integration Testing**
- [ ] **Test mapper integration** with spawning controls
- [ ] **Test validation script** accuracy with enhanced data
- [ ] **Test configuration** with WorldEditor-style structure
- [ ] **Test LINQ performance** with large datasets

### **6.3 Performance Testing**
- [ ] **Test with 9,259+ entities** using LINQ queries
- [ ] **Validate 60 FPS** performance target
- [ ] **Test memory usage** under load with EntityRepository
- [ ] **Test WorldEditor-inspired optimizations**

---

## 🎭 **Performance Requirements (WorldEditor Enhanced)**

### **Tempo (Speed)**
- **Parse all proto files**: <30 seconds (WorldEditor benchmark)
- **LINQ queries**: <100ms average
- **Validation checks**: <5 seconds
- **Entity lookup**: <10ms cached (EntityRepository)

### **Dynamics (Memory)**
- **Database size**: <10MB for AoP server (WorldEditor compatible)
- **Memory usage**: <500MB during parsing
- **Cache size**: 1000 entities max (EntityRepository pattern)
- **Peak performance**: 60 FPS with 1000+ objects

---

## 🎺 **Error Handling (WorldEditor Patterns)**

### **Minor Issues (Warnings)**
- Missing optional files
- Orphaned references  
- Inconsistent naming
- Semantic classification conflicts

### **Major Issues (Errors)**
- Missing critical files (critter.lst, items.lst)
- Database corruption
- Script integration failures
- WorldEditor compatibility issues

### **Critical Issues (Stop)**
- Configuration errors
- File permission issues
- Out of memory errors
- LINQ query failures

---

## 🎼 **Success Criteria (WorldEditor Enhanced)**

### **Movement Complete When:**
- ✅ All AoP server files parsed successfully with semantic classification
- ✅ Database populated with 9,259+ entities using WorldEditor patterns
- ✅ All cross-references validated with LINQ queries
- ✅ Performance targets met with EntityRepository optimization
- ✅ Integration with mapper working with WorldEditor compatibility
- ✅ Validation script passes with enhanced checks
- ✅ WorldEditor semantic classification working correctly

---

## 🎭 **Orchestration Notes (WorldEditor Integration)**

### **Conductor (Developer) Responsibilities:**
- **Monitor each movement** for proper execution
- **Adjust tempo** based on system performance
- **Handle solos** (error recovery) gracefully
- **Ensure harmony** between WorldEditor patterns and our system

### **Audience (Users) Benefits:**
- **Complete entity database** with semantic classification
- **Validated data integrity** with WorldEditor compatibility
- **Performance optimized** with LINQ-style queries
- **Extensible system** for future server support
- **WorldEditor-compatible** workflow and structure

---

## 🎼 **WorldEditor Integration Notes**

### **Key WorldEditor Features Implemented:**
- **Semantic Classification**: Using WorldEditor proto categories
- **Path Structure**: WorldEditor.cfg-style configuration
- **LINQ Queries**: Translated to JavaScript EntityRepository
- **Validation Patterns**: WorldEditor integrity checks
- **Performance Optimization**: WorldEditor-inspired caching

### **Translation Strategy:**
- **Study concepts, not copy code** - Extract patterns and logic
- **Adapt to JavaScript** - Translate C# patterns to JS equivalents
- **Maintain React frontend** - Keep our modern UI approach
- **Optimize for web** - Adapt desktop patterns to web environment

---

*This enhanced parsing movement incorporates proven WorldEditor patterns while maintaining our modern JavaScript/React architecture, creating the best of both worlds for FOnline: Ashes of Phoenix data processing.*
