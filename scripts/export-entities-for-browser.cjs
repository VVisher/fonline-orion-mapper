/**
 * Export entities from SQLite database to JSON for browser use
 * Converts the entities.db to a browser-compatible JSON format
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class EntityExporter {
  constructor() {
    this.db = null;
  }

  /**
   * Export entities from SQLite to JSON
   */
  async exportEntities() {
    try {
      const dbPath = path.join(__dirname, '../data/entities.db');
      const outputPath = path.join(__dirname, '../public/data/entities-export.json');
      
      if (!fs.existsSync(dbPath)) {
        throw new Error(`Database file not found: ${dbPath}`);
      }
      
      console.log('📄 Opening SQLite database...');
      this.db = new Database(dbPath, { readonly: true });
      
      // Query all entities
      console.log('📊 Querying entities...');
      const stmt = this.db.prepare(`
        SELECT 
          proto_id,
          name,
          description,
          category,
          source_file,
          properties,
          primary_class,
          subclass,
          classification_confidence,
          validation_warnings,
          pic_map,
          pic_inv,
          has_art,
          script_name,
          tags,
          traits
        FROM entities
        ORDER BY proto_id
      `);
      
      const rows = stmt.all();
      console.log(`📦 Found ${rows.length} entities`);
      
      // Convert to expected format
      const entities = rows.map(row => {
        // Get the actual PID from properties if proto_id is null
        const actualProtoId = row.proto_id || (JSON.parse(row.properties || '{}')).Pid;
        
        return {
          proto_id: actualProtoId,
          name: { 
            name: row.name || 'Unknown Entity', 
            source: 'database' 
          },
          properties: JSON.parse(row.properties || '{}'),
          classification: { 
            primary_class: row.primary_class || 'Unknown',
            subclass: row.subclass || 'Unknown',
            confidence: row.classification_confidence || 'low'
          },
          worldEditorCategory: { 
            category: row.category || 'unknown', 
            confidence: row.classification_confidence === 'high' ? 0.9 : 
                     row.classification_confidence === 'medium' ? 0.7 : 0.5
          },
          source_file: row.source_file || 'unknown',
          validation_issues: JSON.parse(row.validation_warnings || '[]'),
          art_assets: {
            pic_map: row.pic_map,
            pic_inv: row.pic_inv,
            has_art: row.has_art
          },
          script_info: {
            script_name: row.script_name,
            tags: JSON.parse(row.tags || '[]'),
            traits: JSON.parse(row.traits || '[]')
          }
        };
      }).filter(entity => entity.proto_id != null); // Filter out null proto_ids
      
      // Remove duplicates by proto_id
      const uniqueEntities = [];
      const seenProtoIds = new Set();
      
      for (const entity of entities) {
        if (!seenProtoIds.has(entity.proto_id)) {
          seenProtoIds.add(entity.proto_id);
          uniqueEntities.push(entity);
        }
      }
      
      console.log(`📦 Removed ${entities.length - uniqueEntities.length} duplicate entities`);
      console.log(`📦 Final unique entities: ${uniqueEntities.length}`);

      // Create export data
      const exportData = {
        metadata: {
          total: uniqueEntities.length,
          duplicatesRemoved: entities.length - uniqueEntities.length,
          exportTime: new Date().toISOString(),
          source: 'FOnline: Ashes of Phoenix Server',
          database: 'entities.db'
        },
        entities: uniqueEntities
      };

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write to file
      fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
      
      console.log(`✅ Exported ${uniqueEntities.length} entities to: ${outputPath}`);
      
      // Statistics
      const stats = {
        total: uniqueEntities.length,
        items: uniqueEntities.filter(e => e.classification?.primary_class === 'Item').length,
        scenery: uniqueEntities.filter(e => e.classification?.primary_class === 'Scenery').length,
        critters: uniqueEntities.filter(e => e.classification?.primary_class === 'Critter').length,
        functional: uniqueEntities.filter(e => e.classification?.primary_class === 'Functional').length
      };
      
      console.log('📊 Export Statistics:');
      console.log(`   Total: ${stats.total}`);
      console.log(`   Items: ${stats.items}`);
      console.log(`   Scenery: ${stats.scenery}`);
      console.log(`   Critters: ${stats.critters}`);
      console.log(`   Functional: ${stats.functional}`);
      
      // Also copy to data directory for development
      const devOutputPath = path.join(__dirname, '../data/entities-export.json');
      fs.writeFileSync(devOutputPath, JSON.stringify(exportData, null, 2));
      console.log(`📄 Also copied to: ${devOutputPath}`);
      
      return { success: true, stats, entities };
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting entity export for browser...');
  
  const exporter = new EntityExporter();
  const result = await exporter.exportEntities();
  
  if (result.success) {
    console.log('\n✅ Entity export completed successfully!');
    console.log(`📊 Exported ${result.stats.total} entities for browser use`);
    console.log('🌐 Ready for Entity Reactor!');
  } else {
    console.log('\n❌ Entity export failed');
    console.log(`Error: ${result.error}`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = EntityExporter;
