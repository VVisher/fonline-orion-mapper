/**
 * Binary map format for reduced memory footprint
 * Compact binary representation of .fomap data
 */

export class BinaryMapFormat {
  constructor() {
    this.VERSION = 1;
    this.MAGIC_NUMBER = 0x4F4D4246; // 'OMBF' - Orion Mapper Binary Format
  }

  /**
   * Convert map data to compact binary format
   * @param {Object} mapData - Map data from parser
   * @returns {ArrayBuffer} Compact binary representation
   */
  serialize(mapData) {
    // Calculate total size needed
    const headerSize = this.calculateHeaderSize(mapData.header);
    const tilesSize = mapData.tiles.length * 8; // 8 bytes per tile
    const objectsSize = this.calculateObjectsSize(mapData.objects);
    const totalSize = 16 + headerSize + tilesSize + objectsSize; // 16 for header + magic + version + sizes

    // Create buffer and view
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Write magic number and version
    view.setUint32(offset, this.MAGIC_NUMBER, true);
    offset += 4;
    view.setUint32(offset, this.VERSION, true);
    offset += 4;

    // Write section sizes
    view.setUint32(offset, headerSize, true);
    offset += 4;
    view.setUint32(offset, tilesSize, true);
    offset += 4;
    view.setUint32(offset, objectsSize, true);
    offset += 4;

    // Write header
    offset += this.writeHeader(view, offset, mapData.header);

    // Write tiles
    offset += this.writeTiles(view, offset, mapData.tiles);

    // Write objects
    offset += this.writeObjects(view, offset, mapData.objects);

    return buffer;
  }

  /**
   * Deserialize binary format back to map data
   * @param {ArrayBuffer} buffer - Binary data
   * @returns {Object} Map data
   */
  deserialize(buffer) {
    const view = new DataView(buffer);
    let offset = 0;

    // Read and verify magic number
    const magic = view.getUint32(offset, true);
    offset += 4;
    if (magic !== this.MAGIC_NUMBER) {
      throw new Error('Invalid binary map format');
    }

    // Read version
    const version = view.getUint32(offset, true);
    offset += 4;
    if (version !== this.VERSION) {
      throw new Error(`Unsupported binary format version: ${version}`);
    }

    // Read section sizes
    const headerSize = view.getUint32(offset, true);
    offset += 4;
    const tilesSize = view.getUint32(offset, true);
    offset += 4;
    const objectsSize = view.getUint32(offset, true);
    offset += 4;

    // Read sections
    const header = this.readHeader(view, offset, headerSize);
    offset += headerSize;

    const tiles = this.readTiles(view, offset, tilesSize);
    offset += tilesSize;

    const objects = this.readObjects(view, offset, objectsSize);

    return { header, tiles, objects };
  }

  /**
   * Calculate header size in bytes
   */
  calculateHeaderSize(header) {
    let size = 0;
    size += 4; // Version
    size += 2; // MaxHexX
    size += 2; // MaxHexY
    size += 2; // WorkHexX
    size += 2; // WorkHexY
    size += 260; // ScriptModule
    size += 260; // ScriptFunc
    size += 4; // NoLogOut
    size += 4; // Time
    size += 40; // DayTime
    size += 40; // DayColor0
    size += 40; // DayColor1
    size += 40; // DayColor2
    size += 40; // DayColor3
    return size;
  }

  /**
   * Calculate objects size in bytes
   */
  calculateObjectsSize(objects) {
    return objects.length * 48; // 48 bytes per object (optimized)
  }

  /**
   * Write header to binary
   */
  writeHeader(view, offset, header) {
    const startOffset = offset;
    
    view.setUint32(offset, header.Version || 4, true);
    offset += 4;
    view.setUint16(offset, header.MaxHexX || 200, true);
    offset += 2;
    view.setUint16(offset, header.MaxHexY || 200, true);
    offset += 2;
    view.setUint16(offset, header.WorkHexX || 100, true);
    offset += 2;
    view.setUint16(offset, header.WorkHexY || 100, true);
    offset += 2;
    
    offset += this.writeString(view, offset, header.ScriptModule || '-', 260);
    offset += this.writeString(view, offset, header.ScriptFunc || '-', 260);
    
    view.setUint32(offset, header.NoLogOut || 0, true);
    offset += 4;
    view.setUint32(offset, header.Time || 0, true);
    offset += 4;
    
    offset += this.writeString(view, offset, header.DayTime || '300  600  1140 1380', 40);
    offset += this.writeString(view, offset, header.DayColor0 || '18  18  53 ', 40);
    offset += this.writeString(view, offset, header.DayColor1 || '128 128 128', 40);
    offset += this.writeString(view, offset, header.DayColor2 || '103 95  86 ', 40);
    offset += this.writeString(view, offset, header.DayColor3 || '51  40  29 ', 40);
    
    return offset - startOffset;
  }

  /**
   * Read header from binary
   */
  readHeader(view, offset, size) {
    let currentOffset = offset;
    
    const header = {
      Version: view.getUint32(currentOffset, true),
      MaxHexX: view.getUint16(currentOffset + 4, true),
      MaxHexY: view.getUint16(currentOffset + 6, true),
      WorkHexX: view.getUint16(currentOffset + 8, true),
      WorkHexY: view.getUint16(currentOffset + 10, true),
      ScriptModule: this.readString(view, currentOffset + 12, 260),
      ScriptFunc: this.readString(view, currentOffset + 272, 260),
      NoLogOut: view.getUint32(currentOffset + 532, true),
      Time: view.getUint32(currentOffset + 536, true),
      DayTime: this.readString(view, currentOffset + 540, 40),
      DayColor0: this.readString(view, currentOffset + 580, 40),
      DayColor1: this.readString(view, currentOffset + 620, 40),
      DayColor2: this.readString(view, currentOffset + 660, 40),
      DayColor3: this.readString(view, currentOffset + 700, 40),
    };
    
    return header;
  }

  /**
   * Write tiles to binary
   */
  writeTiles(view, offset, tiles) {
    const startOffset = offset;
    
    for (const tile of tiles) {
      view.setUint16(offset, tile.hexX, true);
      offset += 2;
      view.setUint16(offset, tile.hexY, true);
      offset += 2;
      view.setUint16(offset, tile.tileId || 0, true);
      offset += 2;
      view.setUint16(offset, tile.roofId || 0, true);
      offset += 2;
    }
    
    return offset - startOffset;
  }

  /**
   * Read tiles from binary
   */
  readTiles(view, offset, size) {
    const tiles = [];
    const tileCount = size / 8;
    let currentOffset = offset;
    
    for (let i = 0; i < tileCount; i++) {
      tiles.push({
        hexX: view.getUint16(currentOffset, true),
        hexY: view.getUint16(currentOffset + 2, true),
        tileId: view.getUint16(currentOffset + 4, true),
        roofId: view.getUint16(currentOffset + 6, true),
      });
      currentOffset += 8;
    }
    
    return tiles;
  }

  /**
   * Write objects to binary (optimized)
   */
  writeObjects(view, offset, objects) {
    const startOffset = offset;
    
    for (const obj of objects) {
      view.setUint16(offset, obj.MapX, true);
      offset += 2;
      view.setUint16(offset, obj.MapY, true);
      offset += 2;
      view.setUint8(offset, obj.MapObjType || 0);
      offset += 1;
      view.setUint16(offset, obj.ProtoId || 0, true);
      offset += 2;
      view.setInt16(offset, obj.OffsetX || 0, true);
      offset += 2;
      view.setInt16(offset, obj.OffsetY || 0, true);
      offset += 2;
      view.setInt16(offset, obj.OffsetZ || 0, true);
      offset += 2;
      view.setUint8(offset, obj.Dir || 0);
      offset += 1;
      view.setUint8(offset, obj.Frame || 0);
      offset += 1;
      view.setUint16(offset, obj.Flags || 0, true);
      offset += 2;
      
      // Pack script values into single 32-bit value (space optimization)
      const packedScript = this.packScriptValues(obj);
      view.setUint32(offset, packedScript, true);
      offset += 4;
      
      // Pack light values into single 16-bit value
      const packedLight = this.packLightValues(obj);
      view.setUint16(offset, packedLight, true);
      offset += 2;
      
      // Reserved space
      view.setUint16(offset, 0, true);
      offset += 2;
    }
    
    return offset - startOffset;
  }

  /**
   * Read objects from binary
   */
  readObjects(view, offset, size) {
    const objects = [];
    const objectCount = size / 48;
    let currentOffset = offset;
    
    for (let i = 0; i < objectCount; i++) {
      const obj = {
        MapX: view.getUint16(currentOffset, true),
        MapY: view.getUint16(currentOffset + 2, true),
        MapObjType: view.getUint8(currentOffset + 4),
        ProtoId: view.getUint16(currentOffset + 5, true),
        OffsetX: view.getInt16(currentOffset + 7, true),
        OffsetY: view.getInt16(currentOffset + 9, true),
        OffsetZ: view.getInt16(currentOffset + 11, true),
        Dir: view.getUint8(currentOffset + 13),
        Frame: view.getUint8(currentOffset + 14),
        Flags: view.getUint16(currentOffset + 15, true),
      };
      
      // Unpack script values
      const packedScript = view.getUint32(currentOffset + 17, true);
      Object.assign(obj, this.unpackScriptValues(packedScript));
      
      // Unpack light values
      const packedLight = view.getUint16(currentOffset + 21, true);
      Object.assign(obj, this.unpackLightValues(packedLight));
      
      // Initialize empty arrays for compatibility
      obj.Lexems = [];
      
      objects.push(obj);
      currentOffset += 48;
    }
    
    return objects;
  }

  /**
   * Pack script values into single 32-bit value
   */
  packScriptValues(obj) {
    const val1 = obj.ScriptVal1 || 0;
    const val2 = obj.ScriptVal2 || 0;
    const val3 = obj.ScriptVal3 || 0;
    const val4 = obj.ScriptVal4 || 0;
    
    // Pack as 4x8-bit values (simplified)
    return (val1 & 0xFF) | ((val2 & 0xFF) << 8) | ((val3 & 0xFF) << 16) | ((val4 & 0xFF) << 24);
  }

  /**
   * Unpack script values from 32-bit value
   */
  unpackScriptValues(packed) {
    return {
      ScriptVal1: packed & 0xFF,
      ScriptVal2: (packed >> 8) & 0xFF,
      ScriptVal3: (packed >> 16) & 0xFF,
      ScriptVal4: (packed >> 24) & 0xFF,
      ScriptVal5: 0, // Default values for packed format
      ScriptVal6: 0,
      ScriptVal7: 0,
      ScriptVal8: 0,
    };
  }

  /**
   * Pack light values into single 16-bit value
   */
  packLightValues(obj) {
    const distance = Math.min(20, Math.max(0, obj.LightDistance || 0));
    const intensity = Math.min(100, Math.max(0, obj.LightIntensity || 0));
    
    return (distance << 8) | intensity;
  }

  /**
   * Unpack light values from 16-bit value
   */
  unpackLightValues(packed) {
    return {
      LightDistance: packed >> 8,
      LightIntensity: packed & 0xFF,
    };
  }

  /**
   * Write string to binary with fixed length
   */
  writeString(view, offset, str, maxLength) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const bytesToWrite = Math.min(bytes.length, maxLength);
    
    for (let i = 0; i < bytesToWrite; i++) {
      view.setUint8(offset + i, bytes[i]);
    }
    
    // Null-terminate if space allows
    if (bytesToWrite < maxLength) {
      view.setUint8(offset + bytesToWrite, 0);
    }
    
    return maxLength;
  }

  /**
   * Read string from binary with fixed length
   */
  readString(view, offset, maxLength) {
    let result = '';
    for (let i = 0; i < maxLength; i++) {
      const char = view.getUint8(offset + i);
      if (char === 0) break;
      result += String.fromCharCode(char);
    }
    return result;
  }

  /**
   * Get compression ratio compared to text format
   */
  getCompressionRatio(mapData) {
    const binaryBuffer = this.serialize(mapData);
    const binarySize = binaryBuffer.byteLength;
    
    // Estimate text size
    const textEstimate = JSON.stringify(mapData).length;
    
    return {
      binarySize,
      textEstimate,
      ratio: textEstimate / binarySize,
      savings: textEstimate - binarySize
    };
  }
}
