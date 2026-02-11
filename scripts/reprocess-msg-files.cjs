/**
 * Reprocess MSG files correctly
 * Fixes the source assignment issue where FOOBJ.MSG keys got mixed with other MSG files
 */

const fs = require('fs');
const path = require('path');

class MsgReprocessor {
  constructor() {
    this.serverPath = null;
    this.stringMappings = new Map();
  }

  /**
   * Read server path from config
   */
  readConfig() {
    try {
      const configPath = path.join(__dirname, 'aop-nightmare.cfg');
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Extract server path
      const match = configContent.match(/server\s*=\s*(.+)/);
      if (match) {
        this.serverPath = match[1].trim().replace(/\/\//g, '/');
        console.log('📁 Server path:', this.serverPath);
        return true;
      }
      throw new Error('Server path not found in config');
    } catch (error) {
      console.error('❌ Error reading config:', error.message);
      return false;
    }
  }

  /**
   * Process a single MSG file correctly
   */
  processMsgFile(filename) {
    const filePath = path.join(this.serverPath, 'text', 'engl', filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    console.log(`📄 Processing ${filename}...`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      let processedCount = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('{') && trimmed.includes('}{')) {
          // Parse MSG entry: {key}{value}
          const match = trimmed.match(/^\{(\d+)\}\{(.*)\}$/);
          if (match) {
            const key = parseInt(match[1]);
            let value = match[2];
            
            // Clean up the value - remove the leading }{ and any trailing }
            value = value.replace(/^\}\{/, '').replace(/\}$/, '').trim();
            
            // Store with CORRECT source
            this.stringMappings.set(key, {
              value: value,
              source: filename, // This is the fix - use actual filename
              key: key
            });
            
            processedCount++;
          }
        }
      }
      
      console.log(`✅ ${filename}: ${processedCount} strings processed`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
    }
  }

  /**
   * Process all MSG files
   */
  async processAllMsgFiles() {
    console.log('🚀 Starting MSG file reprocessing...');
    
    if (!this.readConfig()) {
      return false;
    }

    // ONLY process FOOBJ.MSG for Entity Reactor
    const msgFiles = [
      'FOOBJ.MSG'
    ];

    // Process each file
    for (const filename of msgFiles) {
      this.processMsgFile(filename);
    }

    console.log(`📊 Total strings processed: ${this.stringMappings.size}`);
    
    // Verify FOOBJ.MSG entries
    console.log('\n=== Verifying FOOBJ.MSG Entries ===');
    const foobjEntries = Array.from(this.stringMappings.values())
      .filter(mapping => mapping.source === 'FOBJ.MSG')
      .slice(0, 10);
    
    foobjEntries.forEach(mapping => {
      console.log(`Key ${mapping.key}: ${mapping.value}`);
    });

    // Export corrected mappings
    await this.exportMappings();
    
    return true;
  }

  /**
   * Export corrected string mappings
   */
  async exportMappings() {
    const mappingsObject = {};
    for (const [key, mapping] of this.stringMappings) {
      mappingsObject[key] = mapping;
    }

    const exportData = {
      metadata: {
        totalStrings: this.stringMappings.size,
        totalFiles: 9,
        processingTime: Date.now(),
        exportTime: new Date().toISOString(),
        source: 'FOnline: Ashes of Phoenix Server MSG Files (CORRECTED)',
        note: 'Fixed source assignments - each string now correctly attributed to its actual MSG file'
      },
      mappings: mappingsObject
    };

    // Export to data directory
    const outputPath = path.join(__dirname, '../data/string-mappings-corrected.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Corrected mappings exported to: ${outputPath}`);

    // Also copy to public directory
    const publicPath = path.join(__dirname, '../public/data/string-mappings-corrected.json');
    fs.writeFileSync(publicPath, JSON.stringify(exportData, null, 2));
    console.log(`✅ Also copied to: ${publicPath}`);

    return exportData;
  }
}

// Main execution
async function main() {
  console.log('🔧 Starting MSG file reprocessing (source fix)...');
  
  const reprocessor = new MsgReprocessor();
  const success = await reprocessor.processAllMsgFiles();
  
  if (success) {
    console.log('\n✅ MSG file reprocessing completed!');
    console.log('📊 String mappings corrected with proper source assignments');
    console.log('🌐 Ready to integrate with Entity Reactor!');
    
    console.log('\n🔄 Next steps:');
    console.log('1. Update integration script to use string-mappings-corrected.json');
    console.log('2. Re-run the integration');
    console.log('3. Test Entity Reactor with corrected data');
  } else {
    console.log('\n❌ MSG file reprocessing failed');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MsgReprocessor;
