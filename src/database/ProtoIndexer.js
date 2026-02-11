/**
 * ProtoIndexer - Comprehensive FOnline data indexing system
 * 
 * Parses and indexes:
 * - Creatures from critter.lst and .fopro files
 * - Items from items.lst and .fopro files  
 * - Object names/descriptions from MSG files
 * - Map locations from GenerateWorld.cfg, Locations.cfg, and .fos files
 * - Global defines from _defines.fos
 */

class ProtoIndexer {
  constructor() {
    this.index = {
      creatures: new Map(),
      items: new Map(),
      objects: new Map(),
      maps: new Map(),
      defines: new Map(),
      references: {
        missingNames: [],
        missingDescriptions: [],
        duplicatePids: [],
        orphanedReferences: []
      }
    };
  }

  /**
   * Parse .lst files (simple PID:Name format)
   */
  parseLstFile(content) {
    const lines = content.split('\n');
    const entries = new Map();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const [, pid, name] = match;
        entries.set(parseInt(pid, 10), name.trim());
      }
    }
    
    return entries;
  }

  /**
   * Parse .fopro files (binary proto format)
   */
  parseFoproFile(buffer) {
    const view = new DataView(buffer);
    const entries = new Map();
    let offset = 0;
    
    try {
      // Read header
      const version = view.getUint32(offset, true);
      offset += 4;
      const count = view.getUint32(offset, true);
      offset += 4;
      
      // Read entries
      for (let i = 0; i < count; i++) {
        const pid = view.getUint16(offset, true);
        offset += 2;
        
        // Skip to name field (simplified - actual .fopro parsing is more complex)
        const nameOffset = view.getUint32(offset, true);
        offset += 4;
        
        // Read name (null-terminated string)
        const name = this.readNullTerminatedString(view, nameOffset);
        
        entries.set(pid, name);
      }
    } catch (error) {
      console.warn('Failed to parse .fopro file:', error);
    }
    
    return entries;
  }

  /**
   * Read null-terminated string from DataView
   */
  readNullTerminatedString(view, offset) {
    let str = '';
    let char = view.getUint8(offset++);
    
    while (char !== 0) {
      str += String.fromCharCode(char);
      char = view.getUint8(offset++);
    }
    
    return str;
  }

  /**
   * Parse MSG files (FOnline message format)
   */
  parseMsgFile(content) {
    const lines = content.split('\n');
    const entries = new Map();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('{') || trimmed.startsWith('}')) continue;
      
      // Format: {number} "string"
      const match = trimmed.match(/^\{(\d+)\}\s*"(.*)"\s*$/);
      if (match) {
        const [, id, text] = match;
        entries.set(parseInt(id, 10), text.replace(/"/g, '"'));
      }
    }
    
    return entries;
  }

  /**
   * Parse CFG files (key=value format)
   */
  parseCfgFile(content) {
    const lines = content.split('\n');
    const entries = new Map();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.+)$/);
      if (match) {
        const [, key, value] = match;
        entries.set(key.trim(), value.trim());
      }
    }
    
    return entries;
  }

  /**
   * Parse .fos files (FOnline script format)
   */
  parseFosFile(content) {
    const entries = new Map();
    
    // Extract #define statements
    const defineRegex = /#define\s+(\w+)\s+(.+)/g;
    let match;
    
    while ((match = defineRegex.exec(content)) !== null) {
      const [, name, value] = match;
      entries.set(name, value.trim());
    }
    
    return entries;
  }

  /**
   * Index creatures from multiple sources
   */
  async indexCreatures() {
    console.log('🔍 Indexing creatures...');
    
    try {
      // 1. Parse critter.lst for base data
      const critterListResponse = await fetch('./server/proto/critter.lst');
      const critterListData = await critterListResponse.text();
      const critterList = this.parseLstFile(critterListData);
      
      // 2. Parse individual .fopro files for detailed data
      const critterFiles = await this.listDirectory('./server/proto/critters/', '.fopro');
      
      for (const file of critterFiles) {
        try {
          const response = await fetch(file);
          const buffer = await response.arrayBuffer();
          const foproData = this.parseFoproFile(buffer);
          
          // Merge data from .fopro with .lst data
          for (const [pid, name] of foproData) {
            const baseName = critterList.get(pid) || name;
            this.index.creatures.set(pid, {
              pid: parseInt(pid),
              name: baseName,
              foproName: name,
              file: file.split('/').pop()
            });
          }
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error);
        }
      }
      
      console.log(`✅ Indexed ${this.index.creatures.size} creatures`);
      
    } catch (error) {
      console.error('❌ Failed to index creatures:', error);
    }
  }

  /**
   * Index items from multiple sources
   */
  async indexItems() {
    console.log('🔍 Indexing items...');
    
    try {
      // 1. Parse items.lst for base data
      const itemsListResponse = await fetch('./items.lst');
      const itemsListData = await itemsListResponse.text();
      const itemsList = this.parseLstFile(itemsListData);
      
      // 2. Parse individual .fopro files for detailed data
      const itemFiles = await this.listDirectory('./server/proto/items/', '.fopro');
      
      for (const file of itemFiles) {
        try {
          const response = await fetch(file);
          const buffer = await response.arrayBuffer();
          const foproData = this.parseFoproFile(buffer);
          
          // Merge data from .fopro with .lst data
          for (const [pid, name] of foproData) {
            const baseName = itemsList.get(pid) || name;
            this.index.items.set(pid, {
              pid: parseInt(pid),
              name: baseName,
              foproName: name,
              file: file.split('/').pop()
            });
          }
        } catch (error) {
          console.warn(`Failed to load ${file}:`, error);
        }
      }
      
      console.log(`✅ Indexed ${this.index.items.size} items`);
      
    } catch (error) {
      console.error('❌ Failed to index items:', error);
    }
  }

  /**
   * Index object names and descriptions
   */
  async indexObjects() {
    console.log('🔍 Indexing objects...');
    
    try {
      // 1. Parse _msgstr.fos for object names
      const msgstrResponse = await fetch('./_msgstr.fos');
      const msgstrData = await msgstrResponse.text();
      const msgstrEntries = this.parseMsgFile(msgstrData);
      
      // 2. Parse FOOBJ.MSG for descriptions
      const foobjResponse = await fetch('./server/text/engl/FOOBJ.MSG');
      const foobjData = await foobjResponse.text();
      const foobjEntries = this.parseMsgFile(foobjData);
      
      // 3. Merge object data
      const allPids = new Set([...msgstrEntries.keys(), ...foobjEntries.keys()]);
      
      for (const pid of allPids) {
        this.index.objects.set(pid, {
          pid: parseInt(pid),
          name: msgstrEntries.get(pid) || `Object ${pid}`,
          description: foobjEntries.get(pid) || '',
          hasName: msgstrEntries.has(pid),
          hasDescription: foobjEntries.has(pid)
        });
      }
      
      console.log(`✅ Indexed ${this.index.objects.size} objects`);
      
    } catch (error) {
      console.error('❌ Failed to index objects:', error);
    }
  }

  /**
   * Index maps and locations
   */
  async indexMaps() {
    console.log('🔍 Indexing maps...');
    
    try {
      // 1. Parse GenerateWorld.cfg
      const genWorldResponse = await fetch('./server/maps/GenerateWorld.cfg');
      const genWorldData = await genWorldResponse.text();
      const genWorldEntries = this.parseCfgFile(genWorldData);
      
      // 2. Parse Locations.cfg
      const locationsResponse = await fetch('./server/maps/Locations.cfg');
      const locationsData = await locationsResponse.text();
      const locationsEntries = this.parseCfgFile(locationsData);
      
      // 3. Parse _maps.fos
      const mapsFosResponse = await fetch('./server/maps/_maps.fos');
      const mapsFosData = await mapsFosResponse.text();
      const mapsFosEntries = this.parseFosFile(mapsFosData);
      
      // 4. Parse PHX_maps.fos
      const phxMapsResponse = await fetch('./server/maps/PHX_maps.fos');
      const phxMapsData = await phxMapsResponse.text();
      const phxMapsEntries = this.parseFosFile(phxMapsData);
      
      // 5. Merge all map data
      const allMaps = new Map();
      
      // Add from GenerateWorld.cfg
      for (const [key, value] of genWorldEntries) {
        if (key.includes('worldmap') || key.includes('location')) {
          allMaps.set(key, { source: 'GenerateWorld.cfg', data: value });
        }
      }
      
      // Add from Locations.cfg
      for (const [key, value] of locationsEntries) {
        allMaps.set(key, { source: 'Locations.cfg', data: value });
      }
      
      // Add from .fos files
      for (const [key, value] of mapsFosEntries) {
        allMaps.set(key, { source: '_maps.fos', data: value });
      }
      
      for (const [key, value] of phxMapsEntries) {
        allMaps.set(key, { source: 'PHX_maps.fos', data: value });
      }
      
      this.index.maps = allMaps;
      console.log(`✅ Indexed ${allMaps.size} map entries`);
      
    } catch (error) {
      console.error('❌ Failed to index maps:', error);
    }
  }

  /**
   * Index global defines (processed last)
   */
  async indexDefines() {
    console.log('🔍 Indexing global defines...');
    
    try {
      const definesResponse = await fetch('./_defines.fos');
      const definesData = await definesResponse.text();
      const definesEntries = this.parseFosFile(definesData);
      
      this.index.defines = definesEntries;
      console.log(`✅ Indexed ${definesEntries.size} defines`);
      
    } catch (error) {
      console.error('❌ Failed to index defines:', error);
    }
  }

  /**
   * Cross-reference and validate all indexed data
   */
  validateIndex() {
    console.log('🔍 Validating index...');
    
    // Check for missing object names
    for (const [pid, obj] of this.index.objects) {
      if (!obj.hasName) {
        this.index.references.missingNames.push(pid);
      }
      if (!obj.hasDescription) {
        this.index.references.missingDescriptions.push(pid);
      }
    }
    
    // Check for duplicate PIDs across different types
    const allPids = new Map();
    
    for (const [pid, creature] of this.index.creatures) {
      if (allPids.has(pid)) {
        this.index.references.duplicatePids.push({
          pid,
          existing: allPids.get(pid),
          duplicate: { type: 'creature', name: creature.name }
        });
      } else {
        allPids.set(pid, { type: 'creature', name: creature.name });
      }
    }
    
    for (const [pid, item] of this.index.items) {
      if (allPids.has(pid)) {
        this.index.references.duplicatePids.push({
          pid,
          existing: allPids.get(pid),
          duplicate: { type: 'item', name: item.name }
        });
      } else {
        allPids.set(pid, { type: 'item', name: item.name });
      }
    }
    
    console.log('✅ Validation complete');
    console.log(`⚠️ Missing names: ${this.index.references.missingNames.length}`);
    console.log(`⚠️ Missing descriptions: ${this.index.references.missingDescriptions.length}`);
    console.log(`⚠️ Duplicate PIDs: ${this.index.references.duplicatePids.length}`);
  }

  /**
   * Get all indexed data
   */
  getIndex() {
    return {
      creatures: Object.fromEntries(this.index.creatures),
      items: Object.fromEntries(this.index.items),
      objects: Object.fromEntries(this.index.objects),
      maps: Object.fromEntries(this.index.maps),
      defines: Object.fromEntries(this.index.defines),
      references: this.index.references
    };
  }

  /**
   * Save index to JSON file
   */
  async saveIndex() {
    const indexData = this.getIndex();
    const blob = new Blob([JSON.stringify(indexData, null, 2)], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fonline-index.json';
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('💾 Index saved to fonline-index.json');
  }

  /**
   * List directory files (simplified - would need server implementation)
   */
  async listDirectory(dir, extension) {
    // This is a placeholder - in real implementation would need server API
    // For now, return empty array
    console.warn(`⚠️ Directory listing not implemented for ${dir}`);
    return [];
  }

  /**
   * Run complete indexing process
   */
  async runFullIndex() {
    console.log('🚀 Starting FOnline data indexing...');
    
    await this.indexCreatures();
    await this.indexItems();
    await this.indexObjects();
    await this.indexMaps();
    await this.indexDefines();
    
    this.validateIndex();
    await this.saveIndex();
    
    console.log('🎉 Indexing complete!');
  }
}

export default ProtoIndexer;
