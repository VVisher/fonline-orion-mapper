/**
 * IndexedDB storage for map data
 * Offloads large map data from heap memory to browser storage
 */

const DB_NAME = 'OrionMapperDB';
const DB_VERSION = 1;
const STORE_NAME = 'maps';

export class MapStorage {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IndexedDB database
   */
  async init() {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for maps
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indexes for efficient queries
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('created', 'created', { unique: false });
          store.createIndex('modified', 'modified', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  /**
   * Store map data in IndexedDB
   * @param {string} id - Unique map identifier
   * @param {Object} mapData - Map data to store
   * @param {Object} metadata - Map metadata
   */
  async storeMap(id, mapData, metadata = {}) {
    await this.init();

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      id,
      name: metadata.name || id,
      mapData: this.compressMapData(mapData),
      metadata: {
        ...metadata,
        created: metadata.created || Date.now(),
        modified: Date.now(),
        size: this.estimateDataSize(mapData),
        version: metadata.version || '1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to store map: ${request.error}`));
      };
    });
  }

  /**
   * Retrieve map data from IndexedDB
   * @param {string} id - Map identifier
   * @returns {Object} Map data
   */
  async getMap(id) {
    await this.init();

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve(this.decompressMapData(result.mapData));
        } else {
          reject(new Error(`Map not found: ${id}`));
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to retrieve map: ${request.error}`));
      };
    });
  }

  /**
   * Get list of all stored maps
   * @returns {Array} List of map metadata
   */
  async getMapList() {
    await this.init();

    const transaction = this.db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const maps = request.result.map(record => ({
          id: record.id,
          name: record.name,
          ...record.metadata
        }));
        resolve(maps);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get map list: ${request.error}`));
      };
    });
  }

  /**
   * Delete map from IndexedDB
   * @param {string} id - Map identifier
   */
  async deleteMap(id) {
    await this.init();

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete map: ${request.error}`));
      };
    });
  }

  /**
   * Clear all maps from storage
   */
  async clearAll() {
    await this.init();

    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear storage: ${request.error}`));
      };
    });
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    await this.init();

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        usageDetails: estimate.usageDetails || {},
        available: estimate.quota - estimate.usage
      };
    }

    return null;
  }

  /**
   * Compress map data for storage
   * @param {Object} mapData - Raw map data
   * @returns {ArrayBuffer} Compressed data
   */
  compressMapData(mapData) {
    // Simple compression - convert to JSON and then to ArrayBuffer
    const jsonString = JSON.stringify(mapData);
    const encoder = new TextEncoder();
    return encoder.encode(jsonString).buffer;
  }

  /**
   * Decompress map data from storage
   * @param {ArrayBuffer} compressedData - Compressed data
   * @returns {Object} Decompressed map data
   */
  decompressMapData(compressedData) {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(compressedData);
    return JSON.parse(jsonString);
  }

  /**
   * Estimate data size for storage statistics
   * @param {Object} mapData - Map data
   * @returns {number} Estimated size in bytes
   */
  estimateDataSize(mapData) {
    const jsonString = JSON.stringify(mapData);
    return new Blob([jsonString]).size;
  }

  /**
   * Cleanup old maps based on criteria
   * @param {Object} options - Cleanup options
   */
  async cleanup(options = {}) {
    const {
      olderThan = 30 * 24 * 60 * 60 * 1000, // 30 days
      largerThan = 50 * 1024 * 1024, // 50MB
      keepCount = 100 // Keep at most 100 maps
    } = options;

    await this.init();
    const maps = await this.getMapList();
    const now = Date.now();

    const toDelete = maps.filter(map => {
      const age = now - map.modified;
      return age > olderThan || map.size > largerThan;
    }).sort((a, b) => b.modified - a.modified) // Sort by newest first
      .slice(keepCount); // Keep only the newest N maps

    for (const map of toDelete) {
      await this.deleteMap(map.id);
    }

    return toDelete.length;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

/**
 * Singleton instance for map storage
 */
export const mapStorage = new MapStorage();
