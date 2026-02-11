# FOnline: Ashes of Phoenix Database Guide

**Purpose**: Comprehensive guide for FOnline: Ashes of Phoenix entity database implementation  
**Created**: 2026-02-11  
**Scope**: Complete database system from basic proto storage to advanced entity management

---

## 🎭 **Entity Classification System (NEXUS Integration)**

### **Entity Taxonomy (Heuristic-Based Classification)**

#### **Class A: Critters (Living Entities)**
```sql
-- Enhanced critter classification
INSERT INTO entity_types (type_id, type_name, description, color) VALUES
(3, 'Critter', 'Living entities with AI and behaviors', '#FF9800'),
(31, 'Critter_Hostile', 'Hostile NPCs and monsters', '#F44336'),
(32, 'Critter_Friendly', 'Friendly NPCs and traders', '#4CAF50'),
(33, 'Critter_Animal', 'Animals and wildlife', '#8BC34A');
```

#### **Class B: Items (Usable Objects)**
```sql
-- Item classification with subcategories
INSERT INTO entity_types (type_id, type_name, description, color) VALUES
(1, 'Item', 'Usable objects', '#4CAF50'),
(11, 'Item_Weapon', 'Weapons and ammunition', '#FF5722'),
(12, 'Item_Armor', 'Protection and defense', '#795548'),
(13, 'Item_Medical', 'Healing and chems', '#E91E63'),
(14, 'Item_Food', 'Consumables and provisions', '#CDDC39'),
(15, 'Item_Tool', 'Tools and equipment', '#607D8B'),
(16, 'Item_Container', 'Storage and bags', '#9C27B0');
```

#### **Class C: Scenery (Environmental Objects)**
```sql
-- Scenery classification
INSERT INTO entity_types (type_id, type_name, description, color) VALUES
(2, 'Scenery', 'Environmental objects', '#2196F3'),
(21, 'Scenery_Structure', 'Buildings and architecture', '#3F51B5'),
(22, 'Scenery_Nature', 'Natural environment', '#4CAF50'),
(23, 'Scenery_Tech', 'Technology and machinery', '#FF9800'),
(24, 'Scenery_Debris', 'Ruins and destruction', '#795548');
```

### **WorldEditor Semantic Classification**

#### **Proto Categories (from WorldEditor.cfg)**
```javascript
// WorldEditor semantic categories for intelligent classification
const semanticCategories = {
  critters: [
    'aliens', 'brahmins', 'deathclaws', 'dogs', 'geckos', 
    'ghouls', 'insects', 'mutants', 'plants', 'radscorpions', 
    'rats', 'robots', 'bandits', 'citizens', 'encounter', 
    'guards', 'merchants', 'slavers', 'slaves', 'tribals', 
    'vips', '3d', 'bounty', 'companions', 'strangers', 'invalid'
  ],
  items: [
    'weapons', 'armor', 'ammunition', 'medicine', 'food', 
    'tools', 'containers', 'keys', 'books', 'misc'
  ],
  scenery: [
    'structures', 'nature', 'tech', 'debris', 'walls', 
    'doors', 'containers_furniture'
  ]
};
```

#### **Enhanced Classification Logic**
```javascript
function classifyEntityByWorldEditor(entity) {
  // 1. Check filename patterns
  const filename = entity.source_file.toLowerCase();
  
  // 2. Check semantic categories
  for (const [category, keywords] of Object.entries(semanticCategories)) {
    for (const keyword of keywords) {
      if (filename.includes(keyword) || 
          entity.name.toLowerCase().includes(keyword)) {
        return {
          category: category,
          subcategory: keyword,
          confidence: 'high'
        };
      }
    }
  }
  
  // 3. Fallback to traditional classification
  return classifyEntityTraditional(entity);
}
```

#### **LINQ-Style Queries (JavaScript)**
```javascript
// WorldEditor-inspired LINQ queries translated to JavaScript
class EntityRepository {
  constructor(entities) {
    this.entities = entities;
  }
  
  // LINQ Where equivalent
  where(predicate) {
    return this.entities.filter(predicate);
  }
  
  // Find all hostile critters
  getHostileCritters() {
    return this.where(e => 
      e.category === 'critters' && 
      (e.flags & 0x1000) // Hostile flag
    );
  }
  
  // Find all usable items
  getUsableItems() {
    return this.where(e => 
      e.category === 'items' && 
      (e.flags & 0x0010) // Usable flag
    );
  }
  
  // Find all containers
  getContainers() {
    return this.where(e => 
      e.script_name && 
      e.script_name.includes('container')
    );
  }
  
  // Cross-reference with scripts
  getScriptedEntities() {
    return this.where(e => 
      e.script_name && 
      scriptDefines.has(e.script_name)
    );
  }
  
  // Complex query: Find all merchant NPCs with inventory
  getMerchantNPCs() {
    return this.where(e => 
      e.category === 'critters' &&
      e.subcategory === 'merchants' &&
      e.script_name &&
      e.script_name.includes('trade')
    );
  }
}
```

---

## 🗄️ **Database Schema Overview**

### **Enhanced Entity Table (Primary)**

```sql
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,
  proto_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  name_source TEXT,  -- 'FOBJ.MSG', 'FOCRIT.MSG', 'DEFINE', 'FILENAME', 'UNKNOWN'
  
  -- Classification
  type INTEGER NOT NULL,
  category TEXT,
  subcategory TEXT,
  
  -- Visual Assets
  pic_map TEXT,
  pic_inv TEXT,
  thumbnail_path TEXT,
  
  -- Properties
  flags INTEGER,
  material INTEGER,
  sound_id INTEGER,
  weight INTEGER,
  volume INTEGER,
  
  -- Script Integration
  script_name TEXT,
  script_func TEXT,
  script_params TEXT,  -- JSON array of parameters
  
  -- Usage Tracking
  map_usage_count INTEGER DEFAULT 0,
  script_usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP,
  
  -- Relationships
  parent_proto_id INTEGER,
  container_proto_id INTEGER,
  door_target_proto_id INTEGER,
  
  -- Metadata
  source_file TEXT,
  parse_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  validated BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (parent_proto_id) REFERENCES entities(proto_id),
  FOREIGN KEY (container_proto_id) REFERENCES entities(proto_id),
  FOREIGN KEY (door_target_proto_id) REFERENCES entities(proto_id)
);
```

### **Supporting Tables**

#### **Entity Types**
```sql
CREATE TABLE entity_types (
  type_id INTEGER PRIMARY KEY,
  type_name TEXT UNIQUE,
  description TEXT,
  color TEXT
);
```

#### **Script Defines**
```sql
CREATE TABLE script_defines (
  define_id INTEGER PRIMARY KEY,
  define_name TEXT UNIQUE,
  define_value INTEGER,
  define_type TEXT,  -- 'PID', 'FLAG', 'CONSTANT', etc.
  source_file TEXT,
  description TEXT
);
```

#### **Entity Relationships**
```sql
CREATE TABLE entity_relationships (
  relationship_id INTEGER PRIMARY KEY,
  from_entity_id INTEGER,
  to_entity_id INTEGER,
  relationship_type TEXT,  -- 'contains', 'opens', 'targets', etc.
  metadata TEXT,  -- JSON for additional data
  
  FOREIGN KEY (from_entity_id) REFERENCES entities(entity_id),
  FOREIGN KEY (to_entity_id) REFERENCES entities(entity_id)
);
```

#### **Usage Tracking**
```sql
CREATE TABLE entity_usage (
  usage_id INTEGER PRIMARY KEY,
  entity_id INTEGER,
  usage_type TEXT,  -- 'map', 'script', 'container', etc.
  usage_context TEXT,  -- map name, script name, etc.
  usage_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
);
```

---

## 🔧 **Implementation Workflow**

### **Phase 1: Database Creation**

#### **1.1 Initialize Database Structure**
```bash
# Create enhanced database schema
node scripts/create-entity-db.cjs
```

**What it does:**
- Creates all tables with proper relationships
- Sets up indexes for performance
- Enables foreign key constraints
- Configures WAL mode for performance

#### **1.2 Populate Reference Data**
```sql
-- Insert entity types
INSERT INTO entity_types (type_id, type_name, description, color) VALUES
(1, 'Item', 'Usable objects', '#4CAF50'),
(2, 'Scenery', 'Environmental objects', '#2196F3'),
(3, 'Critter', 'Living entities', '#FF9800'),
(4, 'Container', 'Storage objects', '#9C27B0'),
(5, 'Door', 'Passage objects', '#795548'),
(6, 'Wall', 'Barrier objects', '#607D8B');
```

### **Phase 2: Entity Parsing**

#### **2.1 Parse Proto Files**
```bash
# Parse all .fopro files from AoP server
node scripts/parse-all-entities.cjs
```

**Parsing Process:**
1. **Read Configuration** from `aop-nightmare.cfg`
2. **Scan Proto Directory** for `.fopro` files
3. **Parse Each File** extracting:
   - ProtoID, Type, Name, Flags
   - Visual assets (PicMap, PicInv)
   - Script references
   - Material properties
4. **Cross-Reference** with script defines
5. **Store in Database** with full metadata

#### **2.2 Script Integration**
```javascript
// Example script parameter extraction
const scriptParams = {
  'PHX_dungeons._InitDungeonLocker': {
    Item_Val0: 5940,  // Loot table ID
    Item_Val1: 0,     // Lock difficulty
    Item_Val2: 100    // Trap difficulty
  }
};
```

### **Phase 3: Data Enhancement**

#### **3.1 Name Resolution**
- **Priority Order**: MSG files → Script defines → Filename → Unknown
- **FOBJ.MSG**: Item and object names/descriptions
- **FOCRIT.MSG**: Critter names
- **Script defines**: PID constants with readable names

#### **3.2 Relationship Detection**
```javascript
// Auto-detect relationships based on patterns
if (entity.script_name === 'PHX_dungeons._InitDungeonLocker') {
  entity.category = 'Container';
  entity.subcategory = 'Locker';
}

if (entity.type === 5 && entity.flags & 0x1000) {  // Door with usable flag
  entity.subcategory = 'Usable Door';
}
```

#### **3.3 Thumbnail Generation**
```javascript
// Generate thumbnails from .fofrm files
const thumbnailPath = generateThumbnail(entity.pic_map);
entity.thumbnail_path = thumbnailPath;
```

---

## 📊 **Advanced Features**

### **Usage Tracking System**

#### **Map Usage Analysis**
```sql
-- Track which entities appear in maps
INSERT INTO entity_usage (entity_id, usage_type, usage_context)
SELECT entity_id, 'map', map_name 
FROM map_entities 
WHERE proto_id = ?;
```

#### **Script Usage Analysis**
```sql
-- Track script references
INSERT INTO entity_usage (entity_id, usage_type, usage_context)
SELECT entity_id, 'script', script_file 
FROM script_references 
WHERE proto_id = ?;
```

### **Validation System**

#### **Data Integrity Checks**
```javascript
function validateEntity(entity) {
  const errors = [];
  
  // Required fields
  if (!entity.proto_id) errors.push('Missing ProtoID');
  if (!entity.name) errors.push('Missing name');
  if (!entity.type) errors.push('Missing type');
  
  // Data consistency
  if (entity.proto_id < 0 || entity.proto_id > 99999) {
    errors.push('Invalid ProtoID range');
  }
  
  // Script validation
  if (entity.script_name && !scriptExists(entity.script_name)) {
    errors.push(`Script not found: ${entity.script_name}`);
  }
  
  return errors;
}
```

#### **Cross-Reference Validation**
```javascript
function validateCrossReferences() {
  const issues = [];
  
  // Check for orphaned relationships
  const orphaned = db.prepare(`
    SELECT e1.proto_id, e1.name, e2.proto_id as target_id
    FROM entities e1
    LEFT JOIN entities e2 ON e1.parent_proto_id = e2.proto_id
    WHERE e1.parent_proto_id IS NOT NULL 
    AND e2.proto_id IS NULL
  `).all();
  
  issues.push(...orphaned.map(row => 
    `Orphaned parent reference: ${row.proto_id} -> ${row.target_id}`
  ));
  
  return issues;
}
```

### **Performance Optimization**

#### **Indexing Strategy**
```sql
-- Performance indexes
CREATE INDEX idx_entities_proto_id ON entities(proto_id);
CREATE INDEX idx_entities_type_category ON entities(type, category);
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_script_defines_value ON script_defines(define_value);
CREATE INDEX idx_usage_entity_date ON entity_usage(entity_id, usage_date);
```

#### **Caching System**
```javascript
class EntityCache {
  constructor(db) {
    this.db = db;
    this.cache = new Map();
    this.maxSize = 1000;
  }
  
  get(protoId) {
    if (this.cache.has(protoId)) {
      return this.cache.get(protoId);
    }
    
    const entity = this.db.prepare(`
      SELECT * FROM entities WHERE proto_id = ?
    `).get(protoId);
    
    if (entity) {
      this.cache.set(protoId, entity);
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }
    
    return entity;
  }
}
```

---

## 🔍 **Query Examples**

### **Basic Entity Lookup**
```sql
-- Find entity by ProtoID
SELECT * FROM entities WHERE proto_id = 666;

-- Find all containers
SELECT * FROM entities WHERE category = 'Container';

-- Search by name
SELECT * FROM entities WHERE name LIKE '%locker%';
```

### **Advanced Queries**
```sql
-- Find all entities used in scripts but not in maps
SELECT e.* FROM entities e
JOIN entity_usage u1 ON e.entity_id = u1.entity_id AND u1.usage_type = 'script'
LEFT JOIN entity_usage u2 ON e.entity_id = u2.entity_id AND u2.usage_type = 'map'
WHERE u2.entity_id IS NULL;

-- Find most used entities
SELECT e.proto_id, e.name, COUNT(u.usage_id) as usage_count
FROM entities e
JOIN entity_usage u ON e.entity_id = u.entity_id
GROUP BY e.entity_id
ORDER BY usage_count DESC
LIMIT 10;
```

### **Relationship Queries**
```sql
-- Find all containers and their contents
SELECT 
  parent.proto_id as container_id,
  parent.name as container_name,
  child.proto_id as content_id,
  child.name as content_name
FROM entities parent
JOIN entity_relationships r ON parent.entity_id = r.from_entity_id
JOIN entities child ON r.to_entity_id = child.entity_id
WHERE r.relationship_type = 'contains';
```

---

## 🛠️ **Maintenance Operations**

### **Database Backup**
```bash
# Create backup
sqlite3 data/entities.db ".backup data/backup/entities_$(date +%Y%m%d_%H%M%S).db"

# Export schema
sqlite3 data/entities.db ".schema > schema.sql"
```

### **Data Validation**
```bash
# Run validation script
python scripts/validate_indexation.py
```

### **Performance Monitoring**
```sql
-- Check database size
SELECT 
  page_count * page_size as size_bytes,
  page_count * page_size / 1024.0 / 1024.0 as size_mb
FROM pragma_page_count(), pragma_page_size();

-- Check index usage
EXPLAIN QUERY PLAN SELECT * FROM entities WHERE proto_id = 666;
```

---

## 📈 **Scaling Considerations**

### **Large Database Performance**
- **Batch Operations**: Use transactions for bulk inserts/updates
- **Connection Pooling**: Reuse database connections
- **Lazy Loading**: Load data only when needed
- **Memory Management**: Clear cache when memory pressure detected

### **Multi-User Support**
- **WAL Mode**: Enables concurrent reads/writes
- **Transaction Isolation**: Prevent data corruption
- **Lock Management**: Minimize lock contention

---

## 🚀 **Integration Points**

### **Mapper Integration**
```javascript
// Entity lookup for spawning controls
function getEntityByProtoId(protoId) {
  const entity = entityCache.get(protoId);
  if (!entity) return null;
  
  return {
    protoId: entity.proto_id,
    name: entity.name,
    category: entity.category,
    thumbnail: entity.thumbnail_path,
    script: entity.script_name,
    params: JSON.parse(entity.script_params || '[]')
  };
}
```

### **Script Integration**
```javascript
// Validate script references
function validateScriptReferences() {
  const issues = [];
  
  entities.forEach(entity => {
    if (entity.script_name) {
      if (!scriptExists(entity.script_name)) {
        issues.push(`Entity ${entity.proto_id}: Script not found - ${entity.script_name}`);
      }
    }
  });
  
  return issues;
}
```

---

## 📝 **Troubleshooting**

### **Common Issues**

#### **Database Locked**
```bash
# Check for open connections
lsof data/entities.db

# Kill hanging processes
kill -9 <PID>
```

#### **Performance Issues**
```sql
-- Check query performance
EXPLAIN QUERY PLAN SELECT * FROM entities WHERE name LIKE '%test%';

-- Analyze table statistics
ANALYZE entities;
```

#### **Data Corruption**
```bash
# Check integrity
sqlite3 data/entities.db "PRAGMA integrity_check;"

# Recover if needed
sqlite3 data/entities.db ".recover" | sqlite3 data/entities_recovered.db
```

---

*This guide covers the complete database system for FOnline: Ashes of Phoenix. For specific implementation details, see the related scripts and configuration files.*
