/**
 * Database Integrity Checker
 * Checks the entities.db for corruption and data quality issues
 */

const Database = require('better-sqlite3');

class DatabaseIntegrityChecker {
  constructor() {
    this.db = null;
  }

  async checkIntegrity() {
    try {
      console.log('🔍 Starting database integrity check...');
      
      this.db = new Database('./data/entities.db', { readonly: true });
      
      // 1. Database integrity
      console.log('\n=== Database Integrity ===');
      const integrity = this.db.prepare('PRAGMA integrity_check').get();
      console.log('Status:', integrity.integrity_check);
      
      // 2. Table structure
      console.log('\n=== Table Structure ===');
      const tableInfo = this.db.prepare('PRAGMA table_info(entities)').all();
      tableInfo.forEach(col => {
        console.log(`${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
      
      // 3. Null proto_ids
      console.log('\n=== Null Proto IDs ===');
      const nullProtos = this.db.prepare('SELECT COUNT(*) as count FROM entities WHERE proto_id IS NULL').get();
      console.log(`Null proto_ids: ${nullProtos.count}`);
      
      // 4. Duplicate proto_ids
      console.log('\n=== Duplicate Proto IDs ===');
      const duplicates = this.db.prepare(`
        SELECT proto_id, COUNT(*) as count 
        FROM entities 
        WHERE proto_id IS NOT NULL 
        GROUP BY proto_id 
        HAVING count > 1 
        ORDER BY count DESC 
        LIMIT 10
      `).all();
      
      console.log(`Duplicates found: ${duplicates.length}`);
      if (duplicates.length > 0) {
        console.log('Top duplicates:');
        duplicates.forEach(dup => {
          console.log(`  PID ${dup.proto_id}: ${dup.count} entries`);
        });
      }
      
      // 5. Data quality
      console.log('\n=== Data Quality ===');
      const total = this.db.prepare('SELECT COUNT(*) as count FROM entities').get();
      const withNames = this.db.prepare("SELECT COUNT(*) as count FROM entities WHERE name IS NOT NULL AND name != ''").get();
      const withProps = this.db.prepare("SELECT COUNT(*) as count FROM entities WHERE properties IS NOT NULL AND properties != '{}'").get();
      const withFiles = this.db.prepare("SELECT COUNT(*) as count FROM entities WHERE source_file IS NOT NULL AND source_file != ''").get();
      
      console.log(`Total entities: ${total.count}`);
      console.log(`With names: ${withNames.count} (${Math.round(withNames.count/total.count*100)}%)`);
      console.log(`With properties: ${withProps.count} (${Math.round(withProps.count/total.count*100)}%)`);
      console.log(`With source files: ${withFiles.count} (${Math.round(withFiles.count/total.count*100)}%)`);
      
      // 6. Sample data check
      console.log('\n=== Sample Data Check ===');
      const samples = this.db.prepare('SELECT proto_id, name, primary_class, source_file FROM entities LIMIT 5').all();
      samples.forEach(sample => {
        console.log(`PID ${sample.proto_id}: "${sample.name}" (${sample.primary_class}) from ${sample.source_file}`);
      });
      
      // 7. Check for corrupted JSON
      console.log('\n=== JSON Corruption Check ===');
      const badJson = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM entities 
        WHERE properties NOT LIKE '{%' OR properties NOT LIKE '%}'
      `).get();
      console.log(`Potentially corrupted JSON properties: ${badJson.count}`);
      
      // Summary
      console.log('\n=== Summary ===');
      const issues = [];
      if (nullProtos.count > 0) issues.push(`${nullProtos.count} null proto_ids`);
      if (duplicates.length > 0) issues.push(`${duplicates.length} duplicate proto_ids`);
      if (badJson.count > 0) issues.push(`${badJson.count} corrupted JSON entries`);
      
      if (issues.length === 0) {
        console.log('✅ Database appears clean and healthy!');
      } else {
        console.log('⚠️  Issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      return {
        healthy: issues.length === 0,
        totalEntities: total.count,
        issues: issues
      };
      
    } catch (error) {
      console.error('❌ Database check failed:', error.message);
      return { healthy: false, error: error.message };
    } finally {
      if (this.db) {
        this.db.close();
      }
    }
  }
}

// Main execution
async function main() {
  const checker = new DatabaseIntegrityChecker();
  const result = await checker.checkIntegrity();
  
  if (result.healthy) {
    console.log('\n🎉 Database is ready for production use!');
  } else {
    console.log('\n🚨 Database needs attention before production use.');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseIntegrityChecker;
