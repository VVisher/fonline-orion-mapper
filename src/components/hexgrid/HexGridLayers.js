import { Graphics } from 'pixi.js';
import {
  renderGridLayerVTS,
  renderTileLayerVTS,
  renderObjectLayerVTS,
  renderOverlayLayerVTS
} from './VirtualTileSystem.js';

/**
 * Optimized rendering layer utilities for HexGrid using Virtual Tile System (VTS).
 * Each function receives the relevant PixiJS container and data.
 * VTS ensures only visible tiles/objects are rendered for optimal performance.
 */

export function renderGridLayer({ layer, camera, width, height, maxX, maxY, getHexVertices, GRID_COLOR = 0x444444, GRID_ALPHA = 0.3 }) {
  renderGridLayerVTS(layer, camera, width, height, maxX, maxY, getHexVertices, GRID_COLOR, GRID_ALPHA);
}

export function renderTileLayer({ layer, tiles, camera, width, height, maxHexX, maxHexY, getHexVertices, TILE_COLOR = 0x2a7858, TILE_ALPHA = 0.8 }) {
  renderTileLayerVTS(layer, tiles, camera, width, height, maxHexX, maxHexY, getHexVertices, TILE_COLOR, TILE_ALPHA);
}

export function renderObjectLayer({ layer, objects, selectedObjects, camera, width, height, maxHexX, maxHexY, getHexVertices, OBJ_COLORS = {}, SELECT_COLOR = 0xffaa00 }) {
  renderObjectLayerVTS(layer, objects, selectedObjects, camera, width, height, maxHexX, maxHexY, getHexVertices, OBJ_COLORS, SELECT_COLOR);
}

export function renderOverlayLayer({ layer, hoveredHex, selectedHex, getHexVertices, HOVER_COLOR = 0x00ff88, HOVER_ALPHA = 0.3, SELECT_COLOR = 0xffaa00, SELECT_ALPHA = 0.8 }) {
  renderOverlayLayerVTS(layer, hoveredHex, selectedHex, getHexVertices, HOVER_COLOR, HOVER_ALPHA, SELECT_COLOR, SELECT_ALPHA);
}
