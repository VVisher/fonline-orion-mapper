/**
 * Streaming Fomap Parser with Web Worker support
 * Handles large .fomap files without blocking the main thread
 */

import { FomapParser } from './FomapParser.js';

export class StreamingFomapParser {
  constructor() {
    this.worker = null;
    this.isParsing = false;
  }

  /**
   * Initialize the Web Worker
   */
  initWorker() {
    if (this.worker) {
      this.worker.terminate();
    }
    
    this.worker = new Worker(
      new URL('../workers/FomapParserWorker.js', import.meta.url),
      { type: 'module' }
    );
  }

  /**
   * Parse a .fomap file using Web Worker
   * @param {ArrayBuffer} buffer - File data
   * @param {Function} onProgress - Progress callback (0-1)
   * @returns {Promise} Parsed map data
   */
  async parseFile(buffer, onProgress = null) {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        this.initWorker();
      }

      this.isParsing = true;

      const handleMessage = (e) => {
        const { type, result, error, progress, success } = e.data;

        switch (type) {
          case 'parse-complete':
          case 'parse-streaming-complete':
            this.isParsing = false;
            this.worker.removeEventListener('message', handleMessage);
            
            if (success) {
              resolve(result);
            } else {
              reject(new Error(error));
            }
            break;

          case 'parse-progress':
            if (onProgress) {
              onProgress(progress);
            }
            break;

          case 'error':
            this.isParsing = false;
            this.worker.removeEventListener('message', handleMessage);
            reject(new Error(error));
            break;
        }
      };

      this.worker.addEventListener('message', handleMessage);

      // Choose parsing strategy based on data type and size
      if (typeof buffer === 'string') {
        // Text format - use original text parser
        try {
          const result = FomapParser.parse(buffer);
          this.isParsing = false;
          resolve(result);
          return;
        } catch (error) {
          this.isParsing = false;
          reject(error);
          return;
        }
      }
      
      // Binary format - use Web Worker
      const fileSize = buffer.byteLength;
      if (fileSize > 5 * 1024 * 1024) { // 5MB threshold
        // Use streaming for large files
        this.worker.postMessage({
          type: 'parse-streaming',
          data: { buffer, chunkSize: 512 * 1024 } // 512KB chunks
        });
      } else {
        // Use regular parsing for smaller files - pass buffer directly
        this.worker.postMessage({
          type: 'parse',
          data: buffer // Pass buffer directly, not wrapped
        });
      }
    });
  }

  /**
   * Cancel ongoing parsing
   */
  cancel() {
    if (this.worker && this.isParsing) {
      this.worker.terminate();
      this.worker = null;
      this.isParsing = false;
    }
  }

  /**
   * Cleanup worker resources
   */
  destroy() {
    this.cancel();
  }
}

/**
 * Fallback parser for when Web Workers are not available
 */
export class FallbackFomapParser {
  /**
   * Parse .fomap file synchronously (fallback)
   * @param {ArrayBuffer} buffer - File data
   * @returns {Object} Parsed map data
   */
  parseFile(buffer) {
    // Use the original FomapParser as fallback
    const view = new DataView(buffer);
    
    // Parse header
    const version = view.getUint32(0, true);
    if (version !== 4) {
      throw new Error(`Unsupported fomap version: ${version}`);
    }

    const header = {
      Version: version,
      MaxHexX: view.getUint16(4, true),
      MaxHexY: view.getUint16(6, true),
      WorkHexX: view.getUint16(8, true),
      WorkHexY: view.getUint16(10, true),
      ScriptModule: this.readString(view, 12, 260),
      ScriptFunc: this.readString(view, 272, 260),
      NoLogOut: view.getUint32(532, true),
      Time: view.getUint32(536, true),
      DayTime: this.readString(view, 540, 40),
      DayColor0: this.readString(view, 580, 40),
      DayColor1: this.readString(view, 620, 40),
      DayColor2: this.readString(view, 660, 40),
      DayColor3: this.readString(view, 700, 40)
    };

    // Parse tiles
    let pos = 736;
    const tileCount = view.getUint32(pos, true);
    pos += 4;
    
    const tiles = [];
    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        hexX: view.getUint16(pos, true),
        hexY: view.getUint16(pos + 2, true),
        tileId: view.getUint16(pos + 4, true),
        roofId: view.getUint16(pos + 6, true)
      });
      pos += 8;
    }

    // Parse objects
    const objectCount = view.getUint32(pos, true);
    pos += 4;
    
    const objects = [];
    for (let i = 0; i < objectCount; i++) {
      const obj = {
        MapX: view.getUint16(pos, true),
        MapY: view.getUint16(pos + 2, true),
        MapObjType: view.getUint8(pos + 4),
        ProtoId: view.getUint16(pos + 6, true),
        OffsetX: view.getInt16(pos + 8, true),
        OffsetY: view.getInt16(pos + 10, true),
        OffsetZ: view.getInt16(pos + 12, true),
        Dir: view.getUint8(pos + 14),
        Frame: view.getUint8(pos + 15),
        Flags: view.getUint16(pos + 16, true),
        ScriptVal1: view.getUint32(pos + 18, true),
        ScriptVal2: view.getUint32(pos + 22, true),
        ScriptVal3: view.getUint32(pos + 26, true),
        ScriptVal4: view.getUint32(pos + 30, true),
        ScriptVal5: view.getUint32(pos + 34, true),
        ScriptVal6: view.getUint32(pos + 38, true),
        ScriptVal7: view.getUint32(pos + 42, true),
        ScriptVal8: view.getUint32(pos + 46, true),
        Reserved: view.getUint32(pos + 50, true),
        Lexems: []
      };
      
      // Parse lexems
      let lexemPos = pos + 54;
      for (let j = 0; j < 4; j++) {
        const lexemLength = view.getUint32(lexemPos, true);
        lexemPos += 4;
        
        if (lexemLength > 0) {
          obj.Lexems.push(this.readString(view, lexemPos, lexemLength));
          lexemPos += lexemLength;
        }
      }
      
      objects.push(obj);
      pos += 68;
    }

    return { header, tiles, objects };
  }

  readString(view, offset, maxLength) {
    let result = '';
    for (let i = 0; i < maxLength; i++) {
      const char = view.getUint8(offset + i);
      if (char === 0) break;
      result += String.fromCharCode(char);
    }
    return result;
  }
}

/**
 * Factory function to create appropriate parser
 */
export function createFomapParser() {
  // Check if Web Workers are available
  if (typeof Worker !== 'undefined') {
    try {
      return new StreamingFomapParser();
    } catch (error) {
      console.warn('Web Worker creation failed, using fallback parser:', error);
    }
  }
  
  return new FallbackFomapParser();
}
