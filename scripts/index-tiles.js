#!/usr/bin/env node
/**
 * index-tiles.js — Scan a FOnline client's data/art/tiles/ folder
 * and produce a JSON index of all available tile .frm files.
 *
 * Usage:
 *   node scripts/index-tiles.js <clientPath>
 *
 * Output:
 *   source/database/tiles.json
 *
 * Format:
 *   {
 *     "generated": "2025-...",
 *     "clientPath": "...",
 *     "count": 1234,
 *     "categories": {
 *       "EDG": ["EDG5000.frm", "EDG5001.frm", ...],
 *       "DES": [...],
 *       ...
 *     },
 *     "all": ["art\\tiles\\EDG5000.frm", ...]
 *   }
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/index-tiles.js <clientPath>');
  console.error('  clientPath: root of the FOnline client folder');
  process.exit(1);
}

const clientPath = path.resolve(args[0]);
const tilesDir = path.join(clientPath, 'data', 'art', 'tiles');
const outDir = path.resolve('source', 'database');
const outFile = path.join(outDir, 'tiles.json');

if (!fs.existsSync(tilesDir)) {
  console.error(`Tiles directory not found: ${tilesDir}`);
  console.error('Expected <clientPath>/data/art/tiles/ to exist.');
  process.exit(1);
}

console.log(`Scanning: ${tilesDir}`);

const files = fs.readdirSync(tilesDir).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return ext === '.frm' || ext === '.png' || ext === '.bmp' || ext === '.fofrm';
}).sort();

console.log(`Found ${files.length} tile files.`);

// Categorize by prefix (letters before first digit)
const categories = {};
const all = [];

for (const file of files) {
  const relPath = `art\\tiles\\${file}`;
  all.push(relPath);

  // Extract prefix: letters before first digit
  const match = file.match(/^([A-Za-z]+)/);
  const prefix = match ? match[1].toUpperCase() : 'OTHER';

  if (!categories[prefix]) categories[prefix] = [];
  categories[prefix].push(file);
}

// Sort category keys
const sortedCategories = {};
for (const key of Object.keys(categories).sort()) {
  sortedCategories[key] = categories[key];
}

const index = {
  generated: new Date().toISOString(),
  clientPath,
  count: all.length,
  categories: sortedCategories,
  all,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Wrote ${outFile}`);
console.log(`Categories: ${Object.keys(sortedCategories).join(', ')}`);
console.log(`Total tiles: ${all.length}`);
