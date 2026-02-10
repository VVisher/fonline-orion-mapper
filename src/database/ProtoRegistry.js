/**
 * ProtoRegistry — minimal PID → name/type lookup.
 *
 * Priority: server protos (if available) > internal fallback DB.
 * For now, provides a hardcoded set of common FOnline proto types
 * and a method to register additional protos at runtime.
 */

// MapObjType constants matching .fomap format
export const OBJ_TYPE_CRITTER = 0;
export const OBJ_TYPE_ITEM    = 1;
export const OBJ_TYPE_SCENERY = 2;

const OBJ_TYPE_NAMES = {
  [OBJ_TYPE_CRITTER]: 'Critter',
  [OBJ_TYPE_ITEM]:    'Item',
  [OBJ_TYPE_SCENERY]: 'Scenery',
};

// Internal fallback database — common PIDs
const _registry = new Map();

// Common scenery PIDs (walls, misc)
const FALLBACK_PROTOS = [
  { pid: 1,    name: 'Wall NS',         type: OBJ_TYPE_SCENERY },
  { pid: 2,    name: 'Wall EW',         type: OBJ_TYPE_SCENERY },
  { pid: 33,   name: 'Exit Grid',       type: OBJ_TYPE_SCENERY },
  { pid: 12,   name: 'Blocker',         type: OBJ_TYPE_SCENERY },
  { pid: 2000, name: 'Scroll Blocker',  type: OBJ_TYPE_SCENERY },
];

// Initialize with fallback
for (const p of FALLBACK_PROTOS) {
  _registry.set(p.pid, p);
}

/**
 * Look up a proto by PID.
 * @param {number} pid
 * @returns {{ pid: number, name: string, type: number } | null}
 */
export function getProto(pid) {
  return _registry.get(pid) || null;
}

/**
 * Get display name for a PID.
 * @param {number} pid
 * @returns {string}
 */
export function getProtoName(pid) {
  const p = _registry.get(pid);
  return p ? p.name : `PID ${pid}`;
}

/**
 * Get display name for a MapObjType.
 * @param {number} type
 * @returns {string}
 */
export function getObjTypeName(type) {
  return OBJ_TYPE_NAMES[type] || `Type ${type}`;
}

/**
 * Register a proto (or overwrite existing).
 * Used when loading protos from server.
 * @param {number} pid
 * @param {string} name
 * @param {number} type
 */
export function registerProto(pid, name, type) {
  _registry.set(pid, { pid, name, type });
}

/**
 * Bulk register protos.
 * @param {Array<{ pid: number, name: string, type: number }>} protos
 */
export function registerProtos(protos) {
  for (const p of protos) {
    _registry.set(p.pid, p);
  }
}

/**
 * Get all registered protos.
 * @returns {Array<{ pid: number, name: string, type: number }>}
 */
export function getAllProtos() {
  return [..._registry.values()];
}

/**
 * Get all protos of a specific type.
 * @param {number} type
 * @returns {Array<{ pid: number, name: string, type: number }>}
 */
export function getProtosByType(type) {
  return [..._registry.values()].filter(p => p.type === type);
}
