/**
 * Logger — centralized production log for the mapper.
 *
 * Components push messages here; the ConsolePanel subscribes and displays them.
 * Messages have a level: 'info', 'warn', 'error', 'cmd'.
 */

const MAX_LINES = 500;

class Logger {
  constructor() {
    this._lines = [];
    this._listeners = new Set();
  }

  info(msg)  { this._push('info', msg); }
  warn(msg)  { this._push('warn', msg); }
  error(msg) { this._push('error', msg); }
  cmd(msg)   { this._push('cmd', msg); }

  get lines() { return this._lines; }

  clear() {
    this._lines.length = 0;
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _push(level, text) {
    const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
    this._lines.push({ level, text, ts });
    if (this._lines.length > MAX_LINES) {
      this._lines.shift();
    }
    this._notify();
  }

  _notify() {
    for (const fn of this._listeners) fn();
  }
}

// Singleton
export const logger = new Logger();
