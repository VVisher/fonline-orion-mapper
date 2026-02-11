#!/usr/bin/env python3
"""
FOnline Index Validation Script
Validates the completeness and accuracy of the indexed FOnline data.
Checks for missing entries, duplicates, and orphaned references.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

class IndexValidator:
    def __init__(self, index_file: str = "fonline-index.json"):
        self.index_file = Path(index_file)
        self.index = {}
        self.issues = {
            "missing_creatures": [],
            "missing_items": [],
            "missing_objects": [],
            "missing_maps": [],
            "missing_defines": [],
            "duplicate_pids": [],
            "orphaned_references": [],
            "incomplete_objects": [],
            "unreferenced_defines": []
        }
        
    def load_index(self) -> bool:
        """Load the index file"""
        try:
            with open(self.index_file, 'r', encoding='utf-8') as f:
                self.index = json.load(f)
            print(f"✅ Loaded index from {self.index_file}")
            return True
        except FileNotFoundError:
            print(f"❌ Index file not found: {self.index_file}")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in index file: {e}")
            return False
    
    def validate_creatures(self):
        """Validate creature entries"""
        print("\n🔍 Validating creatures...")
        
        creatures = self.index.get('creatures', {})
        references = self.index.get('references', {})
        
        # Check for missing names
        for pid, creature in creatures.items():
            if not creature.get('name'):
                self.issues["missing_creatures"].append({
                    "pid": pid,
                    "file": creature.get('file', 'unknown')
                })
        
        # Check for PIDs referenced in scripts but not in index
        script_creatures = self._find_script_creatures()
        for pid in script_creatures:
            if str(pid) not in creatures:
                self.issues["missing_creatures"].append({
                    "pid": pid,
                    "source": "script_reference",
                    "file": "_npc_pids.fos"
                })
        
        print(f"  Found {len(creatures)} creatures")
        print(f"  Issues: {len(self.issues['missing_creatures'])}")
    
    def validate_items(self):
        """Validate item entries"""
        print("\n🔍 Validating items...")
        
        items = self.index.get('items', {})
        
        # Check for missing names
        for pid, item in items.items():
            if not item.get('name'):
                self.issues["missing_items"].append({
                    "pid": pid,
                    "file": item.get('file', 'unknown')
                })
        
        print(f"  Found {len(items)} items")
        print(f"  Issues: {len(self.issues['missing_items'])}")
    
    def validate_objects(self):
        """Validate object entries"""
        print("\n🔍 Validating objects...")
        
        objects = self.index.get('objects', {})
        
        # Check for incomplete objects
        for pid, obj in objects.items():
            issues = []
            if not obj.get('hasName'):
                issues.append("missing_name")
            if not obj.get('hasDescription'):
                issues.append("missing_description")
            
            if issues:
                self.issues["incomplete_objects"].append({
                    "pid": pid,
                    "issues": issues
                })
        
        print(f"  Found {len(objects)} objects")
        print(f"  Incomplete: {len(self.issues['incomplete_objects'])}")
    
    def validate_maps(self):
        """Validate map entries"""
        print("\n🔍 Validating maps...")
        
        maps = self.index.get('maps', {})
        
        # Check for missing map files
        for map_id, map_info in maps.items():
            source = map_info.get('source', 'unknown')
            data = map_info.get('data', '')
            
            if not data:
                self.issues["missing_maps"].append({
                    "id": map_id,
                    "source": source
                })
        
        print(f"  Found {len(maps)} map entries")
        print(f"  Issues: {len(self.issues['missing_maps'])}")
    
    def validate_defines(self):
        """Validate global defines"""
        print("\n🔍 Validating defines...")
        
        defines = self.index.get('defines', {})
        references = self.index.get('references', {})
        
        # Check for duplicate PIDs in defines
        pid_defines = {}
        for name, value in defines.items():
            if value.isdigit():
                pid = int(value)
                if pid in pid_defines:
                    self.issues["duplicate_pids"].append({
                        "pid": pid,
                        "existing": pid_defines[pid],
                        "duplicate": name
                    })
                else:
                    pid_defines[pid] = name
        
        print(f"  Found {len(defines)} defines")
        print(f"  Issues: {len(self.issues['duplicate_pids'])}")
    
    def check_duplicate_pids(self):
        """Check for duplicate PIDs across different types"""
        print("\n🔍 Checking for duplicate PIDs...")
        
        creatures = self.index.get('creatures', {})
        items = self.index.get('items', {})
        objects = self.index.get('objects', {})
        
        pid_map = {}
        
        # Check creatures
        for pid, creature in creatures.items():
            if pid in pid_map:
                self.issues["duplicate_pids"].append({
                    "pid": pid,
                    "existing": pid_map[pid],
                    "duplicate": {"type": "creature", "name": creature.get('name')}
                })
            else:
                pid_map[pid] = {"type": "creature", "name": creature.get('name')}
        
        # Check items
        for pid, item in items.items():
            if pid in pid_map:
                self.issues["duplicate_pids"].append({
                    "pid": pid,
                    "existing": pid_map[pid],
                    "duplicate": {"type": "item", "name": item.get('name')}
                })
            else:
                pid_map[pid] = {"type": "item", "name": item.get('name')}
        
        print(f"  Checked {len(creatures)} creatures, {len(items)} items")
        print(f"  Duplicates: {len(self.issues['duplicate_pids'])}")
    
    def check_orphaned_references(self):
        """Check for references that don't exist in the index"""
        print("\n🔍 Checking for orphaned references...")
        
        # This would require parsing the actual game files
        # For now, just check the references section in the index
        references = self.index.get('references', {})
        
        if 'missingNames' in references:
            self.issues["orphaned_references"].extend(references['missingNames'])
        
        if 'missingDescriptions' in references:
            self.issues["orphaned_references"].extend(references['missingDescriptions'])
        
        print(f"  Orphaned references: {len(self.issues['orphaned_references'])}")
    
    def _find_script_creatures(self) -> Set[int]:
        """Find creature PIDs referenced in scripts"""
        script_creatures = set()
        
        # This would require parsing the actual script files
        # For now, return empty set
        return script_creatures
    
    def generate_report(self) -> str:
        """Generate a detailed validation report"""
        report = []
        report.append("=" * 60)
        report.append("FONLINE INDEX VALIDATION REPORT")
        report.append("=" * 60)
        report.append("")
        
        # Summary
        total_issues = sum(len(issues) for issues in self.issues.values())
        report.append(f"Total Issues Found: {total_issues}")
        report.append("")
        
        # Detailed issues
        for issue_type, issues in self.issues.items():
            if issues:
                report.append(f"\n{issue_type.upper().replace('_', ' ')} ({len(issues)}):")
                for issue in issues[:10]:  # Show first 10
                    if isinstance(issue, dict):
                        report.append(f"  - PID {issue.get('pid', 'N/A')}: {issue}")
                    else:
                        report.append(f"  - {issue}")
                
                if len(issues) > 10:
                    report.append(f"  ... and {len(issues) - 10} more")
        
        # Statistics
        report.append("\n" + "=" * 60)
        report.append("STATISTICS")
        report.append("=" * 60)
        
        creatures = self.index.get('creatures', {})
        items = self.index.get('items', {})
        objects = self.index.get('objects', {})
        maps = self.index.get('maps', {})
        defines = self.index.get('defines', {})
        
        report.append(f"Creatures: {len(creatures)}")
        report.append(f"Items: {len(items)}")
        report.append(f"Objects: {len(objects)}")
        report.append(f"Maps: {len(maps)}")
        report.append(f"Defines: {len(defines)}")
        
        # Quality metrics
        complete_objects = sum(1 for obj in objects.values() if obj.get('hasName') and obj.get('hasDescription'))
        object_completion = (complete_objects / len(objects) * 100) if objects else 0
        
        report.append(f"\nObject Completion: {object_completion:.1f}%")
        report.append(f"Complete Objects: {complete_objects}/{len(objects)}")
        
        return "\n".join(report)
    
    def save_report(self, filename: str = "validation_report.txt"):
        """Save validation report to file"""
        report = self.generate_report()
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"📄 Report saved to {filename}")
    
    def run_validation(self) -> bool:
        """Run complete validation"""
        print("🚀 Starting FOnline index validation...")
        
        if not self.load_index():
            return False
        
        self.validate_creatures()
        self.validate_items()
        self.validate_objects()
        self.validate_maps()
        self.validate_defines()
        self.check_duplicate_pids()
        self.check_orphaned_references()
        
        # Generate and save report
        self.save_report()
        
        # Print summary
        total_issues = sum(len(issues) for issues in self.issues.values())
        if total_issues == 0:
            print("\n🎉 Validation passed! No issues found.")
            return True
        else:
            print(f"\n⚠️ Validation completed with {total_issues} issues.")
            return False

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate FOnline data index")
    parser.add_argument("--index", default="fonline-index.json", help="Path to index file")
    parser.add_argument("--report", default="validation_report.txt", help="Path to report file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    validator = IndexValidator(args.index)
    success = validator.run_validation()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
