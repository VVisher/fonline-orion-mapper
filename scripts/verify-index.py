#!/usr/bin/env python3
"""
verify-index.py — Check the generated JSON indexes in source/database/
against the actual source files for missing entries.

Usage:
    python scripts/verify-index.py <serverPath> <clientPath>

Checks:
    1. tiles.json vs actual files in <clientPath>/data/art/tiles/
    2. critters.json vs critter.lst + proto/critters/*.fopro
    3. items.json vs items.lst + proto/items/*.fopro
    4. objects.json vs FOOBJ.MSG entries
    5. defines.json vs _defines.fos
"""

import json
import os
import re
import sys
from pathlib import Path

DB_DIR = Path("source/database")

RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def load_json(name):
    p = DB_DIR / name
    if not p.exists():
        print(f"{RED}[MISSING]{RESET} {p} not found — run indexer first.")
        return None
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def check_tiles(client_path):
    print(f"\n{'='*50}")
    print("TILES CHECK")
    print(f"{'='*50}")

    index = load_json("tiles.json")
    if not index:
        return

    tiles_dir = Path(client_path) / "data" / "art" / "tiles"
    if not tiles_dir.exists():
        print(f"{RED}[ERROR]{RESET} Tiles directory not found: {tiles_dir}")
        return

    actual = set()
    for f in tiles_dir.iterdir():
        if f.suffix.lower() in (".frm", ".png", ".bmp", ".fofrm"):
            actual.add(f"art\\tiles\\{f.name}")

    indexed = set(index.get("all", []))

    missing_from_index = actual - indexed
    extra_in_index = indexed - actual

    print(f"  Actual files:  {len(actual)}")
    print(f"  Indexed files: {len(indexed)}")

    if missing_from_index:
        print(f"  {YELLOW}[WARN]{RESET} {len(missing_from_index)} files on disk but NOT in index:")
        for f in sorted(missing_from_index)[:20]:
            print(f"    - {f}")
        if len(missing_from_index) > 20:
            print(f"    ... and {len(missing_from_index) - 20} more")
    else:
        print(f"  {GREEN}[OK]{RESET} All disk files are indexed.")

    if extra_in_index:
        print(f"  {YELLOW}[WARN]{RESET} {len(extra_in_index)} entries in index but NOT on disk:")
        for f in sorted(extra_in_index)[:20]:
            print(f"    - {f}")
    else:
        print(f"  {GREEN}[OK]{RESET} No stale index entries.")


def check_critters(server_path):
    print(f"\n{'='*50}")
    print("CRITTERS CHECK")
    print(f"{'='*50}")

    index = load_json("critters.json")
    if not index:
        return

    lst_path = Path(server_path) / "proto" / "critter.lst"
    if not lst_path.exists():
        print(f"{RED}[ERROR]{RESET} critter.lst not found: {lst_path}")
        return

    with open(lst_path, "r", encoding="utf-8") as f:
        lst_lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]

    indexed_pids = {e["pid"] for e in index.get("entries", [])}
    print(f"  critter.lst entries: {len(lst_lines)}")
    print(f"  Indexed entries:     {len(indexed_pids)}")

    # Check for .fopro files that exist but aren't indexed
    proto_dir = Path(server_path) / "proto" / "critters"
    if proto_dir.exists():
        actual_protos = {f.name for f in proto_dir.iterdir() if f.suffix == ".fopro"}
        indexed_files = {e["file"] for e in index.get("entries", []) if e.get("file")}
        missing = actual_protos - indexed_files
        if missing:
            print(f"  {YELLOW}[WARN]{RESET} {len(missing)} .fopro files not in index:")
            for f in sorted(missing)[:10]:
                print(f"    - {f}")
        else:
            print(f"  {GREEN}[OK]{RESET} All .fopro files indexed.")

    # Check for entries without parsed props
    no_props = [e for e in index.get("entries", []) if not e.get("props")]
    if no_props:
        print(f"  {YELLOW}[WARN]{RESET} {len(no_props)} entries have no parsed properties (file missing?)")
    else:
        print(f"  {GREEN}[OK]{RESET} All entries have properties.")


def check_items(server_path):
    print(f"\n{'='*50}")
    print("ITEMS CHECK")
    print(f"{'='*50}")

    index = load_json("items.json")
    if not index:
        return

    lst_path = Path(server_path) / "proto" / "items.lst"
    if not lst_path.exists():
        print(f"{RED}[ERROR]{RESET} items.lst not found: {lst_path}")
        return

    with open(lst_path, "r", encoding="utf-8") as f:
        lst_lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]

    indexed_pids = {e["pid"] for e in index.get("entries", [])}
    print(f"  items.lst entries: {len(lst_lines)}")
    print(f"  Indexed entries:   {len(indexed_pids)}")

    proto_dir = Path(server_path) / "proto" / "items"
    if proto_dir.exists():
        actual_protos = {f.name for f in proto_dir.iterdir() if f.suffix == ".fopro"}
        indexed_files = {e["file"] for e in index.get("entries", []) if e.get("file")}
        missing = actual_protos - indexed_files
        if missing:
            print(f"  {YELLOW}[WARN]{RESET} {len(missing)} .fopro files not in index:")
            for f in sorted(missing)[:10]:
                print(f"    - {f}")
        else:
            print(f"  {GREEN}[OK]{RESET} All .fopro files indexed.")

    no_props = [e for e in index.get("entries", []) if not e.get("props")]
    if no_props:
        print(f"  {YELLOW}[WARN]{RESET} {len(no_props)} entries have no parsed properties")
    else:
        print(f"  {GREEN}[OK]{RESET} All entries have properties.")


def check_objects(server_path):
    print(f"\n{'='*50}")
    print("OBJECTS (FOOBJ.MSG) CHECK")
    print(f"{'='*50}")

    index = load_json("objects.json")
    if not index:
        return

    msg_path = Path(server_path) / "text" / "engl" / "FOOBJ.MSG"
    if not msg_path.exists():
        print(f"{RED}[ERROR]{RESET} FOOBJ.MSG not found: {msg_path}")
        return

    with open(msg_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Count unique PIDs in MSG file
    actual_pids = set()
    for m in re.finditer(r"\{(\d+)\}\{(\d+)\}", content):
        pid = int(m.group(1)) // 100
        actual_pids.add(pid)

    indexed_pids = set(int(k) for k in index.get("entries", {}).keys())
    print(f"  FOOBJ.MSG PIDs: {len(actual_pids)}")
    print(f"  Indexed PIDs:   {len(indexed_pids)}")

    missing = actual_pids - indexed_pids
    if missing:
        print(f"  {YELLOW}[WARN]{RESET} {len(missing)} PIDs in MSG but not in index")
    else:
        print(f"  {GREEN}[OK]{RESET} All MSG PIDs indexed.")

    # Check for entries without names
    no_name = [pid for pid, data in index.get("entries", {}).items() if not data.get("name")]
    if no_name:
        print(f"  {YELLOW}[INFO]{RESET} {len(no_name)} PIDs have no name string")


def check_defines(server_path):
    print(f"\n{'='*50}")
    print("DEFINES CHECK")
    print(f"{'='*50}")

    index = load_json("defines.json")
    if not index:
        return

    defines_path = Path(server_path) / "scripts" / "_defines.fos"
    if not defines_path.exists():
        print(f"{RED}[ERROR]{RESET} _defines.fos not found: {defines_path}")
        return

    with open(defines_path, "r", encoding="utf-8") as f:
        content = f.read()

    actual = set(re.findall(r"^#define\s+(\w+)", content, re.MULTILINE))
    indexed = set(index.get("defines", {}).keys())

    print(f"  _defines.fos #defines: {len(actual)}")
    print(f"  Indexed defines:       {len(indexed)}")

    # Only check PID-related defines
    pid_actual = {d for d in actual if d.startswith("PID_")}
    pid_indexed = {d for d in indexed if d.startswith("PID_")}
    missing_pids = pid_actual - pid_indexed
    if missing_pids:
        print(f"  {YELLOW}[WARN]{RESET} {len(missing_pids)} PID_ defines not indexed:")
        for d in sorted(missing_pids)[:10]:
            print(f"    - {d}")
    else:
        print(f"  {GREEN}[OK]{RESET} All PID_ defines indexed.")


def main():
    if len(sys.argv) < 3:
        print("Usage: python scripts/verify-index.py <serverPath> <clientPath>")
        sys.exit(1)

    server_path = sys.argv[1]
    client_path = sys.argv[2]

    if not DB_DIR.exists():
        print(f"{RED}[ERROR]{RESET} {DB_DIR} not found. Run indexer scripts first.")
        sys.exit(1)

    print(f"Server: {server_path}")
    print(f"Client: {client_path}")
    print(f"DB Dir: {DB_DIR}")

    check_tiles(client_path)
    check_critters(server_path)
    check_items(server_path)
    check_objects(server_path)
    check_defines(server_path)

    print(f"\n{'='*50}")
    print(f"{GREEN}Verification complete.{RESET}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
