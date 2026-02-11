/**
 * DatabaseManager - Browser-compatible version
 * Manages FOnline entity data for the Entity Reactor
 */

class DatabaseManager {
  constructor() {
    this.entities = [];
    this.isLoaded = false;
  }

  /**
   * Load the entity data from JSON file
   */
  async loadIndex() {
    try {
      // Try to load from the integrated entities first (with MSG strings)
      const response = await fetch('./data/entities-integrated.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.entities = data.entities || [];
      this.isLoaded = true;
      
      console.log(`✅ FOnline database loaded with ${this.entities.length} integrated entities`);
      console.log(`📊 Items: ${this.entities.filter(e => e.classification?.primary_class === 'Item').length}`);
      console.log(`📊 Scenery: ${this.entities.filter(e => e.classification?.primary_class === 'Scenery').length}`);
      console.log(`📊 Critters: ${this.entities.filter(e => e.classification?.primary_class === 'Critter').length}`);
      console.log(`📝 MSG names: ${this.entities.filter(e => e.msg_info?.has_name).length}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load integrated database:', error.message);
      console.log('💡 Trying fallback to entities-export.json...');
      
      // Fallback to entities-export.json
      return this.loadFallbackData();
    }
  }

  /**
   * Load fallback data from all-protos.json
   */
  async loadFallbackData() {
    try {
      const response = await fetch('./data/all-protos.json');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.protos && Array.isArray(data.protos)) {
        this.entities = data.protos.map(proto => ({
          proto_id: proto.proto_id,
          name: { name: proto.name?.name || 'Unknown', source: 'database' },
          properties: proto.properties || {},
          classification: proto.classification || { primary_class: 'Unknown' },
          worldEditorCategory: proto.worldEditorCategory || { category: 'unknown', confidence: 0.5 },
          source_file: proto.source_file || 'unknown',
          validation_issues: proto.validation_issues || []
        }));
      }
      
      this.isLoaded = true;
      console.log(`✅ Fallback database loaded with ${this.entities.length} entities`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load fallback data:', error.message);
      this.isLoaded = false;
      this.entities = [];
      return false;
    }
  }

  /**
   * Get all entities from the database
   */
  async getAllEntities() {
    if (!this.isLoaded) {
      await this.loadIndex();
    }

    return this.entities;
  }

  /**
   * Get entity by ID
   */
  async getEntity(protoId) {
    const allEntities = await this.getAllEntities();
    return allEntities.find(entity => entity.proto_id === protoId);
  }

  /**
   * Update entity (placeholder for future implementation)
   */
  async updateEntity(entity) {
    // TODO: Implement entity update functionality
    console.log('Update entity:', entity);
    return true;
  }

  /**
   * Get database statistics
   */
  getStats() {
    if (!this.isLoaded) {
      return { total: 0, loaded: false };
    }

    return { 
      total: this.entities.length, 
      loaded: true,
      items: this.entities.filter(e => e.classification?.primary_class === 'Item').length,
      scenery: this.entities.filter(e => e.classification?.primary_class === 'Scenery').length,
      critters: this.entities.filter(e => e.classification?.primary_class === 'Critter').length,
      functional: this.entities.filter(e => e.classification?.primary_class === 'Functional').length
    };
  }

  /**
   * Get creatures (legacy method for compatibility)
   */
  getAllCreatures() {
    if (!this.isLoaded) return [];
    return this.entities.filter(e => e.classification?.primary_class === 'Critter');
  }

  /**
   * Get items (legacy method for compatibility)
   */
  getAllItems() {
    if (!this.isLoaded) return [];
    return this.entities.filter(e => e.classification?.primary_class === 'Item');
  }

  /**
   * Get objects (legacy method for compatibility)
   */
  getAllObjects() {
    if (!this.isLoaded) return [];
    return this.entities.filter(e => e.classification?.primary_class === 'Scenery');
  }

  /**
   * Search entities by term
   */
  async searchEntities(searchTerm) {
    const allEntities = await this.getAllEntities();
    const term = searchTerm.toLowerCase();
    
    return allEntities.filter(entity => {
      return (entity.name?.name || '').toLowerCase().includes(term) ||
             entity.proto_id?.toString().includes(term) ||
             (entity.properties?.Name || '').toLowerCase().includes(term) ||
             (entity.worldEditorCategory?.category || '').toLowerCase().includes(term);
    });
  }

  /**
   * Get entities by category
   */
  async getEntitiesByCategory(category) {
    const allEntities = await this.getAllEntities();
    return allEntities.filter(entity => 
      entity.worldEditorCategory?.category === category
    );
  }

  /**
   * Get entities by type
   */
  async getEntitiesByType(type) {
    const allEntities = await this.getAllEntities();
    return allEntities.filter(entity => 
      entity.classification?.primary_class === type
    );
  }
}

export default DatabaseManager;
