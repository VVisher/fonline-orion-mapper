/**
 * Browser-Compatible Proto Database Manager
 * Uses JSON data instead of SQLite for browser compatibility
 * Reference: STATUS.md Phase 3.3 - Database Integration (Browser Version)
 */

class BrowserProtoDatabaseManager {
  constructor() {
    this.protoData = null;
    this.isLoaded = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize database with JSON data
   */
  async initialize() {
    try {
      // Load JSON data from public directory
      const response = await fetch('/data/all-protos.json');
      if (!response.ok) {
        throw new Error(`Failed to load proto data: ${response.status}`);
      }
      
      const data = await response.json();
      this.protoData = data;
      this.isLoaded = true;
      
      console.log(`✅ Proto database loaded with ${data.metadata.totalProtos} protos`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load proto database:', error.message);
      console.log('💡 Make sure data/all-protos.json is available in public directory');
      this.isLoaded = false;
      return false;
    }
  }

  /**
   * Close database connection (no-op for browser)
   */
  close() {
    this.isLoaded = false;
    this.cache.clear();
    console.log('📁 Proto database closed');
  }

  /**
   * Get all protos with optional filtering
   */
  getProtos(filters = {}) {
    if (!this.isLoaded || !this.protoData) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    const cacheKey = JSON.stringify(filters);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    let protos = [...this.protoData.protos];

    // Apply filters
    if (filters.type !== undefined) {
      protos = protos.filter(proto => proto.type === filters.type);
    }

    if (filters.category) {
      protos = protos.filter(proto => proto.category === filters.category);
    }

    if (filters.collision !== undefined) {
      protos = protos.filter(proto => proto.collision === filters.collision);
    }

    if (filters.interactive !== undefined) {
      protos = protos.filter(proto => proto.interactive === filters.interactive);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      protos = protos.filter(proto => 
        proto.name.toLowerCase().includes(searchTerm) ||
        (proto.description && proto.description.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by name
    protos.sort((a, b) => a.name.localeCompare(b.name));

    // Cache result
    this.cache.set(cacheKey, {
      data: protos,
      timestamp: Date.now()
    });

    return protos;
  }

  /**
   * Get proto by ID
   */
  getProtoById(protoId) {
    if (!this.isLoaded || !this.protoData) {
      console.warn('⚠️ Database not loaded');
      return null;
    }

    const proto = this.protoData.protos.find(p => p.protoId === protoId);
    return proto || null;
  }

  /**
   * Get proto types
   */
  getProtoTypes() {
    if (!this.isLoaded || !this.protoData) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    // Extract unique types
    const types = [...new Set(this.protoData.protos.map(p => p.type))];
    
    return types.map(type => ({
      type_id: type,
      type_name: this.getTypeName(type),
      description: this.getTypeDescription(type)
    }));
  }

  /**
   * Get categories
   */
  getCategories() {
    if (!this.isLoaded || !this.protoData) {
      console.warn('⚠️ Database not loaded');
      return [];
    }

    // Extract unique categories
    const categories = [...new Set(this.protoData.protos.map(p => p.category).filter(Boolean))];
    
    return categories.map(category => ({
      category_id: categories.indexOf(category) + 1,
      category_name: category,
      description: `${category} items`
    }));
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.isLoaded || !this.protoData) {
      console.warn('⚠️ Database not loaded');
      return null;
    }

    const stats = {
      total: this.protoData.protos.length,
      byType: {},
      byCategory: {},
      collision: this.protoData.protos.filter(p => p.collision).length,
      interactive: this.protoData.protos.filter(p => p.interactive).length
    };

    // Count by type
    this.protoData.protos.forEach(proto => {
      const typeName = this.getTypeName(proto.type);
      stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
    });

    // Count by category
    this.protoData.protos.forEach(proto => {
      if (proto.category) {
        stats.byCategory[proto.category] = (stats.byCategory[proto.category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Search protos with advanced options
   */
  searchProtos(query, options = {}) {
    const filters = {
      search: query,
      type: options.type,
      category: options.category,
      collision: options.collision,
      interactive: options.interactive
    };

    return this.getProtos(filters);
  }

  /**
   * Get protos for rendering (optimized for performance)
   */
  getProtosForRendering(type = null, limit = 1000) {
    const filters = {};
    if (type !== null) filters.type = type;

    const protos = this.getProtos(filters);
    
    // Limit for performance
    return protos.slice(0, limit);
  }

  /**
   * Validate database integrity
   */
  validateDatabase() {
    if (!this.isLoaded || !this.protoData) return false;

    try {
      // Check if we have data
      if (this.protoData.protos.length === 0) {
        throw new Error('No proto data found');
      }

      // Check for duplicate proto IDs
      const ids = this.protoData.protos.map(p => p.protoId);
      const uniqueIds = new Set(ids);
      if (ids.length !== uniqueIds.size) {
        throw new Error('Duplicate proto IDs found');
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
    if (!this.isLoaded || !this.protoData) {
      return {
        loaded: false,
        error: 'Database not loaded'
      };
    }

    const stats = this.getStatistics();
    return {
      loaded: true,
      type: 'JSON (Browser Compatible)',
      stats,
      cacheSize: this.cache.size,
      isValid: this.validateDatabase(),
      metadata: this.protoData.metadata
    };
  }

  /**
   * Get type name from type ID
   */
  getTypeName(typeId) {
    const types = {
      0: 'Critter',
      1: 'Item', 
      2: 'Scenery',
      3: 'Wall',
      4: 'Door',
      5: 'Grid',
      6: 'Misc'
    };
    return types[typeId] || `Unknown(${typeId})`;
  }

  /**
   * Get type description
   */
  getTypeDescription(typeId) {
    const descriptions = {
      0: 'Character and NPC prototypes',
      1: 'Item prototypes',
      2: 'Scenery objects',
      3: 'Wall and barrier objects',
      4: 'Door objects',
      5: 'Grid-based objects',
      6: 'Miscellaneous objects'
    };
    return descriptions[typeId] || 'Unknown type';
  }
}

// Singleton instance
let instance = null;

export function getBrowserProtoDatabaseManager() {
  if (!instance) {
    instance = new BrowserProtoDatabaseManager();
  }
  return instance;
}

export default BrowserProtoDatabaseManager;
