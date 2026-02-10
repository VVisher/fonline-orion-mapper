/**
 * MapState - Central state manager for the current map.
 * Holds header, tiles, objects, and selection state.
 * Used by both the renderer and the UI.
 */

// Layer modes for selection/visibility
export const LAYERS = [
  'tiles', 'scenery', 'items', 'critters', 'doors', 'roofs', 'blockers',
];

// MapObjType → layer mapping
export function objTypeToLayer(mapObjType, protoId) {
  // Blockers: scenery with specific PIDs (12 = Blocker, 2000 = Scroll Blocker)
  if (mapObjType === 2 && (protoId === 12 || protoId === 2000)) return 'blockers';
  switch (mapObjType) {
    case 0: return 'critters';
    case 1: return 'items';
    case 2: default: return 'scenery';
  }
}

export class MapState {
  constructor() {
    this.header = {
      Version: 4,
      MaxHexX: 200,
      MaxHexY: 200,
      WorkHexX: 100,
      WorkHexY: 100,
      ScriptModule: '-',
      ScriptFunc: '-',
      NoLogOut: 0,
      Time: 0,
      DayTime: '300  600  1140 1380',
      DayColor0: '18  18  53 ',
      DayColor1: '128 128 128',
      DayColor2: '103 95  86 ',
      DayColor3: '51  40  29 ',
    };
    this.tiles = [];
    this.objects = [];

    // Selection state
    this.selectedHex = null;       // { hx, hy }
    this.selectedObjects = [];     // indices into this.objects
    this.hoveredHex = null;        // { hx, hy }

    // Active layer for selection filtering
    this.activeLayer = 'tiles';    // one of LAYERS

    // Layer visibility
    this.layerVisibility = {};
    for (const l of LAYERS) this.layerVisibility[l] = true;

    // Dirty tracking
    this._dirty = false;
    this._savedSnapshot = null;

    // Listeners
    this._listeners = new Set();
  }

  /**
   * Load a parsed map into state.
   * @param {{ header: object, tiles: Array, objects: Array }} mapData
   */
  load(mapData) {
    this.header = { ...mapData.header };
    this.tiles = [...mapData.tiles];
    this.objects = [...mapData.objects];
    this.selectedHex = null;
    this.selectedObjects = [];
    this._dirty = false;
    this._savedSnapshot = this._makeSnapshot();
    this._notify();
  }

  /**
   * Get a snapshot for serialization.
   */
  toData() {
    return {
      header: { ...this.header },
      tiles: [...this.tiles],
      objects: [...this.objects],
    };
  }

  // ── Dirty tracking ──

  get dirty() { return this._dirty; }

  markDirty() {
    if (!this._dirty) {
      this._dirty = true;
      this._notify();
    }
  }

  markClean() {
    this._dirty = false;
    this._savedSnapshot = this._makeSnapshot();
    this._notify();
  }

  _makeSnapshot() {
    return JSON.stringify({ tiles: this.tiles, objects: this.objects });
  }

  // ── Layer operations ──

  setActiveLayer(layer) {
    if (LAYERS.includes(layer)) {
      this.activeLayer = layer;
      this._notify();
    }
  }

  toggleLayerVisibility(layer) {
    if (LAYERS.includes(layer)) {
      this.layerVisibility[layer] = !this.layerVisibility[layer];
      this._notify();
    }
  }

  // ── Tile operations ──

  addTile(hexX, hexY, path) {
    this.tiles.push({ hexX, hexY, path });
    this._dirty = true;
    this._notify();
  }

  removeTileAt(hexX, hexY) {
    const idx = this.tiles.findIndex(t => t.hexX === hexX && t.hexY === hexY);
    if (idx !== -1) {
      this.tiles.splice(idx, 1);
      this._dirty = true;
      this._notify();
    }
  }

  removeTile(index) {
    this.tiles.splice(index, 1);
    this._dirty = true;
    this._notify();
  }

  // ── Tool state ──

  setActiveTool(tool) {
    // tool: 'select' | 'tile' | 'object'
    this.activeTool = tool;
    this._notify();
  }

  setTileBrush(path) {
    this.tileBrush = path;
    this._notify();
  }

  // ── Object operations ──

  addObject(obj) {
    this.objects.push(obj);
    this._dirty = true;
    this._notify();
  }

  removeObject(index) {
    this.objects.splice(index, 1);
    this.selectedObjects = this.selectedObjects
      .filter(i => i !== index)
      .map(i => (i > index ? i - 1 : i));
    this._dirty = true;
    this._notify();
  }

  updateObject(index, fields) {
    this.objects[index] = { ...this.objects[index], ...fields };
    this._dirty = true;
    this._notify();
  }

  setHoveredHex(hex) {
    this.hoveredHex = hex;
    this._notify();
  }

  setSelectedHex(hex) {
    this.selectedHex = hex;
    this._notify();
  }

  selectObject(index, addToSelection = false) {
    if (addToSelection) {
      if (this.selectedObjects.includes(index)) {
        this.selectedObjects = this.selectedObjects.filter(i => i !== index);
      } else {
        this.selectedObjects = [...this.selectedObjects, index];
      }
    } else {
      this.selectedObjects = [index];
    }
    this._notify();
  }

  clearSelection() {
    this.selectedObjects = [];
    this.selectedHex = null;
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    for (const listener of this._listeners) {
      listener();
    }
  }
}
