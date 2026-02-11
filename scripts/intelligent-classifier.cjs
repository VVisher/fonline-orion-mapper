/**
 * Apply intelligent classification using WorldEditor patterns
 * Movement II: Allegro - Advanced Proto Processing
 */

const fs = require('fs');
const path = require('path');

class IntelligentClassifier {
  constructor() {
    this.worldEditorPatterns = this.loadWorldEditorPatterns();
    this.classificationRules = this.loadClassificationRules();
    this.confidenceThresholds = {
      high: 0.8,
      medium: 0.5,
      low: 0.2
    };
  }

  /**
   * Load WorldEditor semantic patterns
   */
  loadWorldEditorPatterns() {
    return {
      // Creature patterns with confidence weights
      creatures: {
        aliens: {
          keywords: ['alien', 'extraterrestrial', 'xeno', 'alienoid', 'ufo'],
          properties: ['non_human', 'hostile', 'radiation_resistant'],
          weight: 0.9,
          exclusions: ['human', 'earth', 'native']
        },
        brahmins: {
          keywords: ['brahmin', 'cow', 'bull', 'cattle', 'bovine'],
          properties: ['animal', 'peaceful', 'domestic', 'two_headed'],
          weight: 0.95,
          exclusions: ['wild', 'hostile']
        },
        deathclaws: {
          keywords: ['deathclaw', 'claw', 'death', 'killer'],
          properties: ['monster', 'hostile', 'dangerous', 'powerful'],
          weight: 0.95,
          exclusions: ['friendly', 'tamed']
        },
        dogs: {
          keywords: ['dog', 'canine', 'hound', 'mutt', 'puppy', 'wolf'],
          properties: ['animal', 'friendly', 'companion', 'loyal'],
          weight: 0.9,
          exclusions: ['wild', 'feral']
        },
        geckos: {
          keywords: ['gecko', 'lizard', 'golden', 'fire', 'silver'],
          properties: ['animal', 'neutral', 'small', 'fast'],
          weight: 0.85,
          exclusions: ['large', 'hostile']
        },
        ghouls: {
          keywords: ['ghoul', 'zombie', 'undead', 'glowing', 'feral'],
          properties: ['humanoid', 'radiated', 'long_lived', 'decayed'],
          weight: 0.9,
          exclusions: ['healthy', 'normal']
        },
        insects: {
          keywords: ['ant', 'roach', 'scorpion', 'bee', 'wasp', 'centaur', 'giant'],
          properties: ['monster', 'hostile', 'swarm', 'exoskeleton'],
          weight: 0.8,
          exclusions: ['friendly', 'tame']
        },
        mutants: {
          keywords: ['mutant', 'supermutant', 'floater', 'gnat', 'master', 'fev'],
          properties: ['humanoid', 'hostile', 'enhanced', 'strong'],
          weight: 0.9,
          exclusions: ['normal', 'human']
        },
        plants: {
          keywords: ['spore', 'plant', 'fungus', 'tree', 'cactus', 'vine'],
          properties: ['plant', 'stationary', 'neutral', 'photosynthesis'],
          weight: 0.85,
          exclusions: ['mobile', 'animal']
        },
        radscorpions: {
          keywords: ['radscorpion', 'scorpion', 'rad', 'radioactive'],
          properties: ['monster', 'hostile', 'radiated', 'poisonous'],
          weight: 0.95,
          exclusions: ['normal', 'friendly']
        },
        rats: {
          keywords: ['rat', 'rodent', 'giant', 'mole', 'vermin'],
          properties: ['animal', 'hostile', 'small', 'fast'],
          weight: 0.8,
          exclusions: ['large', 'friendly']
        },
        robots: {
          keywords: ['robot', 'droid', 'sentry', 'turret', 'eyebot', 'protectron'],
          properties: ['machine', 'programmed', 'neutral', 'metal'],
          weight: 0.95,
          exclusions: ['organic', 'biological']
        },
        bandits: {
          keywords: ['bandit', 'raider', 'thug', 'pirate', 'looter', 'marauder'],
          properties: ['humanoid', 'hostile', 'criminal', 'aggressive'],
          weight: 0.9,
          exclusions: ['lawful', 'peaceful']
        },
        citizens: {
          keywords: ['citizen', 'civilian', 'settler', 'farmer', 'worker'],
          properties: ['humanoid', 'peaceful', 'common', 'productive'],
          weight: 0.85,
          exclusions: ['military', 'criminal']
        },
        guards: {
          keywords: ['guard', 'sheriff', 'officer', 'police', 'soldier', 'protector'],
          properties: ['humanoid', 'neutral', 'lawful', 'armed'],
          weight: 0.9,
          exclusions: ['criminal', 'hostile']
        },
        merchants: {
          keywords: ['merchant', 'trader', 'vendor', 'shopkeeper', 'dealer'],
          properties: ['humanoid', 'peaceful', 'commercial', 'wealthy'],
          weight: 0.9,
          exclusions: ['hostile', 'non_trade']
        },
        slavers: {
          keywords: ['slaver', 'slaverboss', 'master', 'captor'],
          properties: ['humanoid', 'hostile', 'criminal', 'cruel'],
          weight: 0.95,
          exclusions: ['abolitionist', 'friendly']
        },
        slaves: {
          keywords: ['slave', 'prisoner', 'captive', 'servant'],
          properties: ['humanoid', 'peaceful', 'helpless', 'oppressed'],
          weight: 0.9,
          exclusions: ['free', 'master']
        },
        tribals: {
          keywords: ['tribal', 'tribesman', 'native', 'savage', 'primitive'],
          properties: ['humanoid', 'neutral', 'primitive', 'spiritual'],
          weight: 0.85,
          exclusions: ['modern', 'technological']
        },
        vips: {
          keywords: ['vip', 'boss', 'leader', 'elder', 'chief', 'important'],
          properties: ['humanoid', 'neutral', 'important', 'powerful'],
          weight: 0.8,
          exclusions: ['common', 'ordinary']
        },
        companions: {
          keywords: ['companion', 'follower', 'party', 'ally', 'friend'],
          properties: ['humanoid', 'friendly', 'helpful', 'loyal'],
          weight: 0.9,
          exclusions: ['hostile', 'enemy']
        },
        strangers: {
          keywords: ['stranger', 'wanderer', 'traveler', 'drifter', 'unknown'],
          properties: ['humanoid', 'neutral', 'unknown', 'mysterious'],
          weight: 0.7,
          exclusions: ['known', 'familiar']
        }
      },

      // Item patterns
      items: {
        weapons: {
          keywords: ['gun', 'rifle', 'pistol', 'blade', 'sword', 'axe', 'weapon'],
          properties: ['damage', 'weapon_type', 'ammo_type', 'range'],
          weight: 0.95,
          exclusions: ['tool', 'peaceful']
        },
        armor: {
          keywords: ['armor', 'helmet', 'vest', 'plate', 'shield', 'protection'],
          properties: ['armor_class', 'damage_resistance', 'dt_', 'dr_'],
          weight: 0.95,
          exclusions: ['clothing', 'fashion']
        },
        ammunition: {
          keywords: ['ammo', 'bullet', 'shell', 'cartridge', 'round'],
          properties: ['ammo_type', 'caliber', 'stackable', 'quantity'],
          weight: 0.9,
          exclusions: ['weapon', 'standalone']
        },
        medicine: {
          keywords: ['med', 'heal', 'stimpack', 'antidote', 'drug', 'medicine'],
          properties: ['healing', 'effect', 'consumable', 'medical'],
          weight: 0.9,
          exclusions: ['food', 'poison']
        },
        food: {
          keywords: ['food', 'eat', 'drink', 'meal', 'bread', 'meat'],
          properties: ['food_points', 'consumable', 'edible', 'nutrition'],
          weight: 0.85,
          exclusions: ['medicine', 'poison']
        },
        tools: {
          keywords: ['tool', 'repair', 'kit', 'multitool', 'equipment'],
          properties: ['tool', 'repair', 'skill', 'usable'],
          weight: 0.8,
          exclusions: ['weapon', 'consumable']
        },
        containers: {
          keywords: ['container', 'bag', 'box', 'chest', 'backpack'],
          properties: ['container_volume', 'storage', 'capacity', 'holdable'],
          weight: 0.9,
          exclusions: ['weapon', 'consumable']
        },
        keys: {
          keywords: ['key', 'lock', 'access', 'door', 'security'],
          properties: ['key', 'lock_id', 'access', 'unique'],
          weight: 0.95,
          exclusions: ['weapon', 'tool']
        },
        books: {
          keywords: ['book', 'manual', 'guide', 'skill', 'knowledge'],
          properties: ['skill', 'learning', 'readable', 'educational'],
          weight: 0.85,
          exclusions: ['weapon', 'consumable']
        },
        misc: {
          keywords: ['misc', 'item', 'object', 'thing', 'various'],
          properties: ['misc', 'general', 'uncategorized'],
          weight: 0.5,
          exclusions: []
        }
      }
    };
  }

  /**
   * Load classification rules
   */
  loadClassificationRules() {
    return {
      // Priority order for classification
      priority: ['creatures', 'items', 'scenery', 'functional'],
      
      // Confidence calculation rules
      confidence: {
        keyword_match: 0.3,
        property_match: 0.4,
        exclusion_penalty: 0.5,
        name_bonus: 0.1,
        script_bonus: 0.1
      },
      
      // Conflict resolution rules
      conflicts: {
        multiple_categories: 'choose_highest_confidence',
        equal_confidence: 'use_priority_order',
        low_confidence: 'mark_as_uncertain'
      }
    };
  }

  /**
   * Apply intelligent classification to entity
   */
  classifyEntity(entity) {
    const classification = {
      primary_category: null,
      secondary_category: null,
      worldEditor_category: null,
      confidence: 0.0,
      reasoning: [],
      conflicts: [],
      metadata: {
        processed_at: new Date().toISOString(),
        algorithm: 'world_editor_intelligent_v2'
      }
    };

    // Determine if this is a creature or item
    const entityType = this.determineEntityType(entity);
    
    if (entityType === 'creature') {
      return this.classifyCreature(entity, classification);
    } else if (entityType === 'item') {
      return this.classifyItem(entity, classification);
    } else {
      return this.classifyGeneric(entity, classification);
    }
  }

  /**
   * Determine entity type (creature vs item vs other)
   */
  determineEntityType(entity) {
    const props = entity.properties || {};
    
    // Check for creature indicators
    if (props.ST_HP || props.AiGroup || props.BaseType || 
        props.ST_STRENGTH || props.ST_PERCEPTION || props.ST_ENDURANCE ||
        props.ST_CHARISMA || props.ST_INTELLIGENCE || props.ST_AGILITY ||
        props.ST_LUCK) {
      return 'creature';
    }
    
    // Check for item indicators
    if (props.Weight > 0 || props.Cost > 0 || props.PicInv || 
        props.IsCanPickUp === 1) {
      return 'item';
    }
    
    return 'generic';
  }

  /**
   * Classify creature using WorldEditor patterns
   */
  classifyCreature(entity, classification) {
    const searchText = this.buildSearchText(entity);
    const props = entity.properties || {};
    const patterns = this.worldEditorPatterns.creatures;
    
    let bestMatch = null;
    let highestConfidence = 0.0;
    
    for (const [category, pattern] of Object.entries(patterns)) {
      const confidence = this.calculatePatternConfidence(searchText, props, pattern);
      
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          category: category,
          confidence: confidence,
          pattern: pattern,
          reasoning: this.generateReasoning(searchText, props, pattern)
        };
      }
    }
    
    if (bestMatch) {
      classification.primary_category = 'creature';
      classification.worldEditor_category = bestMatch.category;
      classification.confidence = bestMatch.confidence;
      classification.reasoning = bestMatch.reasoning;
      
      // Add secondary classification if confidence is moderate
      if (bestMatch.confidence < this.confidenceThresholds.high) {
        classification.secondary_category = this.findSecondaryCategory(searchText, props, patterns, bestMatch.category);
      }
    }
    
    return classification;
  }

  /**
   * Classify item using WorldEditor patterns
   */
  classifyItem(entity, classification) {
    const searchText = this.buildSearchText(entity);
    const props = entity.properties || {};
    const patterns = this.worldEditorPatterns.items;
    
    let bestMatch = null;
    let highestConfidence = 0.0;
    
    for (const [category, pattern] of Object.entries(patterns)) {
      const confidence = this.calculatePatternConfidence(searchText, props, pattern);
      
      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          category: category,
          confidence: confidence,
          pattern: pattern,
          reasoning: this.generateReasoning(searchText, props, pattern)
        };
      }
    }
    
    if (bestMatch) {
      classification.primary_category = 'item';
      classification.worldEditor_category = bestMatch.category;
      classification.confidence = bestMatch.confidence;
      classification.reasoning = bestMatch.reasoning;
    }
    
    return classification;
  }

  /**
   * Classify generic entities
   */
  classifyGeneric(entity, classification) {
    classification.primary_category = 'generic';
    classification.worldEditor_category = 'unknown';
    classification.confidence = 0.1;
    classification.reasoning = ['No specific patterns matched'];
    return classification;
  }

  /**
   * Calculate confidence score for a pattern match
   */
  calculatePatternConfidence(searchText, props, pattern) {
    let confidence = 0.0;
    const rules = this.classificationRules.confidence;
    
    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      confidence += rules.keyword_match * (keywordMatches.length / pattern.keywords.length);
    }
    
    // Check property matches
    const propertyMatches = pattern.properties.filter(prop => 
      Object.keys(props).some(key => key.toLowerCase().includes(prop.toLowerCase()))
    );
    if (propertyMatches.length > 0) {
      confidence += rules.property_match * (propertyMatches.length / pattern.properties.length);
    }
    
    // Check for exclusions
    const exclusionMatches = pattern.exclusions.filter(exclusion => 
      searchText.includes(exclusion.toLowerCase())
    );
    if (exclusionMatches.length > 0) {
      confidence -= rules.exclusion_penalty * exclusionMatches.length;
    }
    
    // Apply pattern weight
    confidence *= pattern.weight;
    
    // Ensure confidence is within bounds
    return Math.max(0.0, Math.min(1.0, confidence));
  }

  /**
   * Generate reasoning for classification
   */
  generateReasoning(searchText, props, pattern) {
    const reasoning = [];
    
    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
    if (keywordMatches.length > 0) {
      reasoning.push(`Matched keywords: ${keywordMatches.join(', ')}`);
    }
    
    // Check property matches
    const propertyMatches = pattern.properties.filter(prop => 
      Object.keys(props).some(key => key.toLowerCase().includes(prop.toLowerCase()))
    );
    if (propertyMatches.length > 0) {
      reasoning.push(`Matched properties: ${propertyMatches.join(', ')}`);
    }
    
    // Check exclusions
    const exclusionMatches = pattern.exclusions.filter(exclusion => 
      searchText.includes(exclusion.toLowerCase())
    );
    if (exclusionMatches.length > 0) {
      reasoning.push(`Excluded by: ${exclusionMatches.join(', ')}`);
    }
    
    return reasoning;
  }

  /**
   * Build searchable text from entity
   */
  buildSearchText(entity) {
    const textParts = [
      entity.name?.name || '',
      entity.properties?.Name || '',
      entity.properties?.ScriptName || '',
      entity.properties?.Description || '',
      path.basename(entity.source_file || '', '.fopro')
    ];
    
    return textParts.join(' ').toLowerCase();
  }

  /**
   * Find secondary category for uncertain classifications
   */
  findSecondaryCategory(searchText, props, patterns, primaryCategory) {
    const secondaryMatches = [];
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (category === primaryCategory) continue;
      
      const confidence = this.calculatePatternConfidence(searchText, props, pattern);
      if (confidence > this.confidenceThresholds.medium) {
        secondaryMatches.push({ category, confidence });
      }
    }
    
    // Sort by confidence and return the best match
    secondaryMatches.sort((a, b) => b.confidence - a.confidence);
    return secondaryMatches.length > 0 ? secondaryMatches[0].category : null;
  }

  /**
   * Batch classify multiple entities
   */
  batchClassify(entities) {
    const results = [];
    const statistics = {
      total: entities.length,
      high_confidence: 0,
      medium_confidence: 0,
      low_confidence: 0,
      categories: {},
      processing_time: Date.now()
    };
    
    for (const entity of entities) {
      const classification = this.classifyEntity(entity);
      results.push({
        ...entity,
        classification: classification
      });
      
      // Update statistics
      if (classification.confidence >= this.confidenceThresholds.high) {
        statistics.high_confidence++;
      } else if (classification.confidence >= this.confidenceThresholds.medium) {
        statistics.medium_confidence++;
      } else {
        statistics.low_confidence++;
      }
      
      const category = classification.worldEditor_category || 'unknown';
      statistics.categories[category] = (statistics.categories[category] || 0) + 1;
    }
    
    statistics.processing_time = Date.now() - statistics.processing_time;
    
    return {
      results: results,
      statistics: statistics
    };
  }

  /**
   * Export classification results
   */
  exportResults(batchResults) {
    return {
      metadata: {
        algorithm: 'world_editor_intelligent_v2',
        processed_at: new Date().toISOString(),
        confidence_thresholds: this.confidenceThresholds
      },
      statistics: batchResults.statistics,
      classifications: batchResults.results.map(entity => ({
        proto_id: entity.proto_id,
        name: entity.name,
        classification: entity.classification,
        source_file: entity.source_file
      }))
    };
  }
}

// Main execution
if (require.main === module) {
  const classifier = new IntelligentClassifier();
  
  // Test with sample data
  const sampleEntities = [
    {
      proto_id: 10001,
      name: { name: 'Deathclaw Alpha', source: 'TEST' },
      properties: {
        ProtoId: 10001,
        Name: 'Deathclaw Alpha',
        ST_STRENGTH: 12,
        ST_PERCEPTION: 8,
        ST_ENDURANCE: 10,
        AiGroup: 'Aggressive',
        DamageMin: 15,
        DamageMax: 30
      },
      source_file: 'test_deathclaw.fopro'
    },
    {
      proto_id: 20001,
      name: { name: 'Plasma Rifle', source: 'TEST' },
      properties: {
        ProtoId: 20001,
        Name: 'Plasma Rifle',
        Weight: 8,
        Cost: 5000,
        DamageType: 'Plasma',
        DamageMin: 20,
        DamageMax: 35,
        Weapon_Type: 'Energy'
      },
      source_file: 'test_plasma_rifle.fopro'
    }
  ];
  
  console.log('Testing Intelligent Classifier...');
  const batchResults = classifier.batchClassify(sampleEntities);
  
  console.log('\n=== Classification Results ===');
  batchResults.results.forEach(entity => {
    console.log(`\nEntity: ${entity.name.name}`);
    console.log(`Category: ${entity.classification.primary_category}`);
    console.log(`WorldEditor: ${entity.classification.worldEditor_category}`);
    console.log(`Confidence: ${(entity.classification.confidence * 100).toFixed(1)}%`);
    console.log(`Reasoning: ${entity.classification.reasoning.join('; ')}`);
  });
  
  console.log('\n=== Statistics ===');
  console.log(`Total processed: ${batchResults.statistics.total}`);
  console.log(`High confidence: ${batchResults.statistics.high_confidence}`);
  console.log(`Medium confidence: ${batchResults.statistics.medium_confidence}`);
  console.log(`Low confidence: ${batchResults.statistics.low_confidence}`);
  console.log(`Processing time: ${batchResults.statistics.processing_time}ms`);
  
  // Export results
  const exportData = classifier.exportResults(batchResults);
  fs.writeFileSync(
    path.join(__dirname, '../data/intelligent-classification-test.json'),
    JSON.stringify(exportData, null, 2)
  );
  console.log('\nExported test results to data/intelligent-classification-test.json');
}

module.exports = IntelligentClassifier;
