# FOnline Entity Database Implementation Workflow

**Reference**: Enhanced entity database design + Nexus specification  
**Created**: 2026-02-11  
**Purpose**: Step-by-step implementation guide for comprehensive entity database

---

## 🎯 **Implementation Overview**

This workflow combines the **basic proto database** with the **advanced Nexus specification** to create a truly comprehensive FOnline entity database system.

### **Key Enhancements Over Basic Design:**
- **Complete Entity Coverage**: All entity types, not just standard protos
- **Script Integration**: Full cross-referencing with script defines
- **Usage Tracking**: Map and script usage analysis
- **Relationship Mapping**: Entity relationships (doors, containers)
- **Validation System**: Comprehensive validation and diagnostics
- **Performance Optimization**: Advanced caching and indexing

---

## 📋 **Phase-by-Phase Implementation**

### **Phase 1: Foundation Setup** (30 minutes)

#### **1.1 Create Enhanced Database Schema**
```bash
# Create the enhanced database
node scripts/create-entity-db.js
```

**File**: `scripts/create-entity-db.js`
```javascript
const Database = require('better-sqlite3');
const fs = require('fs');

// Read enhanced schema
const schema = fs.readFileSync('docs/entity-database-enhanced.md', 'utf8');
// Extract SQL and create database
const db = new Database('data/entities.db');
// Execute schema creation
```

#### **1.2 Initialize Entity Types**
```javascript
// Insert standard entity types from enhanced schema
const entityTypes = [
  { type_id: 1, type_name: 'Critter', type_category: 'primary' },
  { type_id: 2, type_name: 'Item', type_category: 'primary' },
  // ... all types from enhanced schema
];
```

**Acceptance**: Database created with all tables and indexes

---

### **Phase 2: Basic Entity Parsing** (2 hours)

#### **2.1 Create Enhanced Entity Parser**
**File**: `src/database/entityParser.js`

```javascript
class EntityParser {
  constructor() {
    this.classificationRules = this.loadClassificationRules();
    this.nameResolution = new NameResolution();
  }

  parseFoproFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const protoSections = this.extractProtoSections(content);
    
    return protoSections.map(section => ({
      proto_id: this.extractProtoId(section),
      properties: this.extractProperties(section),
      classification: this.classifyEntity(section),
      name: this.resolveName(section),
      source_file: filePath
    }));
  }

  classifyEntity(protoSection) {
    // Apply Nexus heuristic detection matrix
    const detection = this.applyHeuristicMatrix(protoSection);
    
    return {
      primary_class: detection.primary,
      subclass: detection.subclass,
      traits: detection.traits,
      confidence: detection.confidence,
      conflicts: detection.conflicts
    };
  }
}
```

#### **2.2 Implement Heuristic Detection Matrix**
```javascript
applyHeuristicMatrix(protoSection) {
  const props = this.extractProperties(protoSection);
  const detection = {
    primary: null,
    subclass: null,
    traits: [],
    confidence: 'high',
    conflicts: []
  };

  // Priority order from Nexus spec
  if (this.hasCritterIndicators(props)) {
    detection.primary = 'Critter';
    detection.confidence = 'high';
  } else if (this.hasItemIndicators(props)) {
    detection.primary = 'Item';
    detection.subclass = this.detectItemSubclass(props);
    detection.confidence = 'high';
  } else if (this.hasFunctionalIndicators(props)) {
    detection.primary = 'Functional';
    detection.subclass = this.detectFunctionalSubclass(props);
    detection.confidence = 'medium';
  } else {
    detection.primary = 'Scenery';
    detection.subclass = this.detectScenerySubclass(props);
    detection.confidence = 'low';
  }

  // Check for traits
  if (props.LightIntensity > 0) detection.traits.push('LightSource');
  if (props.IsNoBlock === 0) detection.traits.push('Blocker');
  if (props.IsCanPickUp === 1) detection.traits.push('Portable');

  return detection;
}
```

#### **2.3 Batch Process All Proto Files**
**File**: `scripts/parse-all-entities.js`

```javascript
const EntityParser = require('../src/database/entityParser.js');
const Database = require('better-sqlite3');

async function parseAllEntities() {
  const parser = new EntityParser();
  const db = new Database('data/entities.db');
  
  // Get all .fopro files
  const protoFiles = glob.sync('source/proto/**/*.fopro');
  
  for (const file of protoFiles) {
    console.log(`Parsing ${file}...`);
    const entities = parser.parseFoproFile(file);
    
    // Insert into database
    const stmt = db.prepare(`
      INSERT INTO entities (
        proto_id, name, primary_class, subclass, traits,
        properties, source_file, classification_confidence
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const entity of entities) {
      stmt.run(
        entity.proto_id,
        entity.name,
        entity.classification.primary_class,
        entity.classification.subclass,
        JSON.stringify(entity.classification.traits),
        JSON.stringify(entity.properties),
        entity.source_file,
        entity.classification.confidence
      );
    }
  }
  
  console.log(`Parsed ${protoFiles.length} proto files`);
}
```

**Acceptance**: All .fopro files parsed into enhanced database

---

### **Phase 3: Script Integration** (3 hours)

#### **3.1 Create Script Defines Parser**
**File**: `src/database/scriptDefinesParser.js`

```javascript
class ScriptDefinesParser {
  parseScriptFiles(scriptDir) {
    const defines = new Map();
    
    // Parse _defines.fos first
    const definesFile = path.join(scriptDir, '_defines.fos');
    if (fs.existsSync(definesFile)) {
      this.parseDefinesFile(definesFile, defines);
    }
    
    // Parse all .fos files for usage
    const scriptFiles = glob.sync(`${scriptDir}/**/*.fos`);
    for (const file of scriptFiles) {
      this.parseScriptUsage(file, defines);
    }
    
    return defines;
  }

  parseDefinesFile(filePath, defines) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/^#define\s+(\w+)\s*\(\s*(\d+)\s*\)/);
      if (match) {
        const [, defineName, value] = match;
        defines.set(defineName, {
          value: parseInt(value),
          file: filePath,
          line: index + 1,
          type: defineName.startsWith('PID_') ? 'PID' : 'OTHER'
        });
      }
    });
  }

  parseScriptUsage(filePath, defines) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Find PID references
      const pidMatches = line.match(/(PID_\w+)/g);
      if (pidMatches) {
        pidMatches.forEach(pid => {
          if (defines.has(pid)) {
            const define = defines.get(pid);
            if (!define.usage) define.usage = [];
            define.usage.push({
              file: filePath,
              line: index + 1,
              context: line.trim(),
              type: this.detectUsageType(line)
            });
          }
        });
      }
    });
  }
}
```

#### **3.2 Cross-Reference Entities with Script Defines**
**File**: `scripts/cross-reference-scripts.js`

```javascript
const ScriptDefinesParser = require('../src/database/scriptDefinesParser.js');
const Database = require('better-sqlite3');

async function crossReferenceScripts() {
  const parser = new ScriptDefinesParser();
  const db = new Database('data/entities.db');
  
  // Parse all script files
  const scriptDefines = parser.parseScriptFiles('source/scripts');
  
  // Insert script defines
  const defineStmt = db.prepare(`
    INSERT INTO script_defines (
      define_name, define_value, script_file, line_number, define_type
    ) VALUES (?, ?, ?, ?, ?)
  `);
  
  // Link defines to entities
  const linkStmt = db.prepare(`
    UPDATE entities SET 
      script_defines = ?,
      referenced_in_scripts = ?
    WHERE proto_id = ?
  `);
  
  for (const [defineName, define] of scriptDefines) {
    // Insert define
    defineStmt.run(
      defineName,
      define.value,
      define.file,
      define.line,
      define.type
    );
    
    // Try to link to entity
    const entity = db.prepare('SELECT entity_id FROM entities WHERE proto_id = ?').get(define.value);
    if (entity) {
      const defines = [defineName];
      const scriptCount = define.usage ? define.usage.length : 0;
      
      linkStmt.run(
        JSON.stringify(defines),
        scriptCount,
        define.value
      );
    }
  }
  
  console.log(`Processed ${scriptDefines.size} script defines`);
}
```

**Acceptance**: Script defines cross-referenced with entities

---

### **Phase 4: Map Usage Analysis** (2 hours)

#### **4.1 Create Map Parser**
**File**: `src/database/mapParser.js`

```javascript
class MapParser {
  parseMapFile(mapPath) {
    const content = fs.readFileSync(mapPath, 'utf8');
    const entityRefs = this.extractEntityReferences(content);
    
    return {
      map_file: path.basename(mapPath),
      entities: entityRefs
    };
  }

  extractEntityReferences(content) {
    const entityRefs = new Map();
    
    // Find all PID references in map data
    const lines = content.split('\n');
    let currentSection = null;
    
    lines.forEach((line, index) => {
      // Track current section
      if (line.startsWith('[Objects]') || line.startsWith('[Critters]')) {
        currentSection = line.slice(1, -1);
        return;
      }
      
      // Extract entity references
      const match = line.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (match && currentSection) {
        const [, x, y, , pid] = match.map(Number);
        
        if (!entityRefs.has(pid)) {
          entityRefs.set(pid, {
            proto_id: pid,
            placements: [],
            section: currentSection
          });
        }
        
        entityRefs.get(pid).placements.push({ x, y, line: index + 1 });
      }
    });
    
    return Array.from(entityRefs.values());
  }
}
```

#### **4.2 Process All Maps**
**File**: `scripts/analyze-map-usage.js`

```javascript
const MapParser = require('../src/database/mapParser.js');
const Database = require('better-sqlite3');

async function analyzeMapUsage() {
  const parser = new MapParser();
  const db = new Database('data/entities.db');
  
  // Get all .fomap files
  const mapFiles = glob.sync('source/maps/**/*.fomap');
  
  for (const file of mapFiles) {
    console.log(`Analyzing ${file}...`);
    const mapData = parser.parseMapFile(file);
    
    // Update entity usage
    const updateStmt = db.prepare(`
      UPDATE entities SET 
        used_in_maps = used_in_maps + 1,
        placement_count = placement_count + ?,
        first_appearance_map = COALESCE(first_appearance_map, ?)
      WHERE proto_id = ?
    `);
    
    // Insert map usage details
    const usageStmt = db.prepare(`
      INSERT INTO map_usage (
        entity_id, map_file, placement_count, first_x, first_y
      ) VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const entity of mapData.entities) {
      const dbEntity = db.prepare('SELECT entity_id FROM entities WHERE proto_id = ?').get(entity.proto_id);
      
      if (dbEntity) {
        updateStmt.run(
          entity.placements.length,
          mapData.map_file,
          entity.proto_id
        );
        
        usageStmt.run(
          dbEntity.entity_id,
          mapData.map_file,
          entity.placements.length,
          entity.placements[0].x,
          entity.placements[0].y
        );
      }
    }
  }
  
  console.log(`Analyzed ${mapFiles.length} map files`);
}
```

**Acceptance**: Map usage tracked for all entities

---

### **Phase 5: Relationship Mapping** (1 hour)

#### **5.1 Detect Entity Relationships**
**File**: `src/database/relationshipMapper.js`

```javascript
class RelationshipMapper {
  detectDoorRelationships(db) {
    const doorStmt = db.prepare(`
      SELECT entity_id, proto_id, name, properties
      FROM entities 
      WHERE is_door = TRUE
      ORDER BY proto_id
    `);
    
    const doors = doorStmt.all();
    const relationships = [];
    
    // Group doors by name patterns
    const doorGroups = this.groupDoorsByName(doors);
    
    for (const [baseName, group] of doorGroups) {
      if (group.length === 2) {
        // Likely open/closed states
        const [closed, open] = group.sort((a, b) => a.proto_id - b.proto_id);
        
        relationships.push({
          source_entity_id: closed.entity_id,
          target_entity_id: open.entity_id,
          relationship_type: 'door_state',
          relationship_data: JSON.stringify({
            base_name: baseName,
            closed_pid: closed.proto_id,
            open_pid: open.proto_id
          }),
          confidence: 'high'
        });
      }
    }
    
    return relationships;
  }

  detectContainerRelationships(db) {
    // Analyze script usage to detect container contents
    const containerStmt = db.prepare(`
      SELECT e.entity_id, e.proto_id, e.name, su.context, su.script_file
      FROM entities e
      JOIN script_usage su ON e.entity_id = su.entity_id
      WHERE e.is_container = TRUE
      AND su.usage_type = 'container_fill'
    `);
    
    const containers = containerStmt.all();
    const relationships = [];
    
    for (const container of containers) {
      const contents = this.extractContainerContents(container.context);
      
      relationships.push({
        source_entity_id: container.entity_id,
        target_entity_id: null, // Will be filled later
        relationship_type: 'container_content',
        relationship_data: JSON.stringify({
          typical_contents: contents,
          fill_scripts: [container.script_file]
        }),
        confidence: 'medium'
      });
    }
    
    return relationships;
  }
}
```

**Acceptance**: Entity relationships detected and stored

---

### **Phase 6: Validation & Diagnostics** (1 hour)

#### **6.1 Create Validation System**
**File**: `src/database/entityValidator.js`

```javascript
class EntityValidator {
  validateEntities(db) {
    const validation = {
      total_entities: 0,
      complete_entities: 0,
      orphaned_entities: 0,
      phantom_entities: 0,
      conflicts: 0,
      warnings: []
    };
    
    // Count total entities
    validation.total_entities = db.prepare('SELECT COUNT(*) FROM entities').get()['COUNT(*)'];
    
    // Check completeness
    const completeStmt = db.prepare(`
      SELECT COUNT(*) FROM entities 
      WHERE has_complete_data = TRUE
    `);
    validation.complete_entities = completeStmt.get()['COUNT(*)'];
    
    // Find orphaned entities
    const orphanedStmt = db.prepare(`
      SELECT COUNT(*) FROM entities 
      WHERE is_orphaned = TRUE
    `);
    validation.orphaned_entities = orphanedStmt.get()['COUNT(*)'];
    
    // Find phantom entities (script defines without entities)
    const phantomStmt = db.prepare(`
      SELECT COUNT(*) FROM script_defines sd
      LEFT JOIN entities e ON sd.define_value = e.proto_id
      WHERE e.entity_id IS NULL
    `);
    validation.phantom_entities = phantomStmt.get()['COUNT(*)'];
    
    // Check classification conflicts
    const conflictStmt = db.prepare(`
      SELECT COUNT(*) FROM entities 
      WHERE conflicts IS NOT NULL 
      AND json_array_length(conflicts) > 0
    `);
    validation.conflicts = conflictStmt.get()['COUNT(*)'];
    
    return validation;
  }

  generateDiagnostics(db) {
    const diagnostics = {
      classification_issues: [],
      missing_art: [],
      script_issues: [],
      relationship_problems: []
    };
    
    // Classification issues
    const classStmt = db.prepare(`
      SELECT proto_id, name, primary_class, classification_confidence
      FROM entities 
      WHERE classification_confidence = 'low'
      ORDER BY name
    `);
    diagnostics.classification_issues = classStmt.all();
    
    // Missing art assets
    const artStmt = db.prepare(`
      SELECT proto_id, name, pic_map, pic_inv
      FROM entities 
      WHERE has_art = FALSE
      ORDER BY name
    `);
    diagnostics.missing_art = artStmt.all();
    
    return diagnostics;
  }
}
```

**Acceptance**: Comprehensive validation report generated

---

## 🚀 **Performance Optimization**

### **Caching Strategy**
```javascript
// Create materialized views for common queries
const createViews = `
CREATE MATERIALIZED VIEW entity_browser_view AS
SELECT 
  entity_id, proto_id, name, primary_class, subclass,
  pic_map, pic_inv, traits, tags,
  used_in_maps, referenced_in_scripts,
  classification_confidence
FROM entities
WHERE is_orphaned = FALSE
ORDER BY primary_class, name;

CREATE INDEX idx_entity_browser_name ON entity_browser_view(name);
CREATE INDEX idx_entity_browser_class ON entity_browser_view(primary_class, subclass);
`;
```

### **Query Optimization**
```javascript
// Optimized search query
const searchEntities = (term, filters = {}) => {
  let query = `
    SELECT * FROM entity_browser_view 
    WHERE name LIKE ? 
  `;
  
  const params = [`%${term}%`];
  
  if (filters.primary_class) {
    query += ` AND primary_class = ?`;
    params.push(filters.primary_class);
  }
  
  if (filters.has_art) {
    query += ` AND pic_map IS NOT NULL`;
  }
  
  query += ` ORDER BY name LIMIT 50`;
  
  return db.prepare(query).all(...params);
};
```

---

## 📊 **Testing Strategy**

### **Unit Tests**
```javascript
// tests/entityParser.test.js
describe('EntityParser', () => {
  test('should classify critters correctly', () => {
    const protoSection = `
      [Proto]
      ProtoId = 1001
      ST_HP = 50
      AiGroup = 1
      BaseType = art/critters/brahmin.frm
    `;
    
    const result = parser.classifyEntity(protoSection);
    expect(result.primary_class).toBe('Critter');
    expect(result.confidence).toBe('high');
  });
});
```

### **Integration Tests**
```javascript
// tests/database-integration.test.js
describe('Database Integration', () => {
  test('should parse and store entities correctly', async () => {
    await parseAllEntities();
    await crossReferenceScripts();
    await analyzeMapUsage();
    
    const entity = db.prepare('SELECT * FROM entities WHERE proto_id = 1001').get();
    expect(entity).toBeDefined();
    expect(entity.primary_class).toBe('Critter');
  });
});
```

---

## 📈 **Success Metrics**

### **Database Statistics**
- **Total Entities**: 5000+ (typical FOnline server)
- **Classification Accuracy**: 95%+ confidence for 80% of entities
- **Script Integration**: 90%+ of PIDs cross-referenced
- **Map Coverage**: 100% of map placements tracked
- **Performance**: <50ms for common queries

### **Validation Results**
- **Complete Entities**: 80%+ have complete data
- **Orphaned Entities**: <5% of total
- **Phantom Entities**: <2% of script defines
- **Classification Conflicts**: <3% of total

---

## 🔄 **Maintenance & Updates**

### **Incremental Updates**
```javascript
// Update only changed files
const updateEntity = async (protoFile) => {
  const entities = parser.parseFoproFile(protoFile);
  
  for (const entity of entities) {
    const existing = db.prepare('SELECT entity_id FROM entities WHERE proto_id = ?').get(entity.proto_id);
    
    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE entities SET 
          name = ?, properties = ?, updated_at = CURRENT_TIMESTAMP
        WHERE proto_id = ?
      `).run(entity.name, JSON.stringify(entity.properties), entity.proto_id);
    } else {
      // Insert new
      // ... insert logic
    }
  }
};
```

### **Full Rebuild Triggers**
- New project import
- Major script refactoring
- _defines.fos changes
- Manual validation request

---

## 🎯 **Implementation Checklist**

### **Phase 1: Foundation**
- [ ] Create enhanced database schema
- [ ] Initialize entity types reference
- [ ] Set up basic database connection

### **Phase 2: Entity Parsing**
- [ ] Implement entity parser
- [ ] Add heuristic classification
- [ ] Batch process all proto files
- [ ] Validate parsing results

### **Phase 3: Script Integration**
- [ ] Parse script defines
- [ ] Cross-reference with entities
- [ ] Track script usage
- [ ] Validate script references

### **Phase 4: Map Analysis**
- [ ] Parse map files
- [ ] Track entity usage
- [ ] Build reverse index
- [ ] Identify orphaned/phantom entities

### **Phase 5: Relationships**
- [ ] Detect door state relationships
- [ ] Analyze container contents
- [ ] Map entity relationships
- [ ] Store relationship data

### **Phase 6: Validation**
- [ ] Run comprehensive validation
- [ ] Generate diagnostics report
- [ ] Optimize performance
- [ ] Create maintenance procedures

---

**Status**: 📋 **WORKFLOW COMPLETE**  
**Ready for Implementation**: All phases documented with code examples
