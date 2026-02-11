/**
 * Integrate MSG file strings with entities
 * Connects entity names and descriptions from MSG files to the entities
 */

const fs = require('fs');
const path = require('path');

class MsgStringIntegrator {
  constructor() {
    this.stringMappings = new Map();
    this.entities = [];
  }

  /**
   * Load MSG string mappings and integrate with entities
   */
  async integrateStrings() {
    try {
      console.log('🔤 Starting MSG string integration...');
      
      // Load string mappings
      await this.loadStringMappings();
      
      // Load entities
      await this.loadEntities();
      
      // Integrate strings
      const integratedEntities = this.integrateStringsWithEntities();
      
      // Export integrated entities
      await this.exportIntegratedEntities(integratedEntities);
      
      console.log('✅ MSG string integration completed!');
      return integratedEntities;
      
    } catch (error) {
      console.error('❌ MSG string integration failed:', error.message);
      return [];
    }
  }

  /**
   * Load MSG string mappings
   */
  async loadStringMappings() {
    try {
      // Use the CORRECTED string mappings
      const mappingsPath = path.join(__dirname, '../data/string-mappings-corrected.json');
      
      if (!fs.existsSync(mappingsPath)) {
        console.log('⚠️  Corrected string mappings not found, falling back to original');
        // Fallback to original
        const originalPath = path.join(__dirname, '../data/string-mappings.json');
        if (!fs.existsSync(originalPath)) {
          console.log('⚠️  String mappings not found, skipping integration');
          return;
        }
        const data = fs.readFileSync(originalPath, 'utf8');
        const mappings = JSON.parse(data);
        
        if (mappings.mappings) {
          for (const [key, mapping] of Object.entries(mappings.mappings)) {
            if (mapping.source === 'FOOBJ.MSG') {
              this.stringMappings.set(parseInt(key), mapping);
            }
          }
        }
        console.log(`📝 Loaded ${this.stringMappings.size} FOOBJ.MSG strings (original)`);
        return;
      }
      
      const data = fs.readFileSync(mappingsPath, 'utf8');
      const mappings = JSON.parse(data);
      
      // Convert to Map for faster lookup - ONLY FOOBJ.MSG strings
      if (mappings.mappings) {
        for (const [key, mapping] of Object.entries(mappings.mappings)) {
          // Only include FOOBJ.MSG strings
          if (mapping.source === 'FOOBJ.MSG') {
            this.stringMappings.set(parseInt(key), mapping);
          }
        }
      }
      
      console.log(`📝 Loaded ${this.stringMappings.size} FOOBJ.MSG strings (CORRECTED)`);
      
    } catch (error) {
      console.error('❌ Error loading string mappings:', error.message);
    }
  }

  /**
   * Load entities from export file
   */
  async loadEntities() {
    try {
      const entitiesPath = path.join(__dirname, '../data/entities-export.json');
      
      if (!fs.existsSync(entitiesPath)) {
        throw new Error(`Entities export file not found: ${entitiesPath}`);
      }
      
      const data = fs.readFileSync(entitiesPath, 'utf8');
      const exportData = JSON.parse(data);
      
      this.entities = exportData.entities || [];
      console.log(`📦 Loaded ${this.entities.length} entities`);
      
    } catch (error) {
      console.error('❌ Error loading entities:', error.message);
      this.entities = [];
    }
  }

  /**
   * Integrate MSG strings with entities
   */
  integrateStringsWithEntities() {
    console.log('🔗 Integrating FOOBJ.MSG strings with entities...');
    
    const integratedEntities = this.entities.map(entity => {
      const integratedEntity = { ...entity };
      
      // Calculate FOOBJ.MSG string indices: PID * 100 for name, PID * 100 + 1 for description
      const nameKey = entity.proto_id * 100;
      const descKey = entity.proto_id * 100 + 1;
      
      // Try to find name string using PID * 100
      const nameMapping = this.stringMappings.get(nameKey);
      if (nameMapping && nameMapping.value) {
        integratedEntity.name = {
          name: nameMapping.value,
          source: 'FOOBJ.MSG',
          msg_key: nameKey
        };
      }
      
      // Try to find description string using PID * 100 + 1
      const descMapping = this.stringMappings.get(descKey);
      if (descMapping && descMapping.value) {
        integratedEntity.description = descMapping.value;
      }
      
      // Also check properties for Description field (fallback)
      if (!integratedEntity.description && entity.properties && entity.properties.Description) {
        integratedEntity.description = entity.properties.Description;
      }
      
      // Add MSG file info
      if (nameMapping) {
        integratedEntity.msg_info = {
          name_source: 'FOOBJ.MSG',
          name_key: nameKey,
          has_name: true
        };
      } else {
        integratedEntity.msg_info = {
          name_source: 'database',
          name_key: null,
          has_name: false
        };
      }
      
      return integratedEntity;
    });
    
    // Statistics
    const withMsgNames = integratedEntities.filter(e => e.msg_info.has_name).length;
    const withDescriptions = integratedEntities.filter(e => e.description).length;
    
    console.log(`📊 FOOBJ.MSG Integration Results:`);
    console.log(`   Total entities: ${integratedEntities.length}`);
    console.log(`   With FOOBJ names: ${withMsgNames}`);
    console.log(`   With descriptions: ${withDescriptions}`);
    console.log(`   FOOBJ coverage: ${Math.round((withMsgNames / integratedEntities.length) * 100)}%`);
    
    return integratedEntities;
  }

  /**
   * Export integrated entities
   */
  async exportIntegratedEntities(entities) {
    const exportData = {
      metadata: {
        total: entities.length,
        integration_time: new Date().toISOString(),
        msg_strings_loaded: this.stringMappings.size,
        msg_names_count: entities.filter(e => e.msg_info.has_name).length,
        descriptions_count: entities.filter(e => e.description).length
      },
      entities: entities
    };

    // Export to public directory
    const publicPath = path.join(__dirname, '../public/data/entities-integrated.json');
    fs.writeFileSync(publicPath, JSON.stringify(exportData, null, 2));
    console.log(`📄 Exported integrated entities to: ${publicPath}`);
    
    // Also copy to data directory
    const dataPath = path.join(__dirname, '../data/entities-integrated.json');
    fs.writeFileSync(dataPath, JSON.stringify(exportData, null, 2));
    console.log(`📄 Also copied to: ${dataPath}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting MSG string integration...');
  
  const integrator = new MsgStringIntegrator();
  const result = await integrator.integrateStrings();
  
  if (result.length > 0) {
    console.log('\n✅ MSG string integration completed successfully!');
    console.log(`📊 Integrated ${result.length} entities with MSG strings`);
    console.log('🌐 Ready for Entity Reactor with proper names and descriptions!');
  } else {
    console.log('\n⚠️  No entities processed');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MsgStringIntegrator;
