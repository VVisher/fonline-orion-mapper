/**
 * Parse _msgstr.fos for string mappings
 * Movement II: Allegro - String Localization Processing
 */

const fs = require('fs');
const path = require('path');

class MsgStrParser {
  constructor() {
    this.stringMappings = new Map();
    this.languageData = {
      english: {},
      russian: {},
      chinese: {},
      german: {},
      french: {},
      spanish: {},
      italian: {},
      polish: {},
      japanese: {},
      korean: {}
    };
    this.stats = {
      totalStrings: 0,
      languages: {},
      duplicateKeys: 0,
      emptyStrings: 0,
      processingTime: 0
    };
  }

  /**
   * Parse _msgstr.fos file
   */
  async parseMsgStrFile(filePath) {
    const startTime = Date.now();
    
    try {
      console.log(`📝 Parsing ${filePath}...`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  _msgstr.fos not found at ${filePath}`);
        console.log('💡 Searching for alternative string files...');
        return this.searchAlternativeStringFiles();
      }

      const content = fs.readFileSync(filePath, 'utf8');
      this.processMsgStrContent(content);
      
      this.stats.processingTime = Date.now() - startTime;
      this.generateReport();
      
      return {
        success: true,
        mappings: this.stringMappings,
        languages: this.languageData,
        stats: this.stats
      };
      
    } catch (error) {
      console.error(`❌ Error parsing _msgstr.fos:`, error.message);
      return {
        success: false,
        error: error.message,
        fallbackData: this.generateFallbackStringData()
      };
    }
  }

  /**
   * Process _msgstr.fos content
   */
  processMsgStrContent(content) {
    const lines = content.split('\n');
    let currentLanguage = 'english';
    let currentKey = null;
    let multilineString = false;
    let stringBuffer = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('//') || line.startsWith('#')) {
        continue;
      }

      // Language directive
      if (line.startsWith('@language')) {
        const langMatch = line.match(/@language\s+(\w+)/i);
        if (langMatch) {
          currentLanguage = langMatch[1].toLowerCase();
          if (!this.stats.languages[currentLanguage]) {
            this.stats.languages[currentLanguage] = 0;
          }
        }
        continue;
      }

      // Key definition
      if (line.includes('=>') && !multilineString) {
        const parts = line.split('=>');
        if (parts.length === 2) {
          currentKey = parts[0].trim().replace(/['"]/g, '');
          let value = parts[1].trim();
          
          // Handle multiline strings
          if (value.startsWith('"""') || value.startsWith("'''")) {
            multilineString = true;
            stringBuffer = [value.substring(3)];
            continue;
          }
          
          // Handle single line strings
          value = value.replace(/^['"']|['"']$/g, '');
          this.addStringMapping(currentKey, value, currentLanguage);
        }
        continue;
      }

      // Multiline string continuation
      if (multilineString && currentKey) {
        if (line.endsWith('"""') || line.endsWith("'''")) {
          stringBuffer.push(line.slice(0, -3));
          const fullString = stringBuffer.join('\n');
          this.addStringMapping(currentKey, fullString, currentLanguage);
          multilineString = false;
          stringBuffer = [];
          currentKey = null;
        } else {
          stringBuffer.push(line);
        }
      }
    }
  }

  /**
   * Add string mapping
   */
  addStringMapping(key, value, language) {
    this.stats.totalStrings++;
    this.stats.languages[language] = (this.stats.languages[language] || 0) + 1;

    // Check for duplicates
    if (this.stringMappings.has(key)) {
      this.stats.duplicateKeys++;
      console.warn(`⚠️  Duplicate key found: ${key}`);
    }

    // Check for empty strings
    if (!value || value.trim() === '') {
      this.stats.emptyStrings++;
    }

    // Store mapping
    this.stringMappings.set(key, {
      [language]: value
    });

    // Store language-specific data
    if (!this.languageData[language]) {
      this.languageData[language] = {};
    }
    this.languageData[language][key] = value;
  }

  /**
   * Search for alternative string files
   */
  searchAlternativeStringFiles() {
    const searchPaths = [
      'legacy/text/',
      'legacy/lang/',
      'legacy/strings/',
      'legacy/localization/',
      'text/',
      'lang/',
      'strings/',
      'localization/'
    ];

    const foundFiles = [];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        const files = fs.readdirSync(searchPath);
        const stringFiles = files.filter(file => 
          file.includes('msg') || 
          file.includes('str') || 
          file.includes('lang') ||
          file.includes('text')
        );
        
        if (stringFiles.length > 0) {
          foundFiles.push({
            path: searchPath,
            files: stringFiles
          });
        }
      }
    }

    if (foundFiles.length > 0) {
      console.log('🔍 Found alternative string files:');
      foundFiles.forEach(dir => {
        console.log(`   📁 ${dir.path}: ${dir.files.join(', ')}`);
      });
      
      return this.processAlternativeStringFiles(foundFiles);
    }

    console.log('❌ No string files found, generating fallback data...');
    return {
      success: false,
      fallbackData: this.generateFallbackStringData()
    };
  }

  /**
   * Process alternative string files
   */
  processAlternativeStringFiles(foundFiles) {
    const results = {
      files: [],
      totalStrings: 0,
      languages: {}
    };

    for (const dir of foundFiles) {
      for (const file of dir.files) {
        const filePath = path.join(dir.path, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const fileResult = this.processGenericStringFile(content, file);
          results.files.push(fileResult);
          results.totalStrings += fileResult.stringCount;
        } catch (error) {
          console.warn(`⚠️  Could not process ${file}: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      alternativeFiles: results,
      mappings: this.stringMappings,
      languages: this.languageData
    };
  }

  /**
   * Process generic string file
   */
  processGenericStringFile(content, fileName) {
    const strings = {};
    const lines = content.split('\n');
    let stringCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        continue;
      }

      // Try different string formats
      const formats = [
        /^(\w+)\s*=\s*["'](.+)["']$/,           // key = "value"
        /^(\w+)\s*:\s*["'](.+)["']$/,           // key : "value"
        /^["'](\w+)["']\s*=>\s*["'](.+)["']$/,  // "key" => "value"
        /^(\w+)\s*=>\s*["'](.+)["']$/           // key => "value"
      ];

      for (const format of formats) {
        const match = trimmed.match(format);
        if (match) {
          strings[match[1]] = match[2];
          stringCount++;
          break;
        }
      }
    }

    return {
      fileName,
      stringCount,
      strings
    };
  }

  /**
   * Generate fallback string data
   */
  generateFallbackStringData() {
    console.log('🔧 Generating fallback string data...');
    
    const fallbackStrings = {
      // Common FOnline strings
      'STR_ITEM_NAME': 'Item Name',
      'STR_ITEM_DESC': 'Item Description',
      'STR_CRITTER_NAME': 'Critter Name',
      'STR_CRITTER_DESC': 'Critter Description',
      'STR_WEAPON_NAME': 'Weapon Name',
      'STR_WEAPON_DESC': 'Weapon Description',
      'STR_ARMOR_NAME': 'Armor Name',
      'STR_ARMOR_DESC': 'Armor Description',
      'STR_AMMO_NAME': 'Ammunition Name',
      'STR_AMMO_DESC': 'Ammunition Description',
      'STR_CONTAINER_NAME': 'Container Name',
      'STR_CONTAINER_DESC': 'Container Description',
      'STR_SCENERY_NAME': 'Scenery Object',
      'STR_SCENERY_DESC': 'Scenery Description',
      
      // Interface strings
      'STR_OK': 'OK',
      'STR_CANCEL': 'Cancel',
      'STR_YES': 'Yes',
      'STR_NO': 'No',
      'STR_SAVE': 'Save',
      'STR_LOAD': 'Load',
      'STR_NEW': 'New',
      'STR_DELETE': 'Delete',
      'STR_EDIT': 'Edit',
      'STR_CLOSE': 'Close',
      
      // Mapper strings
      'STR_MAPPER_TITLE': 'ORION Mapper',
      'STR_PROTO_PANEL': 'Proto Panel',
      'STR_TILE_PANEL': 'Tile Panel',
      'STR_CONSOLE': 'Console',
      'STR_HISTORY': 'History',
      'STR_ENTITIES': 'Entities',
      'STR_OBJECTS': 'Objects',
      'STR_CRITTERS': 'Critters',
      'STR_ITEMS': 'Items',
      'STR_SCENERY': 'Scenery'
    };

    // Add fallback strings to mappings
    for (const [key, value] of Object.entries(fallbackStrings)) {
      this.addStringMapping(key, value, 'english');
    }

    return {
      fallbackStrings,
      totalFallbackStrings: Object.keys(fallbackStrings).length
    };
  }

  /**
   * Generate processing report
   */
  generateReport() {
    console.log('\n=== String Processing Report ===');
    console.log(`Total strings processed: ${this.stats.totalStrings}`);
    console.log(`Duplicate keys: ${this.stats.duplicateKeys}`);
    console.log(`Empty strings: ${this.stats.emptyStrings}`);
    console.log(`Processing time: ${this.stats.processingTime}ms`);
    
    console.log('\nLanguages found:');
    for (const [lang, count] of Object.entries(this.stats.languages)) {
      console.log(`  ${lang}: ${count} strings`);
    }
    
    console.log('\nSample mappings:');
    let sampleCount = 0;
    for (const [key, value] of this.stringMappings.entries()) {
      if (sampleCount >= 5) break;
      console.log(`  ${key}: ${JSON.stringify(value)}`);
      sampleCount++;
    }
  }

  /**
   * Export string mappings to JSON
   */
  exportToFile(outputPath) {
    const exportData = {
      metadata: {
        totalStrings: this.stats.totalStrings,
        languages: Object.keys(this.languageData),
        processingTime: this.stats.processingTime,
        exportTime: new Date().toISOString()
      },
      mappings: Object.fromEntries(this.stringMappings),
      languages: this.languageData,
      stats: this.stats
    };

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`📄 String mappings exported to: ${outputPath}`);
  }
}

// Main execution
async function main() {
  console.log('🔤 Starting _msgstr.fos parsing...');
  
  const parser = new MsgStrParser();
  
  // Try different possible locations for _msgstr.fos
  const possiblePaths = [
    'legacy/_msgstr.fos',
    'legacy/text/_msgstr.fos',
    'legacy/lang/_msgstr.fos',
    '_msgstr.fos',
    'text/_msgstr.fos'
  ];

  let result = null;
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      result = await parser.parseMsgStrFile(filePath);
      break;
    }
  }

  // If no file found, use first path for error reporting
  if (!result) {
    result = await parser.parseMsgStrFile(possiblePaths[0]);
  }

  if (result.success) {
    // Export results
    parser.exportToFile('data/string-mappings.json');
    
    console.log('\n✅ String processing completed successfully!');
    console.log(`📊 Processed ${parser.stats.totalStrings} strings`);
    console.log(`🌐 Found ${Object.keys(parser.languageData).length} languages`);
  } else {
    console.log('\n⚠️  String processing completed with fallback data');
    console.log(`📊 Generated ${result.fallbackData?.totalFallbackStrings || 0} fallback strings`);
  }

  console.log('\n🚀 Ready for Entity Reactor localization!');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MsgStrParser;
