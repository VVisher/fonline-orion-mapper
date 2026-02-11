/**
 * Enhanced FOnline Entity Parser
 * Implements Nexus heuristic detection matrix for comprehensive entity classification
 */

const fs = require('fs');
const path = require('path');

class EntityParser {
  constructor() {
    this.classificationRules = this.loadClassificationRules();
    this.nameResolution = new NameResolution();
  }

  /**
   * Parse a single .fopro file and extract entities
   */
  parseFoproFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const protoSections = this.extractProtoSections(content);
      
      return protoSections.map(section => ({
        proto_id: this.extractProtoId(section),
        name: this.nameResolution.resolveName(section),
        properties: this.extractProperties(section),
        classification: this.classifyEntity(section),
        source_file: filePath
      }));
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Extract all [Proto] sections from file content
   */
  extractProtoSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = [];
    let inProto = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '[Proto]') {
        if (inProto && currentSection.length > 0) {
          sections.push(currentSection);
        }
        currentSection = [];
        inProto = true;
      } else if (line.startsWith('[') && line !== '[Proto]') {
        if (inProto && currentSection.length > 0) {
          sections.push(currentSection);
        }
        currentSection = [];
        inProto = false;
      } else if (inProto && line) {
        currentSection.push(line);
      }
    }

    // Add last section if file ends with proto
    if (inProto && currentSection.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract ProtoId from proto section
   */
  extractProtoId(section) {
    for (const line of section) {
      const match = line.match(/^ProtoId\s*=\s*(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  /**
   * Extract all key-value properties from proto section
   */
  extractProperties(section) {
    const properties = {};
    
    for (const line of section) {
      // Skip comments and empty lines
      if (line.startsWith('//') || !line.trim()) continue;
      
      // Match key = value pattern
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        properties[key] = this.parseValue(value.trim());
      }
    }
    
    return properties;
  }

  /**
   * Parse value to appropriate type
   */
  parseValue(value) {
    // Remove comments
    value = value.split('//')[0].trim();
    
    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    // Handle numbers
    if (/^-?\d+$/.test(value)) {
      return parseInt(value);
    }
    
    // Handle floats
    if (/^-?\d+\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // Handle booleans
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    
    // Default to string
    return value;
  }

  /**
   * Apply Nexus heuristic detection matrix
   */
  classifyEntity(protoSection) {
    const props = this.extractProperties(protoSection);
    const detection = {
      primary_class: null,
      subclass: null,
      traits: [],
      confidence: 'high',
      conflicts: []
    };

    // Priority order from Nexus spec
    if (this.hasCritterIndicators(props)) {
      detection.primary_class = 'Critter';
      detection.confidence = 'high';
    } else if (this.hasItemIndicators(props)) {
      detection.primary_class = 'Item';
      detection.subclass = this.detectItemSubclass(props);
      detection.confidence = 'high';
    } else if (this.hasFunctionalIndicators(props)) {
      detection.primary_class = 'Functional';
      detection.subclass = this.detectFunctionalSubclass(props);
      detection.confidence = 'medium';
    } else {
      detection.primary_class = 'Scenery';
      detection.subclass = this.detectScenerySubclass(props);
      detection.confidence = 'low';
    }

    // Check for traits
    if (props.LightIntensity > 0) detection.traits.push('LightSource');
    if (props.IsNoBlock === 0) detection.traits.push('Blocker');
    if (props.IsCanPickUp === 1) detection.traits.push('Portable');
    if (props.IsCanUse === 1) detection.traits.push('Interactive');
    if (props.IsStackable === 1) detection.traits.push('Stackable');

    // Check for conflicts
    this.detectConflicts(props, detection);

    return detection;
  }

  /**
   * Check for critter indicators
   */
  hasCritterIndicators(props) {
    return !!(props.ST_HP || props.AiGroup || props.BaseType || 
             props.ST_STRENGTH || props.ST_PERCEPTION || props.ST_ENDURANCE ||
             props.ST_CHARISMA || props.ST_INTELLIGENCE || props.ST_AGILITY ||
             props.ST_LUCK);
  }

  /**
   * Check for item indicators
   */
  hasItemIndicators(props) {
    return !!(props.Weight > 0 || props.Cost > 0 || props.PicInv || 
             props.IsCanPickUp === 1);
  }

  /**
   * Check for functional indicators
   */
  hasFunctionalIndicators(props) {
    return !!(props.LightIntensity > 0 || props.Type === 'Wall' || 
             props.Type === 'Roof' || props.IsWall === 1);
  }

  /**
   * Detect item subclass
   */
  detectItemSubclass(props) {
    if (this.hasWeaponProperties(props)) return 'Weapon';
    if (this.hasArmorProperties(props)) return 'Armor';
    if (this.hasConsumableProperties(props)) return 'Consumable';
    if (this.hasContainerProperties(props)) return 'Container';
    if (this.hasAmmoProperties(props)) return 'Ammo';
    return 'Generic';
  }

  /**
   * Detect functional subclass
   */
  detectFunctionalSubclass(props) {
    if (props.LightIntensity > 0) return 'LightSource';
    if (props.Type === 'Wall' || props.IsWall === 1) return 'Wall';
    if (props.Type === 'Roof') return 'Roof';
    return 'Generic';
  }

  /**
   * Detect scenery subclass
   */
  detectScenerySubclass(props) {
    if (props.IsNoBlock === 0) return 'Blocker';
    if (props.IsCanUse === 1 || props.ScriptName) return 'Interactive';
    if (props.Door_ || props.IsCanOpen === 1) return 'Door';
    return 'Generic';
  }

  /**
   * Check for weapon properties
   */
  hasWeaponProperties(props) {
    return !!(props.DamageType || props.DamageMin || props.DamageMax ||
             props.Weapon_Type || props.Weapon_Perk || props.Weapon_Anim);
  }

  /**
   * Check for armor properties
   */
  hasArmorProperties(props) {
    return !!(props.ArmorClass || props.DT_Normal || props.DT_Laser ||
             props.DT_Fire || props.DT_Plasma || props.DT_Explosion ||
             props.Armor_CrTypeMale || props.Armor_CrTypeFemale);
  }

  /**
   * Check for consumable properties
   */
  hasConsumableProperties(props) {
    return !!(props.Deterioration || props.FoodPoints || props.DrugEffect ||
             props.StartScript && props.StartScript.includes('use_'));
  }

  /**
   * Check for container properties
   */
  hasContainerProperties(props) {
    return !!(props.Container_Volume || props.Container_CannotPickUp ||
             props.IsCanOpen === 1);
  }

  /**
   * Check for ammo properties
   */
  hasAmmoProperties(props) {
    return !!(props.IsStackable === 1 || props.AmmoType || props.Ammo_Caliber);
  }

  /**
   * Detect classification conflicts
   */
  detectConflicts(props, detection) {
    const conflicts = [];
    
    // Check for multi-class entities
    if (detection.primary_class === 'Item' && detection.traits.includes('LightSource')) {
      conflicts.push('Has both Item and LightSource properties');
    }
    
    if (detection.primary_class === 'Scenery' && props.IsCanPickUp === 1) {
      conflicts.push('Has both Scenery and Item properties');
    }
    
    detection.conflicts = conflicts;
    
    // Adjust confidence based on conflicts
    if (conflicts.length > 0) {
      detection.confidence = 'medium';
    }
  }

  /**
   * Load classification rules from database
   */
  loadClassificationRules() {
    // This would load from the entity_types table in a real implementation
    // For now, return hardcoded rules
    return {
      critter: ['ST_HP', 'AiGroup', 'BaseType'],
      item: ['Weight', 'Cost', 'IsCanPickUp'],
      scenery: ['PicMap'],
      functional: ['LightIntensity', 'Type']
    };
  }
}

/**
 * Name Resolution System
 * Implements the "Missing Name" waterfall from Nexus spec
 */
class NameResolution {
  resolveName(protoSection) {
    const props = this.extractProperties(protoSection);
    const protoId = this.extractProtoId(protoSection);
    
    // Step 1: Check if name is already in properties
    if (props.Name && props.Name.trim()) {
      return { name: props.Name, source: 'PROPERTIES' };
    }
    
    // Step 2: Check MSG files (would be implemented with actual MSG parsing)
    const msgName = this.checkMsgFiles(protoId);
    if (msgName) {
      return { name: msgName, source: 'MSG_FILE' };
    }
    
    // Step 3: Check script defines
    const defineName = this.checkScriptDefines(protoId);
    if (defineName) {
      return { name: defineName, source: 'SCRIPT_DEFINE' };
    }
    
    // Step 4: Check PicMap/PicInv filename
    const fileName = this.checkArtFilename(props);
    if (fileName) {
      return { name: fileName, source: 'FILENAME' };
    }
    
    // Step 5: Final fallback
    return { name: `Unknown Entity #${protoId}`, source: 'UNKNOWN' };
  }

  extractProperties(protoSection) {
    const properties = {};
    for (const line of protoSection) {
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        const [, key, value] = match;
        properties[key] = value.trim();
      }
    }
    return properties;
  }

  extractProtoId(protoSection) {
    for (const line of protoSection) {
      const match = line.match(/^ProtoId\s*=\s*(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    return null;
  }

  checkMsgFiles(protoId) {
    // TODO: Implement actual MSG file parsing
    // For now, return null
    return null;
  }

  checkScriptDefines(protoId) {
    // TODO: Implement script define lookup
    // For now, return null
    return null;
  }

  checkArtFilename(props) {
    const picMap = props.PicMap || props.PicInv;
    if (picMap) {
      // Extract filename without extension and path
      const filename = path.basename(picMap, '.frm');
      // Convert to title case
      return filename.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }
    return null;
  }
}

module.exports = { EntityParser, NameResolution };
