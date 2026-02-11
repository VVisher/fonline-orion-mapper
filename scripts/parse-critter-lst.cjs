/**
 * Parse critter.lst for base creature definitions
 * Movement II: Allegro - Advanced Proto Processing
 */

const fs = require('fs');
const path = require('path');

class CritterListParser {
  constructor() {
    this.critters = [];
    this.categories = new Map();
    this.stats = {
      totalCritters: 0,
      withDescriptions: 0,
      categories: {},
      fileTypes: new Set(),
      validationIssues: []
    };
    this.worldEditorCategories = [
      'aliens', 'brahmins', 'deathclaws', 'dogs', 'geckos', 'ghouls', 
      'insects', 'mutants', 'plants', 'radscorpions', 'rats', 'robots', 
      'bandits', 'citizens', 'guards', 'merchants', 'slavers', 'slaves', 
      'tribals', 'vips', 'companions', 'strangers'
    ];
  }

  /**
   * Parse critter.lst file
   */
  parseCritterList(critterListPath) {
    try {
      console.log(`📄 Parsing ${critterListPath}...`);
      
      const content = fs.readFileSync(critterListPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and comments
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
          continue;
        }

        // Parse critter entry (filename.fopro format)
        const critter = this.parseCritterEntry(line);
        if (critter) {
          this.critters.push(critter);
          this.stats.totalCritters++;
          
          // Track categories
          const category = critter.category;
          this.stats.categories[category] = (this.stats.categories[category] || 0) + 1;
          
          // Track file types
          this.stats.fileTypes.add(critter.filename);
        }
      }

      console.log(`Parsed ${this.stats.totalCritters} critter entries from critters.lst`);
      return this.critters;

    } catch (error) {
      console.error('Error parsing critters.lst:', error.message);
      return this.generateFallbackData();
    }
  }

  /**
   * Parse critter entry line
   */
  parseCritterEntry(line) {
    // Expected format: filename.fopro [optional comments]
    const parts = line.split(/\s+/);
    const filename = parts[0];
    
    if (!filename.endsWith('.fopro')) {
      return null;
    }
    
    const critter = {
      filename: filename,
      name: this.generateNameFromFilename(filename),
      description: '',
      category: this.classifyCritter(filename),
      sourceFile: 'critters.lst',
      properties: {
        FileName: filename,
        Name: this.generateNameFromFilename(filename),
        Description: ''
      },
      worldEditorCategory: {
        category: this.classifyCritter(filename),
        confidence: 0.7
      },
      comment: parts.slice(1).join(' ') || ''
    };
    
    return critter;
  }

  /**
   * Generate name from filename
   */
  generateNameFromFilename(filename) {
    // Remove .fopro extension and convert to readable name
    const baseName = filename.replace('.fopro', '');
    
    // Replace underscores and dashes with spaces
    let name = baseName.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    name = name.replace(/\b\w/g, l => l.toUpperCase());
    
    // Handle special cases
    name = name.replace(/F\s/g, 'Faction ');
    name = name.replace(/D\s/g, 'Dungeon ');
    name = name.replace(/Ap\s/gi, 'April ');
    
    return name || 'Unknown Critter';
  }

  /**
   * Classify creature based on filename
   */
  classifyCritter(filename) {
    const searchText = filename.toLowerCase();
    
    // Check for specific creature types
    if (searchText.includes('human') || searchText.includes('player')) return 'Humanoid';
    if (searchText.includes('robot') || searchText.includes('droid')) return 'Robot';
    if (searchText.includes('animal') || searchText.includes('beast')) return 'Animal';
    if (searchText.includes('monster') || searchText.includes('mutant')) return 'Monster';
    
    return 'Unknown';
  }

  /**
   * Apply WorldEditor semantic classification
   */
  getWorldEditorCategory(filename, comment) {
    const searchText = (filename + ' ' + comment).toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.worldEditorCategories)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * Generate fallback critter data if critter.lst is missing
   */
  generateFallbackCritters() {
    console.log('Generating fallback critter data...');
    
    const fallbackCreatures = [
      { filename: 'humans.fopro', comment: 'Human NPCs', category: 'Humanoid', worldEditorCategory: 'citizens' },
      { filename: 'robots.fopro', comment: 'Robotic entities', category: 'Robot', worldEditorCategory: 'robots' },
      { filename: 'animals.fopro', comment: 'Animals and beasts', category: 'Animal', worldEditorCategory: 'dogs' },
      { filename: 'monsters.fopro', comment: 'Monsters and mutants', category: 'Monster', worldEditorCategory: 'mutants' }
    ];
    
    this.creatures = fallbackCreatures;
    return this.creatures;
  }

  /**
   * Get creatures by WorldEditor category
   */
  getCreaturesByCategory(category) {
    return this.creatures.filter(creature => creature.worldEditorCategory === category);
  }

  /**
   * Get all WorldEditor categories found
   */
  getAllCategories() {
    const categories = new Set();
    this.creatures.forEach(creature => {
      if (creature.worldEditorCategory) {
        categories.add(creature.worldEditorCategory);
      }
    });
    return Array.from(categories);
  }

  /**
   * Export creature data for database integration
   */
  exportForDatabase() {
    return {
      metadata: {
        source: 'critters.lst',
        total_creatures: this.critters.length,
        categories: Object.keys(this.stats.categories),
        file_types: Array.from(this.stats.fileTypes),
        export_time: new Date().toISOString()
      },
      creatures: this.critters.map(creature => ({
        filename: creature.filename,
        name: creature.name,
        description: creature.description,
        category: creature.category,
        properties: creature.properties,
        worldEditorCategory: creature.worldEditorCategory,
        comment: creature.comment,
        source_file: creature.source_file
      }))
    };
  }
}

// Main execution
if (require.main === module) {
  console.log('🦎 Starting critter.lst parsing...');
  
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

  const parser = new CritterListParser();
  
  // Try multiple possible paths for critters.lst
  const possiblePaths = [
    path.join(serverPath, 'proto', 'critters', 'critters.lst'),
    path.join(serverPath, 'proto', 'critter.lst'),
    path.join(serverPath, 'critters.lst'),
    path.join(__dirname, '../source/proto/critter.lst'),
    path.join(__dirname, '../source/database/proto/critter.lst')
  ];
  
  let critterListPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      critterListPath = possiblePath;
      break;
    }
  }
  
  if (critterListPath) {
    console.log(`Found critters.lst at: ${critterListPath}`);
    const creatures = parser.parseCritterList(critterListPath);
    
    if (creatures && creatures.length > 0) {
      // Export for database
      const exportData = parser.exportForDatabase();
      fs.writeFileSync(
        path.join(__dirname, '../data/critter-list-export.json'),
        JSON.stringify(exportData, null, 2)
      );
      console.log(`\nExported creature data to data/critter-list-export.json`);
      console.log(`📊 Processed ${parser.stats.totalCritters} critters`);
    } else {
      console.log('⚠️  No valid critter data found');
    }
  } else {
    console.log('critters.lst not found, using fallback data');
    console.log('Searched paths:');
    possiblePaths.forEach(p => console.log(`  - ${p}`));
    
    const fallbackData = parser.generateFallbackData();
    const exportData = parser.exportForDatabase();
    fs.writeFileSync(
      path.join(__dirname, '../data/critter-list-export.json'),
      JSON.stringify(exportData, null, 2)
    );
    console.log(`Generated ${fallbackData.length} fallback creature entries`);
  }
}

module.exports = CritterListParser;
