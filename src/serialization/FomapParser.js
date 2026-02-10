/**
 * FomapParser - Parses .fomap file content into a structured map object.
 *
 * Output structure:
 * {
 *   header: { Version, MaxHexX, MaxHexY, WorkHexX, WorkHexY, ... },
 *   tiles: [{ hexX, hexY, path }, ...],
 *   objects: [{ MapObjType, ProtoId, MapX, MapY, ... }, ...]
 * }
 */

// Header fields that contain space-separated multi-value lists
const MULTI_VALUE_HEADER_FIELDS = new Set([
  'DayTime', 'DayColor0', 'DayColor1', 'DayColor2', 'DayColor3',
]);

// Fields whose values should remain as strings (not parsed to int)
const STRING_FIELDS = new Set([
  'ScriptModule', 'ScriptFunc', 'ScriptName', 'FuncName',
]);

// Critter param index fields store string identifiers like ST_DIALOG_ID
const CRITTER_PARAM_INDEX_RE = /^Critter_ParamIndex\d+$/;

export class FomapParser {
  /**
   * Parse a .fomap file content string into a map object.
   * @param {string} content - Raw file content
   * @returns {{ header: object, tiles: Array, objects: Array }}
   */
  static parse(content) {
    // Normalize line endings to \n
    const normalized = content.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');

    let section = null; // 'header', 'tiles', 'objects'
    const header = {};
    const tiles = [];
    const objects = [];
    let currentObject = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect section headers
      if (line === '[Header]') {
        section = 'header';
        continue;
      }
      if (line === '[Tiles]') {
        section = 'tiles';
        continue;
      }
      if (line === '[Objects]') {
        section = 'objects';
        continue;
      }

      // Skip empty lines (but in objects section, empty line = end of current object block)
      if (line.trim() === '') {
        if (section === 'objects' && currentObject !== null) {
          objects.push(currentObject);
          currentObject = null;
        }
        continue;
      }

      // Parse based on current section
      if (section === 'header') {
        FomapParser._parseHeaderLine(line, header);
      } else if (section === 'tiles') {
        FomapParser._parseTileLine(line, tiles);
      } else if (section === 'objects') {
        currentObject = FomapParser._parseObjectLine(line, currentObject);
      }
    }

    // Push last object if file doesn't end with blank line
    if (currentObject !== null) {
      objects.push(currentObject);
    }

    return { header, tiles, objects };
  }

  /**
   * Parse a single header line: "FieldName              value(s)"
   */
  static _parseHeaderLine(line, header) {
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (!match) return;

    const field = match[1];
    const rawValue = match[2];

    if (MULTI_VALUE_HEADER_FIELDS.has(field)) {
      // Split on whitespace, keep raw strings (preserve trailing spaces in DayColor)
      header[field] = rawValue;
    } else if (STRING_FIELDS.has(field)) {
      header[field] = rawValue.trim();
    } else {
      // Numeric value
      const num = parseInt(rawValue.trim(), 10);
      header[field] = isNaN(num) ? rawValue.trim() : num;
    }
  }

  /**
   * Parse a tile line: "tile       HexX  HexY       art\path\to\sprite.frm"
   * Tile format is column-based, not key-value.
   */
  static _parseTileLine(line, tiles) {
    const match = line.match(/^tile\s+(\d+)\s+(\d+)\s+(.+)$/);
    if (!match) return;

    tiles.push({
      hexX: parseInt(match[1], 10),
      hexY: parseInt(match[2], 10),
      path: match[3].trim(),
    });
  }

  /**
   * Parse a single object field line. Creates new object on MapObjType,
   * adds fields to current object otherwise.
   */
  static _parseObjectLine(line, currentObject) {
    const match = line.match(/^(\S+)\s+(.+)$/);
    if (!match) return currentObject;

    const field = match[1];
    const rawValue = match[2].trim();

    // MapObjType starts a new object block
    if (field === 'MapObjType') {
      // If there was a previous object without a blank line separator, push it
      // (shouldn't happen in well-formed files, but be safe)
      if (currentObject !== null) {
        // This case is handled by the caller pushing on blank lines
      }
      currentObject = { MapObjType: parseInt(rawValue, 10) };
      return currentObject;
    }

    if (currentObject === null) {
      // Orphan field before any MapObjType — skip
      return currentObject;
    }

    // Determine value type
    if (STRING_FIELDS.has(field) || CRITTER_PARAM_INDEX_RE.test(field)) {
      currentObject[field] = rawValue;
    } else {
      const num = parseInt(rawValue, 10);
      currentObject[field] = isNaN(num) ? rawValue : num;
    }

    return currentObject;
  }
}
