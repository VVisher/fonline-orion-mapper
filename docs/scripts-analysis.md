# Scripts Directory Analysis

## Overview
This document analyzes all scripts in the `/scripts/` directory, categorizing them by purpose, identifying duplicates, and recommending which ones to keep, remove, or consolidate.

## Script Categories

### 1. Entity Database Scripts (Current/Active)
These scripts are part of the new FOnline Entity Database system.

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **create-entity-db.cjs** | Creates the enhanced SQLite database schema with 43 columns for entities | ✅ ACTIVE | **KEEP** - Core database initialization |
| **parse-all-entities.cjs** | Batch processes all .fopro files and populates the entity database | ✅ ACTIVE | **KEEP** - Main parsing script |
| **entityParser.cjs** (in src/) | Core parser with Nexus heuristic detection matrix | ✅ ACTIVE | **KEEP** - Parser logic |

### 2. Legacy Proto Scripts (Superseded)
These scripts were for the older proto-only system and are now superseded by the Entity Database.

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **build-proto-db.js** | Builds SQLite database from all-protos.json (legacy schema) | ❌ SUPERSEDED | **REMOVE** - Replaced by entity database |
| **parse-all-protos.js** | Parses .fopro files into JSON format | ❌ SUPERSEDED | **REMOVE** - Entity parser is more comprehensive |
| **proto-serializer.js** | Converts JSON back to .fopro format | ❌ SUPERSEDED | **REMOVE** - No longer needed |
| **proto-workflow.js** | Orchestrates the complete proto pipeline | ❌ SUPERSEDED | **REMOVE** - Entity workflow replaces this |

### 3. Server Index Scripts (Utility)
These scripts index FOnline server data into JSON files.

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **index-server.js** | Parses server files (critters, items, maps, defines) into JSON | ✅ ACTIVE | **KEEP** - Useful for server data analysis |
| **index-tiles.js** | Indexes tile data | ✅ ACTIVE | **KEEP** - Tile management |

### 4. Validation Scripts (Utility)
Python scripts for validating generated indexes.

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **validate_index.py** | Validates completeness of indexed data | ✅ ACTIVE | **KEEP** - Data integrity checking |
| **verify-index.py** | Verifies indexes against actual source files | ✅ ACTIVE | **KEEP** - Cross-validation utility |

### 5. Debug/Testing Scripts (Temporary)
These were created during debugging and can be removed.

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **check-schema.cjs** | Checks database schema and column count | ✅ DONE | **REMOVE** - Debugging complete |
| **count-placeholders.cjs** | Counts SQL placeholders in INSERT statements | ✅ DONE | **REMOVE** - Debugging complete |
| **count-values.cjs** | Counts values being passed to INSERT | ✅ DONE | **REMOVE** - Debugging complete |
| **debug-bindings.cjs** | Debugs SQLite binding issues | ✅ DONE | **REMOVE** - Debugging complete |
| **debug-insert.cjs** | Tests INSERT statements | ✅ DONE | **REMOVE** - Debugging complete |
| **fix-insert.cjs** | Fixes INSERT statement formatting | ✅ DONE | **REMOVE** - Debugging complete |
| **manual-fix.cjs** | Manual fix for INSERT statement | ✅ DONE | **REMOVE** - Debugging complete |
| **recreate-insert.cjs** | Recreates INSERT statement | ✅ DONE | **REMOVE** - Debugging complete |
| **test-full-insert.cjs** | Tests full INSERT with all columns | ✅ DONE | **REMOVE** - Debugging complete |
| **test-insert.cjs** | Generates INSERT statement from schema | ✅ DONE | **REMOVE** - Debugging complete |
| **test-minimal-insert.cjs** | Tests minimal INSERT operation | ✅ DONE | **REMOVE** - Debugging complete |

### 6. Project Management Scripts

| Script | Purpose | Status | Recommendation |
|--------|---------|--------|----------------|
| **update-status.js** | Updates project status, TODO files, generates changelogs | ✅ ACTIVE | **KEEP** - Project management utility |

## Cleanup Recommendations

### Scripts to Remove (13 files)
```bash
# Legacy proto scripts (4)
rm build-proto-db.js
rm parse-all-protos.js
rm proto-serializer.js
rm proto-workflow.js

# Debug/testing scripts (9)
rm check-schema.cjs
rm count-placeholders.cjs
rm count-values.cjs
rm debug-bindings.cjs
rm debug-insert.cjs
rm fix-insert.cjs
rm manual-fix.cjs
rm recreate-insert.cjs
rm test-full-insert.cjs
rm test-insert.cjs
rm test-minimal-insert.cjs
```

### Scripts to Keep (9 files)
1. **create-entity-db.cjs** - Database initialization
2. **parse-all-entities.cjs** - Main entity parsing
3. **index-server.js** - Server data indexing
4. **index-tiles.js** - Tile indexing
5. **validate_index.py** - Index validation
6. **verify-index.py** - Index verification
7. **update-status.js** - Project management
8. **validate_index.py** - Data integrity
9. **verify-index.py** - Cross-validation

## Functionality Mapping

### Entity Database Pipeline
```
create-entity-db.cjs → parse-all-entities.cjs → (populated entities.db)
```

### Server Index Pipeline
```
index-server.js → JSON files in source/database/
```

### Validation Pipeline
```
JSON files → validate_index.py → verify-index.py → validation report
```

## Dependencies

### Entity Database Scripts
- Use `better-sqlite3` for database operations
- Use `glob` for file scanning
- Depend on `src/database/entityParser.cjs`

### Server Index Scripts
- Pure Node.js with fs module
- No external dependencies

### Validation Scripts
- Python 3 required
- Standard library only

## Notes

1. **No Duplicates Found**: While some scripts have overlapping functionality (e.g., multiple validation scripts), they serve different purposes and complement each other.

2. **Legacy Code**: The proto-related scripts (build-proto-db.js, parse-all-protos.js, etc.) are completely superseded by the entity database system and can be safely removed.

3. **Debug Scripts**: All debug scripts were temporary and served their purpose during development. They can be removed to clean up the directory.

4. **File Extensions**: Mix of .js (ES modules) and .cjs (CommonJS) files. Consider standardizing on .cjs for consistency since most scripts use it.

## Future Improvements

1. **Consolidate Validation**: Consider combining validate_index.py and verify-index.py into a single comprehensive validation tool.

2. **Standardize Extensions**: Convert all .js files to .cjs for consistency.

3. **Add Help/Usage**: Add proper CLI help and usage information to all active scripts.

4. **Error Handling**: Improve error handling and logging across all scripts.
