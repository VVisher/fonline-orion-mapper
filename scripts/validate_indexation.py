#!/usr/bin/env python3
"""
FOnline: Ashes of Phoenix Indexation Validation Script
Checks for missing entries and validates parsing completeness
"""

import os
import json
import glob
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from datetime import datetime

class IndexationValidator:
    def __init__(self, config_path: str = "scripts/aop-nightmare.cfg"):
        self.config = self.load_config(config_path)
        self.base_path = Path(self.config['paths']['server'])
        self.errors = []
        self.warnings = []
        
    def load_config(self, config_path: str) -> Dict:
        """Load configuration from CFG file"""
        config = {}
        current_section = None
        
        with open(config_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                    
                if line.startswith('[') and line.endswith(']'):
                    current_section = line[1:-1].lower()
                    config[current_section] = {}
                elif '=' in line and current_section:
                    key, value = line.split('=', 1)
                    config[current_section][key.strip()] = value.strip()
                    
        return config
    
    def check_file_exists(self, file_path: str) -> bool:
        """Check if file exists relative to base path"""
        full_path = self.base_path / file_path
        return full_path.exists()
    
    def load_json_if_exists(self, file_path: str) -> Dict:
        """Load JSON file if it exists"""
        full_path = Path("source/database") / file_path
        if full_path.exists():
            with open(full_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def validate_creatures(self):
        """Validate creature indexing"""
        print("Validating creatures...")
        
        # Check source files exist
        critter_lst = self.config['parsing']['critter_lst']
        critters_fopro = self.config['parsing']['critters_fopro']
        
        if not self.check_file_exists(critter_lst):
            self.errors.append(f"Missing critter.lst: {critter_lst}")
        
        critter_files = glob.glob(str(self.base_path / critters_fopro))
        if not critter_files:
            self.errors.append(f"No critter .fopro files found: {critters_fopro}")
        
        # Check indexed data
        indexed_critters = self.load_json_if_exists("critters.json")
        if not indexed_critters:
            self.warnings.append("No indexed critters.json found")
            return
            
        print(f"  Found {len(indexed_critters)} indexed critters")
        
    def validate_items(self):
        """Validate item indexing"""
        print("Validating items...")
        
        # Check source files exist
        items_lst = self.config['parsing']['items_lst']
        items_fopro = self.config['parsing']['items_fopro']
        
        if not self.check_file_exists(items_lst):
            self.errors.append(f"Missing items.lst: {items_lst}")
        
        item_files = glob.glob(str(self.base_path / items_fopro))
        if not item_files:
            self.errors.append(f"No item .fopro files found: {items_fopro}")
        
        # Check indexed data
        indexed_items = self.load_json_if_exists("items.json")
        if not indexed_items:
            self.warnings.append("No indexed items.json found")
            return
            
        print(f"  Found {len(indexed_items)} indexed items")
        
    def validate_objects(self):
        """Validate object dictionary"""
        print("Validating object dictionary...")
        
        # Check MSG files
        fobjc_msg = self.config['parsing']['fobjc_msg']
        fogm_msg = self.config['parsing']['fogm_msg']
        fodlg_msg = self.config['parsing']['fodlg_msg']
        fogame_msg = self.config['parsing']['fogame_msg']
        
        for msg_file in [fobjc_msg, fogm_msg, fodlg_msg, fogame_msg]:
            if not self.check_file_exists(msg_file):
                self.warnings.append(f"MSG file not found: {msg_file}")
        
        # Check indexed data
        indexed_objects = self.load_json_if_exists("objects.json")
        if not indexed_objects:
            self.warnings.append("No indexed objects.json found")
            return
            
        print(f"  Found {len(indexed_objects)} indexed objects")
        
    def validate_critters_list(self):
        """Validate NPC PIDs"""
        print("Validating NPC PIDs...")
        
        npc_pids = self.config['parsing']['npc_pids_fos']
        if not self.check_file_exists(npc_pids):
            self.warnings.append(f"NPC PIDs file not found: {npc_pids}")
        
        # Check indexed data
        indexed_pids = self.load_json_if_exists("npc_pids.json")
        if not indexed_pids:
            self.warnings.append("No indexed NPC PIDs found")
            return
            
        print(f"  Found {len(indexed_pids)} indexed NPC PIDs")
        
    def validate_maps(self):
        """Validate map configuration"""
        print("Validating maps...")
        
        map_configs = [
            self.config['parsing']['generate_world_cfg'],
            self.config['parsing']['locations_cfg'],
            self.config['parsing']['maps_fos'],
            self.config['parsing']['phx_maps_fos'],
            self.config['parsing']['worldmap_h_fos'],
            self.config['parsing']['maps_header_fos']
        ]
        
        for config_file in map_configs:
            if not self.check_file_exists(config_file):
                self.warnings.append(f"Map config not found: {config_file}")
        
        # Check indexed data
        indexed_maps = self.load_json_if_exists("maps.json")
        if not indexed_maps:
            self.warnings.append("No indexed maps found")
            return
            
        print(f"  Found {len(indexed_maps)} indexed maps")
        
    def validate_defines(self):
        """Validate overarching defines (processed LAST)"""
        print("Validating defines...")
        
        defines_fos = self.config['parsing']['defines_fos']
        if not self.check_file_exists(defines_fos):
            self.warnings.append("Defines file not found: {defines_fos}")
        
        # Check indexed data
        indexed_defines = self.load_json_if_exists("defines.json")
        if not indexed_defines:
            self.warnings.append("No indexed defines found")
            return
            
        print(f"  Found {len(indexed_defines)} indexed defines")
        
    def check_cross_references(self):
        """Check for cross-references between different data types"""
        print("Checking cross-references...")
        
        # Load all indexed data
        indexed_critters = self.load_json_if_exists("critters.json")
        indexed_items = self.load_json_if_exists("items.json")
        indexed_objects = self.load_json_if_exists("objects.json")
        indexed_pids = self.load_json_if_exists("npc_pids.json")
        indexed_maps = self.load_json_if_exists("maps.json")
        indexed_defines = self.load_json_if_exists("defines.json")
        
        # Check for orphaned references
        all_proto_ids = set()
        for data in [indexed_critters, indexed_items, indexed_objects]:
            for item in data:
                if 'proto_id' in item:
                    all_proto_ids.add(item['proto_id'])
        
        # Check script references
        script_references = set()
        for data in [indexed_critters, indexed_items, indexed_objects]:
            for item in data:
                if 'script_name' in item and item['script_name']:
                    script_references.add(item['script_name'])
        
        # Check for missing defines
        defined_constants = set()
        for data in indexed_defines:
            if 'define_name' in data:
                defined_constants.add(data['define_name'])
        
        # Report issues
        orphaned_count = len(all_proto_ids) - len(script_references)
        if orphaned_count > 0:
            self.warnings.append(f"{orphaned_count} entities have no script references")
        
        undefined_count = len(script_references) - len(defined_constants)
        if undefined_count > 0:
            self.warnings.append(f"{undefined_count} script references not found in defines")
        
        print("  Cross-reference validation complete")
        
    def generate_report(self):
        """Generate validation report"""
        print("\n" + "="*60)
        print("VALIDATION REPORT")
        print("="*60)
        print(f"Base Path: {self.base_path}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Errors: {len(self.errors)}")
        print(f"Warnings: {len(self.warnings)}")
        
        if self.errors:
            print("\nERRORS:")
            for error in self.errors:
                print(f"  {error}")
        
        if self.warnings:
            print("\nWARNINGS:")
            for warning in self.warnings:
                print(f"  {warning}")
        
        if not self.errors and not self.warnings:
            print("\nAll validations passed!")
        
        print("="*60)
        print("  - Run this script after any parsing updates")
        
        return len(self.errors) == 0

def main():
    validator = IndexationValidator()
    
    print("Starting FOnline: Ashes of Phoenix indexation validation...")
    print(f"Base path: {validator.base_path}")
    
    # Run all validations
    validator.validate_creatures()
    validator.validate_items()
    validator.validate_objects()
    validator.validate_critters_list()
    validator.validate_maps()
    validator.validate_defines()
    validator.check_cross_references()
    
    # Generate report
    success = validator.generate_report()
    
    exit(0 if success else 1)

if __name__ == "__main__":
    main()
