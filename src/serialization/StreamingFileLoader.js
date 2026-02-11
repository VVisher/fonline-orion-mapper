/**
 * Streaming file loader for very large .fomap files
 * Processes files in chunks to avoid memory spikes
 */

export class StreamingFileLoader {
  constructor() {
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.maxConcurrency = 4; // Max parallel chunks
  }

  /**
   * Load and process a large file in chunks
   * @param {File} file - File object to load
   * @param {Function} chunkProcessor - Function to process each chunk
   * @param {Function} onProgress - Progress callback (0-1)
   * @returns {Promise} Processed result
   */
  async loadFileInChunks(file, chunkProcessor, onProgress = null) {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / this.chunkSize);
    
    console.log(`Loading ${file.name} in ${totalChunks} chunks (${Math.round(fileSize / 1024 / 1024)}MB)`);
    
    const chunks = [];
    const results = [];
    
    // Read file in chunks
    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, fileSize);
      const chunk = await this.readFileChunk(file, start, end);
      chunks.push({ chunk, index: i, start, end });
      
      // Report progress
      if (onProgress) {
        onProgress((i + 1) / totalChunks);
      }
    }
    
    // Process chunks with limited concurrency
    const semaphore = new Semaphore(this.maxConcurrency);
    
    const processPromises = chunks.map(async ({ chunk, index, start, end }) => {
      await semaphore.acquire();
      
      try {
        const result = await chunkProcessor(chunk, index, start, end);
        return { index, result, start, end };
      } finally {
        semaphore.release();
      }
    });
    
    const processedChunks = await Promise.all(processPromises);
    
    // Sort results by index and merge
    processedChunks.sort((a, b) => a.index - b.index);
    
    return this.mergeResults(processedChunks.map(p => p.result));
  }

  /**
   * Read a chunk from file
   * @param {File} file - File object
   * @param {number} start - Start byte
   * @param {number} end - End byte
   * @returns {Promise<ArrayBuffer>} Chunk data
   */
  async readFileChunk(file, start, end) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error(`Failed to read chunk ${start}-${end}: ${reader.error}`));
      };
      
      reader.readAsArrayBuffer(file.slice(start, end));
    });
  }

  /**
   * Merge processed chunk results
   * @param {Array} results - Array of processed chunk results
   * @returns {Object} Merged result
   */
  mergeResults(results) {
    // Default merge strategy - concatenate arrays and merge objects
    const merged = {
      header: null,
      tiles: [],
      objects: []
    };
    
    for (const result of results) {
      if (!result) continue;
      
      // Take header from first non-null result
      if (!merged.header && result.header) {
        merged.header = result.header;
      }
      
      // Concatenate arrays
      if (result.tiles && Array.isArray(result.tiles)) {
        merged.tiles.push(...result.tiles);
      }
      
      if (result.objects && Array.isArray(result.objects)) {
        merged.objects.push(...result.objects);
      }
    }
    
    return merged;
  }

  /**
   * Progressive file loader with UI updates
   * @param {File} file - File to load
   * @param {Function} updateCallback - Callback for UI updates
   * @returns {Promise} Loaded data
   */
  async loadProgressively(file, updateCallback) {
    const reader = new FileReader();
    const chunkSize = 64 * 1024; // 64KB for progressive loading
    let offset = 0;
    let partialData = '';
    
    return new Promise((resolve, reject) => {
      const readNextChunk = () => {
        if (offset >= file.size) {
          // Final processing
          try {
            const result = JSON.parse(partialData);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse final data: ${error.message}`));
          }
          return;
        }
        
        const end = Math.min(offset + chunkSize, file.size);
        const blob = file.slice(offset, end);
        
        reader.onload = (e) => {
          partialData += e.target.result;
          offset = end;
          
          // Update UI with progress
          const progress = offset / file.size;
          updateCallback({
            progress,
            loaded: offset,
            total: file.size,
            partial: partialData.length
          });
          
          // Continue reading
          setTimeout(readNextChunk, 0); // Allow UI to update
        };
        
        reader.onerror = () => {
          reject(new Error(`Failed to read chunk at offset ${offset}: ${reader.error}`));
        };
        
        reader.readAsText(blob);
      };
      
      readNextChunk();
    });
  }

  /**
   * Memory-efficient streaming parser for binary files
   * @param {ArrayBuffer} buffer - File data
   * @param {Function} processor - Chunk processor function
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} Processed data
   */
  async streamBinaryFile(buffer, processor, onProgress = null) {
    const totalSize = buffer.byteLength;
    const chunkSize = this.chunkSize;
    const results = [];
    
    for (let offset = 0; offset < totalSize; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, totalSize);
      const chunk = buffer.slice(offset, end);
      
      try {
        const result = await processor(chunk, offset, end);
        results.push(result);
        
        if (onProgress) {
          onProgress(end / totalSize);
        }
      } catch (error) {
        console.error(`Error processing chunk ${offset}-${end}:`, error);
        // Continue with other chunks
      }
    }
    
    return this.mergeResults(results);
  }

  /**
   * Set chunk size for loading
   * @param {number} size - Chunk size in bytes
   */
  setChunkSize(size) {
    this.chunkSize = size;
  }

  /**
   * Set maximum concurrency for chunk processing
   * @param {number} concurrency - Max concurrent chunks
   */
  setMaxConcurrency(concurrency) {
    this.maxConcurrency = concurrency;
  }
}

/**
 * Simple semaphore for limiting concurrent operations
 */
class Semaphore {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.currentCount = 0;
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxConcurrency) {
        this.currentCount++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release() {
    this.currentCount--;
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      this.currentCount++;
      resolve();
    }
  }
}

/**
 * Factory function to create streaming loader with optimal settings
 */
export function createStreamingLoader(options = {}) {
  const loader = new StreamingFileLoader();
  
  // Configure based on file size and system capabilities
  if (options.fileSize) {
    if (options.fileSize > 100 * 1024 * 1024) { // 100MB+
      loader.setChunkSize(2 * 1024 * 1024); // 2MB chunks
      loader.setMaxConcurrency(2);
    } else if (options.fileSize > 10 * 1024 * 1024) { // 10MB+
      loader.setChunkSize(1024 * 1024); // 1MB chunks
      loader.setMaxConcurrency(4);
    } else {
      loader.setChunkSize(512 * 1024); // 512KB chunks
      loader.setMaxConcurrency(8);
    }
  }
  
  return loader;
}
