/**
 * Process critters/*.fopro with WorldEditor semantic categories
 * Movement II: Allegro - Advanced Proto Processing
 */

const fs = require('fs');
const path = require('path');
const { EntityParser } = require('../src/database/entityParser.cjs');

class CritterFoproProcessor {
  constructor() {
    this.entityParser = new EntityParser();
    this.worldEditorCategories = {
      aliens: { keywords: ['alien', 'extraterrestrial', 'xeno', 'alienoid'], traits: ['non_human', 'hostile'] },
      brahmins: { keywords: ['brahmin', 'cow', 'bull', 'cattle'], traits: ['animal', 'peaceful', 'domestic'] },
      deathclaws: { keywords: ['deathclaw', 'claw', 'death'], traits: ['monster', 'hostile', 'dangerous'] },
      dogs: { keywords: ['dog', 'canine', 'hound', 'mutt', 'puppy'], traits: ['animal', 'friendly', 'companion'] },
      geckos: { keywords: ['gecko', 'lizard', 'golden', 'fire'], traits: ['animal', 'neutral'] },
      ghouls: { keywords: ['ghoul', 'zombie', 'undead', 'glowing'], traits: ['humanoid', 'radiated', 'neutral'] },
      insects: { keywords: ['ant', 'roach', 'scorpion', 'bee', 'wasp', 'centaur', 'giant'], traits: ['monster', 'hostile', 'swarm'] },
      mutants: { keywords: ['mutant', 'supermutant', 'floater', 'gnat', 'master'], traits: ['humanoid', 'hostile', 'enhanced'] },
      plants: { keywords: ['spore', 'plant', 'fungus', 'tree', 'cactus'], traits: ['plant', 'stationary', 'neutral'] },
      radscorpions: { keywords: ['radscorpion', 'scorpion', 'rad'], traits: ['monster', 'hostile', 'radiated'] },
      rats: { keywords: ['rat', 'rodent', 'giant', 'mole'], traits: ['animal', 'hostile', 'small'] },
      robots: { keywords: ['robot', 'droid', 'sentry', 'turret', 'eyebot', 'protectron'], traits: ['machine', 'programmed', 'neutral'] },
      bandits: { keywords: ['bandit', 'raider', 'thug', 'pirate', 'looter'], traits: ['humanoid', 'hostile', 'criminal'] },
      citizens: { keywords: ['citizen', 'civilian', 'settler', 'farmer'], traits: ['humanoid', 'peaceful', 'common'] },
      guards: { keywords: ['guard', 'sheriff', 'officer', 'police', 'soldier'], traits: ['humanoid', 'neutral', 'lawful'] },
      merchants: { keywords: ['merchant', 'trader', 'vendor', 'shopkeeper', 'dealer'], traits: ['humanoid', 'peaceful', 'commercial'] },
      slavers: { keywords: ['slaver', 'slaverboss', 'master'], traits: ['humanoid', 'hostile', 'criminal'] },
      slaves: { keywords: ['slave', 'prisoner', 'captive'], traits: ['humanoid', 'peaceful', 'helpless'] },
      tribals: { keywords: ['tribal', 'tribesman', 'native', 'savage'], traits: ['humanoid', 'neutral', 'primitive'] },
      vips: { keywords: ['vip', 'boss', 'leader', 'elder', 'chief'], traits: ['humanoid', 'neutral', 'important'] },
      companions: { keywords: ['companion', 'follower', 'party', 'ally'], traits: ['humanoid', 'friendly', 'helpful'] },
      strangers: { keywords: ['stranger', 'wanderer', 'traveler', 'drifter'], traits: ['humanoid', 'neutral', 'unknown'] }
    };
    this.processedCritters = [];
  }

  /**
   * Process all critter .fopro files in a directory
   */
  async processCritterDirectory(directoryPath) {
    try {
      if (!fs.existsSync(directoryPath)) {
        console.log(`Critter directory not found: ${directoryPath}`);
        return this.generateFallbackCritters();
      }

      const foproFiles = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.fopro'))
        .map(file => path.join(directoryPath, file));

      console.log(`Found ${foproFiles.length} .fopro files in critter directory`);

      for (const filePath of foproFiles) {
        await this.processCritterFile(filePath);
      }

      console.log(`Processed ${this.processedCritters.length} critter entities`);
      return this.processedCritters;
    } catch (error) {
      console.error(`Error processing critter directory: ${error.message}`);
      return this.generateFallbackCritters();
    }
  }

  /**
   * Process individual critter .fopro file
   */
  async processCritterFile(filePath) {
    try {
      const entities = this.entityParser.parseFoproFile(filePath);
      
      for (const entity of entities) {
        // Only process critter entities
        if (entity.classification.primary_class === 'Critter') {
          const processedEntity = this.enhanceCritterClassification(entity, filePath);
          this.processedCritters.push(processedEntity);
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
    }
  }

  /**
   * Enhance critter classification with WorldEditor semantic categories
   */
  enhanceCritterClassification(entity, filePath) {
    const enhanced = { ...entity };
    
    // Apply WorldEditor semantic classification
    enhanced.worldEditorCategory = this.classifyWithWorldEditor(entity);
    enhanced.traits = this.extractCritterTraits(entity);
    enhanced.behavior = this.determineBehavior(entity);
    enhanced.compatibility = this.assessCompatibility(entity);
    
    // Add processing metadata
    enhanced.processing = {
      source_file: filePath,
      processed_at: new Date().toISOString(),
      confidence: this.calculateConfidence(entity)
    };

    return enhanced;
  }

  /**
   * Classify entity using WorldEditor semantic patterns
   */
  classifyWithWorldEditor(entity) {
    const searchText = this.buildSearchText(entity);
    
    for (const [category, config] of Object.entries(this.worldEditorCategories)) {
      for (const keyword of config.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return {
            category: category,
            confidence: 'high',
            matched_keyword: keyword,
            traits: config.traits
          };
        }
      }
    }
    
    return {
      category: 'unknown',
      confidence: 'low',
      matched_keyword: null,
      traits: ['unclassified']
    };
  }

  /**
   * Build searchable text from entity properties
   */
  buildSearchText(entity) {
    const textParts = [
      entity.name?.name || '',
      entity.properties?.Name || '',
      entity.properties?.ScriptName || '',
      path.basename(entity.source_file || '', '.fopro')
    ];
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * Extract specific critter traits
   */
  extractCritterTraits(entity) {
    const traits = [];
    const props = entity.properties || {};
    
    // Combat traits
    if (props.AiGroup) {
      traits.push(`ai_${props.AiGroup.toLowerCase()}`);
    }
    
    // Physical traits
    if (props.ST_STRENGTH > 7) traits.push('strong');
    if (props.ST_PERCEPTION > 7) traits.push('perceptive');
    if (props.ST_ENDURANCE > 7) traits.push('tough');
    if (props.ST_CHARISMA > 7) traits.push('charismatic');
    if (props.ST_INTELLIGENCE > 7) traits.push('intelligent');
    if (props.ST_AGILITY > 7) traits.push('agile');
    if (props.ST_LUCK > 7) traits.push('lucky');
    
    // Behavioral traits
    if (props.IsNoBlock === 0) traits.push('blocker');
    if (props.IsCanTalk === 1) traits.push('talkable');
    if (props.IsCanUse === 1) traits.push('usable');
    if (props.IsCanPickUp === 1) traits.push('pickable');
    
    return traits;
  }

  /**
   * Determine creature behavior based on properties
   */
  determineBehavior(entity) {
    const props = entity.properties || {};
    const behavior = {
      hostility: 'neutral',
      intelligence: 'animal',
      social: 'solitary',
      combat_style: 'none'
    };
    
    // Determine hostility
    if (props.AiGroup) {
      const aiGroup = props.AiGroup.toLowerCase();
      if (aiGroup.includes('aggressive') || aiGroup.includes('hostile')) {
        behavior.hostility = 'hostile';
      } else if (aiGroup.includes('friendly') || aiGroup.includes('peaceful')) {
        behavior.hostility = 'friendly';
      }
    }
    
    // Determine intelligence
    if (props.ST_INTELLIGENCE >= 5) {
      behavior.intelligence = 'intelligent';
    } else if (props.ST_INTELLIGENCE >= 3) {
      behavior.intelligence = 'semi_intelligent';
    }
    
    // Determine social behavior
    if (props.IsCanTalk === 1) {
      behavior.social = 'social';
    }
    
    // Determine combat style
    if (props.DamageMin > 0 || props.DamageMax > 0) {
      behavior.combat_style = 'melee';
    }
    
    return behavior;
  }

  /**
   * Assess compatibility with player/factions
   */
  assessCompatibility(entity) {
    const compatibility = {
      player_friendly: false,
      npc_friendly: false,
      faction_neutral: true,
      trade_possible: false,
      companion_possible: false
    };
    
    const props = entity.properties || {};
    const category = entity.worldEditorCategory?.category || 'unknown';
    
    // Set compatibility based on category
    if (['citizens', 'merchants', 'guards', 'companions'].includes(category)) {
      compatibility.player_friendly = true;
      compatibility.npc_friendly = true;
    }
    
    if (['merchants', 'citizens'].includes(category)) {
      compatibility.trade_possible = true;
    }
    
    if (['companions', 'strangers', 'citizens'].includes(category)) {
      compatibility.companion_possible = true;
    }
    
    if (['bandits', 'slavers', 'mutants', 'deathclaws'].includes(category)) {
      compatibility.player_friendly = false;
      compatibility.faction_neutral = false;
    }
    
    return compatibility;
  }

  /**
   * Calculate classification confidence
   */
  calculateConfidence(entity) {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for clear indicators
    if (entity.properties?.ProtoId) confidence += 0.2;
    if (entity.properties?.Name) confidence += 0.1;
    if (entity.properties?.ScriptName) confidence += 0.1;
    if (entity.worldEditorCategory?.confidence === 'high') confidence += 0.2;
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Generate fallback critter data if no files found
   */
  generateFallbackCritters() {
    console.log('Generating fallback critter data...');
    
    const fallbackCritters = [
      {
        proto_id: 10001,
        name: { name: 'Human Citizen', source: 'FALLBACK' },
        properties: {
          ProtoId: 10001,
          Name: 'Human Citizen',
          ST_STRENGTH: 5,
          ST_PERCEPTION: 5,
          ST_ENDURANCE: 5,
          ST_CHARISMA: 5,
          ST_INTELLIGENCE: 5,
          ST_AGILITY: 5,
          ST_LUCK: 5,
          AiGroup: 'Generic',
          IsCanTalk: 1
        },
        classification: { primary_class: 'Critter', confidence: 'high' },
        worldEditorCategory: { category: 'citizens', confidence: 'high', traits: ['humanoid', 'peaceful', 'common'] },
        traits: ['ai_generic', 'talkable'],
        behavior: { hostility: 'neutral', intelligence: 'intelligent', social: 'social', combat_style: 'none' },
        compatibility: { player_friendly: true, npc_friendly: true, faction_neutral: true, trade_possible: true, companion_possible: false },
        source_file: 'fallback'
      },
      {
        proto_id: 10002,
        name: { name: 'Deathclaw', source: 'FALLBACK' },
        properties: {
          ProtoId: 10002,
          Name: 'Deathclaw',
          ST_STRENGTH: 10,
          ST_PERCEPTION: 8,
          ST_ENDURANCE: 9,
          ST_CHARISMA: 1,
          ST_INTELLIGENCE: 2,
          ST_AGILITY: 8,
          ST_LUCK: 4,
          AiGroup: 'Aggressive',
          DamageMin: 10,
          DamageMax: 20
        },
        classification: { primary_class: 'Critter', confidence: 'high' },
        worldEditorCategory: { category: 'deathclaws', confidence: 'high', traits: ['monster', 'hostile', 'dangerous'] },
        traits: ['ai_aggressive', 'strong', 'tough'],
        behavior: { hostility: 'hostile', intelligence: 'semi_intelligent', social: 'solitary', combat_style: 'melee' },
        compatibility: { player_friendly: false, npc_friendly: false, faction_neutral: false, trade_possible: false, companion_possible: false },
        source_file: 'fallback'
      }
    ];
    
    this.processedCritters = fallbackCritters;
    return this.processedCritters;
  }

  /**
   * Get statistics about processed critters
   */
  getStatistics() {
    const stats = {
      total_critters: this.processedCritters.length,
      categories: {},
      traits: {},
      behaviors: { hostility: {}, intelligence: {}, social: {} }
    };
    
    this.processedCritters.forEach(critter => {
      // Count categories
      const category = critter.worldEditorCategory?.category || 'unknown';
      stats.categories[category] = (stats.categories[category] || 0) + 1;
      
      // Count traits
      critter.traits.forEach(trait => {
        stats.traits[trait] = (stats.traits[trait] || 0) + 1;
      });
      
      // Count behaviors
      if (critter.behavior) {
        Object.keys(critter.behavior).forEach(key => {
          const value = critter.behavior[key];
          if (value && stats.behaviors[key]) {
            stats.behaviors[key][value] = (stats.behaviors[key][value] || 0) + 1;
          }
        });
      }
    });
    
    return stats;
  }

  /**
   * Export processed critters for database integration
   */
  exportForDatabase() {
    return {
      source: 'critter_fopros',
      processing_date: new Date().toISOString(),
      statistics: this.getStatistics(),
      critters: this.processedCritters.map(critter => ({
        proto_id: critter.proto_id,
        name: critter.name,
        properties: critter.properties,
        classification: critter.classification,
        worldEditorCategory: critter.worldEditorCategory,
        traits: critter.traits,
        behavior: critter.behavior,
        compatibility: critter.compatibility,
        processing: critter.processing
      }))
    };
  }
}

// Main execution
if (require.main === module) {
  const processor = new CritterFoproProcessor();
  
  // Look for critter directories
  const possiblePaths = [
    path.join(__dirname, '../legacy/proto/critters'),
    path.join(__dirname, '../legacy/database/proto/critters'),
    path.join(__dirname, '../data/critters')
  ];
  
  let critterPath = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      critterPath = possiblePath;
      break;
    }
  }
  
  if (critterPath) {
    console.log(`Processing critter .fopro files in: ${critterPath}`);
    processor.processCritterDirectory(critterPath).then(() => {
      const stats = processor.getStatistics();
      console.log('\n=== Critter Processing Results ===');
      console.log(`Total critters processed: ${stats.total_critters}`);
      
      console.log('\nCategories:');
      Object.entries(stats.categories).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });
      
      console.log('\nTop traits:');
      Object.entries(stats.traits)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([trait, count]) => {
          console.log(`  ${trait}: ${count}`);
        });
      
      // Export for database
      const exportData = processor.exportForDatabase();
      fs.writeFileSync(
        path.join(__dirname, '../data/critter-fopros-export.json'),
        JSON.stringify(exportData, null, 2)
      );
      console.log(`\nExported critter data to data/critter-fopros-export.json`);
    });
  } else {
    console.log('Critter directory not found, using fallback data');
    processor.generateFallbackCritters();
    const stats = processor.getStatistics();
    console.log(`Generated ${stats.total_critters} fallback critters`);
  }
}

module.exports = CritterFoproProcessor;
