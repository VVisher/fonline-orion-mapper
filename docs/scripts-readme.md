# Scripts Directory

This directory contains all utility scripts for the FOnline: Ashes of Phoenix Entity Database system.

## Database Location

The active database is located at:
```
data/entities.db
```

This SQLite database contains 9,259+ entities parsed from all .fopro files from **FOnline: Ashes of Phoenix**.

## Active Scripts

### Entity Database Management

#### create-entity-db.cjs
**Purpose**: Creates the enhanced SQLite database schema with 43 columns for entities
**Usage**: `node scripts/create-entity-db.cjs`
**Dependencies**: `better-sqlite3`

Creates the complete database schema including:
- Entity classification tables
- Script define tracking
- Relationship mapping
- Usage statistics
- Validation metadata

#### parse-all-entities.cjs
**Purpose**: Batch processes all .fopro files and populates the entity database
**Usage**: `node scripts/parse-all-entities.cjs`
**Dependencies**: `better-sqlite3`, `glob`, `src/database/entityParser.cjs`

Processes all .fopro files from `source/database/proto/` and:
- Parses entity properties using Nexus heuristic detection
- Classifies entities (Item, Scenery, Critter, Functional)
- Extracts interaction properties
- Populates the entities database with 9,399+ entities

### Server Data Indexing

#### index-server.cjs
**Purpose**: Parses **FOnline: Ashes of Phoenix** server data files and produces JSON indexes
**Usage**: `node scripts/index-server.cjs <serverPath>`
**Dependencies**: None (Node.js built-in modules)

Generates JSON files in `source/database/`:
- `critters.json` - from critter.lst + proto/critters/*.fopro
- `items.json` - from items.lst + proto/items/*.fopro
- `objects.json` - from FOOBJ.MSG (names/descriptions by PID)
- `defines.json` - from _defines.fos (PID constants)
- `npc_pids.json` - from _npc_pids.fos
- `maps.json` - from GenerateWorld.cfg, Locations.cfg, _maps.fos, PHX_maps.fos

#### index-tiles.cjs
**Purpose**: Indexes tile data for the mapper system
**Usage**: `node scripts/index-tiles.cjs`
**Dependencies**: None

Processes tile data for use in the hex grid rendering system.

### Data Validation

#### validate_index.py
**Purpose**: Validates the completeness and accuracy of indexed **FOnline: Ashes of Phoenix** data
**Usage**: `python scripts/validate_index.py [index_file]`
**Dependencies**: Python 3, standard library

Checks for:
- Missing entries
- Duplicates
- Orphaned references
- Data consistency

#### verify-index.py
**Purpose**: Verifies generated JSON indexes against actual **Ashes of Phoenix** source files
**Usage**: `python scripts/verify-index.py <serverPath> <clientPath>`
**Dependencies**: Python 3, standard library

Validates:
- tiles.json vs actual files in client/art/tiles/
- critters.json vs critter.lst + proto/critters/*.fopro
- items.json vs items.lst + proto/items/*.fopro
- objects.json vs FOOBJ.MSG entries
- defines.json vs _defines.fos

### Project Management

#### update-status.cjs
**Purpose**: Automated TODO/Task management and status tracking
**Usage**: `node scripts/update-status.cjs`
**Dependencies**: None

Features:
- Scans all task files for completion status
- Updates STATUS.md with current progress
- Updates TODO.md with proper status markers
- Generates changelog entries
- Creates verification checklists

## Script Dependencies

### Required npm packages
```bash
npm install better-sqlite3 glob
```

### Required Python packages
None - uses Python 3 standard library only.

## File Extensions

All scripts use `.cjs` extension (CommonJS) for consistency with Node.js require() statements.

## Database Schema

The entities database (`data/entities.db`) contains **FOnline: Ashes of Phoenix** specific data:

### entities
- **43 columns** for comprehensive entity data
- Stores parsed .fopro data with classification
- Tracks art assets, scripts, and usage
- Supports relationship mapping

### entity_types
- Pre-populated entity type definitions
- Supports the Nexus classification system

## Usage Examples

### Initialize fresh database
```bash
node scripts/create-entity-db.cjs
```

### Parse all entities
```bash
node scripts/parse-all-entities.cjs
```

### Index server data
```bash
node scripts/index-server.cjs /path/to/fonline/server
```

### Validate data integrity
```bash
python scripts/validate_index.py
python scripts/verify-index.py /path/to/server /path/to/client
```

## Common Workflows

### Complete Entity Database Setup
```bash
# 1. Create database schema
node scripts/create-entity-db.cjs

# 2. Parse all entities
node scripts/parse-all-entities.cjs

# 3. Update project status
node scripts/update-status.cjs
```

### Server Data Analysis (Ashes of Phoenix)
```bash
# 1. Index Ashes of Phoenix server files
node scripts/index-server.cjs /path/to/aop-server

# 2. Validate indexes
python scripts/validate_index.py
python scripts/verify-index.py /path/to/aop-server /path/to/aop-client
```

## Error Handling

All scripts include error handling and will:
- Display clear error messages
- Exit with appropriate error codes
- Provide suggestions for common issues

## Performance Notes

- Entity parsing processes 9,399+ entities in ~30 seconds
- Database operations use prepared statements for performance
- Index validation handles large datasets efficiently


## Troubleshooting

### Database locked errors
Ensure no other process is using the database. Close any database viewers.

### Module not found errors
Run `npm install` to install required packages.

### Permission errors
Ensure scripts have execute permissions:
```bash
chmod +x scripts/*.cjs
chmod +x scripts/*.py
```
