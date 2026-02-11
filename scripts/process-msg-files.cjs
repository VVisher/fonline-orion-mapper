/**
 * Process MSG files for string mappings
 * Movement II: Allegro - String Localization Processing
 * Handles FOOBJ.MSG, FOGM.MSG, FODLG.MSG, FOGAME.MSG, etc.
 */

const fs = require('fs');
const path = require('path');

class MsgFileProcessor {
  constructor() {
    this.stringMappings = new Map();
    this.msgFiles = new Map();
    this.stats = {
      totalFiles: 0,
      totalStrings: 0,
      filesProcessed: {},
      duplicateKeys: 0,
      emptyStrings: 0,
      processingTime: 0
    };
  }

  /**
   * Process all MSG files from server
   */
  async processMsgFiles(serverPath) {
    const startTime = Date.now();
    
    try {
      console.log('📝 Starting MSG file processing...');
      
      // Get text directory path
      const textDir = path.join(serverPath, 'text', 'engl');
      
      if (!fs.existsSync(textDir)) {
        console.log(`⚠️  Text directory not found: ${textDir}`);
        return this.generateFallbackData();
      }

      console.log(`📁 Found text directory: ${textDir}`);
      
      // Get all MSG files
      const msgFiles = fs.readdirSync(textDir).filter(file => file.endsWith('.MSG'));
      console.log(`📄 Found ${msgFiles.length} MSG files: ${msgFiles.join(', ')}`);

      // Process each MSG file
      for (const msgFile of msgFiles) {
        await this.processMsgFile(path.join(textDir, msgFile), msgFile);
      }

      this.stats.processingTime = Date.now() - startTime;
      this.stats.totalFiles = msgFiles.length;
      
      this.generateReport();
      this.exportResults();
      
      return {
        success: true,
        mappings: Object.fromEntries(this.stringMappings),
        msgFiles: Object.fromEntries(this.msgFiles),
        stats: this.stats
      };
      
    } catch (error) {
      console.error('❌ Error processing MSG files:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackData: this.generateFallbackData()
      };
    }
  }

  /**
   * Process individual MSG file
   */
  async processMsgFile(filePath, fileName) {
    try {
      console.log(`📄 Processing ${fileName}...`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const fileStrings = new Map();
      let stringCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#') || line.startsWith('//')) {
          continue;
        }

        // Parse MSG entry format: {key} value
        const match = line.match(/^\{(\d+)\}\s*(.+)$/);
        if (match) {
          const key = match[1];
          let value = match[2];
          
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          
          // Handle multiline strings (ending with \)
          if (value.endsWith('\\')) {
            value = value.slice(0, -1);
            let j = i + 1;
            while (j < lines.length && lines[j].trim().endsWith('\\')) {
              value += '\n' + lines[j].trim().slice(0, -1);
              j++;
            }
            if (j < lines.length) {
              value += '\n' + lines[j].trim();
              i = j;
            }
          }
          
          // Store mapping
          this.stringMappings.set(key, {
            value: value,
            source: fileName,
            key: parseInt(key)
          });
          
          fileStrings.set(key, value);
          stringCount++;
          
          this.stats.totalStrings++;
          
          // Check for empty strings
          if (!value || value.trim() === '') {
            this.stats.emptyStrings++;
          }
        }
      }
      
      this.msgFiles.set(fileName, {
        strings: Object.fromEntries(fileStrings),
        count: stringCount,
        fileName: fileName
      });
      
      this.stats.filesProcessed[fileName] = stringCount;
      console.log(`   📦 Processed ${stringCount} strings from ${fileName}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${fileName}:`, error.message);
      this.stats.filesProcessed[fileName] = 0;
    }
  }

  /**
   * Generate fallback string data
   */
  generateFallbackData() {
    console.log('🔧 Generating fallback MSG data...');
    
    const fallbackStrings = {
      // Common FOnline string keys (based on typical MSG files)
      '1000': 'Item Name',
      '1001': 'Item Description',
      '1002': 'Weapon Name',
      '1003': 'Weapon Description',
      '1004': 'Armor Name',
      '1005': 'Armor Description',
      '1006': 'Ammo Name',
      '1007': 'Ammo Description',
      '1008': 'Container Name',
      '1009': 'Container Description',
      '2000': 'Critter Name',
      '2001': 'Critter Description',
      '3000': 'Scenery Name',
      '3001': 'Scenery Description',
      
      // Interface strings
      '5000': 'OK',
      '5001': 'Cancel',
      '5002': 'Yes',
      '5003': 'No',
      '5004': 'Save',
      '5005': 'Load',
      '5006': 'New',
      '5007': 'Delete',
      '5008': 'Edit',
      '5009': 'Close',
      
      // Game messages
      '6000': 'You gained experience.',
      '6001': 'You leveled up!',
      '6002': 'Critical hit!',
      '6003': 'Miss!',
      '6004': 'You died.',
      '6005': 'You are bleeding.',
      '6006': 'You are poisoned.',
      '6007': 'You are crippled.',
      '6008': 'You are unconscious.',
      '6009': 'Game over.'
    };

    // Add fallback strings to mappings
    for (const [key, value] of Object.entries(fallbackStrings)) {
      this.stringMappings.set(key, {
        value: value,
        source: 'fallback',
        key: parseInt(key)
      });
    }

    // Create fallback MSG file structure
    this.msgFiles.set('fallback.MSG', {
      strings: fallbackStrings,
      count: Object.keys(fallbackStrings).length,
      fileName: 'fallback.MSG'
    });

    this.stats.totalStrings = Object.keys(fallbackStrings).length;
    this.stats.totalFiles = 1;
    this.stats.filesProcessed['fallback.MSG'] = Object.keys(fallbackStrings).length;

    return {
      fallbackStrings,
      totalFallbackStrings: Object.keys(fallbackStrings).length
    };
  }

  /**
   * Generate processing report
   */
  generateReport() {
    console.log('\n=== MSG File Processing Report ===');
    console.log(`Total files processed: ${this.stats.totalFiles}`);
    console.log(`Total strings processed: ${this.stats.totalStrings}`);
    console.log(`Duplicate keys: ${this.stats.duplicateKeys}`);
    console.log(`Empty strings: ${this.stats.emptyStrings}`);
    console.log(`Processing time: ${this.stats.processingTime}ms`);
    
    console.log('\nFiles processed:');
    for (const [fileName, count] of Object.entries(this.stats.filesProcessed)) {
      console.log(`  ${fileName}: ${count} strings`);
    }
    
    console.log('\nSample mappings:');
    let sampleCount = 0;
    for (const [key, mapping] of this.stringMappings.entries()) {
      if (sampleCount >= 5) break;
      console.log(`  {${key}}: "${mapping.value}" (${mapping.source})`);
      sampleCount++;
    }
  }

  /**
   * Export results to files
   */
  exportResults() {
    // Export main string mappings
    const exportData = {
      metadata: {
        totalStrings: this.stats.totalStrings,
        totalFiles: this.stats.totalFiles,
        processingTime: this.stats.processingTime,
        exportTime: new Date().toISOString(),
        source: 'FOnline: Ashes of Phoenix Server MSG Files'
      },
      mappings: Object.fromEntries(this.stringMappings),
      msgFiles: Object.fromEntries(this.msgFiles),
      stats: this.stats
    };

    fs.writeFileSync('data/string-mappings.json', JSON.stringify(exportData, null, 2));
    console.log(`📄 String mappings exported to: data/string-mappings.json`);
    
    // Export individual MSG file data
    const msgExportData = {
      metadata: {
        totalFiles: this.stats.totalFiles,
        totalStrings: this.stats.totalStrings,
        exportTime: new Date().toISOString()
      },
      files: Object.fromEntries(this.msgFiles)
    };

    fs.writeFileSync('data/msg-files-export.json', JSON.stringify(msgExportData, null, 2));
    console.log(`📄 MSG files data exported to: data/msg-files-export.json`);
  }

  /**
   * Get string by key
   */
  getString(key) {
    return this.stringMappings.get(key);
  }

  /**
   * Get all strings from specific MSG file
   */
  getStringsFromMsgFile(fileName) {
    return this.msgFiles.get(fileName);
  }

  /**
   * Search strings by content
   */
  searchStrings(searchTerm) {
    const results = [];
    const lowerSearch = searchTerm.toLowerCase();
    
    for (const [key, mapping] of this.stringMappings.entries()) {
      if (mapping.value.toLowerCase().includes(lowerSearch)) {
        results.push({
          key: key,
          value: mapping.value,
          source: mapping.source
        });
      }
    }
    
    return results;
  }
}

// Main execution
async function main() {
  console.log('🔤 Starting MSG file processing...');
  
  // Read server path from config
  const configPath = './scripts/aop-nightmare.cfg';
  let serverPath = 'V://Download//GoogleDrive//FOnline//fonline-aop//server'; // fallback
  
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const serverMatch = configContent.match(/server\s*=\s*(.+)/i);
      if (serverMatch) {
        serverPath = serverMatch[1].trim();
        console.log(`📁 Using server path from config: ${serverPath}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Could not read config, using default server path');
  }

  const processor = new MsgFileProcessor();
  const result = await processor.processMsgFiles(serverPath);

  if (result.success) {
    console.log('\n✅ MSG file processing completed successfully!');
    console.log(`📊 Processed ${result.stats.totalFiles} MSG files`);
    console.log(`📝 Total strings: ${result.stats.totalStrings}`);
    console.log(`🕐 Processing time: ${result.stats.processingTime}ms`);
  } else {
    console.log('\n⚠️  MSG file processing completed with fallback data');
    console.log(`📊 Generated ${result.fallbackData?.totalFallbackStrings || 0} fallback strings`);
  }

  console.log('\n🚀 String mappings ready for Entity Reactor localization!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MsgFileProcessor;
