#!/usr/bin/env node

/**
 * Batch Process All FOnline Entity Files
 * Parses all .fopro files and populates the enhanced entity database
 */

const { EntityParser } = require('../src/database/entityParser.cjs');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Database configuration
const dbPath = path.join(__dirname, '..', 'data', 'entities.db');
const PROTO_DIR = path.join(__dirname, '..', 'source', 'database', 'proto');

console.log('🔍 Starting batch entity parsing...');
console.log(`📁 Proto directory: ${PROTO_DIR}`);
console.log(`🗄️  Database: ${dbPath}`);

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database not found. Run create-entity-db.cjs first.');
  process.exit(1);
}

// Check if proto directory exists
if (!fs.existsSync(PROTO_DIR)) {
  console.error('❌ Proto directory not found:', PROTO_DIR);
  process.exit(1);
}

// Initialize database
const db = new Database(dbPath);
const parser = new EntityParser();

// Statistics tracking
const stats = {
  totalFiles: 0,
  parsedFiles: 0,
  totalEntities: 0,
  insertedEntities: 0,
  errors: [],
  classifications: {
    Critter: 0,
    Item: 0,
    Scenery: 0,
    Functional: 0
  },
  subclasses: {},
  conflicts: 0
};

// Get all .fopro files
console.log('📂 Scanning for .fopro files...');
const protoFiles = glob.sync('**/*.fopro', { cwd: PROTO_DIR });
stats.totalFiles = protoFiles.length;

console.log(`📄 Found ${protoFiles.length} .fopro files`);

if (protoFiles.length === 0) {
  console.log('⚠️  No .fopro files found. Nothing to parse.');
  process.exit(0);
}

// Prepare database statements
const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO entities (
    entity_id, proto_id, name, name_source, primary_class, subclass, traits,
    classification_confidence, conflicts, pic_map, pic_inv, has_art, art_missing,
    properties, flags, is_interactive, is_blocking, is_projectile_block, is_pickable,
    is_stackable, is_container, is_door, is_light_source, is_wall, script_defines,
    script_name, start_script, trig_script, used_in_maps, referenced_in_scripts,
    placement_count, first_appearance_map, last_modified, has_complete_data,
    validation_warnings, is_orphaned, is_phantom, source_file, category, tags,
    description, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateArtStatusStmt = db.prepare(`
  UPDATE entities SET 
    has_art = CASE 
      WHEN pic_map IS NOT NULL OR pic_inv IS NOT NULL THEN 1 
      ELSE 0 
    END,
    art_missing = CASE 
      WHEN (pic_map IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pragma_table_info('entities') WHERE name = 'art_check')) OR
           (pic_inv IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pragma_table_info('entities') WHERE name = 'art_check')) THEN 1 
      ELSE 0 
    END
  WHERE entity_id = ?
`);

// Helper function to extract interaction properties
function extractInteractionProperties(props) {
  return {
    is_interactive: !!(props.IsCanUse === 1 || props.ScriptName || props.TrigScript),
    is_blocking: props.IsNoBlock === 0,
    is_projectile_block: props.IsProjBlock === 0,
    is_pickable: props.IsCanPickUp === 1,
    is_stackable: props.IsStackable === 1,
    is_container: !!(props.Container_Volume || props.IsCanOpen === 1),
    is_door: !!(props.Door_ || props.IsCanOpen === 1),
    is_light_source: !!(props.LightIntensity > 0 || props.LightDistance > 0),
    is_wall: !!(props.Type === 'Wall' || props.IsWall === 1)
  };
}

// Process each file
for (const file of protoFiles) {
  const filePath = path.join(PROTO_DIR, file);
  
  try {
    console.log(`📄 Parsing ${file}...`);
    const entities = parser.parseFoproFile(filePath);
    stats.parsedFiles++;
    
    console.log(`   📦 Found ${entities.length} entities`);
    
    for (const entity of entities) {
      try {
        // Extract interaction properties
        const props = entity.properties;
        const interactionProps = extractInteractionProperties(props);
        
        // Insert entity
        const result = insertStmt.run(
          null, // entity_id
          entity.proto_id || null,
          entity.name && entity.name.name ? entity.name.name : 'Unknown',
          entity.name && entity.name.source ? entity.name.source : 'UNKNOWN',
          entity.classification && entity.classification.primary_class ? entity.classification.primary_class : 'Unknown',
          entity.classification && entity.classification.subclass ? entity.classification.subclass : null,
          entity.classification && entity.classification.traits ? JSON.stringify(entity.classification.traits) : '[]',
          entity.classification && entity.classification.confidence ? entity.classification.confidence : 'low',
          entity.classification && entity.classification.conflicts ? JSON.stringify(entity.classification.conflicts) : '[]',
          props.PicMap || null,
          props.PicInv || null,
          !!(props.PicMap || props.PicInv) ? 1 : 0,
          0, // art_missing
          JSON.stringify(props),
          props.Flags || 0,
          interactionProps.is_interactive ? 1 : 0,
          interactionProps.is_blocking ? 1 : 0,
          interactionProps.is_projectile_block ? 1 : 0,
          interactionProps.is_pickable ? 1 : 0,
          interactionProps.is_stackable ? 1 : 0,
          interactionProps.is_container ? 1 : 0,
          interactionProps.is_door ? 1 : 0,
          interactionProps.is_light_source ? 1 : 0,
          interactionProps.is_wall ? 1 : 0,
          '[]', // script_defines
          props.ScriptName || null,
          props.StartScript || null,
          props.TrigScript || null,
          0, // used_in_maps
          0, // referenced_in_scripts
          0, // placement_count
          null, // first_appearance_map
          new Date().toISOString(), // last_modified
          0, // has_complete_data
          '[]', // validation_warnings
          0, // is_orphaned
          0, // is_phantom
          entity.source_file || null,
          null, // category
          '[]', // tags
          null, // description
          new Date().toISOString(), // created_at
          new Date().toISOString() // updated_at
        );
        
        stats.insertedEntities++;
        
        // Update classification stats
        if (stats.classifications[entity.classification.primary_class] !== undefined) {
          stats.classifications[entity.classification.primary_class]++;
        }
        
        // Track subclasses
        if (entity.classification.subclass) {
          stats.subclasses[entity.classification.subclass] = 
            (stats.subclasses[entity.classification.subclass] || 0) + 1;
        }
        
        // Track conflicts
        if (entity.classification.conflicts.length > 0) {
          stats.conflicts++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error inserting entity ${entity.proto_id}:`, error.message);
        stats.errors.push({
          file: file,
          entity_id: entity.proto_id,
          error: error.message
        });
      }
    }
    
    stats.totalEntities += entities.length;
    
  } catch (error) {
    console.error(`❌ Error parsing ${file}:`, error.message);
    stats.errors.push({
      file: file,
      error: error.message
    });
  }
}

// Update art status for all entities
console.log('🎨 Updating art status...');
const allEntities = db.prepare('SELECT entity_id FROM entities').all();
for (const entity of allEntities) {
  updateArtStatusStmt.run(entity.entity_id);
}

// Generate summary report
console.log('\n📊 Parsing Summary:');
console.log(`   Files: ${stats.parsedFiles}/${stats.totalFiles} processed`);
console.log(`   Entities: ${stats.insertedEntities}/${stats.totalEntities} inserted`);
console.log(`   Errors: ${stats.errors.length}`);

console.log('\n📈 Classification Breakdown:');
for (const [className, count] of Object.entries(stats.classifications)) {
  const percentage = stats.totalEntities > 0 ? ((count / stats.totalEntities) * 100).toFixed(1) : '0.0';
  console.log(`   ${className}: ${count} (${percentage}%)`);
}

console.log('\n📋 Subclass Breakdown:');
for (const [subclass, count] of Object.entries(stats.subclasses)) {
  console.log(`   ${subclass}: ${count}`);
}

if (stats.conflicts > 0) {
  console.log(`\n⚠️  Classification conflicts: ${stats.conflicts}`);
}

if (stats.errors.length > 0) {
  console.log('\n❌ Errors:');
  stats.errors.forEach(error => {
    console.log(`   ${error.file}: ${error.error}`);
  });
}

// Database statistics
const dbStats = {
  totalEntities: db.prepare('SELECT COUNT(*) FROM entities').get()['COUNT(*)'],
  withArt: db.prepare('SELECT COUNT(*) FROM entities WHERE has_art = 1').get()['COUNT(*)'],
  interactive: db.prepare('SELECT COUNT(*) FROM entities WHERE is_interactive = 1').get()['COUNT(*)'],
  blocking: db.prepare('SELECT COUNT(*) FROM entities WHERE is_blocking = 1').get()['COUNT(*)'],
  confidenceHigh: db.prepare('SELECT COUNT(*) FROM entities WHERE classification_confidence = \'high\'').get()['COUNT(*)'],
  confidenceMedium: db.prepare('SELECT COUNT(*) FROM entities WHERE classification_confidence = \'medium\'').get()['COUNT(*)'],
  confidenceLow: db.prepare('SELECT COUNT(*) FROM entities WHERE classification_confidence = \'low\'').get()['COUNT(*)']
};

console.log('\n🗄️  Database Statistics:');
console.log(`   Total entities: ${dbStats.totalEntities}`);
console.log(`   With art assets: ${dbStats.withArt}`);
console.log(`   Interactive: ${dbStats.interactive}`);
console.log(`   Blocking: ${dbStats.blocking}`);
console.log(`   High confidence: ${dbStats.confidenceHigh}`);
console.log(`   Medium confidence: ${dbStats.confidenceMedium}`);
console.log(`   Low confidence: ${dbStats.confidenceLow}`);

// Validate database integrity
try {
  const integrity = db.prepare('PRAGMA integrity_check').get();
  if (integrity.integrity_check === 'ok') {
    console.log('\n✅ Database integrity check passed');
  } else {
    console.warn('\n⚠️  Database integrity check:', integrity.integrity_check);
  }
} catch (error) {
  console.error('\n❌ Error checking database integrity:', error.message);
}

// Close database
db.close();

// Final status
if (stats.errors.length === 0) {
  console.log('\n🎉 Entity parsing completed successfully!');
  console.log('🚀 Ready for Phase 3: Script Integration');
} else {
  console.log('\n⚠️  Entity parsing completed with errors.');
  console.log('🔧 Review errors before proceeding to Phase 3.');
}

console.log(`📍 Database: ${dbPath}`);
