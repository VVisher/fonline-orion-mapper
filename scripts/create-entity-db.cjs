#!/usr/bin/env node

/**
 * Create Enhanced FOnline Entity Database
 * Implements the comprehensive schema from entity-database-enhanced.md
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Database file path
const dbPath = path.join(dataDir, 'entities.db');

console.log('🗄️  Creating enhanced FOnline entity database...');
console.log(`📍 Database path: ${dbPath}`);

// Create database
const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

console.log('✅ Database initialized with optimizations');

// Create tables
const tables = [
  // Primary Entity Table
  `CREATE TABLE IF NOT EXISTS entities (
    entity_id INTEGER PRIMARY KEY,
    proto_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    name_source TEXT DEFAULT 'UNKNOWN',
    
    -- Classification
    primary_class TEXT NOT NULL,
    subclass TEXT,
    traits TEXT DEFAULT '[]',
    classification_confidence TEXT DEFAULT 'low',
    conflicts TEXT DEFAULT '[]',
    
    -- Visual Properties
    pic_map TEXT,
    pic_inv TEXT,
    has_art BOOLEAN DEFAULT FALSE,
    art_missing BOOLEAN DEFAULT FALSE,
    
    -- Core Properties (JSON for flexibility)
    properties TEXT DEFAULT '{}',
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
    script_defines TEXT DEFAULT '[]',
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
    validation_warnings TEXT DEFAULT '[]',
    is_orphaned BOOLEAN DEFAULT FALSE,
    is_phantom BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    source_file TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Script Defines Table
  `CREATE TABLE IF NOT EXISTS script_defines (
    define_id INTEGER PRIMARY KEY AUTOINCREMENT,
    define_name TEXT NOT NULL UNIQUE,
    define_value INTEGER NOT NULL,
    entity_id INTEGER,
    script_file TEXT,
    line_number INTEGER,
    context TEXT,
    define_type TEXT DEFAULT 'OTHER',
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE SET NULL
  )`,

  // Entity Relationships Table
  `CREATE TABLE IF NOT EXISTS entity_relationships (
    relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_entity_id INTEGER NOT NULL,
    target_entity_id INTEGER NOT NULL,
    relationship_type TEXT NOT NULL,
    relationship_data TEXT DEFAULT '{}',
    confidence TEXT DEFAULT 'medium',
    FOREIGN KEY (source_entity_id) REFERENCES entities(entity_id),
    FOREIGN KEY (target_entity_id) REFERENCES entities(entity_id)
  )`,

  // Map Usage Table
  `CREATE TABLE IF NOT EXISTS map_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    map_file TEXT NOT NULL,
    placement_count INTEGER DEFAULT 1,
    first_x INTEGER,
    first_y INTEGER,
    contexts TEXT DEFAULT '[]',
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
  )`,

  // Script Usage Table
  `CREATE TABLE IF NOT EXISTS script_usage (
    usage_id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id INTEGER NOT NULL,
    script_file TEXT NOT NULL,
    line_number INTEGER,
    function_name TEXT,
    context TEXT,
    usage_type TEXT DEFAULT 'direct_reference',
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id)
  )`,

  // Entity Types Reference Table
  `CREATE TABLE IF NOT EXISTS entity_types (
    type_id INTEGER PRIMARY KEY,
    type_name TEXT NOT NULL UNIQUE,
    type_category TEXT NOT NULL,
    description TEXT,
    detection_rules TEXT DEFAULT '[]',
    ui_behavior TEXT,
    is_custom BOOLEAN DEFAULT FALSE
  )`
];

// Create all tables
tables.forEach((sql, index) => {
  try {
    db.exec(sql);
    console.log(`✅ Table ${index + 1}/${tables.length} created`);
  } catch (error) {
    console.error(`❌ Error creating table ${index + 1}:`, error.message);
    process.exit(1);
  }
});

console.log('📋 All tables created successfully');

// Create indexes
const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_entities_proto_id ON entities(proto_id)',
  'CREATE INDEX IF NOT EXISTS idx_entities_primary_class ON entities(primary_class)',
  'CREATE INDEX IF NOT EXISTS idx_entities_subclass ON entities(subclass)',
  'CREATE INDEX IF NOT EXISTS idx_entities_name ON entities(name)',
  'CREATE INDEX IF NOT EXISTS idx_entities_used_in_maps ON entities(used_in_maps)',
  'CREATE INDEX IF NOT EXISTS idx_entities_is_interactive ON entities(is_interactive)',
  'CREATE INDEX IF NOT EXISTS idx_entities_is_blocking ON entities(is_blocking)',
  'CREATE INDEX IF NOT EXISTS idx_entities_classification_confidence ON entities(classification_confidence)',
  'CREATE INDEX IF NOT EXISTS idx_entities_is_orphaned ON entities(is_orphaned)',
  'CREATE INDEX IF NOT EXISTS idx_script_defines_value ON script_defines(define_value)',
  'CREATE INDEX IF NOT EXISTS idx_script_defines_name ON script_defines(define_name)',
  'CREATE INDEX IF NOT EXISTS idx_script_defines_entity_id ON script_defines(entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_entity_relationships_type ON entity_relationships(relationship_type)',
  'CREATE INDEX IF NOT EXISTS idx_map_usage_entity_id ON map_usage(entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_map_usage_map_file ON map_usage(map_file)',
  'CREATE INDEX IF NOT EXISTS idx_script_usage_entity_id ON script_usage(entity_id)',
  'CREATE INDEX IF NOT EXISTS idx_script_usage_script_file ON script_usage(script_file)',
  'CREATE INDEX IF NOT EXISTS idx_script_usage_usage_type ON script_usage(usage_type)'
];

// Create all indexes
indexes.forEach((sql, index) => {
  try {
    db.exec(sql);
    console.log(`🔑 Index ${index + 1}/${indexes.length} created`);
  } catch (error) {
    console.error(`❌ Error creating index ${index + 1}:`, error.message);
  }
});

console.log('🔑 All indexes created successfully');

// Insert standard entity types
const entityTypes = [
  // Primary Classes
  [1, 'Critter', 'primary', 'Living entities with AI and stats', '["ST_HP", "AiGroup", "BaseType"]', 'enable_ai_editor', 0],
  [2, 'Item', 'primary', 'Interactable objects with weight/cost', '["Weight > 0", "Cost > 0", "IsCanPickUp = 1"]', 'enable_inventory_preview', 0],
  [3, 'Scenery', 'primary', 'Static world objects', '["PicMap", "!Item", "!Critter"]', 'low_priority_selection', 0],
  [4, 'Functional', 'primary', 'Utility/Invisible objects', '["LightIntensity > 0", "Type = Wall", "!PicMap"]', 'show_proxy_icon', 0],

  // Subclasses
  [10, 'Weapon', 'subclass', 'Items that deal damage', '["DamageType", "DamageMin", "Weapon_"]', 'show_damage_stats', 0],
  [11, 'Armor', 'subclass', 'Protective equipment', '["ArmorClass", "DT_", "DR_"]', 'show_protection_stats', 0],
  [12, 'Consumable', 'subclass', 'Items that are used up', '["Deterioration", "FoodPoints", "DrugEffect"]', 'show_duration_effect', 0],
  [13, 'Container', 'subclass', 'Storage objects', '["Container_Volume", "IsCanOpen = 1"]', 'enable_content_editor', 0],
  [14, 'Door', 'subclass', 'Multi-state objects', '["Door_", "IsCanOpen = 1"]', 'track_state_transitions', 0],
  [15, 'LightSource', 'subclass', 'Objects that emit light', '["LightIntensity > 0", "LightDistance > 0"]', 'show_radius_gizmo', 0],
  [16, 'Blocker', 'subclass', 'Collision objects', '["IsNoBlock = 0", "IsProjBlock = 0"]', 'highlight_collision_hex', 0],

  // Traits
  [20, 'Portable', 'trait', 'Can be carried', '["IsCanPickUp = 1", "Weight > 0"]', 'show_weight_info', 0],
  [21, 'Interactive', 'trait', 'Can be used/activated', '["IsCanUse = 1", "ScriptName"]', 'show_interaction_hint', 0],
  [22, 'Stackable', 'trait', 'Can be stacked', '["IsStackable = 1", "AmmoType"]', 'show_stack_count', 0],
  [23, 'Logical', 'trait', 'Invisible but functional', '["!PicMap", "script_reference"]', 'show_as_trigger_zone', 0]
];

// Insert entity types
const typeStmt = db.prepare(`
  INSERT OR REPLACE INTO entity_types (
    type_id, type_name, type_category, description, detection_rules, ui_behavior, is_custom
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

entityTypes.forEach((type, index) => {
  try {
    typeStmt.run(...type);
    console.log(`📝 Entity type ${index + 1}/${entityTypes.length} inserted: ${type[1]}`);
  } catch (error) {
    console.error(`❌ Error inserting entity type ${type[1]}:`, error.message);
  }
});

console.log('📝 All entity types inserted successfully');

// Create materialized view for entity browser
try {
  db.exec(`
    CREATE VIEW IF NOT EXISTS entity_browser_view AS
    SELECT 
      entity_id, proto_id, name, primary_class, subclass,
      pic_map, pic_inv, traits, tags,
      used_in_maps, referenced_in_scripts,
      classification_confidence, is_orphaned, is_phantom
    FROM entities 
    WHERE is_orphaned = FALSE
    ORDER BY primary_class, name
  `);
  console.log('👁️  Entity browser view created');
} catch (error) {
  console.error('❌ Error creating browser view:', error.message);
}

// Create triggers for automatic timestamp updates
const triggers = [
  `CREATE TRIGGER IF NOT EXISTS update_entities_timestamp 
   AFTER UPDATE ON entities
   BEGIN
     UPDATE entities SET updated_at = CURRENT_TIMESTAMP WHERE entity_id = NEW.entity_id;
   END`,

  `CREATE TRIGGER IF NOT EXISTS update_usage_counts
   AFTER INSERT ON map_usage
   BEGIN
     UPDATE entities SET 
       used_in_maps = used_in_maps + 1,
       placement_count = placement_count + NEW.placement_count,
       first_appearance_map = COALESCE(first_appearance_map, NEW.map_file)
     WHERE entity_id = NEW.entity_id;
   END`,

  `CREATE TRIGGER IF NOT EXISTS update_script_usage
   AFTER INSERT ON script_usage
   BEGIN
     UPDATE entities SET 
       referenced_in_scripts = referenced_in_scripts + 1
     WHERE entity_id = NEW.entity_id;
   END`
];

triggers.forEach((sql, index) => {
  try {
    db.exec(sql);
    console.log(`⚡ Trigger ${index + 1}/${triggers.length} created`);
  } catch (error) {
    console.error(`❌ Error creating trigger ${index + 1}:`, error.message);
  }
});

console.log('⚡ All triggers created successfully');

// Get database stats
const stats = {
  tables: db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get().count,
  indexes: db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'").get().count,
  entityTypes: db.prepare("SELECT COUNT(*) as count FROM entity_types").get().count
};

console.log('\n📊 Database Statistics:');
console.log(`   Tables: ${stats.tables}`);
console.log(`   Indexes: ${stats.indexes}`);
console.log(`   Entity Types: ${stats.entityTypes}`);
console.log(`   Database Size: ${Math.round(fs.statSync(dbPath).size / 1024)} KB`);

// Verify database integrity
try {
  const integrity = db.prepare('PRAGMA integrity_check').get();
  if (integrity.integrity_check === 'ok') {
    console.log('✅ Database integrity check passed');
  } else {
    console.warn('⚠️  Database integrity check:', integrity.integrity_check);
  }
} catch (error) {
  console.error('❌ Error checking database integrity:', error.message);
}

// Close database
db.close();

console.log('\n🎉 Enhanced FOnline entity database created successfully!');
console.log('📍 Location:', dbPath);
console.log('🚀 Ready for Phase 2: Entity Parsing');
