/**
 * FomapSerializer - Serializes a structured map object back to .fomap file format.
 *
 * Input structure (from FomapParser):
 * {
 *   header: { Version, MaxHexX, MaxHexY, ... },
 *   tiles: [{ hexX, hexY, path }, ...],
 *   objects: [{ MapObjType, ProtoId, MapX, MapY, ... }, ...]
 * }
 */

// Value column start position (0-indexed) for object and header fields
const VALUE_COLUMN = 21;

// Ordered list of header fields as they appear in .fomap files
const HEADER_FIELD_ORDER = [
  'Version', 'MaxHexX', 'MaxHexY', 'WorkHexX', 'WorkHexY',
  'ScriptModule', 'ScriptFunc', 'NoLogOut', 'Time',
  'DayTime', 'DayColor0', 'DayColor1', 'DayColor2', 'DayColor3',
];

// Multi-value header fields that are stored as raw strings
const MULTI_VALUE_HEADER_FIELDS = new Set([
  'DayTime', 'DayColor0', 'DayColor1', 'DayColor2', 'DayColor3',
]);

// Ordered list of common object fields (non-critter)
const OBJECT_FIELD_ORDER = [
  'MapObjType', 'ProtoId', 'MapX', 'MapY',
  'Dir',
  'ScriptName', 'FuncName',
  'LightDistance', 'LightIntensity',
  'Critter_Cond', 'Critter_Anim1', 'Critter_Anim2',
  // Critter_ParamIndex/Value pairs handled dynamically
];

// Fields to skip if value is 0 (per spec: no OffsetX/Y if 0)
// Actually, let's not skip — we'll reproduce exactly what was parsed.
// The parser stores all fields present in the file.

export class FomapSerializer {
  /**
   * Serialize a map object to .fomap file content string.
   * @param {{ header: object, tiles: Array, objects: Array }} mapData
   * @returns {string} File content with Unix line endings
   */
  static serialize(mapData) {
    const lines = [];

    // [Header]
    lines.push('[Header]');
    FomapSerializer._serializeHeader(mapData.header, lines);
    lines.push('');

    // [Tiles]
    lines.push('[Tiles]');
    FomapSerializer._serializeTiles(mapData.tiles, lines);
    lines.push('');

    // [Objects]
    lines.push('[Objects]');
    FomapSerializer._serializeObjects(mapData.objects, lines);

    // File ends with a trailing newline
    return lines.join('\n') + '\n';
  }

  /**
   * Format a field-value line with value starting at VALUE_COLUMN.
   * If field name is >= VALUE_COLUMN chars, use at least 1 space.
   */
  static _formatField(fieldName, value) {
    const spacesNeeded = Math.max(1, VALUE_COLUMN - fieldName.length);
    return fieldName + ' '.repeat(spacesNeeded) + String(value);
  }

  /**
   * Serialize the header section.
   */
  static _serializeHeader(header, lines) {
    for (const field of HEADER_FIELD_ORDER) {
      if (header[field] === undefined) continue;

      const value = header[field];
      if (MULTI_VALUE_HEADER_FIELDS.has(field)) {
        // Raw string preserved from parsing (keeps original spacing)
        lines.push(FomapSerializer._formatField(field, value));
      } else {
        lines.push(FomapSerializer._formatField(field, value));
      }
    }
  }

  /**
   * Serialize the tiles section.
   * Format: tile       HexX  HexY       path
   * - "tile" + 7 spaces (cols 0-10)
   * - HexX right-aligned in 4 chars (cols 11-14)
   * - 2 spaces (cols 15-16)
   * - HexY right-aligned in 3 chars (cols 17-19)
   * - padding to col 27
   * - path
   */
  static _serializeTiles(tiles, lines) {
    for (const tile of tiles) {
      const xStr = String(tile.hexX).padStart(4, ' ');
      const yStr = String(tile.hexY).padStart(3, ' ');
      // "tile" (4) + 7 spaces = 11, + xStr(4) = 15, + 2 spaces = 17, + yStr(3) = 20
      // Need 7 more spaces to reach col 27, then path
      const line = `tile       ${xStr}  ${yStr}       ${tile.path}`;
      lines.push(line);
    }
  }

  /**
   * Serialize the objects section.
   * Each object block is separated by a blank line.
   */
  static _serializeObjects(objects, lines) {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      FomapSerializer._serializeSingleObject(obj, lines);

      // Blank line after each object
      lines.push('');
    }
  }

  /**
   * Serialize a single object block.
   * Outputs fields in a deterministic order:
   *   1. Known fields in OBJECT_FIELD_ORDER
   *   2. Critter_ParamIndex/Value pairs in order
   *   3. OffsetX, OffsetY
   *   4. Item_Val0 through Item_Val9
   *   5. Any remaining unknown fields
   */
  static _serializeSingleObject(obj, lines) {
    const written = new Set();

    // 1. Write known ordered fields
    for (const field of OBJECT_FIELD_ORDER) {
      if (obj[field] !== undefined) {
        lines.push(FomapSerializer._formatField(field, obj[field]));
        written.add(field);
      }
    }

    // 2. Write Critter_ParamIndex/Value pairs in order (0-9)
    for (let n = 0; n <= 9; n++) {
      const idxField = `Critter_ParamIndex${n}`;
      const valField = `Critter_ParamValue${n}`;
      if (obj[idxField] !== undefined) {
        lines.push(FomapSerializer._formatField(idxField, obj[idxField]));
        written.add(idxField);
        if (obj[valField] !== undefined) {
          lines.push(FomapSerializer._formatField(valField, obj[valField]));
          written.add(valField);
        }
      }
    }

    // 3. Write OffsetX, OffsetY
    for (const field of ['OffsetX', 'OffsetY']) {
      if (obj[field] !== undefined) {
        lines.push(FomapSerializer._formatField(field, obj[field]));
        written.add(field);
      }
    }

    // 4. Write Item_Val0 through Item_Val9
    for (let n = 0; n <= 9; n++) {
      const field = `Item_Val${n}`;
      if (obj[field] !== undefined) {
        lines.push(FomapSerializer._formatField(field, obj[field]));
        written.add(field);
      }
    }

    // 5. Write any remaining fields not yet written
    for (const field of Object.keys(obj)) {
      if (!written.has(field)) {
        lines.push(FomapSerializer._formatField(field, obj[field]));
      }
    }
  }
}
