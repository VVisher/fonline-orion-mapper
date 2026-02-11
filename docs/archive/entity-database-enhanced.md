# Enhanced FOnline Entity Database Schema

**Reference**: STATUS.md Phase 3.2 - Comprehensive Entity Database  
**Created**: 2026-02-11  
**Purpose**: Define enhanced database structure for complete FOnline entity ecosystem

---

## 🗄️ **Enhanced Database Schema**

### **Primary Entity Table**

```sql
CREATE TABLE entities (
  entity_id INTEGER PRIMARY KEY,
  proto_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  name_source TEXT,  -- 'FOBJ.MSG', 'FOCRIT.MSG', 'DEFINE', 'FILENAME', 'UNKNOWN'
  
  -- Classification
  primary_class TEXT NOT NULL,  -- 'Critter', 'Item', 'Scenery', 'Functional'
  subclass TEXT,  -- 'Weapon', 'Armor', 'Container', 'Door', 'LightSource', etc.
  traits TEXT,  -- JSON array: ['LightSource', 'Portable', 'Blocker']
  classification_confidence TEXT,  -- 'high', 'medium', 'low'
  conflicts TEXT,  -- JSON array of classification conflicts
  
  -- Visual Properties
  pic_map TEXT,
  pic_inv TEXT,
  has_art BOOLEAN DEFAULT FALSE,
  art_missing BOOLEAN DEFAULT FALSE,
  
  -- Core Properties (JSON for flexibility)
  properties TEXT,  -- JSON object with all proto properties
  flags INTEGER DEFAULT 0,
  
  -- Interaction Properties
  is_interactive BOOLEAN DEFAULT FALSE,
  is_blocking BOOLEAN DEFAULT FALSE,
  is_projectile_block BOOLEAN DEFAULT FALSE,
  is_pickable BOOLEAN DEFAULT FALSE,
  is_stackable BOOLEAN DEFAULT FALSE,
  is_container BOOLEAN DEFAULT FALSE,
  is_door BOOLEAN DEFAULT FALSE,
  is_light_source BOOLEAN DEFAULT FALSE,
  is_wall BOOLEAN DEFAULT FALSE,
  
  -- Script Integration
  script_defines TEXT,  -- JSON array of script constants
  script_name TEXT,
  start_script TEXT,
  trig_script TEXT,
  
  -- Usage Tracking
  used_in_maps INTEGER DEFAULT 0,
  referenced_in_scripts INTEGER DEFAULT 0,
  placement_count INTEGER DEFAULT 0,
  first_appearance_map TEXT,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Validation
  has_complete_data BOOLEAN DEFAULT FALSE,
  validation_warnings TEXT,  -- JSON array
  is_orphaned BOOLEAN DEFAULT FALSE,
  is_phantom BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  source_file TEXT,
  category TEXT,
  tags TEXT,  -- JSON array
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced Indexes
CREATE INDEX idx_entities_proto_id ON entities(proto_id);
CREATE INDEX idx_entities_primary_class ON entities(primary_class);
CREATE INDEX idx_entities_subclass ON entities(subclass);
CREATE INDEX idx_entities_name ON entities(name);
CREATE INDEX idx_entities_used_in_maps ON entities(used_in_maps);
CREATE INDEX idx_entities_is_interactive ON entities(is_interactive);
CREATE INDEX idx_entities_is_blocking ON entities(is_blocking);
CREATE INDEX idx_entities_classification_confidence ON entities(classification_confidence);
CREATE INDEX idx_entities_is_orphaned ON entities(is_orphaned);
```

### **Script Defines Table**

```sql
CREATE TABLE script_defines (
  define_id INTEGER PRIMARY KEY AUTOINCREMENT,
  define_name TEXT NOT NULL UNIQUE,
  define_value INTEGER NOT NULL,
  entity_id INTEGER,
  script_file TEXT,
  line_number INTEGER,
  context TEXT,  -- Surrounding code context
  define_type TEXT,  -- 'PID', 'OTHER', 'CUSTOM'
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE SET NULL
);

CREATE INDEX idx_script_defines_value ON script_defines(define_value);
CREATE INDEX idx_script_defines_name ON script_defines(define_name);
CREATE INDEX idx_script_defines_entity_id ON script_defines(entity_id);
```

### **Entity Relationships Table**

```sql
CREATE TABLE entity_relationships (
  relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_entity_id INTEGER NOT NULL,
  target_entity_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,  -- 'door_state', 'container_content', 'spawn_relation', etc.
  relationship_data TEXT,  -- JSON object with relationship-specific data
  confidence TEXT DEFAULT 'medium',
  FOREIGN KEY (source_entity_id) REFERENCES entities(entity_id),
  FOREIGN KEY (target_entity_id) REFERENCES entities(entity_id)
);

CREATE INDEX idx_entity_relationships_source ON entity_relationships(source_entity_id);
CREATE INDEX idx_entity_relationships_target ON entity_relationships(target_entity_id);
CREATE INDEX idx_entity_relationships_type ON entity_relationships(relationship_type);
```

### **Map Usage Table**

```sql
CREATE TABLE map_usage (
  usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id INTEGER NOT NULL,
  map_file TEXT NOT NULL,
  placement_count INTEGER DEFAULT 1,
  first_x INTEGER,
  first_y INTEGER,
  contexts TEXT,  -- JSON array of placement contexts
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
);

CREATE INDEX idx_map_usage_entity_id ON map_usage(entity_id);
CREATE INDEX idx_map_usage_map_file ON map_usage(map_file);
```

### **Script Usage Table**

```sql
CREATE TABLE script_usage (
  usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id INTEGER NOT NULL,
  script_file TEXT NOT NULL,
  line_number INTEGER,
  function_name TEXT,
  context TEXT,  -- Code context
  usage_type TEXT,  -- 'direct_reference', 'spawn', 'container_fill', 'comparison', etc.
  FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
);

CREATE INDEX idx_script_usage_entity_id ON script_usage(entity_id);
CREATE INDEX idx_script_usage_script_file ON script_usage(script_file);
CREATE INDEX idx_script_usage_usage_type ON script_usage(usage_type);
```

### **Entity Types Reference Table**

```sql
CREATE TABLE entity_types (
  type_id INTEGER PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  type_category TEXT NOT NULL,  -- 'primary', 'subclass', 'trait'
  description TEXT,
  detection_rules TEXT,  -- JSON array of detection rules
  ui_behavior TEXT,  -- UI-specific behavior
  is_custom BOOLEAN DEFAULT FALSE
);

-- Insert standard types
INSERT INTO entity_types (type_id, type_name, type_category, description, detection_rules) VALUES
-- Primary Classes
(1, 'Critter', 'primary', 'Living entities with AI and stats', '["ST_HP", "AiGroup", "BaseType"]'),
(2, 'Item', 'primary', 'Interactable objects with weight/cost', '["Weight > 0", "Cost > 0", "IsCanPickUp = 1"]'),
(3, 'Scenery', 'primary', 'Static world objects', '["PicMap", "!Item", "!Critter"]'),
(4, 'Functional', 'primary', 'Utility/Invisible objects', '["LightIntensity > 0", "Type = Wall", "!PicMap"]'),

-- Subclasses
(10, 'Weapon', 'subclass', 'Items that deal damage', '["DamageType", "DamageMin", "Weapon_"]'),
(11, 'Armor', 'subclass', 'Protective equipment', '["ArmorClass", "DT_", "DR_"]'),
(12, 'Consumable', 'subclass', 'Items that are used up', '["Deterioration", "FoodPoints", "DrugEffect"]'),
(13, 'Container', 'subclass', 'Storage objects', '["Container_Volume", "IsCanOpen = 1"]'),
(14, 'Door', 'subclass', 'Multi-state objects', '["Door_", "IsCanOpen = 1"]'),
(15, 'LightSource', 'subclass', 'Objects that emit light', '["LightIntensity > 0", "LightDistance > 0"]'),
(16, 'Blocker', 'subclass', 'Collision objects', '["IsNoBlock = 0", "IsProjBlock = 0"]'),

-- Traits
(20, 'Portable', 'trait', 'Can be carried', '["IsCanPickUp = 1", "Weight > 0"]'),
(21, 'Interactive', 'trait', 'Can be used/activated', '["IsCanUse = 1", "ScriptName"]'),
(22, 'Stackable', 'trait', 'Can be stacked', '["IsStackable = 1", "AmmoType"]'),
(23, 'Logical', 'trait', 'Invisible but functional', '["!PicMap", "script_reference"]');
```

---

## 🔍 **Advanced Query Patterns**

### **Entity Discovery Queries**

```sql
-- Get all entities with classification conflicts
SELECT * FROM entities 
WHERE conflicts IS NOT NULL 
AND json_array_length(conflicts) > 0
ORDER BY classification_confidence DESC;

-- Find orphaned entities (defined but never used)
SELECT * FROM entities 
WHERE is_orphaned = TRUE 
AND used_in_maps = 0 
AND referenced_in_scripts = 0;

-- Find phantom entities (used but not defined)
SELECT define_value, define_name, script_file, line_number
FROM script_defines sd
LEFT JOIN entities e ON sd.entity_id = e.entity_id
WHERE e.entity_id IS NULL;

-- Get entities by trait combination
SELECT * FROM entities 
WHERE json_extract(traits, '$') LIKE '%LightSource%' 
AND json_extract(traits, '$') LIKE '%Portable%';
```

### **Relationship Queries**

```sql
-- Get door state relationships
SELECT 
  e1.name as closed_door,
  e2.name as open_door,
  er.relationship_data
FROM entity_relationships er
JOIN entities e1 ON er.source_entity_id = e1.entity_id
JOIN entities e2 ON er.target_entity_id = e2.entity_id
WHERE er.relationship_type = 'door_state';

-- Get container typical contents
SELECT 
  e.name as container,
  json_extract(er.relationship_data, '$.typical_contents') as contents
FROM entity_relationships er
JOIN entities e ON er.source_entity_id = e.entity_id
WHERE er.relationship_type = 'container_content';
```

### **Usage Analysis Queries**

```sql
-- Most used entities in maps
SELECT 
  name,
  used_in_maps,
  placement_count,
  first_appearance_map
FROM entities 
WHERE used_in_maps > 0
ORDER BY used_in_maps DESC, placement_count DESC
LIMIT 20;

-- Entities with heavy script usage
SELECT 
  name,
  referenced_in_scripts,
  json_group_array(script_file) as scripts
FROM entities e
JOIN script_usage su ON e.entity_id = su.entity_id
WHERE referenced_in_scripts > 5
GROUP BY e.entity_id
ORDER BY referenced_in_scripts DESC;

-- Entities by classification confidence
SELECT 
  primary_class,
  subclass,
  classification_confidence,
  COUNT(*) as count
FROM entities 
GROUP BY primary_class, subclass, classification_confidence
ORDER BY count DESC;
```

---

## 📊 **Performance Optimization**

### **Caching Strategy**

```sql
-- Create materialized views for complex queries
CREATE VIEW entity_summary AS
SELECT 
  entity_id,
  proto_id,
  name,
  primary_class,
  subclass,
  json_array_length(traits) as trait_count,
  used_in_maps,
  referenced_in_scripts,
  is_orphaned,
  is_phantom,
  classification_confidence
FROM entities;

-- Index for JSON searches
CREATE INDEX idx_entities_traits_gin ON entities USING gin(traits);
CREATE INDEX idx_entities_properties_gin ON entities USING gin(properties);
```

### **Query Optimization**

```sql
-- Use CTEs for complex analyses
WITH entity_usage AS (
  SELECT 
    entity_id,
    COUNT(DISTINCT map_file) as map_count,
    SUM(placement_count) as total_placements,
    COUNT(DISTINCT script_file) as script_count
  FROM map_usage
  GROUP BY entity_id
)
SELECT 
  e.name,
  e.primary_class,
  eu.map_count,
  eu.total_placements,
  eu.script_count
FROM entities e
JOIN entity_usage eu ON e.entity_id = eu.entity_id
WHERE eu.map_count > 0
ORDER BY eu.total_placements DESC;
```

---

## 🚀 **Implementation Notes**

### **Data Migration Strategy**

1. **Phase 1**: Create enhanced schema
2. **Phase 2**: Migrate existing proto data
3. **Phase 3**: Add script defines cross-referencing
4. **Phase 4**: Add map usage analysis
5. **Phase 5**: Add relationship mapping
6. **Phase 6**: Add validation and diagnostics

### **Validation Rules**

```sql
-- Entity completeness validation
UPDATE entities SET has_complete_data = TRUE 
WHERE name IS NOT NULL 
AND has_art = TRUE 
AND json_array_length(script_defines) > 0
AND classification_confidence = 'high';

-- Orphaned entity detection
UPDATE entities SET is_orphaned = TRUE 
WHERE used_in_maps = 0 
AND referenced_in_scripts = 0
AND primary_class != 'Functional';
```

---

## 📈 **Acceptance Criteria**

✅ **Enhanced Schema**: All tables and relationships created  
✅ **Script Integration**: Complete script defines cross-referencing  
✅ **Usage Tracking**: Map and script usage analysis  
✅ **Relationship Mapping**: Entity relationships documented  
✅ **Performance**: <50ms for common queries  
✅ **Validation**: Comprehensive validation system  
✅ **Scalability**: Handles 10,000+ entities  

---

**Status**: 🔄 **DESIGN ENHANCED**  
**Ready for Implementation**: Phase 3.2.1 - Enhanced Entity Database Builder
