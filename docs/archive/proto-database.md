# Proto Database Schema

**Reference**: STATUS.md Phase 3.2 - Database Schema Design  
**Created**: 2026-02-10  
**Purpose**: Define database structure for proto storage and retrieval

---

## 🗄️ **Database Schema**

### **Main Proto Table**

```sql
CREATE TABLE protos (
  proto_id INTEGER PRIMARY KEY,
  type INTEGER NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  pic_map TEXT,
  pic_inv TEXT,
  flags INTEGER DEFAULT 0,
  collision BOOLEAN DEFAULT FALSE,
  interactive BOOLEAN DEFAULT FALSE,
  description TEXT,
  tags TEXT,  -- JSON array
  source_file TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_protos_type ON protos(type);
CREATE INDEX idx_protos_category ON protos(category);
CREATE INDEX idx_protos_name ON protos(name);
CREATE INDEX idx_protos_collision ON protos(collision);
CREATE INDEX idx_protos_interactive ON protos(interactive);
```

### **Type Reference Table**

```sql
CREATE TABLE proto_types (
  type_id INTEGER PRIMARY KEY,
  type_name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- Insert standard FOnline types
INSERT INTO proto_types (type_id, type_name, description) VALUES
(0, 'Critter', 'Character and NPC prototypes'),
(1, 'Item', 'Item prototypes'),
(2, 'Scenery', 'Scenery objects'),
(3, 'Wall', 'Wall and barrier objects'),
(4, 'Door', 'Door objects'),
(5, 'Grid', 'Grid-based objects'),
(6, 'Misc', 'Miscellaneous objects');
```

### **Category Reference Table**

```sql
CREATE TABLE categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT NOT NULL UNIQUE,
  parent_category TEXT,
  description TEXT
);

-- Insert common categories
INSERT INTO categories (category_name, description) VALUES
('Weapon', 'Weapons and ammunition'),
('Armor', 'Protective equipment'),
('Container', 'Storage containers'),
('Food', 'Consumable items'),
('Medicine', 'Medical supplies'),
('Misc', 'Miscellaneous items'),
('Test', 'Testing prototypes');
```

---

## 🔍 **Query Patterns**

### **Common Queries**

```sql
-- Get all items of a specific type
SELECT * FROM protos WHERE type = 1 ORDER BY name;

-- Get all interactive objects
SELECT * FROM protos WHERE interactive = TRUE;

-- Get protos by category
SELECT * FROM protos WHERE category = 'Weapon' ORDER BY name;

-- Search protos by name
SELECT * FROM protos WHERE name LIKE '%search_term%' ORDER BY name;

-- Get proto statistics
SELECT 
  type,
  COUNT(*) as count,
  type_name
FROM protos 
JOIN proto_types ON protos.type = proto_types.type_id
GROUP BY type;
```

### **Advanced Queries**

```sql
-- Get protos with tags (JSON search)
SELECT * FROM protos 
WHERE json_extract(tags, '$') LIKE '%weapon%';

-- Get collision objects by type
SELECT 
  type_name,
  COUNT(*) as collision_count
FROM protos 
JOIN proto_types ON protos.type = proto_types.type_id
WHERE collision = TRUE
GROUP BY type;

-- Full-text search
SELECT * FROM protos 
WHERE name LIKE '%term%' 
   OR description LIKE '%term%'
   OR category LIKE '%term%';
```

---

## 📊 **Performance Considerations**

### **Indexing Strategy**
- **Primary Key**: `proto_id` (auto-indexed)
- **Foreign Keys**: `type` references `proto_types`
- **Search Indexes**: `name`, `category`, `collision`, `interactive`
- **Composite Indexes**: `(type, category)` for common filters

### **Query Optimization**
- Use `LIMIT` for pagination
- Prefer specific type filters over full table scans
- Use `EXPLAIN QUERY PLAN` to analyze slow queries
- Consider FTS (Full-Text Search) for name/description searches

---

## 🔧 **Database Operations**

### **CRUD Operations**

```sql
-- Create
INSERT INTO protos (proto_id, type, name, category, description)
VALUES (1001, 1, 'New Item', 'Weapon', 'A new weapon item');

-- Read
SELECT * FROM protos WHERE proto_id = 1001;

-- Update
UPDATE protos 
SET name = 'Updated Item', description = 'Updated description'
WHERE proto_id = 1001;

-- Delete
DELETE FROM protos WHERE proto_id = 1001;
```

### **Batch Operations**

```sql
-- Bulk insert from JSON
INSERT INTO protos (proto_id, type, name, category, description)
VALUES 
  (1002, 1, 'Item 1', 'Weapon', 'First weapon'),
  (1003, 1, 'Item 2', 'Armor', 'First armor'),
  (1004, 2, 'Scenery 1', 'Decoration', 'First scenery');

-- Batch update
UPDATE protos 
SET updated_at = CURRENT_TIMESTAMP 
WHERE category = 'Weapon';
```

---

## 🚀 **Implementation Notes**

### **SQLite Integration**
- Use `better-sqlite3` package for Node.js
- Enable WAL mode for better concurrency
- Use prepared statements for performance
- Implement connection pooling for web usage

### **Data Migration**
- Import from `data/all-protos.json`
- Validate data integrity during import
- Handle duplicate proto IDs gracefully
- Create backup before major migrations

### **Error Handling**
- Validate foreign key constraints
- Handle JSON parsing errors in tags
- Implement retry logic for database operations
- Log all database errors for debugging

---

## 📈 **Acceptance Criteria**

✅ **Schema Complete**: All tables and indexes created  
✅ **Data Import**: Successfully import from JSON  
✅ **Query Performance**: <100ms for common queries  
✅ **Data Integrity**: Foreign key constraints enforced  
✅ **Error Handling**: Graceful failure recovery  
✅ **Documentation**: Complete API reference  

---

## 🔄 **Next Steps**

1. **Create database builder script** (`scripts/build-proto-db.js`)
2. **Implement data import from JSON**
3. **Create database manager class**
4. **Add query interface for UI components**
5. **Implement database testing suite**

---

**Status**: ✅ **DESIGN COMPLETE**  
**Ready for Implementation**: Phase 3.2.1 - Database Builder Script
