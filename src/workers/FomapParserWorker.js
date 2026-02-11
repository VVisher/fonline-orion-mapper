/**
 * Web Worker for parsing .fomap files off the main thread
 * Prevents UI freezing during large file loading
 */

// Import the parser functions - we'll need to inline them since workers can't import modules directly
function parseFomapChunk(buffer, offset, size) {
  // Inline minimal parsing logic for chunks
  const view = new DataView(buffer, offset, size);
  const result = {
    header: null,
    tiles: [],
    objects: [],
    bytesRead: 0
  };
  
  let pos = 0;
  
  // Parse header
  if (pos + 4 <= size) {
    const version = view.getUint32(pos, true);
    pos += 4;
    
    if (version !== 4) {
      throw new Error(`Unsupported fomap version: ${version}`);
    }
    
    // Parse header fields
    result.header = {
      Version: version,
      MaxHexX: view.getUint16(pos, true),
      MaxHexY: view.getUint16(pos + 2, true),
      WorkHexX: view.getUint16(pos + 4, true),
      WorkHexY: view.getUint16(pos + 6, true),
      ScriptModule: readString(view, pos + 8, 260),
      ScriptFunc: readString(view, pos + 268, 260),
      NoLogOut: view.getUint32(pos + 528, true),
      Time: view.getUint32(pos + 532, true),
      DayTime: readString(view, pos + 536, 40),
      DayColor0: readString(view, pos + 576, 40),
      DayColor1: readString(view, pos + 616, 40),
      DayColor2: readString(view, pos + 656, 40),
      DayColor3: readString(view, pos + 696, 40)
    };
    
    pos = 736; // Header size
  }
  
  // Parse tiles
  if (pos + 4 <= size) {
    const tileCount = view.getUint32(pos, true);
    pos += 4;
    
    for (let i = 0; i < tileCount && pos + 8 <= size; i++) {
      result.tiles.push({
        hexX: view.getUint16(pos, true),
        hexY: view.getUint16(pos + 2, true),
        tileId: view.getUint16(pos + 4, true),
        roofId: view.getUint16(pos + 6, true)
      });
      pos += 8;
    }
  }
  
  // Parse objects
  if (pos + 4 <= size) {
    const objectCount = view.getUint32(pos, true);
    pos += 4;
    
    for (let i = 0; i < objectCount && pos + 68 <= size; i++) {
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
      
      // Parse lexems (optional)
      let lexemPos = pos + 54;
      for (let j = 0; j < 4 && lexemPos + 4 <= size; j++) {
        const lexemLength = view.getUint32(lexemPos, true);
        lexemPos += 4;
        
        if (lexemLength > 0 && lexemPos + lexemLength <= size) {
          obj.Lexems.push(readString(view, lexemPos, lexemLength));
          lexemPos += lexemLength;
        }
      }
      
      result.objects.push(obj);
      pos += 68; // Base object size
    }
  }
  
  result.bytesRead = pos;
  return result;
}

function readString(view, offset, maxLength) {
  let result = '';
  for (let i = 0; i < maxLength; i++) {
    const char = view.getUint8(offset + i);
    if (char === 0) break;
    result += String.fromCharCode(char);
  }
  return result;
}

// Worker message handler
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'parse':
        // Handle both direct buffer and nested buffer
        const buffer = data.buffer || data;
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error('Expected ArrayBuffer but received: ' + typeof buffer);
        }
        
        const chunkSize = data.chunkSize || 1024 * 1024; // 1MB chunks
        const result = parseFomapChunk(buffer, 0, buffer.byteLength);
        self.postMessage({ 
          type: 'parse-complete', 
          result: result,
          success: true 
        });
        break;
        
      case 'parse-streaming':
        // For very large files, parse in chunks
        const streamBuffer = data.buffer || data;
        if (!(streamBuffer instanceof ArrayBuffer)) {
          throw new Error('Expected ArrayBuffer but received: ' + typeof streamBuffer);
        }
        
        const streamChunkSize = data.chunkSize || 512 * 1024;
        const totalSize = streamBuffer.byteLength;
        const chunks = [];
        
        for (let offset = 0; offset < totalSize; offset += streamChunkSize) {
          const size = Math.min(streamChunkSize, totalSize - offset);
          const chunk = parseFomapChunk(streamBuffer, offset, size);
          chunks.push(chunk);
          
          // Report progress
          self.postMessage({
            type: 'parse-progress',
            progress: (offset + size) / totalSize,
            chunk: chunk
          });
        }
        
        // Merge chunks (simplified - in real implementation would need proper merging)
        const merged = chunks[0] || { header: null, tiles: [], objects: [] };
        for (let i = 1; i < chunks.length; i++) {
          merged.tiles.push(...chunks[i].tiles);
          merged.objects.push(...chunks[i].objects);
        }
        
        self.postMessage({
          type: 'parse-streaming-complete',
          result: merged,
          success: true
        });
        break;
        
      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message,
      success: false
    });
  }
};
