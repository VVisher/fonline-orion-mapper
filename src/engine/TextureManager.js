/**
 * Smart texture management system
 * Unloads unused textures to save memory
 */

export class TextureManager {
  constructor() {
    this.textures = new Map(); // textureId -> { texture, lastUsed, refCount, size }
    this.maxCacheSize = 100 * 1024 * 1024; // 100MB default
    this.currentCacheSize = 0;
    this.cleanupThreshold = 0.8; // Clean up when 80% full
  }

  /**
   * Get or load a texture
   * @param {string} textureId - Unique texture identifier
   * @param {Function} loader - Function to load texture if not cached
   * @returns {Promise<Texture>} Loaded texture
   */
  async getTexture(textureId, loader) {
    const cached = this.textures.get(textureId);
    
    if (cached) {
      // Update usage statistics
      cached.lastUsed = Date.now();
      cached.refCount++;
      return cached.texture;
    }

    // Load new texture
    try {
      const texture = await loader();
      const size = this.estimateTextureSize(texture);
      
      // Check if we need to clean up before adding
      if (this.currentCacheSize + size > this.maxCacheSize * this.cleanupThreshold) {
        await this.cleanup();
      }

      // Cache the texture
      this.textures.set(textureId, {
        texture,
        lastUsed: Date.now(),
        refCount: 1,
        size
      });

      this.currentCacheSize += size;
      return texture;
    } catch (error) {
      console.error(`Failed to load texture ${textureId}:`, error);
      throw error;
    }
  }

  /**
   * Release a texture reference
   * @param {string} textureId - Texture identifier
   */
  releaseTexture(textureId) {
    const cached = this.textures.get(textureId);
    if (cached) {
      cached.refCount--;
      cached.lastUsed = Date.now();
    }
  }

  /**
   * Force cleanup of unused textures
   */
  async cleanup() {
    const now = Date.now();
    const toDelete = [];
    let freedSize = 0;

    // Find textures to remove (unused or old)
    for (const [id, cached] of this.textures) {
      const age = now - cached.lastUsed;
      const shouldDelete = 
        cached.refCount <= 0 || // No references
        age > 5 * 60 * 1000 || // Older than 5 minutes
        (this.currentCacheSize > this.maxCacheSize && age > 60 * 1000); // Over limit and older than 1 minute

      if (shouldDelete) {
        toDelete.push(id);
        freedSize += cached.size;
      }
    }

    // Remove textures
    for (const id of toDelete) {
      const cached = this.textures.get(id);
      if (cached && cached.texture) {
        // Destroy texture if it has a destroy method
        if (typeof cached.texture.destroy === 'function') {
          cached.texture.destroy();
        }
      }
      this.textures.delete(id);
    }

    this.currentCacheSize -= freedSize;
    
    if (toDelete.length > 0) {
      console.log(`Texture cleanup: removed ${toDelete.length} textures, freed ${Math.round(freedSize / 1024)}KB`);
    }

    return toDelete.length;
  }

  /**
   * Preload textures for a set of objects
   * @param {Array} objects - Array of objects with textureId
   * @param {Function} loader - Texture loader function
   */
  async preloadTextures(objects, loader) {
    const uniqueIds = [...new Set(objects.map(obj => obj.textureId).filter(Boolean))];
    
    const promises = uniqueIds.map(async (textureId) => {
      try {
        await this.getTexture(textureId, loader);
      } catch (error) {
        console.warn(`Failed to preload texture ${textureId}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const textureCount = this.textures.size;
    const referencedCount = Array.from(this.textures.values()).filter(t => t.refCount > 0).length;
    
    return {
      textureCount,
      referencedCount,
      currentSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilization: this.currentCacheSize / this.maxCacheSize
    };
  }

  /**
   * Set maximum cache size
   * @param {number} size - Maximum size in bytes
   */
  setMaxCacheSize(size) {
    this.maxCacheSize = size;
    if (this.currentCacheSize > size * this.cleanupThreshold) {
      this.cleanup();
    }
  }

  /**
   * Estimate texture size in bytes
   * @param {Texture} texture - Texture object
   * @returns {number} Estimated size in bytes
   */
  estimateTextureSize(texture) {
    // Try to get actual size from texture
    if (texture.width && texture.height) {
      const bpp = this.estimateBitsPerPixel(texture);
      return texture.width * texture.height * bpp / 8;
    }

    // Fallback estimation
    return 1024 * 1024; // 1MB default
  }

  /**
   * Estimate bits per pixel for a texture
   * @param {Texture} texture - Texture object
   * @returns {number} Bits per pixel
   */
  estimateBitsPerPixel(texture) {
    // Try to determine format
    if (texture.format) {
      switch (texture.format) {
        case 'RGB': return 24;
        case 'RGBA': return 32;
        case 'LUMINANCE': return 8;
        case 'LUMINANCE_ALPHA': return 16;
        default: return 32;
      }
    }

    // Default to 32 bits per pixel (RGBA)
    return 32;
  }

  /**
   * Clear all textures
   */
  clear() {
    for (const cached of this.textures.values()) {
      if (cached.texture && typeof cached.texture.destroy === 'function') {
        cached.texture.destroy();
      }
    }
    this.textures.clear();
    this.currentCacheSize = 0;
  }

  /**
   * Export texture cache for debugging
   */
  exportCache() {
    const cache = Array.from(this.textures.entries()).map(([id, cached]) => ({
      id,
      refCount: cached.refCount,
      lastUsed: cached.lastUsed,
      size: cached.size,
      age: Date.now() - cached.lastUsed
    }));

    return {
      cache,
      stats: this.getStats()
    };
  }
}

/**
 * Global texture manager instance
 */
export const textureManager = new TextureManager();
