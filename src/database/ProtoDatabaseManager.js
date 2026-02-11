/**
 * Enhanced Entity Database Manager
 * WorldEditor-inspired LINQ-style queries for FOnline: Ashes of Phoenix
 * Reference: database-guide.md + WorldEditor patterns
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

class EntityRepository {
  constructor(entities = []) {
    this.entities = entities;
  }
  
  // LINQ Where equivalent
  where(predicate) {
    return new EntityRepository(this.entities.filter(predicate));
  }
  
  // Find all hostile critters
  getHostileCritters() {
    return this.where(e => 
      e.category === 'critters' && 
      (e.flags & 0x1000) // Hostile flag
    );
  }
  
  // Find all usable items
  getUsableItems() {
    return this.where(e => 
      e.category === 'items' && 
      (e.flags & 0x0010) // Usable flag
    );
  }
  
  // Find all containers
  getContainers() {
    return this.where(e => 
      e.script_name && 
      e.script_name.includes('container')
    );
  }
  
  // Cross-reference with scripts
  getScriptedEntities() {
    return this.where(e => 
      e.script_name && 
      this.scriptDefines.has(e.script_name)
    );
  }
  
  // Complex query: Find all merchant NPCs with inventory
  getMerchantNPCs() {
    return this.where(e => 
      e.category === 'critters' &&
      e.subcategory === 'merchants' &&
      e.script_name &&
      e.script_name.includes('trade')
    );
  }
  
  // Semantic category queries
  getBySemanticCategory(category) {
    return this.where(e => e.category === category);
  }
  
  getBySemanticSubcategory(subcategory) {
    return this.where(e => e.subcategory === subcategory);
  }
  
  // WorldEditor-style queries
  getAliens() { return this.getBySemanticSubcategory('aliens'); }
  getBrahmins() { return this.getBySemanticSubcategory('brahmins'); }
  getDeathclaws() { return this.getBySemanticSubcategory('deathclaws'); }
  getDogs() { return this.getBySemanticSubcategory('dogs'); }
  getGeckos() { return this.getBySemanticSubcategory('geckos'); }
  getGhouls() { return this.getBySemanticSubcategory('ghouls'); }
  getInsects() { return this.getBySemanticSubcategory('insects'); }
  getMutants() { return this.getBySemanticSubcategory('mutants'); }
  getPlants() { return this.getBySemanticSubcategory('plants'); }
  getRadscorpions() { return this.getBySemanticSubcategory('radscorpions'); }
  getRats() { return this.getBySemanticSubcategory('rats'); }
  getRobots() { return this.getBySemanticSubcategory('robots'); }
  getBandits() { return this.getBySemanticSubcategory('bandits'); }
  getCitizens() { return this.getBySemanticSubcategory('citizens'); }
  getGuards() { return this.getBySemanticSubcategory('guards'); }
  getMerchants() { return this.getBySemanticSubcategory('merchants'); }
  getSlavers() { return this.getBySemanticSubcategory('slavers'); }
  getSlaves() { return this.getBySemanticSubcategory('slaves'); }
  getTribals() { return this.getBySemanticSubcategory('tribals'); }
  getVips() { return this.getBySemanticSubcategory('vips'); }
  getCompanions() { return this.getBySemanticSubcategory('companions'); }
  
  // Item categories
  getWeapons() { return this.getBySemanticSubcategory('weapons'); }
  getArmor() { return this.getBySemanticSubcategory('armor'); }
  getAmmunition() { return this.getBySemanticSubcategory('ammunition'); }
  getMedicine() { return this.getBySemanticSubcategory('medicine'); }
  getFood() { return this.getBySemanticSubcategory('food'); }
  getTools() { return this.getBySemanticSubcategory('tools'); }
  getContainers() { return this.getBySemanticSubcategory('containers'); }
  getKeys() { return this.getBySemanticSubcategory('keys'); }
  getBooks() { return this.getBySemanticSubcategory('books'); }
  getMisc() { return this.getBySemanticSubcategory('misc'); }
  
  toArray() {
    return this.entities;
  }
  
  count() {
    return this.entities.length;
  }
  
  first() {
    return this.entities[0] || null;
  }
  
  last() {
    return this.entities[this.entities.length - 1] || null;
  }
}

class EnhancedEntityDatabaseManager {
  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'entities.db');
    this.db = null;
    this.isLoaded = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.entityRepository = null;
    this.scriptDefines = new Set();
    
    // WorldEditor semantic categories
    this.semanticCategories = {
      critters: [
        'aliens', 'brahmins', 'deathclaws', 'dogs', 'geckos', 
        'ghouls', 'insects', 'mutants', 'plants', 'radscorpions', 
        'rats', 'robots', 'bandits', 'citizens', 'encounter', 
        'guards', 'merchants', 'slavers', 'slaves', 'tribals', 
        'vips', '3d', 'bounty', 'companions', 'strangers', 'invalid'
      ],
      items: [
        'weapons', 'armor', 'ammunition', 'medicine', 'food', 
        'tools', 'containers', 'keys', 'books', 'misc'
      ],
      scenery: [
        'structures', 'nature', 'tech', 'debris', 'walls', 
        'doors', 'containers_furniture'
      ]
    };
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    try {
      if (!this.db) {
        this.db = new Database(this.dbPath, { readonly: true });
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('temp_store = MEMORY');
        this.db.pragma('foreign_keys = ON');
      }

      // Test database connection
      const test = this.db.prepare('SELECT COUNT(*) as count FROM entities').get();
      if (test.count === 0) {
        throw new Error('Database is empty - run parsing scripts first');
      }

      // Load script defines for cross-referencing
      await this.loadScriptDefines();
      
      // Initialize entity repository
      const allEntities = this.getAllEntities();
      this.entityRepository = new EntityRepository(allEntities);

      this.isLoaded = true;
      console.log(`✅ Enhanced entity database loaded with ${test.count} entities`);
      console.log(`🎭 Semantic categories: ${Object.keys(this.semanticCategories).join(', ')}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load entity database:', error.message);
      console.log('💡 Run: node scripts/parse-all-entities.cjs');
      this.isLoaded = false;
      return false;
    }
  }
  
  /**
   * Load script defines for cross-referencing
   */
  async loadScriptDefines() {
    try {
      const defines = this.db.prepare('SELECT define_name, define_value FROM script_defines').all();
      this.scriptDefines.clear();
      defines.forEach(def => this.scriptDefines.add(def.define_name));
      console.log(`📜 Loaded ${defines.length} script defines`);
    } catch (error) {
      console.warn('⚠️ Could not load script defines:', error.message);
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isLoaded = false;
      this.cache.clear();
      console.log('📁 Proto database closed');
    }
  }

  /**
   * Get all entities (for EntityRepository)
   */
  getAllEntities() {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    try {
      const entities = this.db.prepare('SELECT * FROM entities ORDER BY name').all();
      
      // Parse JSON fields and apply semantic classification
      return entities.map(entity => ({
        ...entity,
        script_params: JSON.parse(entity.script_params || '[]'),
        flags: entity.flags || 0,
        collision: !!(entity.flags & 0x0001),
        usable: !!(entity.flags & 0x0010),
        takeable: !!(entity.flags & 0x0020),
        hostile: !!(entity.flags & 0x1000)
      }));
    } catch (error) {
      console.error('❌ Error getting entities:', error.message);
      return [];
    }
  }
  
  /**
   * Get entity repository with LINQ-style queries
   */
  getEntityRepository() {
    if (!this.isLoaded || !this.entityRepository) {
      console.warn('⚠️ Database not loaded or repository not initialized');
      return null;
    }
    return this.entityRepository;
  }

  /**
   * Get entity by ProtoID
   */
  getEntityByProtoId(protoId) {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return null;
    }

    try {
      const entity = this.db.prepare('SELECT * FROM entities WHERE proto_id = ?').get(protoId);
      
      if (entity) {
        return {
          ...entity,
          script_params: JSON.parse(entity.script_params || '[]'),
          flags: entity.flags || 0,
          collision: !!(entity.flags & 0x0001),
          usable: !!(entity.flags & 0x0010),
          takeable: !!(entity.flags & 0x0020),
          hostile: !!(entity.flags & 0x1000)
        };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting entity ${protoId}:`, error.message);
      return null;
    }
  }
  
  /**
   * Get entities by semantic category
   */
  getEntitiesByCategory(category) {
    const repo = this.getEntityRepository();
    return repo ? repo.getBySemanticCategory(category).toArray() : [];
  }
  
  /**
   * Get entities by semantic subcategory
   */
  getEntitiesBySubcategory(subcategory) {
    const repo = this.getEntityRepository();
    return repo ? repo.getBySemanticSubcategory(subcategory).toArray() : [];
  }
  
  /**
   * WorldEditor-style semantic queries
   */
  getAliens() { return this.getEntitiesBySubcategory('aliens'); }
  getBrahmins() { return this.getEntitiesBySubcategory('brahmins'); }
  getDeathclaws() { return this.getEntitiesBySubcategory('deathclaws'); }
  getDogs() { return this.getEntitiesBySubcategory('dogs'); }
  getGeckos() { return this.getEntitiesBySubcategory('geckos'); }
  getGhouls() { return this.getEntitiesBySubcategory('ghouls'); }
  getInsects() { return this.getEntitiesBySubcategory('insects'); }
  getMutants() { return this.getEntitiesBySubcategory('mutants'); }
  getPlants() { return this.getEntitiesBySubcategory('plants'); }
  getRadscorpions() { return this.getEntitiesBySubcategory('radscorpions'); }
  getRats() { return this.getEntitiesBySubcategory('rats'); }
  getRobots() { return this.getEntitiesBySubcategory('robots'); }
  getBandits() { return this.getEntitiesBySubcategory('bandits'); }
  getCitizens() { return this.getEntitiesBySubcategory('citizens'); }
  getGuards() { return this.getEntitiesBySubcategory('guards'); }
  getMerchants() { return this.getEntitiesBySubcategory('merchants'); }
  getSlavers() { return this.getEntitiesBySubcategory('slavers'); }
  getSlaves() { return this.getEntitiesBySubcategory('slaves'); }
  getTribals() { return this.getEntitiesBySubcategory('tribals'); }
  getVips() { return this.getEntitiesBySubcategory('vips'); }
  getCompanions() { return this.getEntitiesBySubcategory('companions'); }
  
  // Item categories
  getWeapons() { return this.getEntitiesBySubcategory('weapons'); }
  getArmor() { return this.getEntitiesBySubcategory('armor'); }
  getAmmunition() { return this.getEntitiesBySubcategory('ammunition'); }
  getMedicine() { return this.getEntitiesBySubcategory('medicine'); }
  getFood() { return this.getEntitiesBySubcategory('food'); }
  getTools() { return this.getEntitiesBySubcategory('tools'); }
  getContainers() { return this.getEntitiesBySubcategory('containers'); }
  getKeys() { return this.getEntitiesBySubcategory('keys'); }
  getBooks() { return this.getEntitiesBySubcategory('books'); }
  getMisc() { return this.getEntitiesBySubcategory('misc'); }
  
  // LINQ-style queries
  getHostileCritters() {
    const repo = this.getEntityRepository();
    return repo ? repo.getHostileCritters().toArray() : [];
  }
  
  getUsableItems() {
    const repo = this.getEntityRepository();
    return repo ? repo.getUsableItems().toArray() : [];
  }
  
  getScriptedEntities() {
    const repo = this.getEntityRepository();
    return repo ? repo.getScriptedEntities().toArray() : [];
  }
  
  getMerchantNPCs() {
    const repo = this.getEntityRepository();
    return repo ? repo.getMerchantNPCs().toArray() : [];
  }

  /**
   * Get entity types
   */
  getEntityTypes() {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    try {
      return this.db.prepare('SELECT * FROM entity_types ORDER BY type_id').all();
    } catch (error) {
      console.error('❌ Error getting entity types:', error.message);
      return [];
    }
  }
  
  /**
   * Get script defines
   */
  getScriptDefines() {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    try {
      return this.db.prepare('SELECT * FROM script_defines ORDER BY define_name').all();
    } catch (error) {
      console.error('❌ Error getting script defines:', error.message);
      return [];
    }
  }

  /**
   * Get categories
   */
  getCategories() {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    try {
      return this.db.prepare('SELECT * FROM categories ORDER BY category_name').all();
    } catch (error) {
      console.error('❌ Error getting categories:', error.message);
      return [];
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.isLoaded) {
      console.warn('⚠️ Database not loaded');
      return null;
    }

    try {
      const stats = {
        total: this.db.prepare('SELECT COUNT(*) as count FROM entities').get().count,
        byType: this.db.prepare(`
          SELECT et.type_id, et.type_name, COUNT(*) as count 
          FROM entities e 
          JOIN entity_types et ON e.type = et.type_id 
          GROUP BY e.type
          ORDER BY count DESC
        `).all(),
        byCategory: this.db.prepare(`
          SELECT category, COUNT(*) as count 
          FROM entities 
          WHERE category IS NOT NULL AND category != ''
          GROUP BY category
          ORDER BY count DESC
        `).all(),
        bySubcategory: this.db.prepare(`
          SELECT subcategory, COUNT(*) as count 
          FROM entities 
          WHERE subcategory IS NOT NULL AND subcategory != ''
          GROUP BY subcategory
          ORDER BY count DESC
        `).all(),
        withScripts: this.db.prepare('SELECT COUNT(*) as count FROM entities WHERE script_name IS NOT NULL').get().count,
        hostile: this.db.prepare('SELECT COUNT(*) as count FROM entities WHERE flags & 0x1000').get().count,
        usable: this.db.prepare('SELECT COUNT(*) as count FROM entities WHERE flags & 0x0010').get().count,
        takeable: this.db.prepare('SELECT COUNT(*) as count FROM entities WHERE flags & 0x0020').get().count
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting statistics:', error.message);
      return null;
    }
  }

  /**
   * Search entities with advanced options
   */
  searchEntities(query, options = {}) {
    const repo = this.getEntityRepository();
    if (!repo) return [];
    
    let results = repo.toArray();
    
    // Apply filters
    if (options.category) {
      results = results.filter(e => e.category === options.category);
    }
    
    if (options.subcategory) {
      results = results.filter(e => e.subcategory === options.subcategory);
    }
    
    if (options.type) {
      results = results.filter(e => e.type === options.type);
    }
    
    if (options.hostile) {
      results = results.filter(e => e.hostile);
    }
    
    if (options.usable) {
      results = results.filter(e => e.usable);
    }
    
    // Text search
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(e => 
        e.name.toLowerCase().includes(searchTerm) ||
        (e.description && e.description.toLowerCase().includes(searchTerm))
      );
    }
    
    return results;
  }

  /**
   * Get entities for rendering (optimized for performance)
   */
  getEntitiesForRendering(type = null, limit = 1000) {
    const repo = this.getEntityRepository();
    if (!repo) return [];
    
    let results = repo.toArray();
    
    if (type !== null) {
      results = results.filter(e => e.type === type);
    }
    
    // Limit for performance
    return results.slice(0, limit);
  }

  /**
   * Validate database integrity
   */
  validateDatabase() {
    if (!this.isLoaded) return false;

    try {
      // Check if tables exist
      const tables = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('entities', 'entity_types', 'script_defines', 'entity_relationships', 'entity_usage')
      `).all();

      if (tables.length < 3) {
        throw new Error('Missing required tables');
      }

      // Check if we have data
      const entityCount = this.db.prepare('SELECT COUNT(*) as count FROM entities').get().count;
      if (entityCount === 0) {
        throw new Error('No entity data found');
      }

      return true;
    } catch (error) {
      console.error('❌ Database validation failed:', error.message);
      return false;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Proto database cache cleared');
  }

  /**
   * Get database info
   */
  getDatabaseInfo() {
    if (!this.isLoaded) {
      return {
        loaded: false,
        path: this.dbPath,
        error: 'Database not loaded'
      };
    }

    const stats = this.getStatistics();
    return {
      loaded: true,
      path: this.dbPath,
      stats,
      cacheSize: this.cache.size,
      isValid: this.validateDatabase(),
      worldEditorCompatible: true,
      semanticCategories: Object.keys(this.semanticCategories),
      entityRepository: !!this.entityRepository
    };
  }
}

// Singleton instance
let instance = null;

export function getEnhancedEntityDatabaseManager() {
  if (!instance) {
    instance = new EnhancedEntityDatabaseManager();
  }
  return instance;
}

// Legacy compatibility
export function getProtoDatabaseManager() {
  console.warn('⚠️ getProtoDatabaseManager() is deprecated, use getEnhancedEntityDatabaseManager()');
  return getEnhancedEntityDatabaseManager();
}

export default EnhancedEntityDatabaseManager;
export { EntityRepository };
