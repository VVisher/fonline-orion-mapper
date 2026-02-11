/**
 * Parse items.lst for base item definitions
 * Movement II: Allegro - Advanced Proto Processing
 */

const fs = require('fs');
const path = require('path');

class ItemsListParser {
  constructor() {
    this.items = [];
    this.worldEditorCategories = {
      weapons: ['gun', 'rifle', 'pistol', 'blade', 'sword', 'axe', 'weapon', 'melee', 'energy'],
      armor: ['armor', 'helmet', 'vest', 'plate', 'shield', 'protection', 'combat', 'power'],
      ammunition: ['ammo', 'bullet', 'shell', 'cartridge', 'round', 'magazine', 'clip'],
      medicine: ['med', 'heal', 'stimpack', 'antidote', 'drug', 'medicine', 'chem', 'hydra'],
      food: ['food', 'eat', 'drink', 'meal', 'bread', 'meat', 'water', 'nuka', 'consumable'],
      tools: ['tool', 'repair', 'kit', 'multitool', 'equipment', 'device', 'instrument'],
      containers: ['container', 'bag', 'box', 'chest', 'backpack', 'case', 'storage'],
      keys: ['key', 'lock', 'access', 'door', 'security', 'card', 'pass'],
      books: ['book', 'manual', 'guide', 'skill', 'knowledge', 'magazine', 'holodisk'],
      misc: ['misc', 'item', 'object', 'thing', 'various', 'general', 'junk']
    };
  }

  /**
   * Parse items.lst file and extract item definitions
   */
  parseItemsList(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`items.lst not found at ${filePath}, using fallback data`);
        return this.generateFallbackItems();
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('//'));
      
      this.items = lines.map(line => this.parseItemEntry(line.trim()));
      
      console.log(`Parsed ${this.items.length} item entries from items.lst`);
      return this.items;
    } catch (error) {
      console.error(`Error parsing items.lst: ${error.message}`);
      return this.generateFallbackItems();
    }
  }

  /**
   * Parse individual item entry line
   */
  parseItemEntry(line) {
    // Expected format: filename.fopro [optional comments]
    const parts = line.split(/\s+/);
    const filename = parts[0];
    const comment = parts.slice(1).join(' ').replace(/^\/\//, '').trim();
    
    return {
      filename: filename,
      comment: comment,
      category: this.classifyItem(filename, comment),
      worldEditorCategory: this.getWorldEditorCategory(filename, comment),
      source_file: 'items.lst'
    };
  }

  /**
   * Classify item based on filename and comments
   */
  classifyItem(filename, comment) {
    const searchText = (filename + ' ' + comment).toLowerCase();
    
    // Check for specific item types
    if (searchText.includes('weapon') || searchText.includes('gun') || searchText.includes('rifle')) return 'Weapon';
    if (searchText.includes('armor') || searchText.includes('helmet') || searchText.includes('vest')) return 'Armor';
    if (searchText.includes('ammo') || searchText.includes('bullet') || searchText.includes('shell')) return 'Ammunition';
    if (searchText.includes('med') || searchText.includes('heal') || searchText.includes('drug')) return 'Medicine';
    if (searchText.includes('food') || searchText.includes('eat') || searchText.includes('drink')) return 'Food';
    if (searchText.includes('tool') || searchText.includes('repair') || searchText.includes('kit')) return 'Tool';
    if (searchText.includes('container') || searchText.includes('bag') || searchText.includes('box')) return 'Container';
    if (searchText.includes('key') || searchText.includes('lock') || searchText.includes('access')) return 'Key';
    if (searchText.includes('book') || searchText.includes('manual') || searchText.includes('skill')) return 'Book';
    
    return 'Misc';
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
    
    return 'misc';
  }

  /**
   * Generate fallback item data if items.lst is missing
   */
  generateFallbackItems() {
    console.log('Generating fallback item data...');
    
    const fallbackItems = [
      { filename: 'weapons.fopro', comment: 'Weapons and ammunition', category: 'Weapon', worldEditorCategory: 'weapons' },
      { filename: 'armor.fopro', comment: 'Armor and protective gear', category: 'Armor', worldEditorCategory: 'armor' },
      { filename: 'medicine.fopro', comment: 'Medical supplies', category: 'Medicine', worldEditorCategory: 'medicine' },
      { filename: 'food.fopro', comment: 'Food and drinks', category: 'Food', worldEditorCategory: 'food' },
      { filename: 'tools.fopro', comment: 'Tools and equipment', category: 'Tool', worldEditorCategory: 'tools' },
      { filename: 'containers.fopro', comment: 'Containers and storage', category: 'Container', worldEditorCategory: 'containers' },
      { filename: 'keys.fopro', comment: 'Keys and access cards', category: 'Key', worldEditorCategory: 'keys' },
      { filename: 'books.fopro', comment: 'Books and skill manuals', category: 'Book', worldEditorCategory: 'books' },
      { filename: 'misc.fopro', comment: 'Miscellaneous items', category: 'Misc', worldEditorCategory: 'misc' }
    ];
    
    this.items = fallbackItems;
    return this.items;
  }

  /**
   * Get items by WorldEditor category
   */
  getItemsByCategory(category) {
    return this.items.filter(item => item.worldEditorCategory === category);
  }

  /**
   * Get all WorldEditor categories found
   */
  getAllCategories() {
    const categories = new Set();
    this.items.forEach(item => {
      if (item.worldEditorCategory) {
        categories.add(item.worldEditorCategory);
      }
    });
    return Array.from(categories);
  }

  /**
   * Get detailed statistics about items
   */
  getStatistics() {
    const stats = {
      total_items: this.items.length,
      categories: {},
      file_types: {},
      comments_with_descriptions: 0
    };
    
    this.items.forEach(item => {
      // Count categories
      const category = item.worldEditorCategory || 'unknown';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Count file types
      const ext = path.extname(item.filename);
      stats.file_types[ext] = (stats.file_types[ext] || 0) + 1;
      
      // Count items with descriptive comments
      if (item.comment && item.comment.length > 10) {
        stats.comments_with_descriptions++;
      }
    });
    
    return stats;
  }

  /**
   * Export item data for database integration
   */
  exportForDatabase() {
    return {
      source: 'items.lst',
      processing_date: new Date().toISOString(),
      statistics: this.getStatistics(),
      items: this.items.map(item => ({
        filename: item.filename,
        category: item.category,
        worldEditorCategory: item.worldEditorCategory,
        comment: item.comment,
        source_file: item.source_file
      }))
    };
  }

  /**
   * Validate item entries for common issues
   */
  validateItems() {
    const issues = [];
    const seenFiles = new Set();
    
    this.items.forEach((item, index) => {
      // Check for duplicate filenames
      if (seenFiles.has(item.filename)) {
        issues.push({
          type: 'duplicate_filename',
          index: index,
          filename: item.filename,
          message: 'Duplicate filename found'
        });
      }
      seenFiles.add(item.filename);
      
      // Check for missing file extension
      if (!item.filename.endsWith('.fopro')) {
        issues.push({
          type: 'missing_extension',
          index: index,
          filename: item.filename,
          message: 'Missing .fopro extension'
        });
      }
      
      // Check for empty comments
      if (!item.comment || item.comment.trim() === '') {
        issues.push({
          type: 'empty_comment',
          index: index,
          filename: item.filename,
          message: 'Empty comment field'
        });
      }
      
      // Check for unknown category
      if (item.worldEditorCategory === 'misc' && item.category !== 'Misc') {
        issues.push({
          type: 'category_mismatch',
          index: index,
          filename: item.filename,
          message: `Category mismatch: ${item.category} vs ${item.worldEditorCategory}`
        });
      }
    });
    
    return issues;
  }
}

// Main execution
if (require.main === module) {
  const parser = new ItemsListParser();
  
  // Look for items.lst in standard locations
  const possiblePaths = [
    path.join(__dirname, '../source/proto/items.lst'),
    path.join(__dirname, '../source/database/proto/items.lst'),
    path.join(__dirname, '../data/items.lst')
  ];
  
  let itemsListPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      itemsListPath = possiblePath;
      break;
    }
  }
  
  if (itemsListPath) {
    console.log(`Found items.lst at: ${itemsListPath}`);
    const items = parser.parseItemsList(itemsListPath);
    
    // Display results
    console.log('\n=== Item Classification Results ===');
    const stats = parser.getStatistics();
    console.log(`Total items: ${stats.total_items}`);
    console.log(`Items with descriptions: ${stats.comments_with_descriptions}`);
    
    console.log('\nCategories:');
    Object.entries(stats.categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });
    
    console.log('\nFile types:');
    Object.entries(stats.file_types).forEach(([ext, count]) => {
      console.log(`  ${ext}: ${count} files`);
    });
    
    // Validate items
    const issues = parser.validateItems();
    if (issues.length > 0) {
      console.log(`\n=== Validation Issues (${issues.length}) ===`);
      issues.slice(0, 10).forEach(issue => {
        console.log(`${issue.type}: ${issue.filename} - ${issue.message}`);
      });
      if (issues.length > 10) {
        console.log(`... and ${issues.length - 10} more issues`);
      }
    }
    
    // Export for database
    const exportData = parser.exportForDatabase();
    fs.writeFileSync(
      path.join(__dirname, '../data/items-list-export.json'),
      JSON.stringify(exportData, null, 2)
    );
    console.log(`\nExported item data to data/items-list-export.json`);
    
  } else {
    console.log('items.lst not found, using fallback data');
    const items = parser.parseItemsList(null);
    const stats = parser.getStatistics();
    console.log(`Generated ${stats.total_items} fallback item entries`);
  }
}

module.exports = ItemsListParser;
