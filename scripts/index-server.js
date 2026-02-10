#!/usr/bin/env node
/**
 * index-server.js — Parse FOnline server data files and produce JSON indexes.
 *
 * Usage:
 *   node scripts/index-server.js <serverPath>
 *
 * Output (all in source/database/):
 *   critters.json   — from critter.lst + proto/critters/*.fopro
 *   items.json      — from items.lst + proto/items/*.fopro
 *   objects.json    — from FOOBJ.MSG (names/descriptions by PID)
 *   defines.json    — from _defines.fos (PID constants)
 *   npc_pids.json   — from _npc_pids.fos
 *   maps.json       — from GenerateWorld.cfg, Locations.cfg, _maps.fos, PHX_maps.fos
 *
 * Processing order:
 *   1. critter.lst / items.lst (proto lists)
 *   2. *.fopro files (proto details)
 *   3. FOOBJ.MSG (string names)
 *   4. _npc_pids.fos (NPC PID constants)
 *   5. _defines.fos (all constants — processed LAST)
 *   6. Map configs
 */

import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/index-server.js <serverPath>');
  process.exit(1);
}

const serverPath = path.resolve(args[0]);
const outDir = path.resolve('source', 'database');
fs.mkdirSync(outDir, { recursive: true });

function tryRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn(`  [SKIP] Not found: ${filePath}`);
    return null;
  }
}

function writeIndex(name, data) {
  const outFile = path.join(outDir, name);
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  Wrote: ${outFile}`);
}

// ─── 1. Parse .lst files ───
function parseLst(content) {
  // Each line is a proto file path, one per line. Line number = PID (1-indexed).
  const entries = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    entries.push({ pid: i, file: line });
  }
  return entries;
}

// ─── 2. Parse .fopro files ───
function parseFopro(content, filePath) {
  // .fopro format: key-value pairs, one per line
  // Lines like: "Key = Value" or "[Section]"
  const props = {};
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    if (trimmed.startsWith('[')) continue; // section header
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    props[key] = val;
  }
  return props;
}

// ─── 3. Parse FOOBJ.MSG ───
function parseFobjMsg(content) {
  // Format: {PID_BASE}{INDEX}{TEXT}
  // PID_BASE = PID * 100, INDEX: 0=name, 1=description
  // Example: {100}{0}{Knife}  {100}{1}{A sharp knife.}
  const entries = {};
  const re = /\{(\d+)\}\{(\d+)\}\{([^}]*)\}/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const msgId = parseInt(match[1], 10);
    const idx = parseInt(match[2], 10);
    const text = match[3];
    const pid = Math.floor(msgId / 100);
    if (!entries[pid]) entries[pid] = {};
    if (idx === 0) entries[pid].name = text;
    else if (idx === 1) entries[pid].description = text;
  }
  return entries;
}

// ─── 4. Parse .fos define files ───
function parseFosDefines(content) {
  // Lines like: #define PID_SOMETHING  (123)
  // or: #define PID_SOMETHING  123
  const defines = {};
  const re = /^#define\s+(\w+)\s+\(?\s*(\d+)\s*\)?/gm;
  let match;
  while ((match = re.exec(content)) !== null) {
    defines[match[1]] = parseInt(match[2], 10);
  }
  return defines;
}

// ─── 5. Parse NPC PIDs ───
function parseNpcPids(content) {
  // Same format as defines but specifically for NPC PIDs
  return parseFosDefines(content);
}

// ─── 6. Parse map configs ───
function parseMapConfig(content, fileName) {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith(';'));
  return { file: fileName, lines };
}

// ═══════════════════════════════════════════════
// Main indexing pipeline
// ═══════════════════════════════════════════════

console.log(`\nServer path: ${serverPath}\n`);

// --- Critters ---
console.log('=== Critters ===');
const critterLstPath = path.join(serverPath, 'proto', 'critter.lst');
const critterLst = tryRead(critterLstPath);
const critterIndex = { generated: new Date().toISOString(), entries: [] };

if (critterLst) {
  const lstEntries = parseLst(critterLst);
  console.log(`  critter.lst: ${lstEntries.length} entries`);

  const critProtoDir = path.join(serverPath, 'proto', 'critters');
  let protoCount = 0;
  for (const entry of lstEntries) {
    const protoPath = path.join(critProtoDir, entry.file);
    const protoContent = tryRead(protoPath);
    const props = protoContent ? parseFopro(protoContent, protoPath) : {};
    critterIndex.entries.push({
      pid: entry.pid,
      file: entry.file,
      props,
    });
    if (protoContent) protoCount++;
  }
  console.log(`  Parsed ${protoCount} .fopro files`);
}
critterIndex.count = critterIndex.entries.length;
writeIndex('critters.json', critterIndex);

// --- Items ---
console.log('\n=== Items ===');
const itemsLstPath = path.join(serverPath, 'proto', 'items.lst');
const itemsLst = tryRead(itemsLstPath);
const itemIndex = { generated: new Date().toISOString(), entries: [] };

if (itemsLst) {
  const lstEntries = parseLst(itemsLst);
  console.log(`  items.lst: ${lstEntries.length} entries`);

  const itemProtoDir = path.join(serverPath, 'proto', 'items');
  let protoCount = 0;
  for (const entry of lstEntries) {
    const protoPath = path.join(itemProtoDir, entry.file);
    const protoContent = tryRead(protoPath);
    const props = protoContent ? parseFopro(protoContent, protoPath) : {};
    itemIndex.entries.push({
      pid: entry.pid,
      file: entry.file,
      props,
    });
    if (protoContent) protoCount++;
  }
  console.log(`  Parsed ${protoCount} .fopro files`);
}
itemIndex.count = itemIndex.entries.length;
writeIndex('items.json', itemIndex);

// --- FOOBJ.MSG ---
console.log('\n=== Object Names (FOOBJ.MSG) ===');
const foobjPath = path.join(serverPath, 'text', 'engl', 'FOOBJ.MSG');
const foobjContent = tryRead(foobjPath);
const objectNames = { generated: new Date().toISOString(), entries: {} };

if (foobjContent) {
  objectNames.entries = parseFobjMsg(foobjContent);
  console.log(`  Parsed ${Object.keys(objectNames.entries).length} object entries`);
}
writeIndex('objects.json', objectNames);

// --- NPC PIDs ---
console.log('\n=== NPC PIDs ===');
const npcPidsPath = path.join(serverPath, 'scripts', '_npc_pids.fos');
const npcPidsContent = tryRead(npcPidsPath);
const npcPids = { generated: new Date().toISOString(), defines: {} };

if (npcPidsContent) {
  npcPids.defines = parseNpcPids(npcPidsContent);
  console.log(`  Parsed ${Object.keys(npcPids.defines).length} NPC PID defines`);
}
writeIndex('npc_pids.json', npcPids);

// --- Maps ---
console.log('\n=== Maps ===');
const mapsIndex = { generated: new Date().toISOString(), configs: [] };
const mapFiles = [
  path.join(serverPath, 'maps', 'GenerateWorld.cfg'),
  path.join(serverPath, 'maps', 'Locations.cfg'),
  path.join(serverPath, 'maps', '_maps.fos'),
  path.join(serverPath, 'maps', 'PHX_maps.fos'),
];
for (const mf of mapFiles) {
  const content = tryRead(mf);
  if (content) {
    mapsIndex.configs.push(parseMapConfig(content, path.basename(mf)));
  }
}
writeIndex('maps.json', mapsIndex);

// --- _defines.fos (LAST) ---
console.log('\n=== Defines (_defines.fos) — processed LAST ===');
const definesPath = path.join(serverPath, 'scripts', '_defines.fos');
const definesContent = tryRead(definesPath);
const definesIndex = { generated: new Date().toISOString(), defines: {} };

if (definesContent) {
  definesIndex.defines = parseFosDefines(definesContent);
  console.log(`  Parsed ${Object.keys(definesIndex.defines).length} defines`);
}
writeIndex('defines.json', definesIndex);

// --- _msgstr.fos ---
console.log('\n=== Message Strings (_msgstr.fos) ===');
const msgstrPath = path.join(serverPath, 'scripts', '_msgstr.fos');
const msgstrContent = tryRead(msgstrPath);
const msgstrIndex = { generated: new Date().toISOString(), defines: {} };

if (msgstrContent) {
  msgstrIndex.defines = parseFosDefines(msgstrContent);
  console.log(`  Parsed ${Object.keys(msgstrIndex.defines).length} message string defines`);
}
writeIndex('msgstr.json', msgstrIndex);

console.log('\n✓ Server indexing complete.\n');
