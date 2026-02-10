/**
 * History — undo/redo stack for MapState.
 *
 * Stores deep snapshots of { tiles, objects } (not selection/UI state).
 * Each entry has a human-readable label for the HistoryPanel.
 * Max stack depth prevents unbounded memory growth.
 */

const MAX_UNDO = 200;

export class History {
  constructor(mapState) {
    this._mapState = mapState;
    this._undoStack = [];   // { label, snapshot }
    this._redoStack = [];   // { label, snapshot }
    this._listeners = new Set();
  }

  /**
   * Take a snapshot of the current map data and push to undo stack.
   * Call this BEFORE making a mutation.
   * @param {string} [label='Edit'] — human-readable description
   */
  push(label = 'Edit') {
    const snap = this._snapshot();
    this._undoStack.push({ label, snapshot: snap });
    if (this._undoStack.length > MAX_UNDO) {
      this._undoStack.shift();
    }
    this._redoStack.length = 0;
    this._notify();
  }

  /**
   * Undo the last change.
   */
  undo() {
    if (this._undoStack.length === 0) return false;
    const entry = this._undoStack.pop();
    const current = this._snapshot();
    this._redoStack.push({ label: entry.label, snapshot: current });
    this._restore(entry.snapshot);
    this._notify();
    return true;
  }

  /**
   * Redo the last undone change.
   */
  redo() {
    if (this._redoStack.length === 0) return false;
    const entry = this._redoStack.pop();
    const current = this._snapshot();
    this._undoStack.push({ label: entry.label, snapshot: current });
    this._restore(entry.snapshot);
    this._notify();
    return true;
  }

  /**
   * Jump to a specific undo index (0 = oldest).
   */
  jumpTo(index) {
    if (index < 0 || index >= this._undoStack.length) return false;
    // Everything after index goes to redo
    const current = this._snapshot();
    const currentLabel = this._undoStack.length > 0
      ? this._undoStack[this._undoStack.length - 1].label : 'State';
    // Entries after index become redo (in reverse)
    const toRedo = this._undoStack.splice(index + 1);
    toRedo.push({ label: currentLabel, snapshot: current });
    this._redoStack = toRedo.reverse().concat(this._redoStack);
    // Restore the target
    const target = this._undoStack.pop();
    this._restore(target.snapshot);
    this._notify();
    return true;
  }

  /**
   * Clear all history (e.g. on file load / new map).
   */
  clear() {
    this._undoStack.length = 0;
    this._redoStack.length = 0;
    this._notify();
  }

  get canUndo() { return this._undoStack.length > 0; }
  get canRedo() { return this._redoStack.length > 0; }
  get undoCount() { return this._undoStack.length; }
  get redoCount() { return this._redoStack.length; }

  /** Get labels for display in HistoryPanel. Most recent first. */
  get entries() {
    return this._undoStack.map((e, i) => ({ index: i, label: e.label })).reverse();
  }

  /** Get redo labels. */
  get redoEntries() {
    return this._redoStack.map((e, i) => ({ index: i, label: e.label }));
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _snapshot() {
    const ms = this._mapState;
    return {
      header: JSON.parse(JSON.stringify(ms.header)),
      tiles: ms.tiles.map(t => ({ ...t })),
      objects: ms.objects.map(o => ({ ...o })),
    };
  }

  _restore(snap) {
    const ms = this._mapState;
    ms.header = snap.header;
    ms.tiles = snap.tiles;
    ms.objects = snap.objects;
    ms.selectedObjects = [];
    ms._notify();
  }

  _notify() {
    for (const fn of this._listeners) fn();
  }
}
