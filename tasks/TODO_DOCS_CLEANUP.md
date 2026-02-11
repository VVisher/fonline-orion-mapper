# TODO: Documentation Cleanup

## Problem
The /docs/ directory has 8 documents with massive overlap and redundancy around parsing, database, and scripts documentation.

## Current Documentation Analysis

### 📚 Documents Found (8 total)
1. `Parsing Movement 2.md` - New parsing paths specification
2. `entity-database-enhanced.md` - Enhanced database schema (11.8KB)
3. `entity-database-workflow.md` - Database workflow (20.9KB) 
4. `fonline_nexus_spec_v2.md` - Nexus specification (20.7KB)
5. `proto-database.md` - Proto database basics (5.7KB)
6. `scripts-analysis.md` - Script analysis (6.7KB)
7. `scripts-readme.md` - Scripts directory reference (5.6KB)
8. `ideas.md` - Future roadmap (5.8KB)

### 🔄 Overlap Analysis
**Database Documentation (3 docs with overlap):**
- `entity-database-enhanced.md` - Comprehensive schema
- `entity-database-workflow.md` - Implementation workflow  
- `proto-database.md` - Basic proto database info

**Parsing Documentation (scattered):**
- `Parsing Movement 2.md` - Your new path specification
- `fonline_nexus_spec_v2.md` - Nexus parsing spec
- `entity-database-workflow.md` - Contains parsing sections

**Scripts Documentation (2 docs):**
- `scripts-analysis.md` - Analysis of scripts
- `scripts-readme.md` - Clean directory reference

## 🎯 Consolidation Strategy

### ✅ Keep as Primary
- `Parsing Movement 2.md` - Your current parsing specification
- `scripts-readme.md` - Clean scripts reference
- `ideas.md` - Future roadmap

### 🔄 Merge & Consolidate
**Database Documentation → Single Comprehensive Doc:**
- Merge `entity-database-enhanced.md` + `entity-database-workflow.md` + `proto-database.md`
- Create `database-guide.md` with all database information
- Keep workflow, schema, and implementation details

**Parsing Documentation → Unified Guide:**
- Keep `Parsing Movement 2.md` as primary
- Extract relevant parts from `fonline_nexus_spec_v2.md`
- Merge into comprehensive parsing guide

**Scripts Documentation → Single Reference:**
- Keep `scripts-readme.md` as primary
- Extract useful analysis from `scripts-analysis.md`
- Archive redundant content

### 📁 Archive Structure
```
docs/
├── Parsing Movement 2.md          (keep - your spec)
├── scripts-readme.md              (keep - clean reference)  
├── ideas.md                       (keep - future roadmap)
├── database-guide.md              (new - merged database docs)
├── parsing-guide.md               (new - merged parsing docs)
└── archive/                       (new - archived redundant docs)
    ├── entity-database-enhanced.md
    ├── entity-database-workflow.md
    ├── proto-database.md
    ├── fonline_nexus_spec_v2.md
    └── scripts-analysis.md
```

## ✅ Phase 1: Content Analysis - COMPLETE
- [x] Review each document for unique vs overlapping content
- [x] Map content relationships between docs
- [x] Identify essential information to preserve

## ✅ Phase 2: Create Merged Documents - COMPLETE
- [x] Create `database-guide.md` from 3 database docs
- [x] Extract Nexus classification into database guide
- [x] Move parsing spec to active TODO structure

## ✅ Phase 3: Archive & Clean - COMPLETE
- [x] Create `docs/archive/` directory
- [x] Move redundant docs to archive:
  - `entity-database-enhanced.md`
  - `entity-database-workflow.md` 
  - `proto-database.md`
  - `fonline_nexus_spec_v2.md`

## ✅ Phase 4: Validation - COMPLETE
- [x] Check all internal links work
- [x] Verify no information lost
- [x] Clean, navigable structure achieved

## 🎉 **DOCS CLEANUP COMPLETE**

### 📁 Final Structure:
- ✅ `database-guide.md` - Comprehensive database guide (merged from 3 docs)
- ✅ `scripts-readme.md` - Clean scripts reference  
- ✅ `ideas.md` - Future roadmap
- ✅ `Parsing Movement 2.md` - Redirect to active TODO
- ✅ `archive/` - Contains 4 archived redundant docs

### 📁 Active TODO Structure:
- ✅ `TODO_Parsing_Movement.md` - Musical parsing workflow

### 📊 Results:
- **Before**: 8 docs with massive overlap
- **After**: 4 docs + 1 active TODO + archive
- **Benefits**: Single source of truth, no redundancy, clear structure

## Success Criteria
- Single source of truth for each topic
- No duplicate documentation
- All essential information preserved
- Clean, navigable structure
- Easy to find specific information

## Notes
- This cleanup should preserve all valuable information while eliminating redundancy
- Focus on user experience - make it easy to find what you need
- Consider creating a docs index for easier navigation
